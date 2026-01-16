"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { useClerkSupabase } from "@/lib/useClerkSupabase";
import { GorgiasSheet } from "./GorgiasSheet";
import gorgiasLogo from "../../../../assets/gorgias-removebg-preview.png";

export function GorgiasConnectCard() {
  const supabase = useClerkSupabase();
  const [integration, setIntegration] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadIntegration = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from("integrations")
      .select("*")
      .eq("provider", "gorgias")
      .maybeSingle();

    if (!error && data) {
      setIntegration(data);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadIntegration();
  }, [loadIntegration]);

  const isConnected = integration?.is_active;
  const domain = integration?.config?.domain;

  return (
    <Card className="flex h-full flex-col border bg-card/60 shadow-sm">
      <CardHeader className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border bg-muted/40">
          <Image
            src={gorgiasLogo}
            alt="Gorgias logo"
            width={40}
            height={40}
            className="object-contain"
          />
        </div>
        <div className="space-y-1">
          <CardTitle>Gorgias</CardTitle>
          <CardDescription>
            Let the agent read tickets and create reply drafts directly in Gorgias.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        {isConnected && domain ? (
          <div className="mt-2 flex min-w-0 items-center gap-2 rounded-md bg-muted/40 px-3 py-2 font-mono text-xs text-muted-foreground">
            <span className="h-2 w-2 flex-shrink-0 rounded-full bg-green-500 animate-pulse" />
            <span className="truncate">{domain}</span>
          </div>
        ) : null}
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 p-4">
        {isConnected ? (
          <div className="flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Active
          </div>
        ) : (
          <span className="text-xs font-medium text-muted-foreground">
            Not connected
          </span>
        )}

        <GorgiasSheet initialData={integration} onConnected={loadIntegration}>
          <Button size="sm" variant={isConnected ? "outline" : "default"}>
            {isConnected ? "Manage" : "Connect"}
          </Button>
        </GorgiasSheet>
      </CardFooter>
    </Card>
  );
}
