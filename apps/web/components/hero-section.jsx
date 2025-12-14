"use client";

import React from "react";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProcessingDemo from "@/components/processing-demo";
import { HeroHeader } from "./header";
import { AnimatedGroup } from "@/components/ui/animated-group";

const fadeIn = {
  item: {
    hidden: { opacity: 0, y: 18 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
  },
};

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-slate-950">
      <HeroHeader />

      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-16 top-0 h-72 w-72 bg-sky-500/20 blur-3xl" />
        <div className="absolute right-0 top-10 h-64 w-64 bg-cyan-400/15 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(70%_70%_at_20%_20%,rgba(56,189,248,0.08),transparent),radial-gradient(60%_60%_at_80%_10%,rgba(129,140,248,0.12),transparent)]" />
      </div>

      <AnimatedGroup
        variants={fadeIn}
        className="mx-auto max-w-6xl px-6 pb-16 pt-28 lg:px-8 lg:pb-24 lg:pt-32 min-h-[820px] lg:min-h-[900px]">
        <div className="grid items-start gap-12 lg:grid-cols-[1.05fr_1fr]">
          <div className="space-y-7">

            <div className="space-y-4">
              <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
                Gør din kundeservice{" "}
                <span className="bg-gradient-to-r from-sky-400 via-cyan-300 to-indigo-300 bg-clip-text text-transparent">
                  selvkørende
                </span>{" "}
                med Sona
              </h1>
              <p className="max-w-2xl text-lg text-slate-300">
                Vi kobler AI med dine webshop-data, så du automatisk finder ordren, tjekker status og sender det rigtige svar – uden manuel håndtering.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Input
                  type="email"
                  placeholder="Din e-mail"
                  className="h-11 border-white/10 bg-slate-900/60 text-white placeholder:text-slate-400 sm:h-12"
                />
                <Button className="h-11 gap-2 bg-sky-500 px-5 text-slate-900 shadow-lg shadow-sky-900/40 hover:bg-sky-400 sm:h-12">
                  Få tidlig adgang
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-4 -top-4 h-24 w-24 rounded-full bg-sky-500/15 blur-3xl" />
            <div className="absolute right-4 top-1/3 h-28 w-28 rounded-full bg-indigo-500/15 blur-3xl" />
            <div className="relative rounded-2xl border border-white/10 bg-slate-900/70 p-4 shadow-2xl shadow-sky-950/40 backdrop-blur">
              <ProcessingDemo />
            </div>
          </div>
        </div>
      </AnimatedGroup>
    </section>
  );
}
