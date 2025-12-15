// supabase/functions/outlook-create-draft-ai/index.ts
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

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";
const EDGE_DEBUG_LOGS = Deno.env.get("EDGE_DEBUG_LOGS") === "true";
const emitDebugLog = (...args: Array<unknown>) => {
  if (EDGE_DEBUG_LOGS) {
    console.log(...args);
  }
};

// --- Env ---
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
  console.warn("SERVICE_ROLE_KEY mangler – outlook-create-draft-ai kan ikke læse Supabase tabeller.");
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

type GraphRecipient = {
  emailAddress?: {
    name?: string;
    address?: string;
  };
};

type GraphMessage = {
  id?: string;
  subject?: string;
  body?: { contentType?: string; content?: string };
  bodyPreview?: string;
  from?: GraphRecipient;
  toRecipients?: GraphRecipient[];
  ccRecipients?: GraphRecipient[];
  replyTo?: GraphRecipient[];
  conversationId?: string;
  internetMessageId?: string;
  sentDateTime?: string;
  receivedDateTime?: string;
};

function getBearerToken(req: Request): string {
  const header = req.headers.get("authorization") ?? req.headers.get("Authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) {
    throw Object.assign(new Error("Missing Clerk session token"), { status: 401 });
  }
  return match[1];
}

function isInternalAutomationRequest(req: Request): boolean {
  if (!INTERNAL_AGENT_SECRET) return false;
  const candidate =
    req.headers.get("x-internal-secret") ??
    req.headers.get("X-Internal-Secret") ??
    req.headers.get("x-automation-secret") ??
    req.headers.get("X-Automation-Secret");
  return candidate === INTERNAL_AGENT_SECRET;
}

async function readJsonBody(req: Request) {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

async function requireUserIdFromJWT(req: Request): Promise<string> {
  if (!JWKS || !CLERK_JWT_ISSUER) {
    throw Object.assign(new Error("JWT verify ikke konfigureret (CLERK_JWT_ISSUER mangler)"), {
      status: 500,
    });
  }
  const token = getBearerToken(req);
  const { payload } = await jwtVerify(token, JWKS, { issuer: CLERK_JWT_ISSUER });
  const userId = payload?.sub;
  if (!userId || typeof userId !== "string") {
    throw Object.assign(new Error("Ugyldigt token: mangler user id"), { status: 401 });
  }
  return userId;
}

async function getMicrosoftAccessToken(userId: string): Promise<string> {
  const tokens = await clerk.users.getUserOauthAccessToken(userId, "oauth_microsoft");
  let token = tokens?.data?.[0]?.token ?? null;

  if (!token) {
    await clerk.users.refreshUserOauthAccessToken(userId, "oauth_microsoft");
    const refreshed = await clerk.users.getUserOauthAccessToken(userId, "oauth_microsoft");
    token = refreshed?.data?.[0]?.token ?? null;
  }

  if (!token) {
    throw Object.assign(
      new Error("Ingen Microsoft adgangstoken fundet. Log ind via Microsoft med Mail.Read/Write scope."),
      { status: 403 },
    );
  }

  return token;
}

function stripHtml(input?: string | null): string {
  if (!input) return "";
  return input.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

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
    console.warn("outlook-create-draft-ai: product context failed", err);
    return "";
  }
}

function resolveFromAddress(message?: GraphMessage): string {
  const addr =
    message?.from?.emailAddress?.address ||
    message?.replyTo?.[0]?.emailAddress?.address ||
    "";
  return addr || "";
}

async function fetchGraphMessage(messageId: string, accessToken: string): Promise<GraphMessage> {
  const url = new URL(`${GRAPH_BASE}/me/messages/${encodeURIComponent(messageId)}`);
  url.searchParams.set(
    "$select",
    [
      "id",
      "subject",
      "bodyPreview",
      "body",
      "from",
      "toRecipients",
      "ccRecipients",
      "replyTo",
      "conversationId",
      "internetMessageId",
      "sentDateTime",
      "receivedDateTime",
    ].join(","),
  );
  url.searchParams.set("$expand", "attachments");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // ignore
  }

  if (!res.ok) {
    const message =
      (json && (json.error?.message || json.message)) || text || `HTTP ${res.status}`;
    throw Object.assign(
      new Error(`Microsoft Graph request failed (${res.status}): ${message}`),
      { status: res.status },
    );
  }

  return json as GraphMessage;
}

async function createOutlookDraftReply({
  accessToken,
  messageId,
  bodyHtml,
}: {
  accessToken: string;
  messageId: string;
  bodyHtml: string;
}) {
  const replyRes = await fetch(`${GRAPH_BASE}/me/messages/${messageId}/createReply`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });
  const draftJson = await replyRes.json().catch(() => null);
  if (!replyRes.ok || !draftJson?.id) {
    throw new Error(
      `Kunne ikke oprette reply draft: ${
        draftJson?.error?.message || replyRes.status
      }`,
    );
  }

  const patchRes = await fetch(`${GRAPH_BASE}/me/messages/${draftJson.id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      body: {
        contentType: "HTML",
        content: bodyHtml,
      },
      isDraft: true,
    }),
  });

  if (!patchRes.ok) {
    const text = await patchRes.text();
    throw new Error(`Kunne ikke gemme reply draft: ${text || patchRes.status}`);
  }

  return draftJson;
}

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
    return { reply: parsed?.reply ?? null, actions: parsed?.actions ?? [] };
  } catch {
    return { reply: null, actions: [] };
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const body = await readJsonBody(req);
  const debug = body?.debug === true;
  const debugEnabled = debug || EDGE_DEBUG_LOGS;

  try {
    let clerkUserId: string | null = null;

    if (isInternalAutomationRequest(req)) {
      clerkUserId = typeof body?.userId === "string" ? body.userId : null;
      if (!clerkUserId) {
        throw Object.assign(
          new Error("userId mangler i body for intern automation request"),
          { status: 400 },
        );
      }
    } else {
      clerkUserId = await requireUserIdFromJWT(req);
    }

    const messageId = (body?.messageId ?? body?.id ?? "").trim();
    if (!messageId) {
      throw Object.assign(new Error("messageId mangler i body"), { status: 400 });
    }

    const accessToken = await getMicrosoftAccessToken(clerkUserId);
    const message = await fetchGraphMessage(messageId, accessToken);

    const fromAddress = resolveFromAddress(message);
    const subject = message?.subject ?? "";
    const textContent =
      message?.body?.contentType === "text"
        ? message?.body?.content ?? ""
        : stripHtml(message?.body?.content ?? "") || message?.bodyPreview || "";

    const supabaseUserId = await resolveSupabaseUserId(supabase, clerkUserId);
    const persona = await fetchPersona(supabase, supabaseUserId);
    const automation = await fetchAutomation(supabase, supabaseUserId);
    const policies = await fetchPolicies(supabase, supabaseUserId);

    const { orders, matchedSubjectNumber } = await resolveOrderContext({
      supabase,
      userId: supabaseUserId,
      email: fromAddress,
      subject,
      tokenSecret: SHOPIFY_TOKEN_KEY,
      apiVersion: SHOPIFY_API_VERSION,
    });

    const orderSummary = buildOrderSummary(orders);
    const automationGuidance = buildAutomationGuidance(automation);

    const prompt = buildMailPrompt({
      emailBody: textContent || "(tomt indhold)",
      orderSummary,
      personaInstructions: persona.instructions,
      matchedSubjectNumber,
      extraContext:
        "Returner altid JSON hvor 'actions' beskriver konkrete handlinger du udfører i Shopify. Brug orderId (det numeriske id i parentes) når du udfylder actions. udfyld altid payload.shipping_address (brug nuværende adresse hvis den ikke ændres) og sæt payload.note og payload.tag til tom streng hvis de ikke bruges. Hvis kunden beder om adresseændring, udfyld shipping_address med alle felter (name, address1, address2, zip, city, country, phone). Hvis en handling ikke er tilladt i automationsreglerne, lad actions listen være tom og forklar brugeren at du sender sagen videre.",
      signature: persona.signature,
      policies,
    });

    let aiText: string | null = null;
    let automationActions: AutomationAction[] = [];
    try {
      if (OPENAI_API_KEY) {
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
          ? systemMsgBase +
            ` Hvis KONTEKST indeholder et ordrenummer (fx #${matchedSubjectNumber}), brug dette ordrenummer som reference i svaret og spørg IKKE efter ordrenummer igen.`
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
      aiText = `Hej ${fromAddress?.split("@")?.[0] || "kunde"},\n\nTak for din besked. Jeg har kigget på din sag${
        orders.length ? ` og fandt ${orders.length} ordre(r) relateret til din e-mail.` : "."
      }\n\n${orderSummary}\nVi vender tilbage hurtigst muligt med en opdatering.`;
    }
    let finalText = aiText.trim();
    const signature = persona.signature?.trim();
    if (signature && signature.length && !finalText.includes(signature)) {
      finalText = `${finalText}\n\n${signature}`;
    }

    const htmlBody = finalText.includes("<")
      ? finalText
      : finalText.replace(/\n/g, "<br>");

    const draft = await createOutlookDraftReply({
      accessToken,
      messageId,
      bodyHtml: htmlBody,
    });

    const automationResults = await executeAutomationActions({
      supabase,
      supabaseUserId,
      actions: automationActions,
      automation,
      tokenSecret: SHOPIFY_TOKEN_KEY,
      apiVersion: SHOPIFY_API_VERSION,
    });
    if (debugEnabled) {
      emitDebugLog(
        "outlook-create-draft-ai: automation results",
        JSON.stringify(automationResults),
      );
    }

    if (debugEnabled) {
      emitDebugLog(
        JSON.stringify(
          {
            subject,
            from: fromAddress,
            orders: orders?.length ?? 0,
            matchedSubjectNumber,
            draftId: draft?.id,
          },
          null,
          2,
        ),
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        draftId: draft?.id,
        reply: finalText,
        conversationId: message?.conversationId,
        automation: automationResults,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    const status = (error as any)?.status ?? 500;
    const message = (error as any)?.message ?? "Ukendt fejl";
    console.error("outlook-create-draft-ai failed:", message);
    return new Response(
      JSON.stringify({
        error: message,
      }),
      {
        status,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
});
