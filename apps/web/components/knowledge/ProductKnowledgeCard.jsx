"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useClerkSupabase } from "@/lib/useClerkSupabase";

export function ProductKnowledgeCard() {
  const supabase = useClerkSupabase();
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const loadCount = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { count: productCount, error } = await supabase
        .from("shop_products")
        .select("*", { count: "exact", head: true })
        // RLS will scope to the current user; no manual filter to avoid mismatch on ids
        ;
      if (error) throw error;
      setCount(productCount ?? 0);
    } catch (error) {
      console.warn("ProductKnowledgeCard: load failed", error);
      toast.error("Could not load product knowledge.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCount().catch(() => null);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/knowledge/sync-products", { method: "POST" });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = typeof payload?.error === "string" ? payload.error : "Sync failed.";
        throw new Error(message);
      }
      toast.success(`Synced ${payload?.synced ?? 0} products.`);
      await loadCount();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sync failed.";
      toast.error(message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Database className="h-4 w-4 text-slate-500" />
            Product Catalog
          </CardTitle>
          <CardDescription>Product knowledge for the agent.</CardDescription>
        </div>
        <Button size="sm" onClick={handleSync} disabled={syncing} className="gap-2">
          {syncing ? "Syncing..." : "Sync Products"}
        </Button>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Sona has indexed <span className="font-semibold text-foreground">{loading ? "…" : count}</span>{" "}
          products from your store.
        </p>
      </CardContent>
    </Card>
  );
}
