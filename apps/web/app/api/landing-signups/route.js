
import { NextResponse } from "next/server";
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

const TABLE = "landing_signups";

function createServiceClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

export async function POST(req) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const source = typeof body?.source === "string" ? body.source.slice(0, 120) : null;

  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });
  }

  const { error } = await supabase
    .from(TABLE)
    .upsert(
      { email, source },
      {
        onConflict: "email",
        ignoreDuplicates: false,
      }
    );

  if (error) {
    console.error("landing-signup insert failed", error);
    return NextResponse.json({ error: "Could not save email right now" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
