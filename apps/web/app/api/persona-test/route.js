
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const SUPABASE_EDGE_BASE =
  (process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    ""
  ).replace(/\/$/, "");

export async function POST(request) {
  const { getToken, userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  if (!SUPABASE_EDGE_BASE) {
    return NextResponse.json(
      { error: "Supabase URL is missing from environment variables." },
      { status: 500 }
    );
  }

  const token = await getToken();
  if (!token) {
    return NextResponse.json(
      { error: "Could not fetch Clerk session token." },
      { status: 401 }
    );
  }

  const body = (await request.json().catch(() => ({}))) ?? {};
  const { signature = "", scenario = "", instructions = "" } = body;

  const payload = {
    signature,
    scenario,
    instructions,
  };

  const response = await fetch(`${SUPABASE_EDGE_BASE}/functions/v1/persona-test`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMessage =
      typeof data?.error === "string" ? data.error : "Persona test failed.";
    return NextResponse.json({ error: errorMessage }, { status: response.status });
  }

  return NextResponse.json(data, { status: 200 });
}
