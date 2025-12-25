"use client";

import clsx from "clsx";
import React from "react";

// Animated Sona logo with speed presets ("idle" | "working")
export function SonaLogo({
  size = 96,
  className = "",
  speed = "idle",
}) {
  const outerSpin = speed === "working" ? 6 : 14; // seconds
  const scanFast = speed === "working" ? 1.8 : 3.8; // seconds
  const scanSlow = speed === "working" ? 2.4 : 5; // seconds

  return (
    <div
      className={clsx(className)}
      style={{ width: size, height: size, display: "inline-flex" }}
      aria-label="Sona AI logo">
      <svg viewBox="0 0 200 200" width="100%" height="100%" role="img">
        <defs>
          <filter id="sonaSoftGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="7" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <linearGradient id="sonaRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A5AEFF" />
            <stop offset="60%" stopColor="#7C7FFF" />
            <stop offset="100%" stopColor="#5B5AE6" />
          </linearGradient>
        </defs>

        <g
          style={{
            transformOrigin: "100px 100px",
            animation: `sonaSpin ${outerSpin}s linear infinite`,
          }}>
          <circle
            cx="100"
            cy="100"
            r="62"
            fill="none"
            stroke="url(#sonaRingGrad)"
            strokeWidth="14"
            filter="url(#sonaSoftGlow)"
          />
        </g>

        <g>
          {[42, 46, 50, 54].map((r, i) => {
            const isOdd = i % 2 === 0;
            const duration = isOdd ? scanSlow : scanFast;
            const opacity = isOdd ? 0.3 : 0.45;

            return (
              <circle
                key={r}
                cx="100"
                cy="100"
                r={r}
                fill="none"
                stroke={`rgba(165,174,255,${opacity})`}
                strokeWidth="1.4"
                strokeDasharray="18 14"
                style={{
                  animation: `sonaScan ${duration}s linear infinite`,
                }}
              />
            );
          })}
        </g>

        <style>{`
          @keyframes sonaSpin {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }

          @keyframes sonaScan {
            from { stroke-dashoffset: 0; }
            to   { stroke-dashoffset: -160; }
          }

          @media (prefers-reduced-motion: reduce) {
            * { animation: none !important; }
          }
        `}</style>
      </svg>
    </div>
  );
}
