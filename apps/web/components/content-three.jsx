import Image from "next/image";
import { Play } from "lucide-react";

export default function ContentSection() {
  return (
    <section className="relative py-24">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.18),transparent_70%)] blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-5xl px-6">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Product demo</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight text-white">
              See Sona AI in action
            </h2>
            <p className="mb-12 mt-4 text-lg text-slate-300">
              A quick preview of how Sona drafts polished, customer-ready replies in seconds.
            </p>
          </div>

          <div className="relative mt-12 rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_30px_120px_rgba(14,21,36,0.55)] backdrop-blur-xl md:mt-16">
            <div className="absolute -right-8 top-8 h-24 w-24 rounded-full bg-cyan-400/15 blur-2xl" />
            <div className="absolute -left-10 bottom-6 h-28 w-28 rounded-full bg-blue-500/20 blur-2xl" />

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60">
              <div className="flex items-center gap-2 border-b border-white/10 bg-slate-900/80 px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                <span className="ml-3 text-xs uppercase tracking-[0.2em] text-slate-400">
                  Sona demo
                </span>
              </div>

              <div className="relative">
                <Image
                  src="/mist/tailark-3.png"
                  alt="Sona product preview"
                  width="2880"
                  height="1842"
                  className="size-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white shadow-lg shadow-cyan-500/20">
                    <Play className="h-6 w-6" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
