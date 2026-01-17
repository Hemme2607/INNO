import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { KnowledgePageClient } from "@/components/knowledge/KnowledgePageClient";
import { DashboardPageShell } from "@/components/dashboard-page-shell";

export default async function KnowledgePage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in?redirect_url=/knowledge");
  }

  return (
    <DashboardPageShell>
      <KnowledgePageClient />
    </DashboardPageShell>
  );
}
