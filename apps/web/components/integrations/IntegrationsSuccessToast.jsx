"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export function IntegrationsSuccessToast() {
  const searchParams = useSearchParams();
  const hasShown = useRef(false);
  const success = searchParams?.get("success") === "true";

  useEffect(() => {
    if (!success || hasShown.current) return;
    toast.success("Gmail connected successfully.");
    hasShown.current = true;
  }, [success]);

  return <Toaster />;
}
