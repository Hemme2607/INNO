import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ShopifyConnectCard } from "@/components/integrations/ShopifyConnectCard";
import { FreshdeskConnectCard } from "@/components/integrations/FreshdeskConnectCard";
import { GorgiasConnectCard } from "@/components/integrations/GorgiasConnectCard";
import { DashboardPageShell } from "@/components/dashboard-page-shell";

export default async function IntegrationsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in?redirect_url=/integrations");
  }

  return (
    <DashboardPageShell>
      <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-widest text-muted-foreground">
            Integrations
          </p>
          <h1 className="text-3xl font-semibold">Connect your systems</h1>
        </div>
      </header>
      <section className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Store
          </p>
          <h2 className="text-2xl font-semibold">Stay on top of your store</h2>
          <p className="text-sm text-muted-foreground">
            Sync orders, customers, and inventory across your channels.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <ShopifyConnectCard />
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Helpdesk
          </p>
          <h2 className="text-2xl font-semibold">Unify customer conversations</h2>
          <p className="text-sm text-muted-foreground">
            Connect your helpdesk tools to Sona and get a complete overview of cases.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <FreshdeskConnectCard />
          <GorgiasConnectCard />
        </div>
      </section>
    </DashboardPageShell>
  );
}
