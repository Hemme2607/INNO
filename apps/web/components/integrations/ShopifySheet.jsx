"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@clerk/nextjs";
import { useClerkSupabase } from "@/lib/useClerkSupabase";

// Vi rammer de samme Supabase Edge Functions som mobilappen gør.
const SUPABASE_URL =
  (process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    ""
  ).replace(/\/$/, "");
const FUNCTIONS_BASE = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1` : null;

// Normaliserer brugerinput så vi gemmer et rent domæne.
const normalizeDomain = (value) =>
  value
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "")
    .toLowerCase();

export function ShopifySheet({
  children,
  onConnected,
  initialConnection = null,
}) {
  const { getToken } = useAuth();
  const supabase = useClerkSupabase();

  // Lokale form- og UI-states
  const [open, setOpen] = useState(false);
  const [domain, setDomain] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // Vi kan kun disconnecte hvis der findes en shop_domain i Supabase.
  const existingDomain =
    initialConnection?.shop_domain || initialConnection?.store_domain || "";
  const hasExistingConnection = Boolean(existingDomain);

  // Synker feltværdier når sheetet åbnes og rydder fejl når man lukker det igen.
  useEffect(() => {
    if (open) {
      setDomain(existingDomain || "");
      setApiKey("");
      setError("");
    }
  }, [open, existingDomain]);

  // Forbinder eller opdaterer Shopify integrationen via Supabase functionen.
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!FUNCTIONS_BASE) {
      setError("Supabase url ikke sat i miljøvariabler.");
      return;
    }

    const cleanDomain = normalizeDomain(domain);
    const tokenValue = apiKey.trim();

    if (!cleanDomain) {
      setError("Indtast dit Shopify domæne.");
      return;
    }

    if (!tokenValue) {
      setError("Indtast din Admin API adgangsnøgle.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const clerkToken = await getToken();
      if (!clerkToken) {
        throw new Error("Kunne ikke hente Clerk session token.");
      }

      const response = await fetch(`${FUNCTIONS_BASE}/shopify-connect`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${clerkToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          domain: cleanDomain,
          accessToken: tokenValue,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message =
          typeof payload?.error === "string"
            ? payload.error
            : "Kunne ikke forbinde Shopify.";
        throw new Error(message);
      }

      setOpen(false);
      setApiKey("");
      setDomain(cleanDomain);
      await onConnected?.();
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Ukendt fejl ved forbindelse til Shopify.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Frakobler Shopify ved at slette butikken fra shops tabellen.
  const handleDisconnect = async () => {
    if (!supabase) {
      setError("Supabase klient er ikke klar endnu.");
      return;
    }

    if (!existingDomain) {
      setError("Der er ingen aktiv Shopify forbindelse at fjerne.");
      return;
    }

    setDisconnecting(true);
    setError("");

    try {
      const { error: deleteError } = await supabase
        .from("shops")
        .delete()
        .eq("shop_domain", existingDomain);

      if (deleteError) {
        throw deleteError;
      }

      setDomain("");
      setApiKey("");
      setOpen(false);
      await onConnected?.();
    } catch (disconnectError) {
      const message =
        disconnectError instanceof Error
          ? disconnectError.message
          : "Kunne ikke fjerne Shopify integrationen.";
      setError(message);
    } finally {
      setDisconnecting(false);
    }
  };

  // Primær CTA skifter text afhængigt af state og om der findes data i forvejen.
  const primaryLabel = submitting
    ? hasExistingConnection
      ? "Opdaterer..."
      : "Forbinder..."
    : hasExistingConnection
    ? "Opdater konfiguration"
    : "Connect Shopify";

  // Separat label til disconnect knappen for tydelig statusfeedback.
  const disconnectLabel = disconnecting
    ? "Afbryder..."
    : "Disconnect integration";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>
            {hasExistingConnection ? "Opdater Shopify" : "Connect Shopify"}
          </SheetTitle>
          <SheetDescription>
            Indsæt dit shop-domæne og Admin API nøgle for at forbinde Shopify.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="shopify-domain">Shopify domæne</Label>
            <Input
              id="shopify-domain"
              placeholder="din-butik.myshopify.com"
              autoComplete="off"
              value={domain}
              onChange={(event) => setDomain(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shopify-api">Admin API key</Label>
            <Input
              id="shopify-api"
              type="password"
              placeholder="shpat_..."
              autoComplete="off"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
            />
            <p className="text-[10px] text-muted-foreground">
              Find den under Apps &gt; Develop apps &gt; API credentials.
            </p>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <SheetFooter className="pt-2 flex-col gap-3 sm:flex-col">
            <Button
              type="submit"
              className="w-full"
              disabled={submitting || disconnecting}
            >
              {primaryLabel}
            </Button>
            {hasExistingConnection && (
              <Button
                type="button"
                variant="outline"
                className="w-full border-red-200 text-red-600 hover:bg-red-50"
                disabled={disconnecting || submitting}
                onClick={handleDisconnect}
              >
                {disconnectLabel}
              </Button>
            )}
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
