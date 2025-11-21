import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

type AutomationSettings = {
  order_updates: boolean;
  cancel_orders: boolean;
  automatic_refunds: boolean;
  historic_inbox_access: boolean;
};

type ShopCredentials = {
  shop_domain: string;
  access_token: string;
};

export type AutomationAction = {
  type: string;
  orderId?: number;
  payload?: Record<string, unknown>;
};

export type AutomationResult = {
  type: string;
  ok: boolean;
  error?: string;
};

type ExecuteOptions = {
  supabase: SupabaseClient | null;
  supabaseUserId: string | null;
  actions: AutomationAction[];
  automation: AutomationSettings;
  tokenSecret?: string | null;
  apiVersion: string;
};

async function getShopCredentials(
  supabase: SupabaseClient,
  userId: string,
  tokenSecret: string,
): Promise<ShopCredentials> {
  const { data, error } = await supabase
    .rpc<ShopCredentials>("get_shop_credentials_for_user", {
      p_owner_user_id: userId,
      p_secret: tokenSecret,
    })
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Kunne ikke finde Shopify credentials.");
  }
  return data;
}

function ensureActionAllowed(action: string, automation: AutomationSettings) {
  const deny = (reason: string) =>
    Object.assign(new Error(`Automatiseringen tillader ikke denne handling: ${reason}`), {
      status: 403,
    });
  switch (action) {
    case "update_shipping_address":
    case "add_note":
    case "add_tag":
      if (!automation.order_updates) {
        throw deny("ordreopdateringer er deaktiveret.");
      }
      break;
    case "cancel_order":
      if (!automation.cancel_orders) {
        throw deny("annulleringer er deaktiveret.");
      }
      break;
    default:
      break;
  }
}

function shopifyUrl(shop: ShopCredentials, path: string, apiVersion: string) {
  const domain = shop.shop_domain.replace(/^https?:\/\//, "");
  return `https://${domain}/admin/api/${apiVersion}/${path.replace(/^\/+/, "")}`;
}

async function shopifyRequest<T>(
  shop: ShopCredentials,
  apiVersion: string,
  path: string,
  init: RequestInit,
): Promise<T> {
  const response = await fetch(shopifyUrl(shop, path, apiVersion), {
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
  shop: ShopCredentials,
  apiVersion: string,
  orderId: number,
  payload: Record<string, unknown> = {},
) {
  const shippingAddress = payload?.shipping_address ?? payload?.shippingAddress;
  if (!shippingAddress || typeof shippingAddress !== "object") {
    throw Object.assign(new Error("shippingAddress skal angives."), { status: 400 });
  }

  return shopifyRequest(
    shop,
    apiVersion,
    `orders/${orderId}.json`,
    {
      method: "PUT",
      body: JSON.stringify({
        order: {
          id: orderId,
          shipping_address: shippingAddress,
        },
      }),
    },
  );
}

async function cancelOrder(
  shop: ShopCredentials,
  apiVersion: string,
  orderId: number,
  payload: Record<string, unknown> = {},
) {
  const body: Record<string, unknown> = {};
  if ("reason" in payload) body.reason = payload.reason;
  if ("email" in payload) body.email = payload.email;
  if ("refund" in payload) body.refund = payload.refund;
  if ("restock" in payload) body.restock = payload.restock;

  return shopifyRequest(
    shop,
    apiVersion,
    `orders/${orderId}/cancel.json`,
    {
      method: "POST",
      body: Object.keys(body).length ? JSON.stringify(body) : undefined,
    },
  );
}

async function addNote(
  shop: ShopCredentials,
  apiVersion: string,
  orderId: number,
  payload: Record<string, unknown> = {},
) {
  const note = typeof payload?.note === "string" ? payload.note : "";
  return shopifyRequest(
    shop,
    apiVersion,
    `orders/${orderId}.json`,
    {
      method: "PUT",
      body: JSON.stringify({
        order: {
          id: orderId,
          note,
        },
      }),
    },
  );
}

async function addTag(
  shop: ShopCredentials,
  apiVersion: string,
  orderId: number,
  payload: Record<string, unknown> = {},
) {
  const tag = typeof payload?.tag === "string" ? payload.tag.trim() : "";
  if (!tag) {
    throw Object.assign(new Error("tag skal udfyldes."), { status: 400 });
  }

  const current = await shopifyRequest<{ order?: { tags?: string } }>(
    shop,
    apiVersion,
    `orders/${orderId}.json`,
    { method: "GET" },
  );

  const existingTags = (current.order?.tags ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (!existingTags.includes(tag)) existingTags.push(tag);

  return shopifyRequest(
    shop,
    apiVersion,
    `orders/${orderId}.json`,
    {
      method: "PUT",
      body: JSON.stringify({
        order: {
          id: orderId,
          tags: existingTags.join(", "),
        },
      }),
    },
  );
}

async function handleAction(
  shop: ShopCredentials,
  apiVersion: string,
  action: AutomationAction,
) {
  if (!action?.type) {
    throw Object.assign(new Error("Handling mangler type."), { status: 400 });
  }
  if (!action.orderId || Number.isNaN(Number(action.orderId))) {
    throw Object.assign(new Error("orderId skal angives."), { status: 400 });
  }
  const orderId = Number(action.orderId);
  switch (action.type) {
    case "update_shipping_address":
      return updateShippingAddress(shop, apiVersion, orderId, action.payload);
    case "cancel_order":
      return cancelOrder(shop, apiVersion, orderId, action.payload);
    case "add_note":
      return addNote(shop, apiVersion, orderId, action.payload);
    case "add_tag":
      return addTag(shop, apiVersion, orderId, action.payload);
    default:
      throw Object.assign(new Error(`Uunderstøttet handling: ${action.type}`), {
        status: 400,
      });
  }
}

export async function executeAutomationActions({
  supabase,
  supabaseUserId,
  actions,
  automation,
  tokenSecret,
  apiVersion,
}: ExecuteOptions): Promise<AutomationResult[]> {
  const results: AutomationResult[] = [];
  if (!actions?.length) return results;
  if (!supabase || !supabaseUserId || !tokenSecret) {
    return actions.map((action) => ({
      type: action?.type ?? "ukendt",
      ok: false,
      error: "Shopify konfiguration mangler (supabase connection/token).",
    }));
  }

  let shop: ShopCredentials | null = null;
  try {
    shop = await getShopCredentials(supabase, supabaseUserId, tokenSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return actions.map((action) => ({
      type: action?.type ?? "ukendt",
      ok: false,
      error: message,
    }));
  }

  for (const action of actions) {
    if (!action || typeof action.type !== "string") continue;
    try {
      ensureActionAllowed(action.type, automation);
      await handleAction(shop, apiVersion, action);
      results.push({ type: action.type, ok: true });
    } catch (err) {
      results.push({
        type: action.type,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return results;
}
