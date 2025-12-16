import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { KnowledgePageClient } from "@/components/knowledge/KnowledgePageClient";
import { ProductKnowledgeCard } from "@/components/knowledge/ProductKnowledgeCard";

export default async function KnowledgePage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in?redirect_url=/knowledge");
  }

  return (
    <main className="space-y-6 bg-white px-4 py-6 lg:px-10 lg:py-10">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-widest text-muted-foreground">Policies</p>
          <h1 className="text-3xl font-semibold">Policies</h1>
          <p className="text-sm text-muted-foreground">
            Sync your Shopify policies, edit them and add internal rules. The agent uses them directly in replies.
          </p>
        </div>
      </header>

      <div className="space-y-6">
        <ProductKnowledgeCard />
        <KnowledgePageClient />
      </div>
    </main>
  );
}
