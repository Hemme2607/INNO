import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AutomationPanel } from "@/components/agent/AutomationPanel";
import { AutomationPageHeader } from "@/components/agent/AutomationPageHeader";

export default async function AgentAutomationPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in?redirect_url=/automation");
  }

  return (
    <main className="space-y-6 bg-white px-4 py-6 lg:px-10 lg:py-10">
      <AutomationPanel>
        <AutomationPageHeader />
      </AutomationPanel>
    </main>
  );
}
