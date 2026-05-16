"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { memo, useEffect, useMemo, useState } from "react";
import { ConfettiBurst } from "@/components/game/ConfettiBurst";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { postGame } from "@/lib/api/game-client";
import { awardMatchWinRewards } from "@/lib/firestore/users.client";
import { getCategoryById } from "@/lib/game/categories";
import { normalizeCosmetic } from "@/lib/profile/cosmetics";
import type { PlayerCosmetic } from "@/lib/profile/cosmetics";
import type { ChatMessage, GameCard } from "@/types";

const CARD_PLACEHOLDER = "/cards/_placeholder.svg";

const W_ORANGE = "#FF8A3D";
const W_ORANGE_DEEP = "#F26A1F";
const W_ORANGE_SOFT = "#FFC58A";
const W_CREAM = "#FFF1DD";
const W_CREAM_DEEP = "#FBE0BD";
const W_INK = "#3A2517";
const W_INK_SOFT = "#7A5A45";
const W_GOLD = "#F2B544";
const W_GOLD_DEEP = "#C8881F";
const W_GREEN = "#3FB87A";
const W_GREEN_DEEP = "#2E9A60";
const W_RED = "#E5524D";
const W_RED_DEEP = "#B8332E";

export type MatchResultScreenProps = {
  roomId: string;
  myUid: string;
  iWon: boolean;
  winnerUid: string | null;
  forfeitWin: boolean;
  myName: string;
  opponentName: string;
  opponentCard: GameCard | null;
  messages: ChatMessage[];
  matchStartedAtMs?: number | null;
  matchEndedAtMs?: number | null;
  replayBusy?: boolean;
  onReplay: () => void;
  onHome: () => void;
  myCosmetic?: PlayerCosmetic | null;
  opponentCosmetic?: PlayerCosmetic | null;
  myPhotoURL?: string | null;
};

const CardImage = memo(function CardImageInner({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  const [errored, setErrored] = useState(false);
  const finalSrc = errored || !src ? CARD_PLACEHOLDER : src;
  return (
    <Image
      src={finalSrc}
      alt={alt}
      fill
      className="object-cover object-center"
      sizes="(max-width: 420px) 42vw, 200px"
      unoptimized
      onError={() => setErrored(true)}
    />
  );
});

function useRevealedCards(roomId: string, myUid: string): {
  myCard: GameCard | null;
  opponentCard: GameCard | null;
} {
  const [myCard, setMyCard] = useState<GameCard | null>(null);
  const [oppCard, setOppCard] = useState<GameCard | null>(null);

  useEffect(() => {
    if (!roomId || !myUid) {
      setMyCard(null);
      setOppCard(null);
      return;
    }
    let cancelled = false;
    let attempts = 0;
    const tick = async () => {
      if (cancelled) return;
      attempts += 1;
      try {
        const res = await postGame("/api/game/reveal-cards", { roomId });
        const data = res as {
          ok?: boolean;
          myCard?: {
            cardId: string;
            name: string;
            nameAr: string;
            imageUrl: string;
            categoryId: string;
          } | null;
          opponentCard?: {
            cardId: string;
            name: string;
            nameAr: string;
            imageUrl: string;
            categoryId: string;
          } | null;
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
        if (!cancelled && attempts < 5) {
          setTimeout(() => void tick(), 400 * attempts);
        }
      }
    };
    void tick();
    return () => {
      cancelled = true;
    };
  }, [roomId, myUid]);

  return { myCard, opponentCard: oppCard };
}

function formatDuration(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function CrownIcon({ size = 56, id = "crown" }: { size?: number; id?: string }) {
  const gradId = `${id}-g`;
  const shineId = `${id}-shine`;
  return (
    <svg
      width={size}
      height={size * 0.7}
      viewBox="0 0 56 40"
      aria-hidden
      style={{
        filter: `drop-shadow(0 6px 12px ${W_GOLD_DEEP}88) drop-shadow(0 0 18px ${W_GOLD}aa)`,
      }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFF1B8" />
          <stop offset="40%" stopColor={W_GOLD} />
          <stop offset="100%" stopColor={W_GOLD_DEEP} />
        </linearGradient>
        <linearGradient id={shineId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
      <path
        d="M4 32 L10 8 L18 22 L28 4 L38 22 L46 8 L52 32 Z"
        fill={`url(#${gradId})`}
        stroke="#fff"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <rect x="4" y="30" width="48" height="8" rx="2" fill={`url(#${gradId})`} stroke="#fff" strokeWidth="1.5" />
      <path
        d="M4 32 L10 8 L18 22 L28 4 L38 22 L46 8 L52 32"
        fill="none"
        stroke={`url(#${shineId})`}
        strokeWidth="2"
      />
      <circle cx="10" cy="14" r="2.5" fill={W_RED} stroke="#fff" strokeWidth="0.8" />
      <circle cx="28" cy="10" r="3" fill="#5FA8E8" stroke="#fff" strokeWidth="0.8" />
      <circle cx="46" cy="14" r="2.5" fill={W_GREEN} stroke="#fff" strokeWidth="0.8" />
      <circle cx="28" cy="34" r="2" fill="#fff" opacity="0.9" />
    </svg>
  );
}

function IconReplay() {
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

function IconHome() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M2 7l5-5 5 5M3.5 6v6h7V6"
        stroke={W_INK}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconClock() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <circle cx="6" cy="6" r="4.5" stroke={W_INK_SOFT} strokeWidth="1.4" />
      <path d="M6 3.5V6l2 1.2" stroke={W_INK_SOFT} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function IconTag() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path
        d="M2 6l4-4 4 4v4H6V6H2z"
        stroke={W_INK_SOFT}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
      <path
        d="M1 5l3 3 5-6"
        stroke="#fff"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WinnerBackground() {
  return (
    <div className="match-result-decor pointer-events-none absolute inset-0 -z-10" aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, #FFE7C2 0%, ${W_CREAM} 42%, ${W_CREAM_DEEP} 100%)`,
        }}
      />
    </div>
  );
}

function VictoryTitle({ text, celebrate }: { text: string; celebrate: boolean }) {
  return (
    <div className="relative px-2 pt-2 pb-1">
      <h1
        className="text-center text-[clamp(2rem,10vw,4.25rem)] font-black leading-[1.1] tracking-tight"
        style={{
          background: celebrate
            ? "linear-gradient(180deg, #FFF6DC 0%, #F2B544 40%, #FF8A3D 75%, #F26A1F 100%)"
            : "linear-gradient(180deg, #FFF6DC 0%, #FF9F0A 55%, #E0660A 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          WebkitTextStroke: "1.5px #fff",
          paintOrder: "stroke fill",
          filter: `drop-shadow(0 2px 0 ${W_ORANGE_DEEP})`,
        }}
      >
        {text}
      </h1>
    </div>
  );
}

function ResultRibbon({
  text,
  color = W_ORANGE,
  deep = W_ORANGE_DEEP,
}: {
  text: string;
  color?: string;
  deep?: string;
}) {
  return (
    <div className="relative mt-1 flex justify-center">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 28, delay: 0.12 }}
        className="relative z-[1] min-w-[180px] px-7 py-2 text-center text-base font-black text-white"
        style={{
          background: `linear-gradient(180deg, ${color} 0%, ${deep} 100%)`,
          boxShadow: `inset 0 1.5px 0 rgba(255,255,255,0.4), inset 0 -3px 0 rgba(0,0,0,0.12), 0 8px 18px ${deep}55`,
          textShadow: "0 1.5px 0 rgba(0,0,0,0.18)",
          clipPath:
            "polygon(8px 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 8px 100%, 0 50%)",
        }}
      >
        {text}
      </motion.div>
    </div>
  );
}

function WinnerHero({
  name,
  cosmetic,
  photoURL,
  celebrate,
}: {
  name: string;
  cosmetic?: PlayerCosmetic | null;
  photoURL?: string | null;
  celebrate: boolean;
}) {
  return (
    <motion.div
      layout={false}
      className="winner-hero relative mt-4 flex w-full flex-col items-center gap-0 overflow-visible px-3"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 26, delay: 0.15 }}
    >
      <div className="relative z-[2] mb-2 shrink-0">
        <CrownIcon size={52} id="hero-crown" />
      </div>

      <div className="relative z-[1] shrink-0">
        <div
          className="rounded-full p-[4px]"
          style={{
            background: "linear-gradient(180deg, #fff 0%, #FFF1DD 100%)",
            boxShadow: "0 10px 22px rgba(180,100,30,0.16), inset 0 2px 0 #fff",
          }}
        >
          <div
            className="rounded-full p-[3px]"
            style={{
              background: `linear-gradient(180deg, ${W_GOLD} 0%, ${W_GOLD_DEEP} 100%)`,
            }}
          >
            <ProfileAvatar
              cosmetic={cosmetic ?? normalizeCosmetic(undefined)}
              fallbackPhotoURL={photoURL}
              displayName={name}
              size="xl"
              active={celebrate}
              idle={!celebrate}
            />
          </div>
        </div>
      </div>

      <div className="relative z-[2] mt-3 w-full max-w-[min(100%,20rem)] shrink-0">
        <p
          className="match-result-hero-name rounded-2xl px-4 py-2.5 text-center text-lg font-black leading-snug sm:text-xl"
          style={{
            color: W_INK,
            background: "linear-gradient(180deg, #fff 0%, #FFF1DD 100%)",
            boxShadow: `0 6px 16px rgba(180,100,30,0.12), inset 0 1px 0 #fff, 0 0 0 1px ${W_ORANGE}33`,
            overflowWrap: "anywhere",
            wordBreak: "break-word",
          }}
        >
          {name}
        </p>
      </div>

      <div
        className="relative z-[2] mt-2.5 inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-extrabold text-white"
        style={{
          background: `linear-gradient(180deg, ${W_GREEN} 0%, ${W_GREEN_DEEP} 100%)`,
          boxShadow: `0 4px 12px ${W_GREEN}55, inset 0 1px 0 rgba(255,255,255,0.35)`,
          textShadow: "0 1px 0 rgba(0,0,0,0.15)",
        }}
      >
        <IconCheck />
        الفائز
      </div>
    </motion.div>
  );
}

function ResultCollectibleCard({
  ribbon,
  ribbonColor,
  ribbonDeep,
  borderColor,
  card,
  fallbackLabel,
  categoryLabel,
}: {
  ribbon: string;
  ribbonColor: string;
  ribbonDeep: string;
  borderColor: string;
  card: GameCard | null;
  fallbackLabel: string;
  categoryLabel: string | null;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      layout={false}
      className="relative min-w-0 flex-1"
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
    >
      <motion.div
        className="absolute left-1/2 top-[-6px] z-[3] -translate-x-1/2 whitespace-nowrap rounded-lg px-4 py-1 text-[11px] font-black text-white"
        style={{
          background: `linear-gradient(180deg, ${ribbonColor} 0%, ${ribbonDeep} 100%)`,
          boxShadow: `0 6px 12px ${ribbonDeep}66, inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -2px 0 rgba(0,0,0,0.15)`,
          textShadow: "0 1px 0 rgba(0,0,0,0.18)",
        }}
      >
        {ribbon}
      </motion.div>

      <div
        className="mt-2 rounded-[18px] p-1.5"
        style={{
          background: "linear-gradient(160deg, #fff 0%, #FFF1DD 100%)",
          boxShadow: `0 12px 24px rgba(180,100,30,0.14), inset 0 1.5px 0 #fff, inset 0 -3px 0 ${W_CREAM_DEEP}, 0 0 0 1.5px ${borderColor}55`,
        }}
      >
        <div
          className="relative h-[min(130px,26vw)] overflow-hidden rounded-[13px]"
          style={{
            background: "linear-gradient(180deg, #FFF6E5 0%, #FFE8BF 100%)",
            boxShadow: "inset 0 1.5px 0 rgba(255,255,255,0.5), inset 0 -3px 6px rgba(0,0,0,0.12)",
          }}
        >
          {card?.imageUrl ? (
            <CardImage src={card.imageUrl} alt={card.nameAr || fallbackLabel} />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span
                className="text-5xl font-black leading-none"
                style={{
                  background: `linear-gradient(180deg, #fff 0%, ${W_GOLD} 100%)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                ؟
              </span>
            </div>
          )}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.28) 0%, transparent 55%)",
            }}
          />
        </div>
        <div className="px-1.5 pb-1 pt-2 text-center">
          <p className="truncate text-[15px] font-black leading-tight" style={{ color: W_INK }}>
            {card?.nameAr || fallbackLabel}
          </p>
          {categoryLabel ? (
            <p className="mt-1 truncate text-[10px] font-bold" style={{ color: W_INK_SOFT }}>
              فئة: {categoryLabel}
            </p>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}

function ResultStatsPanel({
  winnerName,
  loserName,
  winnerCosmetic,
  loserCosmetic,
  winnerPhotoURL,
  winGuessText,
  durationLabel,
  categoryLabel,
}: {
  winnerName: string;
  loserName: string;
  winnerCosmetic?: PlayerCosmetic | null;
  loserCosmetic?: PlayerCosmetic | null;
  winnerPhotoURL?: string | null;
  winGuessText: string | null;
  durationLabel: string | null;
  categoryLabel: string | null;
}) {
  return (
    <motion.div
      layout
      className="mx-4 mt-3 rounded-[22px] px-3.5 py-3"
      style={{
        background: "rgba(255,255,255,0.78)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        boxShadow:
          "0 12px 24px rgba(180,100,30,0.12), inset 0 1.5px 0 rgba(255,255,255,0.9), inset 0 0 0 1px rgba(255,255,255,0.6)",
      }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.28, type: "spring", stiffness: 340, damping: 28 }}
    >
      <div className="flex items-center gap-2.5">
        <div className="relative shrink-0">
          <div className="absolute -top-3 left-1/2 z-[2] -translate-x-1/2">
            <CrownIcon size={26} id="panel-crown" />
          </div>
          <div
            className="rounded-full p-0.5"
            style={{
              background: `linear-gradient(180deg, ${W_GOLD} 0%, ${W_GOLD_DEEP} 100%)`,
              boxShadow: `0 4px 10px ${W_GOLD}66`,
            }}
          >
            <ProfileAvatar
              cosmetic={winnerCosmetic ?? normalizeCosmetic(undefined)}
              fallbackPhotoURL={winnerPhotoURL}
              displayName={winnerName}
              size="sm"
              active
            />
          </div>
          <p className="mt-1 max-w-[64px] truncate text-center text-[10px] font-extrabold" style={{ color: W_INK }}>
            {winnerName}
          </p>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1 px-1">
          {winGuessText ? (
            <>
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-[9.5px] font-bold" style={{ color: W_INK_SOFT }}>
                  التخمين الصحيح
                </span>
                <span className="text-center text-[13px] font-black leading-snug" style={{ color: W_GREEN_DEEP }}>
                  {winGuessText}
                </span>
              </div>
              <div
                className="h-px"
                style={{
                  background: `linear-gradient(90deg, transparent, ${W_CREAM_DEEP}, transparent)`,
                }}
              />
            </>
          ) : null}
          <div className="flex justify-between gap-2">
            <motion.div layout className="flex flex-1 flex-col items-center gap-0.5">
              <span className="flex items-center gap-1 text-[8.5px] font-bold" style={{ color: W_INK_SOFT }}>
                <IconClock /> المدة
              </span>
              <span className="text-xs font-black tabular-nums" style={{ color: W_INK }}>
                {durationLabel ?? "—"}
              </span>
            </motion.div>
            <motion.div layout className="flex flex-1 flex-col items-center gap-0.5">
              <span className="flex items-center gap-1 text-[8.5px] font-bold" style={{ color: W_INK_SOFT }}>
                <IconTag /> الفئة
              </span>
              <span className="max-w-full truncate text-xs font-black" style={{ color: W_INK }}>
                {categoryLabel ?? "—"}
              </span>
            </motion.div>
          </div>
        </div>

        <div className="relative shrink-0 opacity-85">
          <div
            className="rounded-full p-0.5"
            style={{
              background: "linear-gradient(180deg, #B8B8C0 0%, #6E6E78 100%)",
            }}
          >
            <ProfileAvatar
              cosmetic={loserCosmetic ?? normalizeCosmetic(undefined)}
              displayName={loserName}
              size="sm"
              idle
            />
          </div>
          <p
            className="mt-1 max-w-[64px] truncate text-center text-[10px] font-extrabold"
            style={{ color: W_INK_SOFT }}
          >
            {loserName}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export function MatchResultScreen({
  roomId,
  myUid,
  iWon,
  winnerUid,
  forfeitWin,
  myName,
  opponentName,
  opponentCard,
  messages,
  matchStartedAtMs,
  matchEndedAtMs,
  replayBusy = false,
  onReplay,
  onHome,
  myCosmetic,
  opponentCosmetic,
  myPhotoURL,
}: MatchResultScreenProps) {
  const { myCard, opponentCard: revealedOpponentCard } = useRevealedCards(roomId, myUid);
  const effectiveOpponentCard = revealedOpponentCard ?? opponentCard;

  const myCategory = myCard?.categoryId
    ? (getCategoryById(myCard.categoryId)?.nameAr ?? null)
    : null;
  const opponentCategory = effectiveOpponentCard?.categoryId
    ? (getCategoryById(effectiveOpponentCard.categoryId)?.nameAr ?? null)
    : null;

  const winMsg = messages.find((m) => m.type === "guess" && m.correct === true);

  const durationLabel = useMemo(() => {
    if (matchStartedAtMs && matchEndedAtMs && matchEndedAtMs > matchStartedAtMs) {
      return formatDuration(matchEndedAtMs - matchStartedAtMs);
    }
    return null;
  }, [matchStartedAtMs, matchEndedAtMs]);

  const categoryLabel = opponentCategory ?? myCategory;

  const [showConfetti, setShowConfetti] = useState(false);
  useEffect(() => {
    if (!iWon) return;
    const t = window.setTimeout(() => setShowConfetti(true), 280);
    return () => window.clearTimeout(t);
  }, [iWon]);

  useEffect(() => {
    if (!iWon || !myUid || !roomId) return;
    if (typeof window === "undefined") return;
    const key = `meenana-win-award:${roomId}`;
    const state = window.sessionStorage.getItem(key);
    if (state === "1" || state === "pending") return;
    window.sessionStorage.setItem(key, "pending");
    void (async () => {
      try {
        await awardMatchWinRewards(myUid);
        window.sessionStorage.setItem(key, "1");
      } catch {
        window.sessionStorage.removeItem(key);
      }
    })();
  }, [iWon, myUid, roomId]);

  const headlineBig = iWon
    ? forfeitWin
      ? "فزت!"
      : "أحسنت!"
    : winnerUid
      ? "خسرت"
      : "انتهت المباراة";

  const ribbonText = iWon
    ? forfeitWin
      ? "فزت بانسحاب الخصم"
      : "لقد ربحت المباراة"
    : winnerUid
      ? forfeitWin
        ? "غادر خصمك المباراة"
        : "فاز خصمك بالتخمين"
      : "انتهت الجولة";

  const headlineSub = iWon
    ? forfeitWin
      ? "غادر خصمك المباراة"
      : "خمّنت البطاقة بشكل صحيح"
    : forfeitWin
      ? "غادر خصمك المباراة"
      : "جولة قادمة، فرصة جديدة";

  const winnerIsMe = Boolean(iWon && winnerUid);
  const winnerName = winnerIsMe ? myName : opponentName;
  const loserName = winnerIsMe ? opponentName : myName;
  const winnerCosmetic = winnerIsMe ? myCosmetic : opponentCosmetic;
  const loserCosmetic = winnerIsMe ? opponentCosmetic : myCosmetic;
  const winnerPhotoURL = winnerIsMe ? myPhotoURL : undefined;

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.14 } },
  };
  const item = {
    hidden: { opacity: 0, y: 10 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, stiffness: 300, damping: 24 },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      dir="rtl"
      className="match-result-screen absolute inset-0 z-50 flex min-h-0 w-full max-w-full flex-col overflow-x-hidden overflow-y-auto"
      style={{
        overscrollBehavior: "none",
        touchAction: "pan-y",
      }}
    >
      {iWon && showConfetti ? <ConfettiBurst active={true} /> : null}

      <WinnerBackground />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 mx-auto flex w-full min-w-0 max-w-lg flex-1 flex-col overflow-x-hidden px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.5rem,env(safe-area-inset-top))] sm:max-w-xl"
      >
        <motion.div variants={item} className="flex justify-center pb-1">
          <span
            className="text-base font-black sm:text-lg"
            style={{
              background: "linear-gradient(180deg,#FF9F0A 0%,#E0660A 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 2px 4px rgba(224,102,10,0.25))",
            }}
          >
            مين أنا؟
          </span>
        </motion.div>

        <motion.div variants={item}>
          <VictoryTitle text={headlineBig} celebrate={iWon} />
          <ResultRibbon
            text={ribbonText}
            color={iWon ? W_ORANGE : W_INK_SOFT}
            deep={iWon ? W_ORANGE_DEEP : W_INK}
          />
          <p className="mt-2 text-center text-sm font-bold" style={{ color: W_INK_SOFT }}>
            {headlineSub}
          </p>
        </motion.div>

        {winnerUid ? (
          <WinnerHero
            name={winnerName}
            cosmetic={winnerCosmetic}
            photoURL={winnerPhotoURL}
            celebrate={iWon}
          />
        ) : null}

        <motion.div variants={item} className="relative mt-3 px-4">
          <div className="relative flex items-start gap-2.5">
            <ResultCollectibleCard
              ribbon="بطاقتك"
              ribbonColor={W_GREEN}
              ribbonDeep={W_GREEN_DEEP}
              borderColor={W_GREEN}
              card={myCard}
              fallbackLabel="بطاقتك"
              categoryLabel={myCategory}
            />
            <div className="w-7 shrink-0" />
            <ResultCollectibleCard
              ribbon="بطاقة الخصم"
              ribbonColor={W_RED}
              ribbonDeep={W_RED_DEEP}
              borderColor={W_RED}
              card={effectiveOpponentCard}
              fallbackLabel="بطاقة الخصم"
              categoryLabel={opponentCategory}
            />
            <div className="pointer-events-none absolute left-1/2 top-[52%] z-[5] -translate-x-1/2 -translate-y-1/2">
              <div
                aria-hidden
                className="absolute -inset-2.5 rounded-full"
                style={{
                  background: `radial-gradient(circle, ${W_ORANGE}88 0%, transparent 70%)`,
                  filter: "blur(8px)",
                }}
              />
              <motion.div
                className="relative flex h-[42px] w-[42px] items-center justify-center rounded-full text-[15px] font-black text-white"
                style={{
                  background: `linear-gradient(180deg, ${W_ORANGE} 0%, ${W_ORANGE_DEEP} 100%)`,
                  boxShadow: `0 8px 18px ${W_ORANGE_DEEP}88, inset 0 1.5px 0 rgba(255,255,255,0.5), inset 0 -3px 0 rgba(0,0,0,0.15), 0 0 0 3px #fff`,
                  textShadow: "0 1px 0 rgba(0,0,0,0.2)",
                }}
                animate={{ opacity: [0.92, 1, 0.92] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              >
                VS
              </motion.div>
            </div>
          </div>
        </motion.div>

        {winnerUid ? (
          <ResultStatsPanel
            winnerName={winnerName}
            loserName={loserName}
            winnerCosmetic={winnerCosmetic}
            loserCosmetic={loserCosmetic}
            winnerPhotoURL={winnerPhotoURL}
            winGuessText={winMsg?.text ?? null}
            durationLabel={durationLabel}
            categoryLabel={categoryLabel}
          />
        ) : null}

        <motion.div variants={item} className="mt-auto px-4 pt-4">
          <div className="relative">
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-0.5 rounded-[20px] blur-xl"
              style={{
                background: `radial-gradient(ellipse, ${W_ORANGE}88 0%, transparent 70%)`,
              }}
            />
            <motion.button
              type="button"
              onClick={onReplay}
              disabled={replayBusy}
              whileHover={replayBusy ? {} : { scale: 1.02 }}
              whileTap={replayBusy ? {} : { scale: 0.97 }}
              className="relative flex w-full items-center justify-center gap-2 rounded-[20px] border-0 py-3.5 text-[17px] font-black text-white disabled:opacity-60"
              style={{
                background: `linear-gradient(180deg, ${W_ORANGE} 0%, ${W_ORANGE_DEEP} 100%)`,
                boxShadow: `0 12px 24px ${W_ORANGE_DEEP}66, inset 0 2px 0 rgba(255,255,255,0.45), inset 0 -4px 0 rgba(0,0,0,0.15)`,
                textShadow: "0 1.5px 0 rgba(0,0,0,0.18)",
              }}
            >
              <IconReplay />
              لعب مرة أخرى
            </motion.button>
          </div>

          <motion.button
            type="button"
            onClick={onHome}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-2xl border-0 py-2.5 text-xs font-extrabold"
            style={{
              background: "rgba(255,255,255,0.85)",
              backdropFilter: "blur(16px) saturate(180%)",
              WebkitBackdropFilter: "blur(16px) saturate(180%)",
              boxShadow: `0 8px 18px rgba(180,100,30,0.12), inset 0 1.5px 0 #fff, inset 0 0 0 1px rgba(255,255,255,0.7), 0 0 0 1px ${W_CREAM_DEEP}88`,
              color: W_INK,
            }}
          >
            <IconHome />
            العودة للرئيسية
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
