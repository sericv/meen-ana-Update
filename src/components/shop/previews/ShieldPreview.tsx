"use client";

/**
 * ShieldPreview — glowing shield aura, incoming attack bounces back.
 * Communicates: protection, tactical defense, reflection.
 */

import { motion, useReducedMotion, useAnimationControls } from "framer-motion";
import { useEffect, useState } from "react";
import { ItemPreviewScene } from "@/components/shop/ItemPreviewScene";

function ShieldShape({ glowing }: { glowing: boolean }) {
  return (
    <svg width="64" height="72" viewBox="0 0 64 72" fill="none" style={{ overflow: "visible" }}>
      {/* Outer glow */}
      {glowing && (
        <>
          <path
            d="M32 4l26 10v20c0 18-10 30-26 36C16 64 6 52 6 34V14L32 4z"
            fill="oklch(0.65 0.18 240 / .18)"
            style={{ filter: "blur(6px)" }}
          />
        </>
      )}
      {/* Shield body */}
      <path
        d="M32 4l26 10v20c0 18-10 30-26 36C16 64 6 52 6 34V14L32 4z"
        fill={
          glowing
            ? "url(#shieldGradGlow)"
            : "url(#shieldGrad)"
        }
        stroke={glowing ? "oklch(0.70 0.20 240)" : "oklch(0.62 0.08 220)"}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {/* Inner highlight */}
      <path
        d="M32 10l20 8v16c0 13-8 22-20 27C20 56 12 47 12 34V18L32 10z"
        fill="oklch(0.90 0.08 230 / .25)"
        strokeWidth="0"
      />
      {/* Check mark */}
      <path
        d="M22 36l7 7 13-14"
        stroke={glowing ? "oklch(0.96 0.03 220)" : "oklch(0.55 0.10 220)"}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="shieldGrad" x1="32" y1="4" x2="32" y2="70" gradientUnits="userSpaceOnUse">
          <stop stopColor="oklch(0.82 0.10 225)" />
          <stop offset="1" stopColor="oklch(0.65 0.12 220)" />
        </linearGradient>
        <linearGradient id="shieldGradGlow" x1="32" y1="4" x2="32" y2="70" gradientUnits="userSpaceOnUse">
          <stop stopColor="oklch(0.88 0.14 240)" />
          <stop offset="1" stopColor="oklch(0.62 0.20 230)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function ShieldPreview() {
  const reduced = useReducedMotion();
  const shieldCtrl = useAnimationControls();
  const attackCtrl = useAnimationControls();
  const reflectCtrl = useAnimationControls();
  const rippleCtrl = useAnimationControls();
  const [glowing, setGlowing] = useState(false);

  useEffect(() => {
    if (reduced) return;
    let cancelled = false;

    async function loop() {
      while (!cancelled) {
        // Phase 1: shield pulses in
        setGlowing(false);
        await shieldCtrl.start({
          scale: [0.85, 1.05, 1.0],
          opacity: [0, 1, 1],
          transition: { duration: 0.5, times: [0, 0.6, 1], ease: [0.16, 1.4, 0.36, 1] },
        });

        await new Promise((r) => setTimeout(r, 300));

        // Phase 2: glow activates
        setGlowing(true);
        void shieldCtrl.start({
          scale: [1.0, 1.06, 1.0],
          transition: { duration: 0.6, ease: "easeInOut" },
        });

        await new Promise((r) => setTimeout(r, 200));

        // Phase 3: attack projectile comes in from right
        await attackCtrl.start({
          x: [60, 0],
          opacity: [0, 1, 1],
          scale: [0.6, 1.0, 1.0],
          transition: { duration: 0.45, ease: "easeIn" },
        });

        // Phase 4: impact — ripple + reflect
        void rippleCtrl.start({
          scale: [0.5, 2.2],
          opacity: [0.8, 0],
          transition: { duration: 0.55, ease: "easeOut" },
        });

        void shieldCtrl.start({
          scale: [1.0, 1.14, 1.0],
          transition: { duration: 0.35, ease: "easeOut" },
        });

        void attackCtrl.start({
          x: [0, 72],
          opacity: [1, 0],
          scale: [1.0, 0.5],
          transition: { duration: 0.4, ease: "easeOut" },
        });

        // Phase 5: deflect arrow
        await reflectCtrl.start({
          x: [0, 64],
          opacity: [0, 1, 1, 0],
          scaleX: [-1, -1, -1, -1],
          transition: { duration: 0.55, times: [0, 0.1, 0.7, 1] },
        });

        await new Promise((r) => setTimeout(r, 600));

        // Reset
        setGlowing(false);
        await shieldCtrl.start({ scale: 0.85, opacity: 0, transition: { duration: 0.25 } });
        await attackCtrl.start({ x: 60, opacity: 0, transition: { duration: 0.01 } });
        await reflectCtrl.start({ x: 0, opacity: 0, transition: { duration: 0.01 } });
        await new Promise((r) => setTimeout(r, 400));
      }
    }

    void loop();
    return () => { cancelled = true; };
  }, [shieldCtrl, attackCtrl, reflectCtrl, rippleCtrl, reduced]);

  return (
    <ItemPreviewScene
      bg="radial-gradient(ellipse at 50% 55%, oklch(0.93 0.06 230 / .9) 0%, oklch(0.86 0.05 220 / .97) 100%)"
    >
      <div style={{ position: "relative", width: 120, height: 90, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {/* Ripple on impact */}
        <motion.div
          animate={rippleCtrl}
          initial={{ scale: 0.5, opacity: 0 }}
          style={{
            position: "absolute",
            width: 60,
            height: 60,
            borderRadius: "50%",
            border: "2.5px solid oklch(0.70 0.18 240 / .8)",
            pointerEvents: "none",
          }}
        />

        {/* Ambient glow behind shield */}
        <motion.div
          animate={{ opacity: glowing ? [0.4, 0.8, 0.4] : 0.0 }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: "radial-gradient(circle, oklch(0.70 0.20 240 / .55) 0%, transparent 70%)",
            filter: "blur(10px)",
          }}
        />

        {/* Shield */}
        <motion.div
          animate={shieldCtrl}
          initial={{ scale: 0.85, opacity: 0 }}
          style={{ position: "relative", zIndex: 2 }}
        >
          <ShieldShape glowing={glowing} />
        </motion.div>

        {/* Incoming attack (from right) */}
        <motion.div
          animate={attackCtrl}
          initial={{ x: 60, opacity: 0 }}
          style={{
            position: "absolute",
            right: 0,
            top: "50%",
            translateY: "-50%",
            zIndex: 3,
          }}
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M2 11h14M12 6l5 5-5 5" stroke="oklch(0.52 0.20 22)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>

        {/* Reflected arrow (flies back right) */}
        <motion.div
          animate={reflectCtrl}
          initial={{ x: 0, opacity: 0 }}
          style={{
            position: "absolute",
            right: 0,
            top: "50%",
            translateY: "-50%",
            zIndex: 3,
          }}
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M20 11H6M10 6L5 11l5 5" stroke="oklch(0.55 0.18 230)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>
      </div>
    </ItemPreviewScene>
  );
}
