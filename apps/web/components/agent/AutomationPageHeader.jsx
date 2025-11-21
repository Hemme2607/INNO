"use client";

import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { useAutomationPanelActions } from "./AutomationPanel";

export function AutomationPageHeader() {
  // Header knapper bruger context fra AutomationPanel til at trigge gem.
  const { save, saving, loading, dirty } = useAutomationPanelActions();

  return (
    <header className="flex w-full flex-wrap items-center justify-between gap-4">
      <div className="space-y-1">
        <p className="text-sm uppercase tracking-widest text-muted-foreground">
          AGENT • AUTOMATION
        </p>
        <h1 className="text-3xl font-semibold text-foreground">Automation Rules</h1>
      </div>
      <Button
        type="button"
        size="sm"
        onClick={save}
        disabled={saving || loading || !dirty}
        className="bg-black text-white hover:bg-black/90"
      >
        <Save className="mr-2 h-4 w-4" />
        {saving ? "Gemmer..." : "Gem ændringer"}
      </Button>
    </header>
  );
}
