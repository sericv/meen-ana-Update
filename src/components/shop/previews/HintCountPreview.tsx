"use client";

/**
 * HintCountPreview — reveals the count/length of the hidden word.
 * Communicates: information reveal, strategic insight.
 */

import { motion, useReducedMotion, useAnimationControls } from "framer-motion";
import { useEffect, useState } from "react";
import { ItemPreviewScene } from "@/components/shop/ItemPreviewScene";

const COUNTS = [3, 5, 4, 6];

export function HintCountPreview() {
  const reduced = useReducedMotion();
  const badgeCtrl = useAnimationControls();
  const scanCtrl = useAnimationControls();
  const [countIdx, setCountIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (reduced) return;
    let cancelled = false;
    let idx = 0;

    async function loop() {
      while (!cancelled) {
        setRevealed(false);
        setCountIdx(idx % COUNTS.length);

        // Phase 1: scan line sweeps
        await scanCtrl.start({
          x: ["-110%", "110%"],
          opacity: [0, 0.8, 0.8, 0],
          transition: { duration: 0.7, ease: "easeInOut" },
        });

        // Phase 2: number reveals
        setRevealed(true);
        await badgeCtrl.start({
          scale: [0.5, 1.18, 1.0],
          opacity: [0, 1, 1],
          transition: { duration: 0.45, times: [0, 0.55, 1], ease: [0.16, 1.4, 0.36, 1] },
        });

        await new Promise((r) => setTimeout(r, 1200));

        // Phase 3: out
        await badgeCtrl.start({
          scale: 0.85,
          opacity: 0,
          transition: { duration: 0.25 },
        });
        setRevealed(false);
        idx++;
        await new Promise((r) => setTimeout(r, 400));
      }
    }

    void loop();
    return () => { cancelled = true; };
  }, [badgeCtrl, scanCtrl, reduced]);

  const count = COUNTS[countIdx % COUNTS.length]!;

  return (
    <ItemPreviewScene
      bg="radial-gradient(ellipse at 50% 50%, oklch(0.95 0.06 78 / .95) 0%, oklch(0.88 0.04 70 / .98) 100%)"
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        {/* Card-like element with hidden squares */}
        <div
          style={{
            position: "relative",
            background: "linear-gradient(160deg, oklch(0.98 0.02 80), oklch(0.92 0.04 72))",
            borderRadius: 14,
            padding: "14px 18px",
            border: "1.5px solid oklch(0.82 0.06 70 / .5)",
            boxShadow: "0 3px 12px oklch(0.70 0.06 65 / .2)",
            overflow: "hidden",
          }}
        >
          {/* Scan line */}
          <motion.div
            animate={scanCtrl}
            initial={{ x: "-110%", opacity: 0 }}
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(105deg, transparent 15%, oklch(0.85 0.18 78 / .5) 50%, transparent 85%)",
              pointerEvents: "none",
            }}
          />

          {/* Hidden squares representing word length */}
          <div style={{ display: "flex", gap: 5, marginBottom: 8 }}>
            {Array.from({ length: count }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: 22,
                  height: 24,
                  borderRadius: 6,
                  background: "oklch(0.85 0.04 70 / .6)",
                  border: "1.5px solid oklch(0.78 0.04 65 / .4)",
                }}
              />
            ))}
          </div>

          {/* Count badge */}
          <motion.div
            animate={badgeCtrl}
            initial={{ scale: 0.5, opacity: 0 }}
            style={{
              textAlign: "center",
              background: "linear-gradient(135deg, oklch(0.78 0.18 78), oklch(0.65 0.16 72))",
              borderRadius: 10,
              padding: "3px 10px",
              color: "oklch(0.98 0.02 80)",
              fontFamily: "var(--display)",
              fontWeight: 800,
              fontSize: 16,
              boxShadow: "0 3px 10px oklch(0.68 0.16 76 / .45)",
            }}
          >
            {count} مربعات
          </motion.div>
        </div>

        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: "oklch(0.50 0.10 72)",
            fontFamily: "var(--display)",
            opacity: revealed ? 1 : 0,
            transition: "opacity 0.3s",
          }}
        >
          عدد المربعات معروف!
        </div>
      </div>
    </ItemPreviewScene>
  );
}
