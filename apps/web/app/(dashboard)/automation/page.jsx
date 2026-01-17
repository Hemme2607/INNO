import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AutomationPanel } from "@/components/agent/AutomationPanel";
import { AutomationPageHeader } from "@/components/agent/AutomationPageHeader";
import { DashboardPageShell } from "@/components/dashboard-page-shell";

export default async function AgentAutomationPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in?redirect_url=/automation");
  }

  return (
    <DashboardPageShell>
      <AutomationPanel>
        <AutomationPageHeader />
      </AutomationPanel>
    </DashboardPageShell>
  );
}
