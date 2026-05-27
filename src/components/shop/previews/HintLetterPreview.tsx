"use client";

/**
 * HintLetterPreview — hidden letter tiles, one gets revealed with a golden flash.
 * Communicates: discovery, reveal, letter hint.
 */

import { motion, useReducedMotion, useAnimationControls } from "framer-motion";
import { useEffect, useState } from "react";
import { ItemPreviewScene } from "@/components/shop/ItemPreviewScene";

const HIDDEN_TILES = ["_", "_", "_", "_", "_"];
const REVEALED_INDEX = 2;
const REVEALED_LETTER = "م";

function LetterTile({
  char,
  revealed,
  isTarget,
}: {
  char: string;
  revealed?: boolean;
  isTarget?: boolean;
}) {
  return (
    <motion.div
      animate={
        isTarget && revealed
          ? {
              rotateY: 0,
              background: ["oklch(0.82 0.18 78)", "oklch(0.96 0.10 80)", "oklch(0.88 0.14 76)"],
              boxShadow: [
                "0 0 0 0 oklch(0.75 0.18 78 / 0)",
                "0 0 16px 4px oklch(0.75 0.18 78 / .7)",
                "0 2px 8px oklch(0.70 0.12 75 / .3)",
              ],
            }
          : {}
      }
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{
        width: 32,
        height: 36,
        borderRadius: 8,
        border: `2px solid ${
          revealed && isTarget
            ? "oklch(0.72 0.18 78)"
            : "oklch(0.78 0.06 70 / .7)"
        }`,
        background:
          revealed && isTarget
            ? "linear-gradient(160deg, oklch(0.92 0.14 80), oklch(0.82 0.16 74))"
            : "linear-gradient(180deg, oklch(0.96 0.02 78), oklch(0.90 0.03 72))",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--display)",
        fontWeight: 800,
        fontSize: revealed && isTarget ? 18 : 14,
        color:
          revealed && isTarget
            ? "oklch(0.28 0.06 45)"
            : "oklch(0.72 0.04 65 / .5)",
        boxShadow:
          revealed && isTarget
            ? "0 2px 8px oklch(0.70 0.14 75 / .4)"
            : "0 1px 3px oklch(0.70 0.04 65 / .2)",
        transition: "all 0.4s ease",
      }}
    >
      {revealed && isTarget ? REVEALED_LETTER : char}
    </motion.div>
  );
}

export function HintLetterPreview() {
  const reduced = useReducedMotion();
  const lightbulbCtrl = useAnimationControls();
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (reduced) return;
    let cancelled = false;

    async function loop() {
      while (!cancelled) {
        // Phase 1: bulb glows
        setRevealed(false);
        await lightbulbCtrl.start({
          scale: [1, 1.2, 1.0],
          opacity: [0.5, 1, 0.9],
          filter: [
            "drop-shadow(0 0 0px transparent)",
            "drop-shadow(0 0 8px oklch(0.78 0.18 78))",
            "drop-shadow(0 0 4px oklch(0.78 0.14 78 / .6))",
          ],
          transition: { duration: 0.5 },
        });

        await new Promise((r) => setTimeout(r, 200));

        // Phase 2: reveal
        setRevealed(true);
        await new Promise((r) => setTimeout(r, 1400));

        // Phase 3: fade out
        await lightbulbCtrl.start({
          opacity: 0.5,
          scale: 0.9,
          filter: "drop-shadow(0 0 0px transparent)",
          transition: { duration: 0.3 },
        });
        setRevealed(false);
        await new Promise((r) => setTimeout(r, 600));
      }
    }

    void loop();
    return () => { cancelled = true; };
  }, [lightbulbCtrl, reduced]);

  return (
    <ItemPreviewScene
      bg="radial-gradient(ellipse at 50% 50%, oklch(0.96 0.07 80 / .95) 0%, oklch(0.89 0.05 73 / .98) 100%)"
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        {/* Lightbulb icon */}
        <motion.div animate={lightbulbCtrl} initial={{ opacity: 0.5, scale: 1 }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 18h6M10 22h4M12 3a5 5 0 00-3 9.2V15h6v-2.8A5 5 0 0012 3z"
              stroke="oklch(0.60 0.16 75)"
              strokeWidth="1.8"
              strokeLinecap="round"
              fill="oklch(0.85 0.16 80 / .3)"
            />
          </svg>
        </motion.div>

        {/* Letter tiles */}
        <div style={{ display: "flex", gap: 4 }}>
          {HIDDEN_TILES.map((tile, i) => (
            <LetterTile
              key={i}
              char={tile}
              revealed={revealed}
              isTarget={i === REVEALED_INDEX}
            />
          ))}
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
          تم كشف حرف!
        </div>
      </div>
    </ItemPreviewScene>
  );
}
