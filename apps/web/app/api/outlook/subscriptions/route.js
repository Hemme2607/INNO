"use server";

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  buildClientState,
  createInboxSubscription,
  renewSubscription,
  getMicrosoftAccessToken,
} from "@/lib/outlook";

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

const WEBHOOK_HOST =
  process.env.OUTLOOK_WEBHOOK_HOST ||
  process.env.MICROSOFT_WEBHOOK_HOST ||
  process.env.NEXT_PUBLIC_OUTLOOK_WEBHOOK_HOST ||
  "";

function decodeSupabaseUserId(token) {
  if (!token || !token.includes(".")) return null;
  const [, payload] = token.split(".");
  if (!payload) return null;
  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "="
    );
    const decoded = Buffer.from(padded, "base64").toString("utf8");
    const json = JSON.parse(decoded);
    return json?.sub || null;
  } catch (_err) {
    return null;
  }
}

async function persistIntegration({ token, payload }) {
  if (!token || !SUPABASE_BASE_URL || !SUPABASE_ANON_KEY) {
    return { ok: false, error: "Supabase config missing" };
  }
  const response = await fetch(`${SUPABASE_BASE_URL}/rest/v1/integrations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: SUPABASE_ANON_KEY,
      Prefer: "resolution=merge-duplicates,return=representation",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data };
}

export async function POST(request) {
  const { userId, getToken } = auth();
  if (!userId) {
    return NextResponse.json(
      { error: "Du skal være logget ind for at oprette overvågning." },
      { status: 401 }
    );
  }

  if (!WEBHOOK_HOST) {
    return NextResponse.json(
      {
        error:
          "OUTLOOK_WEBHOOK_HOST mangler. Sæt den til din offentlige base-URL (fx https://api.sona.ai).",
      },
      { status: 500 }
    );
  }

  const notificationUrl = new URL("/api/outlook/webhook", WEBHOOK_HOST).toString();
  const accessToken = await getMicrosoftAccessToken(userId);
  if (!accessToken) {
    return NextResponse.json(
      {
        error:
          "Kunne ikke hente Microsoft adgangstoken fra Clerk. Tjek at Microsoft login er aktiveret og scopes er godkendt.",
      },
      { status: 401 }
    );
  }

  let subscription;
  try {
    const clientState = buildClientState(userId);
    subscription = await createInboxSubscription({
      accessToken,
      notificationUrl,
      clientState,
    });
  } catch (error) {
    console.error("Create subscription failed:", error);
    return NextResponse.json(
      { error: error?.message || "Kunne ikke oprette subscription." },
      { status: 500 }
    );
  }

  // Forsøg at gemme subscription metadata i Supabase (valgfrit men praktisk for UI/fornyelse).
  let saved = false;
  let supabaseError = null;
  try {
    const supabaseToken = await getToken({ template: SUPABASE_TEMPLATE });
    const supabaseUserId = decodeSupabaseUserId(supabaseToken);
    if (supabaseToken && supabaseUserId) {
      const payload = {
        user_id: supabaseUserId,
        provider: "outlook",
        is_active: true,
        config: {
          subscription_id: subscription?.id,
          resource: subscription?.resource,
          expires_at: subscription?.expirationDateTime,
          notification_url: notificationUrl,
          client_state: subscription?.clientState,
        },
        updated_at: new Date().toISOString(),
      };
      const result = await persistIntegration({
        token: supabaseToken,
        payload,
      });
      saved = result.ok;
      if (!result.ok) {
        supabaseError =
          result?.data?.message ||
          result?.data?.error ||
          `Supabase status ${result?.status}`;
      }
    }
  } catch (error) {
    supabaseError = error?.message;
    console.warn("Gem Outlook subscription i Supabase fejlede:", error);
  }

  return NextResponse.json(
    {
      subscription,
      savedToSupabase: saved,
      supabaseError,
    },
    { status: 200 }
  );
}

export async function PATCH(request) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json(
      { error: "Du skal være logget ind for at forny overvågning." },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const subscriptionId = body?.subscriptionId || body?.id;
  if (!subscriptionId) {
    return NextResponse.json(
      { error: "subscriptionId mangler i body." },
      { status: 400 }
    );
  }

  const accessToken = await getMicrosoftAccessToken(userId);
  if (!accessToken) {
    return NextResponse.json(
      { error: "Kunne ikke hente Microsoft token." },
      { status: 401 }
    );
  }

  try {
    const updated = await renewSubscription({ accessToken, subscriptionId });
    return NextResponse.json({ subscription: updated }, { status: 200 });
  } catch (error) {
    console.error("Renew subscription failed:", error);
    return NextResponse.json(
      { error: error?.message || "Kunne ikke forny subscription." },
      { status: 500 }
    );
  }
}
