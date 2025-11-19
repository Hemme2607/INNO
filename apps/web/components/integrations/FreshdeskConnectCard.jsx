"use client";

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
import { Headphones } from "lucide-react";
import { FreshdeskSheet } from "./FreshdeskSheet";

export function FreshdeskConnectCard() {
  return (
    <Card className="flex h-full max-w-sm flex-col border bg-card/60 shadow-sm">
      <CardHeader className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border bg-muted/40">
          <Headphones className="h-6 w-6 text-foreground/70" />
        </div>
        <div className="space-y-1">
          <CardTitle>Freshdesk</CardTitle>
          <CardDescription>
            Synkroniser Freshdesk-sager og kundedata med agentens arbejdsflow.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-1 text-sm text-muted-foreground">
        
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 p-4">
        <Badge variant="secondary">Ikke tilsluttet</Badge>
        <FreshdeskSheet>
          <Button size="sm">Connect Freshdesk</Button>
        </FreshdeskSheet>
      </CardFooter>
    </Card>
  );
}
