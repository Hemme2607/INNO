import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const normalizeEmail = (value) => (typeof value === "string" ? value.trim().toLowerCase() : "");

const normalizeOrderNumber = (value) => {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  const digits = trimmed.replace(/\D/g, "");
  return digits || trimmed;
};

const buildKey = ({ email, orderNumber }) => {
  const parts = [];
  const normalizedEmail = normalizeEmail(email);
  const normalizedOrder = normalizeOrderNumber(orderNumber);
  if (normalizedOrder) parts.push(`order:${normalizedOrder}`);
  if (normalizedEmail) parts.push(`email:${normalizedEmail}`);
  return parts.join("|");
};

export function useCustomerLookup({ email, orderNumber, subject, enabled = false }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const key = useMemo(
    () => buildKey({ email, orderNumber }),
    [email, orderNumber]
  );
  const lastKeyRef = useRef("");

  const fetchLookup = useCallback(
    async (forceRefresh = false) => {
      if (!enabled) return;
      if (!email && !orderNumber && !subject) {
        setData(null);
        setError(null);
        return;
      }
      if (!forceRefresh && key && lastKeyRef.current === key) {
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/inbox/customer-lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, orderNumber, subject, forceRefresh }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload?.error || "Could not fetch customer.");
        }
        setData(payload ?? null);
        lastKeyRef.current = key;
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error."));
      } finally {
        setLoading(false);
      }
    },
    [email, enabled, key, orderNumber, subject]
  );

  useEffect(() => {
    if (!enabled) return;
    fetchLookup(false);
  }, [enabled, key, fetchLookup]);

  useEffect(() => {
    if (!key || key === lastKeyRef.current) return;
    setData(null);
    setError(null);
  }, [key]);

  return {
    data,
    loading,
    error,
    refresh: () => fetchLookup(true),
  };
}
