"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Headphones, CheckCircle2 } from "lucide-react";
import { useClerkSupabase } from "@/lib/useClerkSupabase";
import { FreshdeskSheet } from "./FreshdeskSheet";

export function FreshdeskConnectCard() {
  const supabase = useClerkSupabase();
  // Lagrer den seneste integration-record så vi kan vise status + udfylde sheet.
  const [integration, setIntegration] = useState(null);
  // Bliver brugt hvis vi senere ønsker skelet loading og for at undgå dobbelt kald.
  const [loading, setLoading] = useState(true);

  // Henter Freshdesk integrationen for den aktive bruger via Supabase RLS.
  const loadIntegration = useCallback(async () => {
    if (!supabase) return; // Clerk kan være langsom til at levere en tokeniseret klient.
    const { data, error } = await supabase
      .from("integrations")
      .select("*")
      .eq("provider", "freshdesk")
      .maybeSingle();

    if (!error && data) {
      setIntegration(data);
    }
    setLoading(false);
  }, [supabase]);

  // Når komponenten mounts (eller supabase klienten ændrer sig) forsøger vi at hente integrationen igen.
  useEffect(() => {
    loadIntegration();
  }, [loadIntegration]);

  // Udleder state flags for UI og sheets.
  const isConnected = integration?.is_active;
  const domain = integration?.config?.domain;

  return (
    <Card className="flex h-full flex-col border bg-card/60 shadow-sm">
      <CardHeader className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border bg-muted/40">
          <Headphones className="h-6 w-6 text-blue-600" />
        </div>
        <div className="space-y-1">
          <CardTitle>Freshdesk</CardTitle>
          <CardDescription>  Lad agenten læse sager og oprette svarkladder direkte i freshdesk
            system.</CardDescription>
        </div>
      </CardHeader>

      {/* Viser domænet når integrationen er aktiv, ellers holder vi kortet tomt så teksten fra header beskriver produktet. */}
      <CardContent className="flex-1">
        {isConnected && domain ? (
          <div className="mt-2 flex min-w-0 items-center gap-2 rounded-md bg-muted/40 px-3 py-2 font-mono text-xs text-muted-foreground">
            <span className="h-2 w-2 flex-shrink-0 rounded-full bg-green-500 animate-pulse" />
            <span className="truncate">{domain}</span>
          </div>
        ) : null}
      </CardContent>

      {/* Foden samler statusbadgen og åbner konfigurator-sheetet */}
      <CardFooter className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 p-4">
        {isConnected ? (
          <div className="flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Aktiv
          </div>
        ) : (
          <span className="text-xs font-medium text-muted-foreground">
            Ikke forbundet
          </span>
        )}

        {/* Sheet håndterer både connect, update og disconnect – vi sender data + refetch callback */}
        <FreshdeskSheet initialData={integration} onConnected={loadIntegration}>
          <Button size="sm" variant={isConnected ? "outline" : "default"}>
            {isConnected ? "Manage" : "Connect"}
          </Button>
        </FreshdeskSheet>
      </CardFooter>
    </Card>
  );
}
