"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TACTICAL_EVENT_DISPLAY_MS } from "@/lib/game/match-progression";
import { TacticalToolIcon } from "@/components/game/play/TacticalToolIcons";
import { GP } from "@/components/game/play/tokens";
import type { TacticalToolId } from "@/lib/profile/tactical-tools";
import type { TacticalGameplayEvent } from "@/types";

/* ── Per-tool accent tokens ────────────────────────────────── */
const TOOL_ACCENT: Record<
  TacticalToolId,
  {
    ring: string;
    glow: string;
    iconBg: string;
    iconColor: string;
    /** Top accent bar color */
    bar: string;
    /** Background gradient on card */
    cardBg: string;
  }
> = {
  extra_time: {
    ring: "rgba(63,184,122,0.55)",
    glow: "rgba(63,184,122,0.22)",
    iconBg: "linear-gradient(145deg, #E8F6F0, #C8EBDC)",
    iconColor: GP.green,
    bar: GP.green,
    cardBg:
      "linear-gradient(155deg, rgba(255,255,255,0.99) 0%, rgba(240,252,246,0.98) 55%, rgba(220,248,236,0.96) 100%)",
  },
  time_pressure: {
    ring: "rgba(229,82,77,0.55)",
    glow: "rgba(229,82,77,0.22)",
    iconBg: "linear-gradient(145deg, #FFE8E6, #FFCFCB)",
    iconColor: GP.roseDeep,
    bar: GP.roseDeep,
    cardBg:
      "linear-gradient(155deg, rgba(255,255,255,0.99) 0%, rgba(255,245,244,0.98) 55%, rgba(255,232,230,0.96) 100%)",
  },
  extra_question: {
    ring: "rgba(242,181,68,0.60)",
    glow: "rgba(255,159,10,0.25)",
    iconBg: "linear-gradient(145deg, #FFF0D4, #FFD9A8)",
    iconColor: GP.orangeDeep,
    bar: GP.orangeDeep,
    cardBg:
      "linear-gradient(155deg, rgba(255,255,255,0.99) 0%, rgba(255,250,240,0.98) 55%, rgba(255,242,218,0.96) 100%)",
  },
  shield: {
    ring: "rgba(100,140,220,0.50)",
    glow: "rgba(100,140,220,0.18)",
    iconBg: "linear-gradient(145deg, #E8EEF8, #D0DCF0)",
    iconColor: "#4A6FA5",
    bar: "#4A6FA5",
    cardBg:
      "linear-gradient(155deg, rgba(255,255,255,0.99) 0%, rgba(244,247,255,0.98) 55%, rgba(230,238,255,0.96) 100%)",
  },
};

/* ── Per-tool effect overlays ───────────────────────────────── */

/** time_pressure: red tension wave that sweeps across the card */
function TimePressureEffect({ targeted }: { targeted: boolean }) {
  if (!targeted) return null;
  return (
    <>
      {/* Pulsing red vignette at card edges */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.55, 0.25, 0.55, 0.15] }}
        transition={{ duration: 1.6, ease: "easeInOut" }}
        style={{
          boxShadow: "inset 0 0 28px rgba(229,82,77,0.42)",
          borderRadius: "inherit",
        }}
      />
      {/* Horizontal tension wave */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-[200%] rounded-2xl"
        initial={{ x: "-100%", opacity: 0.7 }}
        animate={{ x: "100%", opacity: 0 }}
        transition={{ duration: 0.70, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(229,82,77,0.18) 35%, rgba(229,82,77,0.32) 50%, rgba(229,82,77,0.18) 65%, transparent 100%)",
        }}
      />
    </>
  );
}

/** extra_question: expansion reveal — duplicate icon expands outward */
function ExtraQuestionEffect({ isMine }: { isMine: boolean }) {
  if (!isMine) return null;
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute right-4 top-3.5 flex items-center gap-1"
      initial={{ opacity: 0, scale: 0.6, x: -8 }}
      animate={{ opacity: [0, 0.85, 0.60], scale: [0.6, 1.15, 1], x: [-8, 4, 0] }}
      transition={{ duration: 0.55, delay: 0.12, ease: [0.34, 1.2, 0.64, 1] }}
    >
      <span
        style={{
          fontSize: 18,
          background: "linear-gradient(145deg, #FFF0D4, #FFD9A8)",
          borderRadius: 10,
          padding: "3px 7px",
          boxShadow: "0 2px 10px rgba(255,159,10,0.30)",
          color: GP.orangeDeep,
          fontWeight: 900,
          lineHeight: 1,
        }}
      >
        +١
      </span>
    </motion.div>
  );
}

/** shield: aura rings that expand outward */
function ShieldEffect({ targeted }: { targeted: boolean }) {
  if (!targeted) return null;
  return (
    <>
      {[0, 1].map((i) => (
        <motion.div
          key={i}
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl"
          initial={{ opacity: 0.55, scale: 1 }}
          animate={{ opacity: 0, scale: 1.04 + i * 0.03 }}
          transition={{
            duration: 0.80,
            delay: i * 0.18,
            ease: "easeOut",
          }}
          style={{
            border: "1.5px solid rgba(100,140,220,0.55)",
            borderRadius: "inherit",
          }}
        />
      ))}
      {/* Reflective sheen sweep */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-[180%]"
        initial={{ x: "-110%", opacity: 0.80 }}
        animate={{ x: "90%", opacity: 0 }}
        transition={{ duration: 0.65, delay: 0.10, ease: [0.22, 1, 0.36, 1] }}
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(180,210,255,0.22) 40%, rgba(200,220,255,0.38) 50%, rgba(180,210,255,0.22) 60%, transparent 100%)",
        }}
      />
    </>
  );
}

/* ── Types ─────────────────────────────────────────────────── */
type Props = {
  event: TacticalGameplayEvent | null | undefined;
  myUid: string | null;
};

function isEventExpired(ev: TacticalGameplayEvent): boolean {
  const expMs = ev.expiresAt?.toMillis?.() ?? 0;
  if (expMs > 0) return Date.now() > expMs;
  const atMs = ev.at?.toMillis?.() ?? 0;
  if (atMs > 0) return Date.now() > atMs + TACTICAL_EVENT_DISPLAY_MS;
  return false;
}

/* ── Main banner ───────────────────────────────────────────── */
export function TacticalEventBanner({ event, myUid }: Props) {
  const [dismissedId, setDismissedId] = useState<string | null>(null);
  const hideTimerRef = useRef<number | null>(null);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const visible = useMemo(() => {
    if (!event?.id || dismissedId === event.id) return null;
    if (isEventExpired(event)) return null;
    return event;
  }, [event, dismissedId]);

  useEffect(() => {
    if (!visible?.id) {
      clearHideTimer();
      return;
    }
    clearHideTimer();
    const expMs = visible.expiresAt?.toMillis?.() ?? 0;
    const delay =
      expMs > 0 ? Math.max(400, expMs - Date.now()) : TACTICAL_EVENT_DISPLAY_MS;
    hideTimerRef.current = window.setTimeout(() => {
      setDismissedId(visible.id);
      hideTimerRef.current = null;
    }, delay);
    return () => clearHideTimer();
  }, [visible, clearHideTimer]);

  useEffect(() => () => clearHideTimer(), [clearHideTimer]);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key={visible.id}
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: -28, scale: 0.90 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 440, damping: 28 }}
          className="pointer-events-none absolute inset-x-0 top-3 z-50 flex justify-center px-3"
        >
          <BannerCard event={visible} myUid={myUid} />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/* ── Card ──────────────────────────────────────────────────── */
function BannerCard({
  event,
  myUid,
}: {
  event: TacticalGameplayEvent;
  myUid: string | null;
}) {
  const isMine = myUid != null && event.actorUid === myUid;
  const isTargeted = myUid != null && event.targetUid === myUid;
  const blocked = event.blocked === true;
  const accent = TOOL_ACCENT[event.toolId] ?? TOOL_ACCENT.extra_time;

  const headline = blocked
    ? isTargeted
      ? "صدّيت الهجوم!"
      : "تم صدّ أداتك"
    : isMine
      ? "فعّلت أداة تكتيكية"
      : isTargeted
        ? "الخصم يستهدفك"
        : "الخصم فعّل أداة";

  return (
    <motion.div
      className="relative w-full max-w-sm overflow-hidden rounded-2xl"
      style={{
        background: blocked
          ? "linear-gradient(155deg, rgba(255,255,255,0.99) 0%, rgba(240,252,246,0.98) 55%, rgba(220,248,236,0.96) 100%)"
          : accent.cardBg,
        boxShadow: `0 20px 48px rgba(80,45,20,0.18), inset 0 1px 0 rgba(255,255,255,0.95), inset 0 0 0 1.5px ${accent.ring}`,
      }}
    >
      {/* Top accent bar */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[2.5px]"
        style={{
          background: `linear-gradient(90deg, transparent, ${blocked ? GP.green : accent.bar}, transparent)`,
        }}
      />

      {/* Ambient glow blob — top right */}
      <motion.div
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-60"
        animate={{ scale: [1, 1.15, 1], opacity: [0.35, 0.55, 0.35] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        style={{ background: `radial-gradient(circle, ${accent.glow}, transparent 70%)` }}
      />

      {/* ── Per-tool overlay effects ── */}
      {!blocked && event.toolId === "time_pressure" && (
        <TimePressureEffect targeted={isTargeted} />
      )}
      {!blocked && event.toolId === "extra_question" && (
        <ExtraQuestionEffect isMine={isMine} />
      )}
      {!blocked && event.toolId === "shield" && (
        <ShieldEffect targeted={isTargeted} />
      )}

      {/* ── Ring pulse on targeted events ── */}
      {isTargeted && !blocked && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl"
          animate={{
            boxShadow: [
              `0 0 0 0 ${accent.ring}`,
              `0 0 0 8px transparent`,
              `0 0 0 0 ${accent.ring}`,
            ],
          }}
          transition={{ duration: 1.4, repeat: 2, ease: "easeOut" }}
          style={{ borderRadius: "inherit" }}
        />
      )}

      {/* ── Content row ── */}
      <motion.div
        className="relative flex flex-row items-start gap-3 px-4 py-3.5"
        dir="rtl"
        initial={{ opacity: 0, x: 14 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.04, duration: 0.26 }}
      >
        {/* Tool icon */}
        <motion.div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
          initial={{ rotate: blocked ? 0 : -10, scale: 0.80 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 520, damping: 20 }}
          style={{
            background: blocked
              ? "linear-gradient(145deg, #E8F6F0, #C8EBDC)"
              : accent.iconBg,
            color: blocked ? GP.green : accent.iconColor,
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.8), 0 4px 12px rgba(0,0,0,0.06)",
          }}
        >
          <TacticalToolIcon id={event.toolId} size={26} />
        </motion.div>

        {/* Text */}
        <motion.div className="min-w-0 flex-1 text-right">
          <p
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: blocked ? GP.green : accent.bar }}
          >
            {headline}
          </p>
          <p
            className="mt-0.5 text-sm font-black leading-snug"
            style={{ color: GP.ink }}
          >
            {event.titleAr}
          </p>
          <p
            className="mt-1 text-xs font-semibold leading-relaxed"
            style={{ color: GP.inkSoft }}
          >
            {event.bodyAr}
          </p>
          {event.actorName ? (
            <p
              className="mt-1.5 text-[10px] font-bold"
              style={{ color: GP.inkSoft }}
            >
              {event.actorName}
            </p>
          ) : null}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
