"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { buildBaseClerkConfig } from "../../../shared/clerk";

export default function Providers({ children }) {
  const baseClerkConfig = buildBaseClerkConfig();
  return <ClerkProvider {...baseClerkConfig}>{children}</ClerkProvider>;
}
