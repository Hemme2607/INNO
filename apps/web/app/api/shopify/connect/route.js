
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

function stripHtml(value = "") {
  if (typeof value !== "string") return "";
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function mapPolicies(policies = []) {
  const result = {
    refund: "",
    shipping: "",
    terms: "",
  };

  policies.forEach((policy) => {
    const rawType = policy?.policy_type || policy?.handle || policy?.title || "";
    const normalized = String(rawType).toLowerCase();
    const body = stripHtml(policy?.body_html || policy?.body || "");
    if (!body) return;
    if (normalized.includes("refund")) {
      result.refund = body;
    } else if (normalized.includes("shipping")) {
      result.shipping = body;
    } else if (normalized.includes("terms")) {
      result.terms = body;
    }
  });

  return result;
}

async function fetchShopifyPolicies({ domain, accessToken }) {
  const url = `https://${domain}/admin/api/${SHOPIFY_API_VERSION}/policies.json`;
  const res = await fetch(url, {
    headers: {
      "X-Shopify-Access-Token": accessToken,
      Accept: "application/json",
    },
  });
  const payload = await res.json().catch(async () => {
    const txt = await res.text().catch(() => "");
    return txt ? { error: txt } : {};
  });
  if (!res.ok) {
    const msg =
      payload?.errors ||
      payload?.error ||
      payload?.error_description ||
      res.statusText ||
      `Shopify policies gav status ${res.status}`;
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  const policies = Array.isArray(payload?.policies) ? payload.policies : [];
  return mapPolicies(policies);
}

export async function POST(request) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "You must be signed in to connect Shopify." }, { status: 401 });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL is missing on the server." },
      { status: 500 }
    );
  }
  if (!SHOPIFY_TOKEN_KEY) {
    return NextResponse.json({ error: "SHOPIFY_TOKEN_KEY is missing on the server." }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));
  const domainInput = body?.domain || body?.shop_domain || body?.shopDomain || "";
  const accessToken = body?.accessToken || body?.access_token || "";

  const domain = normalizeDomain(domainInput);
  if (!domain) {
    return NextResponse.json({ error: "Enter your Shopify domain." }, { status: 400 });
  }
  if (!accessToken) {
    return NextResponse.json({ error: "Enter your Shopify Admin API access token." }, { status: 400 });
  }

  const supabase = createServiceClient();

  try {
    const supabaseUserId = await getSupabaseUserId(supabase, userId);
    if (!supabaseUserId) {
      return NextResponse.json(
        { error: "Could not find a Supabase profile for the user. Log out/in and try again." },
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
        `Shopify returned status ${shopResponse.status}.`;
      return NextResponse.json({ error: msg }, { status: 401 });
    }

    const { error: upsertError } = await supabase.rpc("upsert_shop", {
      p_owner_user_id: supabaseUserId,
      p_domain: domain,
      p_access_token: accessToken,
      p_secret: SHOPIFY_TOKEN_KEY,
    });
    if (upsertError) {
      return NextResponse.json(
        { error: upsertError.message || "Could not save Shopify connection." },
        { status: 500 }
      );
    }

    // Hent politikker med det samme og gem dem i shops.
    let policies = null;
    try {
      policies = await fetchShopifyPolicies({ domain, accessToken });
      await supabase
        .from("shops")
        .update({
          policy_refund: policies.refund || null,
          policy_shipping: policies.shipping || null,
          policy_terms: policies.terms || null,
          platform: "shopify",
        })
        .eq("owner_user_id", supabaseUserId)
        .eq("shop_domain", domain);
    } catch (policyError) {
      console.warn("Could not fetch/save Shopify policies on connect:", policyError);
    }

    return NextResponse.json(
      { success: true, domain, shop: shopPayload?.shop ?? null, policies },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error while connecting to Shopify.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
