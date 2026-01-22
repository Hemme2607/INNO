import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { ChevronDown } from "lucide-react";

import { DashboardPageShell } from "@/components/dashboard-page-shell";
import { MailboxRow } from "@/components/mailboxes/MailboxRow";
import { MailboxesHelpCard } from "@/components/mailboxes/MailboxesHelpCard";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

async function loadMailAccounts(serviceClient, userId) {
  const { data, error } = await serviceClient
    .from("mail_accounts")
    .select("provider, provider_email")
    .eq("user_id", userId)
    .in("provider", ["gmail", "outlook"])
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return Array.isArray(data) ? data : [];
}

export default async function MailboxesPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in?redirect_url=/mailboxes");
  }

  const serviceClient = createServiceClient();
  let mailAccounts = [];
  if (serviceClient) {
    try {
      const supabaseUserId = await resolveSupabaseUserId(serviceClient, userId);
      if (supabaseUserId) {
        mailAccounts = await loadMailAccounts(serviceClient, supabaseUserId);
      }
    } catch (error) {
      console.error("Mailboxes mail account lookup failed:", error);
    }
  }

  const providerOrder = { gmail: 0, outlook: 1 };
  const mailboxes = mailAccounts
    .filter((account) => account?.provider)
    .sort(
      (a, b) =>
        (providerOrder[a.provider] ?? 99) - (providerOrder[b.provider] ?? 99)
    )
    .map((account) => ({
      provider: account.provider,
      email: account.provider_email || "",
      isActive: Boolean(account.provider_email),
    }));

  return (
    <DashboardPageShell className="space-y-10">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold">Mailboxes</h1>
          <p className="text-sm text-muted-foreground">
            Manage the email accounts Sona uses to draft replies.
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="w-full justify-between lg:w-auto">
              Add Mail
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem asChild>
              <Link href="/api/integrations/gmail/auth">Connect Gmail</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/api/integrations/outlook/auth">Connect Outlook</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Connected accounts
          </h2>
          <p className="text-sm text-muted-foreground">
            Gmail and Outlook inboxes currently linked to Sona.
          </p>
        </div>
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          {mailboxes.length ? (
            <div className="divide-y">
              {mailboxes.map((mailbox) => (
                <MailboxRow
                  key={`${mailbox.provider}-${mailbox.email}`}
                  provider={mailbox.provider}
                  email={mailbox.email}
                  isActive={mailbox.isActive}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
              <p className="text-base font-medium text-slate-900">
                No mailboxes connected yet. Connect your support email to start
                generating drafts.
              </p>
            </div>
          )}
        </div>
      </section>

      <section>
        <MailboxesHelpCard />
      </section>
    </DashboardPageShell>
  );
}
