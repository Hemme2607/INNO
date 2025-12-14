import { Sparkles, ShoppingBag, Mail, PanelsTopLeft, LifeBuoy } from "lucide-react";

const leftSatellites = [
  {
    name: "Shopify",
    icon: <ShoppingBag className="h-5 w-5 text-emerald-200" />,
    sub: "Orders & customers",
  },
  {
    name: "Microsoft",
    icon: <PanelsTopLeft className="h-5 w-5 text-indigo-200" />,
    sub: "Outlook & Teams",
  },
  {
    name: "Gmail",
    icon: <Mail className="h-5 w-5 text-sky-200" />,
    sub: "Threads & labels",
  },
];

const rightSatellites = [
  {
    name: "Freshdesk",
    icon: <LifeBuoy className="h-5 w-5 text-cyan-200" />,
    sub: "Tickets & agents",
  },
  {
    name: "Microsoft",
    icon: <PanelsTopLeft className="h-5 w-5 text-indigo-200" />,
    sub: "Outlook & Teams",
  },
  {
    name: "Gmail",
    icon: <Mail className="h-5 w-5 text-sky-200" />,
    sub: "Threads & labels",
  },
];

export default function IntegrationsSection() {
  return (
    <section className="relative overflow-hidden bg-slate-950 py-24 lg:py-32">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.14),rgba(15,23,42,0.9))]" />
        <div className="absolute inset-0 bg-[radial-gradient(35%_35%_at_50%_45%,rgba(129,140,248,0.18),transparent)]" />
      </div>

      <div className="mx-auto flex max-w-5xl flex-col items-center gap-12 px-6">
        <header className="text-center space-y-3">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Integrationer</p>
          <h2 className="text-3xl font-semibold text-white sm:text-4xl">
            Dine apps samlet i Sona
          </h2>
          <p className="max-w-2xl text-sm text-slate-300 sm:text-base">
            Connect Shopify, mails og supportværktøjer til én AI-kerne. Alt synker automatisk og
            kører i baggrunden.
          </p>
        </header>

        <div className="relative w-full max-w-4xl">
          <div className="relative mx-auto h-[520px] w-full">
            {/* center node */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="absolute inset-0 rounded-3xl bg-sky-500/20 blur-3xl" aria-hidden />
              <div className="relative flex h-28 w-28 items-center justify-center rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-sky-900/40 backdrop-blur animate-pulse">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500/40 to-indigo-500/40">
                  <Sparkles className="h-7 w-7 text-white" />
                </div>
              </div>
            </div>

            {/* left column */}
            <div className="absolute left-0 top-1/2 flex -translate-y-1/2 flex-col gap-12">
              {leftSatellites.map((sat) => (
                <div key={sat.name} className="relative flex items-center gap-4">
                  <span className="pointer-events-none h-[2px] w-24 bg-gradient-to-r from-white/5 via-white/20 to-white/5 blur-[1px]" />
                  <IntegrationCard {...sat} />
                </div>
              ))}
            </div>

            {/* right column */}
            <div className="absolute right-0 top-1/2 flex -translate-y-1/2 flex-col items-end gap-12">
              {rightSatellites.map((sat) => (
                <div key={sat.name} className="relative flex items-center gap-4">
                  <IntegrationCard {...sat} />
                  <span className="pointer-events-none h-[2px] w-24 bg-gradient-to-l from-white/5 via-white/20 to-white/5 blur-[1px]" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const IntegrationCard = ({ icon, name, sub, cardClass }) => {
  return (
    <div
      className={`flex w-40 items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 shadow-md shadow-black/30 backdrop-blur ${cardClass}`}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-white">{name}</span>
        <span className="text-xs text-slate-400">{sub}</span>
      </div>
    </div>
  );
};
