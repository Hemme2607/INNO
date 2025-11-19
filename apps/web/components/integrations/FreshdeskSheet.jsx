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
import { Check, Copy } from "lucide-react";

const WEBHOOK_URL = "https://api.sona.ai/webhooks/freshdesk";

export function FreshdeskSheet({ children }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (
        typeof navigator !== "undefined" &&
        navigator.clipboard?.writeText
      ) {
        await navigator.clipboard.writeText(WEBHOOK_URL);
      }
    } catch (_error) {
      // ignore clipboard write errors
    }
    setCopied(true);
  };

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Connect Freshdesk</SheetTitle>
          <SheetDescription>
            Indtast dit domæne og API-nøgle, og opsæt webhooken i Freshdesk.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="freshdesk-domain">Freshdesk domæne</Label>
            <Input
              id="freshdesk-domain"
              placeholder="din-butik.freshdesk.com"
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="freshdesk-api">Admin API key</Label>
            <Input
              id="freshdesk-api"
              placeholder="Find den under Profile Settings..."
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="freshdesk-webhook">Webhook URL (Kopier til Freshdesk)</Label>
            <div className="flex gap-2">
              <Input
                id="freshdesk-webhook"
                readOnly
                value={WEBHOOK_URL}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={handleCopy}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
        <SheetFooter>
          <Button className="w-full bg-black text-white hover:bg-black/90">
            Connect
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
