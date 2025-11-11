import { useCallback, useEffect, useMemo, useState } from "react";
import { useClerkSupabase } from "../supabaseClient";
import { useAuth, useUser } from "@clerk/clerk-expo";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isValidUuid = (value) => typeof value === "string" && UUID_REGEX.test(value);

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
    if (char === "=") break;
    const value = base64Alphabet.indexOf(char);
    if (value === -1) continue;
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

const DEFAULT_AUTOMATION = {
  orderUpdates: true,
  cancelOrders: true,
  automaticRefunds: false,
  historicInboxAccess: false,
};

// Mapper databaserækken over i hookens camelCase struktur
function mapAutomation(row) {
  if (!row) return DEFAULT_AUTOMATION;
  return {
    orderUpdates: row.order_updates ?? DEFAULT_AUTOMATION.orderUpdates,
    cancelOrders: row.cancel_orders ?? DEFAULT_AUTOMATION.cancelOrders,
    automaticRefunds: row.automatic_refunds ?? DEFAULT_AUTOMATION.automaticRefunds,
    historicInboxAccess: row.historic_inbox_access ?? DEFAULT_AUTOMATION.historicInboxAccess,
  };
}

export function useAgentAutomation(options = {}) {
  const { lazy = false, userId: providedUserId } = options;
  const supabase = useClerkSupabase();
  const { getToken } = useAuth();
  const { user } = useUser();
  const [settings, setSettings] = useState(DEFAULT_AUTOMATION);
  const [loading, setLoading] = useState(!lazy);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Forsøger at aflæse supabase_user_id direkte fra Clerk-tokenet
  const resolveUserIdFromToken = useCallback(async () => {
    if (typeof getToken !== "function") return null;
    try {
      const template = process.env.EXPO_PUBLIC_CLERK_SUPABASE_TEMPLATE?.trim() || "supabase";
      const token = await getToken({ template });
      const payload = decodeJwtPayload(token);
      if (!payload) return null;
      const claim = payload?.supabase_user_id;
      if (isValidUuid(claim)) {
        return claim;
      }
      const sub = payload?.sub;
      if (isValidUuid(sub)) {
        return sub;
      }
    } catch (_err) {
      return null;
    }
    return null;
  }, [getToken]);

  // Sørger for at vi kender brugerens Supabase-id før vi læser/skriver
  const ensureUserId = useCallback(async () => {
    if (providedUserId) {
      return providedUserId;
    }
    const metadataId = user?.publicMetadata?.supabase_uuid;
    if (isValidUuid(metadataId)) {
      return metadataId;
    }
    const tokenId = await resolveUserIdFromToken();
    if (tokenId) {
      return tokenId;
    }
    if (supabase && user?.id) {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("clerk_user_id", user.id)
        .maybeSingle();
      if (!error && isValidUuid(data?.user_id)) {
        return data.user_id;
      }
    }
    throw new Error("Supabase bruger-id er ikke klar endnu.");
  }, [providedUserId, user?.publicMetadata?.supabase_uuid, resolveUserIdFromToken, supabase, user?.id]);

  // Henter nuværende automations-opsætning fra Supabase
  const loadAutomation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const userId = await ensureUserId().catch(() => null);
      if (!userId) {
        setSettings(DEFAULT_AUTOMATION);
        return DEFAULT_AUTOMATION;
      }

      const { data, error: queryError } = await supabase
        .from("agent_automation")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (queryError) throw queryError;
      const mapped = mapAutomation(data);
      setSettings(mapped);
      return mapped;
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Kunne ikke hente automatisering."));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [supabase, ensureUserId]);

  // Gemmer toggles tilbage i agent_automation med optimistisk feedback
  const saveAutomation = useCallback(
    async (updates) => {
      setSaving(true);
      setError(null);
      try {
        const userId = await ensureUserId().catch(() => null);
        if (!isValidUuid(userId)) {
          setError(new Error("Supabase bruger-id er ikke klar endnu."));
          return null;
        }
        const payload = {
          user_id: userId,
          order_updates: updates.orderUpdates ?? settings.orderUpdates,
          cancel_orders: updates.cancelOrders ?? settings.cancelOrders,
          automatic_refunds: updates.automaticRefunds ?? settings.automaticRefunds,
          historic_inbox_access: updates.historicInboxAccess ?? settings.historicInboxAccess,
        };

        const { data, error: upsertError } = await supabase
          .from("agent_automation")
          .upsert(payload, { onConflict: "user_id" })
          .select()
          .maybeSingle();

        if (upsertError) throw upsertError;
        const mapped = mapAutomation(data);
        setSettings(mapped);
        return mapped;
      } catch (err) {
        const normalized =
          err instanceof Error
            ? err
            : new Error(
                typeof err?.message === "string"
                  ? err.message
                  : "Kunne ikke gemme automatisering."
              );
        console.warn("useAgentAutomation: save failed", err);
        setError(normalized);
        throw normalized;
      } finally {
        setSaving(false);
      }
    },
    [ensureUserId, settings, supabase]
  );

  useEffect(() => {
    if (!lazy) {
      loadAutomation().catch(() => null);
    }
  }, [lazy, loadAutomation]);

  return useMemo(
    () => ({
      settings,
      loading,
      saving,
      error,
      refresh: loadAutomation,
      save: saveAutomation,
      defaults: DEFAULT_AUTOMATION,
    }),
    [settings, loading, saving, error, loadAutomation, saveAutomation]
  );
}
