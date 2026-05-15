"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { memo, useState } from "react";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { getCategoryById } from "@/lib/game/categories";
import type { PlayerCosmetic } from "@/lib/profile/cosmetics";
import type { GameCard } from "@/types";

const CARD_PLACEHOLDER = "/cards/_placeholder.svg";

const S_ORANGE = "#FF8A3D";
const S_ORANGE_DEEP = "#F26A1F";
const S_ORANGE_SOFT = "#FFC58A";
const S_CREAM = "#FFF1DD";
const S_CREAM_DEEP = "#FBE0BD";
const S_INK = "#3A2517";
const S_INK_SOFT = "#7A5A45";
const S_GOLD = "#F2B544";
const S_GOLD_DEEP = "#C8881F";
const S_RED = "#E5524D";
const S_RED_DEEP = "#B8332E";

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
      sizes="(max-width: 420px) 88vw, 400px"
      unoptimized
      onError={() => setErrored(true)}
    />
  );
});

function IconCheck() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path
        d="M2 6l3 3 5-6"
        stroke="#fff"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconGuess() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
      <circle cx="9" cy="9" r="6" stroke="#fff" strokeWidth="2.2" />
      <path d="M13.5 13.5l5.5 5.5" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

function IconTargetRibbon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
      <circle cx="5" cy="5" r="4" fill="none" stroke="#fff" strokeWidth="1.5" />
      <circle cx="5" cy="5" r="1.5" fill="#fff" />
    </svg>
  );
}

function TurnTimerRing({
  secLeft,
  maxSec,
  active,
}: {
  secLeft: number;
  maxSec: number;
  active: boolean;
}) {
  const r = 18;
  const circumference = 2 * Math.PI * r;
  const pct = maxSec > 0 ? Math.max(0, Math.min(1, secLeft / maxSec)) : 0;
  const offset = circumference * (1 - pct);
  const urgent = active && secLeft <= 5;

  return (
    <motion.div className="relative h-[46px] w-[46px] shrink-0">
      <svg width="46" height="46" viewBox="0 0 46 46" className="-rotate-90" aria-hidden>
        <circle
          cx="23"
          cy="23"
          r={r}
          stroke="rgba(255,255,255,0.25)"
          strokeWidth="4"
          fill="rgba(0,0,0,0.15)"
        />
        <circle
          cx="23"
          cy="23"
          r={r}
          stroke={urgent ? "#fecaca" : "#fff"}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 0.2s linear, stroke 0.35s ease",
            filter: urgent ? undefined : `drop-shadow(0 0 4px ${S_GOLD})`,
          }}
        />
      </svg>
      <div
        className="absolute inset-0 flex items-center justify-center font-mono text-base font-black tabular-nums text-white"
        style={{ textShadow: "0 1px 0 rgba(0,0,0,0.25)" }}
      >
        {secLeft}
      </div>
    </motion.div>
  );
}

function VoiceTurnCard({
  headline,
  subline,
  secLeft,
  maxSec,
  myTurn,
}: {
  headline: string;
  subline: string | null;
  secLeft: number | null;
  maxSec: number;
  myTurn: boolean;
}) {
  const showTimer = myTurn && secLeft !== null;

  return (
    <motion.div
      layout
      className="relative min-w-0 flex-1"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-2 rounded-[22px]"
        style={{
          background: `radial-gradient(ellipse, ${myTurn ? `${S_ORANGE}66` : "rgba(180,100,30,0.2)"} 0%, transparent 70%)`,
          filter: "blur(12px)",
        }}
      />
      <div
        className="relative flex items-center gap-2.5 rounded-[18px] px-3 py-2"
        style={{
          background: myTurn
            ? `linear-gradient(180deg, ${S_ORANGE} 0%, ${S_ORANGE_DEEP} 100%)`
            : `linear-gradient(180deg, rgba(255,255,255,0.95) 0%, ${S_CREAM} 100%)`,
          boxShadow: myTurn
            ? `0 10px 22px ${S_ORANGE_DEEP}55, inset 0 1.5px 0 rgba(255,255,255,0.45), inset 0 -3px 0 rgba(0,0,0,0.12)`
            : `0 8px 18px rgba(180,100,30,0.12), inset 0 1.5px 0 #fff, inset 0 0 0 1px ${S_CREAM_DEEP}`,
        }}
      >
        {showTimer ? (
          <TurnTimerRing secLeft={secLeft!} maxSec={maxSec} active={myTurn} />
        ) : null}
        <motion.div layout className="min-w-0 flex-1 text-end">
          <p
            className="text-[17px] font-black leading-tight"
            style={{
              color: myTurn ? "#fff" : S_INK,
              textShadow: myTurn ? "0 1.5px 0 rgba(0,0,0,0.2)" : undefined,
            }}
          >
            {headline}
          </p>
          {subline ? (
            <p
              className="mt-0.5 text-[11px] font-bold leading-snug"
              style={{ color: myTurn ? "rgba(255,255,255,0.88)" : S_INK_SOFT }}
            >
              {subline}
            </p>
          ) : null}
        </motion.div>
      </div>
    </motion.div>
  );
}

function VoiceInstructionPanel({ phase }: { phase: string }) {
  const qPhase = phase === "question";
  return (
    <motion.div
      layout
      className="mx-4 mt-3 rounded-[18px] px-3 py-2.5"
      style={{
        background: "rgba(255,255,255,0.78)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        boxShadow:
          "0 10px 20px rgba(180,100,30,0.10), inset 0 1.5px 0 rgba(255,255,255,0.95), inset 0 0 0 1px rgba(255,255,255,0.6)",
      }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 }}
    >
      <div className="text-end">
        <p className="text-sm font-black leading-snug" style={{ color: S_INK }}>
          تحدّث مع خصمك
        </p>
        <p className="mt-0.5 text-[11px] font-semibold leading-relaxed" style={{ color: S_INK_SOFT }}>
          {qPhase
            ? "اطرح أسئلة «نعم» أو «لا» فقط — المكالمة عبر تطبيقك الخارجي"
            : "أجب بوضوح بالصوت — المكالمة عبر تطبيقك الخارجي"}
        </p>
      </div>
    </motion.div>
  );
}

function VoicePlayerSide({
  label,
  active,
  cosmetic,
  fallbackPhotoURL,
  displayName,
}: {
  label: string;
  active: boolean;
  cosmetic?: PlayerCosmetic | null;
  fallbackPhotoURL?: string | null;
  displayName: string;
}) {
  return (
    <motion.div layout className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
      <div className="relative">
        {active ? (
          <>
            <div
              aria-hidden
              className="absolute -inset-3 rounded-full"
              style={{
                background: `radial-gradient(circle, ${S_ORANGE}55 0%, transparent 70%)`,
                filter: "blur(6px)",
              }}
            />
            <div
              className="voice-conic-spin absolute -inset-1.5 rounded-full"
              style={{
                background: `conic-gradient(from 0deg, ${S_ORANGE}, ${S_GOLD}, ${S_ORANGE}, ${S_GOLD}, ${S_ORANGE})`,
              }}
            />
          </>
        ) : null}
        <div
          className="relative rounded-full p-0.5"
          style={{
            background: active ? "#fff" : "rgba(255,255,255,0.9)",
            boxShadow: active
              ? `0 6px 14px ${S_ORANGE}55`
              : "0 4px 10px rgba(58,37,23,0.12)",
          }}
        >
          <ProfileAvatar
            cosmetic={cosmetic}
            fallbackPhotoURL={fallbackPhotoURL}
            displayName={displayName}
            size="md"
            active={active}
            idle={!active}
            showPulseDot={active}
          />
        </div>
      </div>
      <p
        className="max-w-[88px] truncate text-center text-xs font-extrabold"
        style={{ color: active ? S_INK : S_INK_SOFT }}
      >
        {label}
      </p>
    </motion.div>
  );
}

export type VoiceModePlayingPanelProps = {
  banner: string | null;
  displayName: string;
  opponentName: string;
  opponent: { uid: string; displayName: string } | undefined;
  uid: string | null;
  hostUid: string | undefined;
  isHost: boolean;
  phase: string;
  myTurn: boolean;
  activeActorUid: string | null;
  activeActorName: string;
  voiceTurnHeadline: string | null;
  voiceTurnSub: string | null;
  secLeft: number | null;
  maxPhaseSec: number;
  opponentCard: GameCard | null;
  busy: boolean;
  sendVoiceAck: () => void | Promise<void>;
  openGuessFlow: () => void;
  myCosmetic?: PlayerCosmetic | null;
  opponentCosmetic?: PlayerCosmetic | null;
  myPhotoURL?: string | null;
};

export function VoiceModePlayingPanel({
  banner,
  displayName,
  opponentName,
  opponent,
  uid,
  phase,
  myTurn,
  activeActorUid,
  voiceTurnHeadline,
  voiceTurnSub,
  secLeft,
  maxPhaseSec,
  opponentCard,
  busy,
  sendVoiceAck,
  openGuessFlow,
  myCosmetic,
  opponentCosmetic,
  myPhotoURL,
}: VoiceModePlayingPanelProps) {
  const qPhase = phase === "question";
  const catName = opponentCard?.categoryId
    ? (getCategoryById(opponentCard.categoryId)?.nameAr ?? null)
    : null;

  const turnHeadline =
    voiceTurnHeadline ??
    (myTurn ? (qPhase ? "دورك الآن · اسأل!" : "دورك الآن · أجب!") : `دور ${activeActorUid === uid ? displayName : opponentName}`);

  const turnSubline =
    myTurn && secLeft !== null
      ? `${secLeft} ثانية متبقية`
      : voiceTurnSub;

  const iAmActive = Boolean(uid && activeActorUid === uid);
  const opponentActive = Boolean(opponent && activeActorUid === opponent.uid);

  return (
    <motion.div
      layout
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
      dir="rtl"
    >
      <AnimatePresence>
        {banner ? (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mx-4 mt-1 shrink-0 rounded-2xl border px-4 py-2 text-center text-xs font-bold"
            style={{
              borderColor: `${S_ORANGE_SOFT}cc`,
              background: "linear-gradient(135deg,#fff7e8,#fff0d8)",
              color: "#9a5f2d",
            }}
          >
            {banner}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Turn card — full width, no side voice/mic controls */}
      <div className="shrink-0 px-4 pt-2">
        <VoiceTurnCard
          headline={turnHeadline}
          subline={turnSubline}
          secLeft={secLeft}
          maxSec={maxPhaseSec}
          myTurn={myTurn}
        />
      </div>

      {/* Opponent card — hero */}
      <div className="relative mx-4 mt-4 flex min-h-0 flex-1 flex-col">
        <span
          aria-hidden
          className="pointer-events-none absolute start-3 top-2 select-none text-[28px] font-black"
          style={{ color: S_ORANGE_SOFT, opacity: 0.3, transform: "rotate(-18deg)" }}
        >
          ؟
        </span>
        <span
          aria-hidden
          className="pointer-events-none absolute end-2 top-16 select-none text-xl font-black"
          style={{ color: S_ORANGE_SOFT, opacity: 0.3, transform: "rotate(14deg)" }}
        >
          ؟
        </span>

        <div className="relative z-[5] mb-[-10px] flex justify-center">
          <div
            className="flex items-center gap-1.5 rounded-[10px] px-5 py-1.5 text-xs font-black text-white"
            style={{
              background: `linear-gradient(180deg, ${S_RED} 0%, ${S_RED_DEEP} 100%)`,
              boxShadow: `0 8px 16px ${S_RED_DEEP}66, inset 0 1.5px 0 rgba(255,255,255,0.4), inset 0 -2px 0 rgba(0,0,0,0.15)`,
              textShadow: "0 1px 0 rgba(0,0,0,0.2)",
            }}
          >
            <IconTargetRibbon />
            بطاقة الخصم
          </div>
        </div>

        <motion.div
          layout
          className="relative flex min-h-0 flex-1 flex-col"
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -inset-5 rounded-[32px]"
            style={{
              background: `radial-gradient(ellipse, ${S_ORANGE}55 0%, ${S_GOLD}33 30%, transparent 70%)`,
              filter: "blur(18px)",
            }}
            animate={{ opacity: [0.6, 0.9, 0.6] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          />
          <div
            className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[26px] p-2.5"
            style={{
              background: `linear-gradient(160deg, #fff 0%, ${S_CREAM} 60%, ${S_CREAM_DEEP} 100%)`,
              boxShadow: `0 18px 36px rgba(180,100,30,0.22), inset 0 2px 0 #fff, inset 0 -3px 0 ${S_CREAM_DEEP}, 0 0 0 2px ${S_ORANGE}33`,
            }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -end-10 -top-5 h-[360px] w-[100px] rotate-[18deg]"
              style={{
                background:
                  "linear-gradient(110deg, transparent, rgba(255,255,255,0.6), transparent)",
              }}
            />
            <div
              className="relative min-h-0 flex-1 overflow-hidden rounded-[20px]"
              style={{
                background:
                  "linear-gradient(180deg, #FFF6E5 0%, #FFE8BF 100%)",
                boxShadow:
                  "inset 0 2px 0 rgba(255,255,255,0.45), inset 0 -6px 14px rgba(0,0,0,0.12)",
              }}
            >
              {opponentCard?.imageUrl ? (
                <CardImage
                  src={opponentCard.imageUrl}
                  alt={opponentCard.nameAr || "بطاقة الخصم"}
                />
              ) : (
                <div className="flex h-full min-h-[200px] items-center justify-center">
                  <span
                    className="text-5xl font-black"
                    style={{
                      background: `linear-gradient(180deg, #fff 0%, ${S_GOLD} 100%)`,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    ؟
                  </span>
                </div>
              )}
              <div
                className="absolute inset-x-2 bottom-2 flex items-center justify-between gap-2 rounded-[14px] px-3 py-1.5"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(58,37,23,0.92) 0%, rgba(34,20,12,0.96) 100%)",
                  backdropFilter: "blur(8px)",
                  boxShadow:
                    "inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 12px rgba(0,0,0,0.18)",
                }}
              >
                {catName ? (
                  <span
                    className="shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-black"
                    style={{
                      background: `linear-gradient(180deg, ${S_GOLD} 0%, ${S_GOLD_DEEP} 100%)`,
                      color: S_INK,
                    }}
                  >
                    {catName}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-white/70">بدون فئة</span>
                )}
                <p className="min-w-0 truncate text-end text-xl font-black text-white">
                  {opponentCard?.nameAr ?? "…"}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <VoiceInstructionPanel phase={phase} />

      {/* Actions: تم السؤال + تخمين (hint/guess) */}
      <div
        className="flex shrink-0 items-center gap-2.5 px-4 pt-3"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 4px)" }}
      >
        <div className="relative min-w-0 flex-1">
          {myTurn ? (
            <>
              <motion.div
                aria-hidden
                className="pointer-events-none absolute -inset-0.5 rounded-[18px] blur-xl"
                style={{
                  background: `radial-gradient(ellipse, ${S_ORANGE}77 0%, transparent 70%)`,
                }}
                animate={{ opacity: [0.5, 0.85, 0.5] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.button
                type="button"
                disabled={busy}
                whileTap={{ scale: 0.97 }}
                onClick={() => void sendVoiceAck()}
                className="relative flex w-full items-center justify-center gap-2 rounded-[18px] border-0 py-3.5 text-base font-black text-white disabled:opacity-55"
                style={{
                  background: `linear-gradient(180deg, ${S_ORANGE} 0%, ${S_ORANGE_DEEP} 100%)`,
                  boxShadow: `0 10px 22px ${S_ORANGE_DEEP}66, inset 0 2px 0 rgba(255,255,255,0.45), inset 0 -4px 0 rgba(0,0,0,0.15), 0 0 0 1.5px ${S_GOLD}55`,
                  textShadow: "0 1.5px 0 rgba(0,0,0,0.2)",
                }}
              >
                <span
                  className="flex h-[22px] w-[22px] items-center justify-center rounded-full"
                  style={{
                    background: "rgba(255,255,255,0.28)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4)",
                  }}
                >
                  <IconCheck />
                </span>
                {qPhase ? "تم السؤال" : "تمت الإجابة"}
              </motion.button>
            </>
          ) : (
            <div
              className="rounded-[18px] px-4 py-3 text-center text-sm font-bold leading-relaxed"
              style={{
                background: "rgba(255,255,255,0.85)",
                color: S_INK_SOFT,
                boxShadow: `inset 0 0 0 1px ${S_CREAM_DEEP}`,
              }}
            >
              {qPhase ? `بانتظار سؤال ${opponentName}…` : `بانتظار إجابة ${opponentName}…`}
            </div>
          )}
        </div>

        <div className="relative shrink-0">
          <div
            aria-hidden
            className="absolute -inset-1 rounded-full"
            style={{
              background: `radial-gradient(circle, ${S_GOLD}88 0%, transparent 70%)`,
              filter: "blur(8px)",
            }}
          />
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={openGuessFlow}
            aria-label="تخمين"
            className="relative flex h-[60px] w-[60px] flex-col items-center justify-center rounded-full border-0"
            style={{
              background: `linear-gradient(180deg, ${S_GOLD} 0%, ${S_GOLD_DEEP} 100%)`,
              boxShadow: `0 10px 20px ${S_GOLD_DEEP}66, inset 0 2px 0 rgba(255,255,255,0.5), inset 0 -3px 0 rgba(0,0,0,0.15)`,
            }}
          >
            <IconGuess />
            <span className="mt-[-2px] text-[9px] font-black text-white">تخمين</span>
          </motion.button>
        </div>
      </div>

      {/* Versus strip */}
      <div className="mx-3.5 mt-2 shrink-0 pb-1">
        <div
          className="relative rounded-[22px] px-4 pb-3.5 pt-5"
          style={{
            background: "rgba(255,255,255,0.55)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            boxShadow:
              "0 12px 24px rgba(180,100,30,0.10), inset 0 1.5px 0 rgba(255,255,255,0.9), inset 0 0 0 1px rgba(255,255,255,0.6)",
          }}
        >
          {myTurn ? (
            <div className="absolute -top-2.5 left-1/2 z-[2] -translate-x-1/2">
              <span
                className="rounded-[10px] px-3.5 py-1 text-[11px] font-black text-white"
                style={{
                  background: `linear-gradient(180deg, ${S_ORANGE} 0%, ${S_ORANGE_DEEP} 100%)`,
                  boxShadow: `0 6px 14px ${S_ORANGE}66, inset 0 1px 0 rgba(255,255,255,0.4), 0 0 0 2px #fff`,
                }}
              >
                دورك
              </span>
            </div>
          ) : null}
          <div className="flex items-center gap-2.5">
            <VoicePlayerSide
              label="أنت"
              active={iAmActive}
              cosmetic={myCosmetic}
              fallbackPhotoURL={myPhotoURL}
              displayName={displayName}
            />
            <div className="relative shrink-0">
              <div
                aria-hidden
                className="absolute -inset-2 rounded-full"
                style={{
                  background: `radial-gradient(circle, ${S_ORANGE}66 0%, transparent 70%)`,
                  filter: "blur(8px)",
                }}
              />
              <div
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-sm font-black text-white"
                style={{
                  background: `linear-gradient(180deg, ${S_INK} 0%, #1F1208 100%)`,
                  boxShadow: `0 6px 14px rgba(0,0,0,0.3), inset 0 1.5px 0 rgba(255,255,255,0.2), 0 0 0 3px #fff, 0 0 0 4px ${S_ORANGE}44`,
                }}
              >
                VS
              </div>
            </div>
            <VoicePlayerSide
              label={opponentName}
              active={opponentActive}
              cosmetic={opponentCosmetic}
              displayName={opponentName}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
