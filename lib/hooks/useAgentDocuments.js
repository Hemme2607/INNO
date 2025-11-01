import { useCallback, useEffect, useMemo, useState } from "react";
import { useClerkSupabase } from "../supabaseClient";

function mapDocument(row) {
  return {
    id: row.id,
    userId: row.user_id,
    fileName: row.file_name,
    fileSize: row.file_size ?? null,
    storagePath: row.storage_path ?? null,
    description: row.description ?? "",
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

export function useAgentDocuments(options = {}) {
  const { lazy = false, userId: providedUserId } = options;
  const supabase = useClerkSupabase();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(!lazy);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const loadDocuments = useCallback(async () => {
    if (!providedUserId) {
      setDocuments([]);
      setLoading(false);
      return [];
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await supabase
        .from("agent_documents")
        .select("*")
        .eq("user_id", providedUserId)
        .order("created_at", { ascending: false });
      if (queryError) throw queryError;
      const nextDocuments = Array.isArray(data) ? data.map(mapDocument) : [];
      setDocuments(nextDocuments);
      return nextDocuments;
    } catch (err) {
      const wrappedError =
        err instanceof Error ? err : new Error("Kunne ikke hente dokumenter.");
      setError(wrappedError);
      throw wrappedError;
    } finally {
      setLoading(false);
    }
  }, [providedUserId, supabase]);

  const createDocumentRecord = useCallback(
    async ({ fileName, fileSize, storagePath, description }) => {
      setProcessing(true);
      setError(null);
      try {
        if (!providedUserId) {
          throw new Error("Brugeren er ikke klar endnu.");
        }
        const payload = {
          user_id: providedUserId,
          file_name: fileName,
          file_size: fileSize ?? null,
          storage_path: storagePath ?? null,
          description: description ?? null,
        };
        const { data, error: insertError } = await supabase
          .from("agent_documents")
          .insert(payload)
          .select()
          .single();
        if (insertError) throw insertError;
        const document = mapDocument(data);
        setDocuments((prev) => [document, ...prev]);
        return document;
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Kunne ikke gemme dokumentmetadata."));
        throw err;
      } finally {
        setProcessing(false);
      }
    },
    [providedUserId, supabase]
  );

  const deleteDocumentRecord = useCallback(
    async (id) => {
      setProcessing(true);
      setError(null);
      try {
        const { error: deleteError } = await supabase
          .from("agent_documents")
          .delete()
          .eq("id", id);
        if (deleteError) throw deleteError;
        setDocuments((prev) => prev.filter((item) => item.id !== id));
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Kunne ikke slette dokument."));
        throw err;
      } finally {
        setProcessing(false);
      }
    },
    [supabase]
  );

  useEffect(() => {
    if (!lazy && providedUserId) {
      loadDocuments().catch(() => null);
    }
  }, [lazy, loadDocuments, providedUserId]);

  return useMemo(
    () => ({
      documents,
      loading,
      processing,
      error,
      refresh: loadDocuments,
      createDocumentRecord,
      deleteDocumentRecord,
    }),
    [documents, loading, processing, error, loadDocuments, createDocumentRecord, deleteDocumentRecord]
  );
}
