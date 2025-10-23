import { createRemoteJWKSet, jwtVerify } from "https://deno.land/x/jose@v5.2.0/index.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SHOPIFY_API_VERSION = "2024-07"; // Samme version som i de andre endpoints

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

type UpdatePayload = {
  action: string;
  orderId: number;
  payload?: Record<string, unknown>;
};

function readBearerToken(req: Request): string {
  // Sikrer at vi har en gyldig Clerk session fra klienten
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

async function getShopForUser(userId: string): Promise<ShopRecord> {
  // Slår butikken op og dekrypterer tokenet inden vi ringer til Shopify
  if (!supabase) {
    throw Object.assign(new Error("Supabase klient ikke konfigureret."), { status: 500 });
  }
  if (!SHOPIFY_TOKEN_KEY) {
    throw Object.assign(new Error("SHOPIFY_TOKEN_KEY mangler på edge functionen."), {
      status: 500,
    });
  }

  const { data, error } = await supabase
    .rpc<ShopRecord>("get_shop_credentials_for_user", {
      p_owner_user_id: userId,
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

function shopifyUrl(shop: ShopRecord, path: string): string {
  // Bygger fuld URL til Shopify Admin API
  const domain = shop.shop_domain.replace(/^https?:\/\//, "");
  return `https://${domain}/admin/api/${SHOPIFY_API_VERSION}/${path.replace(/^\/+/, "")}`;
}

async function shopifyRequest<T>(
  shop: ShopRecord,
  path: string,
  init: RequestInit,
): Promise<T> {
  // Generisk helper der kalder Shopify og returnerer JSON eller kaster fejl
  const response = await fetch(shopifyUrl(shop, path), {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": shop.access_token,
      ...(init.headers ?? {}),
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

  return json as T;
}

async function updateShippingAddress(
  shop: ShopRecord,
  orderId: number,
  payload: Record<string, unknown> = {},
) {
  const shippingAddress = payload?.shipping_address ?? payload?.shippingAddress;
  if (!shippingAddress || typeof shippingAddress !== "object") {
    throw Object.assign(new Error("shippingAddress skal angives."), { status: 400 });
  }

  return shopifyRequest(shop, `orders/${orderId}.json`, {
    method: "PUT",
    body: JSON.stringify({
      order: {
        id: orderId,
        shipping_address: shippingAddress,
      },
    }),
  });
}

async function cancelOrder(
  shop: ShopRecord,
  orderId: number,
  payload: Record<string, unknown> = {},
) {
  const body: Record<string, unknown> = {};
  if ("reason" in payload) body.reason = payload.reason;
  if ("email" in payload) body.email = payload.email;
  if ("refund" in payload) body.refund = payload.refund;
  if ("restock" in payload) body.restock = payload.restock;

  return shopifyRequest(shop, `orders/${orderId}/cancel.json`, {
    method: "POST",
    body: Object.keys(body).length ? JSON.stringify(body) : undefined,
  });
}

async function addNote(
  shop: ShopRecord,
  orderId: number,
  payload: Record<string, unknown> = {},
) {
  const note = typeof payload?.note === "string" ? payload.note : "";
  return shopifyRequest(shop, `orders/${orderId}.json`, {
    method: "PUT",
    body: JSON.stringify({
      order: {
        id: orderId,
        note,
      },
    }),
  });
}

async function addTag(
  shop: ShopRecord,
  orderId: number,
  payload: Record<string, unknown> = {},
) {
  const tag = typeof payload?.tag === "string" ? payload.tag.trim() : "";
  if (!tag) {
    throw Object.assign(new Error("tag skal udfyldes."), { status: 400 });
  }

  const current = await shopifyRequest<{ order?: { tags?: string } }>(
    shop,
    `orders/${orderId}.json`,
    { method: "GET" },
  );
  const existingTags = (current.order?.tags ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (!existingTags.includes(tag)) existingTags.push(tag);

  return shopifyRequest(shop, `orders/${orderId}.json`, {
    method: "PUT",
    body: JSON.stringify({
      order: {
        id: orderId,
        tags: existingTags.join(", "),
      },
    }),
  });
}

async function handleAction(shop: ShopRecord, payload: UpdatePayload) {
  if (!payload.orderId || Number.isNaN(Number(payload.orderId))) {
    throw Object.assign(new Error("orderId skal angives."), { status: 400 });
  }

  switch (payload.action) {
    case "update_shipping_address":
      return updateShippingAddress(shop, Number(payload.orderId), payload.payload);
    case "cancel_order":
      return cancelOrder(shop, Number(payload.orderId), payload.payload);
    case "add_note":
      return addNote(shop, Number(payload.orderId), payload.payload);
    case "add_tag":
      return addTag(shop, Number(payload.orderId), payload.payload);
    default:
      throw Object.assign(
        new Error(`Uunderstøttet handling: ${payload.action ?? "ukendt"}`),
        { status: 400 },
      );
  }
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const userId = await requireClerkUserId(req);
    const shop = await getShopForUser(userId);

    const payload = (await req.json().catch(() => ({}))) as UpdatePayload;

    if (!payload || typeof payload !== "object") {
      throw Object.assign(new Error("Body skal være JSON objekt."), { status: 400 });
    }

    const result = await handleAction(shop, payload);
    return Response.json({ ok: true, result });
  } catch (error) {
    const status = (error as any)?.status ?? 500;
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status });
  }
});
