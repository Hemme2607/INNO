import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { KnowledgePageClient } from "@/components/knowledge/KnowledgePageClient";

export default async function KnowledgePage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in?redirect_url=/knowledge");
  }

  return (
    <main className="min-h-screen space-y-6 px-4 py-6 lg:px-10 lg:py-10">
      <KnowledgePageClient />
    </main>
  );
}
