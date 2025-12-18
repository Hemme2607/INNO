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
  // Agenten aktiveres når autoDraftEnabled flaget er sandt.
  const enabled = Boolean(settings?.autoDraftEnabled);

  // Slår automationen til/fra og ignorerer fejl i UI (hooken håndterer dem).
  const toggleAgent = () => {
    save({ autoDraftEnabled: !enabled }).catch(() => null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent status</CardTitle>
        <CardDescription>
          Track whether the agent is active and jump quickly to configurations.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Current status</p>
          <div className="mt-2 flex items-center gap-3">
            <Badge variant={enabled ? "default" : "secondary"}>
              {enabled ? "Active" : "Inactive"}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {enabled
                ? "The agent automatically generates AI replies."
                : "Enable the agent to run automations."}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {/* Hurtige genvejsknapper til Agent undersider */}
          <Button variant="outline" onClick={() => router.push("/agent/persona")}>
            Edit persona
          </Button>
          <Button variant="outline" onClick={() => router.push("/agent/automation")}>
            Adjust automation
          </Button>
        </div>
      </CardContent>
      <CardFooter className="justify-end">
        <Button onClick={toggleAgent} disabled={saving}>
          {enabled ? "Disable agent" : "Enable agent"}
        </Button>
      </CardFooter>
    </Card>
  );
}
