"use client";

import { motion, useMotionValueEvent, useSpring, useMotionValue } from "framer-motion";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { ConfettiBurst } from "@/components/game/ConfettiBurst";
import { useLiveUserProfile } from "@/hooks/useLiveUserProfile";
import { postGame } from "@/lib/api/game-client";
import { XP_PER_LOSS, XP_PER_WIN, xpProgressInCurrentLevel } from "@/lib/profile/level";
import { getCategoryById } from "@/lib/game/categories";
import { EASE_OUT, SPRING_UI, EXIT, WHILE_TAP } from "@/lib/motion";
import type { PlayerCosmetic } from "@/lib/profile/cosmetics";
import type { AwardMatchRewardsResult } from "@/lib/game/match-rewards";
import type { ChatMessage, GameCard } from "@/types";
import type { XpBreakdown } from "@/lib/profile/level";

const C = {
  purple: "#8B5CF6",
  purpleSoft: "#DDD6FE",
  purpleLight: "#F5F3FF",
  coral: "#FB7185",
  coralSoft: "#FECDD3",
  peach: "#FDE68A",
  golden: "#FBBF24",
  pearl: "#FFFDF9",
  ink: "#374151",
  inkSoft: "#9CA3AF",
  white: "#FFFFFF",
  bg: "#FCFCFA",
} as const;

/* ─── Helpers ─────────────────────────────────────────── */

function useRevealedCards(roomId: string, myUid: string) {
  const [myCard, setMyCard] = useState<GameCard | null>(null);
  const [oppCard, setOppCard] = useState<GameCard | null>(null);
  const clearedRef = useRef(false);
  useEffect(() => {
    if (!roomId || !myUid) { clearedRef.current = true; return; }
    clearedRef.current = false;
    let cancelled = false;
    let attempts = 0;
    const tick = async () => {
      if (cancelled) return;
      attempts += 1;
      try {
        const res = await postGame("/api/game/reveal-cards", { roomId });
        const data = res as {
          ok?: boolean;
          myCard?: { cardId: string; name: string; nameAr: string; imageUrl: string; categoryId: string } | null;
          opponentCard?: { cardId: string; name: string; nameAr: string; imageUrl: string; categoryId: string } | null;
        };
        if (cancelled) return;
        const mapCard = (c: NonNullable<typeof data.myCard>): GameCard => ({
          id: String(c.cardId ?? ""),
          name: String(c.name ?? ""),
          nameAr: String(c.nameAr ?? ""),
          imageUrl: String(c.imageUrl ?? ""),
          categoryId: String(c.categoryId ?? ""),
          tags: [],
        });
        if (data.myCard) setMyCard(mapCard(data.myCard));
        if (data.opponentCard) setOppCard(mapCard(data.opponentCard));
      } catch {
        if (!cancelled && attempts < 5) setTimeout(() => void tick(), 400 * attempts);
      }
    };
    void tick();
    return () => { cancelled = true; };
  }, [roomId, myUid]);
  useEffect(() => {
    if (clearedRef.current) { setMyCard(null); setOppCard(null); clearedRef.current = false; }
  }, [roomId, myUid]);
  return { myCard, opponentCard: oppCard };
}

function formatDuration(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/* ─── Animated Counter ────────────────────────────────── */

function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 80, damping: 18 });
  useMotionValueEvent(spring, "change", (v) => {
    if (ref.current) ref.current.textContent = `${Math.floor(v)}${suffix}`;
  });
  useEffect(() => { mv.set(value); }, [mv, value]);
  return <span ref={ref} className="font-black tabular-nums" style={{ fontFamily: "var(--display)", letterSpacing: "-0.02em" }}>0{suffix}</span>;
}

/* ─── SVG Icons ───────────────────────────────────────── */

function TrophyIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden>
      <path d="M14 10h20v12c0 5.5-4.5 10-10 10s-10-4.5-10-10V10z" fill="#FDE68A" stroke="#FBBF24" strokeWidth="1.5" />
      <path d="M14 10H8c-1.5 0-2.5 1-2.5 2.5v2c0 2.5 2 5 4.5 5.5L14 20" fill="#FEF3C7" stroke="#FBBF24" strokeWidth="1.2" />
      <path d="M34 10h6c1.5 0 2.5 1 2.5 2.5v2c0 2.5-2 5-4.5 5.5L34 20" fill="#FEF3C7" stroke="#FBBF24" strokeWidth="1.2" />
      <rect x="20" y="32" width="8" height="6" rx="1" fill="#DDD6FE" stroke="#C4B5FD" strokeWidth="1" />
      <path d="M18 38h12v2.5a0.5 0.5 0 0 1-0.5 0.5h-11a0.5 0.5 0 0 1-0.5-0.5V38z" fill="#C4B5FD" />
      <path d="M24 36v4" stroke="#8B5CF6" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="24" cy="10" r="2" fill="#FBBF24" />
    </svg>
  );
}

function StarIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 2l2.4 5.8 6.2.5-4.7 4 1.4 6.1L12 15.8 7.7 18.4l1.4-6.1-4.7-4 6.2-.5L12 2z" fill="currentColor" />
    </svg>
  );
}

function SparkleIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 4l1 3h4l-3 2 1 4-3-2-3 2 1-4-3-2h4z" fill="currentColor" />
    </svg>
  );
}

function CoinIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" fill="#FDE68A" stroke="#FBBF24" strokeWidth="1.2" />
      <circle cx="12" cy="12" r="8" fill="#FEF3C7" />
      <circle cx="12" cy="12" r="5" fill="#FBBF24" opacity="0.3" />
      <ellipse cx="10" cy="9" rx="2.5" ry="1.2" fill="white" opacity="0.5" transform="rotate(-15 10 9)" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke={C.purple} strokeWidth="1.5" />
      <path d="M12 7.5V12l3 3" stroke={C.purple} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function QuestionIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke={C.purple} strokeWidth="1.5" />
      <path d="M10 9.5c0-1 1-2 2-2s2 0.8 2 2c0 1.5-2 2-2 3.5v1" stroke={C.purple} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="17" r="0.8" fill={C.purple} />
    </svg>
  );
}

function ToolsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a1 1 0 0 0 0-1.4l-1.6-1.6a1 1 0 0 0-1.4 0l-3.8 3.8z" stroke={C.purple} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9 8L3 15v3h3l7-6" stroke={C.purple} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" stroke={C.purple} strokeWidth="1.5" />
      <path d="M3 16l5-5 4 4 3-3 6 6" stroke={C.purple} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Premium Shell ───────────────────────────────────── */

function PremiumShell({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: EASE_OUT, delay }}
      className={className}
      style={{
        borderRadius: 20,
        background: C.white,
        boxShadow: "0 2px 8px rgba(139, 92, 246, 0.06), 0 8px 32px -6px rgba(139, 92, 246, 0.08), inset 0 1px 0 rgba(255,255,255,0.95)",
        padding: 16,
      }}
    >
      {children}
    </motion.div>
  );
}

/* ─── Stat Card ───────────────────────────────────────── */

function StatCard({ icon, value, label, delay = 0 }: { icon: React.ReactNode; value: string; label: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: EASE_OUT, delay }}
      className="flex flex-col items-center gap-2"
      style={{
        borderRadius: 16,
        background: C.purpleLight,
        padding: "14px 10px",
      }}
    >
      <div style={{ color: C.purple, opacity: 0.8 }}>{icon}</div>
      <span className="font-black leading-none" style={{ fontSize: 22, color: C.ink, fontFamily: "var(--display)", fontVariantNumeric: "tabular-nums" }}>
        {value}
      </span>
      <span className="font-bold leading-tight" style={{ fontSize: 10, color: C.inkSoft, fontFamily: "var(--display)" }}>
        {label}
      </span>
    </motion.div>
  );
}

/* ─── Premium XP Bar ──────────────────────────────────── */

function XpBar({ pct, level, xpInLevel, xpToNext, leveledUp, delay = 0 }: {
  pct: number;
  level: number;
  xpInLevel: number;
  xpToNext: number;
  leveledUp: boolean;
  delay?: number;
}) {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), (delay + 0.3) * 1000); return () => clearTimeout(t); }, [delay]);

  return (
    <PremiumShell delay={delay}>
      <div className="flex items-center gap-3">
        {/* Level badge */}
        <motion.div
          initial={{ scale: 0 }}
          animate={show ? { scale: 1 } : {}}
          transition={{ type: "spring", stiffness: 380, damping: 22, delay: delay + 0.5 }}
          className="flex shrink-0 items-center justify-center rounded-full font-black leading-none"
          style={{
            width: 48,
            height: 48,
            background: leveledUp
              ? "linear-gradient(135deg, #FDE68A 0%, #FBBF24 100%)"
              : `linear-gradient(135deg, ${C.purpleLight} 0%, ${C.purpleSoft} 100%)`,
            color: leveledUp ? "#92400E" : C.purple,
            fontSize: 16,
            fontFamily: "var(--display)",
            boxShadow: leveledUp ? "0 0 20px rgba(251,191,36,0.5)" : "none",
          }}
        >
          {level}
        </motion.div>

        {/* XP info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-black leading-none" style={{ fontSize: 12, color: C.ink, fontFamily: "var(--display)" }}>
              المستوى {level}
            </span>
            <span className="font-bold tabular-nums leading-none" style={{ fontSize: 10, color: C.inkSoft, fontFamily: "var(--display)" }}>
              {xpInLevel} / {xpToNext} XP
            </span>
          </div>

          {/* Bar track */}
          <div style={{
            position: "relative",
            height: 8,
            borderRadius: 999,
            overflow: "hidden",
            background: C.purpleLight,
          }}>
            {/* Animated fill */}
            <motion.div
              initial={{ width: "0%" }}
              animate={show ? { width: `${Math.min(100, Math.max(0, pct))}%` } : {}}
              transition={{ duration: 1.2, ease: EASE_OUT, delay: delay + 0.35 }}
              style={{
                height: "100%",
                borderRadius: 999,
                background: `linear-gradient(90deg, ${C.purple} 0%, ${C.coral} 100%)`,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.4), 0 0 12px ${C.purple}55`,
              }}
            />
          </div>
        </div>
      </div>
    </PremiumShell>
  );
}

/* ─── Type ────────────────────────────────────────────── */

export type MatchResultScreenProps = {
  roomId: string;
  matchId: string | null;
  myUid: string;
  iWon: boolean;
  winnerUid: string | null;
  forfeitWin: boolean;
  guessLimitWin?: boolean;
  myName: string;
  opponentName: string;
  opponentCosmetic?: PlayerCosmetic | null;
  myPhotoURL?: string | null;
  opponentCard: GameCard | null;
  messages: ChatMessage[];
  toolsUsed?: number;
  matchStartedAtMs?: number | null;
  matchEndedAtMs?: number | null;
  replayBusy?: boolean;
  onReplay: () => void;
  onHome: () => void;
};

/* ════════════════════════════════════════════════════════
   Main Screen
   ════════════════════════════════════════════════════════ */

export function MatchResultScreen({
  roomId,
  matchId,
  myUid,
  iWon,
  forfeitWin,
  guessLimitWin = false,
  myName,
  opponentName,
  opponentCosmetic: _opponentCosmetic,
  myPhotoURL,
  opponentCard,
  messages,
  toolsUsed = 0,
  matchStartedAtMs,
  matchEndedAtMs,
  replayBusy = false,
  onReplay,
  onHome,
}: MatchResultScreenProps) {
  const { myCard, opponentCard: revealedOpponentCard } = useRevealedCards(roomId, myUid);
  const effectiveOpponentCard = revealedOpponentCard ?? opponentCard;
  const liveProfile = useLiveUserProfile(myUid);

  const myTitle  = myCard?.nameAr  || myCard?.name  || "—";
  const oppTitle = effectiveOpponentCard?.nameAr || effectiveOpponentCard?.name || opponentName || "—";
  const myCategory  = myCard?.categoryId  ? (getCategoryById(myCard.categoryId)?.nameAr  ?? myCard.categoryId) : null;
  const oppCategory = effectiveOpponentCard?.categoryId ? (getCategoryById(effectiveOpponentCard.categoryId)?.nameAr ?? effectiveOpponentCard.categoryId) : null;

  const [show, setShow] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [rewards, setRewards] = useState<AwardMatchRewardsResult | null>(null);

  useEffect(() => { const t = setTimeout(() => setShow(true), 80); return () => clearTimeout(t); }, []);

  useEffect(() => {
    if (!iWon) return;
    const t = setTimeout(() => setShowConfetti(true), 240);
    return () => clearTimeout(t);
  }, [iWon]);

  useEffect(() => {
    if (!myUid || !matchId) return;
    if (typeof window === "undefined") return;
    const key = `meenana-match-award:${matchId}:${myUid}`;
    const state = window.sessionStorage.getItem(key);
    if (state === "pending") return;
    window.sessionStorage.setItem(key, "pending");
    let cancelled = false;
    void (async () => {
      try {
        const res = await postGame("/api/game/rewards", { matchId });
        if (cancelled) return;
        setRewards(res as unknown as AwardMatchRewardsResult);
        window.sessionStorage.setItem(key, "1");
      } catch {
        if (!cancelled) window.sessionStorage.removeItem(key);
      }
    })();
    return () => { cancelled = true; };
  }, [myUid, matchId]);

  const durationLabel = useMemo(() => {
    if (matchStartedAtMs && matchEndedAtMs && matchEndedAtMs > matchStartedAtMs) {
      return formatDuration(matchEndedAtMs - matchStartedAtMs);
    }
    return "—";
  }, [matchStartedAtMs, matchEndedAtMs]);

  const questionCount = useMemo(
    () => messages.filter((m) => m.type === "question").length,
    [messages],
  );

  const xp = liveProfile?.progress.xp ?? 0;
  const xpForLevel = liveProfile?.progress.lifetimeXp ?? xp;
  const { level, xpInLevel, xpToNext, pct: levelPct } = xpProgressInCurrentLevel(xpForLevel);

  const headline = iWon ? "فزت!" : "خسارة";
  const subline = iWon
    ? forfeitWin ? "فوز بانسحاب الخصم" : "أحسنت · فوز مستحق"
    : guessLimitWin ? "استنفدت المحاولات" : "في المرة القادمة";

  const coinReward  = rewards?.coinsAwarded ?? (iWon ? 1 : 0);
  const xpReward    = rewards?.xpAwarded   ?? (iWon ? XP_PER_WIN : XP_PER_LOSS);
  const xpBreakdown: XpBreakdown | null = rewards?.xpBreakdown ?? null;
  const leveledUp   = rewards?.leveledUp ?? false;
  const levelAfter  = rewards?.levelAfter ?? level;
  const shortRoom   = roomId ? roomId.slice(-4).toUpperCase() : "—";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={EXIT}
      dir="rtl"
      className="absolute inset-0 z-50 flex min-h-0 w-full flex-col overflow-hidden"
      style={{ background: C.bg }}
    >
      {/* Confetti */}
      {iWon && showConfetti ? <ConfettiBurst active /> : null}

      {/* Decorative background elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden select-none" aria-hidden>
        <div className="absolute" style={{ top: "5%", left: "8%", width: 120, height: 120, borderRadius: "50%", background: `radial-gradient(circle, ${C.purpleSoft}22, transparent 70%)` }} />
        <div className="absolute" style={{ top: "30%", right: "5%", width: 80, height: 80, borderRadius: "50%", background: `radial-gradient(circle, ${C.coralSoft}22, transparent 70%)` }} />
        <div className="absolute" style={{ bottom: "20%", left: "15%", width: 100, height: 100, borderRadius: "50%", background: `radial-gradient(circle, ${C.peach}33, transparent 70%)` }} />

        <motion.span className="absolute" style={{ top: "12%", right: "12%", color: C.purpleSoft, fontSize: 16 }} animate={{ y: [0, -8, 0], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
          ✦
        </motion.span>
        <motion.span className="absolute" style={{ top: "20%", left: "10%", color: C.coralSoft, fontSize: 12 }} animate={{ y: [0, -6, 0], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}>
          ✦
        </motion.span>
        <motion.span className="absolute" style={{ top: "45%", right: "8%", color: C.peach, fontSize: 14 }} animate={{ y: [0, -10, 0], opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}>
          ✦
        </motion.span>
        <motion.span className="absolute" style={{ top: "60%", left: "6%", color: C.purpleSoft, fontSize: 10 }} animate={{ y: [0, -7, 0], opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}>
          ❓
        </motion.span>
        <motion.span className="absolute" style={{ bottom: "35%", right: "10%", color: C.coralSoft, fontSize: 11 }} animate={{ y: [0, -5, 0], opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}>
          ❓
        </motion.span>
        <motion.span className="absolute" style={{ top: "8%", left: "20%", color: C.purpleSoft, fontSize: 8 }} animate={{ y: [0, -4, 0], opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}>
          ⭐
        </motion.span>
      </div>

      {/* ── Header ── */}
      <header
        className="relative z-10 flex shrink-0 items-center justify-between px-4 pb-1"
        style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}
      >
        <motion.button
          type="button"
          onClick={onHome}
          whileTap={WHILE_TAP}
          transition={SPRING_UI}
          className="flex items-center justify-center rounded-xl"
          style={{
            width: 36,
            height: 36,
            background: C.white,
            boxShadow: "0 1px 4px rgba(139,92,246,0.06), 0 2px 8px rgba(0,0,0,0.03)",
            cursor: "pointer",
          }}
          aria-label="إغلاق"
        >
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden>
            <path d="M4 4l10 10M14 4L4 14" stroke={C.ink} strokeWidth="2" strokeLinecap="round" />
          </svg>
        </motion.button>

        <span
          className="inline-flex items-center gap-1.5 rounded-full font-black leading-none select-none"
          style={{
            padding: "5px 12px",
            fontSize: 10,
            fontFamily: "var(--display)",
            background: C.purpleLight,
            color: C.purple,
          }}
        >
          <SparkleIcon size={10} />
          #{shortRoom}
        </span>

        <span style={{ width: 36 }} aria-hidden />
      </header>

      {/* ── Scrollable body ── */}
      <div className="relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-contain px-[18px] pb-2">

        {/* ── Celebration Hero ── */}
        <div className="flex flex-col items-center pt-2 pb-1 text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={show ? { scale: 1, opacity: 1 } : {}}
            transition={{ type: "spring", stiffness: 380, damping: 26, delay: 0.04 }}
            className="relative"
          >
            {/* Trophy */}
            {iWon && (
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="mb-2"
              >
                <TrophyIcon />
              </motion.div>
            )}

            <h1
              className="font-black leading-none"
              style={{
                fontSize: "clamp(2.8rem, 13vw, 4rem)",
                fontFamily: "var(--display)",
                background: iWon
                  ? `linear-gradient(180deg, ${C.coral} 0%, ${C.purple} 100%)`
                  : "linear-gradient(180deg, #9CA3AF 0%, #6B7280 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: iWon
                  ? "drop-shadow(0 3px 12px rgba(139,92,246,0.35))"
                  : "none",
              }}
            >
              {headline}
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={show ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.35, delay: 0.2 }}
            className="font-bold"
            style={{ marginTop: 4, fontSize: 13, color: C.inkSoft, fontFamily: "var(--display)" }}
          >
            {subline}
          </motion.p>
        </div>

        {/* ── Winner Profile Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={show ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.45, ease: EASE_OUT, delay: 0.15 }}
          className="flex flex-col items-center gap-3 mb-4"
          style={{
            borderRadius: 24,
            background: C.white,
            padding: "20px 24px",
            boxShadow: "0 2px 8px rgba(139,92,246,0.06), 0 12px 40px -8px rgba(139,92,246,0.12), inset 0 1px 0 rgba(255,255,255,0.95)",
          }}
        >
          {/* Avatar with decorative frame */}
          <div className="relative" style={{ width: 72, height: 72 }}>
            {/* Decorative ring */}
            <svg
              width="88"
              height="88"
              viewBox="0 0 88 88"
              className="absolute -left-2 -top-2"
              aria-hidden
            >
              <defs>
                <linearGradient id="winnerFrame" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={C.purple} />
                  <stop offset="50%" stopColor={C.coral} />
                  <stop offset="100%" stopColor={C.peach} />
                </linearGradient>
              </defs>
              <circle cx="44" cy="44" r="42" fill="none" stroke="url(#winnerFrame)" strokeWidth="3" strokeDasharray="8 4" />
            </svg>

            {/* Avatar */}
            <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full" style={{
              background: "linear-gradient(135deg, #F5F3FF, #EDE9FE)",
              boxShadow: "inset 0 2px 0 rgba(255,255,255,0.45), 0 0 0 2px rgba(139,92,246,0.15)",
            }}>
              {myPhotoURL ? (
                <Image src={myPhotoURL} alt="" fill className="object-cover" sizes="72px" unoptimized />
              ) : (
                <span className="text-2xl">👤</span>
              )}
            </div>

            {/* Winner badge */}
            {iWon && (
              <motion.div
                initial={{ scale: 0 }}
                animate={show ? { scale: 1 } : {}}
                transition={{ type: "spring", stiffness: 420, damping: 22, delay: 0.45 }}
                className="absolute -bottom-1 -right-1 flex items-center justify-center rounded-full"
                style={{
                  width: 26,
                  height: 26,
                  background: `linear-gradient(135deg, ${C.peach}, ${C.golden})`,
                  boxShadow: "0 2px 8px rgba(251,191,36,0.4), 0 0 0 2px white",
                  color: "#92400E",
                  fontSize: 12,
                }}
              >
                <StarIcon size={14} />
              </motion.div>
            )}
          </div>

          {/* Name + Level */}
          <div className="text-center">
            <span className="font-black leading-tight" style={{ fontSize: 16, color: C.ink, fontFamily: "var(--display)" }}>
              {myName}
            </span>
            <div className="flex items-center justify-center gap-1.5 mt-0.5">
              <span className="font-bold leading-none" style={{ fontSize: 11, color: C.inkSoft, fontFamily: "var(--display)" }}>
                المستوى {levelAfter}
              </span>
              <div style={{ width: 3, height: 3, borderRadius: "50%", background: C.purpleSoft }} />
              <span
                className="inline-flex items-center gap-0.5 rounded-full font-black leading-none"
                style={{
                  padding: "2px 8px",
                  fontSize: 9,
                  fontFamily: "var(--display)",
                  background: iWon ? `linear-gradient(135deg, ${C.purpleLight}, ${C.purpleSoft})` : C.purpleLight,
                  color: C.purple,
                }}
              >
                <StarIcon size={8} />
                {iWon ? "فائز" : "خاسر"}
              </span>
            </div>
          </div>
        </motion.div>

        {/* ── Match Stats ── */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          <StatCard icon={<QuestionIcon />} value={String(questionCount)} label="الأسئلة" delay={0.2} />
          <StatCard icon={<ToolsIcon />} value={String(toolsUsed)} label="الأدوات" delay={0.28} />
          <StatCard icon={<ClockIcon />} value={durationLabel} label="المدة" delay={0.36} />
        </div>

        {/* ── Rewards ── */}
        <PremiumShell delay={0.3}>
          <h2 className="font-black mb-3" style={{ fontSize: 14, color: C.ink, fontFamily: "var(--display)" }}>
            المكافآت
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {/* Coin reward */}
            <div className="flex items-center gap-3 rounded-2xl p-3.5" style={{
              background: `linear-gradient(160deg, ${C.peach}33, ${C.peach}88)`,
            }}>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{
                background: `linear-gradient(135deg, ${C.peach}, ${C.golden})`,
                boxShadow: "0 4px 12px rgba(251,191,36,0.3)",
              }}>
                <CoinIcon size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-bold leading-tight" style={{ fontSize: 10, color: C.inkSoft, fontFamily: "var(--display)" }}>
                  عملات
                </span>
                <div className="font-black leading-tight" style={{ fontSize: 20, color: "#92400E", fontFamily: "var(--display)" }}>
                  {show ? <AnimatedNumber value={coinReward} /> : `+${coinReward}`}
                </div>
              </div>
            </div>

            {/* XP reward */}
            <div className="flex items-center gap-3 rounded-2xl p-3.5" style={{
              background: `linear-gradient(160deg, ${C.purpleLight}, ${C.purpleSoft}66)`,
            }}>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{
                background: `linear-gradient(135deg, ${C.purple}, ${C.coral})`,
                boxShadow: `0 4px 12px ${C.purple}44`,
                color: C.white,
              }}>
                <StarIcon size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-bold leading-tight" style={{ fontSize: 10, color: C.inkSoft, fontFamily: "var(--display)" }}>
                  خبرة
                </span>
                <div className="font-black leading-tight" style={{ fontSize: 20, color: C.purple, fontFamily: "var(--display)" }}>
                  {show ? <AnimatedNumber value={xpReward} /> : `+${xpReward}`}
                </div>
              </div>
            </div>
          </div>

          {/* Bonus label */}
          {rewards?.bonusLabelAr && coinReward > 0 && (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.3 }}
              className="mt-2 text-center font-bold leading-tight rounded-xl"
              style={{
                padding: "6px 12px",
                fontSize: 11,
                fontFamily: "var(--display)",
                background: `linear-gradient(135deg, ${C.peach}44, ${C.peach}88)`,
                color: "#92400E",
              }}
            >
              {rewards.bonusLabelAr}
            </motion.p>
          )}

          {/* XP breakdown pills */}
          {xpBreakdown && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55 }}
              className="flex flex-wrap gap-2 mt-2.5"
            >
              {[
                { label: "أساسي", value: `+${xpBreakdown.base}`, color: C.purple },
                ...(xpBreakdown.fastWinBonus > 0 ? [{ label: "فوز سريع", value: `+${xpBreakdown.fastWinBonus}`, color: C.golden }] : []),
                ...(xpBreakdown.toolBonus > 0 ? [{ label: "أدوات", value: `+${xpBreakdown.toolBonus}`, color: C.coral }] : []),
                ...(xpBreakdown.longMatchBonus > 0 ? [{ label: "مثابرة", value: `+${xpBreakdown.longMatchBonus}`, color: "#60A5FA" }] : []),
              ].map((pill) => (
                <span
                  key={pill.label}
                  className="inline-flex items-center gap-1 rounded-full font-bold leading-none"
                  style={{
                    padding: "3px 10px",
                    fontSize: 10,
                    fontFamily: "var(--display)",
                    background: `${pill.color}15`,
                    border: `1px solid ${pill.color}30`,
                    color: pill.color,
                  }}
                >
                  {pill.label}
                  <span className="font-black">{pill.value} XP</span>
                </span>
              ))}
            </motion.div>
          )}
        </PremiumShell>

        {/* ── XP Progress ── */}
        <div className="mt-3 mb-4">
          <XpBar
            pct={levelPct}
            level={levelAfter}
            xpInLevel={xpInLevel}
            xpToNext={xpToNext}
            leveledUp={leveledUp}
            delay={0.45}
          />
        </div>

        {/* ── Level-up celebration ── */}
        {leveledUp && (
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 22, delay: 0.7 }}
            className="flex items-center gap-3 mb-4 rounded-2xl"
            style={{
              padding: "14px 18px",
              background: `linear-gradient(135deg, ${C.peach}66, ${C.golden}44)`,
              border: `1px solid ${C.peach}`,
              boxShadow: "0 4px 16px rgba(251,191,36,0.15)",
            }}
          >
            <motion.div
              animate={{ scale: [1, 1.08, 1], rotate: [0, -5, 5, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              className="flex shrink-0 items-center justify-center rounded-full"
              style={{
                width: 44,
                height: 44,
                background: `linear-gradient(135deg, ${C.peach}, ${C.golden})`,
                color: "#92400E",
                fontSize: 18,
                fontFamily: "var(--display)",
                fontWeight: 900,
              }}
            >
              {levelAfter}
            </motion.div>
            <div>
              <span className="font-black leading-tight" style={{ fontSize: 12, color: "#92400E", fontFamily: "var(--display)" }}>
                ارتقيت إلى المستوى {levelAfter}! 🎉
              </span>
              <span className="font-bold leading-tight block" style={{ fontSize: 10, color: "#A16207", fontFamily: "var(--display)" }}>
                مبروك — واصل التألق!
              </span>
            </div>
          </motion.div>
        )}

        {/* ── Match Summary ── */}
        <PremiumShell delay={0.5}>
          <h2 className="font-black mb-3" style={{ fontSize: 14, color: C.ink, fontFamily: "var(--display)" }}>
            بطاقات المباراة
          </h2>

          <div className="grid grid-cols-2 gap-2.5">
            {/* My card */}
            <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.purpleSoft}66` }}>
              <div className="relative h-20 w-full" style={{ background: `linear-gradient(180deg, ${C.purpleLight}, ${C.purpleSoft}44)` }}>
                {myCard?.imageUrl ? (
                  <div className="absolute inset-0 flex items-center justify-center p-3">
                    <div className="relative w-full h-full">
                      <Image src={myCard.imageUrl} alt="" fill className="object-contain" sizes="100px" unoptimized />
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <CardIcon />
                  </div>
                )}
              </div>
              <div className="px-3 py-2 text-center" style={{ background: C.purpleLight }}>
                <span className="font-black leading-tight block truncate" style={{ fontSize: 11, color: C.ink, fontFamily: "var(--display)" }}>
                  {myTitle}
                </span>
                {myCategory && (
                  <span className="font-bold leading-tight block" style={{ fontSize: 8, color: C.inkSoft, fontFamily: "var(--display)" }}>
                    {myCategory}
                  </span>
                )}
                <span className="inline-block rounded-full font-bold leading-none mt-1" style={{ padding: "1.5px 8px", fontSize: 8, fontFamily: "var(--display)", background: `${C.purple}15`, color: C.purple }}>
                  كرتي
                </span>
              </div>
            </div>

            {/* Opponent card */}
            <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.coralSoft}66` }}>
              <div className="relative h-20 w-full" style={{ background: `linear-gradient(180deg, ${C.coralSoft}44, ${C.peach}44)` }}>
                {effectiveOpponentCard?.imageUrl ? (
                  <div className="absolute inset-0 flex items-center justify-center p-3">
                    <div className="relative w-full h-full">
                      <Image src={effectiveOpponentCard.imageUrl} alt="" fill className="object-contain" sizes="100px" unoptimized />
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full w-full items-center justify-center" style={{ color: C.coralSoft }}>
                    <CardIcon />
                  </div>
                )}
              </div>
              <div className="px-3 py-2 text-center" style={{ background: `${C.coralSoft}33` }}>
                <span className="font-black leading-tight block truncate" style={{ fontSize: 11, color: C.ink, fontFamily: "var(--display)" }}>
                  {oppTitle}
                </span>
                {oppCategory && (
                  <span className="font-bold leading-tight block" style={{ fontSize: 8, color: C.inkSoft, fontFamily: "var(--display)" }}>
                    {oppCategory}
                  </span>
                )}
                <span className="inline-block rounded-full font-bold leading-none mt-1" style={{ padding: "1.5px 8px", fontSize: 8, fontFamily: "var(--display)", background: `${C.coral}15`, color: C.coral }}>
                  الخصم
                </span>
              </div>
            </div>
          </div>
        </PremiumShell>

        <div style={{ height: 8 }} />
      </div>

      {/* ── Footer ── */}
      <footer
        className="relative z-10 flex shrink-0 gap-2.5 px-4 pt-3"
        style={{
          paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
          background: `linear-gradient(180deg, transparent, ${C.bg} 40%)`,
        }}
      >
        <motion.button
          type="button"
          onClick={onHome}
          whileTap={WHILE_TAP}
          transition={SPRING_UI}
          className="flex-1 rounded-2xl font-black leading-none"
          style={{
            padding: "14px 0",
            fontSize: 14,
            fontFamily: "var(--display)",
            background: C.white,
            color: C.ink,
            boxShadow: "0 1px 4px rgba(139,92,246,0.06), 0 2px 8px rgba(0,0,0,0.03)",
            cursor: "pointer",
          }}
        >
          القائمة
        </motion.button>

        <motion.button
          type="button"
          onClick={onReplay}
          disabled={replayBusy}
          whileTap={WHILE_TAP}
          transition={SPRING_UI}
          className="flex-1 flex items-center justify-center gap-2 rounded-2xl font-black leading-none"
          style={{
            padding: "14px 0",
            fontSize: 14,
            fontFamily: "var(--display)",
            background: `linear-gradient(135deg, ${C.purple}, ${C.coral})`,
            color: C.white,
            boxShadow: `0 4px 16px ${C.purple}44, inset 0 1px 0 rgba(255,255,255,0.25)`,
            opacity: replayBusy ? 0.55 : 1,
            cursor: replayBusy ? "not-allowed" : "pointer",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden>
            <path d="M3 9a6 6 0 1 0 1.5-4M3 3v3.5h3.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          إعادة
        </motion.button>
      </footer>
    </motion.div>
  );
}
