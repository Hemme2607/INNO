// supabase/functions/gmail-list/index.ts
import { createClerkClient } from "https://esm.sh/@clerk/backend@1";
import { createRemoteJWKSet, jwtVerify } from "https://deno.land/x/jose@v5.2.0/index.ts";

const GMAIL_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";

// --- Env ---
const CLERK_SECRET_KEY = Deno.env.get("CLERK_SECRET_KEY");
const CLERK_JWT_ISSUER = Deno.env.get("CLERK_JWT_ISSUER"); // fx https://<your>.clerk.accounts.dev

if (!CLERK_SECRET_KEY) console.warn("CLERK_SECRET_KEY mangler (Supabase secret).");
if (!CLERK_JWT_ISSUER) console.warn("CLERK_JWT_ISSUER mangler (Supabase secret).");

// Clerk SDK skal kun bruge secret key – resten henter vi via REST
const clerk = createClerkClient({ secretKey: CLERK_SECRET_KEY! });
const JWKS = CLERK_JWT_ISSUER
  ? createRemoteJWKSet(new URL(`${CLERK_JWT_ISSUER.replace(/\/$/, "")}/.well-known/jwks.json`))
  : null;

// --- Typer ---
type GmailMessage = {
  id: string;
  threadId?: string;
  snippet?: string;
  internalDate?: string;
  payload?: { headers?: Array<{ name: string; value: string }> };
};
type GmailListResponse = {
  messages?: Array<{ id: string; threadId?: string }>;
  nextPageToken?: string;
};

// --- Helpers ---
function findHeader(msg: GmailMessage, name: string) {
  const h = msg?.payload?.headers ?? [];
  return h.find((x) => x.name?.toLowerCase() === name.toLowerCase())?.value ?? "";
}

function readDebugFlag(req: Request) {
  const url = new URL(req.url);
  let debug = url.searchParams.get("debug") === "1";
  if (req.method === "POST") {
    // Body læses senere (vi vil undgå at forbruge streamen her)
  }
  return debug;
}

async function readBodySafe(req: Request) {
  if (req.method !== "POST") return {};
  try {
    return await req.json();
  } catch {
    return {};
  }
}

function getBearerToken(req: Request): string {
  const h1 = req.headers.get("authorization");
  const h2 = req.headers.get("Authorization");
  const header = typeof h1 === "string" ? h1 : (typeof h2 === "string" ? h2 : "");
  const str = String(header || "");
  const match = str.match(/^Bearer\s+(.+)$/i);
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
  // 1) prøv den token Clerk allerede har liggende
  const tokens = await clerk.users.getUserOauthAccessToken(userId, "oauth_google");
  let accessToken = tokens?.data?.[0]?.token ?? null;

  // 2) ellers tving en refresh via Clerk så vi får et frisk token
  if (!accessToken) {
    await clerk.users.refreshUserOauthAccessToken(userId, "oauth_google");
    const refreshed = await clerk.users.getUserOauthAccessToken(userId, "oauth_google");
    accessToken = refreshed?.data?.[0]?.token ?? null;
  }

  if (!accessToken) {
    throw Object.assign(
      new Error("Ingen Gmail adgangstoken fundet. Log ind via Google med gmail.readonly scope."),
      { status: 403 }
    );
  }
  return accessToken;
}

async function fetchJson<T>(url: string, token: string): Promise<T> {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const text = await res.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* Gmail kan svare med tom body ved 204 */ }
  if (!res.ok) {
    const msg = (json && (json.error?.message || json.message)) || text || `HTTP ${res.status}`;
    throw Object.assign(new Error(`Gmail request failed (${res.status}): ${msg}`), { status: res.status });
  }
  return json as T;
}

// --- Handler ---
Deno.serve(async (req) => {
  const url = new URL(req.url);
  const debugQuery = url.searchParams.get("debug") === "1";
  const messageId = (url.searchParams.get("messageId") ?? body?.messageId ?? "").trim();
  const body = await readBodySafe(req);
  const debug = debugQuery || !!body?.debug;

  try {
    if (req.method !== "GET" && req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    // Params (fra query eller body)
    const maxResults = Math.min(
      Number(url.searchParams.get("maxResults") ?? body?.maxResults ?? 20),
      100,
    );
    const pageToken = (url.searchParams.get("pageToken") ?? body?.pageToken) || undefined;
    const q = (url.searchParams.get("q") ?? body?.q ?? "") as string;
    const labelIds = (url.searchParams.get("labelIds") ?? body?.labelIds ?? "INBOX") as string;

    // 1) Verificér bruger
    const userId = await requireUserIdFromJWT(req);
    // Debug: inspect Clerk's stored Google OAuth tokens (without leaking the token)
    if (debug) {
      try {
        const tokens = await clerk.users.getUserOauthAccessToken(userId, "oauth_google");
        const meta = (tokens?.data ?? []).map((t: any) => ({
          id: t.id,
          hasToken: !!t.token,
          scopes: t.scopes ?? undefined,
          created_at: t.created_at,
        }));
        console.log("DEBUG oauth_google tokens:", meta);
      } catch (e) {
        console.log("DEBUG getUserOauthAccessToken failed:", (e as any)?.message || e);
      }
    }

    // 2) Hent/forny Gmail access token
    const gmailToken = await getGmailAccessToken(userId);

    if (messageId) {
      const messageUrl = `${GMAIL_BASE}/messages/${messageId}?format=full`;
      const fullMessage = await fetchJson<GmailMessage>(messageUrl, gmailToken);
      const payload = fullMessage.payload ?? null;
      const subject = findHeader(fullMessage, "Subject") || "(ingen emne)";
      const from = findHeader(fullMessage, "From") ?? "";
      const decodedBody = payload ? extractPlainTextFromPayload(payload) : "";
      const body =
        decodedBody ||
        fullMessage.snippet ||
        "";

      return Response.json({
        item: {
          id: fullMessage.id ?? messageId,
          subject,
          from,
          snippet: fullMessage.snippet ?? "",
          body,
        },
      });
    }

    // 3) Liste af mails
    const listUrl = new URL(`${GMAIL_BASE}/messages`);
    listUrl.searchParams.set("maxResults", String(maxResults));
    if (pageToken) listUrl.searchParams.set("pageToken", pageToken);
    if (q) listUrl.searchParams.set("q", q);
    if (labelIds) listUrl.searchParams.set("labelIds", labelIds);

    const listJson = await fetchJson<GmailListResponse>(listUrl.toString(), gmailToken);
    const ids = listJson.messages ?? [];

    if (debug) {
      console.log("DEBUG list meta:", {
        count: ids.length,
        nextPageToken: listJson.nextPageToken ?? null,
        q, labelIds, maxResults,
      });
    }

    if (ids.length === 0) {
      return Response.json({ items: [], nextPageToken: listJson.nextPageToken ?? null });
    }

    // 4) Hent metadata pr. mail
    const items = (await Promise.all(
      ids.map(async ({ id, threadId }) => {
        const metaUrl =
          `${GMAIL_BASE}/messages/${id}` +
          `?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date`;
        const m = await fetchJson<GmailMessage>(metaUrl, gmailToken);
        return {
          id,
          threadId: threadId ?? m.threadId ?? null,
          from: findHeader(m, "From"),
          to: findHeader(m, "To"),
          subject: findHeader(m, "Subject") || "(ingen emne)",
          date: findHeader(m, "Date") || "",
          internalDate: m?.internalDate ? new Date(Number(m.internalDate)).toISOString() : null,
          snippet: m?.snippet ?? "",
        };
      }),
    )).filter(Boolean);

    if (debug) console.log("DEBUG items count:", items.length);

    return Response.json({ items, nextPageToken: listJson.nextPageToken ?? null });
  } catch (err: any) {
    const status = typeof err?.status === "number" ? err.status : 500;
    const message = err?.message || "Ukendt serverfejl";
    console.error("gmail-list error:", message);
    return new Response(message, { status });
  }
});

function extractPlainTextFromPayload(payload: GmailMessage["payload"]): string {
  if (!payload) return "";

  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  if (Array.isArray(payload.parts)) {
    for (const part of payload.parts) {
      const mime = part?.mimeType ?? "";
      const value = extractPlainTextFromPayload(part);
      if (!value) continue;

      if (mime.includes("text/plain")) {
        return value;
      }
      if (mime.includes("text/html")) {
        return stripHtml(value);
      }

      // Fallback: return first non-empty content
      return value;
    }
  }

  return "";
}

function decodeBase64Url(data: string): string {
  const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binaryString = atob(padded);
  const bytes = Uint8Array.from(binaryString, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}
