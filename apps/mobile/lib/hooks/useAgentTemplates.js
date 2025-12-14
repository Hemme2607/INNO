// Hook der styrer hentning og CRUD for agentens standardsvar-templates i Supabase.
import { useCallback, useEffect, useMemo, useState } from "react";
import { useClerkSupabase } from "../supabaseClient";

function mapTemplate(row) {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title ?? "",
    body: row.body ?? "",
    sourceBody: row.source_body ?? "",
    linkedMailId: row.linked_mail_id ?? null,
    linkedMailProvider: row.linked_mail_provider ?? null,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

// CRUD-wrapper omkring agent_templates-tabellen med lokal state
export function useAgentTemplates(options = {}) {
  const { lazy = false, userId: providedUserId } = options;
  const supabase = useClerkSupabase();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(!lazy);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  const ensureUserId = useCallback(async () => {
    if (providedUserId) {
      return providedUserId;
    }
    throw new Error("Supabase bruger-id er ikke klar endnu.");
  }, [providedUserId]);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await supabase
        .from("agent_templates")
        .select("*")
        .order("created_at", { ascending: false });

      if (queryError) throw queryError;
      setTemplates(Array.isArray(data) ? data.map(mapTemplate) : []);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Kunne ikke hente standardsvar."));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [supabase, providedUserId]);

  const createTemplate = useCallback(
    async ({ title, body, sourceBody, linkedMailId, linkedMailProvider }) => {
      setProcessing(true);
      setError(null);
      try {
        const userId = await ensureUserId();
        const payload = {
          user_id: userId,
          title,
          body,
          source_body: sourceBody ?? null,
          linked_mail_id: linkedMailId ?? null,
          linked_mail_provider: linkedMailProvider ?? null,
        };
        const { data, error: insertError } = await supabase
          .from("agent_templates")
          .insert(payload)
          .select()
          .single();
        if (insertError) throw insertError;
        const template = mapTemplate(data);
        setTemplates((prev) => [template, ...prev]);
        return template;
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Kunne ikke oprette standardsvar."));
        throw err;
      } finally {
        setProcessing(false);
      }
    },
    [ensureUserId, supabase]
  );

  const updateTemplate = useCallback(
    async (id, updates) => {
      setProcessing(true);
      setError(null);
      try {
        const { data, error: updateError } = await supabase
          .from("agent_templates")
          .update({
            title: updates.title,
            body: updates.body,
            source_body: updates.sourceBody,
            linked_mail_id: updates.linkedMailId,
            linked_mail_provider: updates.linkedMailProvider,
          })
          .eq("id", id)
          .select()
          .single();
        if (updateError) throw updateError;
        const template = mapTemplate(data);
        setTemplates((prev) =>
          prev.map((item) => (item.id === id ? template : item))
        );
        return template;
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Kunne ikke opdatere standardsvar."));
        throw err;
      } finally {
        setProcessing(false);
      }
    },
    [supabase]
  );

  const deleteTemplate = useCallback(
    async (id) => {
      setProcessing(true);
      setError(null);
      try {
        const { error: deleteError } = await supabase
          .from("agent_templates")
          .delete()
          .eq("id", id);
        if (deleteError) throw deleteError;
        setTemplates((prev) => prev.filter((item) => item.id !== id));
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Kunne ikke slette standardsvar."));
        throw err;
      } finally {
        setProcessing(false);
      }
    },
    [supabase]
  );

  useEffect(() => {
    if (!lazy) {
      loadTemplates().catch(() => null);
    }
  }, [lazy, loadTemplates]);

  return useMemo(
    () => ({
      templates,
      loading,
      processing,
      error,
      refresh: loadTemplates,
      createTemplate,
      updateTemplate,
      deleteTemplate,
    }),
    [templates, loading, processing, error, loadTemplates, createTemplate, updateTemplate, deleteTemplate]
  );
}
