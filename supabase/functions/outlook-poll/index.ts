// supabase/functions/outlook-poll/index.ts
import { createClerkClient } from "https://esm.sh/@clerk/backend@1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";
const EDGE_DEBUG_LOGS = Deno.env.get("EDGE_DEBUG_LOGS") === "true";
const emitDebugLog = (...args: Array<unknown>) => {
  if (EDGE_DEBUG_LOGS) {
    console.log(...args);
  }
};

// Konfiguration (brug samme model som gmail-poll)
const PROJECT_URL = Deno.env.get("PROJECT_URL") ?? Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY =
  Deno.env.get("SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const CLERK_SECRET_KEY = Deno.env.get("CLERK_SECRET_KEY");
const INTERNAL_AGENT_SECRET = Deno.env.get("INTERNAL_AGENT_SECRET");
const OUTLOOK_POLL_SECRET = Deno.env.get("OUTLOOK_POLL_SECRET") ?? INTERNAL_AGENT_SECRET;
const MAX_USERS_PER_RUN = Number(Deno.env.get("OUTLOOK_POLL_MAX_USERS") ?? "5");
const MAX_MESSAGES_PER_USER = Number(Deno.env.get("OUTLOOK_POLL_MAX_MESSAGES") ?? "3");

if (!PROJECT_URL) console.warn("PROJECT_URL mangler – outlook-poll kan ikke kalde edge functions.");
if (!SERVICE_ROLE_KEY) console.warn("SERVICE_ROLE_KEY mangler – outlook-poll kan ikke læse tabeller.");
if (!CLERK_SECRET_KEY) console.warn("CLERK_SECRET_KEY mangler – outlook-poll kan ikke hente tokens.");
if (!INTERNAL_AGENT_SECRET)
  console.warn("INTERNAL_AGENT_SECRET mangler – kald til outlook-create-draft-ai kan ikke sikres.");
if (!OUTLOOK_POLL_SECRET)
  console.warn("OUTLOOK_POLL_SECRET mangler – outlook-poll er ikke beskyttet mod offentlige kald.");

const clerk = createClerkClient({ secretKey: CLERK_SECRET_KEY! });
const supabase =
  PROJECT_URL && SERVICE_ROLE_KEY ? createClient(PROJECT_URL, SERVICE_ROLE_KEY) : null;

type AutomationUser = {
  clerk_user_id: string;
  user_id: string;
};

type PollState = {
  clerk_user_id: string;
  last_message_id: string | null;
  last_received_ts: number | null;
};

type GraphMessageMeta = {
  id?: string;
  subject?: string;
  from?: { emailAddress?: { address?: string; name?: string } };
  receivedDateTime?: string;
  isDraft?: boolean;
  isRead?: boolean;
};

denoAssertConfig();

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
    if (!isAuthorized(req)) return new Response("Unauthorized", { status: 401 });

    const body = await readJson(req);
    const explicitUsers: string[] | null = Array.isArray(body?.clerkUserIds)
      ? body.clerkUserIds.filter((id: unknown) => typeof id === "string")
      : null;

    const targets = explicitUsers?.length
      ? await mapClerkUsers(explicitUsers)
      : await loadAutoDraftUsers(
          Math.min(MAX_USERS_PER_RUN, Number(body?.userLimit ?? MAX_USERS_PER_RUN)),
        );

    const results = [] as Array<Record<string, unknown>>;
    for (const target of targets) {
      const outcome = await pollSingleUser(target);
      results.push(outcome);
    }

    return Response.json({ success: true, processed: results.length, results });
  } catch (err: any) {
    console.error("outlook-poll error", err?.message || err);
    return new Response(JSON.stringify({ error: err?.message || "Ukendt fejl" }), {
      status: typeof err?.status === "number" ? err.status : 500,
    });
  }
});

// Poller enkelt bruger: henter nye mails og trigger draft-funktion
async function pollSingleUser(user: AutomationUser) {
  if (!supabase) throw new Error("Supabase klient ikke konfigureret");
  try {
    const token = await getOutlookAccessToken(user.clerk_user_id);
    const state = await loadPollState(user.clerk_user_id);
    const candidates = await fetchCandidateMessages(token, state);

    let processed = 0;
    let maxTs = state?.last_received_ts ?? 0;
    for (const msg of candidates) {
      if (processed >= MAX_MESSAGES_PER_USER) break;
      if (!msg?.id) continue;
      await triggerDraft(user.clerk_user_id, msg.id);
      processed += 1;
      const ts = Date.parse(msg.receivedDateTime ?? "") || 0;
      if (ts > maxTs) maxTs = ts;
    }

    if (processed && maxTs) {
      await savePollState(
        user.clerk_user_id,
        candidates[candidates.length - 1]?.id ?? null,
        maxTs,
      );
    }

    emitDebugLog("outlook-poll", user.clerk_user_id, {
      candidates: candidates.length,
      drafts: processed,
      maxReceivedTs: maxTs,
    });

    return {
      clerkUserId: user.clerk_user_id,
      supabaseUserId: user.user_id,
      candidates: candidates.length,
      draftsCreated: processed,
    };
  } catch (err: any) {
    console.warn("outlook-poll user failed", user.clerk_user_id, err?.message || err);
    return {
      clerkUserId: user.clerk_user_id,
      supabaseUserId: user.user_id,
      error: err?.message || String(err),
    };
  }
}

async function fetchCandidateMessages(token: string, state: PollState | null) {
  const url = new URL(`${GRAPH_BASE}/me/mailFolders('Inbox')/messages`);
  url.searchParams.set("$top", "20");
  url.searchParams.set("$select", "id,subject,from,receivedDateTime,isDraft,isRead");
  url.searchParams.set("$orderby", "receivedDateTime desc");
  if (state?.last_received_ts) {
    const iso = new Date(state.last_received_ts).toISOString();
    url.searchParams.set("$filter", `receivedDateTime gt ${iso}`);
  }

  const { value = [] } = await fetchJson<{ value?: GraphMessageMeta[] }>(
    url.toString(),
    token,
  );

  const lastTs = state?.last_received_ts ?? 0;
  const filtered = value
    .filter((m) => !m?.isDraft)
    .filter((m) => {
      const from = (m?.from?.emailAddress?.address || "").toLowerCase();
      const subject = (m?.subject || "").toLowerCase();
      if (from.includes("no-reply") || from.includes("noreply")) return false;
      if (subject.includes("newsletter")) return false;
      return true;
    })
    .filter((m) => {
      const ts = Date.parse(m?.receivedDateTime ?? "") || 0;
      if (!lastTs) return true;
      return ts > lastTs;
    })
    .sort((a, b) => {
      const ta = Date.parse(a.receivedDateTime ?? "") || 0;
      const tb = Date.parse(b.receivedDateTime ?? "") || 0;
      return ta - tb;
    });

  return filtered;
}

async function triggerDraft(clerkUserId: string, messageId: string) {
  if (!PROJECT_URL) throw new Error("PROJECT_URL mangler");
  if (!INTERNAL_AGENT_SECRET)
    throw new Error("INTERNAL_AGENT_SECRET mangler – kan ikke kalde outlook-create-draft-ai");

  const endpoint = `${PROJECT_URL.replace(/\/$/, "")}/functions/v1/outlook-create-draft-ai`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-secret": INTERNAL_AGENT_SECRET,
    },
    body: JSON.stringify({ userId: clerkUserId, messageId }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`outlook-create-draft-ai fejlede ${res.status}: ${text}`);
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

async function getOutlookAccessToken(clerkUserId: string) {
  const tokens = await clerk.users.getUserOauthAccessToken(clerkUserId, "oauth_microsoft");
  let accessToken = tokens?.data?.[0]?.token ?? null;
  if (!accessToken) {
    await clerk.users.refreshUserOauthAccessToken(clerkUserId, "oauth_microsoft");
    const refreshed = await clerk.users.getUserOauthAccessToken(clerkUserId, "oauth_microsoft");
    accessToken = refreshed?.data?.[0]?.token ?? null;
  }
  if (!accessToken) {
    throw new Error("Ingen Outlook adgangstoken fundet for brugeren");
  }
  return accessToken;
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
    .from("outlook_poll_state")
    .select("clerk_user_id,last_message_id,last_received_ts")
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle();
  if (!data) return null;
  const rawTs = (data as any).last_received_ts;
  const parsedTs =
    typeof rawTs === "number"
      ? rawTs
      : typeof rawTs === "string"
      ? Number(rawTs)
      : null;
  return {
    clerk_user_id: (data as any).clerk_user_id,
    last_message_id: (data as any).last_message_id ?? null,
    last_received_ts: Number.isFinite(parsedTs) ? Number(parsedTs) : null,
  };
}

async function savePollState(
  clerkUserId: string,
  lastMessageId: string | null,
  lastReceivedTs: number,
) {
  if (!supabase) return;
  await supabase.from("outlook_poll_state").upsert({
    clerk_user_id: clerkUserId,
    last_message_id: lastMessageId,
    last_received_ts: lastReceivedTs,
    updated_at: new Date().toISOString(),
  });
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

function isAuthorized(req: Request) {
  if (!OUTLOOK_POLL_SECRET) return false;
  const header =
    req.headers.get("x-cron-secret") ??
    req.headers.get("X-Cron-Secret") ??
    req.headers.get("x-internal-secret") ??
    req.headers.get("X-Internal-Secret");
  return header === OUTLOOK_POLL_SECRET;
}

async function readJson(req: Request) {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

function denoAssertConfig() {
  // no-op placeholder for parity med gmail-poll
}
