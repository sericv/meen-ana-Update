"use client";

/**
 * ExtraQuestionPreview — question bubble duplicates with golden expansion.
 * Communicates: advantage, strategy, double-power.
 */

import { motion, useReducedMotion, useAnimationControls } from "framer-motion";
import { useEffect, useState } from "react";
import { ItemPreviewScene } from "@/components/shop/ItemPreviewScene";

function QuestionBubble({
  lines,
  style,
  glowing,
}: {
  lines: [string, string];
  style?: React.CSSProperties;
  glowing?: boolean;
}) {
  return (
    <div
      style={{
        background: glowing
          ? "linear-gradient(160deg, oklch(0.99 0.04 82), oklch(0.94 0.08 76))"
          : "linear-gradient(160deg, oklch(0.98 0.01 80), oklch(0.93 0.03 72))",
        borderRadius: 12,
        padding: "8px 12px",
        border: `1.5px solid ${glowing ? "oklch(0.78 0.16 78 / .7)" : "oklch(0.82 0.05 70 / .5)"}`,
        boxShadow: glowing
          ? "0 4px 18px oklch(0.75 0.18 78 / .45), 0 1px 4px oklch(0.70 0.10 70 / .2)"
          : "0 2px 8px oklch(0.70 0.06 65 / .2)",
        minWidth: 120,
        ...style,
      }}
    >
      <div
        style={{
          width: lines[0] === "long" ? 80 : 70,
          height: 6,
          borderRadius: 4,
          background: glowing ? "oklch(0.72 0.14 75 / .6)" : "oklch(0.75 0.05 65 / .5)",
          marginBottom: 5,
        }}
      />
      <div
        style={{
          width: 50,
          height: 6,
          borderRadius: 4,
          background: glowing ? "oklch(0.72 0.14 75 / .4)" : "oklch(0.75 0.05 65 / .3)",
        }}
      />
      {/* Tail */}
      <div
        style={{
          position: "absolute",
          bottom: -7,
          left: 16,
          width: 0,
          height: 0,
          borderLeft: "7px solid transparent",
          borderRight: "7px solid transparent",
          borderTop: `8px solid ${glowing ? "oklch(0.78 0.16 78 / .7)" : "oklch(0.82 0.05 70 / .5)"}`,
        }}
      />
    </div>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="8" fill="oklch(0.72 0.16 78)" />
      <path d="M8 4.5v7M4.5 8h7" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function ExtraQuestionPreview() {
  const reduced = useReducedMotion();
  const secondCtrl = useAnimationControls();
  const plusCtrl = useAnimationControls();
  const shimmerCtrl = useAnimationControls();
  const [showSecond, setShowSecond] = useState(false);

  useEffect(() => {
    if (reduced) return;
    let cancelled = false;

    async function loop() {
      while (!cancelled) {
        // Phase 1: wait
        await new Promise((r) => setTimeout(r, 400));

        // Phase 2: +badge appears
        await plusCtrl.start({
          scale: [0, 1.3, 1.0],
          opacity: [0, 1, 1],
          transition: { duration: 0.4, times: [0, 0.6, 1] },
        });

        await new Promise((r) => setTimeout(r, 200));

        // Phase 3: second bubble expands
        setShowSecond(true);
        await secondCtrl.start({
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { duration: 0.55, ease: [0.16, 1.4, 0.36, 1] },
        });

        // Phase 4: shimmer on second bubble
        void shimmerCtrl.start({
          x: ["-100%", "120%"],
          transition: { duration: 0.7, ease: "easeInOut" },
        });

        await new Promise((r) => setTimeout(r, 1400));

        // Phase 5: collapse
        await secondCtrl.start({
          opacity: 0,
          y: 8,
          scale: 0.88,
          transition: { duration: 0.35, ease: "easeIn" },
        });
        await plusCtrl.start({
          scale: 0,
          opacity: 0,
          transition: { duration: 0.2 },
        });
        setShowSecond(false);
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    void loop();
    return () => { cancelled = true; };
  }, [secondCtrl, plusCtrl, shimmerCtrl, reduced]);

  return (
    <ItemPreviewScene
      bg="radial-gradient(ellipse at 50% 45%, oklch(0.96 0.07 82 / .95) 0%, oklch(0.89 0.05 74 / .98) 100%)"
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 8,
          position: "relative",
          paddingTop: 4,
        }}
      >
        {/* First bubble — always present */}
        <div style={{ position: "relative" }}>
          <QuestionBubble lines={["main", "sub"]} />
        </div>

        {/* Plus badge */}
        <motion.div
          animate={plusCtrl}
          initial={{ scale: 0, opacity: 0 }}
          style={{
            position: "absolute",
            top: -8,
            right: -8,
            zIndex: 20,
            filter: "drop-shadow(0 2px 4px oklch(0.60 0.14 75 / .5))",
          }}
        >
          <PlusIcon />
        </motion.div>

        {/* Second bubble */}
        {showSecond && (
          <motion.div
            animate={secondCtrl}
            initial={{ opacity: 0, y: 8, scale: 0.88 }}
            style={{ position: "relative", overflow: "hidden" }}
          >
            <QuestionBubble lines={["long", "short"]} glowing />
            {/* Shimmer sweep */}
            <motion.div
              animate={shimmerCtrl}
              initial={{ x: "-100%" }}
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(105deg, transparent 20%, oklch(0.98 0.06 82 / .7) 50%, transparent 80%)",
                pointerEvents: "none",
              }}
            />
          </motion.div>
        )}

        {/* "سؤال إضافي" label */}
        <motion.div
          animate={{ opacity: showSecond ? 1 : 0 }}
          style={{
            fontSize: 10,
            fontWeight: 800,
            fontFamily: "var(--display)",
            color: "oklch(0.55 0.14 75)",
            letterSpacing: "0.04em",
            alignSelf: "flex-end",
          }}
        >
          سؤال إضافي ✦
        </motion.div>
      </div>
    </ItemPreviewScene>
  );
}
