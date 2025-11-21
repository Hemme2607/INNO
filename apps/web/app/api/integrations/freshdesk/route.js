"use server";

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const SUPABASE_BASE_URL =
  (process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    ""
  ).replace(/\/$/, "");
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  "";
const SUPABASE_TEMPLATE =
  process.env.NEXT_PUBLIC_CLERK_SUPABASE_TEMPLATE?.trim() ||
  process.env.EXPO_PUBLIC_CLERK_SUPABASE_TEMPLATE?.trim() ||
  "supabase";

export async function DELETE() {
  const { userId, getToken } = auth();
  if (!userId) {
    return NextResponse.json(
      { error: "Du skal være logget ind for at afbryde Freshdesk." },
      { status: 401 }
    );
  }

  if (!SUPABASE_BASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.json(
      { error: "Supabase konfiguration mangler." },
      { status: 500 }
    );
  }

  const token = await getToken({ template: SUPABASE_TEMPLATE });
  if (!token) {
    return NextResponse.json(
      { error: "Kunne ikke hente Clerk token til Supabase." },
      { status: 401 }
    );
  }

  const url = new URL("/rest/v1/integrations", SUPABASE_BASE_URL);
  url.searchParams.set("provider", "eq.freshdesk");

  const response = await fetch(url.toString(), {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: SUPABASE_ANON_KEY,
      Prefer: "return=representation",
      "Content-Type": "application/json",
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof data?.message === "string"
        ? data.message
        : typeof data?.error === "string"
        ? data.error
        : "Kunne ikke afbryde Freshdesk.";
    return NextResponse.json({ error: message }, { status: response.status });
  }

  return NextResponse.json(
    { success: true, removed: Array.isArray(data) ? data.length : 0 },
    { status: 200 }
  );
}
