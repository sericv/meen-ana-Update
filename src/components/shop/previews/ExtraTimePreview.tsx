"use client";

/**
 * ExtraTimePreview — timer sweeps then +15s floats up with golden glow.
 * Uses rAF loop for smooth SVG arc; Framer Motion only for badge animation.
 */

import { motion, useReducedMotion, useAnimationControls, useMotionValue } from "framer-motion";
import { useEffect, useState } from "react";
import { ItemPreviewScene } from "@/components/shop/ItemPreviewScene";

function ClockFace({ arcProgress }: { arcProgress: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.max(0, Math.min(1, arcProgress)));
  const handAngle = -90 + arcProgress * 360;
  const hx = 38 + r * Math.cos((handAngle * Math.PI) / 180);
  const hy = 38 + r * Math.sin((handAngle * Math.PI) / 180);

  return (
    <svg width="76" height="76" viewBox="0 0 76 76" fill="none" style={{ overflow: "visible" }}>
      <circle cx="38" cy="38" r="34" stroke="oklch(0.82 0.10 78 / .22)" strokeWidth="1.5" />
      <circle cx="38" cy="38" r={r} stroke="oklch(0.80 0.07 74 / .4)" strokeWidth="3.5" />
      <circle
        cx="38" cy="38" r={r}
        stroke="oklch(0.68 0.18 70)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform="rotate(-90 38 38)"
        style={{ filter: "drop-shadow(0 0 3px oklch(0.68 0.18 70 / .72))" }}
      />
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => {
        const isMain = angle % 90 === 0;
        const r1 = 33;
        const r2 = r1 - (isMain ? 5.5 : 3);
        const rad = (angle * Math.PI) / 180;
        return (
          <line
            key={angle}
            x1={38 + r1 * Math.cos(rad)} y1={38 + r1 * Math.sin(rad)}
            x2={38 + r2 * Math.cos(rad)} y2={38 + r2 * Math.sin(rad)}
            stroke="oklch(0.55 0.05 58 / .5)"
            strokeWidth={isMain ? 1.8 : 1} strokeLinecap="round"
          />
        );
      })}
      <line x1="38" y1="38" x2={hx} y2={hy} stroke="oklch(0.32 0.06 48)" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="38" cy="38" r="3" fill="oklch(0.32 0.06 48)" />
    </svg>
  );
}

/** Subscribes to a MotionValue<number> and re-renders when it changes. */
function MotionClockFace({ mv }: { mv: ReturnType<typeof useMotionValue<number>> }) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    // Subscribe to live motion value changes
    const unsub = mv.on("change", setProgress);
    return unsub;
  }, [mv]);
  return <ClockFace arcProgress={progress} />;
}

export function ExtraTimePreview() {
  const reduced = useReducedMotion();
  const arcVal = useMotionValue(0);
  const glowCtrl = useAnimationControls();

  useEffect(() => {
    if (reduced) return;
    let cancelled = false;
    let rafId: number;

    function animateArc(from: number, to: number, durationMs: number): Promise<void> {
      return new Promise((resolve) => {
        const start = performance.now();
        function tick(now: number) {
          if (cancelled) { resolve(); return; }
          const t = Math.min((now - start) / durationMs, 1);
          const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
          arcVal.set(from + (to - from) * eased);
          if (t < 1) { rafId = requestAnimationFrame(tick); }
          else { resolve(); }
        }
        rafId = requestAnimationFrame(tick);
      });
    }

    async function loop() {
      while (!cancelled) {
        arcVal.set(0);
        await animateArc(0, 1, 1700);
        if (cancelled) return;

        void glowCtrl.start({
          opacity: [0, 1, 1, 0],
          scale: [0.7, 1.10, 1.0, 0.88],
          y: [10, 0, -3, -10],
          transition: { duration: 1.05, times: [0, 0.28, 0.65, 1] },
        });

        await new Promise<void>((r) => setTimeout(r, 1080));
        if (cancelled) return;

        await animateArc(1, 0, 260);
        await new Promise<void>((r) => setTimeout(r, 520));
      }
    }

    void loop();
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  }, [arcVal, glowCtrl, reduced]);

  return (
    <ItemPreviewScene
      bg="radial-gradient(ellipse at 50% 55%, oklch(0.97 0.07 82 / .95) 0%, oklch(0.89 0.05 73 / .98) 100%)"
    >
      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <div style={{ position: "relative" }}>
          {/* Ambient glow */}
          <motion.div
            animate={{ opacity: [0.28, 0.62, 0.28], scale: [0.9, 1.05, 0.9] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            style={{
              position: "absolute",
              inset: -20,
              borderRadius: "50%",
              background: "radial-gradient(circle, oklch(0.80 0.18 78 / .48) 0%, transparent 70%)",
              filter: "blur(10px)",
              pointerEvents: "none",
            }}
          />
          <MotionClockFace mv={arcVal} />
        </div>

        {/* +15s badge */}
        <motion.div
          animate={glowCtrl}
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          style={{
            background: "linear-gradient(135deg, oklch(0.76 0.19 78), oklch(0.63 0.17 70))",
            borderRadius: 20,
            padding: "5px 13px",
            boxShadow: "0 4px 14px oklch(0.68 0.18 75 / .5)",
            color: "oklch(0.98 0.02 80)",
            fontFamily: "var(--display)",
            fontWeight: 900,
            fontSize: 17,
            letterSpacing: "-0.02em",
            lineHeight: 1,
            border: "1.5px solid oklch(0.86 0.12 82 / .55)",
          }}
        >
          +١٥ث
        </motion.div>

        <div style={{
          color: "oklch(0.44 0.07 58)",
          fontSize: 10,
          fontWeight: 700,
          fontFamily: "var(--display)",
          letterSpacing: "0.02em",
        }}>
          وقت إضافي
        </div>
      </div>
    </ItemPreviewScene>
  );
}
