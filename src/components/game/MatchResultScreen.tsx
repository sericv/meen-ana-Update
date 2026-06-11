"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { memo, useEffect, useMemo, useState } from "react";
import { ConfettiBurst } from "@/components/game/ConfettiBurst";
import { useLiveUserProfile } from "@/hooks/useLiveUserProfile";
import { useRevealedCards } from "@/hooks/useRevealedCards";
import { postGame } from "@/lib/api/game-client";
import { XP_PER_LOSS, XP_PER_WIN, xpProgressInCurrentLevel } from "@/lib/profile/level";
import { getCategoryById } from "@/lib/game/categories";
import type { PlayerCosmetic } from "@/lib/profile/cosmetics";
import type { AwardMatchRewardsResult } from "@/lib/game/match-rewards";
import type { ChatMessage, GameCard } from "@/types";
import type { XpBreakdown } from "@/lib/profile/level";

/* ─── Design tokens (local mirror of GP) ─── */
const W_ORANGE      = "#FF8A3D";
const W_ORANGE_DEEP = "#F26A1F";
const W_ORANGE_SOFT = "#FFC58A";
const W_CREAM       = "#FFF1DD";
const W_INK         = "#3A2517";
const W_INK_SOFT    = "#7A5A45";
const W_GOLD        = "#F2B544";
const W_GOLD_DEEP   = "#C8881F";
const W_GREEN       = "#3FB87A";
const W_SAGE        = "#5a9a7a";

const CARD_PLACEHOLDER = "/cards/_placeholder.svg";

/* ─── spring config ─── */
const SPRING = { type: "spring", stiffness: 340, damping: 28, mass: 0.9 } as const;
const SPRING_SOFT = { type: "spring", stiffness: 260, damping: 26, mass: 1 } as const;

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
  opponentCard: GameCard | null;
  messages: ChatMessage[];
  toolsUsed?: number;
  matchStartedAtMs?: number | null;
  matchEndedAtMs?: number | null;
  replayBusy?: boolean;
  onReplay: () => void;
  onHome: () => void;
  myCosmetic?: PlayerCosmetic | null;
  opponentCosmetic?: PlayerCosmetic | null;
  myPhotoURL?: string | null;
};

/* ═══════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════ */

function formatDuration(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/* ═══════════════════════════════════════════════════════════
   SVG Icons & primitives
   ═══════════════════════════════════════════════════════════ */

function IconClose() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M4 4l10 10M14 4L4 14" stroke={W_INK} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconRefresh() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path
        d="M3 9a6 6 0 1 0 1.5-4M3 3v3.5h3.5"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconStar() {
  return (
    <svg width="20" height="20" viewBox="0 0 22 22" fill="none" aria-hidden>
      <path
        d="M11 2l2.4 5.8 6.2.5-4.7 4 1.4 6.1L11 15.8 6.7 18.4l1.4-6.1-4.7-4 6.2-.5L11 2z"
        fill={W_SAGE}
      />
    </svg>
  );
}

/**
 * OfficialCoin — exact visual replica of .coin-ico from shell-tokens.css.
 * Uses inline SVG so it works outside .shell-screen context.
 * Radial gradient: oklch(0.96 0.13 90) → oklch(0.72 0.17 60) = #fef3a0 → #c8881f approx
 */
function OfficialCoin({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 22 22"
      fill="none"
      aria-hidden
      style={{ flexShrink: 0 }}
    >
      <defs>
        <radialGradient id="coinFace" cx="35%" cy="30%" r="65%">
          <stop offset="0%"  stopColor="#fef6c8" />
          <stop offset="45%" stopColor="#f2b544" />
          <stop offset="100%" stopColor="#b87818" />
        </radialGradient>
        <radialGradient id="coinGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"  stopColor="#f2b544" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#f2b544" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* outer glow ring */}
      <circle cx="11" cy="11" r="10.5" fill="url(#coinGlow)" />
      {/* coin face */}
      <circle cx="11" cy="11" r="9" fill="url(#coinFace)" />
      {/* inner bottom shadow */}
      <ellipse cx="11" cy="16" rx="5.5" ry="2.5" fill="rgba(80,40,0,0.18)" />
      {/* specular highlight */}
      <ellipse cx="9" cy="7.5" rx="3" ry="1.5" fill="rgba(255,255,255,0.42)" transform="rotate(-18 9 7.5)" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════
   Card image
   ═══════════════════════════════════════════════════════════ */

const CardImg = memo(function CardImgInner({ src, alt }: { src: string; alt: string }) {
  const [errored, setErrored] = useState(false);
  const finalSrc = errored || !src ? CARD_PLACEHOLDER : src;
  return (
    <Image
      src={finalSrc}
      alt={alt}
      fill
      className="object-cover object-center"
      sizes="80px"
      unoptimized
      onError={() => setErrored(true)}
    />
  );
});

/* ═══════════════════════════════════════════════════════════
   ResultMiniCard — used inside the dual-card fan composition
   ═══════════════════════════════════════════════════════════ */
function ResultMiniCard({
  title,
  category,
  imageUrl,
  label,
  tilt = 0,
  delay = 0,
  highlighted = false,
}: {
  title: string;
  category: string | null;
  imageUrl?: string;
  label: string;
  tilt?: number;
  delay?: number;
  highlighted?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, rotate: tilt - (tilt > 0 ? 12 : -12) }}
      animate={{ opacity: 1, y: 0, rotate: tilt }}
      transition={{ ...SPRING, delay }}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}
    >
      {/* card */}
      <div
        style={{
          position: "relative",
          width: 80,
          height: 112,
          borderRadius: 14,
          overflow: "hidden",
          border: highlighted
            ? `2px solid rgba(255,138,61,0.7)`
            : "1.5px solid rgba(255,138,61,0.28)",
          background: "linear-gradient(160deg,#fff 0%,#fff1dd 48%,#fbe0bd 100%)",
          boxShadow: highlighted
            ? "0 14px 32px rgba(180,100,30,0.28), inset 0 1px 0 #fff"
            : "0 8px 22px rgba(180,100,30,0.18), inset 0 1px 0 #fff",
        }}
      >
        <div style={{ position: "relative", height: "63%", width: "100%" }}>
          {imageUrl ? <CardImg src={imageUrl} alt={title} /> : null}
        </div>
        <div style={{ padding: "4px 6px 5px", textAlign: "center" }}>
          <p
            style={{
              fontSize: 9,
              fontWeight: 800,
              color: W_INK,
              lineHeight: 1.2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {title}
          </p>
          {category && (
            <p style={{ fontSize: 7.5, fontWeight: 600, color: W_INK_SOFT, marginTop: 1 }}>
              {category}
            </p>
          )}
        </div>
      </div>

      {/* owner label pill */}
      <div
        style={{
          background: highlighted
            ? `linear-gradient(180deg, ${W_ORANGE}, ${W_ORANGE_DEEP})`
            : "rgba(255,255,255,0.88)",
          border: highlighted ? "none" : "1px solid rgba(244,196,141,0.5)",
          borderRadius: 999,
          padding: "3px 10px",
          fontSize: 10,
          fontWeight: 800,
          color: highlighted ? "#fff" : W_INK_SOFT,
          boxShadow: highlighted
            ? "0 3px 10px rgba(240,100,20,0.28)"
            : "0 1px 4px rgba(180,100,30,0.10)",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Surface card
   ═══════════════════════════════════════════════════════════ */
function ResultSurf({
  children,
  className = "",
  style,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING_SOFT, delay }}
      className={`rounded-2xl border border-[rgba(244,196,141,0.42)] bg-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_8px_24px_rgba(196,134,82,0.11)] ${className}`}
      style={style}
    >
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Reward row — inline with the official coin
   ═══════════════════════════════════════════════════════════ */
function RewardRow({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: "amber" | "sage";
}) {
  const amber = accent === "amber";
  return (
    <div
      className="flex items-center gap-3 rounded-2xl border p-3.5"
      style={{
        background: amber
          ? "linear-gradient(160deg, #fff4e0, #ffe8c8)"
          : "linear-gradient(160deg, #eef8f2, #e0f0e8)",
        borderColor: amber ? "rgba(200,130,60,0.38)" : "rgba(90,154,122,0.32)",
      }}
    >
      {/* icon bubble */}
      <div
        className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px]"
        style={{
          background: amber
            ? `linear-gradient(180deg, ${W_GOLD}, ${W_GOLD_DEEP})`
            : `linear-gradient(180deg, #62bc8a, #3a8a60)`,
          boxShadow: amber
            ? `inset 0 1px 0 rgba(255,255,255,0.5), 0 4px 12px ${W_GOLD_DEEP}44`
            : "inset 0 1px 0 rgba(255,255,255,0.4), 0 4px 12px rgba(60,140,90,0.25)",
        }}
      >
        {icon}
      </div>

      {/* text */}
      <div className="min-w-0 flex-1">
        <p style={{ fontSize: 11, fontWeight: 600, color: W_INK_SOFT }}>{label}</p>
        <p style={{ fontSize: 22, fontWeight: 900, color: W_INK, lineHeight: 1.1, letterSpacing: "-0.03em" }}>
          {value}
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Stat cell
   ═══════════════════════════════════════════════════════════ */
function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        borderRadius: 14,
        border: "1px solid rgba(244,196,141,0.32)",
        background: "rgba(255,255,255,0.65)",
        padding: "10px 8px",
        gap: 2,
      }}
    >
      <p
        style={{
          fontSize: 20,
          fontWeight: 900,
          color: W_INK,
          lineHeight: 1,
          letterSpacing: "-0.03em",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </p>
      <p style={{ fontSize: 10, fontWeight: 600, color: W_INK_SOFT, lineHeight: 1.2, textAlign: "center" }}>
        {label}
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   XP breakdown pill
   ═══════════════════════════════════════════════════════════ */
function XpPill({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: "sage" | "amber" | "blue" | "purple";
}) {
  const configs = {
    sage:   { bg: "rgba(62,184,122,0.12)", border: "rgba(62,184,122,0.35)", text: "#2d7c52" },
    amber:  { bg: "rgba(242,181,68,0.14)", border: "rgba(200,130,60,0.38)", text: "#7a4c14" },
    blue:   { bg: "rgba(80,140,230,0.12)", border: "rgba(80,140,230,0.35)", text: "#2c4e9a" },
    purple: { bg: "rgba(150,90,220,0.12)", border: "rgba(150,90,220,0.35)", text: "#5c2a8e" },
  };
  const c = configs[color];
  return (
    <div
      style={{
        padding: "4px 10px",
        borderRadius: 20,
        background: c.bg,
        border: `1px solid ${c.border}`,
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      <span style={{ fontSize: 10.5, fontWeight: 700, color: c.text }}>{label}</span>
      <span style={{ fontSize: 11, fontWeight: 900, color: c.text }}>{value} XP</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Ambient embers
   ═══════════════════════════════════════════════════════════ */
function FloatingEmbers({ count }: { count: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: `${(i * 17 + 11) % 100}%`,
        delay: (i % 6) * 0.35,
        dur: 2.8 + (i % 4) * 0.6,
        size: 3 + (i % 3),
      })),
    [count],
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          className="absolute bottom-0 rounded-full"
          style={{ left: p.left, width: p.size, height: p.size, background: W_ORANGE_SOFT }}
          animate={{ y: [0, -120, -240], opacity: [0, 0.65, 0] }}
          transition={{ duration: p.dur, repeat: Infinity, delay: p.delay, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Main screen
   ═══════════════════════════════════════════════════════════ */
export function MatchResultScreen({
  roomId,
  matchId,
  myUid,
  iWon,
  forfeitWin,
  guessLimitWin = false,
  opponentName,
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

  const [show, setShow]               = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [rewards, setRewards]         = useState<AwardMatchRewardsResult | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setShow(true), 80);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!iWon) return;
    const t = window.setTimeout(() => setShowConfetti(true), 240);
    return () => window.clearTimeout(t);
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
  const levelPctAnimated = show ? levelPct : Math.max(0, levelPct - 8);

  const headline = iWon ? (forfeitWin ? "فزت!" : "أحسنت!") : "خسارة";
  const subline  = iWon
    ? forfeitWin
      ? "فزت بانسحاب الخصم"
      : guessLimitWin
        ? "فزت — استنفد الخصم محاولات التخمين"
        : "فزت بالمباراة · خمّنت كرتك في الوقت"
    : guessLimitWin
      ? "استنفدت محاولات التخمين"
      : forfeitWin
        ? "غادر خصمك المباراة"
        : "في المرة القادمة تنجح إن شاء الله";

  const coinReward  = rewards?.coinsAwarded ?? (iWon ? 1 : 0);
  const xpReward    = rewards?.xpAwarded   ?? (iWon ? XP_PER_WIN : XP_PER_LOSS);
  const bonusLabel  = rewards?.bonusLabelAr ?? null;
  const xpBreakdown: XpBreakdown | null = rewards?.xpBreakdown ?? null;
  const leveledUp   = rewards?.leveledUp ?? false;
  const levelAfter  = rewards?.levelAfter ?? level;
  const shortRoom   = roomId ? roomId.slice(-4).toUpperCase() : "—";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      dir="rtl"
      className="match-result-screen absolute inset-0 z-50 flex min-h-0 w-full flex-col overflow-hidden"
      style={{
        background: iWon
          ? "radial-gradient(ellipse 900px 500px at 50% -5%, rgba(255,220,160,0.9), transparent), linear-gradient(180deg, #fff9f0 0%, #fce8d2 100%)"
          : "radial-gradient(ellipse 900px 500px at 50% -5%, rgba(255,200,180,0.78), transparent), linear-gradient(180deg, #fff9f0 0%, #fce8d2 100%)",
      }}
    >
      <FloatingEmbers count={iWon ? 22 : 8} />
      {iWon && showConfetti ? <ConfettiBurst active /> : null}

      {/* ── Header ── */}
      <header
        className="relative z-10 flex shrink-0 items-center justify-between px-4 pb-1"
        style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}
      >
        <motion.button
          type="button"
          onClick={onHome}
          whileTap={{ scale: 0.94 }}
          transition={{ type: "spring", stiffness: 420, damping: 28 }}
          className="rounded-xl p-2"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,248,236,0.92))",
            border: "1px solid rgba(244,196,141,0.40)",
            boxShadow: "inset 0 1.5px 0 rgba(255,255,255,0.90), 0 3px 10px rgba(180,100,30,0.10)",
            cursor: "pointer",
          }}
          aria-label="إغلاق"
        >
          <IconClose />
        </motion.button>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: W_INK_SOFT,
            padding: "4px 10px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.55)",
            border: "1px solid rgba(244,196,141,0.35)",
          }}
        >
          المباراة #{shortRoom}
        </span>
        <span style={{ width: 36 }} aria-hidden />
      </header>

      {/* ── Scrollable body ── */}
      <div className="relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-contain px-[18px] pb-2">

        {/* ── Headline ── */}
        <div className="pt-1 text-center">
          <motion.div
            initial={{ scale: 0.55, opacity: 0 }}
            animate={show ? { scale: 1, opacity: 1 } : {}}
            transition={{ ...SPRING, delay: 0.04 }}
          >
            <h1
              className="font-black leading-none"
              style={{
                fontSize: "clamp(2.6rem, 12vw, 3.8rem)",
                background: iWon
                  ? `linear-gradient(180deg, ${W_ORANGE} 0%, ${W_ORANGE_DEEP} 100%)`
                  : "linear-gradient(180deg, #c45a4a 0%, #8a3028 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: iWon
                  ? "drop-shadow(0 3px 10px rgba(255,160,60,0.38))"
                  : "drop-shadow(0 3px 10px rgba(180,80,60,0.32))",
              }}
            >
              {headline}
            </h1>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={show ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.38, delay: 0.22 }}
            style={{ marginTop: 6, fontSize: 13, fontWeight: 600, color: W_INK_SOFT }}
          >
            {subline}
          </motion.p>
        </div>

        {/* ── Cards reveal ── */}
        <ResultSurf className="mt-5 p-5" delay={0.12}>
          {/* Two-card fan: both centered, counter-rotation creates a V-spread */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              gap: 20,
              marginBottom: 16,
            }}
          >
            {/* My card — slight left tilt */}
            <ResultMiniCard
              title={myTitle}
              category={myCategory}
              imageUrl={myCard?.imageUrl}
              label="كرتي"
              tilt={-4}
              delay={0.22}
              highlighted={iWon}
            />

            {/* Opponent card — slight right tilt */}
            <ResultMiniCard
              title={oppTitle}
              category={oppCategory}
              imageUrl={effectiveOpponentCard?.imageUrl}
              label="كرت الخصم"
              tilt={4}
              delay={0.30}
              highlighted={!iWon}
            />
          </div>

          {/* Card names listed below */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
            }}
          >
            <div
              style={{
                background: iWon ? "linear-gradient(160deg, #fff4e0, #ffe8c8)" : "rgba(255,255,255,0.65)",
                borderRadius: 12,
                border: iWon ? "1px solid rgba(242,181,68,0.5)" : "1px solid rgba(244,196,141,0.32)",
                padding: "8px 10px",
              }}
            >
              <p style={{ fontSize: 10, fontWeight: 700, color: W_INK_SOFT, marginBottom: 2 }}>كرتي كان</p>
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 900,
                  color: W_INK,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {myTitle}
              </p>
            </div>
            <div
              style={{
                background: !iWon ? "linear-gradient(160deg, #fff4e0, #ffe8c8)" : "rgba(255,255,255,0.65)",
                borderRadius: 12,
                border: !iWon ? "1px solid rgba(242,181,68,0.5)" : "1px solid rgba(244,196,141,0.32)",
                padding: "8px 10px",
              }}
            >
              <p style={{ fontSize: 10, fontWeight: 700, color: W_INK_SOFT, marginBottom: 2 }}>كرت الخصم</p>
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 900,
                  color: W_INK,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {oppTitle}
              </p>
            </div>
          </div>
        </ResultSurf>

        {/* ── Rewards ── */}
        <ResultSurf className="mt-3 p-4" delay={0.22}>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: W_INK, marginBottom: 12 }}>
            المكافآت
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <RewardRow
              accent="amber"
              label="عملات"
              value={coinReward > 0 ? `+${coinReward}` : "—"}
              icon={<OfficialCoin size={26} />}
            />
            <RewardRow
              accent="sage"
              label="خبرة"
              value={`+${xpReward}`}
              icon={<IconStar />}
            />
          </div>

          {/* coin fast-win label (separate from XP breakdown) */}
          {bonusLabel && coinReward > 0 ? (
            <motion.p
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.55, duration: 0.3 }}
              style={{
                marginTop: 10,
                borderRadius: 12,
                border: "1px solid rgba(200,130,60,0.42)",
                padding: "7px 12px",
                textAlign: "center",
                fontSize: 11.5,
                fontWeight: 800,
                color: W_INK,
                background: "linear-gradient(180deg, #fff4e0, #ffe8c8)",
              }}
            >
              {bonusLabel}
            </motion.p>
          ) : null}

          {/* XP breakdown pills */}
          {xpBreakdown && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                marginTop: 10,
              }}
            >
              <XpPill label="أساسي" value={`+${xpBreakdown.base}`} color="sage" />
              {xpBreakdown.fastWinBonus > 0 && (
                <XpPill label="فوز سريع" value={`+${xpBreakdown.fastWinBonus}`} color="amber" />
              )}
              {xpBreakdown.toolBonus > 0 && (
                <XpPill label="أدوات" value={`+${xpBreakdown.toolBonus}`} color="blue" />
              )}
              {xpBreakdown.longMatchBonus > 0 && (
                <XpPill label="مثابرة" value={`+${xpBreakdown.longMatchBonus}`} color="purple" />
              )}
            </div>
          )}

          {/* XP bar */}
          <div style={{ marginTop: 14 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: 11,
                fontWeight: 700,
                color: W_INK_SOFT,
                marginBottom: 6,
              }}
            >
              <span style={{ fontWeight: 800, color: W_INK }}>المستوى {levelAfter}</span>
              <span style={{ fontVariantNumeric: "tabular-nums" }}>
                {xpInLevel} / {xpToNext} XP
              </span>
            </div>
            <div
              style={{
                position: "relative",
                height: 9,
                borderRadius: 999,
                overflow: "hidden",
                background: "rgba(58,37,23,0.09)",
                boxShadow: "inset 0 1px 2px rgba(0,0,0,0.08)",
              }}
            >
              <div
                style={{
                  height: "100%",
                  borderRadius: 999,
                  width: `${levelPctAnimated}%`,
                  background: `linear-gradient(90deg, ${W_GOLD}, #f5a820, ${W_GOLD_DEEP})`,
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.45), 0 0 10px ${W_GOLD}99`,
                  transition: "width 1.1s cubic-bezier(0.23, 1, 0.32, 1) 0.35s",
                }}
              />
            </div>
          </div>
        </ResultSurf>

        {/* ── Level-up celebration ── */}
        {leveledUp && (
          <motion.div
            initial={{ opacity: 0, scale: 0.82, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 22, delay: 0.62 }}
            style={{
              marginTop: 12,
              borderRadius: 22,
              padding: "18px 20px",
              background: `linear-gradient(138deg, #FFE27A 0%, ${W_GOLD} 30%, ${W_ORANGE} 70%, ${W_ORANGE_DEEP} 100%)`,
              border: "1.5px solid rgba(255,255,255,0.42)",
              boxShadow: `inset 0 2px 0 rgba(255,255,255,0.60), inset 0 -2px 0 rgba(0,0,0,0.10), 0 2px 0 rgba(160,70,0,0.30), 0 10px 28px ${W_ORANGE_DEEP}55, 0 0 40px -4px ${W_GOLD}88`,
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            {/* Pulsing star circle */}
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              style={{
                width: 50,
                height: 50,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.28)",
                border: "1.5px solid rgba(255,255,255,0.55)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: "0 0 14px rgba(255,255,255,0.35)",
              }}
            >
              <IconStar />
            </motion.div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.82)", letterSpacing: "0.01em" }}>
                ارتقيت مستوى 🎉
              </p>
              <p style={{ fontSize: 24, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.08, textShadow: "0 2px 8px rgba(0,0,0,0.18)" }}>
                المستوى {levelAfter}
              </p>
            </div>
          </motion.div>
        )}

        {/* ── Match stats ── */}
        <ResultSurf className="mt-3 p-4" delay={0.30}>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: W_INK, marginBottom: 12 }}>
            إحصائيات المباراة
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
            <StatCell label="الأسئلة"            value={String(questionCount)} />
            <StatCell label="الأدوات والتلميحات"  value={String(toolsUsed)} />
            <StatCell label="المدة"               value={durationLabel} />
          </div>
        </ResultSurf>

        {/* bottom breathing room */}
        <div style={{ height: 8 }} />
      </div>

      {/* ── Footer ── */}
      <footer
        className="relative z-10 flex shrink-0 gap-2.5 px-4 pt-2"
        style={{
          paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
          background: "linear-gradient(180deg, transparent, rgba(252,232,210,0.65) 40%)",
        }}
      >
        <motion.button
          type="button"
          onClick={onHome}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 420, damping: 28 }}
          style={{
            flex: 1,
            borderRadius: 18,
            border: "1.5px solid rgba(244,196,141,0.52)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,248,236,0.95))",
            padding: "14px 0",
            fontSize: 14,
            fontWeight: 800,
            color: W_INK,
            boxShadow:
              "inset 0 1.5px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(196,130,60,0.10), 0 2px 0 rgba(196,130,60,0.22), 0 6px 16px rgba(180,100,30,0.10)",
            cursor: "pointer",
          }}
        >
          القائمة
        </motion.button>
        <motion.button
          type="button"
          onClick={onReplay}
          disabled={replayBusy}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 420, damping: 28 }}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            borderRadius: 18,
            border: "none",
            padding: "14px 0",
            fontSize: 14,
            fontWeight: 800,
            color: "#fff",
            background: `linear-gradient(180deg, ${W_ORANGE} 0%, #f06018 60%, ${W_ORANGE_DEEP} 100%)`,
            boxShadow: `inset 0 1.5px 0 rgba(255,255,255,0.48), inset 0 -2px 0 rgba(0,0,0,0.12), 0 2px 0 #b84a00, 0 8px 20px ${W_ORANGE_DEEP}55, 0 16px 40px -8px ${W_ORANGE_DEEP}38`,
            opacity: replayBusy ? 0.55 : 1,
            cursor: replayBusy ? "not-allowed" : "pointer",
          }}
        >
          <IconRefresh />
          إعادة
        </motion.button>
      </footer>
    </motion.div>
  );
}
