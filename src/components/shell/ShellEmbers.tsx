"use client";

import { useEffect, useMemo, useState } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * ShellEmbers — premium ambient particles.
 *
 * Three tiers of particles for layered depth:
 * - Tiny embers (3-4px): fast, numerous, low opacity
 * - Mid sparks (4-6px): medium, glowing, primary visual
 * - Rare flares (6-8px): slow, rare, high glow
 *
 * Pure CSS animations — off main thread, compositor only.
 *
 * NOTE: Renders nothing on server / first paint to avoid hydration mismatch.
 * Particles mount after first client render.
 */
export function ShellEmbers({ count = 10 }: { count?: number }) {
  const reduced = useReducedMotion();
  // Only render on client — avoids SSR/hydration mismatch because
  // useReducedMotion() is null on server, so the output would differ.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const tier = i % 3; // 0=tiny, 1=mid, 2=flare
        const size = tier === 0 ? 3 + (i % 2) : tier === 1 ? 4 + (i % 3) : 6 + (i % 3);
        const dur = tier === 0
          ? 2.4 + (i % 3) * 0.5
          : tier === 1
          ? 3.2 + (i % 4) * 0.6
          : 4.5 + (i % 3) * 0.8;
        const opacity = tier === 0 ? 0.5 : tier === 1 ? 0.65 : 0.55;
        const glow = tier === 0 ? 4 : tier === 1 ? 7 : 12;
        return {
          left: `${(i * 11 + 7) % 95}%`,
          delay: `${(i * 0.37) % 4.5}s`,
          dur: `${dur}s`,
          dx: `${(i % 2 === 0 ? 1 : -1) * (6 + (i % 6) * 3)}px`,
          size,
          opacity,
          glow,
          tier,
        };
      }),
    [count],
  );

  // Render nothing until mounted on client, and skip if user prefers reduced motion
  if (!mounted || reduced) return null;

  return (
    <div
      className="embers"
      aria-hidden
      style={{ pointerEvents: "none" }}
    >
      {pieces.map((p, i) => (
        <span
          key={i}
          className="ember"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
            animationDuration: p.dur,
            ["--dx" as string]: p.dx,
            /* Glow intensity scales with tier */
            boxShadow: `0 0 ${p.glow}px ${Math.ceil(p.glow / 2)}px oklch(0.78 0.16 65 / ${p.opacity})`,
            /* Flare tier: slightly warm yellow */
            background: p.tier === 2
              ? "oklch(0.88 0.14 82)"
              : "oklch(0.78 0.16 65)",
          }}
        />
      ))}
    </div>
  );
}
