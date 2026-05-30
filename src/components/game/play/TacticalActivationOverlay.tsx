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
import { playExtraTimeCinematic, playTimePressureCinematic } from "@/lib/audio/game-sounds";
import type { TacticalToolId } from "@/lib/profile/tactical-tools";

const OVERLAY_DURATION_MS = 1900;

/* ── Per-tool palette ────────────────────────────────────────── */
const PALETTE: Record<TacticalToolId, {
  hue1: string; hue2: string;
  glow: string; mist: string;
  ink: string;
  label: string;
  labelEn: string;
  effectLine: string;
  actorMe:   (name: string) => string;
  actorThem: (name: string) => string;
}> = {
  extra_time: {
    hue1: "oklch(0.78 0.14 165)",
    hue2: "oklch(0.55 0.14 175)",
    glow: "oklch(0.78 0.14 165 / .55)",
    mist: "oklch(0.30 0.08 165 / .52)",
    ink:  "oklch(0.22 0.08 165)",
    label: "وقت إضافي",
    labelEn: "EXTRA TIME",
    effectLine: "أُضيفت ١٥ ثانية إلى دورك الحالي",
    actorMe:   (n) => `${n} فعّل وقتًا إضافيًا`,
    actorThem: (n) => `${n} فعّلت وقتًا إضافيًا`,
  },
  time_pressure: {
    hue1: "oklch(0.72 0.20 22)",
    hue2: "oklch(0.52 0.22 18)",
    glow: "oklch(0.72 0.20 22 / .58)",
    mist: "oklch(0.28 0.10 22 / .55)",
    ink:  "oklch(0.22 0.10 22)",
    label: "ضغط الوقت",
    labelEn: "TIME PRESSURE",
    effectLine: "سؤال الخصم القادم = ١٠ ثوانٍ فقط",
    actorMe:   (n) => `${n} فرضت الضغط`,
    actorThem: (n) => `${n} فرضت ضغط الوقت عليك`,
  },
  extra_question: {
    hue1: "oklch(0.82 0.18 75)",
    hue2: "oklch(0.62 0.20 55)",
    glow: "oklch(0.82 0.18 70 / .55)",
    mist: "oklch(0.32 0.10 55 / .52)",
    ink:  "oklch(0.28 0.10 50)",
    label: "سؤال إضافي",
    labelEn: "EXTRA QUESTION",
    effectLine: "اطرح سؤالين قبل أن ينتقل الدور",
    actorMe:   (n) => `${n} حصل على سؤال إضافي`,
    actorThem: (n) => `${n} حصلت على سؤال إضافي`,
  },
  shield: {
    hue1: "oklch(0.68 0.14 238)",
    hue2: "oklch(0.48 0.14 232)",
    glow: "oklch(0.68 0.14 235 / .55)",
    mist: "oklch(0.28 0.08 235 / .52)",
    ink:  "oklch(0.22 0.08 235)",
    label: "الدرع",
    labelEn: "SHIELD",
    effectLine: "أول هجوم تكتيكي سيُصدّ تلقائيًا",
    actorMe:   (n) => `${n} فعّل الدرع`,
    actorThem: (n) => `${n} فعّل الدرع ضدك`,
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
    ? p.actorMe(actorName)
    : p.actorThem(actorName);

  // Fire per-tool soundscape on mount; cleanup on unmount
  useEffect(() => {
    if (reduced) return;
    if (toolId === "time_pressure") return playTimePressureCinematic();
    if (toolId === "extra_time") return playExtraTimeCinematic();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      {!reduced && toolId === "extra_time" && (
        <RippleRings color={p.hue1} />
      )}
      {!reduced && toolId !== "extra_time" && (
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
        {/* Motif — per-tool custom, generic bezel fallback */}
        <motion.div
          initial={{ opacity: 0, scale: 0.28, rotate: -8, filter: "blur(10px)" }}
          animate={{ opacity: 1, scale: 1, rotate: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.55, ease: [0.18, 1.4, 0.38, 1], delay: 0.16 }}
        >
          {toolId === "time_pressure"
            ? <CrackedClock palette={p} />
            : toolId === "extra_time"
            ? <PlusFifteen palette={p} />
            : toolId === "extra_question"
            ? <SplitGlyph palette={p} />
            : <ToolMotif toolId={toolId} palette={p} />}
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
          <div
            style={{
              fontFamily: "var(--mono, monospace)",
              fontSize: 10,
              color: "oklch(0.85 0.06 80 / .65)",
              letterSpacing: ".28em",
              marginTop: 4,
            }}
          >
            {p.labelEn}
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
        @keyframes qSplitA {
          0%   { transform: translateX(60px) rotate(0deg) scale(.9); opacity: 0; }
          50%  { transform: translateX(-2px) rotate(-4deg) scale(1.02); opacity: 1; }
          100% { transform: translateX(-22px) rotate(-7deg) scale(1); opacity: 1; }
        }
        @keyframes qSplitB {
          0%   { transform: translateX(0) rotate(0deg) scale(.9); opacity: 0; }
          40%  { opacity: 1; }
          100% { transform: translateX(64px) rotate(7deg) scale(1); opacity: 1; }
        }
        @keyframes x2Stamp {
          0%   { transform: rotate(20deg) scale(0); }
          70%  { transform: rotate(4deg) scale(1.15); }
          100% { transform: rotate(8deg) scale(1); }
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

/* ── extra_question: two ؟-cards that split apart ────────────── */
function CardGlyph({
  style,
  palette: p,
}: {
  style: React.CSSProperties;
  palette: typeof PALETTE[TacticalToolId];
}) {
  return (
    <div
      style={{
        width: 130,
        height: 180,
        borderRadius: 14,
        background: "linear-gradient(180deg, oklch(0.96 0.06 80), oklch(0.88 0.10 70))",
        border: `1px solid ${p.hue2}`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,.5), 0 18px 30px -10px ${p.glow}`,
        display: "grid",
        placeItems: "center",
        ...style,
      }}
    >
      <div
        style={{
          fontFamily: "var(--display)",
          fontWeight: 800,
          fontSize: 78,
          color: p.ink,
          lineHeight: 1,
          textShadow: "0 2px 0 rgba(255,255,255,.4)",
        }}
      >
        ؟
      </div>
    </div>
  );
}

function SplitGlyph({ palette: p }: { palette: typeof PALETTE[TacticalToolId] }) {
  return (
    <div style={{ position: "relative", width: 240, height: 200 }}>
      {/* Ambient halo */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: -10,
          borderRadius: 28,
          background: `radial-gradient(closest-side, ${p.glow}, transparent 70%)`,
          filter: "blur(8px)",
        }}
      />
      {/* Card A — slides left, tilts -7deg */}
      <CardGlyph
        style={{
          position: "absolute",
          left: 30,
          top: 8,
          animation: "qSplitA .9s cubic-bezier(.2,.9,.3,1) .15s forwards",
        }}
        palette={p}
      />
      {/* Card B — emerges from center, slides right +7deg */}
      <CardGlyph
        style={{
          position: "absolute",
          left: 30,
          top: 8,
          opacity: 0,
          animation: "qSplitB .9s cubic-bezier(.2,.9,.3,1) .25s forwards",
        }}
        palette={p}
      />
      {/* ×2 stamp — overshoot spring via CSS */}
      <div
        style={{
          position: "absolute",
          right: -6,
          top: -10,
          padding: "6px 12px",
          borderRadius: 12,
          background: `linear-gradient(180deg, ${p.hue1}, ${p.hue2})`,
          color: "oklch(0.99 0.02 80)",
          fontFamily: "var(--display)",
          fontWeight: 800,
          fontSize: 26,
          letterSpacing: "-.05em",
          boxShadow: `inset 0 1px 0 rgba(255,255,255,.4), 0 8px 18px -4px ${p.glow}`,
          transform: "rotate(8deg) scale(0)",
          animation: "x2Stamp .5s cubic-bezier(.2,1.6,.4,1) .85s forwards",
        }}
      >
        ×2
      </div>
    </div>
  );
}

/* ── PlusFifteen — extra_time motif ─────────────────────────── */
function PlusFifteen({ palette: p }: { palette: typeof PALETTE[TacticalToolId] }) {
  return (
    <div
      style={{
        position: "relative",
        width: 260,
        height: 200,
        display: "grid",
        placeItems: "center",
      }}
    >
      {/* Ambient glow */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: -20,
          borderRadius: "50%",
          background: `radial-gradient(closest-side, ${p.glow}, transparent 70%)`,
          filter: "blur(10px)",
        }}
      />
      {/* Hourglass — small accent */}
      <svg
        viewBox="0 0 80 100"
        width="80"
        height="100"
        style={{
          position: "absolute",
          left: 16,
          top: 32,
          opacity: 0.85,
          animation: "etHourFlip 1.2s cubic-bezier(.2,.8,.3,1) .3s forwards",
          transformOrigin: "40px 50px",
        }}
      >
        <defs>
          <linearGradient id="hg-et" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={p.hue1} />
            <stop offset="1" stopColor={p.hue2} />
          </linearGradient>
        </defs>
        <path
          d="M16 8 H64 V20 L44 50 L64 80 V92 H16 V80 L36 50 L16 20 Z"
          fill="oklch(0.98 0.02 80 / .15)"
          stroke="url(#hg-et)"
          strokeWidth="2.5"
        />
        <path d="M20 12 H60 L42 48 Z" fill={p.hue1} opacity=".6" />
        <path d="M22 88 H58 L40 56 Z" fill={p.hue1} opacity=".25" />
      </svg>
      {/* +15 big text */}
      <div
        style={{
          fontFamily: "var(--display)",
          fontWeight: 800,
          fontSize: 130,
          lineHeight: 1,
          color: "oklch(0.99 0.02 80)",
          textShadow: `0 6px 30px ${p.glow}, 0 0 50px ${p.glow}`,
          letterSpacing: "-.05em",
          position: "relative",
          transform: "translateX(20px)",
        }}
      >
        +15
        <span
          style={{
            fontFamily: "var(--mono, monospace)",
            fontWeight: 700,
            fontSize: 20,
            color: "oklch(0.95 0.04 80 / .8)",
            position: "absolute",
            right: -10,
            bottom: 18,
            letterSpacing: "-.02em",
          }}
        >
          s
        </span>
      </div>

      <style>{`
        @keyframes etHourFlip {
          0%   { transform: rotate(0deg) scale(1); }
          40%  { transform: rotate(180deg) scale(1.08); }
          100% { transform: rotate(180deg) scale(1); }
        }
      `}</style>
    </div>
  );
}

/* ── RippleRings — extra_time pulse rings ───────────────────── */
function RippleRings({ color }: { color: string }) {
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
      {[0, 0.25, 0.5].map((d, i) => (
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
            animation: `etRingPop 1.6s cubic-bezier(.2,.7,.3,1) ${0.25 + d}s forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes etRingPop {
          0%   { opacity: .8; transform: scale(.3); border-width: 3px; }
          100% { opacity: 0;  transform: scale(5);  border-width: .5px; }
        }
      `}</style>
    </div>
  );
}

/* ── CrackedClock — time_pressure motif ──────────────────────── */
function CrackedClock({ palette: p }: { palette: typeof PALETTE[TacticalToolId] }) {
  return (
    <div
      style={{
        position: "relative",
        width: 220,
        height: 220,
        animation: "clockShake .12s cubic-bezier(.5,1,.5,1) .55s 8",
      }}
    >
      {/* Outer glow ring */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: -20,
          borderRadius: "50%",
          background: `radial-gradient(closest-side, ${p.glow}, transparent 70%)`,
          filter: "blur(6px)",
        }}
      />
      {/* Clock SVG */}
      <svg viewBox="0 0 200 200" width="220" height="220" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="face-tp" cx="50%" cy="38%" r="60%">
            <stop offset="0" stopColor="oklch(0.96 0.05 30)" />
            <stop offset="1" stopColor="oklch(0.72 0.10 30)" />
          </radialGradient>
          <linearGradient id="ring-tp" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={p.hue1} />
            <stop offset="1" stopColor={p.hue2} />
          </linearGradient>
        </defs>
        {/* Outer bezel */}
        <circle cx="100" cy="100" r="92" fill="url(#ring-tp)" />
        <circle cx="100" cy="100" r="80" fill="url(#face-tp)" />
        {/* Tick marks */}
        {Array.from({ length: 12 }).map((_, i) => {
          const ang = (i * 30 - 90) * Math.PI / 180;
          const x1 = 100 + Math.cos(ang) * 70;
          const y1 = 100 + Math.sin(ang) * 70;
          const x2 = 100 + Math.cos(ang) * 76;
          const y2 = 100 + Math.sin(ang) * 76;
          return (
            <line
              key={i} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={p.ink}
              strokeWidth={i % 3 === 0 ? 3 : 1.5}
              strokeLinecap="round"
            />
          );
        })}
        {/* Cracks */}
        <g
          style={{
            opacity: 0,
            animation: "tpCrackIn .45s cubic-bezier(.2,1.6,.4,1) .55s forwards",
            transformOrigin: "100px 100px",
          }}
        >
          <path
            d="M100 100 L60 35 L72 50 L52 38 L44 60 L70 70 L42 92"
            stroke={p.ink} strokeWidth="1.8" fill="none"
            strokeLinecap="round" strokeLinejoin="round" opacity=".75"
          />
          <path
            d="M100 100 L150 60 L142 78 L168 70 L160 92 L138 88"
            stroke={p.ink} strokeWidth="1.4" fill="none"
            strokeLinecap="round" strokeLinejoin="round" opacity=".55"
          />
          <path
            d="M100 100 L130 158 L120 142 L138 152 L122 168"
            stroke={p.ink} strokeWidth="1.2" fill="none"
            strokeLinecap="round" strokeLinejoin="round" opacity=".5"
          />
        </g>
        {/* Minute hand — spins fast */}
        <g
          style={{
            transformOrigin: "100px 100px",
            animation: "tpHandSpin 1.1s cubic-bezier(.2,.7,.3,1) .2s forwards",
          }}
        >
          <line x1="100" y1="100" x2="100" y2="46" stroke={p.ink} strokeWidth="4" strokeLinecap="round" />
        </g>
        {/* Hour hand — spins slower */}
        <g
          style={{
            transformOrigin: "100px 100px",
            animation: "tpHandSpin2 1.1s cubic-bezier(.2,.7,.3,1) .2s forwards",
          }}
        >
          <line x1="100" y1="100" x2="100" y2="64" stroke={p.ink} strokeWidth="3" strokeLinecap="round" opacity=".7" />
        </g>
        <circle cx="100" cy="100" r="5" fill={p.ink} />
      </svg>
      {/* "10s" stamp */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
          opacity: 0,
          animation: "tpTenStamp .55s cubic-bezier(.2,1.5,.4,1) 1s forwards",
        }}
      >
        <div
          style={{
            fontFamily: "var(--mono, monospace)",
            fontWeight: 800,
            fontSize: 72,
            lineHeight: 1,
            color: "oklch(0.99 0.02 80)",
            textShadow: `0 4px 24px ${p.hue1}, 0 0 40px ${p.glow}`,
            letterSpacing: "-.04em",
          }}
        >
          10s
        </div>
      </div>

      <style>{`
        @keyframes clockShake {
          0%, 100% { transform: translate(0,0) rotate(0); }
          25%       { transform: translate(-2px, 1px) rotate(-.5deg); }
          75%       { transform: translate(2px, -1px) rotate(.5deg); }
        }
        @keyframes tpHandSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(900deg); }
        }
        @keyframes tpHandSpin2 {
          from { transform: rotate(0deg); }
          to   { transform: rotate(540deg); }
        }
        @keyframes tpCrackIn {
          from { opacity: 0; transform: scale(0.5); }
          to   { opacity: .8; transform: scale(1); }
        }
        @keyframes tpTenStamp {
          0%   { opacity: 0; transform: scale(2.4) rotate(-6deg); filter: blur(8px); }
          60%  { opacity: 1; transform: scale(.92) rotate(2deg); filter: blur(0); }
          100% { opacity: 1; transform: scale(1) rotate(0); }
        }
      `}</style>
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
    // extra_question uses the reference implementation: random sizes/distances
    // for organic sparkle motes — safe because this only ever runs client-side.
    if (toolId === "extra_question") {
      return Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * 360 + Math.random() * 20;
        const dist  = 120 + Math.random() * 120;
        const size  = 4   + Math.random() * 6;
        const delay = 0.25 + Math.random() * 0.5;
        const dur   = 1.0  + Math.random() * 0.6;
        const rot   = Math.random() * 360;
        return {
          size, delay, dur, rot,
          tx: Math.cos((angle * Math.PI) / 180) * dist,
          ty: Math.sin((angle * Math.PI) / 180) * dist,
        };
      });
    }
    // Other tools: deterministic generation
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
  }, [count, toolId]);

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
            background: toolId === "extra_question"
              ? `radial-gradient(circle, oklch(0.95 0.14 80), ${p.hue1})`
              : p.hue1,
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
