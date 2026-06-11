"use client";

/**
 * ItemPreviewScene — wrapper for looping animated mini-scenes.
 *
 * Performance notes:
 *  - IntersectionObserver gates animation start (no CPU/GPU until visible)
 *  - `will-change: transform` on the inner motion div promotes to own layer
 *  - Vignette overlay uses a simple gradient — no backdrop-filter (expensive)
 *  - `contain: layout style paint` limits repaint scope to this element
 *  - Children are only rendered after visibility gate fires
 */

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

export function ItemPreviewScene({
  children,
  aspectRatio = "3/2",
  bg = "radial-gradient(ellipse at 50% 60%, oklch(0.94 0.06 75 / .9) 0%, oklch(0.88 0.04 70 / .95) 100%)",
}: {
  children: React.ReactNode;
  aspectRatio?: string;
  bg?: string;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect(); // one-shot — no need to keep observing
        }
      },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        position: "relative",
        width: "100%",
        aspectRatio,
        borderRadius: 14,
        overflow: "hidden",
        background: bg,
        border: "1px solid oklch(0.80 0.06 70 / .30)",
        contain: "layout style paint",     // limits repaints to this subtree
      }}
    >
      {/* Subtle vignette (pure CSS — zero GPU cost) */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 0%, transparent 45%, oklch(0.55 0.04 58 / .14) 100%)",
          pointerEvents: "none",
          zIndex: 10,
        }}
      />

      {/* Content layer — layer-promoted for smooth animation */}
      <motion.div
        initial={{ opacity: 0, scale: reduced ? 1 : 0.92 }}
        animate={visible ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          willChange: "transform",    // own compositor layer → no main-thread paint
        }}
      >
        {visible ? children : null}
      </motion.div>
    </div>
  );
}
