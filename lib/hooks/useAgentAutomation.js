import { useCallback, useEffect, useMemo, useState } from "react";
import { useClerkSupabase } from "../supabaseClient";

const DEFAULT_AUTOMATION = {
  orderUpdates: true,
  cancelOrders: true,
  automaticRefunds: false,
  historicInboxAccess: false,
};

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
  const [settings, setSettings] = useState(DEFAULT_AUTOMATION);
  const [loading, setLoading] = useState(!lazy);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const ensureUserId = useCallback(async () => {
    if (providedUserId) {
      return providedUserId;
    }
    const { data, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    const userId = data?.user?.id;
    if (!userId) throw new Error("Kunne ikke finde Supabase bruger id.");
    return userId;
  }, [providedUserId, supabase]);

  const loadAutomation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await supabase
        .from("agent_automation")
        .select("*")
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
  }, [supabase, providedUserId]);

  const saveAutomation = useCallback(
    async (updates) => {
      setSaving(true);
      setError(null);
      try {
        const userId = await ensureUserId();
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
        setError(err instanceof Error ? err : new Error("Kunne ikke gemme automatisering."));
        throw err;
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
