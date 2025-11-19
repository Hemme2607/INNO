import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AutomationPanel } from "@/components/agent/AutomationPanel";

export default async function AgentAutomationPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in?redirect_url=/agent/automation");
  }

  return (
    <main className="px-4 py-6 lg:px-10 lg:py-8 space-y-6">
      <header>
        <p className="text-sm uppercase tracking-widest text-muted-foreground">
          Agent • Automation
        </p>
        <h1 className="text-3xl font-semibold">Bestem hvad agenten må gøre</h1>
      </header>
      <AutomationPanel />
    </main>
  );
}
