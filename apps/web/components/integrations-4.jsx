import {
  AppWindow,
  ArrowDown,
  Layers,
  LifeBuoy,
  Mail,
  ShoppingBag,
  Store,
} from "lucide-react";
import { SonaLogo } from "@/components/ui/SonaLogo";

const leftSatellites = [
  {
    name: "Shopify",
    icon: <ShoppingBag className="h-5 w-5 text-emerald-300" />,
    sub: "Orders & data",
  },
  {
    name: "WooCommerce",
    icon: <Store className="h-5 w-5 text-violet-300" />,
    sub: "Any store platform",
  },
  {
    name: "Magento",
    icon: <Layers className="h-5 w-5 text-orange-500" />,
    sub: "Enterprise stores",
    cardClass: "group-hover:border-orange-500/30",
  },
];

const rightSatellites = [
  {
    name: "Freshdesk",
    icon: <LifeBuoy className="h-5 w-5 text-cyan-200" />,
    sub: "Tickets & agents",
  },
  {
    name: "Outlook",
    icon: <AppWindow className="h-5 w-5 text-blue-200" />,
    sub: "Send & track",
  },
  {
    name: "Gmail",
    icon: <Mail className="h-5 w-5 text-rose-200" />,
    sub: "Threads & labels",
  },
];

// Viser et "orbit" af integrationer omkring Sona-kerne-logoet
export default function IntegrationsSection() {
  return (
    <section className="relative overflow-hidden bg-slate-950 py-24 lg:py-32">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.14),rgba(15,23,42,0.9))]" />
        <div className="absolute inset-0 bg-[radial-gradient(35%_35%_at_50%_45%,rgba(129,140,248,0.18),transparent)]" />
      </div>

      <div className="mx-auto flex max-w-5xl flex-col items-center gap-12 px-6">
        <header className="text-center space-y-3">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Integrations</p>
          <h2 className="text-3xl font-semibold text-white sm:text-4xl">
            Your apps, unified in Sona
          </h2>
          <p className="max-w-2xl text-sm text-slate-300 sm:text-base">
            Connect your webshop, email, and support tools to one AI core. Everything syncs automatically
            in the background.
          </p>
        </header>

        <div className="relative w-full max-w-5xl">
          <div className="relative mx-auto flex flex-col items-center justify-center gap-8 lg:flex-row lg:items-center lg:gap-16">
            {/* left column */}
            <div className="hidden flex-col items-end gap-12 lg:flex">
              {leftSatellites.map((sat) => (
                <IntegrationCard key={sat.name} {...sat} align="left" />
              ))}
            </div>

            {/* mobile: inputs grid */}
            <div className="grid w-full max-w-sm grid-cols-1 gap-4 lg:hidden">
              {leftSatellites.map((sat) => (
                <IntegrationCard key={sat.name} {...sat} align="left" fullWidth />
              ))}
            </div>

            {/* center node */}
            <div className="relative z-10 flex h-40 w-40 shrink-0 flex-col items-center justify-center rounded-3xl border border-white/10 bg-[#0B1120] shadow-2xl shadow-sky-900/30 shadow-[inset_0_0_20px_rgba(59,130,246,0.1)]">
              <SonaLogo size={80} />
              <span className="mt-2 text-[10px] tracking-[0.3em] text-blue-200/70 drop-shadow-md">
                SONA AI
              </span>
            </div>

            {/* mobile: down arrow */}
            <div className="flex items-center justify-center lg:hidden">
              <ArrowDown className="h-6 w-6 text-slate-400" />
            </div>

            {/* right column */}
            <div className="hidden flex-col items-start gap-12 lg:flex">
              {rightSatellites.map((sat) => (
                <IntegrationCard key={sat.name} {...sat} align="right" />
              ))}
            </div>

            {/* mobile: outputs grid */}
            <div className="grid w-full max-w-sm grid-cols-1 gap-4 lg:hidden">
              {rightSatellites.map((sat) => (
                <IntegrationCard key={sat.name} {...sat} align="left" fullWidth />
              ))}
            </div>

            {/* connectors (desktop only) */}
            <svg
              className="pointer-events-none absolute inset-0 hidden h-full w-full opacity-20 lg:block"
              viewBox="0 0 1200 800"
              preserveAspectRatio="xMidYMid meet"
              aria-hidden>
              {[
                { y: 220, leftX: 250, rightX: 950 },
                { y: 400, leftX: 250, rightX: 950 },
                { y: 580, leftX: 250, rightX: 950 },
              ].map(({ y, leftX, rightX }, idx) => (
                <g key={idx} stroke="rgba(100,116,139,0.35)" strokeWidth="1" fill="none">
                  <line x1={leftX} y1={y} x2={600} y2={400} />
                  <line x1={600} y1={400} x2={rightX} y2={y} />
                </g>
              ))}
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}

// Lille kortkomponent for hver integration
const IntegrationCard = ({ icon, name, sub, align = "left", fullWidth = false, cardClass }) => {
  return (
    <div
      className={`group flex h-20 ${fullWidth ? "w-full max-w-sm" : "w-64"} items-center gap-3 rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 shadow-md shadow-black/40 backdrop-blur transition-colors ${align === "right" ? "flex-row-reverse text-right" : ""} ${cardClass}`}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
        {icon}
      </div>
      <div className={`flex flex-col ${align === "right" ? "items-end" : ""}`}>
        <span className="truncate text-sm font-semibold text-white">{name}</span>
        <span className="truncate text-xs text-slate-400">{sub}</span>
      </div>
    </div>
  );
};
