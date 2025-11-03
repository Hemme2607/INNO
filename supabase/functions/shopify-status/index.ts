import { createRemoteJWKSet, jwtVerify } from "https://deno.land/x/jose@v5.2.0/index.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PROJECT_URL = Deno.env.get("PROJECT_URL") ?? Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY =
  Deno.env.get("SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const CLERK_JWT_ISSUER = Deno.env.get("CLERK_JWT_ISSUER");

if (!PROJECT_URL) console.warn("PROJECT_URL mangler – shopify-status kan ikke slå butik op.");
if (!SERVICE_ROLE_KEY)
  console.warn("SERVICE_ROLE_KEY mangler – shopify-status kan ikke bruge Supabase service rolle.");
if (!CLERK_JWT_ISSUER)
  console.warn("CLERK_JWT_ISSUER mangler – Clerk sessioner kan ikke verificeres.");

const supabase =
  PROJECT_URL && SERVICE_ROLE_KEY ? createClient(PROJECT_URL, SERVICE_ROLE_KEY) : null;

const JWKS = CLERK_JWT_ISSUER
  ? createRemoteJWKSet(
      new URL(`${CLERK_JWT_ISSUER.replace(/\/$/, "")}/.well-known/jwks.json`),
    )
  : null;

type ProfileRow = {
  user_id: string | null;
};

type ShopRow = {
  shop_domain: string | null;
  owner_user_id: string | null;
};

const readBearerToken = (req: Request): string => {
  const header = req.headers.get("Authorization") ?? req.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    throw Object.assign(new Error("Manglende Clerk session token"), { status: 401 });
  }
  return match[1];
};

const requireClerkUserId = async (req: Request): Promise<string> => {
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
};

const fetchSupabaseUserId = async (clerkUserId: string): Promise<string | null> => {
  if (!supabase) {
    throw Object.assign(new Error("Supabase klient ikke konfigureret."), { status: 500 });
  }

  const { data, error } = await supabase
    .from<ProfileRow>("profiles")
    .select("user_id")
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle();

  if (error) {
    throw Object.assign(
      new Error(`Kunne ikke slå Supabase profil op: ${error.message}`),
      { status: 500 },
    );
  }

  return typeof data?.user_id === "string" && data.user_id.length ? data.user_id : null;
};

const fetchShopRow = async (ownerUserId: string | null): Promise<ShopRow | null> => {
  if (!supabase) {
    throw Object.assign(new Error("Supabase klient ikke konfigureret."), { status: 500 });
  }

  if (!ownerUserId) {
    return null;
  }

  const { data, error } = await supabase
    .from<ShopRow>("shops")
    .select("shop_domain, owner_user_id")
    .eq("owner_user_id", ownerUserId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw Object.assign(
      new Error(`Kunne ikke hente Shopify butik: ${error.message}`),
      { status: 500 },
    );
  }

  return data ?? null;
};

Deno.serve(async (req) => {
  try {
    if (req.method !== "GET") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const clerkUserId = await requireClerkUserId(req);
    const supabaseUserId = await fetchSupabaseUserId(clerkUserId);
    const shopRow = await fetchShopRow(supabaseUserId);

    return Response.json({
      clerkUserId,
      supabaseUserId,
      ownerUserId: shopRow?.owner_user_id ?? supabaseUserId,
      shopDomain: shopRow?.shop_domain ?? null,
      connected: Boolean(shopRow?.shop_domain),
    });
  } catch (error) {
    const status =
      typeof (error as any)?.status === "number" ? (error as any).status : 500;
    const message =
      (error instanceof Error && error.message) || (typeof error === "string" ? error : "Ukendt fejl");
    console.warn("shopify-status fejlede", { status, message });
    return Response.json({ error: message }, { status });
  }
});
