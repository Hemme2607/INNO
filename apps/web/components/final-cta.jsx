 "use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React from "react";

export default function FinalCta() {
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState("idle"); // idle | loading | success | error
  const [error, setError] = React.useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const trimmedEmail = email.trim().toLowerCase();
    const isValidEmail = /\S+@\S+\.\S+/.test(trimmedEmail);
    if (!isValidEmail) {
      setError("Enter a valid email.");
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch("/api/landing-signups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, source: "landing-final-cta" }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Could not save your email right now.");
      }

      setStatus("success");
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
      setStatus("error");
    }
  };

  return (
    <section id="final-cta" className="py-16 md:py-20">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Get started</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">
          Ready to automate your support?
        </h2>
        <p className="mt-3 text-lg text-slate-300">Join the beta list today.</p>

        <form
          className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center"
          onSubmit={handleSubmit}
        >
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email"
            autoComplete="email"
            className="h-11 border-white/10 bg-slate-900/60 text-white placeholder:text-slate-400 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] focus-visible:border-cyan-400/50 focus-visible:ring-2 focus-visible:ring-cyan-400/30 focus-visible:shadow-[0_0_0_1px_rgba(56,189,248,0.5),0_0_24px_rgba(56,189,248,0.25)] sm:h-12 sm:min-w-[260px]"
            aria-label="Email for early access"
          />
          <Button
            type="submit"
            disabled={status === "loading"}
            className="h-11 gap-2 bg-sky-500 px-5 text-slate-900 shadow-lg shadow-sky-900/40 hover:bg-sky-400 sm:h-12 disabled:opacity-70"
          >
            {status === "success" ? "You're on the list" : status === "loading" ? "Submitting..." : "Get early access"}
          </Button>
        </form>
        {error && <p className="mt-2 text-sm text-rose-300">{error}</p>}
        {status === "success" && !error && (
          <p className="mt-2 text-sm text-emerald-300">Thanks! We’ll email you as soon as we open more spots.</p>
        )}
      </div>
    </section>
  );
}
