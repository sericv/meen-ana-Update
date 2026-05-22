"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { memo, useEffect, useMemo, useState } from "react";
import { ConfettiBurst } from "@/components/game/ConfettiBurst";
import { CoinDisplay } from "@/components/ui/CoinDisplay";
import { useLiveUserProfile } from "@/hooks/useLiveUserProfile";
import { postGame } from "@/lib/api/game-client";
import { XP_PER_LOSS, XP_PER_WIN, xpProgressInCurrentLevel } from "@/lib/profile/level";
import { getCategoryById } from "@/lib/game/categories";
import type { PlayerCosmetic } from "@/lib/profile/cosmetics";
import type { AwardMatchRewardsResult } from "@/lib/game/match-rewards";
import type { ChatMessage, GameCard } from "@/types";

const CARD_PLACEHOLDER = "/cards/_placeholder.svg";

const W_ORANGE = "#FF8A3D";
const W_ORANGE_DEEP = "#F26A1F";
const W_ORANGE_SOFT = "#FFC58A";
const W_CREAM = "#FFF1DD";
const W_INK = "#3A2517";
const W_INK_SOFT = "#7A5A45";
const W_GOLD = "#F2B544";
const W_GOLD_DEEP = "#C8881F";
const W_GREEN = "#3FB87A";
const W_SAGE = "#5a9a7a";

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

const CardImg = memo(function CardImgInner({ src, alt }: { src: string; alt: string }) {
  const [errored, setErrored] = useState(false);
  const finalSrc = errored || !src ? CARD_PLACEHOLDER : src;
  return (
    <Image
      src={finalSrc}
      alt={alt}
      fill
      className="object-cover object-center"
      sizes="70px"
      unoptimized
      onError={() => setErrored(true)}
    />
  );
});

function ResultMiniCard({
  title,
  category,
  imageUrl,
  tilt = 0,
}: {
  title: string;
  category: string | null;
  imageUrl?: string;
  tilt?: number;
}) {
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-xl border border-[rgba(255,138,61,0.28)]"
      style={{
        width: 70,
        height: 98,
        transform: `rotate(${tilt}deg)`,
        background: "linear-gradient(160deg,#fff 0%,#fff1dd 48%,#fbe0bd 100%)",
        boxShadow: "0 10px 22px rgba(180,100,30,0.2), inset 0 1px 0 #fff",
      }}
    >
      <motion.div className="relative h-[62%] w-full">
        {imageUrl ? <CardImg src={imageUrl} alt={title} /> : null}
      </motion.div>
      <div className="px-1.5 py-1 text-center">
        <p className="truncate text-[9px] font-extrabold" style={{ color: W_INK }}>
          {title}
        </p>
        {category ? (
          <p className="truncate text-[7px] font-semibold" style={{ color: W_INK_SOFT }}>
            {category}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function ResultSurf({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div
      className={`rounded-2xl border border-[rgba(244,196,141,0.45)] bg-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_8px_24px_rgba(196,134,82,0.12)] ${className}`}
      style={style}
    >
      {children}
    </motion.div>
  );
}

function RewardTile({
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
      className="flex items-center gap-2.5 rounded-xl border p-3"
      style={{
        background: amber
          ? "linear-gradient(160deg, #fff4e0, #ffe8c8)"
          : "linear-gradient(160deg, #eef8f2, #e0f0e8)",
        borderColor: amber ? "rgba(200,130,60,0.4)" : "rgba(90,154,122,0.35)",
      }}
    >
      <motion.div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[rgba(244,196,141,0.4)] bg-white/90">
        {icon}
      </motion.div>
      <div>
        <p className="text-[11px] font-semibold" style={{ color: W_INK_SOFT }}>
          {label}
        </p>
        <p className="text-lg font-black" style={{ color: W_INK }}>
          {value}
        </p>
      </div>
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-[rgba(244,196,141,0.35)] bg-white/70 px-1.5 py-2.5">
      <p className="text-lg font-black tabular-nums" style={{ color: W_INK }}>
        {value}
      </p>
      <p className="text-[10px] font-semibold" style={{ color: W_INK_SOFT }}>
        {label}
      </p>
    </div>
  );
}

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
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
      <path
        d="M11 2l2.4 5.8 6.2.5-4.7 4 1.4 6.1L11 15.8 6.7 18.4l1.4-6.1-4.7-4 6.2-.5L11 2z"
        fill={W_SAGE}
      />
    </svg>
  );
}

function IconFlame() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
      <path
        d="M11 20c4-2.5 6-5.5 6-9a5.5 5.5 0 0 0-6-5.3C9 8.5 7 10 7 12.5 7 14 8 15.5 9 16.5 8 14.5 8 12 9.5 10.5 10.5 9 10 7.5 8.5 7.5 6.5 8 5 9.5 4 11 4 14.5 6 17.5 11 20z"
        fill={W_INK}
      />
    </svg>
  );
}

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
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            background: W_ORANGE_SOFT,
          }}
          animate={{ y: [0, -120, -240], opacity: [0, 0.7, 0] }}
          transition={{
            duration: p.dur,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

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

  const myTitle = myCard?.nameAr || myCard?.name || "—";
  const oppTitle =
    effectiveOpponentCard?.nameAr || effectiveOpponentCard?.name || opponentName || "—";
  const myCategory = myCard?.categoryId
    ? (getCategoryById(myCard.categoryId)?.nameAr ?? null)
    : null;
  const oppCategory = effectiveOpponentCard?.categoryId
    ? (getCategoryById(effectiveOpponentCard.categoryId)?.nameAr ?? null)
    : null;

  const [show, setShow] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [rewards, setRewards] = useState<AwardMatchRewardsResult | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setShow(true), 80);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!iWon) return;
    const t = window.setTimeout(() => setShowConfetti(true), 200);
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
    return () => {
      cancelled = true;
    };
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

  const hintCount = toolsUsed;

  const xp = liveProfile?.progress.xp ?? 0;
  const matchWins = rewards?.matchWins ?? liveProfile?.progress.matchWins ?? 0;
  const { level, xpInLevel, xpToNext, pct: levelPct } = xpProgressInCurrentLevel(xp);
  const levelPctAnimated = show ? levelPct : Math.max(0, levelPct - 8);

  const headline = iWon ? (forfeitWin ? "فزت!" : "أحسنت!") : "خسارة";
  const subline = iWon
    ? forfeitWin
      ? "فزت بانسحاب الخصم"
      : guessLimitWin
        ? "فزت — استنفد الخصم محاولات التخمين"
        : "فزت بالمباراة • خمّنت كرتك في الوقت"
    : guessLimitWin
      ? "استنفدت محاولات التخمين"
      : forfeitWin
        ? "غادر خصمك المباراة"
        : "في المرة القادمة تنجح إن شاء الله";

  const coinReward = rewards?.coinsAwarded ?? (iWon ? 1 : 0);
  const xpReward = rewards?.xpAwarded ?? (iWon ? XP_PER_WIN : XP_PER_LOSS);
  const bonusLabel = rewards?.bonusLabelAr ?? null;

  const shortRoom = roomId ? roomId.slice(-4).toUpperCase() : "—";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      dir="rtl"
      className="match-result-screen absolute inset-0 z-50 flex min-h-0 w-full flex-col overflow-hidden"
      style={{
        background: iWon
          ? "radial-gradient(900px 600px at 50% -10%, rgba(255,220,160,0.85), transparent), linear-gradient(180deg, #fff9f0, #fce8d2)"
          : "radial-gradient(900px 600px at 50% -10%, rgba(255,200,180,0.75), transparent), linear-gradient(180deg, #fff9f0, #fce8d2)",
      }}
    >
      <FloatingEmbers count={iWon ? 24 : 10} />
      {iWon && showConfetti ? <ConfettiBurst active /> : null}

      <header className="relative z-10 flex shrink-0 items-center justify-between px-4 pb-1 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={onHome}
          className="rounded-xl bg-white/80 p-2 shadow-sm"
          aria-label="إغلاق"
        >
          <IconClose />
        </button>
        <span className="text-xs font-semibold tabular-nums" style={{ color: W_INK_SOFT }}>
          المباراة #{shortRoom}
        </span>
        <span className="w-9" aria-hidden />
      </header>

      <div className="relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-contain px-[18px] pb-2">
        <div className="pt-2 text-center">
          <div
            style={{
              display: "inline-block",
              transform: show ? "scale(1)" : "scale(0.6)",
              opacity: show ? 1 : 0,
              transition: "all 0.6s cubic-bezier(0.2, 1.4, 0.3, 1)",
            }}
          >
            <h1
              className="text-[clamp(2.25rem,11vw,3.2rem)] font-black leading-none"
              style={{
                background: iWon
                  ? `linear-gradient(180deg, ${W_ORANGE}, ${W_ORANGE_DEEP})`
                  : "linear-gradient(180deg, #c45a4a, #8a3028)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: iWon
                  ? "drop-shadow(0 2px 8px rgba(255,160,60,0.35))"
                  : "drop-shadow(0 2px 8px rgba(180,80,60,0.3))",
              }}
            >
              {headline}
            </h1>
            <p className="mt-2 text-sm font-semibold" style={{ color: W_INK_SOFT }}>
              {subline}
            </p>
          </div>
        </div>

        <ResultSurf className="mt-4 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold" style={{ color: W_INK_SOFT }}>
                كرتي كان
              </p>
              <p className="truncate text-2xl font-black" style={{ color: W_INK }}>
                {myTitle}
              </p>
            </div>
            <ResultMiniCard
              title={myTitle}
              category={myCategory}
              imageUrl={myCard?.imageUrl}
              tilt={-6}
            />
          </div>
          <motion.div
            className="mt-3 flex items-start justify-between gap-3 border-t pt-3"
            style={{ borderColor: "rgba(244,196,141,0.45)" }}
          >
            <div className="min-w-0">
              <p className="text-[11px] font-bold" style={{ color: W_INK_SOFT }}>
                كرت الخصم
              </p>
              <p className="truncate text-2xl font-black" style={{ color: W_INK }}>
                {oppTitle}
              </p>
            </div>
            <ResultMiniCard
              title={oppTitle}
              category={oppCategory}
              imageUrl={effectiveOpponentCard?.imageUrl}
              tilt={6}
            />
          </motion.div>
        </ResultSurf>

        <ResultSurf className="mt-3 p-4">
          <h2 className="text-base font-extrabold" style={{ color: W_INK }}>
            المكافآت
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <RewardTile
              accent="amber"
              label="عملات"
              value={coinReward > 0 ? `+${coinReward}` : "—"}
              icon={<CoinDisplay amount={coinReward || 0} size="sm" />}
            />
            <RewardTile
              accent="sage"
              label="خبرة"
              value={`+${xpReward} XP`}
              icon={<IconStar />}
            />
          </div>
          {bonusLabel && coinReward > 0 ? (
            <p
              className="mt-2.5 rounded-xl border px-3 py-2 text-center text-xs font-extrabold"
              style={{
                borderColor: "rgba(200,130,60,0.45)",
                color: W_INK,
                background: "linear-gradient(180deg, #fff4e0, #ffe8c8)",
              }}
            >
              {bonusLabel}
            </p>
          ) : null}
          <div className="mt-3">
            <motion.div className="flex items-center justify-between text-xs font-semibold" style={{ color: W_INK_SOFT }}>
              <span>المستوى {level}</span>
              <span className="tabular-nums">
                {xpInLevel} / {xpToNext} XP
              </span>
            </motion.div>
            <div
              className="relative mt-1.5 h-2 overflow-hidden rounded-full"
              style={{ background: "rgba(58,37,23,0.12)" }}
            >
              <div
                className="h-full rounded-full transition-[width] duration-1000 ease-out"
                style={{
                  width: `${levelPctAnimated}%`,
                  background: `linear-gradient(90deg, ${W_GOLD}, ${W_GOLD_DEEP})`,
                  boxShadow: `0 0 8px ${W_GOLD}`,
                  transitionDelay: "0.4s",
                }}
              />
            </div>
          </div>
        </ResultSurf>

        <ResultSurf className="mt-3 p-3.5">
          <h2 className="text-base font-extrabold" style={{ color: W_INK }}>
            إحصائيات المباراة
          </h2>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <StatCell label="الأسئلة" value={String(questionCount)} />
            <StatCell label="التلميحات والأدوات" value={String(hintCount)} />
            <StatCell label="المدة" value={durationLabel} />
          </div>
        </ResultSurf>

        {iWon && matchWins >= 2 ? (
          <ResultSurf
            className="mt-3 flex items-center gap-3 p-3.5"
            style={{
              background: "linear-gradient(180deg, #fff4e0, #ffe0b8)",
              borderColor: "rgba(200,130,60,0.45)",
            }}
          >
            <div
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
              style={{
                background: `linear-gradient(180deg, ${W_GOLD}, ${W_GOLD_DEEP})`,
                boxShadow: `0 4px 14px ${W_GOLD_DEEP}55`,
              }}
            >
              <IconFlame />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-extrabold" style={{ color: W_INK }}>
                سلسلة فوز ×{Math.min(matchWins, 9)}
              </p>
              <p className="text-xs font-semibold" style={{ color: W_INK_SOFT }}>
                فز مرة أخرى لتحصل على مكافآت إضافية في المتجر
              </p>
            </div>
          </ResultSurf>
        ) : null}
      </div>

      <footer className="relative z-10 flex shrink-0 gap-2.5 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
        <button
          type="button"
          onClick={onHome}
          className="flex-1 rounded-2xl border border-[rgba(244,196,141,0.5)] bg-white/90 py-3.5 text-sm font-extrabold"
          style={{ color: W_INK }}
        >
          القائمة
        </button>
        <button
          type="button"
          onClick={onReplay}
          disabled={replayBusy}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-extrabold text-white disabled:opacity-55"
          style={{
            background: `linear-gradient(180deg, ${W_ORANGE}, ${W_ORANGE_DEEP})`,
            boxShadow: `0 8px 20px ${W_ORANGE_DEEP}55, inset 0 1px 0 rgba(255,255,255,0.4)`,
          }}
        >
          <IconRefresh />
          إعادة
        </button>
      </footer>
    </motion.div>
  );
}
