// Hook der læser og gemmer agentens persona-opsætning med Clerk/Supabase-id.
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

function toPersona(row) {
  if (!row) return null;
  return {
    userId: row.user_id,
    signature: row.signature ?? "",
    scenario: row.scenario ?? "",
    instructions: row.instructions ?? "",
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

const SUPABASE_TEMPLATE =
  process.env.EXPO_PUBLIC_CLERK_SUPABASE_TEMPLATE?.trim() || "supabase";

export function useAgentPersonaConfig(options = {}) {
  const { lazy = false, userId: providedUserId } = options;
  const supabase = useClerkSupabase();
  const { getToken } = useAuth();
  const { user } = useUser();
  const [persona, setPersona] = useState(null);
  const [loading, setLoading] = useState(!lazy);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Sikrer at vi får et Supabase user_id uanset om det ligger i metadata eller profil
  const ensureUserId = useCallback(async () => {
    if (providedUserId) {
      return providedUserId;
    }

    const metadataUuid = user?.publicMetadata?.supabase_uuid;
    if (isValidUuid(metadataUuid)) {
      return metadataUuid;
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
          return candidate;
        }
      } catch (tokenError) {
        console.warn("useAgentPersonaConfig: clerk token mangler supabase uuid", tokenError);
      }
    }

    if (!supabase || !user?.id) {
      throw new Error("Supabase bruger-id er ikke klar endnu.");
    }

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
      return candidate;
    }

    throw new Error("Supabase bruger-id er ikke klar endnu.");
  }, [providedUserId, user?.publicMetadata?.supabase_uuid, getToken, supabase, user?.id]);

  const loadPersona = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const userId = await ensureUserId().catch(() => null);
      if (!userId) {
        setPersona(null);
        return null;
      }

      const { data, error: queryError } = await supabase
        .from("agent_persona")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (queryError) throw queryError;
      setPersona(toPersona(data));
      return data;
    } catch (err) {
      console.warn("useAgentPersonaConfig: load failed", err);
      setError(err instanceof Error ? err : new Error("Kunne ikke hente persona."));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [supabase, ensureUserId]);

  const savePersona = useCallback(
    async (updates) => {
      setSaving(true);
      setError(null);
      const promisedId = ensureUserId().catch(() => null);
      const userId = await promisedId;
      if (!userId) {
        console.warn("useAgentPersonaConfig: springer gem over – userId mangler");
        setSaving(false);
        return null;
      }

      try {
        const payload = {
          user_id: userId,
          signature: updates.signature ?? persona?.signature ?? null,
          scenario: updates.scenario ?? persona?.scenario ?? null,
          instructions: updates.instructions ?? persona?.instructions ?? null,
        };

      const { data, error: upsertError } = await supabase
        .from("agent_persona")
        .upsert(payload, { onConflict: "user_id" })
        .select()
        .maybeSingle();

        if (upsertError) throw upsertError;
      setPersona(toPersona(data));
        return data;
      } catch (err) {
        console.warn("useAgentPersonaConfig: save failed", err);
        setError(err instanceof Error ? err : new Error("Kunne ikke gemme persona."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [ensureUserId, persona, supabase]
  );

  useEffect(() => {
    if (!lazy) {
      loadPersona().catch(() => null);
    }
  }, [lazy, loadPersona]);

  return useMemo(
    () => ({
      persona,
      loading,
      error,
      saving,
      refresh: loadPersona,
      save: savePersona,
    }),
    [persona, loading, error, saving, loadPersona, savePersona]
  );
}
