"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useClerkSupabase } from "@/lib/useClerkSupabase";
import shopifyLogo from "../../../../assets/Shopify-Logo.png";

export function ShopifyConnectCard() {
  const supabase = useClerkSupabase();
  const [connection, setConnection] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadConnection() {
      if (!supabase) return;
      setLoading(true);
      // Supabase RLS sørger for at brugeren kun ser sin egen shop, fordi tokenet kommer fra Clerk.
      const { data, error } = await supabase
        .from("shops")
        .select("shop_domain, owner_user_id")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!isMounted) {
        return;
      }

      if (error) {
        console.warn("Kunne ikke hente Shopify connection:", error);
        setConnection(null);
      } else {
        setConnection(data);
      }
      setLoading(false);
    }

    loadConnection();

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  const isConnected = Boolean(connection);
  const connectedDomain = connection?.shop_domain || connection?.store_domain;
  const statusLabel = loading
    ? "Henter..."
    : isConnected
    ? "Aktiv"
    : "Ikke tilsluttet";

  const badgeVariant = isConnected ? "default" : "secondary";
  const buttonLabel = isConnected ? "Manage" : "Connect Shopify Store";

  return (
    <Card className="flex h-full max-w-sm flex-col border bg-card/60 shadow-sm">
      <CardHeader className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border bg-muted/40">
          <Image
            src={shopifyLogo}
            alt="Shopify logo"
            width={80}
            height={80}
            className="object-contain"
          />
        </div>
        <div className="space-y-1">
          <CardTitle>Shopify</CardTitle>
          <CardDescription>
            Forbind din Shopify store og synkroniser ordrer og kunder med Sona.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-1 text-sm">
        {isConnected && connectedDomain ? (
          <div
            className="flex min-w-0 items-center gap-2 rounded-md border border-slate-100 bg-slate-50 p-2 text-xs font-medium text-slate-600"
            title={connectedDomain}
          >
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="truncate">{connectedDomain}</span>
          </div>
        ) : null}
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 p-4">
        <Badge variant={badgeVariant}>{statusLabel}</Badge>
        <Sheet>
          <SheetTrigger asChild>
            <Button size="sm">{buttonLabel}</Button>
          </SheetTrigger>
          <SheetContent side="right" className="sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Connect Shopify</SheetTitle>
              <SheetDescription>
                Indtast domæne og en API-nøgle med adgang til ordrer og kunder.
              </SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="shopify-domain">Shopify domæne</Label>
                <Input
                  id="shopify-domain"
                  placeholder="din-butik.myshopify.com"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shopify-api">Admin API key</Label>
                <Input
                  id="shopify-api"
                  placeholder="shpat_..."
                  autoComplete="off"
                />
              </div>
            </div>
            <SheetFooter>
              <Button className="w-full">Connect</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </CardFooter>
    </Card>
  );
}
