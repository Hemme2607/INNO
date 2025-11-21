"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAgentPersonaConfig } from "@/hooks/useAgentPersonaConfig";
import {
  Bold,
  Italic,
  List,
  Loader2,
  Play,
  Quote,
  Sparkles,
  Underline,
} from "lucide-react";

// Dummy toolbar data – ren kosmetik men hjælper med at beskrive editoren.
const TOOLBAR_BUTTONS = [
  { icon: Bold, label: "Fed" },
  { icon: Italic, label: "Kursiv" },
  { icon: Underline, label: "Understreg" },
  { icon: List, label: "Liste" },
  { icon: Quote, label: "Citat" },
];

const PersonaPanelContext = createContext(null);

export function usePersonaPanelActions() {
  const ctx = useContext(PersonaPanelContext);
  if (!ctx) {
    throw new Error("usePersonaPanelActions must be used inside PersonaPanel");
  }
  return ctx;
}

export function PersonaPanel({ children }) {
  const { persona, loading, saving, error, save, refresh, test, testPersona } =
    useAgentPersonaConfig();
  // Formularstate for signatur/instruktioner hentes og lagres via hooken.
  const [form, setForm] = useState({
    signature: "",
    instructions: "",
  });
  // Dirty flag styrer hvornår gem-knappen skal aktiveres.
  const [dirty, setDirty] = useState(false);
  // Playground input til test endpointet.
  const [scenarioInput, setScenarioInput] = useState("");
  // Konverterer test hookens error til en streng til UI.
  const testErrorMessage = useMemo(() => {
    if (!test?.error) return null;
    return test.error instanceof Error ? test.error.message : String(test.error);
  }, [test?.error]);

  // Når persona data ændrer sig synker vi formularen og rydder dirty flag.
  useEffect(() => {
    setForm({
      signature: persona?.signature ?? "",
      instructions: persona?.instructions ?? "",
    });
    setScenarioInput(persona?.scenario ?? "");
    setDirty(false);
  }, [persona?.signature, persona?.scenario, persona?.instructions]);

  // Generisk onChange der opdaterer form state.
  const handleChange = (key) => (event) => {
    const value = event.target.value;
    setDirty(true);
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // Wrapper save hooken og nulstiller dirty når kaldet lykkes.
  const handleSave = useCallback(() => {
    save(form).then(() => setDirty(false)).catch(() => null);
  }, [form, save]);

  // Sender midlertidige felter til backend test-funktionen.
  const handleTest = () => {
    testPersona({ ...form, scenario: scenarioInput }).catch(() => null);
  };

  // Force reload af persona fra backend.
  const handleRefresh = useCallback(() => refresh().catch(() => null), [refresh]);

  // Contextens API bruges af headeren til at trigge refresh/save.
  const contextValue = useMemo(
    () => ({
      refresh: handleRefresh,
      save: handleSave,
      loading,
      saving,
      dirty,
    }),
    [handleRefresh, handleSave, loading, saving, dirty]
  );

  return (
    <PersonaPanelContext.Provider value={contextValue}>
      {children || null}
      <Card className="overflow-hidden border-0 bg-white shadow-none">
        <CardContent className="bg-white">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(360px,1fr)]">
          <div className="space-y-5">
            <EditorField
              label="Signatur"
              description="Vises nederst i alle svar – understøtter linjeskift."
              value={form.signature}
              onChange={handleChange("signature")}
              placeholder={"Venlig hilsen\nINNO Support"}
              rows={4}
            />
            <EditorField
              label="Instruktioner"
              description="Tone-of-voice, hvad må agenten love og hvordan skal der svares."
              value={form.instructions}
              onChange={handleChange("instructions")}
              placeholder="Hold tonen varm og løsningsorienteret..."
              rows={8}
            />
            {error && (
              <p className="text-sm text-destructive">
                {error.message ?? "Kunne ikke hente/gemme persona."}
              </p>
            )}
          </div>
          <aside className="flex flex-col rounded-2xl border bg-card/70 shadow-sm lg:sticky lg:top-6 lg:mt-4">
            <div className="flex items-start justify-between gap-2 border-b px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Playground</p>
                <p className="text-xs text-muted-foreground">
                  Test scenarier uden at gemme indstillingerne.
                </p>
              </div>
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="h-3.5 w-3.5" />
                Live
              </Badge>
            </div>
            <div className="flex flex-1 flex-col gap-5 px-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="scenario-test-input">
                  Test et scenarie
                </label>
                <div className="relative">
                  <Textarea
                    id="scenario-test-input"
                    value={scenarioInput}
                    onChange={(event) => setScenarioInput(event.target.value)}
                    rows={4}
                    className="min-h-[110px] resize-y border border-input bg-background px-3 py-3 text-sm shadow-inner focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:ring-offset-2"
                    placeholder="Hej! Jeg kan ikke finde ordre #1001 – kan du hjælpe?"
                  />
                  <button
                    type="button"
                    onClick={handleTest}
                    disabled={test?.loading || loading || !scenarioInput.trim()}
                    className="absolute bottom-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition hover:bg-blue-500 disabled:opacity-50"
                    aria-label="Kør test"
                  >
                    {test?.loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {testErrorMessage ? (
                  <p className="text-xs text-destructive">{testErrorMessage}</p>
                ) : null}
              </div>
              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">AI output</p>
                <div className="rounded-2xl border bg-slate-50 p-4">
                  <div className="rounded-xl bg-white p-4 shadow-sm">
                    <div className="mb-4 rounded-lg border bg-slate-50 px-4 py-3 text-xs text-muted-foreground">
                      <p>
                        <span className="font-semibold text-slate-800">Fra:</span> Kunde
                      </p>
                      <p>
                        <span className="font-semibold text-slate-800">Emne:</span> Re: Ordre #1001
                      </p>
                    </div>
                    <div className="min-h-[140px] text-sm leading-relaxed text-foreground">
                      {test?.loading ? (
                        <div className="space-y-3">
                          <div className="h-3.5 w-2/3 animate-pulse rounded bg-slate-200" />
                          <div className="h-3.5 w-full animate-pulse rounded bg-slate-200" />
                          <div className="h-3.5 w-11/12 animate-pulse rounded bg-slate-200" />
                          <div className="h-3.5 w-1/2 animate-pulse rounded bg-slate-200" />
                        </div>
                      ) : test?.result ? (
                        <p className="whitespace-pre-wrap">{test.result}</p>
                      ) : (
                        <p className="text-muted-foreground">
                          Skriv et scenarie for at se hvordan agenten reagerer med din nuværende
                          konfiguration.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
        </CardContent>
      </Card>
    </PersonaPanelContext.Provider>
  );
}

function EditorField({ label, description, value, onChange, placeholder, rows = 5 }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{label}</p>
          {description ? (
            <p className="text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap gap-1.5 border-b border-gray-200 bg-gray-50 px-3 py-2">
          {TOOLBAR_BUTTONS.map(({ icon: Icon, label: buttonLabel }) => (
            <span
              key={buttonLabel}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground"
              role="presentation"
              aria-hidden="true"
            >
              <Icon className="h-3.5 w-3.5" />
            </span>
          ))}
        </div>
        <Textarea
          value={value}
          onChange={onChange}
          rows={rows}
          className="min-h-[120px] resize-y border-0 bg-transparent px-4 py-3 text-sm focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:ring-offset-2"
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}
