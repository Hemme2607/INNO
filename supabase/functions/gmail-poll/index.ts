import { createClerkClient } from "https://esm.sh/@clerk/backend@1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GMAIL_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";
const EDGE_DEBUG_LOGS = Deno.env.get("EDGE_DEBUG_LOGS") === "true";
const emitDebugLog = (...args: Array<unknown>) => {
  if (EDGE_DEBUG_LOGS) {
    console.log(...args);
  }
};

// Kører som baggrundsjob der trigges af Supabase Cron
const PROJECT_URL = Deno.env.get("PROJECT_URL") ?? Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY =
  Deno.env.get("SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const CLERK_SECRET_KEY = Deno.env.get("CLERK_SECRET_KEY");
const INTERNAL_AGENT_SECRET = Deno.env.get("INTERNAL_AGENT_SECRET");
const GMAIL_POLL_SECRET = Deno.env.get("GMAIL_POLL_SECRET") ?? INTERNAL_AGENT_SECRET;
const MAX_USERS_PER_RUN = Number(Deno.env.get("GMAIL_POLL_MAX_USERS") ?? "5");
const MAX_MESSAGES_PER_USER = Number(Deno.env.get("GMAIL_POLL_MAX_MESSAGES") ?? "3");
const MESSAGE_QUERY =
  Deno.env.get("GMAIL_POLL_QUERY") ??
  'label:inbox -category:promotions -category:social -in:chats -"List-Unsubscribe" -from:(no-reply noreply newsletter)';

if (!PROJECT_URL) console.warn("PROJECT_URL mangler – gmail-poll kan ikke kalde edge functions.");
if (!SERVICE_ROLE_KEY) console.warn("SERVICE_ROLE_KEY mangler – gmail-poll kan ikke læse tabeller.");
if (!CLERK_SECRET_KEY)
  console.warn("CLERK_SECRET_KEY mangler – gmail-poll kan ikke hente Gmail tokens.");
if (!INTERNAL_AGENT_SECRET)
  console.warn("INTERNAL_AGENT_SECRET mangler – kald til gmail-create-draft-ai kan ikke sikres.");
if (!GMAIL_POLL_SECRET)
  console.warn("GMAIL_POLL_SECRET mangler – gmail-poll er ikke beskyttet mod offentlige kald.");

console.log(
  "gmail-poll startup",
  JSON.stringify({
    projectUrl: PROJECT_URL,
    edgeDebugLogs: EDGE_DEBUG_LOGS,
    gmailPollSecret: maskSecret(GMAIL_POLL_SECRET),
    cronHeaderExpected: ["x-cron-secret", "x-internal-secret"],
  }),
);

const clerk = createClerkClient({ secretKey: CLERK_SECRET_KEY! });
const supabase =
  PROJECT_URL && SERVICE_ROLE_KEY ? createClient(PROJECT_URL, SERVICE_ROLE_KEY) : null;

type AutomationUser = {
  clerk_user_id: string;
  user_id: string;
};

type GmailMessageMeta = {
  id: string;
  internalDate?: string;
  payload?: { headers?: Array<{ name: string; value: string }> };
  snippet?: string;
};

type PollState = {
  clerk_user_id: string;
  last_message_id: string | null;
  last_internal_date: number | null;
};

denoAssertConfig();

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
    const auth = authorize(req);
    if (!auth.ok) {
      console.warn("gmail-poll unauthorized request", auth.reason, auth.meta);
      return new Response(JSON.stringify({ error: auth.reason }), { status: 401 });
    }

    const body = await readJson(req);
    const explicitUsers: string[] | null = Array.isArray(body?.clerkUserIds)
      ? body.clerkUserIds.filter((id: unknown) => typeof id === "string")
      : null;

    const targets = explicitUsers?.length
      ? await mapClerkUsers(explicitUsers)
      : await loadAutoDraftUsers(Math.min(MAX_USERS_PER_RUN, Number(body?.userLimit ?? MAX_USERS_PER_RUN)));

    const results = [] as Array<Record<string, unknown>>;
    for (const target of targets) {
      const outcome = await pollSingleUser(target);
      results.push(outcome);
    }

    return Response.json({ success: true, processed: results.length, results });
  } catch (err: any) {
    console.error("gmail-poll error", err?.message || err);
    return new Response(JSON.stringify({ error: err?.message || "Ukendt fejl" }), {
      status: typeof err?.status === "number" ? err.status : 500,
    });
  }
});

// Finder nye mails for en bruger og videresender dem til edge-funktionen
async function pollSingleUser(user: AutomationUser) {
  if (!supabase) throw new Error("Supabase klient ikke konfigureret");
  try {
    const gmailToken = await getGmailAccessToken(user.clerk_user_id);
    const shopId = await resolveShopId(user.user_id);
    if (shopId) {
      await syncDraftStatuses(shopId, gmailToken);
    }
    const state = await loadPollState(user.clerk_user_id);
    const candidates = await fetchCandidateMessages(gmailToken, state);

    let handled = 0;
    let draftsCreated = 0;
    let skipped = 0;
    let maxInternalDate = state?.last_internal_date ?? 0;
    for (const item of candidates) {
      if (handled >= MAX_MESSAGES_PER_USER) break;
      const outcome = await triggerDraft(user.clerk_user_id, item.id);
      handled += 1;
      const ts = Number(item.internalDate ?? "0");
      if (ts > maxInternalDate) maxInternalDate = ts;
      if (outcome?.skipped) {
        skipped += 1;
      } else {
        draftsCreated += 1;
      }
    }

    if (handled && maxInternalDate) {
      await savePollState(user.clerk_user_id, candidates[candidates.length - 1]?.id ?? null, maxInternalDate);
    }

    emitDebugLog("gmail-poll", user.clerk_user_id, {
      candidates: candidates.length,
      drafts: draftsCreated,
      skipped,
      handled,
      maxInternalDate,
    });

    return {
      clerkUserId: user.clerk_user_id,
      supabaseUserId: user.user_id,
      candidates: candidates.length,
      draftsCreated,
      skipped,
      processed: handled,
    };
  } catch (err: any) {
    console.warn("gmail-poll user failed", user.clerk_user_id, err?.message || err);
    return {
      clerkUserId: user.clerk_user_id,
      supabaseUserId: user.user_id,
      error: err?.message || String(err),
    };
  }
}

// Vi henter metadata først, så vi kan filtrere nyhedsbreve billigt
async function fetchCandidateMessages(gmailToken: string, state: PollState | null) {
  const url = new URL(`${GMAIL_BASE}/messages`);
  url.searchParams.set("maxResults", "20");
  url.searchParams.set("labelIds", "INBOX");
  url.searchParams.set("q", MESSAGE_QUERY);

  const list = await fetchJson<{ messages?: Array<{ id: string }> }>(url.toString(), gmailToken);
  const ids = list.messages ?? [];
  if (!ids.length) return [];

  const metas = await Promise.all(
    ids.map(async ({ id }) => fetchMessageMeta(id, gmailToken)),
  );
  const lastTs = state?.last_internal_date ?? 0;

  return metas
    .filter((meta): meta is GmailMessageMeta => !!meta && isCustomerMessage(meta))
    .filter((meta) => {
      const ts = Number(meta.internalDate ?? "0");
      if (!lastTs) return true;
      return !ts || ts > lastTs;
    })
    .sort((a, b) => (Number(a.internalDate ?? "0") || 0) - (Number(b.internalDate ?? "0") || 0));
}

// Kalder gmail-create-draft-ai med intern secret så vi slipper for Clerk token
async function triggerDraft(clerkUserId: string, messageId: string) {
  if (!PROJECT_URL) throw new Error("PROJECT_URL mangler");
  if (!INTERNAL_AGENT_SECRET)
    throw new Error("INTERNAL_AGENT_SECRET mangler – kan ikke kalde gmail-create-draft-ai");
  if (!SERVICE_ROLE_KEY)
    throw new Error("SERVICE_ROLE_KEY mangler – kan ikke autorisere gmail-create-draft-ai");

  const endpoint = `${PROJECT_URL.replace(/\/$/, "")}/functions/v1/gmail-create-draft-ai`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-secret": INTERNAL_AGENT_SECRET,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ clerkUserId, messageId }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`gmail-create-draft-ai fejlede ${res.status}: ${text}`);
  }
  if (text) {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }
  return null;
}

async function resolveShopId(ownerUserId: string): Promise<string | null> {
  if (!supabase || !ownerUserId) return null;
  const { data, error } = await supabase
    .from("shops")
    .select("id")
    .eq("owner_user_id", ownerUserId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.warn("gmail-poll: failed to resolve shop id", error.message);
  }
  return data?.id ?? null;
}

async function gmailDraftExists(token: string, draftId: string): Promise<boolean | null> {
  const url = `${GMAIL_BASE}/drafts/${encodeURIComponent(draftId)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (res.status === 404) return false;
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.warn("gmail-poll: draft check failed", {
      draftId,
      status: res.status,
      body: text?.slice(0, 500) || "",
    });
    return null;
  }
  return true;
}

async function threadHasSentSince(
  token: string,
  threadId: string,
  sinceMs: number,
): Promise<boolean | null> {
  const url = `${GMAIL_BASE}/threads/${encodeURIComponent(threadId)}?format=metadata`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const text = await res.text().catch(() => "");
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  if (!res.ok) {
    console.warn("gmail-poll: thread check failed", {
      threadId,
      status: res.status,
      body: text?.slice(0, 500) || "",
    });
    return null;
  }
  const messages = Array.isArray(json?.messages) ? json.messages : [];
  return messages.some((msg: any) => {
    const labels = Array.isArray(msg?.labelIds) ? msg.labelIds : [];
    const internalDate = Number(msg?.internalDate ?? 0);
    return labels.includes("SENT") && internalDate >= sinceMs;
  });
}

async function syncDraftStatuses(shopId: string, token: string) {
  if (!supabase) return;
  const { data, error } = await supabase
    .from("drafts")
    .select("id,draft_id,thread_id,created_at")
    .eq("shop_id", shopId)
    .eq("platform", "gmail")
    .eq("status", "pending")
    .not("draft_id", "is", null);
  if (error) {
    console.warn("gmail-poll: failed to load pending drafts", error.message);
    return;
  }
  const toMarkSent: string[] = [];
  for (const row of data ?? []) {
    const draftId = (row as any)?.draft_id;
    if (!draftId) continue;
    const exists = await gmailDraftExists(token, String(draftId));
    if (exists === false) {
      toMarkSent.push((row as any).id);
      continue;
    }
    if (exists === true) {
      const threadId = (row as any)?.thread_id;
      const createdAtRaw = (row as any)?.created_at;
      const createdAtMs = Date.parse(createdAtRaw || "");
      if (threadId && Number.isFinite(createdAtMs)) {
        const sentInThread = await threadHasSentSince(token, String(threadId), createdAtMs);
        if (sentInThread === true) {
          toMarkSent.push((row as any).id);
        }
      }
    }
  }
  if (!toMarkSent.length) return;
  const { error: updateError } = await supabase
    .from("drafts")
    .update({ status: "sent" })
    .in("id", toMarkSent);
  if (updateError) {
    console.warn("gmail-poll: failed to update draft status", updateError.message);
  }
}

async function fetchMessageMeta(id: string, token: string) {
  const url = `${GMAIL_BASE}/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=List-Unsubscribe&metadataHeaders=Precedence`;
  return await fetchJson<GmailMessageMeta>(url, token).catch(() => null);
}

function isCustomerMessage(meta: GmailMessageMeta) {
  const headers = meta.payload?.headers ?? [];
  const from = findHeader(headers, "From");
  const listUnsubscribe = findHeader(headers, "List-Unsubscribe");
  const precedence = findHeader(headers, "Precedence");
  const subject = findHeader(headers, "Subject");

  if (listUnsubscribe) return false;
  if (/bulk|list|auto/i.test(precedence)) return false;
  if (/newsletter/i.test(subject)) return false;
  if (/no[- ]?reply|noreply/i.test(from)) return false;

  return true;
}

function findHeader(headers: Array<{ name: string; value: string }>, name: string) {
  return headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? "";
}

async function loadAutoDraftUsers(limit: number): Promise<AutomationUser[]> {
  if (!supabase) return [];
  const { data: automation, error } = await supabase
    .from("agent_automation")
    .select("user_id")
    .eq("auto_draft_enabled", true)
    .limit(limit);
  if (error || !automation?.length) return [];
  const userIds = automation.map((row) => row.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, clerk_user_id")
    .in("user_id", userIds);
  if (!profiles) return [];
  return profiles
    .filter((p): p is { user_id: string; clerk_user_id: string } =>
      typeof p?.user_id === "string" && typeof p?.clerk_user_id === "string",
    )
    .map((p) => ({ clerk_user_id: p.clerk_user_id, user_id: p.user_id }));
}

async function mapClerkUsers(ids: string[]): Promise<AutomationUser[]> {
  if (!supabase || !ids.length) return [];
  const { data } = await supabase
    .from("profiles")
    .select("user_id, clerk_user_id")
    .in("clerk_user_id", ids);
  if (!data) return [];
  return data
    .filter((p): p is { user_id: string; clerk_user_id: string } =>
      typeof p?.user_id === "string" && typeof p?.clerk_user_id === "string",
    )
    .map((p) => ({ clerk_user_id: p.clerk_user_id, user_id: p.user_id }));
}

async function loadPollState(clerkUserId: string): Promise<PollState | null> {
  if (!supabase) return null;
  const { data } = await supabase
    .from("gmail_poll_state")
    .select("clerk_user_id,last_message_id,last_internal_date")
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle();
  if (!data) return null;
  const rawTs = (data as any).last_internal_date;
  const parsedTs =
    typeof rawTs === "number"
      ? rawTs
      : typeof rawTs === "string"
      ? Number(rawTs)
      : null;
  return {
    clerk_user_id: data.clerk_user_id,
    last_message_id: data.last_message_id,
    last_internal_date: Number.isFinite(parsedTs) ? Number(parsedTs) : null,
  };
}

async function savePollState(clerkUserId: string, lastMessageId: string | null, lastInternalDate: number) {
  if (!supabase) return;
  await supabase.from("gmail_poll_state").upsert({
    clerk_user_id: clerkUserId,
    last_message_id: lastMessageId,
    last_internal_date: lastInternalDate,
    updated_at: new Date().toISOString(),
  });
}

async function getGmailAccessToken(clerkUserId: string) {
  const tokens = await clerk.users.getUserOauthAccessToken(clerkUserId, "oauth_google");
  let accessToken = tokens?.data?.[0]?.token ?? null;
  if (!accessToken) {
    await clerk.users.refreshUserOauthAccessToken(clerkUserId, "oauth_google");
    const refreshed = await clerk.users.getUserOauthAccessToken(clerkUserId, "oauth_google");
    accessToken = refreshed?.data?.[0]?.token ?? null;
  }
  if (!accessToken) {
    throw new Error("Ingen Gmail adgangstoken fundet for brugeren");
  }
  return accessToken;
}

async function fetchJson<T>(url: string, token: string): Promise<T> {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  if (!res.ok) {
    const message = json?.error?.message || json?.message || text || `HTTP ${res.status}`;
    throw new Error(typeof message === "string" ? message : JSON.stringify(message));
  }
  return json as T;
}

function authorize(req: Request): {
  ok: boolean;
  reason?: string;
  meta?: Record<string, unknown>;
} {
  if (!GMAIL_POLL_SECRET) {
    return { ok: false, reason: "GMAIL_POLL_SECRET missing" };
  }

  const headerName = ["x-cron-secret", "x-internal-secret"].find((key) => req.headers.has(key));
  const header =
    req.headers.get("x-cron-secret") ??
    req.headers.get("X-Cron-Secret") ??
    req.headers.get("x-internal-secret") ??
    req.headers.get("X-Internal-Secret");

  if (!header) {
    return {
      ok: false,
      reason: "Missing auth header",
      meta: {
        headerName,
        headersSeen: Array.from(req.headers.keys()),
        expectedSecret: maskSecret(GMAIL_POLL_SECRET),
      },
    };
  }
  if (header !== GMAIL_POLL_SECRET) {
    return {
      ok: false,
      reason: "Invalid secret",
      meta: {
        provided: maskSecret(header),
        expected: maskSecret(GMAIL_POLL_SECRET),
        providedLength: header.length,
        expectedLength: GMAIL_POLL_SECRET.length,
        headerName,
      },
    };
  }
  return { ok: true };
}

function maskSecret(secret: string | null) {
  if (!secret) return "(missing)";
  if (secret.length <= 4) return "*".repeat(secret.length);
  return `${secret.slice(0, 2)}...${secret.slice(-2)} (len:${secret.length})`;
}

async function readJson(req: Request) {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

function denoAssertConfig() {
  if (!supabase) {
    console.warn("gmail-poll: Supabase klient ikke initialiseret – tjek env vars");
  }
}
