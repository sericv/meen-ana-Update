"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TACTICAL_EVENT_DISPLAY_MS } from "@/lib/game/match-progression";
import { TacticalToolIcon } from "@/components/game/play/TacticalToolIcons";
import { GP } from "@/components/game/play/tokens";
import type { TacticalToolId } from "@/lib/profile/tactical-tools";
import type { TacticalGameplayEvent } from "@/types";

const TOOL_ACCENT: Record<
  TacticalToolId,
  { ring: string; glow: string; iconBg: string; iconColor: string }
> = {
  extra_time: {
    ring: "rgba(63,184,122,0.55)",
    glow: "rgba(63,184,122,0.22)",
    iconBg: "linear-gradient(145deg, #E8F6F0, #C8EBDC)",
    iconColor: GP.green,
  },
  time_pressure: {
    ring: "rgba(229,82,77,0.5)",
    glow: "rgba(229,82,77,0.2)",
    iconBg: "linear-gradient(145deg, #FFE8E6, #FFCFCB)",
    iconColor: GP.roseDeep,
  },
  extra_question: {
    ring: "rgba(242,181,68,0.6)",
    glow: "rgba(255,159,10,0.25)",
    iconBg: "linear-gradient(145deg, #FFF0D4, #FFD9A8)",
    iconColor: GP.orangeDeep,
  },
  shield: {
    ring: "rgba(100,140,220,0.5)",
    glow: "rgba(100,140,220,0.18)",
    iconBg: "linear-gradient(145deg, #E8EEF8, #D0DCF0)",
    iconColor: "#4A6FA5",
  },
};

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
          initial={{ opacity: 0, y: -24, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -14, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 420, damping: 30 }}
          className="pointer-events-none absolute inset-x-0 top-3 z-50 flex justify-center px-3"
        >
          <BannerCard event={visible} myUid={myUid} />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

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
      animate={
        isTargeted && !blocked
          ? { boxShadow: [`0 0 0 0 ${accent.glow}`, `0 0 0 12px transparent`] }
          : undefined
      }
      transition={{ duration: 1.2, repeat: 2, ease: "easeOut" }}
      style={{
        background:
          "linear-gradient(155deg, rgba(255,255,255,0.99) 0%, rgba(255,246,232,0.98) 55%, rgba(255,236,210,0.96) 100%)",
        boxShadow: `0 20px 48px rgba(80,45,20,0.18), inset 0 1px 0 rgba(255,255,255,0.95), inset 0 0 0 2px ${accent.ring}`,
      }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1"
        style={{ background: `linear-gradient(90deg, transparent, ${accent.iconColor}, transparent)` }}
      />
      <motion.div
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-60"
        animate={{ scale: [1, 1.15, 1], opacity: [0.35, 0.55, 0.35] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        style={{ background: `radial-gradient(circle, ${accent.glow}, transparent 70%)` }}
      />

      <motion.div
        className="relative flex flex-row items-start gap-3 px-4 py-3.5"
        dir="rtl"
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.05, duration: 0.28 }}
      >
        <motion.div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
          initial={{ rotate: -8, scale: 0.85 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 22 }}
          style={{
            background: blocked ? "linear-gradient(145deg, #E8F6F0, #C8EBDC)" : accent.iconBg,
            color: blocked ? GP.green : accent.iconColor,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8), 0 4px 12px rgba(0,0,0,0.06)",
          }}
        >
          <TacticalToolIcon id={event.toolId} size={26} />
        </motion.div>

        <motion.div className="min-w-0 flex-1 text-right">
          <p
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: blocked ? GP.green : accent.iconColor }}
          >
            {headline}
          </p>
          <p className="mt-0.5 text-sm font-black leading-snug" style={{ color: GP.ink }}>
            {event.titleAr}
          </p>
          <p className="mt-1 text-xs font-semibold leading-relaxed" style={{ color: GP.inkSoft }}>
            {event.bodyAr}
          </p>
          {event.actorName ? (
            <p className="mt-1.5 text-[10px] font-bold" style={{ color: GP.inkSoft }}>
              {event.actorName}
            </p>
          ) : null}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
