import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ShopifyConnectCard } from "@/components/integrations/ShopifyConnectCard";
import { FreshdeskConnectCard } from "@/components/integrations/FreshdeskConnectCard";

export default async function IntegrationsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in?redirect_url=/integrations");
  }

  return (
    <main className="px-4 py-6 lg:px-10 lg:py-8 space-y-6">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-widest text-muted-foreground">
            Integrations
          </p>
          <h1 className="text-3xl font-semibold">Forbind dine systemer</h1>
        </div>
      </header>
      <section className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Webshop
          </p>
          <h2 className="text-2xl font-semibold">Hold styr på din butik</h2>
          <p className="text-sm text-muted-foreground">
            Synkronisér ordrer, kunder og lager på tværs af dine kanaler.
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
          <h2 className="text-2xl font-semibold">Saml kundedialogen</h2>
          <p className="text-sm text-muted-foreground">
            Kobl dine helpdesk-systemer til Sona og få fuldt overblik over sager.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <FreshdeskConnectCard />
        </div>
      </section>
    </main>
  );
}
