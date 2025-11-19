import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PersonaPanel } from "@/components/agent/PersonaPanel";
import { PersonaPageHeader } from "@/components/agent/PersonaPageHeader";

export default async function AgentPersonaPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in?redirect_url=/agent/persona");
  }

  return (
    <main className="space-y-6 bg-white px-4 py-6 lg:px-10 lg:py-10">
      <PersonaPanel>
        <PersonaPageHeader />
      </PersonaPanel>
    </main>
  );
}
