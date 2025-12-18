import { ShieldCheck, Zap, Plug } from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    title: "Human in Control",
    description: "Sona drafts the reply, you click send. No AI hallucinations sent to customers.",
  },
  {
    icon: Zap,
    title: "Instant Context",
    description: "Order details and tracking info are fetched automatically. Stop searching in Shopify.",
  },
  {
    icon: Plug,
    title: "2-Minute Setup",
    description: "Connects with your existing Gmail or Outlook. No new helpdesk software to learn.",
  },
];

export default function FeaturesGrid() {
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Why teams choose Sona</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Built for real support teams
          </h2>
          <p className="mt-3 text-lg text-slate-300 max-w-2xl mx-auto">
            Safety first, context-rich, and ready in minutes.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((item) => (
            <div
              key={item.title}
              className="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/70 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur"
            >
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -right-10 top-0 h-28 w-28 rounded-full bg-cyan-500/10 blur-3xl" />
                <div className="absolute -left-8 bottom-0 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl" />
              </div>
              <div className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-cyan-200">
                <item.icon className="h-6 w-6" />
              </div>
              <h3 className="relative mt-4 text-xl font-semibold text-white">{item.title}</h3>
              <p className="relative mt-2 text-sm text-slate-300 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
