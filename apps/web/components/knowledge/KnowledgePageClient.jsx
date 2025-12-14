"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Bold,
  DownloadCloud,
  FileText,
  Italic,
  List,
  RefreshCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClerkSupabase } from "@/lib/useClerkSupabase";

const fieldConfig = [
  {
    key: "policy_refund",
    label: "Returret",
    description: "Hvordan kunder returnerer/ombytter – frister, betingelser, gebyrer.",
    icon: ShieldCheck,
  },
  {
    key: "policy_shipping",
    label: "Fragt & Levering",
    description: "Leveringstider, fragtpriser, ekspres, sporingslinks, undtagelser.",
    icon: Truck,
  },
  {
    key: "policy_terms",
    label: "Handelsbetingelser",
    description: "Betaling, fortrydelse, reklamation, garantier.",
    icon: FileText,
  },
  {
    key: "internal_tone",
    label: "Interne regler",
    description: "Tone-of-voice, rabatter, eskalationsregler – kun internt for agenten.",
    icon: Sparkles,
  },
];

export function KnowledgePageClient() {
  const supabase = useClerkSupabase();
  const [values, setValues] = useState({
    policy_refund: "",
    policy_shipping: "",
    policy_terms: "",
    internal_tone: "",
  });
  const [shopId, setShopId] = useState(null);
  const [shopDomain, setShopDomain] = useState("");
  const [manualDomain, setManualDomain] = useState("");
  const [manualToken, setManualToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [activeTab, setActiveTab] = useState("policy_refund");

  const updateField = useCallback((key, next) => {
    setValues((prev) => ({ ...prev, [key]: next }));
  }, []);

  const loadData = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("shops")
        .select("id, shop_domain, policy_refund, policy_shipping, policy_terms, internal_tone")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (data) {
        setShopId(data.id);
        setShopDomain(data.shop_domain || "");
        setValues({
          policy_refund: data.policy_refund || "",
          policy_shipping: data.policy_shipping || "",
          policy_terms: data.policy_terms || "",
          internal_tone: data.internal_tone || "",
        });
        setManualDomain("");
        setManualToken("");
      } else {
        setShopId(null);
        setShopDomain("");
        setValues({
          policy_refund: "",
          policy_shipping: "",
          policy_terms: "",
          internal_tone: "",
        });
        // behold eventuelle manuelt indtastede felter
      }
    } catch (error) {
      console.warn("Load policies failed:", error);
      toast.error("Kunne ikke hente politikker.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadData().catch(() => null);
  }, [loadData]);

  const handleImport = async () => {
    setImporting(true);
    try {
      const response = await fetch("/api/shopify/import-policies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shop_domain: manualDomain || undefined,
          access_token: manualToken || undefined,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = typeof payload?.error === "string" ? payload.error : "Kunne ikke hente fra Shopify.";
        throw new Error(message);
      }

      const policyCount = payload?.meta?.policyCount ?? null;
      const policyTypes = Array.isArray(payload?.meta?.policyTypes) ? payload.meta.policyTypes : [];

      setValues((prev) => ({
        ...prev,
        policy_refund: payload?.refund ?? prev.policy_refund,
        policy_shipping: payload?.shipping ?? prev.policy_shipping,
        policy_terms: payload?.terms ?? prev.policy_terms,
      }));
      if (policyCount === 0) {
        toast.info("Ingen politikker fundet i Shopify. Tjek at de er udfyldt og at token har read_legal_policies.");
      } else {
        toast.success(
          `Politikker hentet fra Shopify (${policyCount} fundet${policyTypes.length ? `: ${policyTypes.join(", ")}` : ""}).`
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Importen fejlede.";
      toast.error(message);
    } finally {
      setImporting(false);
    }
  };

  const handleSave = async () => {
    if (!supabase) {
      toast.error("Supabase klient er ikke klar endnu.");
      return;
    }
    if (!shopId) {
      toast.error("Ingen Shopify butik fundet. Forbind din butik først.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        policy_refund: values.policy_refund,
        policy_shipping: values.policy_shipping,
        policy_terms: values.policy_terms,
        internal_tone: values.internal_tone,
      };
      const { error } = await supabase.from("shops").update(payload).eq("id", shopId);
      if (error) throw error;
      toast.success("Politikker gemt.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Kunne ikke gemme.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const internalToneClasses =
    "min-h-[220px] w-full resize-y rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm shadow-inner focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:ring-offset-2";

  const tabByKey = useMemo(
    () => fieldConfig.reduce((acc, item) => ({ ...acc, [item.key]: item }), {}),
    []
  );

  const active = tabByKey[activeTab] || fieldConfig[0];

  return (
    <div className="space-y-5">
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl">Politikker & regler</CardTitle>
            <CardDescription>
              Retur, levering, handelsbetingelser og interne instrukser sendes til AI-agenten.
            </CardDescription>
            {shopDomain ? (
              <p className="text-xs text-muted-foreground">
                Forbundet til: <span className="font-mono">{shopDomain}</span>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Ingen Shopify butik fundet. Indtast domæne og access token for at hente direkte, eller forbind via Integrations.
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleImport}
              disabled={importing || loading}
              className="gap-2"
            >
              {importing ? (
                <>
                  <RefreshCcw className="h-4 w-4 animate-spin" />
                  Henter...
                </>
              ) : (
                <>
                  <DownloadCloud className="h-4 w-4" />
                  Hent fra Shopify
                </>
              )}
            </Button>
            <Button type="button" onClick={handleSave} disabled={saving || loading} className="gap-2">
              {saving ? (
                <>
                  <RefreshCcw className="h-4 w-4 animate-spin" />
                  Gemmer...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Gem ændringer
        </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {!shopDomain ? (
        <Card className="border border-gray-200 bg-gray-50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Hent uden gemt forbindelse</CardTitle>
            <CardDescription className="text-sm">
              Brug dit Shopify-domæne og Admin API adgangsnøgle for at hente politikker én gang. (Gemmer ikke værdierne.)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 lg:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Shopify domæne</p>
                <input
                  type="text"
                  value={manualDomain}
                  onChange={(e) => setManualDomain(e.target.value)}
                  placeholder="myshop.myshopify.com"
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-blue-500/30"
                  disabled={loading || importing}
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Admin API Access Token</p>
                <input
                  type="password"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  placeholder="shpat_xxx"
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-blue-500/30"
                  disabled={loading || importing}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Tip: Find token under Shopify Admin → Apps → Develop apps → Admin API access token.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">Sektioner</p>
                <p className="text-xs text-muted-foreground">Vælg en sektion for at redigere indhold.</p>
              </div>
              <TabsList className="bg-muted/60">
                {fieldConfig.map((field) => (
                  <TabsTrigger key={field.key} value={field.key}>
                    <field.icon className="mr-2 h-4 w-4" />
                    {field.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                {active?.icon ? <active.icon className="h-4 w-4 text-muted-foreground" /> : null}
                <span>{active?.label}</span>
              </div>
              <p className="text-xs text-muted-foreground">{active?.description}</p>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {fieldConfig.map((field) => (
              <TabsContent key={field.key} value={field.key} className="mt-0">
                <RichTextarea
                  value={values[field.key]}
                  onValueChange={(next) => updateField(field.key, next)}
                  placeholder={
                    field.key === "internal_tone"
                      ? "Skriv din interne tone, ekstra regler eller midlertidige kampagner."
                      : "Indsæt politiktekst..."
                  }
                  disabled={loading}
                  variant={field.key === "internal_tone" ? "internal" : "default"}
                />
              </TabsContent>
            ))}
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}

function RichTextarea({ value, onValueChange, placeholder, disabled, variant = "default" }) {
  const ref = useRef(null);

  const applyWrap = (prefix, suffix) => {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? start;
    const current = el.value ?? "";
    const selected = start !== end ? current.slice(start, end) : "tekst";
    const nextValue = current.slice(0, start) + prefix + selected + suffix + current.slice(end);
    onValueChange(nextValue);
    const cursorPos = start + prefix.length + selected.length;
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(cursorPos, cursorPos);
    });
  };

  const applyBullet = () => {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? start;
    const current = el.value ?? "";
    const lineStart = current.lastIndexOf("\n", start - 1) + 1;
    const lineEnd = current.indexOf("\n", end);
    const segmentEnd = lineEnd === -1 ? current.length : lineEnd;
    const segment = current.slice(lineStart, segmentEnd);
    const lines = segment.split("\n").map((line) => (line.trim().length ? `- ${line.replace(/^-\\s*/, "")}` : "- "));
    const nextSegment = lines.join("\n");
    const nextValue = current.slice(0, lineStart) + nextSegment + current.slice(segmentEnd);
    onValueChange(nextValue);
    const cursorPos = segmentEnd + 2;
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(cursorPos, cursorPos);
    });
  };

  const baseClass =
    "min-h-[220px] w-full resize-y rounded-xl px-4 py-3 text-sm shadow-inner focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:ring-offset-2";
  const variantClass =
    variant === "internal"
      ? "border border-blue-200 bg-blue-50"
      : "border border-gray-200 bg-white";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5">
        <ToolbarButton onClick={() => applyWrap("**", "**")} icon={Bold} label="Fed" />
        <ToolbarButton onClick={() => applyWrap("*", "*")} icon={Italic} label="Kursiv" />
        <ToolbarButton onClick={applyBullet} icon={List} label="Punktliste" />
      </div>
      <Textarea
        ref={ref}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        placeholder={placeholder}
        rows={10}
        className={`${baseClass} ${variantClass}`}
        disabled={disabled}
      />
    </div>
  );
}

function ToolbarButton({ onClick, icon: Icon, label }) {
  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      className="h-8 gap-1 rounded-md border border-transparent px-2 text-xs font-medium text-foreground hover:border-gray-200"
      onClick={onClick}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Button>
  );
}
