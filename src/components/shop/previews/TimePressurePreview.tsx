"use client";

/**
 * TimePressurePreview — timer compresses to 10s, red warning glow, cinematic shake.
 * Communicates: stress, urgency, danger.
 */

import { motion, useReducedMotion, useAnimationControls } from "framer-motion";
import { useEffect, useState } from "react";
import { ItemPreviewScene } from "@/components/shop/ItemPreviewScene";

const DIGITS = ["30", "25", "20", "15", "10", "10"];

export function TimePressurePreview() {
  const reduced = useReducedMotion();
  const containerCtrl = useAnimationControls();
  const glowCtrl = useAnimationControls();
  const notifCtrl = useAnimationControls();
  const [digit, setDigit] = useState(0);
  const [phase, setPhase] = useState<"normal" | "pressure">("normal");

  useEffect(() => {
    if (reduced) return;
    let cancelled = false;
    let digitIdx = 0;

    async function loop() {
      while (!cancelled) {
        // Phase 1: count down normally (0–4 ticks fast)
        setPhase("normal");
        for (let i = 0; i < 4; i++) {
          if (cancelled) return;
          digitIdx = i;
          setDigit(digitIdx);
          await new Promise((r) => setTimeout(r, 250));
        }

        // Phase 2: slam to 10 with red glow + shake
        digitIdx = 4;
        setDigit(digitIdx);
        setPhase("pressure");

        void glowCtrl.start({
          opacity: [0, 1, 0.7, 0.9, 0.6],
          scale: [0.8, 1.15, 1.0, 1.08, 1.0],
          transition: { duration: 0.6, times: [0, 0.2, 0.45, 0.7, 1] },
        });

        void containerCtrl.start({
          x: [0, -4, 5, -3, 2, 0],
          transition: { duration: 0.4, ease: "easeOut" },
        });

        await new Promise((r) => setTimeout(r, 700));

        // Phase 3: show notification
        await notifCtrl.start({
          opacity: [0, 1, 1, 0],
          y: [10, 0, 0, -8],
          scale: [0.9, 1.02, 1.0, 0.95],
          transition: { duration: 1.4, times: [0, 0.15, 0.75, 1] },
        });

        await new Promise((r) => setTimeout(r, 400));

        // Reset
        setPhase("normal");
        setDigit(0);
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    void loop();
    return () => { cancelled = true; };
  }, [containerCtrl, glowCtrl, notifCtrl, reduced]);

  const isPressure = phase === "pressure";

  return (
    <ItemPreviewScene
      bg={`radial-gradient(ellipse at 50% 55%, ${isPressure ? "oklch(0.92 0.06 22 / .95)" : "oklch(0.94 0.04 75 / .95)"} 0%, ${isPressure ? "oklch(0.85 0.05 18 / .98)" : "oklch(0.88 0.04 70 / .98)"} 100%)`}
    >
      <motion.div
        animate={containerCtrl}
        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}
      >
        {/* Timer widget */}
        <div style={{ position: "relative" }}>
          {/* Red warning glow */}
          <motion.div
            animate={glowCtrl}
            initial={{ opacity: 0, scale: 0.8 }}
            style={{
              position: "absolute",
              inset: -24,
              borderRadius: "50%",
              background: "radial-gradient(circle, oklch(0.60 0.22 22 / .7) 0%, transparent 70%)",
              filter: "blur(10px)",
            }}
          />

          {/* Timer face */}
          <motion.div
            animate={{
              borderColor: isPressure
                ? ["oklch(0.60 0.22 22)", "oklch(0.75 0.18 20)", "oklch(0.60 0.22 22)"]
                : "oklch(0.78 0.06 70)",
              boxShadow: isPressure
                ? [
                    "0 0 0 0 oklch(0.60 0.22 22 / 0)",
                    "0 0 0 6px oklch(0.60 0.22 22 / .35)",
                    "0 0 0 2px oklch(0.60 0.22 22 / .15)",
                  ]
                : "0 2px 8px oklch(0.70 0.08 70 / .25)",
            }}
            transition={{ duration: isPressure ? 0.8 : 0.3, repeat: isPressure ? Infinity : 0 }}
            style={{
              width: 76,
              height: 76,
              borderRadius: "50%",
              border: "3px solid",
              background: isPressure
                ? "linear-gradient(180deg, oklch(0.96 0.04 20 / .9), oklch(0.90 0.05 18 / .95))"
                : "linear-gradient(180deg, oklch(0.98 0.02 80), oklch(0.93 0.04 75))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              position: "relative",
            }}
          >
            <motion.div
              key={digit}
              initial={{ y: -12, opacity: 0, scale: 0.7 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              style={{
                fontFamily: "var(--display)",
                fontWeight: 900,
                fontSize: 26,
                lineHeight: 1,
                color: isPressure ? "oklch(0.48 0.20 22)" : "oklch(0.35 0.06 50)",
                letterSpacing: "-0.03em",
              }}
            >
              {DIGITS[digit]}
            </motion.div>
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: isPressure ? "oklch(0.55 0.15 22 / .8)" : "oklch(0.55 0.04 60 / .7)",
                fontFamily: "var(--display)",
                letterSpacing: "0.03em",
              }}
            >
              ثانية
            </div>
          </motion.div>
        </div>

        {/* Notification banner */}
        <motion.div
          animate={notifCtrl}
          initial={{ opacity: 0, y: 10 }}
          style={{
            background: "linear-gradient(135deg, oklch(0.45 0.20 22), oklch(0.38 0.18 18))",
            borderRadius: 10,
            padding: "6px 12px",
            color: "oklch(0.98 0.01 20)",
            fontFamily: "var(--display)",
            fontWeight: 700,
            fontSize: 11,
            textAlign: "center",
            boxShadow: "0 4px 14px oklch(0.45 0.20 22 / .5)",
            border: "1px solid oklch(0.60 0.18 22 / .5)",
            whiteSpace: "nowrap",
          }}
        >
          تم تفعيل ضغط الوقت
        </motion.div>
      </motion.div>
    </ItemPreviewScene>
  );
}
