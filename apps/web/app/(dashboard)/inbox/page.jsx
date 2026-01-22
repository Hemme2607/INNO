import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { InboxFilters } from "@/components/inbox/InboxFilters";

const SUPABASE_URL =
  (process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    "").replace(/\/$/, "");
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  "";

function createServiceClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

async function resolveSupabaseUserId(serviceClient, clerkUserId) {
  const { data, error } = await serviceClient
    .from("profiles")
    .select("user_id")
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.user_id ?? null;
}

async function loadMailboxes(serviceClient, userId) {
  const { data, error } = await serviceClient
    .from("mail_accounts")
    .select("id, provider, provider_email")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return Array.isArray(data) ? data : [];
}

async function loadMessages(serviceClient, userId, mailboxIds, { query, unreadOnly }) {
  let request = serviceClient
    .from("mail_messages")
    .select(
      "id, mailbox_id, thread_id, subject, snippet, from_name, from_email, is_read, received_at, sent_at, created_at"
    )
    .eq("user_id", userId)
    .in("mailbox_id", mailboxIds)
    .order("received_at", { ascending: false, nullsLast: true })
    .limit(60);

  if (unreadOnly) {
    request = request.eq("is_read", false);
  }

  if (query) {
    const escaped = query.replace(/%/g, "\\%").replace(/_/g, "\\_");
    request = request.or(
      `subject.ilike.%${escaped}%,snippet.ilike.%${escaped}%,from_name.ilike.%${escaped}%,from_email.ilike.%${escaped}%`
    );
  }

  const { data, error } = await request;
  if (error) throw new Error(error.message);
  return Array.isArray(data) ? data : [];
}

function formatMessageTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 1) {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getSenderLabel(message) {
  if (message.from_name) return message.from_name;
  if (message.from_email) return message.from_email;
  return "Unknown sender";
}

export default async function InboxPage({ searchParams }) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in?redirect_url=/inbox");
  }

  const serviceClient = createServiceClient();
  const query = typeof searchParams?.q === "string" ? searchParams.q.trim() : "";
  const unreadOnly = searchParams?.unread === "1";
  let mailboxes = [];
  let messages = [];

  if (serviceClient) {
    try {
      const supabaseUserId = await resolveSupabaseUserId(serviceClient, userId);
      if (supabaseUserId) {
        mailboxes = await loadMailboxes(serviceClient, supabaseUserId);
        const mailboxIds = mailboxes.map((mailbox) => mailbox.id);
        if (mailboxIds.length) {
          messages = await loadMessages(serviceClient, supabaseUserId, mailboxIds, {
            query,
            unreadOnly,
          });
        }
      }
    } catch (error) {
      console.error("Inbox mail lookup failed:", error);
    }
  }

  if (!mailboxes.length) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="max-w-md text-center">
          <h2 className="text-xl font-semibold text-slate-900">Connect a mailbox</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            You need to connect a support inbox before Sona can fetch your emails.
          </p>
          <Button asChild className="mt-4">
            <Link href="/mailboxes">Go to Mailboxes</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden bg-background">
      <aside className="w-full max-w-sm border-r bg-background">
        <div className="border-b p-4">
          <InboxFilters initialQuery={query} initialUnread={unreadOnly} />
        </div>
        <div className="h-[calc(100vh-9rem)] overflow-y-auto">
          {messages.length ? (
            <div className="divide-y">
              {messages.map((message) => {
                const timestamp =
                  message.received_at || message.sent_at || message.created_at;
                const sender = getSenderLabel(message);
                return (
                  <button
                    key={message.id}
                    type="button"
                    className={cn(
                      "flex w-full flex-col gap-2 px-4 py-3 text-left transition hover:bg-muted/40",
                      message.is_read ? "bg-background" : "bg-muted/20"
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate text-sm font-semibold text-slate-900">
                        {sender}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatMessageTime(timestamp)}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-slate-800">
                      {message.subject || "No subject"}
                    </div>
                    <div className="line-clamp-2 text-xs text-muted-foreground">
                      {message.snippet || "No preview available."}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="px-6 py-10 text-sm text-muted-foreground">
              No messages yet. Sync will appear here once your mailbox is processed.
            </div>
          )}
        </div>
      </aside>

      <section className="hidden flex-1 flex-col p-6 lg:flex">
        <div className="flex h-full min-h-[480px] items-center justify-center rounded-xl border border-dashed border-muted-foreground/30 bg-muted/20 p-8 text-center">
          <span className="text-sm font-medium uppercase tracking-wide text-slate-400">
            Coming soon
          </span>
        </div>
      </section>
    </div>
  );
}
