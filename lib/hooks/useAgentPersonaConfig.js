import { useCallback, useEffect, useMemo, useState } from "react";
import { useClerkSupabase } from "../supabaseClient";

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

export function useAgentPersonaConfig(options = {}) {
  const { lazy = false, userId: providedUserId } = options;
  const supabase = useClerkSupabase();
  const [persona, setPersona] = useState(null);
  const [loading, setLoading] = useState(!lazy);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const ensureUserId = useCallback(async () => {
    if (providedUserId) {
      return providedUserId;
    }
    const { data, error: authError } = await supabase.auth.getUser();
    if (authError) {
      throw authError;
    }
    const userId = data?.user?.id;
    if (!userId) {
      throw new Error("Kunne ikke finde Supabase bruger id.");
    }
    return userId;
  }, [providedUserId, supabase]);

  const loadPersona = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await supabase
        .from("agent_persona")
        .select("*")
        .maybeSingle();

      if (queryError) throw queryError;
      setPersona(toPersona(data));
      return data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Kunne ikke hente persona."));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [supabase, providedUserId]);

  const savePersona = useCallback(
    async (updates) => {
      setSaving(true);
      setError(null);
      try {
        const userId = await ensureUserId();
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
