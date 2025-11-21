import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

type ShopifyCredentials = {
  shop_domain: string;
  access_token: string;
};

export type ShopifyOrder = Record<string, unknown>;

type ShopifyOrderFetcher = (email?: string | null) => Promise<ShopifyOrder[] | null>;

export async function fetchShopifyOrders(options: {
  supabase: SupabaseClient | null;
  userId?: string | null;
  email?: string | null;
  limit?: number;
  tokenSecret?: string | null;
  apiVersion: string;
}): Promise<ShopifyOrder[]> {
  const { supabase, userId, email, limit = 5, tokenSecret, apiVersion } = options;
  if (!supabase || !tokenSecret || !userId) return [];

  try {
    const { data, error } = await supabase
      .rpc<ShopifyCredentials>("get_shop_credentials_for_user", {
        p_owner_user_id: userId,
        p_secret: tokenSecret,
      })
      .single();
    if (error || !data) {
      console.warn("shopify-shared: kunne ikke hente credentials", error);
      return [];
    }

    const domain = data.shop_domain.replace(/^https?:\/\//, "");
    const url = new URL(`https://${domain}/admin/api/${apiVersion}/orders.json`);
    url.searchParams.set("limit", String(limit));
    if (email?.trim()) {
      url.searchParams.set("email", email.trim());
    }

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": data.access_token,
      },
    });
    if (!response.ok) {
      const text = await response.text();
      console.warn("shopify-shared: orders slog fejl", response.status, text);
      return [];
    }
    const payload = await response.json().catch(() => null);
    return Array.isArray(payload?.orders) ? payload.orders : [];
  } catch (err) {
    console.warn("shopify-shared: fetch exception", err);
    return [];
  }
}

export function extractSubjectNumber(subject?: string | null): string | null {
  if (!subject) return null;
  const match =
    subject.match(/(?:ordre|order)?\s*#?\s*(\d{3,})/i) ?? subject.match(/(\d{3,})/);
  return match ? match[1] : null;
}

export function matchesOrderNumber(order: any, candidate: string): boolean {
  const values = [
    order?.name,
    order?.order_number,
    order?.id,
    order?.number,
    order?.legacy_order?.order_number,
  ];
  return values.some((value) => {
    if (!value && value !== 0) return false;
    const str = String(value);
    if (str.includes(candidate)) return true;
    const digits = str.replace(/\D/g, "");
    return digits ? digits.includes(candidate) : false;
  });
}

export function buildOrderSummary(orders: ShopifyOrder[]): string {
  if (!orders?.length) {
    return "Ingen relaterede ordrer fundet.\n";
  }
  let summary = `Kunden har ${orders.length} relevante ordre(r):\n`;
  for (const order of orders.slice(0, 5)) {
    const friendlyId =
      order?.order_number ?? order?.name ?? (order?.id ? String(order.id) : "ukendt");
    const status = order?.fulfillment_status ?? order?.financial_status ?? "ukendt";
    const total = order?.total_price ?? order?.current_total_price ?? "ukendt";
    summary += `- Ordre ${friendlyId} (id:${order?.id ?? "ukendt"}) — status: ${status} — total: ${total}\n`;
    if (order?.shipping_address) {
      summary += `  Adresse: ${[
        order.shipping_address?.name,
        order.shipping_address?.address1,
        order.shipping_address?.address2,
        order.shipping_address?.zip,
        order.shipping_address?.city,
        order.shipping_address?.country,
      ]
        .filter(Boolean)
        .join(", ")}\n`;
    }
    if (Array.isArray(order?.line_items) && order.line_items.length) {
      const lines = order.line_items
        .slice(0, 2)
        .map((item: any) => {
          const qty = typeof item?.quantity === "number" ? item.quantity : 1;
          const title = item?.title ?? item?.name ?? "Vare";
          return `${qty}× ${title}`;
        })
        .filter(Boolean);
      if (lines.length) {
        const extra = order.line_items.length > lines.length ? ` (+${order.line_items.length - lines.length} flere)` : "";
        summary += `  Varer: ${lines.join(", ")}${extra}\n`;
      }
    }
  }
  return summary;
}

export async function resolveOrderContext(options: {
  supabase: SupabaseClient | null;
  userId?: string | null;
  email?: string | null;
  subject?: string | null;
  tokenSecret?: string | null;
  apiVersion: string;
  fetcher?: ShopifyOrderFetcher | null;
  limit?: number;
}): Promise<{ orders: ShopifyOrder[]; matchedSubjectNumber: string | null }> {
  const {
    supabase,
    userId,
    email,
    subject,
    tokenSecret,
    apiVersion,
    fetcher,
    limit = 5,
  } = options;

  const fetchOrders = async (candidateEmail?: string | null) => {
    if (typeof fetcher === "function") {
      try {
        const result = await fetcher(candidateEmail);
        if (Array.isArray(result)) {
          return result;
        }
      } catch (err) {
        console.warn("shopify-shared: custom fetcher fejlede", err);
      }
    }
    return await fetchShopifyOrders({
      supabase,
      userId,
      email: candidateEmail,
      tokenSecret,
      apiVersion,
      limit,
    });
  };

  let orders = await fetchOrders(email);
  let matchedSubjectNumber: string | null = null;

  if ((!orders || orders.length === 0) && email) {
    const fallback = await fetchOrders(null);
    const matched = fallback.filter((order) => matchesOrderEmail(order, email));
    if (matched.length) {
      orders = matched;
    }
  }

  if ((!orders || orders.length === 0) && subject) {
    const subjectNumber = extractSubjectNumber(subject);
    if (subjectNumber) {
      const fallback = await fetchOrders(null);
      const matched = fallback.filter((order) => matchesOrderNumber(order, subjectNumber));
      if (matched.length) {
        orders = matched;
        matchedSubjectNumber = subjectNumber;
      }
    }
  }

  return { orders, matchedSubjectNumber };
}

function matchesOrderEmail(order: any, targetEmail: string): boolean {
  if (!targetEmail) return false;
  const lower = targetEmail.toLowerCase();
  return collectOrderEmails(order).some((email) => email === lower);
}

function collectOrderEmails(order: any): string[] {
  const emails = [
    order?.email,
    order?.customer?.email,
    order?.billing_address?.email,
    order?.shipping_address?.email,
  ]
    .filter(Boolean)
    .map((value: string) => value.toLowerCase());
  return Array.from(new Set(emails));
}
