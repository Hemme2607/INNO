import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  (process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    "").replace(/\/$/, "");
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  "";
const INTERNAL_SECRET =
  process.env.INTERNAL_AGENT_SECRET ||
  process.env.GMAIL_POLL_SECRET ||
  process.env.OUTLOOK_POLL_SECRET ||
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

async function triggerFunction(functionName, supabaseUserId) {
  const endpoint = `${SUPABASE_URL}/functions/v1/${functionName}`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Internal-Secret": INTERNAL_SECRET,
    },
    body: JSON.stringify({ userId: supabaseUserId, userLimit: 1 }),
  });
  const payloadText = await res.text();
  let payload = null;
  try {
    payload = payloadText ? JSON.parse(payloadText) : null;
  } catch {
    payload = payloadText;
  }
  if (!res.ok) {
    return { ok: false, status: res.status, error: payload || "Unknown error" };
  }
  return { ok: true, status: res.status, data: payload };
}

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "Supabase service configuration is missing." },
      { status: 500 }
    );
  }

  if (!INTERNAL_SECRET) {
    return NextResponse.json(
      { error: "Internal poll secret is missing." },
      { status: 500 }
    );
  }

  const serviceClient = createServiceClient();
  if (!serviceClient) {
    return NextResponse.json(
      { error: "Supabase service client could not be created." },
      { status: 500 }
    );
  }

  let supabaseUserId = null;
  try {
    supabaseUserId = await resolveSupabaseUserId(serviceClient, userId);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!supabaseUserId) {
    return NextResponse.json({ error: "Supabase user not found." }, { status: 404 });
  }

  const [gmailResult, outlookResult] = await Promise.all([
    triggerFunction("gmail-poll", supabaseUserId),
    triggerFunction("outlook-poll", supabaseUserId),
  ]);

  const ok = gmailResult.ok || outlookResult.ok;
  return NextResponse.json(
    {
      success: ok,
      results: {
        gmail: gmailResult,
        outlook: outlookResult,
      },
    },
    { status: ok ? 200 : 500 }
  );
}
