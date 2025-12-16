import { createRemoteJWKSet, jwtVerify } from "https://deno.land/x/jose@v5.2.0/index.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SHOPIFY_API_VERSION = "2024-07"; // Brug samme version hvert sted

const PROJECT_URL = Deno.env.get("PROJECT_URL") ?? Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY =
  Deno.env.get("SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const CLERK_JWT_ISSUER = Deno.env.get("CLERK_JWT_ISSUER");
const SHOPIFY_TOKEN_KEY = Deno.env.get("SHOPIFY_TOKEN_KEY");

if (!PROJECT_URL) console.warn("PROJECT_URL mangler – shop data kan ikke hentes.");
if (!SERVICE_ROLE_KEY)
  console.warn("SERVICE_ROLE_KEY mangler – edge function kan ikke spørge Supabase.");
if (!CLERK_JWT_ISSUER)
  console.warn("CLERK_JWT_ISSUER mangler – Clerk sessioner kan ikke verificeres.");
if (!SHOPIFY_TOKEN_KEY)
  console.warn("SHOPIFY_TOKEN_KEY mangler – kan ikke dekryptere Shopify tokens.");

const supabase =
  PROJECT_URL && SERVICE_ROLE_KEY ? createClient(PROJECT_URL, SERVICE_ROLE_KEY) : null;

const JWKS = CLERK_JWT_ISSUER
  ? createRemoteJWKSet(
      new URL(`${CLERK_JWT_ISSUER.replace(/\/$/, "")}/.well-known/jwks.json`),
    )
  : null;

type ShopRecord = {
  shop_domain: string;
  access_token: string;
};

// Udtrækker Clerk bearer token fra Authorization-headeren
function readBearerToken(req: Request): string {
  // Afkoder Authorization-headeren fra Expo-appen
  const header = req.headers.get("Authorization") ?? req.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    throw Object.assign(new Error("Manglende Clerk session token"), { status: 401 });
  }
  return match[1];
}

async function requireClerkUserId(req: Request): Promise<string> {
  if (!JWKS || !CLERK_JWT_ISSUER) {
    throw Object.assign(
      new Error("CLERK_JWT_ISSUER mangler – kan ikke verificere Clerk session."),
      { status: 500 },
    );
  }
  const token = readBearerToken(req);
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: CLERK_JWT_ISSUER,
  });
  const sub = payload?.sub;
  if (!sub || typeof sub !== "string") {
    throw Object.assign(new Error("Ugyldigt Clerk token – subject mangler."), { status: 401 });
  }
  return sub;
}

// Map Clerk user id til Supabase user id via profiles-tabellen
async function resolveSupabaseUserId(clerkUserId: string): Promise<string> {
  if (!supabase) {
    throw Object.assign(new Error("Supabase klient ikke konfigureret."), { status: 500 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle();

  if (error) {
    throw Object.assign(
      new Error(`Kunne ikke slå Supabase-bruger op: ${error.message}`),
      { status: 500 },
    );
  }

  const supabaseUserId = data?.user_id;

  if (!supabaseUserId) {
    throw Object.assign(
      new Error("Ingen Supabase-bruger er tilknyttet denne Clerk-bruger."),
      { status: 404 },
    );
  }

  return supabaseUserId;
}

// Henter og dekrypterer Shopify credentials for brugeren
async function getShopForUser(clerkUserId: string): Promise<ShopRecord> {
  // Henter og dekrypterer butikken for nuværende bruger
  if (!supabase) {
    throw Object.assign(new Error("Supabase klient ikke konfigureret."), { status: 500 });
  }
  if (!SHOPIFY_TOKEN_KEY) {
    throw Object.assign(new Error("SHOPIFY_TOKEN_KEY mangler på edge functionen."), {
      status: 500,
    });
  }

  const supabaseUserId = await resolveSupabaseUserId(clerkUserId);

  const { data, error } = await supabase
    .rpc<ShopRecord>("get_shop_credentials_for_user", {
      p_owner_user_id: supabaseUserId,
      p_secret: SHOPIFY_TOKEN_KEY,
    })
    .single();

  if (error) {
    throw Object.assign(new Error(`Kunne ikke slå butik op: ${error.message}`), {
      status: 500,
    });
  }
  if (!data) {
    throw Object.assign(new Error("Ingen Shopify butik forbundet."), { status: 404 });
  }

  return data;
}

async function fetchShopifyOrders(
  shop: ShopRecord,
  searchParams: URLSearchParams,
): Promise<Response> {
  // Kalder Shopify REST API'et og returnerer JSON tilbage til appen
  const domain = shop.shop_domain.replace(/^https?:\/\//, "");
  const url = new URL(`https://${domain}/admin/api/${SHOPIFY_API_VERSION}/orders.json`);

  searchParams.forEach((value, key) => {
    if (value !== null && value !== undefined && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": shop.access_token,
    },
  });

  const text = await response.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch (_err) {
    json = null;
  }

  if (!response.ok) {
    const message =
      (json as any)?.errors ??
      (json as any)?.error ??
      text ??
      `Shopify svarede med status ${response.status}.`;
    throw Object.assign(
      new Error(typeof message === "string" ? message : JSON.stringify(message)),
      { status: response.status },
    );
  }

  return Response.json({
    orders: (json as any)?.orders ?? [],
    raw: json,
  });
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "GET") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const userId = await requireClerkUserId(req);
    const shop = await getShopForUser(userId);

    const url = new URL(req.url);
    const searchParams = new URLSearchParams();

    const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 20), 1), 250);
    searchParams.set("limit", String(limit));

    const status = url.searchParams.get("status");
    if (status) searchParams.set("status", status);

    const email = url.searchParams.get("email");
    if (email) searchParams.set("email", email);

    const createdAtMin = url.searchParams.get("created_at_min");
    if (createdAtMin) searchParams.set("created_at_min", createdAtMin);

    const createdAtMax = url.searchParams.get("created_at_max");
    if (createdAtMax) searchParams.set("created_at_max", createdAtMax);

    return await fetchShopifyOrders(shop, searchParams);
  } catch (error) {
    const status = (error as any)?.status ?? 500;
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status });
  }
});
