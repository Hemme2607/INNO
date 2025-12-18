"use client";

import { useCallback, useEffect, useState } from "react";
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
import { Check, Copy, AlertCircle } from "lucide-react";
import { useClerkSupabase } from "@/lib/useClerkSupabase";
import { useAuth, useUser } from "@clerk/nextjs"; // Vi bruger Clerk hook til at vise navn og hente token

// Webhook base danner unikke endpoints per Clerk user id.
const BASE_WEBHOOK_URL = "https://api.sona.ai/webhooks/freshdesk";
// Clerk token template der skal bruges til Supabase RLS (kan overrides via env).
const SUPABASE_TEMPLATE =
  process.env.NEXT_PUBLIC_CLERK_SUPABASE_TEMPLATE?.trim() || "supabase";
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const base64Alphabet =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

const isValidUuid = (value) =>
  typeof value === "string" && UUID_REGEX.test(value);

// Utility til at normalisere JWT payloaden inden vi laver manuel base64 dekodning.
const base64UrlToBase64 = (input) => {
  if (typeof input !== "string" || !input.length) {
    return "";
  }
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = (4 - (normalized.length % 4)) % 4;
  return normalized.padEnd(normalized.length + padding, "=");
};

// Minimal base64 decoder (undgår window.atob i SSR).
const decodeBase64 = (input) => {
  let result = "";
  let buffer = 0;
  let bits = 0;
  for (const char of input) {
    if (char === "=") break;
    const value = base64Alphabet.indexOf(char);
    if (value === -1) continue;
    buffer = (buffer << 6) | value;
    bits += 6;
    while (bits >= 8) {
      bits -= 8;
      const byte = (buffer >> bits) & 0xff;
      result += String.fromCharCode(byte);
    }
  }
  return result;
};

// Læser Clerk JWT for at hive supabase_user_id feltet ud.
const decodeJwtPayload = (token) => {
  if (typeof token !== "string" || !token.includes(".")) return null;
  const [, payloadPart] = token.split(".");
  if (!payloadPart) return null;
  try {
    const normalized = base64UrlToBase64(payloadPart);
    const decoded = decodeBase64(normalized);
    return JSON.parse(decoded);
  } catch (_err) {
    return null;
  }
};

// Simpel hex encoding til MVP (Husk: Rigtig kryptering bør ske server-side)
function encodeToBytea(value) {
  if (!value) return null;
  const hex = Array.from(new TextEncoder().encode(value))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return `\\x${hex}`;
}

export function FreshdeskSheet({ children, onConnected, initialData = null }) {
  const supabase = useClerkSupabase();
  const { getToken } = useAuth();
  const { user } = useUser(); // Hent brugeren direkte fra Clerk
  
  // Sheetens UI-state
  const [open, setOpen] = useState(false);
  // Clipboard feedback state
  const [copied, setCopied] = useState(false);
  // Formularfelter
  const [domain, setDomain] = useState("");
  const [apiKey, setApiKey] = useState("");
  // Async state for submit/disconnect
  const [submitting, setSubmitting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  // Viser fejlbeskeder tæt på CTA
  const [error, setError] = useState("");
  const hasExistingConfig = Boolean(initialData);

  // Webhook URL er per Clerk bruger – bruges senere i Supabase config.
  const uniqueWebhookUrl = user
    ? `${BASE_WEBHOOK_URL}?userId=${user.id}`
    : "Loading URL...";

  // Kopierer webhook URL til brugerens clipboard og viser en kort indikator.
  const handleCopy = async () => {
    if (!user) return;
    try {
      await navigator.clipboard.writeText(uniqueWebhookUrl);
      setCopied(true);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  // Resetter "kopieret" status efter 2 sekunder for at kunne vise animation igen.
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  // Når sheetet åbner genudfylder vi felter fra eksisterende integration, ellers rydder vi dem.
  useEffect(() => {
    if (open) {
      const existingDomain = initialData?.config?.domain ?? "";
      const existingApiKey =
        initialData?.config?.apiKey ??
        initialData?.config?.api_key ??
        initialData?.apiKey ??
        initialData?.api_key ??
        "";
      setDomain(existingDomain || "");
      setApiKey(existingApiKey || "");
    } else if (!initialData) {
      setDomain("");
      setApiKey("");
    }
  }, [open, initialData]);

  // Forsøger at aflæse Supabase UUID direkte fra Clerk JWT payloaden.
  const resolveUserIdFromToken = useCallback(async () => {
    if (typeof getToken !== "function") return null;
    try {
      const templateToken = await getToken({ template: SUPABASE_TEMPLATE });
      const payload = decodeJwtPayload(templateToken);
      const claimUuid =
        typeof payload?.supabase_user_id === "string"
          ? payload.supabase_user_id
          : null;
      const sub = typeof payload?.sub === "string" ? payload.sub : null;
      const candidate = isValidUuid(claimUuid) ? claimUuid : sub;
      if (isValidUuid(candidate)) {
        return candidate;
      }
    } catch (tokenError) {
      console.warn(
        "FreshdeskSheet: clerk token did not include supabase uuid",
        tokenError
      );
    }
    return null;
  }, [getToken]);

  // Fallback 2: slå Clerk user id op i profiles tabellen i Supabase.
  const fetchProfileUserId = useCallback(async () => {
    if (!supabase || !user?.id) return null;
    const { data, error: profileError } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("clerk_user_id", user.id)
      .maybeSingle();
    if (profileError) {
      console.warn("FreshdeskSheet: could not fetch profile user id", profileError);
      return null;
    }
    return isValidUuid(data?.user_id) ? data.user_id : null;
  }, [supabase, user?.id]);

  // Kombinerer alle strategier for at sikre at vi ender med et Supabase user id.
  const ensureUserId = useCallback(async () => {
    const metadataUuid = user?.publicMetadata?.supabase_uuid;
    if (isValidUuid(metadataUuid)) return metadataUuid;

    const tokenUuid = await resolveUserIdFromToken();
    if (isValidUuid(tokenUuid)) return tokenUuid;

    const profileUuid = await fetchProfileUserId();
    if (isValidUuid(profileUuid)) return profileUuid;

    return null;
  }, [
    user?.publicMetadata?.supabase_uuid,
    resolveUserIdFromToken,
    fetchProfileUserId,
  ]);

  // Gemmer/forbinder integrationen via Supabase og lukker sheet ved succes.
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!supabase || !user) return;

    if (!domain.trim() || !apiKey.trim()) {
      setError("Enter both domain and API key.");
      return;
    }

    setSubmitting(true);
    setError("");

    // Vi fjerner 'https://' hvis brugeren tastede det, for at holde det rent
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');

    let supabaseUserId;
    // Prøv først at hente direkte fra Supabase sessionen
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (!authError && isValidUuid(authData?.user?.id)) {
        supabaseUserId = authData.user.id;
      }
    } catch (_err) {
      // ignorer – vi prøver fallback nedenfor
    }

    if (!supabaseUserId) {
      try {
        supabaseUserId = await ensureUserId();
      } catch (uuidError) {
        console.error("Could not fetch Supabase user ID:", uuidError);
      }
    }

    if (!isValidUuid(supabaseUserId)) {
      setError("Supabase user ID is not ready yet.");
      setSubmitting(false);
      return;
    }

    const payload = {
      user_id: supabaseUserId,
      provider: "freshdesk",
      config: {
        domain: cleanDomain,
        webhook_url: uniqueWebhookUrl,
      },
      credentials_enc: encodeToBytea(apiKey.trim()),
      is_active: true,
      updated_at: new Date().toISOString()
    };

    const { error: upsertError } = await supabase
      .from("integrations")
      .upsert(payload, { onConflict: "user_id,provider" });

    if (upsertError) {
      console.error("Error saving integration:", upsertError);
      setError("Could not save. Check the console for details.");
    } else {
      onConnected?.();
      setOpen(false);
      setDomain(cleanDomain);
      setApiKey(""); // Clear sensitive data
    }
    setSubmitting(false);
  };

  // Kaldes når brugeren klikker på "Disconnect integration" knappen.
  const handleDisconnect = async () => {
    if (!hasExistingConfig) return;
    setDisconnecting(true);
    setError("");
    try {
      const response = await fetch("/api/integrations/freshdesk", {
        method: "DELETE",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message =
          typeof data?.error === "string"
            ? data.error
            : "Could not disconnect the integration.";
        throw new Error(message);
      }
      setDomain("");
      setApiKey("");
      setOpen(false);
      onConnected?.();
    } catch (disconnectError) {
      console.error("Error disconnecting Freshdesk:", disconnectError);
      setError(
        disconnectError?.message ||
          "Could not disconnect the integration. Try again."
      );
    } finally {
      setDisconnecting(false);
    }
  };

  const primaryCtaLabel = submitting
    ? hasExistingConfig
      ? "Updating..."
      : "Connecting..."
    : hasExistingConfig
    ? "Update Configuration"
    : "Connect Freshdesk";

  const disconnectLabel = disconnecting
    ? "Disconnecting..."
    : "Disconnect Integration";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>
            {hasExistingConfig ? "Update Freshdesk" : "Connect Freshdesk"}
          </SheetTitle>
          <SheetDescription>
            Enter an API key and set up the webhook to activate the agent.
          </SheetDescription>
        </SheetHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* TRIN 1 */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">1. Access</h3>
            <div className="space-y-2">
              <Label htmlFor="fd-domain">Freshdesk domain</Label>
              <Input
                id="fd-domain"
                placeholder="your-store.freshdesk.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fd-api">API Key</Label>
              <Input
                id="fd-api"
                type="password"
                placeholder="••••••••••••••"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground">
                Find it under Profile Settings in Freshdesk.
              </p>
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          {/* TRIN 2 - Webhook */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
               <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">2. Setup</h3>
               <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-bold">Important</span>
            </div>
            
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
               <div className="flex items-center gap-2 text-xs text-slate-700">
                  <AlertCircle className="w-3 h-3" />
                  <span>Copy this URL into Freshdesk Automation:</span>
               </div>
               <div className="flex gap-2">
                <Input 
                  readOnly 
                  value={uniqueWebhookUrl} 
                  className="bg-white font-mono text-xs h-9"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0 h-9 w-9"
                  onClick={handleCopy}
                >
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Create a new automation in Freshdesk that triggers on ticket creation or updates, and use this URL as the webhook destination.
            </p>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <SheetFooter className="pt-4 flex-col gap-3 sm:flex-col">
            <Button
              type="submit"
              className="w-full bg-black text-white"
              disabled={submitting || disconnecting}
            >
              {primaryCtaLabel}
            </Button>
            {hasExistingConfig && (
              <Button
                type="button"
                variant="outline"
                className="w-full border-red-200 text-red-600 hover:bg-red-50"
                onClick={handleDisconnect}
                disabled={disconnecting || submitting}
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
