import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const SUPABASE_BASE_URL =
  (process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    "").replace(/\/$/, "");
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  "";

function createServiceClient() {
  if (!SUPABASE_BASE_URL || !SUPABASE_SERVICE_KEY) return null;
  return createClient(SUPABASE_BASE_URL, SUPABASE_SERVICE_KEY);
}

async function resolveSupabaseUserId(serviceClient, clerkUserId) {
  const { data, error } = await serviceClient
    .from("profiles")
    .select("user_id")
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data?.user_id) throw new Error("Supabase user not found for this Clerk user.");
  return data.user_id;
}

export async function POST(request) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const enabled = Boolean(body?.enabled);

  const serviceClient = createServiceClient();
  if (!serviceClient) {
    return NextResponse.json(
      { error: "Supabase service configuration is missing." },
      { status: 500 }
    );
  }

  let supabaseUserId = null;
  try {
    supabaseUserId = await resolveSupabaseUserId(serviceClient, userId);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Supabase user lookup failed." },
      { status: 500 }
    );
  }

  const status = enabled ? "active" : "inactive";
  const { error } = await serviceClient
    .from("mail_accounts")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("user_id", supabaseUserId)
    .in("provider", ["gmail", "outlook", "imap"]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, status });
}
