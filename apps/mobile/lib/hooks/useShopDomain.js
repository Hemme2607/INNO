// Hook der afklarer shop-domæne og ejer ved at læse Clerk-token og Supabase-data.
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useClerkSupabase } from "../supabaseClient";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isValidUuid = (value) => typeof value === "string" && UUID_REGEX.test(value);

const SUPABASE_TEMPLATE =
  process.env.EXPO_PUBLIC_CLERK_SUPABASE_TEMPLATE?.trim() || "supabase";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? null;
const SHOPIFY_STATUS_ENDPOINT = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/shopify-status` : null;

const base64Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const base64UrlToBase64 = (input) => {
  if (typeof input !== "string" || !input.length) {
    return "";
  }
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = (4 - (normalized.length % 4)) % 4;
  return normalized.padEnd(normalized.length + padding, "=");
};

const decodeBase64 = (input) => {
  let result = "";
  let buffer = 0;
  let bits = 0;
  for (const char of input) {
    if (char === "=") {
      break;
    }
    const value = base64Alphabet.indexOf(char);
    if (value === -1) {
      continue;
    }
    buffer = (buffer << 6) | value;
    bits += 6;
    while (bits >= 8) {
      bits -= 8;
      const byte = (buffer >> bits) & 0xff;
      result += String.fromCharCode(byte);
    }
  }
  return result;
};

const decodeJwtPayload = (token) => {
  if (typeof token !== "string" || !token.includes(".")) {
    return null;
  }
  const [, payloadPart] = token.split(".");
  if (!payloadPart) {
    return null;
  }
  try {
    const normalized = base64UrlToBase64(payloadPart);
    const decoded = decodeBase64(normalized);
    return JSON.parse(decoded);
  } catch (_err) {
    return null;
  }
};

// Forsøger at finde shopdomæne og ejer ved at læse Clerk-token og Supabase
export function useShopDomain() {
  const supabase = useClerkSupabase();
  const { user } = useUser();
  const { getToken } = useAuth();
  const [shopDomain, setShopDomain] = useState(null);
  const [ownerUserId, setOwnerUserId] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const missingSupabaseUserWarnedRef = useRef(false);
  const [supabaseUserIdHint, setSupabaseUserIdHint] = useState(() => {
    const metadataUuid = user?.publicMetadata?.supabase_uuid;
    return isValidUuid(metadataUuid) ? metadataUuid : null;
  });

  useEffect(() => {
    const metadataUuid = user?.publicMetadata?.supabase_uuid;
    if (isValidUuid(metadataUuid)) {
      setSupabaseUserIdHint(metadataUuid);
    }
  }, [user?.publicMetadata?.supabase_uuid]);

  // Henter status fra edge-funktionen som fallback til profilopslag
  const fetchStatusFromEdge = useCallback(async () => {
    if (!SHOPIFY_STATUS_ENDPOINT || typeof getToken !== "function") {
      return null;
    }

    try {
      const token = await getToken();
      if (!token) {
        return null;
      }

      const response = await fetch(SHOPIFY_STATUS_ENDPOINT, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        return null;
      }

      const payload = await response.json().catch(() => null);
      if (!payload || typeof payload !== "object") {
        return null;
      }

      const supabaseUserId =
        typeof payload?.supabaseUserId === "string" && payload.supabaseUserId.length
          ? payload.supabaseUserId
          : null;
      const ownerUserId =
        typeof payload?.ownerUserId === "string" && payload.ownerUserId.length
          ? payload.ownerUserId
          : supabaseUserId;
      const domain =
        typeof payload?.shopDomain === "string" && payload.shopDomain.length
          ? payload.shopDomain
          : null;

      const result = {
        supabaseUserId,
        ownerUserId,
        shopDomain: domain,
      };

      if (isValidUuid(result.supabaseUserId)) {
        setSupabaseUserIdHint(result.supabaseUserId);
        missingSupabaseUserWarnedRef.current = false;
      }

      return result;
    } catch (err) {
      console.warn("useShopDomain: shopify-status fallback fejlede", {
        clerkId: user?.id,
        error: err,
      });
      return null;
    }
  }, [getToken, user?.id, setSupabaseUserIdHint]);

  // Finder Supabase user_id via profiler-tabellen hvis Clerk ikke har det
  const fetchProfileUserId = useCallback(async () => {
    if (!supabase || !user?.id) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("clerk_user_id", user.id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      const candidate = data?.user_id;
      if (isValidUuid(candidate)) {
        missingSupabaseUserWarnedRef.current = false;
        setSupabaseUserIdHint(candidate);
        return candidate;
      }
    } catch (profileError) {
      const code = typeof profileError?.code === "string" ? profileError.code : null;
      if (code === "22P02") {
        console.warn("useShopDomain: profilopslag fejlede – Clerk token mangler supabase uuid", {
          clerkId: user?.id,
          error: profileError,
        });
        return null;
      }
      throw profileError;
    }

    return null;
  }, [supabase, user?.id]);

  // Prioriterer cached metadata eller Clerk-token til at afgøre brugerens Supabase-id
  const resolveSupabaseUserId = useCallback(async () => {
    if (isValidUuid(supabaseUserIdHint)) {
      return supabaseUserIdHint;
    }

    if (typeof getToken === "function") {
      try {
        const templateToken = await getToken({ template: SUPABASE_TEMPLATE });
        const payload = decodeJwtPayload(templateToken);
        const claimUuid =
          typeof payload?.supabase_user_id === "string" ? payload.supabase_user_id : null;
        const sub = typeof payload?.sub === "string" ? payload.sub : null;
        const candidate = isValidUuid(claimUuid) ? claimUuid : sub;
        if (isValidUuid(candidate)) {
          missingSupabaseUserWarnedRef.current = false;
          setSupabaseUserIdHint(candidate);
          return candidate;
        }
      } catch (tokenError) {
        console.warn("useShopDomain: kunne ikke afkode Clerk token for supabase uuid", {
          clerkId: user?.id,
          error: tokenError,
        });
      }
    }

    const metadataUuid = user?.publicMetadata?.supabase_uuid;
    if (isValidUuid(metadataUuid)) {
      setSupabaseUserIdHint(metadataUuid);
      return metadataUuid;
    }

    const profileUserId = await fetchProfileUserId();
    if (profileUserId) {
      return profileUserId;
    }

    return null;
  }, [supabaseUserIdHint, getToken, user?.id, user?.publicMetadata?.supabase_uuid, fetchProfileUserId, setSupabaseUserIdHint]);

  const fetchDomain = useCallback(async () => {
    setIsLoaded(false);
    setError(null);

    if (!supabase || !user) {
      setShopDomain(null);
      setIsLoaded(true);
      return null;
    }

    try {
      const supabaseUserId = await resolveSupabaseUserId();
      if (isValidUuid(supabaseUserId)) {
        setSupabaseUserIdHint(supabaseUserId);
      }
      let shopRow = null;

      if (isValidUuid(supabaseUserId)) {
        const { data, error } = await supabase
          .from("shops")
          .select("shop_domain, owner_user_id")
          .eq("owner_user_id", supabaseUserId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.warn("useShopDomain: direkte shops opslag fejlede", {
            clerkId: user.id,
            supabaseUserId,
            error,
          });
        } else {
          shopRow = data ?? null;
        }
      }

      if (!shopRow?.shop_domain) {
        const fallback = await fetchStatusFromEdge();
        if (fallback?.supabaseUserId && isValidUuid(fallback.supabaseUserId)) {
          missingSupabaseUserWarnedRef.current = false;
        }

        if (fallback?.shopDomain) {
          setShopDomain(fallback.shopDomain);
          setOwnerUserId(
            typeof fallback.ownerUserId === "string" ? fallback.ownerUserId : fallback.supabaseUserId
          );
          console.log("useShopDomain: resolved via shopify-status", {
            clerkId: user.id,
            supabaseUserId: fallback.supabaseUserId,
            ownerUserId: fallback.ownerUserId,
            shopDomain: fallback.shopDomain,
          });
          return fallback.shopDomain;
        }

        if (!supabaseUserId && !fallback?.supabaseUserId && !missingSupabaseUserWarnedRef.current) {
          console.warn("useShopDomain: supabaseUserId mangler – kan ikke hente shop", {
            clerkId: user?.id,
          });
          missingSupabaseUserWarnedRef.current = true;
        }

        setShopDomain(null);
        setOwnerUserId(
          typeof fallback?.ownerUserId === "string"
            ? fallback.ownerUserId
            : fallback?.supabaseUserId ?? null
        );
        return null;
      }

      const resolved =
        typeof shopRow?.shop_domain === "string" && shopRow.shop_domain.length
          ? shopRow.shop_domain
          : null;

      setShopDomain(resolved);
      setOwnerUserId(
        typeof shopRow?.owner_user_id === "string" ? shopRow.owner_user_id : supabaseUserId
      );
      return resolved;
    } catch (err) {
      console.warn("Failed to fetch shop domain", err);
      setError(err instanceof Error ? err : new Error("Ukendt fejl ved hentning af Shopify status"));
      setShopDomain(null);
      setOwnerUserId(null);
      throw err;
    } finally {
      setIsLoaded(true);
    }
  }, [supabase, user, resolveSupabaseUserId, fetchStatusFromEdge, setSupabaseUserIdHint]);

  useEffect(() => {
    fetchDomain().catch(() => null);
  }, [fetchDomain]);

  return { shopDomain, ownerUserId, isLoaded, error, refresh: fetchDomain };
}
