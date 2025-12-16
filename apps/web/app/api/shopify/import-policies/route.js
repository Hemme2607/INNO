"use server";

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_BASE_URL =
  (process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    "").replace(/\/$/, "");
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  "";
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  "";
const SHOPIFY_TOKEN_KEY = process.env.SHOPIFY_TOKEN_KEY || "";
const SUPABASE_TEMPLATE =
  process.env.NEXT_PUBLIC_CLERK_SUPABASE_TEMPLATE?.trim() ||
  process.env.EXPO_PUBLIC_CLERK_SUPABASE_TEMPLATE?.trim() ||
  "supabase";

const SHOPIFY_API_VERSION = "2024-01";

function normalizeDomain(input = "") {
  const trimmed = input.trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  if (!trimmed) return "";
  if (trimmed.includes(".")) return trimmed;
  // Hvis brugeren kun har angivet shop-navnet, tilføj standard Shopify-domænet.
  return `${trimmed}.myshopify.com`;
}

function createServiceSupabase() {
  if (!SUPABASE_BASE_URL || !SUPABASE_SERVICE_KEY) return null;
  return createClient(SUPABASE_BASE_URL, SUPABASE_SERVICE_KEY);
}

function createUserSupabase(token) {
  if (!SUPABASE_BASE_URL || !SUPABASE_ANON_KEY || !token) return null;
  return createClient(SUPABASE_BASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

async function resolveSupabaseUserId(serviceClient, clerkUserId) {
  if (!serviceClient || !clerkUserId) return null;
  const { data, error } = await serviceClient
    .from("profiles")
    .select("user_id")
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle();
  if (error) throw new Error(`Kunne ikke slå Supabase bruger op: ${error.message}`);
  return data?.user_id ?? null;
}

async function fetchShopCredentials(serviceClient, supabaseUserId) {
  if (!serviceClient || !supabaseUserId || !SHOPIFY_TOKEN_KEY) return null;
  const { data, error } = await serviceClient
    .rpc("get_shop_credentials_for_user", {
      p_owner_user_id: supabaseUserId,
      p_secret: SHOPIFY_TOKEN_KEY,
    })
    .maybeSingle();
  if (error) throw new Error(`Kunne ikke hente Shopify credentials: ${error.message}`);
  return data;
}

async function fetchShopRowService(serviceClient, supabaseUserId) {
  if (!serviceClient || !supabaseUserId) return { data: null, error: null };
  const { data, error } = await serviceClient
    .from("shops")
    .select("id, shop_domain, policy_refund, policy_shipping, policy_terms, internal_tone")
    .eq("owner_user_id", supabaseUserId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return { data: null, error };
  return { data, error: null };
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

async function getShopRecord({ token }) {
  if (!token) return { data: null, error: "auth_missing" };

  if (!SUPABASE_BASE_URL || !SUPABASE_ANON_KEY) {
    return { data: null, error: "supabase_config_missing" };
  }

  const url = new URL("/rest/v1/shops", SUPABASE_BASE_URL);
  url.searchParams.set(
    "select",
    [
      "id",
      "shop_domain",
      "policy_refund",
      "policy_shipping",
      "policy_terms",
      "internal_tone",
    ].join(",")
  );
  url.searchParams.set("order", "created_at.desc");
  url.searchParams.set("limit", "1");

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: SUPABASE_ANON_KEY,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const message =
      payload?.message ||
      payload?.error ||
      payload?.hint ||
      `Kunne ikke hente butik (status ${response.status}).`;
    return { data: null, error: `${message}` };
  }

  const list = await response.json().catch(() => []);
  const record = Array.isArray(list) && list.length > 0 ? list[0] : null;
  if (!record) {
    return { data: null, error: "Ingen Shopify butik fundet. Forbind i Integrations først." };
  }
  return { data: record, error: null };
}

function mapPolicies(policies = []) {
  const result = {
    refund: "",
    shipping: "",
    terms: "",
    found: [],
  };

  policies.forEach((policy) => {
    const rawType =
      policy?.policy_type ||
      policy?.handle ||
      policy?.title ||
      "";
    const normalizedType = String(rawType).toLowerCase();
    const body = stripHtml(policy?.body_html || policy?.body || "");
    if (!body) return;

    if (normalizedType.includes("refund")) {
      result.refund = body;
      result.found.push("refund");
    } else if (normalizedType.includes("shipping")) {
      result.shipping = body;
      result.found.push("shipping");
    } else if (normalizedType.includes("terms")) {
      result.terms = body;
      result.found.push("terms");
    }
  });

  return result;
}

export async function POST(request) {
  const { userId, getToken } = auth();
  if (!userId) {
    return NextResponse.json(
      { error: "Du skal være logget ind for at hente politikker." },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const bodyDomain = body?.shop_domain || body?.shopDomain || body?.domain || null;
  const bodyToken = body?.access_token || body?.accessToken || body?.token || null;

  const supabaseToken =
    (await getToken({ template: SUPABASE_TEMPLATE })) || (await getToken());

  let shop = null;
  let shopError = null;
  let decrypted = null;

  // Forsøg at hente dekrypteret token via service role (samme som edge functions gør).
  let supabaseUserId = null;
  if (SUPABASE_SERVICE_KEY && SHOPIFY_TOKEN_KEY) {
    try {
      const serviceClient = createServiceSupabase();
      supabaseUserId = await resolveSupabaseUserId(serviceClient, userId);
      if (supabaseUserId) {
        decrypted = await fetchShopCredentials(serviceClient, supabaseUserId);
        if (!bodyDomain || !bodyToken) {
          const { data: shopRow } = await fetchShopRowService(serviceClient, supabaseUserId);
          if (shopRow) {
            shop = shopRow;
          }
        }
      }
    } catch (error) {
      console.warn("Dekryptering af Shopify token fejlede:", error);
    }
  }
  // Fallback: prøv med brugerens RLS-token, hvis service role ikke virkede.
  if (!decrypted && !bodyToken && SHOPIFY_TOKEN_KEY && supabaseToken) {
    try {
      const userClient = createUserSupabase(supabaseToken);
      if (userClient) {
        const { data, error } = await userClient
          .rpc("get_shop_credentials_for_user", {
            p_owner_user_id: null, // RLS i funktionen bør sikre current_user
            p_secret: SHOPIFY_TOKEN_KEY,
          })
          .maybeSingle();
        if (!error && data) {
          decrypted = data;
        }
      }
    } catch (error) {
      console.warn("Dekryptering via RLS-token fejlede:", error);
    }
  }
  // Kun slå Supabase op hvis vi ikke fik domæne/token i requesten.
  if ((!bodyDomain || !bodyToken) && !shop) {
    const result = await getShopRecord({
      token: supabaseToken,
    });
    shop = result.data;
    shopError = result.error;
  }

  if (shopError && !bodyDomain && !bodyToken) {
    const message =
      shopError === "auth_missing"
        ? "Ingen adgang til Supabase token. Prøv at logge ind igen."
        : shopError === "supabase_config_missing"
        ? "Supabase konfiguration mangler på serveren."
        : shopError;
    return NextResponse.json({ error: message }, { status: 400 });
  }

  let domain = "";
  let domainSource = "";
  if (bodyDomain) {
    domain = normalizeDomain(bodyDomain);
    domainSource = "body";
  } else if (decrypted?.shop_domain) {
    domain = normalizeDomain(decrypted?.shop_domain || "");
    domainSource = "decrypted";
  } else if (shop?.shop_domain) {
    domain = normalizeDomain(shop?.shop_domain || "");
    domainSource = "shop_row";
  }

  let token = "";
  let tokenSource = "";
  if (bodyToken) {
    token = bodyToken;
    tokenSource = "body";
  } else if (decrypted?.access_token) {
    token = decrypted.access_token;
    tokenSource = "decrypted";
  }

  if (!domain || !token) {
    return NextResponse.json(
      {
        error:
          "Manglende Shopify domæne eller adgangsnøgle. Forbind Shopify først, eller send shop_domain og access_token i body.",
        debug: {
          domainSource,
          tokenSource,
          hasServiceKey: Boolean(SUPABASE_SERVICE_KEY),
          hasTokenKey: Boolean(SHOPIFY_TOKEN_KEY),
          hasSupabaseToken: Boolean(supabaseToken),
        },
      },
      { status: 400 }
    );
  }

  const url = `https://${domain}/admin/api/${SHOPIFY_API_VERSION}/policies.json`;

  let response;
  try {
    response = await fetch(url, {
      headers: {
        "X-Shopify-Access-Token": token,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
  } catch (error) {
    console.error("Shopify fetch failed:", error);
    return NextResponse.json(
      {
        error: `Kunne ikke kontakte Shopify for ${domain}. Tjek domæne/adgangsnøgle.`,
      },
      { status: 502 }
    );
  }

  const payload = await response.json().catch(async () => {
    const text = await response.text().catch(() => null);
    return text ? { error: text } : {};
  });
  if (!response.ok) {
    const baseMessage =
      payload?.errors ||
      payload?.error ||
      payload?.error_description ||
      response.statusText ||
      `Shopify returnerede status ${response.status}.`;
    const scopeHint =
      response.status === 401 || response.status === 403
        ? " Tjek at Admin API access token er korrekt og har scope `read_legal_policies`."
        : "";
    const message = `${baseMessage}${scopeHint}`;
    return NextResponse.json({ error: message }, { status: response.status });
  }

  const policies = Array.isArray(payload?.policies) ? payload.policies : [];
  const mapped = mapPolicies(policies);

  const meta = {
    policyCount: policies.length,
    policyTypes: mapped.found,
  };

  return NextResponse.json(
    { refund: mapped.refund, shipping: mapped.shipping, terms: mapped.terms, meta },
    { status: 200 }
  );
}
