import { createClerkClient } from "https://esm.sh/@clerk/backend@1";
import { createRemoteJWKSet, jwtVerify } from "https://deno.land/x/jose@v5.2.0/index.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  buildAutomationGuidance,
  fetchAutomation,
  fetchPersona,
  fetchPolicies,
  resolveSupabaseUserId,
} from "../_shared/agent-context.ts";
import { AutomationAction, executeAutomationActions } from "../_shared/automation-actions.ts";
import { buildOrderSummary, resolveOrderContext } from "../_shared/shopify.ts";
import { PERSONA_REPLY_JSON_SCHEMA } from "../_shared/openai-schema.ts";
import { buildMailPrompt } from "../_shared/prompt.ts";
import { classifyEmail } from "../_shared/classify-email.ts";

/**
 * Gmail Create Draft AI
 * ---------------------
 * Edge function der henter en Gmail-besked, kører AI for at generere et
 * udkast (baseret på persona, automation-regler og ordre-kontekst) og
 * opretter et draft i brugerens Gmail via Gmail API.
 *
 * Flowet:
 * - Valider auth / intern caller
 * - Hent supabase context (persona, automation, policies)
 * - Hent besked fra Gmail
 * - Reslover ordrer og produktkontekst
 * - Kald OpenAI for at generere reply + handlinger
 * - Opret draft i Gmail og returner metadata
 */

const GMAIL_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";
const SHOPIFY_ORDERS_FN = "/functions/v1/shopify-orders";
const EDGE_DEBUG_LOGS = Deno.env.get("EDGE_DEBUG_LOGS") === "true";
// Lille helper så vi kan slå debug-logning til/fra uden at ændre resten af koden - Det brugte meget data i supabase
const emitDebugLog = (...args: Array<unknown>) => {
  if (EDGE_DEBUG_LOGS) {
    console.log(...args);
  }
};

const CLERK_SECRET_KEY = Deno.env.get("CLERK_SECRET_KEY");
const CLERK_JWT_ISSUER = Deno.env.get("CLERK_JWT_ISSUER");
const PROJECT_URL = Deno.env.get("PROJECT_URL") ?? Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY =
  Deno.env.get("SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const OPENAI_MODEL = Deno.env.get("OPENAI_MODEL") ?? "gpt-4o-mini";
const SHOPIFY_TOKEN_KEY = Deno.env.get("SHOPIFY_TOKEN_KEY");
const SHOPIFY_API_VERSION = Deno.env.get("SHOPIFY_API_VERSION") ?? "2024-07";
const INTERNAL_AGENT_SECRET = Deno.env.get("INTERNAL_AGENT_SECRET");
const OPENAI_EMBEDDING_MODEL = Deno.env.get("OPENAI_EMBEDDING_MODEL") ?? "text-embedding-3-small";

if (!CLERK_SECRET_KEY) console.warn("CLERK_SECRET_KEY mangler (Supabase secret).");
if (!CLERK_JWT_ISSUER) console.warn("CLERK_JWT_ISSUER mangler (Supabase secret).");
if (!PROJECT_URL) console.warn("PROJECT_URL mangler – kan ikke kalde interne functions.");
if (!SERVICE_ROLE_KEY)
  console.warn("SERVICE_ROLE_KEY mangler – gmail-create-draft-ai kan ikke læse Supabase tabeller.");
if (!OPENAI_API_KEY) console.warn("OPENAI_API_KEY mangler – AI udkast vil kun bruge fallback.");
if (!Deno.env.get("OPENAI_MODEL")) console.warn("OPENAI_MODEL mangler – bruger default gpt-4o-mini.");
if (!SHOPIFY_TOKEN_KEY)
  console.warn("SHOPIFY_TOKEN_KEY mangler – direkte Shopify-opslag fra interne kald er slået fra.");
if (!INTERNAL_AGENT_SECRET)
  console.warn("INTERNAL_AGENT_SECRET mangler – interne automatiske kald er ikke sikret.");

const clerk = createClerkClient({ secretKey: CLERK_SECRET_KEY! });
const JWKS = CLERK_JWT_ISSUER
  ? createRemoteJWKSet(new URL(`${CLERK_JWT_ISSUER.replace(/\/$/, "")}/.well-known/jwks.json`))
  : null;
const supabase =
  PROJECT_URL && SERVICE_ROLE_KEY ? createClient(PROJECT_URL, SERVICE_ROLE_KEY) : null;

type OpenAIResult = {
  reply: string | null;
  actions: AutomationAction[];
};

// Laver embeddings så vi kan matche produkter mod mailindholdet
async function embedText(input: string): Promise<number[]> {
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY missing");
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_EMBEDDING_MODEL,
      input,
    }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(json?.error?.message || `OpenAI embedding error ${res.status}`);
  }
  const vector = json?.data?.[0]?.embedding;
  if (!Array.isArray(vector)) throw new Error("OpenAI embedding missing");
  return vector;
}

// Henter produktbeskrivelser fra Supabase via vector search for mere kontekst
async function fetchProductContext(
  supabaseClient: ReturnType<typeof createClient> | null,
  userId: string | null,
  text: string,
) {
  if (!supabaseClient || !userId || !text?.trim()) return "";
  try {
    const embedding = await embedText(text.slice(0, 4000));
    const { data, error } = await supabaseClient.rpc("match_products", {
      query_embedding: embedding,
      match_threshold: 0.2,
      match_count: 5,
      filter_shop_id: userId,
    });
    if (error || !Array.isArray(data) || !data.length) return "";
    return data
      .map((item: any) => {
        const price = item?.price ? `Price: ${item.price}.` : "";
        return `Product: ${item?.title ?? "Unknown"}. ${price} Details: ${item?.description ?? ""}`;
      })
      .join("\n");
  } catch (err) {
    console.warn("gmail-create-draft-ai: product context failed", err);
    return "";
  }
}

// Udtrækker Clerk bearer token fra headers
function getBearerToken(req: Request): string {
  const header = req.headers.get("authorization") ?? req.headers.get("Authorization") ?? "";
  const match = String(header).match(/^Bearer\s+(.+)$/i);
  if (!match) throw Object.assign(new Error("Missing Clerk session token"), { status: 401 });
  return match[1];
}

// Tillader gmail-poll at kalde funktionen uden Clerk-session via delt secret
function isInternalAutomationRequest(req: Request): boolean {
  if (!INTERNAL_AGENT_SECRET) return false;
  const candidate =
    req.headers.get("x-internal-secret") ??
    req.headers.get("X-Internal-Secret") ??
    req.headers.get("x-automation-secret") ??
    req.headers.get("X-Automation-Secret");
  return candidate === INTERNAL_AGENT_SECRET;
}

// Parse JSON-body men returner tomt objekt ved fejl
async function readJsonBody(req: Request) {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

// Verificerer Clerk JWT og returnerer userId (sub)
async function requireUserIdFromJWT(req: Request): Promise<string> {
  if (!JWKS || !CLERK_JWT_ISSUER) {
    throw Object.assign(new Error("JWT verify ikke konfigureret (CLERK_JWT_ISSUER mangler)"), { status: 500 });
  }
  const token = getBearerToken(req);
  const { payload } = await jwtVerify(token, JWKS, { issuer: CLERK_JWT_ISSUER });
  const userId = payload?.sub;
  if (!userId || typeof userId !== "string") {
    throw Object.assign(new Error("Ugyldigt token: mangler user id"), { status: 401 });
  }
  return userId;
}

// Henter eller fornyer gmail.send token fra Clerk
async function getGmailAccessToken(userId: string): Promise<string> {
  const tokens = await clerk.users.getUserOauthAccessToken(userId, "oauth_google");
  let accessToken = tokens?.data?.[0]?.token ?? null;

  if (!accessToken) {
    await clerk.users.refreshUserOauthAccessToken(userId, "oauth_google");
    const refreshed = await clerk.users.getUserOauthAccessToken(userId, "oauth_google");
    accessToken = refreshed?.data?.[0]?.token ?? null;
  }

  if (!accessToken) {
    throw Object.assign(new Error("Ingen Gmail adgangstoken fundet. Log ind via Google med gmail.send scope."), { status: 403 });
  }
  return accessToken;
}

// Dekoder Gmail base64-url encodede dele til tekst
function decodeBase64Url(data: string): string {
  const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binaryString = atob(padded);
  try {
    return decodeURIComponent(escape(binaryString));
  } catch {
    return binaryString;
  }
}

// Finder plaintext fra Gmail MIME payload (fallback til HTML-strip)
function extractPlainTextFromPayload(payload: any): string {
  if (!payload) return "";
  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }
  if (Array.isArray(payload.parts)) {
    for (const part of payload.parts) {
      const mime = part?.mimeType ?? "";
      const value = extractPlainTextFromPayload(part);
      if (!value) continue;
      if (mime.includes("text/plain")) return value;
      if (mime.includes("text/html")) return value.replace(/<[^>]*>/g, " ").trim();
      return value;
    }
  }
  return "";
}

// Henter fuld Gmail-besked (payload) med auth token
async function fetchGmailMessage(messageId: string, token: string) {
  const url = `${GMAIL_BASE}/messages/${encodeURIComponent(messageId)}?format=full`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const text = await res.text();
    throw Object.assign(new Error(`Gmail message fetch failed: ${text || res.status}`), { status: res.status });
  }
  return await res.json();
}

// Opretter Gmail draft ud fra rå MIME tekst
async function createGmailDraft(rawMessage: string, token: string, threadId?: string) {
  const toBase64Url = (input: string) => {
    const b64 = btoa(unescape(encodeURIComponent(input)));
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  };
  const payload: any = { message: { raw: toBase64Url(rawMessage) } };
  if (threadId) payload.message.threadId = threadId;
  const res = await fetch(`${GMAIL_BASE}/drafts`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch {}
  if (!res.ok) throw Object.assign(new Error(`Gmail draft failed: ${text || res.status}`), { status: res.status });
  return json;
}

// Kalder OpenAI med JSON schema så vi får reply + handlinger
async function callOpenAI(prompt: string, system?: string): Promise<OpenAIResult> {
  if (!OPENAI_API_KEY) return { reply: null, actions: [] };
  const messages: any[] = [];
  if (system) messages.push({ role: "system", content: system });
  messages.push({ role: "user", content: prompt });
  const body = {
    model: OPENAI_MODEL,
    temperature: 0.3,
    messages,
    response_format: {
      type: "json_schema",
      json_schema: PERSONA_REPLY_JSON_SCHEMA,
    },
    max_tokens: 800,
  };
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message || `OpenAI error ${res.status}`);
  const content = json?.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    return { reply: null, actions: [] };
  }
  try {
    const parsed = JSON.parse(content);
    const reply = typeof parsed?.reply === "string" ? parsed.reply : null;
    const actions = Array.isArray(parsed?.actions)
      ? parsed.actions.filter((action: any) => typeof action?.type === "string")
      : [];
    return { reply, actions };
  } catch (_err) {
    return { reply: null, actions: [] };
  }
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

    const body = await readJsonBody(req);
    const internalRequest = isInternalAutomationRequest(req);

    let clerkToken: string | null = null;
    let clerkUserId: string;
    if (internalRequest) {
      const providedUserId = typeof body?.clerkUserId === "string" ? body.clerkUserId.trim() : "";
      if (!INTERNAL_AGENT_SECRET) {
        return new Response(JSON.stringify({ error: "Internt secret ikke konfigureret" }), {
          status: 500,
        });
      }
      if (!providedUserId) {
        return new Response(JSON.stringify({ error: "clerkUserId mangler for internt kald" }), {
          status: 400,
        });
      }
      clerkUserId = providedUserId;
    } else {
      clerkToken = getBearerToken(req);
      clerkUserId = await requireUserIdFromJWT(req);
    }

    let supabaseUserId: string | null = null;
    if (supabase) {
      try {
        supabaseUserId = await resolveSupabaseUserId(supabase, clerkUserId);
      } catch (err) {
        console.warn(
          "gmail-create-draft-ai: kunne ikke hente supabase user id",
          err?.message || err,
        );
      }
    }
    const persona = await fetchPersona(supabase, supabaseUserId);
    const automation = await fetchAutomation(supabase, supabaseUserId);
    const policies = await fetchPolicies(supabase, supabaseUserId);
    const gmailToken = await getGmailAccessToken(clerkUserId);

    const messageId = typeof body?.messageId === "string" ? body.messageId : null;
    if (!messageId) return new Response(JSON.stringify({ error: "messageId mangler" }), { status: 400 });

    const message = await fetchGmailMessage(messageId, gmailToken);
    const headers = message.payload?.headers ?? [];
    const from = headers.find((h: any) => h.name?.toLowerCase() === "from")?.value ?? "";
    const subject = headers.find((h: any) => h.name?.toLowerCase() === "subject")?.value ?? "Svar";
    const threadId = message.threadId ?? null;
    const plain = extractPlainTextFromPayload(message.payload);

    const emailMatch = from.match(/<([^>]+)>/);
    const fromEmail = emailMatch ? emailMatch[1] : (from.match(/([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i) ?? [null, null])[1];

    const classification = await classifyEmail({
      from,
      subject,
      body: plain,
      headers,
    });
    if (!classification.process) {
      emitDebugLog("gmail-create-draft-ai: gatekeeper skip", {
        reason: classification.reason,
        category: classification.category,
      });
      return Response.json(
        {
          success: true,
          skipped: true,
          reason: classification.reason,
          category: classification.category ?? null,
          explanation: classification.explanation ?? null,
        },
        { status: 200 },
      );
    }

    // Hvis vi har et Clerk-token tilgængeligt kan vi bruge en intern frontend
    // proxy til at hente ordrer (bruges som fallback når direkte shopify access mangler).
    const fetchOrdersWithFrontendToken =
      clerkToken && PROJECT_URL
        ? async (email?: string | null) => {
            try {
              const url = new URL(`${PROJECT_URL}${SHOPIFY_ORDERS_FN}`);
              if (email?.trim()) url.searchParams.set("email", email.trim());
              url.searchParams.set("limit", "5");
              const res = await fetch(url.toString(), {
                headers: { Authorization: `Bearer ${clerkToken}` },
              });
              if (!res.ok) return null;
              const json = await res.json().catch(() => null);
              return Array.isArray(json?.orders) ? json.orders : null;
            } catch (err) {
              console.warn("gmail-create-draft-ai: shopify-orders fetch fejlede", err);
              return null;
            }
          }
        : null;

    const { orders, matchedSubjectNumber } = await resolveOrderContext({
      supabase,
      userId: supabaseUserId,
      email: fromEmail,
      subject,
      tokenSecret: SHOPIFY_TOKEN_KEY,
      apiVersion: SHOPIFY_API_VERSION,
      fetcher: fetchOrdersWithFrontendToken ?? undefined,
    });
    emitDebugLog("gmail-create-draft-ai: order context", {
      email: fromEmail,
      orders: orders.length,
      matchedSubjectNumber,
    });

    const orderSummary = buildOrderSummary(orders);
    const productContext = await fetchProductContext(
      supabase,
      supabaseUserId,
      plain || subject || ""
    );

  // Byg base prompt til OpenAI: med email-tekst, ordre-resume, persona-instruktioner og policies.
  const promptBase = buildMailPrompt({
      emailBody: plain,
      orderSummary,
      personaInstructions: persona.instructions,
      matchedSubjectNumber,
      extraContext:
        "Returner altid JSON hvor 'actions' beskriver konkrete handlinger du udfører i Shopify. Brug orderId (det numeriske id i parentes) når du udfylder actions. udfyld altid payload.shipping_address (brug nuværende adresse hvis den ikke ændres) og sæt payload.note og payload.tag til tom streng hvis de ikke bruges. Hvis kunden beder om adresseændring, udfyld shipping_address med alle felter (name, address1, address2, zip, city, country, phone). Hvis en handling ikke er tilladt i automationsreglerne, lad actions listen være tom og forklar brugeren at du sender sagen videre.",
      signature: persona.signature,
      policies,
    });
    const prompt = productContext
      ? `${promptBase}\n\nPRODUKTKONTEKST:\n${productContext}`
      : promptBase;

  // Kald OpenAI (eller fallback) for at få forslag til svar og eventuelle automation actions
  let aiText: string | null = null;
  let automationActions: AutomationAction[] = [];
    try {
      if (OPENAI_API_KEY) {
        const automationGuidance = buildAutomationGuidance(automation);
        const personaGuidance = `Persona instruktionsnoter: ${
          persona.instructions?.trim() || "Hold tonen venlig og effektiv."
        }\nAfslut ikke med signatur – signaturen tilføjes automatisk senere.`;
        const systemMsgBase = [
          "Du er en dansk kundeservice-assistent.",
          "Skriv kort, venligt og professionelt på dansk.",
          "Brug KONTEKST-sektionen til at finde relevante oplysninger og nævn dem eksplicit i svaret.",
          personaGuidance,
          "Automationsregler:",
          automationGuidance,
          "Ud over forventet svar skal du returnere JSON med 'reply' og 'actions'.",
          "Hvis en handling udføres (f.eks. opdater adresse, annuller ordre, tilføj note/tag), skal actions-listen indeholde et objekt med type, orderId og payload.",
          "Tilladte actions: update_shipping_address, cancel_order, add_tag. Brug kun actions hvis automationsreglerne tillader det – ellers lad listen være tom og forklar kunden at handlingen udføres manuelt.",
          "For update_shipping_address skal payload.shipping_address mindst indeholde name, address1, city, zip/postal_code og country.",
          "Afslut ikke med signatur – signaturen tilføjes automatisk senere.",
        ].join("\n");
        const systemMsg = matchedSubjectNumber
          ? systemMsgBase + ` Hvis KONTEKST indeholder et ordrenummer (fx #${matchedSubjectNumber}), brug dette ordrenummer som reference i svaret og spørg IKKE efter ordrenummer igen.`
          : systemMsgBase;
        const { reply, actions } = await callOpenAI(prompt, systemMsg);
        aiText = reply;
        automationActions = actions ?? [];
      } else {
        aiText = null;
      }
    } catch (e) {
      console.warn("OpenAI fejl", e?.message || e);
      aiText = null;
    }

    if (!aiText) {
      aiText = `Hej ${from.split(" <")[0] || "kunde"},\n\nTak for din besked. Jeg har kigget på din sag${
        orders.length ? ` og fandt ${orders.length} ordre(r) relateret til din e-mail.` : "."
      }\n\n${orderSummary}\nVi vender tilbage hurtigst muligt med en opdatering.`;
    }
    let finalText = aiText.trim();
    const signature = persona.signature?.trim();
    if (signature && signature.length && !finalText.includes(signature)) {
      finalText = `${finalText}\n\n${signature}`;
    }
    aiText = finalText;

  // opret et draft i Gmail
  const rawLines = [] as string[];
    rawLines.push(`To: ${fromEmail || from}`);
    rawLines.push(`Subject: Re: ${subject}`);
    if (threadId) {
      rawLines.push(`In-Reply-To: ${messageId}`);
      rawLines.push(`References: ${messageId}`);
    }
    rawLines.push("Content-Type: text/plain; charset=UTF-8");
    rawLines.push("");
    rawLines.push(aiText);
    const rawMessage = rawLines.join("\r\n");

    const draft = await createGmailDraft(rawMessage, gmailToken, threadId ?? undefined);
    const automationResults = await executeAutomationActions({
      supabase,
      supabaseUserId,
      actions: automationActions,
      automation,
      tokenSecret: SHOPIFY_TOKEN_KEY,
      apiVersion: SHOPIFY_API_VERSION,
    });
    emitDebugLog("gmail-create-draft-ai: automation results", automationResults);

    return new Response(JSON.stringify({ success: true, draft, automation: automationResults }), {
      status: 200,
    });
  } catch (err: any) {
    const status = typeof err?.status === "number" ? err.status : 500;
    const message = err?.message || "Ukendt fejl";
    console.error("gmail-create-draft-ai error:", message);
    return new Response(JSON.stringify({ error: message }), { status });
  }
});
