import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PersonaPanel } from "@/components/agent/PersonaPanel";
import { AutomationPanel } from "@/components/agent/AutomationPanel";
import { AgentOverviewPanel } from "@/components/agent/OverviewPanel";

export default async function AgentPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in?redirect_url=/agent");
  }

  return (
    <main className="px-4 py-6 lg:px-10 lg:py-8 space-y-6">
      <header className="space-y-1">
        <p className="text-sm uppercase tracking-widest text-muted-foreground">
          Agent
        </p>
        <h1 className="text-3xl font-semibold">Tilpas din agent</h1>
      </header>

      <AgentOverviewPanel />

    </main>
  );
}
