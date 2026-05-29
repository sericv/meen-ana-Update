"use client";

/**
 * TacticalActivationOverlay
 *
 * Cinematic full-bleed overlay that plays for ~1.85s when a tactical tool is activated.
 * Purely cosmetic — the Firebase write has already happened before this mounts.
 *
 * Motion architecture:
 *   Phase 0–200ms  : backdrop dims, accent vignette blooms in
 *   Phase 180–650ms: main motif scales in with overshoot (tween, NOT spring)
 *   Phase 600–950ms: title + effect line cascade up
 *   Phase 900–1200ms: actor chip fades in
 *   Phase 1500–1850ms: whole overlay fades out (CSS animation)
 *
 * ALL looping ambients use CSS keyframes (off main thread).
 * One-shot bursts use Framer Motion tweens (never spring with >2 keyframes).
 */

import { useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { TacticalToolIcon } from "@/components/game/play/TacticalToolIcons";
import { GP } from "@/components/game/play/tokens";
import type { TacticalToolId } from "@/lib/profile/tactical-tools";

const OVERLAY_DURATION_MS = 1900;

/* ── Per-tool palette ────────────────────────────────────────── */
const PALETTE: Record<TacticalToolId, {
  hue1: string; hue2: string;
  glow: string; mist: string;
  ink: string;
  label: string;
  effectLine: string;
}> = {
  extra_time: {
    hue1: "oklch(0.78 0.14 165)",
    hue2: "oklch(0.55 0.14 175)",
    glow: "oklch(0.78 0.14 165 / .55)",
    mist: "oklch(0.30 0.08 165 / .52)",
    ink:  "oklch(0.22 0.08 165)",
    label: "وقت إضافي",
    effectLine: "أُضيفت ١٥ ثانية إلى دورك الحالي",
  },
  time_pressure: {
    hue1: "oklch(0.72 0.20 22)",
    hue2: "oklch(0.52 0.22 18)",
    glow: "oklch(0.72 0.20 22 / .58)",
    mist: "oklch(0.28 0.10 22 / .55)",
    ink:  "oklch(0.22 0.10 22)",
    label: "ضغط الوقت",
    effectLine: "سؤال الخصم القادم = ١٠ ثوانٍ فقط",
  },
  extra_question: {
    hue1: "oklch(0.82 0.18 75)",
    hue2: "oklch(0.62 0.20 55)",
    glow: "oklch(0.82 0.18 70 / .55)",
    mist: "oklch(0.32 0.10 55 / .52)",
    ink:  "oklch(0.28 0.10 50)",
    label: "سؤال إضافي",
    effectLine: "اطرح سؤالين قبل أن يجيب الخصم",
  },
  shield: {
    hue1: "oklch(0.68 0.14 238)",
    hue2: "oklch(0.48 0.14 232)",
    glow: "oklch(0.68 0.14 235 / .55)",
    mist: "oklch(0.28 0.08 235 / .52)",
    ink:  "oklch(0.22 0.08 235)",
    label: "الدرع",
    effectLine: "أول هجوم تكتيكي سيُصدّ تلقائيًا",
  },
};

/* ── Types ───────────────────────────────────────────────────── */
export type TacticalActivation = {
  toolId: TacticalToolId;
  /** "me" = local player fired it, "them" = opponent fired it */
  actor: "me" | "them";
  /** Unique key — increment to remount */
  key: number;
  myName?: string;
  opponentName?: string;
};

type Props = {
  activation: TacticalActivation | null;
  onComplete: () => void;
};

/* ── Main overlay ────────────────────────────────────────────── */
export function TacticalActivationOverlay({ activation, onComplete }: Props) {
  const reduced = useReducedMotion();

  // Ref so the timeout fires the latest callback without re-triggering
  // the effect on every parent re-render (e.g. the 200ms clock in RoomExperience).
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!activation) return;
    const t = setTimeout(() => onCompleteRef.current(), OVERLAY_DURATION_MS);
    return () => clearTimeout(t);
  }, [activation?.key]); // intentionally excludes onComplete

  return (
    <AnimatePresence>
      {activation && (
        <OverlayInner
          key={activation.key}
          activation={activation}
          reduced={!!reduced}
        />
      )}
    </AnimatePresence>
  );
}

function OverlayInner({
  activation,
  reduced,
}: {
  activation: TacticalActivation;
  reduced: boolean;
}) {
  const { toolId, actor, myName = "أنت", opponentName = "الخصم" } = activation;
  const p = PALETTE[toolId];
  const actorName = actor === "me" ? myName : opponentName;
  const actorLabel = actor === "me"
    ? `${actorName} فعّل الأداة`
    : `${actorName} فعّل الأداة عليك`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      className="absolute inset-0 z-[90] overflow-hidden"
      style={{ pointerEvents: "none" }}
    >
      {/* ── Layer 1: Backdrop ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.32 }}
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(120% 100% at 50% 55%, ${p.mist}, oklch(0.16 0.04 40 / .72) 75%)`,
          backdropFilter: reduced ? "none" : "blur(14px) saturate(120%)",
          WebkitBackdropFilter: reduced ? "none" : "blur(14px) saturate(120%)",
        }}
      />

      {/* ── Layer 2: Accent vignette bloom ── */}
      {!reduced && (
        <motion.div
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: 0.72, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.06 }}
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(60% 50% at 50% 50%, ${p.glow}, transparent 70%)`,
            mixBlendMode: "screen",
          }}
        />
      )}

      {/* ── Layer 3: Tool-specific particle effects ── */}
      {!reduced && <ToolParticles toolId={toolId} palette={p} />}

      {/* ── Layer 4: Concentric pulse rings ── */}
      {!reduced && (
        <PulseRings
          color={p.hue1}
          shock={toolId === "time_pressure"}
        />
      )}

      {/* ── Layer 5: Main content ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 28px",
          gap: 16,
        }}
      >
        {/* Motif icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.28, rotate: -8, filter: "blur(10px)" }}
          animate={{ opacity: 1, scale: 1, rotate: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.55, ease: [0.18, 1.4, 0.38, 1], delay: 0.16 }}
        >
          <ToolMotif toolId={toolId} palette={p} />
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.64 }}
          style={{ textAlign: "center" }}
        >
          <div
            style={{
              fontFamily: "var(--display)",
              fontWeight: 800,
              fontSize: 32,
              lineHeight: 1.05,
              color: "oklch(0.99 0.02 80)",
              letterSpacing: "-0.02em",
              textShadow: `0 2px 14px ${p.glow}, 0 0 32px ${p.glow}`,
            }}
          >
            {p.label}
          </div>
        </motion.div>

        {/* Effect description */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1], delay: 0.80 }}
          style={{
            fontFamily: "var(--body, system-ui)",
            fontSize: 13,
            color: "oklch(0.92 0.04 80 / .88)",
            textAlign: "center",
            maxWidth: 260,
            lineHeight: 1.55,
          }}
        >
          {p.effectLine}
        </motion.div>

        {/* Actor chip */}
        <motion.div
          initial={{ opacity: 0, y: 6, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1], delay: 1.0 }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "7px 14px",
            borderRadius: 999,
            background: "oklch(0.18 0.04 40 / .60)",
            border: `1px solid ${p.hue1}44`,
            backdropFilter: "blur(6px)",
            color: "oklch(0.94 0.04 80 / .95)",
            fontFamily: "var(--display)",
            fontWeight: 700,
            fontSize: 12,
          }}
        >
          {/* Actor dot */}
          <span
            aria-hidden
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: p.hue1,
              boxShadow: `0 0 8px ${p.hue1}, 0 0 14px ${p.glow}`,
              flexShrink: 0,
            }}
          />
          {actorLabel}
        </motion.div>
      </div>

      {/* CSS ambient keyframes */}
      <style>{`
        @keyframes tacRingPop {
          0%   { opacity: 0.75; transform: scale(0.3); border-width: 3px; }
          100% { opacity: 0;   transform: scale(5.5); border-width: 0.5px; }
        }
        @keyframes tacShockPop {
          0%   { opacity: 1;   transform: scale(0.2); border-width: 4px; }
          100% { opacity: 0;   transform: scale(8);   border-width: 0.5px; }
        }
        @keyframes tacParticle {
          0%   { opacity: 0; transform: translate(0,0) scale(0.4) rotate(0deg); }
          12%  { opacity: 1; }
          100% { opacity: 0; transform: translate(var(--tx),var(--ty)) scale(0.5) rotate(var(--rot)); }
        }
        @keyframes tacGlowPulse {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50%      { opacity: 0.90; transform: scale(1.05); }
        }
      `}</style>
    </motion.div>
  );
}

/* ── Concentric rings ─────────────────────────────────────────── */
function PulseRings({ color, shock }: { color: string; shock: boolean }) {
  const delays = shock ? [0.18, 0.30, 0.42] : [0.25, 0.50, 0.75];
  const anim = shock ? "tacShockPop" : "tacRingPop";
  const dur = shock ? "1.0s" : "1.6s";
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "grid",
        placeItems: "center",
        pointerEvents: "none",
      }}
    >
      {delays.map((d, i) => (
        <div
          key={i}
          aria-hidden
          style={{
            position: "absolute",
            width: 80,
            height: 80,
            borderRadius: "50%",
            border: `2px solid ${color}`,
            opacity: 0,
            animation: `${anim} ${dur} cubic-bezier(0.22,1,0.36,1) ${d}s forwards`,
          }}
        />
      ))}
    </div>
  );
}

/* ── Per-tool main motif ──────────────────────────────────────── */
function ToolMotif({ toolId, palette: p }: { toolId: TacticalToolId; palette: typeof PALETTE[TacticalToolId] }) {
  return (
    <div
      style={{
        position: "relative",
        width: 120,
        height: 120,
        display: "grid",
        placeItems: "center",
      }}
    >
      {/* Outer glow halo — CSS animated */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: -24,
          borderRadius: "50%",
          background: `radial-gradient(closest-side, ${p.glow}, transparent 70%)`,
          filter: "blur(10px)",
          animation: "tacGlowPulse 2s ease-in-out infinite",
        }}
      />

      {/* Double-bezel icon shell */}
      <div
        style={{
          position: "relative",
          width: 100,
          height: 100,
          borderRadius: 28,
          background: `linear-gradient(160deg, ${p.hue1}, ${p.hue2})`,
          boxShadow: [
            "inset 0 2px 0 rgba(255,255,255,0.5)",
            "inset 0 -2px 0 rgba(0,0,0,0.15)",
            `0 8px 24px ${p.glow}`,
            `0 20px 48px ${p.glow}`,
          ].join(", "),
          display: "grid",
          placeItems: "center",
          border: `1.5px solid ${p.hue1}`,
          outline: "1px solid rgba(255,255,255,0.25)",
        }}
      >
        {/* Inner core — slightly inset */}
        <div
          style={{
            width: 76,
            height: 76,
            borderRadius: 20,
            background: `linear-gradient(160deg, ${p.hue2}, oklch(0.28 0.08 40))`,
            display: "grid",
            placeItems: "center",
            boxShadow: "inset 0 2px 6px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.15)",
          }}
        >
          <TacticalToolIcon id={toolId} size={36} />
        </div>

        {/* Specular top streak */}
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            left: "10%",
            right: "10%",
            height: "42%",
            borderRadius: "28px 28px 50% 50%",
            background: "linear-gradient(180deg, rgba(255,255,255,0.32) 0%, transparent 100%)",
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
}

/* ── Burst particles ──────────────────────────────────────────── */
function ToolParticles({
  toolId,
  palette: p,
}: {
  toolId: TacticalToolId;
  palette: typeof PALETTE[TacticalToolId];
}) {
  const count = toolId === "time_pressure" ? 10 : toolId === "shield" ? 8 : 10;

  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * 360 + (i % 3) * 8;
      const dist = 100 + (i % 5) * 28;
      const size = 3.5 + (i % 4) * 1.5;
      const delay = 0.22 + (i % 8) * 0.06;
      const dur = 0.95 + (i % 4) * 0.18;
      const rot = (i * 37) % 360;
      const tx = Math.cos((angle * Math.PI) / 180) * dist;
      const ty = Math.sin((angle * Math.PI) / 180) * dist;
      return { size, delay, dur, rot, tx, ty };
    });
  }, [count]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        display: "grid",
        placeItems: "center",
      }}
    >
      {particles.map((pt, i) => (
        <span
          key={i}
          aria-hidden
          style={{
            position: "absolute",
            width: pt.size,
            height: pt.size,
            borderRadius: toolId === "time_pressure" ? 2 : "50%",
            background: p.hue1,
            boxShadow: `0 0 6px ${p.glow}`,
            opacity: 0,
            ["--tx" as string]: `${pt.tx}px`,
            ["--ty" as string]: `${pt.ty}px`,
            ["--rot" as string]: `${pt.rot}deg`,
            animation: `tacParticle ${pt.dur}s cubic-bezier(0.15,0.85,0.30,1) ${pt.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
}
