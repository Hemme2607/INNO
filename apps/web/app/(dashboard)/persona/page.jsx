import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PersonaPanel } from "@/components/agent/PersonaPanel";
import { PersonaPageHeader } from "@/components/agent/PersonaPageHeader";
import { DashboardPageShell } from "@/components/dashboard-page-shell";

export default async function AgentPersonaPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in?redirect_url=/persona");
  }

  return (
    <DashboardPageShell>
      <PersonaPanel>
        <PersonaPageHeader />
      </PersonaPanel>
    </DashboardPageShell>
  );
}
