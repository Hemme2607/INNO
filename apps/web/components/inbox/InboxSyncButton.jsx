"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function InboxSyncButton() {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const res = await fetch("/api/inbox/sync", { method: "POST" });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errorMsg =
          payload?.error ||
          payload?.results?.gmail?.error ||
          payload?.results?.outlook?.error ||
          "Sync failed.";
        console.error("Inbox sync failed:", payload);
        throw new Error(errorMsg);
      }
      console.log("Inbox sync response:", payload);
      toast.success("Sync triggered. Inbox will update shortly.");
    } catch (error) {
      toast.error(error?.message || "Sync failed.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={handleSync}
      disabled={isSyncing}
    >
      {isSyncing ? "Syncing..." : "Sync now"}
    </Button>
  );
}
