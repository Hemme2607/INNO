"use server";

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
const SHOPIFY_TOKEN_KEY = process.env.SHOPIFY_TOKEN_KEY || "";

const SHOPIFY_API_VERSION = "2024-07"; // holder match med edge functions

function normalizeDomain(value = "") {
  const trimmed = value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "");
  if (!trimmed) return "";
  if (trimmed.includes(".")) return trimmed;
  return `${trimmed}.myshopify.com`;
}

function createServiceClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

async function getSupabaseUserId(client, clerkUserId) {
  const { data, error } = await client
    .from("profiles")
    .select("user_id")
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.user_id ?? null;
}

export async function POST(request) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Du skal være logget ind for at forbinde Shopify." }, { status: 401 });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY eller SUPABASE_URL mangler på serveren." },
      { status: 500 }
    );
  }
  if (!SHOPIFY_TOKEN_KEY) {
    return NextResponse.json({ error: "SHOPIFY_TOKEN_KEY mangler på serveren." }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));
  const domainInput = body?.domain || body?.shop_domain || body?.shopDomain || "";
  const accessToken = body?.accessToken || body?.access_token || "";

  const domain = normalizeDomain(domainInput);
  if (!domain) {
    return NextResponse.json({ error: "Angiv dit Shopify domæne." }, { status: 400 });
  }
  if (!accessToken) {
    return NextResponse.json({ error: "Angiv dit Shopify Admin API access token." }, { status: 400 });
  }

  const supabase = createServiceClient();

  try {
    const supabaseUserId = await getSupabaseUserId(supabase, userId);
    if (!supabaseUserId) {
      return NextResponse.json(
        { error: "Kunne ikke finde Supabase-profil for brugeren. Log ud/ind og prøv igen." },
        { status: 404 }
      );
    }

    // Valider credentials mod Shopify, så vi kan give klar feedback.
    const shopUrl = `https://${domain}/admin/api/${SHOPIFY_API_VERSION}/shop.json`;
    const shopResponse = await fetch(shopUrl, {
      headers: {
        Accept: "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
    });
    const shopPayload = await shopResponse.json().catch(async () => {
      const txt = await shopResponse.text().catch(() => "");
      return txt ? { error: txt } : {};
    });

    if (!shopResponse.ok) {
      const msg =
        shopPayload?.errors ||
        shopPayload?.error ||
        shopPayload?.error_description ||
        shopResponse.statusText ||
        `Shopify returnerede status ${shopResponse.status}.`;
      return NextResponse.json({ error: msg }, { status: 401 });
    }

    const { error: upsertError } = await supabase.rpc("upsert_shop", {
      p_owner_user_id: supabaseUserId,
      p_domain: domain,
      p_access_token: accessToken,
      p_secret: SHOPIFY_TOKEN_KEY,
    });
    if (upsertError) {
      return NextResponse.json({ error: upsertError.message || "Kunne ikke gemme Shopify forbindelse." }, { status: 500 });
    }

    return NextResponse.json(
      { success: true, domain, shop: shopPayload?.shop ?? null },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ukendt fejl ved forbindelse til Shopify.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
