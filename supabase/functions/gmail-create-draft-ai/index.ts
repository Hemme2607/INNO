import { createClerkClient } from "https://esm.sh/@clerk/backend@1";
import { createRemoteJWKSet, jwtVerify } from "https://deno.land/x/jose@v5.2.0/index.ts";

const GMAIL_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";
const SHOPIFY_ORDERS_FN = "/functions/v1/shopify-orders";

const CLERK_SECRET_KEY = Deno.env.get("CLERK_SECRET_KEY");
const CLERK_JWT_ISSUER = Deno.env.get("CLERK_JWT_ISSUER");
const PROJECT_URL = Deno.env.get("PROJECT_URL") ?? Deno.env.get("SUPABASE_URL");
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

if (!CLERK_SECRET_KEY) console.warn("CLERK_SECRET_KEY mangler (Supabase secret).");
if (!CLERK_JWT_ISSUER) console.warn("CLERK_JWT_ISSUER mangler (Supabase secret).");
if (!PROJECT_URL) console.warn("PROJECT_URL mangler – kan ikke kalde interne functions.");

const clerk = createClerkClient({ secretKey: CLERK_SECRET_KEY! });
const JWKS = CLERK_JWT_ISSUER
  ? createRemoteJWKSet(new URL(`${CLERK_JWT_ISSUER.replace(/\/$/, "")}/.well-known/jwks.json`))
  : null;

function getBearerToken(req: Request): string {
  const header = req.headers.get("authorization") ?? req.headers.get("Authorization") ?? "";
  const match = String(header).match(/^Bearer\s+(.+)$/i);
  if (!match) throw Object.assign(new Error("Missing Clerk session token"), { status: 401 });
  return match[1];
}

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

async function fetchGmailMessage(messageId: string, token: string) {
  const url = `${GMAIL_BASE}/messages/${encodeURIComponent(messageId)}?format=full`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const text = await res.text();
    throw Object.assign(new Error(`Gmail message fetch failed: ${text || res.status}`), { status: res.status });
  }
  return await res.json();
}

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

async function fetchShopifyContext(clerkToken: string, email?: string) {
  if (!PROJECT_URL) return null;
  const url = new URL(`${PROJECT_URL}${SHOPIFY_ORDERS_FN}`);
  if (email) url.searchParams.set("email", email);
  url.searchParams.set("limit", "5");
  const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${clerkToken}` } });
  if (!res.ok) return null;
  try { return await res.json(); } catch { return null; }
}

async function callOpenAI(prompt: string) {
  if (!OPENAI_API_KEY) return null;
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "gpt-3.5-turbo", messages: [{ role: "user", content: prompt }], max_tokens: 600 }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message || `OpenAI error ${res.status}`);
  return json?.choices?.[0]?.message?.content ?? null;
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

    const clerkToken = getBearerToken(req);
    const clerkUserId = await requireUserIdFromJWT(req);
    const gmailToken = await getGmailAccessToken(clerkUserId);

    const body = await (async () => { try { return await req.json(); } catch { return {}; } })();
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

    const shopContext = await fetchShopifyContext(clerkToken, fromEmail);
    const orders = Array.isArray(shopContext?.orders) ? shopContext.orders : [];

    // Build prompt
    let prompt = `Skriv et høfligt og professionelt svar på dansk til denne kundemail:\n\n---KUNDENS EMAIL---\n${plain}\n\n---KONTEKST---\n`;
    if (orders.length) {
      prompt += `Kunden har følgende ordrer (seneste ${orders.length}):\n`;
      for (const o of orders.slice(0, 5)) {
        prompt += `- Ordre #${o.id || o.name || o.order_number} — status: ${o.fulfillment_status ?? o.status ?? "ukendt"} — total: ${o.total_price ?? o.current_total_price ?? o.price ?? "ukendt"}\n`;
      }
    } else {
      prompt += "Ingen relaterede ordrer fundet.\n";
    }
    prompt += "\nSkriv et kort svar (3-6 sætninger) som inkluderer den relevante ordreinfo hvis den findes, og spørg om yderligere detaljer hvis nødvendigt.";

    let aiText = null;
    try {
      aiText = OPENAI_API_KEY ? await callOpenAI(prompt) : null;
    } catch (e) {
      console.warn("OpenAI fejl", e?.message || e);
      aiText = null;
    }

    if (!aiText) {
      // Fallback simple template
      aiText = `Hej ${from.split(" <")[0] || "kunde"},\n\nTak for din besked. Jeg har kigget på din sag${orders.length ? ` og fundet ${orders.length} ordre(r) relateret til din e-mail.` : "."} Vi vender tilbage hurtigst muligt med en opdatering.\n\nMvh`;
    }

    // Create draft in Gmail
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

    return new Response(JSON.stringify({ success: true, draft }), { status: 200 });
  } catch (err: any) {
    const status = typeof err?.status === "number" ? err.status : 500;
    const message = err?.message || "Ukendt fejl";
    console.error("gmail-create-draft-ai error:", message);
    return new Response(JSON.stringify({ error: message }), { status });
  }
});
