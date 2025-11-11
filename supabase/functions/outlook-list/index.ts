// supabase/functions/outlook-list/index.ts
import { createClerkClient } from "https://esm.sh/@clerk/backend@1";
import { createRemoteJWKSet, jwtVerify } from "https://deno.land/x/jose@v5.2.0/index.ts";

const GRAPH_BASE = "https://graph.microsoft.com/v1.0/me";
const EDGE_DEBUG_LOGS = Deno.env.get("EDGE_DEBUG_LOGS") === "true";
const emitDebugLog = (...args: Array<unknown>) => {
  if (EDGE_DEBUG_LOGS) {
    console.log(...args);
  }
};

// --- Env ---
const CLERK_SECRET_KEY = Deno.env.get("CLERK_SECRET_KEY");
const CLERK_JWT_ISSUER = Deno.env.get("CLERK_JWT_ISSUER");

if (!CLERK_SECRET_KEY) console.warn("CLERK_SECRET_KEY mangler (Supabase secret).");
if (!CLERK_JWT_ISSUER) console.warn("CLERK_JWT_ISSUER mangler (Supabase secret).");

const clerk = createClerkClient({ secretKey: CLERK_SECRET_KEY! });
const JWKS = CLERK_JWT_ISSUER
  ? createRemoteJWKSet(new URL(`${CLERK_JWT_ISSUER.replace(/\/$/, "")}/.well-known/jwks.json`))
  : null;

type GraphRecipient = {
  emailAddress?: {
    name?: string;
    address?: string;
  };
};

type GraphMessage = {
  id?: string;
  subject?: string;
  bodyPreview?: string;
  from?: GraphRecipient;
  toRecipients?: GraphRecipient[];
  ccRecipients?: GraphRecipient[];
  receivedDateTime?: string;
  sentDateTime?: string;
  createdDateTime?: string;
  conversationId?: string;
};

type GraphListResponse = {
  value?: GraphMessage[];
  "@odata.nextLink"?: string;
};

function asAddress(recipient?: GraphRecipient): string {
  const name = recipient?.emailAddress?.name?.trim() || "";
  const address = recipient?.emailAddress?.address?.trim() || "";
  if (name && address) return `${name} <${address}>`;
  return name || address || "";
}

function findHeaderList(toRecipients?: GraphRecipient[], ccRecipients?: GraphRecipient[]) {
  const recipients = [
    ...(Array.isArray(toRecipients) ? toRecipients : []),
    ...(Array.isArray(ccRecipients) ? ccRecipients : []),
  ];
  return recipients.map(asAddress).filter(Boolean).join(", ");
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
  const header = req.headers.get("authorization") ?? req.headers.get("Authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) {
    throw Object.assign(new Error("Missing Clerk session token"), { status: 401 });
  }
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
      new Error("Ingen Microsoft adgangstoken fundet. Log ind via Microsoft med Mail.Read scope."),
      { status: 403 },
    );
  }

  return token;
}

function extractSkipToken(nextLink?: string | null): string | null {
  if (!nextLink) return null;
  try {
    const url = new URL(nextLink);
    const token = url.searchParams.get("$skiptoken");
    return token;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const body = await readBodySafe(req);
  const debug = url.searchParams.get("debug") === "1" || body?.debug === true;
  const debugEnabled = debug || EDGE_DEBUG_LOGS;

  try {
    if (req.method !== "GET" && req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const top = Math.min(
      Number(url.searchParams.get("maxResults") ?? body?.maxResults ?? 25),
      50,
    );
    const skipToken = (url.searchParams.get("pageToken") ?? body?.pageToken) || undefined;
    const searchQuery = (url.searchParams.get("q") ?? body?.q ?? "").trim();
    const messageId = (url.searchParams.get("messageId") ?? body?.messageId ?? "").trim();

    const userId = await requireUserIdFromJWT(req);

    if (debugEnabled) {
      try {
        const tokens = await clerk.users.getUserOauthAccessToken(userId, "oauth_microsoft");
        const meta = (tokens?.data ?? []).map((t: any) => ({
          id: t.id,
          hasToken: !!t.token,
          scopes: t.scopes,
          created_at: t.created_at,
        }));
        emitDebugLog("DEBUG oauth_microsoft tokens:", meta);
      } catch (error) {
        emitDebugLog("DEBUG getUserOauthAccessToken failed:", (error as any)?.message || error);
      }
    }

    const accessToken = await getMicrosoftAccessToken(userId);

    if (messageId) {
      const messageUrl = new URL(`${GRAPH_BASE}/messages/${messageId}`);
      messageUrl.searchParams.set(
        "$select",
        ["id", "subject", "bodyPreview", "body", "from"].join(","),
      );

      const messageRes = await fetch(messageUrl.toString(), {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const text = await messageRes.text();
      let json: any = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        // ignore
      }

      if (!messageRes.ok) {
        const message =
          (json && (json.error?.message || json.message)) ||
          text ||
          `HTTP ${messageRes.status}`;
        throw Object.assign(
          new Error(`Microsoft Graph request failed (${messageRes.status}): ${message}`),
          { status: messageRes.status },
        );
      }

      const message = json as GraphMessage & {
        body?: { contentType?: string; content?: string };
      };

      const from = asAddress(message?.from);
      const rawContent = message?.body?.content ?? "";
      const contentType = message?.body?.contentType ?? "";
      const bodyContent = contentType?.toLowerCase() === "html"
        ? stripHtml(rawContent)
        : rawContent || message?.bodyPreview || "";

      return Response.json({
        item: {
          id: message?.id ?? messageId,
          subject: message?.subject || "(ingen emne)",
          preview: message?.bodyPreview ?? "",
          from,
          body: bodyContent,
        },
      });
    }

    const listUrl = new URL(`${GRAPH_BASE}/messages`);
    listUrl.searchParams.set("$orderby", "receivedDateTime DESC");
    listUrl.searchParams.set("$top", String(top));
    listUrl.searchParams.set("$select", [
      "id",
      "subject",
      "bodyPreview",
      "from",
      "toRecipients",
      "ccRecipients",
      "receivedDateTime",
      "sentDateTime",
      "createdDateTime",
      "conversationId",
    ].join(","));

    if (skipToken) {
      listUrl.searchParams.set("$skiptoken", skipToken);
    }
    if (searchQuery) {
      // Graph kræver specifik syntaks til search. Vi bruger simple fulltext.
      listUrl.searchParams.set("$search", `"${searchQuery.replace(/"/g, "")}"`);
      // Search kræver at vi inkluderer ConsistencyLevel header
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
    };
    if (searchQuery) {
      headers["ConsistencyLevel"] = "eventual";
    }

    const res = await fetch(listUrl.toString(), { headers });
    const text = await res.text();
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      // ignore
    }
    if (!res.ok) {
      const message =
        (json && (json.error?.message || json.message)) ||
        text ||
        `HTTP ${res.status}`;
      throw Object.assign(new Error(`Microsoft Graph request failed (${res.status}): ${message}`), {
        status: res.status,
      });
    }

    const payload = json as GraphListResponse;
    const messages = Array.isArray(payload?.value) ? payload.value : [];
    const nextPageToken = extractSkipToken(payload?.["@odata.nextLink"] ?? null);

    const items = messages.map((message) => {
      const from = asAddress(message?.from);
      const toList = findHeaderList(message?.toRecipients, message?.ccRecipients);
      const received = message?.receivedDateTime || message?.sentDateTime || message?.createdDateTime || null;
      return {
        id: message?.id ?? crypto.randomUUID(),
        threadId: message?.conversationId ?? null,
        from,
        to: toList,
        subject: message?.subject || "(ingen emne)",
        date: received,
        internalDate: message?.createdDateTime || null,
        snippet: message?.bodyPreview || "",
        receivedAt: received,
      };
    });

    if (debug) {
      emitDebugLog("DEBUG outlook-list count:", items.length, "nextPageToken:", nextPageToken);
    }

    return Response.json({ items, nextPageToken });
  } catch (error: any) {
    const status = typeof error?.status === "number" ? error.status : 500;
    const message = error?.message || "Ukendt serverfejl";
    console.error("outlook-list error:", message);
    return new Response(message, { status });
  }
});

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}
