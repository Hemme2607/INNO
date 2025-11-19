"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useAgentAutomation } from "@/hooks/useAgentAutomation";

const toggles = [
  {
    key: "orderUpdates",
    label: "Ordreopdateringer",
    description: "Hold kunder informeret når status ændres.",
  },
  {
    key: "cancelOrders",
    label: "Tillad annullering",
    description: "Agenten må annullere ordrer automatisk.",
  },
  {
    key: "automaticRefunds",
    label: "Automatiske refusioner",
    description: "Tillad at mindre refusioner gennemføres uden din godkendelse.",
  },
  {
    key: "historicInboxAccess",
    label: "Historisk indbakke",
    description: "Giv agenten adgang til ældre mails når den besvarer nye.",
  }
];

export function AutomationPanel() {
  const { settings, loading, saving, error, save } = useAgentAutomation();
  const handleToggle = (key) => (checked) => {
    save({ [key]: Boolean(checked) }).catch(() => null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Automation</CardTitle>
        <CardDescription>
          Styr hvilke workflows agenten må køre på egen hånd.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {toggles.map((toggle) => (
          <label
            key={toggle.key}
            className="flex items-start gap-3 rounded-xl border p-3"
          >
            <Checkbox
              checked={Boolean(settings?.[toggle.key])}
              disabled={loading || saving}
              onCheckedChange={handleToggle(toggle.key)}
            />
            <div>
              <p className="font-medium">{toggle.label}</p>
              <p className="text-sm text-muted-foreground">{toggle.description}</p>
            </div>
          </label>
        ))}
        {error && (
          <p className="text-sm text-destructive">
            {error.message ?? "Kunne ikke gemme automatisering."}
          </p>
        )}
      </CardContent>
      <CardFooter className="justify-end">
        <Button variant="outline" size="sm" onClick={() => save(settings)} disabled={saving}>
          {saving ? "Gemmer..." : "Gem nuværende toggles"}
        </Button>
      </CardFooter>
    </Card>
  );
}
