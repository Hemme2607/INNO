"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Package, XCircle, DollarSign, Archive } from "lucide-react";
import { useAgentAutomation } from "@/hooks/useAgentAutomation";

// Definition af de tilstande vi lader brugeren styre fra automation-panelet.
const toggles = [
  {
    key: "orderUpdates",
    icon: Package,
    label: "Ordreopdateringer",
    description: "Agenten må slå tracking op og give statusopdateringer til kunder.",
  },
  {
    key: "cancelOrders",
    icon: XCircle,
    label: "Tillad annullering",
    description: "Agenten må annullere ordrer hvis de ikke er afsendt endnu.",
  },
  {
    key: "automaticRefunds",
    icon: DollarSign,
    label: "Automatisk Refusion",
    description: "Tillad agenten at gennemføre mindre refunderinger automatisk.",
  },
  {
    key: "historicInboxAccess",
    icon: Archive,
    label: "Historisk Indbakke",
    description: "Giv adgang til gamle mails så agenten kan referere til tidligere samtaler.",
  },
];

const AutomationPanelContext = createContext(null);

export function useAutomationPanelActions() {
  const ctx = useContext(AutomationPanelContext);
  if (!ctx) {
    throw new Error("useAutomationPanelActions must be used within AutomationPanel");
  }
  return ctx;
}

export function AutomationPanel({ children = null }) {
  const { settings, loading, saving, error, save } = useAgentAutomation();
  // Lokalt spejl af Supabase settings så vi kan optimistisk toggle switches.
  const [local, setLocal] = useState(settings || {});
  // Skjult input i UI (ikke gemt endnu), placeholder for fremtidig funktionalitet.
  const [refundMax, setRefundMax] = useState("500");

  useEffect(() => {
    setLocal(settings || {});
  }, [settings]);

  // Hver switch får sin egen change handler der opdaterer lokale state felter.
  const handleToggle = useCallback(
    (key) => (next) => {
      setLocal((s) => ({ ...(s || {}), [key]: Boolean(next) }));
    },
    []
  );

  const handleSave = useCallback(async () => {
    try {
      // Sender kun de kendte boolean felter til hooken for at undgå utilsigtede updates.
      await save({
        orderUpdates: Boolean(local?.orderUpdates),
        cancelOrders: Boolean(local?.cancelOrders),
        automaticRefunds: Boolean(local?.automaticRefunds),
        historicInboxAccess: Boolean(local?.historicInboxAccess),
      });
    } catch (_) {
      // swallow here; the hook surfaces `error` already
    }
  }, [local, save]);

  // dirty bruges både af header knappen og lokale CTA'er.
  const dirty = useMemo(() => {
    return toggles.some(({ key }) => Boolean(local?.[key]) !== Boolean(settings?.[key]));
  }, [local, settings]);

  // Samlet API der deles via context så headeren kan gengemme ændringer.
  const contextValue = useMemo(
    () => ({
      save: handleSave,
      saving,
      loading,
      dirty,
    }),
    [handleSave, saving, loading, dirty]
  );

  return (
    <AutomationPanelContext.Provider value={contextValue}>
      {children}

      <Card className="rounded-xl border border-border bg-white shadow-sm">
        <CardContent className="p-0">
          <div className="divide-y divide-border/70">
            {toggles.map((t) => {
              const Icon = t.icon;
              const isOn = Boolean(local?.[t.key]);
              return (
                <div key={t.key} className="px-5 py-5 transition hover:bg-muted/40">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-full bg-slate-100 p-2 text-slate-700">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{t.label}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Switch
                        checked={isOn}
                        onCheckedChange={handleToggle(t.key)}
                        disabled={loading || saving}
                      />
                    </div>
                  </div>

                  {t.key === "automaticRefunds" && (
                    <div
                      className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${
                        isOn
                          ? "mt-4 grid-rows-[1fr] opacity-100"
                          : "grid-rows-[0fr] opacity-0"
                      }`}
                      aria-hidden={!isOn}
                    >
                      <div className="overflow-hidden">
                        <div className="rounded-lg border border-border/80 bg-white px-4 py-3 text-sm shadow-inner">
                          <label
                            htmlFor="automation-refund-max"
                            className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                          >
                            Maks. beløb (DKK)
                          </label>
                          <input
                            id="automation-refund-max"
                            type="number"
                            inputMode="numeric"
                            placeholder="500"
                            value={refundMax}
                            onChange={(event) => setRefundMax(event.target.value)}
                            className="mt-2 w-32 rounded-md border border-input px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {error && (
            <div className="px-5 py-4">
              <p className="text-sm text-destructive">
                {error.message ?? "Kunne ikke gemme automatisering."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </AutomationPanelContext.Provider>
  );
}
