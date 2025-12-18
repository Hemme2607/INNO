import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function FinalCta() {
  return (
    <section className="py-16 md:py-20">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Get started</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">
          Ready to automate your support?
        </h2>
        <p className="mt-3 text-lg text-slate-300">Join the beta list today.</p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
          <Input
            type="email"
            placeholder="Your email"
            className="h-11 border-white/10 bg-slate-900/60 text-white placeholder:text-slate-400 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] focus-visible:border-cyan-400/50 focus-visible:ring-2 focus-visible:ring-cyan-400/30 focus-visible:shadow-[0_0_0_1px_rgba(56,189,248,0.5),0_0_24px_rgba(56,189,248,0.25)] sm:h-12 sm:min-w-[260px]"
          />
          <Button className="h-11 gap-2 bg-sky-500 px-5 text-slate-900 shadow-lg shadow-sky-900/40 hover:bg-sky-400 sm:h-12">
            Get early access
          </Button>
        </div>
      </div>
    </section>
  );
}
