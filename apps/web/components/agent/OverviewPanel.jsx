"use client";

import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAgentAutomation } from "@/hooks/useAgentAutomation";
import { Badge } from "@/components/ui/badge";

export function AgentOverviewPanel() {
  const router = useRouter();
  const { settings, saving, save } = useAgentAutomation();
  const enabled = Boolean(settings?.autoDraftEnabled);

  const toggleAgent = () => {
    save({ autoDraftEnabled: !enabled }).catch(() => null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agentstatus</CardTitle>
        <CardDescription>
          Hold øje med om agenten er aktiv, og hop hurtigt til konfigurationer.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Aktuel status</p>
          <div className="mt-2 flex items-center gap-3">
            <Badge variant={enabled ? "default" : "secondary"}>
              {enabled ? "Aktiveret" : "Deaktiveret"}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {enabled
                ? "Agenten genererer AI-svar automatisk."
                : "Slå agenten til for at køre automationer."}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/agent/persona")}>
            Redigér persona
          </Button>
          <Button variant="outline" onClick={() => router.push("/agent/automation")}>
            Justér automation
          </Button>
        </div>
      </CardContent>
      <CardFooter className="justify-end">
        <Button onClick={toggleAgent} disabled={saving}>
          {enabled ? "Deaktiver agent" : "Aktiver agent"}
        </Button>
      </CardFooter>
    </Card>
  );
}
