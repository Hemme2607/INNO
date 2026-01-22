"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import googleLogo from "../../../../assets/google-logo.png";
import microsoftLogo from "../../../../assets/Microsoft-logo.png";

const PROVIDER_CONFIG = {
  gmail: {
    label: "Gmail",
    logo: googleLogo,
    logoAlt: "Gmail logo",
  },
  outlook: {
    label: "Outlook",
    logo: microsoftLogo,
    logoAlt: "Outlook logo",
  },
};

export function MailboxRow({ provider, email, isActive }) {
  const router = useRouter();
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const config = PROVIDER_CONFIG[provider] || {
    label: provider,
    logo: null,
    logoAlt: "Mailbox provider",
  };

  const handleDisconnect = async () => {
    if (!provider || isDisconnecting) return;
    setIsDisconnecting(true);
    try {
      const res = await fetch("/api/integrations/mail-accounts/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload?.error || "Disconnect failed.");
      }
      toast.success(`${config.label} disconnected.`);
      router.refresh();
    } catch (error) {
      toast.error(error?.message || "Disconnect failed.");
    } finally {
      setIsDisconnecting(false);
    }
  };

  const statusLabel = isActive ? "Active" : "Disconnected";
  const statusStyles = isActive
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-rose-200 bg-rose-50 text-rose-700";
  const dotStyles = isActive ? "bg-emerald-500" : "bg-rose-500";

  return (
    <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-white">
          {config.logo ? (
            <Image
              src={config.logo}
              alt={config.logoAlt}
              width={28}
              height={28}
              className="object-contain"
            />
          ) : (
            <span className="text-xs font-medium text-slate-500">{config.label}</span>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">{config.label}</p>
          <p className="truncate text-sm text-slate-500" title={email}>
            {email || "Unknown address"}
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-between gap-4 sm:flex-none">
        <span
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${statusStyles}`}
        >
          <span className={`h-2 w-2 rounded-full ${dotStyles}`} />
          {statusLabel}
        </span>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleDisconnect}
          disabled={isDisconnecting}
          aria-label="Disconnect mailbox"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
