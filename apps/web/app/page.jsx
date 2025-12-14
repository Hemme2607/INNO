import HeroSection from "@/components/hero-section";
import IntegrationsSection from "@/components/integrations-4";

// Landing page viser TailArk-baseret hero og lader CTA'erne tage brugeren videre.
export default function HomePage() {
  return (
      <div className="dark relative min-h-screen overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_20%,rgba(90,150,255,0.14),transparent_30%),radial-gradient(circle_at_82%_10%,rgba(56,189,248,0.12),transparent_32%),linear-gradient(180deg,#0b1220_0%,#060b14_100%)]" />
        <div className="relative z-10">
          <HeroSection />
          <IntegrationsSection />
        </div>
      </div>
  );
}
