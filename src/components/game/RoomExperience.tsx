"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import type { CSSProperties, MouseEvent } from "react";
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Panel } from "@/components/ui/Panel";
import {
  playCountdownTick,
  playDefeatTone,
  playGuessChime,
  playMessagePop,
  playTurnCue,
  playWinSparkle,
  resumeAudioContext,
} from "@/lib/audio/game-sounds";
import { postGame } from "@/lib/api/game-client";
import { isOpponentCustomCardComplete } from "@/lib/custom-cards/opponent-card-gate";
import { processCardImageFile } from "@/lib/custom-cards/process-image";
import {
  ANSWER_PHASE_SECONDS,
  QUESTION_PHASE_SECONDS,
} from "@/lib/game/constants";
import { getCategoryById } from "@/lib/game/categories";
import { generateGuessAliases } from "@/lib/game/guess-alias-generator";
import { setPlayerReady } from "@/lib/firestore/rooms.client";
import { useRoomWire } from "@/hooks/useRoomWire";
import { useRouter } from "next/navigation";
import { ConfettiBurst } from "@/components/game/ConfettiBurst";
import type { GameCard, ChatMessage } from "@/types";

type Props = { roomId: string };

const CARD_PLACEHOLDER = "/cards/_placeholder.svg";

function CardImage({
  src,
  alt,
  fit = "cover",
}: {
  src: string;
  alt: string;
  fit?: "cover" | "contain";
}) {
  const [errored, setErrored] = useState(false);
  const finalSrc = errored || !src ? CARD_PLACEHOLDER : src;
  return (
    <Image
      src={finalSrc}
      alt={alt}
      fill
      className={fit === "contain" ? "object-contain" : "object-cover"}
      sizes="(max-width: 512px) 100vw, 512px"
      unoptimized
      onError={() => setErrored(true)}
    />
  );
}

function CircularTimer({
  secLeft,
  maxSec,
  active,
  size = "default",
}: {
  secLeft: number;
  maxSec: number;
  active: boolean;
  size?: "default" | "large";
}) {
  const dim = size === "large" ? 92 : 68;
  const r = size === "large" ? 38 : 28;
  const stroke = size === "large" ? 7 : 6;
  const cx = dim / 2;
  const circumference = 2 * Math.PI * r;
  const pct = maxSec > 0 ? Math.max(0, Math.min(1, secLeft / maxSec)) : 0;
  const dash = circumference * pct;
  const urgent = secLeft <= 5 && active;
  const fontSize = size === "large" ? "text-3xl" : "text-xl";

  const wrap = (
    <div className={`relative shrink-0`} style={{ width: dim, height: dim }}>
      <svg
        className="absolute inset-0 -rotate-90"
        width={dim}
        height={dim}
        viewBox={`0 0 ${dim} ${dim}`}
      >
        <circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke={active ? "rgba(255,255,255,0.35)" : "#e8d5b5"}
          strokeWidth={stroke}
        />
        <circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke={urgent ? "#ef4444" : active ? "white" : "#c5a77a"}
          strokeWidth={stroke}
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.2s linear, stroke 0.4s" }}
        />
      </svg>
      <div
        className={`absolute inset-0 flex items-center justify-center font-mono font-black tabular-nums ${fontSize} ${
          urgent ? "text-red-400" : active ? "text-white" : "text-[#9b8060]"
        }`}
      >
        {secLeft}
      </div>
    </div>
  );

  if (size !== "large" || !urgent) return wrap;

  return (
    <motion.div
      animate={{ scale: [1, 1.04, 1] }}
      transition={{ duration: 0.55, repeat: Infinity, ease: "easeInOut" }}
    >
      {wrap}
    </motion.div>
  );
}

/** Compact avatar chip for voice-mode player row (visual only). */
function VoicePlayerChip({
  name,
  active,
  host,
}: {
  name: string;
  active: boolean;
  host?: boolean;
}) {
  return (
    <div className={`flex min-w-0 flex-col items-center gap-1.5 ${active ? "" : "opacity-[0.72]"}`}>
      <div className="relative">
        {active ? (
          <motion.div
            aria-hidden
            animate={{ opacity: [0.45, 0.85, 0.45], scale: [0.92, 1.08, 0.92] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -inset-1.5 rounded-full blur-xl"
            style={{ background: "rgba(255,149,0,0.55)" }}
          />
        ) : (
          <div
            aria-hidden
            className="absolute -inset-1 rounded-full opacity-40 blur-md"
            style={{ background: "rgba(196,134,82,0.25)" }}
          />
        )}
        <div
          className="relative flex h-[52px] w-[52px] items-center justify-center overflow-hidden rounded-full sm:h-[58px] sm:w-[58px]"
          style={{
            background: active
              ? "linear-gradient(145deg,#fff8e8 0%,#ffc978 100%)"
              : "linear-gradient(145deg,#FFF8EE 0%,#ffe4c4 100%)",
            boxShadow: active
              ? "0 0 0 3px rgba(255,200,80,0.85), 0 8px 22px rgba(255,130,0,0.38)"
              : "0 0 0 2.5px rgba(244,196,141,0.45), 0 6px 14px rgba(196,134,82,0.18)",
          }}
        >
          <svg viewBox="0 0 48 48" fill="none" className="h-8 w-8 sm:h-9 sm:w-9" aria-hidden>
            <circle cx="24" cy="18" r="9" fill={active ? "rgba(255,130,0,0.92)" : "rgba(200,150,100,0.35)"} />
            <ellipse cx="24" cy="38" rx="12" ry="8" fill={active ? "rgba(255,130,0,0.92)" : "rgba(200,150,100,0.30)"} />
            {active && (
              <>
                <circle cx="21" cy="17.5" r="1.5" fill="#fff" />
                <circle cx="27" cy="17.5" r="1.5" fill="#fff" />
                <path d="M21 22 q3 2.8 6 0" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" fill="none" />
              </>
            )}
          </svg>
          <span aria-hidden className="pointer-events-none absolute inset-x-2 top-1 h-1.5 rounded-full bg-white/45 blur-[1px]" />
        </div>
        {host ? (
          <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-base leading-none">👑</span>
        ) : null}
        {active ? (
          <motion.span
            animate={{ scale: [1, 1.25, 1], opacity: [1, 0.75, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-400 ring-2 ring-white"
          />
        ) : null}
      </div>
      <p className="max-w-[104px] truncate text-center text-[11px] font-extrabold text-[#8a3f16] sm:text-xs">
        {name}
      </p>
    </div>
  );
}

/** Voice-only gameplay surface — no chat; relies on external voice comms. */
function VoiceModePlayingPanel({
  banner,
  displayName,
  opponentName,
  opponent,
  uid,
  hostUid,
  isHost,
  phase,
  myTurn,
  activeActorUid,
  activeActorName,
  voiceTurnHeadline,
  voiceTurnSub,
  secLeft,
  maxPhaseSec,
  opponentCard,
  busy,
  sendVoiceAck,
  openGuessFlow,
}: {
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
}) {
  const qPhase = phase === "question";
  const aPhase = phase === "answer";

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden pt-1">
      <AnimatePresence>
        {banner ? (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex-shrink-0 rounded-2xl border border-[#f4c48d] bg-[#fff2de] px-4 py-2 text-center text-xs font-bold text-[#9a5f2d] sm:text-sm"
          >
            {banner}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="flex shrink-0 items-start justify-between gap-3 px-0.5">
        <VoicePlayerChip name={displayName} active={Boolean(uid && activeActorUid === uid)} host={isHost} />
        <div className="flex flex-col items-center justify-center pt-7">
          <span className="rounded-full bg-white/85 px-2.5 py-1 text-[10px] font-black text-[#d97706] shadow-sm ring-1 ring-[#fcd34d]/65">
            VS
          </span>
        </div>
        <VoicePlayerChip
          name={opponentName}
          active={Boolean(opponent && activeActorUid === opponent.uid)}
          host={Boolean(opponent && hostUid === opponent.uid)}
        />
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-center gap-2 px-1">
        <span
          className={`rounded-full px-3 py-1.5 text-[11px] font-black sm:text-xs ${
            qPhase ? "bg-[#ede9fe] text-[#5b21b6] ring-2 ring-[#c4b5fd]" : "bg-[#fff8ee] text-[#bc7a45] ring-1 ring-[#f4d4af]"
          }`}
        >
          مرحلة السؤال
        </span>
        <span
          className={`rounded-full px-3 py-1.5 text-[11px] font-black sm:text-xs ${
            aPhase ? "bg-[#dcfce7] text-[#166534] ring-2 ring-[#86efac]" : "bg-[#fff8ee] text-[#bc7a45] ring-1 ring-[#f4d4af]"
          }`}
        >
          مرحلة الإجابة
        </span>
        <span className="rounded-full bg-gradient-to-l from-[#fff7ed] to-[#ffedd5] px-3 py-1.5 text-[11px] font-extrabold text-[#c2410c] ring-1 ring-[#fdba74]/70">
          جولة التخمين
        </span>
      </div>

      <div className="rounded-2xl bg-white/55 px-3 py-2 text-center shadow-[inset_0_0_0_1px_rgba(244,196,141,0.45)] backdrop-blur-[2px]">
        <p className="text-[11px] font-bold text-[#bc7a45] sm:text-xs">
          الحالة:{" "}
          <span className="font-black text-[#8a3f16]">
            {qPhase ? "وقت الأسئلة الصوتية" : "وقت الإجابات الصوتية"}
            {myTurn ? " · دورك" : ` · دور ${activeActorName}`}
          </span>
        </p>
        <p className="mt-0.5 text-[10px] font-semibold leading-snug text-[#b45309]">
          {myTurn
            ? qPhase
              ? "بعد أن تنهي سؤالك بالصوت مع الخصم، اضغط «تم السؤال»."
              : "بعد أن تجيب بالصوت، اضغط «تمت الإجابة»."
            : qPhase
              ? `انتظر حتى يطرح ${opponentName} سؤاله بالصوت.`
              : `انتظر إجابة ${opponentName} بالصوت.`}
        </p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`vp-${myTurn}-${phase}`}
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          transition={{ type: "spring", stiffness: 280, damping: 24 }}
          className={`relative shrink-0 overflow-hidden rounded-[2rem] ${myTurn ? "shadow-[0_0_42px_rgba(255,150,40,.38)]" : ""}`}
          style={
            myTurn
              ? {
                  background: "linear-gradient(145deg,#FF9F0A 0%,#FF5500 100%)",
                  boxShadow:
                    "inset 0 3px 0 rgba(255,255,255,0.38), 0 0 0 3px rgba(255,200,80,0.32), 0 14px 40px rgba(255,100,0,0.32)",
                }
              : {
                  background: "linear-gradient(145deg,#FFFDF9 0%,#FFF1DE 100%)",
                  boxShadow:
                    "inset 0 2px 0 rgba(255,255,255,0.88), 0 0 0 2px rgba(244,196,141,0.48), 0 10px 26px rgba(196,134,82,0.12)",
                }
          }
        >
          {myTurn ? (
            <motion.div
              aria-hidden
              animate={{ opacity: [0.22, 0.52, 0.22] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 120% 80% at 50% -20%,rgba(255,235,120,0.52),transparent 55%)",
              }}
            />
          ) : null}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-10 top-3 h-2 rounded-full bg-white/30 blur-[2px]"
          />

          <div className="relative flex flex-col items-stretch gap-4 px-4 py-4 sm:flex-row sm:items-center sm:gap-5 sm:px-6 sm:py-5">
            <div className="min-w-0 flex-1 text-center sm:text-right">
              <p
                className={`text-[11px] font-black uppercase tracking-[0.14em] ${myTurn ? "text-orange-100/95" : "text-[#bc7a45]"}`}
              >
                دور {activeActorName}
              </p>
              <p
                className={`mt-1 text-2xl font-black leading-tight sm:text-3xl ${myTurn ? "text-white" : "text-[#8a3f16]"}`}
                style={myTurn ? { textShadow: "0 2px 0 rgba(0,0,0,0.18)" } : undefined}
              >
                {voiceTurnHeadline ?? "—"}
              </p>
              <p className={`mt-1 text-sm font-semibold ${myTurn ? "text-orange-50/95" : "text-[#a16231]"}`}>
                {voiceTurnSub ?? ""}
              </p>
            </div>
            <div className="flex justify-center sm:mr-auto">
              {secLeft !== null ? (
                <CircularTimer secLeft={secLeft} maxSec={maxPhaseSec} active={myTurn} size="large" />
              ) : null}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex min-h-0 flex-1 items-center justify-center py-1">
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="w-[min(40vw,160px)] shrink-0 sm:w-[180px] lg:w-[192px]"
        >
          <div className="mb-1.5 flex justify-center">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold sm:text-[11px]"
              style={{
                background: "linear-gradient(135deg,#FFF8EE,#FFEDD8)",
                boxShadow: "inset 0 0 0 1px rgba(244,196,141,0.45)",
                color: "#9a4f1d",
              }}
            >
              {(() => {
                const catName = opponentCard?.categoryId
                  ? getCategoryById(opponentCard.categoryId)?.nameAr
                  : null;
                return catName ? `الفئة: ${catName}` : "بطاقة الخصم";
              })()}
            </span>
          </div>
          <div
            className="relative overflow-hidden rounded-[1.1rem] sm:rounded-[1.2rem]"
            style={{
              background: "linear-gradient(180deg,#FFFCF8 0%,#FFF4E6 100%)",
              boxShadow:
                "0 0 0 2px rgba(244,196,141,0.48), 0 11px 26px rgba(196,120,40,0.16), inset 0 2px 0 rgba(255,255,255,0.78)",
            }}
          >
            <div className="pointer-events-none absolute -left-2 -top-2 h-10 w-10 rounded-full bg-[#ffd080]/28 blur-xl" />
            {opponentCard?.imageUrl ? (
              <>
                <div
                  className="relative w-full overflow-hidden rounded-t-[1rem]"
                  style={{ aspectRatio: "3 / 4", maxHeight: "min(30vh, 188px)" }}
                >
                  <CardImage src={opponentCard.imageUrl} alt={opponentCard.nameAr} />
                  <div className="pointer-events-none absolute inset-0 rounded-t-[1rem] ring-1 ring-inset ring-white/26" />
                </div>
                <div className="px-2 pb-2 pt-1 text-center">
                  <p className="truncate text-xs font-black text-[#8a3f16] sm:text-sm">{opponentCard.nameAr}</p>
                </div>
              </>
            ) : (
              <div
                className="flex items-center justify-center text-[11px] font-semibold text-[#bc7a45]"
                style={{ aspectRatio: "3 / 4", maxHeight: "min(30vh, 188px)" }}
              >
                جاري التحميل…
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <div className="flex shrink-0 flex-col gap-2 pb-1 pt-1">
        {myTurn ? (
          <motion.button
            type="button"
            disabled={busy}
            whileHover={{ y: -2, scale: 1.01 }}
            whileTap={{ scale: 0.97, y: 3 }}
            onClick={() => void sendVoiceAck()}
            className="relative w-full overflow-hidden rounded-[1.35rem] py-[15px] text-base font-black text-white disabled:opacity-55 sm:py-[17px] sm:text-lg"
            style={{
              background: "linear-gradient(180deg,#FF9F0A 0%,#FF6B00 100%)",
              boxShadow:
                "inset 0 2.5px 0 rgba(255,255,255,0.42), 0 11px 0 #be5200, 0 18px 34px rgba(255,107,0,0.38)",
            }}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-14 top-2 h-2.5 rounded-full bg-white/34 blur-sm"
            />
            {qPhase ? "✓ تم السؤال" : "✓ تمت الإجابة"}
          </motion.button>
        ) : (
          <div
            className="rounded-[1.35rem] px-4 py-[14px] text-center text-sm font-bold leading-relaxed text-[#a16231] sm:py-4 sm:text-base"
            style={{
              background: "linear-gradient(135deg,#FFF8EE,#FFEDD8)",
              boxShadow: "inset 0 0 0 2px rgba(244,196,141,0.42), 0 8px 18px rgba(196,134,82,0.10)",
            }}
          >
            {qPhase ? `بانتظار سؤال ${opponentName}…` : `بانتظار إجابة ${opponentName}…`}
          </div>
        )}
        <motion.button
          type="button"
          whileHover={{ y: -2, scale: 1.01 }}
          whileTap={{ scale: 0.97, y: 3 }}
          onClick={openGuessFlow}
          animate={
            myTurn
              ? {
                  boxShadow: [
                    "inset 0 2px 0 rgba(255,255,255,0.38), 0 9px 0 #be5200, 0 14px 28px rgba(255,100,0,0.36)",
                    "inset 0 2px 0 rgba(255,255,255,0.38), 0 9px 0 #be5200, 0 18px 38px rgba(255,100,0,0.48)",
                    "inset 0 2px 0 rgba(255,255,255,0.38), 0 9px 0 #be5200, 0 14px 28px rgba(255,100,0,0.36)",
                  ],
                }
              : {}
          }
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          className="relative w-full overflow-hidden rounded-[1.35rem] py-[14px] text-base font-black sm:py-4 sm:text-lg"
          style={
            myTurn
              ? {
                  background: "linear-gradient(145deg,#FFB020 0%,#FF5500 100%)",
                  color: "#fff",
                  boxShadow:
                    "inset 0 2px 0 rgba(255,255,255,0.38), 0 9px 0 #be5200, 0 14px 28px rgba(255,100,0,0.36)",
                }
              : {
                  background: "linear-gradient(145deg,#FFFFFF 0%,#FFF4E4 100%)",
                  color: "#b45309",
                  boxShadow: "inset 0 0 0 2px rgba(244,196,141,0.48), 0 7px 0 rgba(196,134,82,0.18)",
                }
          }
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-12 top-2 h-2 rounded-full bg-white/28 blur-[2px]"
          />
          🎯 تخمين
        </motion.button>
      </div>
    </div>
  );
}

// ─── MATCH RESULT SCREEN ────────────────────────────────────────────────────

type ResultProps = {
  roomId: string;
  myUid: string;
  iWon: boolean;
  winnerUid: string | null;
  forfeitWin: boolean;
  myName: string;
  opponentName: string;
  opponentCard: GameCard | null;
  messages: ChatMessage[];
  replayBusy?: boolean;
  onReplay: () => void;
  onHome: () => void;
};

// Client-side read of the local player's own card from the existing
// rooms/{roomId}/playerCards/{uid} document. Does not modify backend.
function useMyOwnCard(roomId: string, myUid: string): GameCard | null {
  const [card, setCard] = useState<GameCard | null>(null);

  useEffect(() => {
    if (!roomId || !myUid) { setCard(null); return; }
    let unsub: (() => void) | null = null;
    let cancelled = false;
    void (async () => {
      try {
        const [{ getFirebaseDb }, { doc, onSnapshot }] = await Promise.all([
          import("@/lib/firebase/client"),
          import("firebase/firestore"),
        ]);
        if (cancelled) return;
        const db = getFirebaseDb();
        const ref = doc(db, "rooms", roomId, "playerCards", myUid);
        unsub = onSnapshot(ref, (snap) => {
          if (!snap.exists()) { setCard(null); return; }
          const c = snap.data();
          setCard({
            id: String(c.cardId ?? ""),
            name: String(c.name ?? ""),
            nameAr: String(c.nameAr ?? ""),
            imageUrl: String(c.imageUrl ?? ""),
            categoryId: String(c.categoryId ?? ""),
            tags: [],
          });
        });
      } catch {
        // silent — the result screen still works without my card
      }
    })();
    return () => {
      cancelled = true;
      if (unsub) unsub();
    };
  }, [roomId, myUid]);

  return card;
}

function MatchResultScreen({
  roomId,
  myUid,
  iWon,
  winnerUid,
  forfeitWin,
  myName,
  opponentName,
  opponentCard,
  messages,
  replayBusy = false,
  onReplay,
  onHome,
}: ResultProps) {
  const myCard = useMyOwnCard(roomId, myUid);

  const categoryLabel = opponentCard?.categoryId
    ? (getCategoryById(opponentCard.categoryId)?.nameAr ?? null)
    : (myCard?.categoryId ? (getCategoryById(myCard.categoryId)?.nameAr ?? null) : null);

  const winMsg = messages.find((m) => m.type === "guess" && m.correct === true);

  // Headline copy
  const headlineBig = iWon
    ? (forfeitWin ? "فزت!" : "أحسنت!")
    : (winnerUid ? "خسرت" : "انتهت المباراة");
  const headlineSub = iWon
    ? (forfeitWin ? "غادر خصمك المباراة" : "خمّنت البطاقة بشكل صحيح 🎉")
    : (forfeitWin ? "غادر خصمك المباراة" : "جولة قادمة، فرصة جديدة!");

  // Stagger entrance
  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.06 } },
  };
  const item = {
    hidden: { opacity: 0, y: 18, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 280, damping: 22 } },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      dir="rtl"
      className="fixed inset-0 z-50 flex h-[100dvh] w-full flex-col overflow-hidden"
      style={{
        background: iWon
          ? "radial-gradient(140% 80% at 50% 0%, #FFF8E6 0%, #FFECC0 45%, #FFDDA0 100%)"
          : "radial-gradient(130% 75% at 50% 0%, #FFF1DD 0%, #FFECD7 55%, #FDE7CD 100%)",
      }}
    >
      {/* ── confetti (victory only) ── */}
      {iWon && <ConfettiBurst active />}

      {/* ── ambient background layer ── */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        {iWon ? (
          <>
            <motion.div
              animate={{ scale: [1, 1.18, 1], opacity: [0.45, 0.8, 0.45] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-1/2 top-[-15%] h-[60vh] w-[80vw] max-w-[680px] -translate-x-1/2 rounded-full bg-[#FFD060]/38 blur-3xl"
            />
            <motion.div
              animate={{ y: [0, -22, 0], x: [0, 14, 0] }}
              transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -right-20 top-1/4 h-72 w-72 rounded-full bg-[#FFB340]/26 blur-3xl"
            />
            <motion.div
              animate={{ y: [0, 16, 0], x: [0, -12, 0] }}
              transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 3 }}
              className="absolute -left-24 bottom-1/4 h-64 w-64 rounded-full bg-[#FF9F0A]/22 blur-3xl"
            />
          </>
        ) : (
          <>
            <motion.div
              animate={{ y: [0, -18, 0] }}
              transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -right-24 -top-20 h-72 w-72 rounded-full bg-[#FFCB8A]/34 blur-3xl"
            />
            <motion.div
              animate={{ y: [0, 14, 0] }}
              transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 4 }}
              className="absolute -left-20 bottom-1/4 h-64 w-64 rounded-full bg-[#FFB574]/26 blur-3xl"
            />
          </>
        )}

        {/* upward floating sparkles (victory only) */}
        {iWon && Array.from({ length: 14 }).map((_, i) => {
          const left = `${(i * 17 + 5) % 96}%`;
          const size = 5 + (i % 4) * 2;
          const dur = 3.8 + (i % 5) * 0.5;
          const delay = (i % 8) * 0.45;
          const colors = ["#FFD060", "#FFB340", "#FF9F0A", "#FFF3B0"];
          const color = colors[i % colors.length];
          return (
            <motion.span
              key={`spk-${i}`}
              aria-hidden
              className="pointer-events-none absolute rounded-full"
              style={{ left, bottom: "-8px", width: size, height: size, background: color }}
              animate={{ y: [0, -(160 + (i % 4) * 60)], opacity: [0, 0.95, 0], scale: [0.6, 1.2, 0.4] }}
              transition={{ duration: dur, delay, repeat: Infinity, ease: "easeOut" }}
            />
          );
        })}

        {/* tiny decorative marks */}
        {([
          { char: "؟", top: "10%", left: "3%",   delay: 0,   size: 32, tint: "rgba(164,80,255,0.07)" },
          { char: "؟", top: "44%", right: "3%",  delay: 2.2, size: 26, tint: "rgba(255,138,30,0.10)" },
          { char: "✦", top: "22%", right: "10%", delay: 1,   size: 12, tint: iWon ? "rgba(255,200,50,0.55)" : "rgba(255,180,90,0.42)" },
          { char: "✦", top: "62%", left: "8%",   delay: 3,   size: 10, tint: iWon ? "rgba(255,200,50,0.45)" : "rgba(150,80,255,0.36)" },
        ] as const).map((s, idx) => (
          <motion.span
            key={`mark-${idx}`}
            aria-hidden
            style={{
              position: "absolute",
              top: s.top,
              left: "left" in s ? s.left : undefined,
              right: "right" in s ? s.right : undefined,
              fontSize: s.size,
              color: s.tint,
              fontWeight: 900,
              userSelect: "none",
              lineHeight: 1,
            }}
            animate={{ y: [0, -10, 0], rotate: [0, 6, 0] }}
            transition={{ duration: 6 + s.delay, repeat: Infinity, ease: "easeInOut", delay: s.delay }}
          >
            {s.char}
          </motion.span>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════
          CONTENT — single viewport, no scroll
          Uses flex column with min-h-0 so cards row fills remaining space
      ════════════════════════════════════════════════════════ */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col px-3 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:px-6 sm:pt-3 lg:max-w-4xl lg:px-8"
      >
        {/* ── TINY LOGO / HEADER STRIP ────────────────────────── */}
        <motion.div variants={item} className="flex flex-shrink-0 items-center justify-center pb-1">
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

        {/* ── VICTORY / DEFEAT HEADER ─────────────────────────── */}
        <motion.div variants={item} className="flex flex-shrink-0 flex-col items-center pt-1 sm:pt-2">
          <motion.div
            animate={iWon ? { y: [0, -6, 0], rotate: [-4, 4, -4] } : { rotate: [-5, 5, -5] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            className="text-4xl leading-none sm:text-5xl"
          >
            {iWon ? "👑" : "😅"}
          </motion.div>

          <motion.h1
            animate={iWon ? { scale: [1, 1.04, 1] } : {}}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
            className="mt-1.5 text-4xl font-black leading-none sm:text-5xl lg:text-6xl"
            style={
              iWon
                ? {
                    background: "linear-gradient(180deg,#FFD060 0%,#FF8C00 55%,#D95A00 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    filter: "drop-shadow(0 4px 14px rgba(255,140,0,0.55))",
                    letterSpacing: "-0.02em",
                  }
                : {
                    background: "linear-gradient(180deg,#FF9F0A 0%,#E0660A 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    filter: "drop-shadow(0 3px 8px rgba(224,102,10,0.35))",
                    letterSpacing: "-0.02em",
                  }
            }
          >
            {headlineBig}
          </motion.h1>

          <p className="mt-1.5 text-sm font-bold text-[#9a5020] sm:text-base">
            {headlineSub}
          </p>
        </motion.div>

        {/* ── CARDS SHOWDOWN — flex-1, fills remaining space ──── */}
        <motion.div
          variants={item}
          className="relative my-3 flex min-h-0 flex-1 items-center justify-center sm:my-4"
        >
          <div className="flex w-full items-center justify-center gap-2 sm:gap-4 lg:gap-6">
            {/* MY CARD */}
            <CardShowdown
              side="me"
              card={myCard}
              fallbackLabel="بطاقتك"
              ownerLabel="بطاقتك"
              playerLabel={myName || "أنت"}
              isWinner={iWon}
              tilt={-3}
            />

            {/* VS */}
            <div className="flex flex-shrink-0 flex-col items-center justify-center self-center">
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                className="relative flex h-14 w-14 items-center justify-center rounded-full sm:h-16 sm:w-16 lg:h-20 lg:w-20"
                style={{
                  background: "linear-gradient(140deg,#FF9F0A 0%,#FF5500 100%)",
                  boxShadow: "inset 0 2.5px 0 rgba(255,255,255,0.42), 0 8px 0 #be5200, 0 14px 28px rgba(255,107,0,0.45)",
                }}
              >
                <motion.div
                  aria-hidden
                  animate={{ opacity: [0.4, 0.9, 0.4], scale: [0.9, 1.15, 0.9] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                  className="pointer-events-none absolute inset-0 rounded-full"
                  style={{ background: "radial-gradient(circle, rgba(255,220,80,0.55), transparent 65%)" }}
                />
                <span
                  className="relative text-lg font-black text-white sm:text-xl lg:text-2xl"
                  style={{ textShadow: "0 2px 0 rgba(0,0,0,0.2)" }}
                >
                  VS
                </span>
              </motion.div>
            </div>

            {/* OPPONENT CARD */}
            <CardShowdown
              side="opponent"
              card={opponentCard}
              fallbackLabel="بطاقة الخصم"
              ownerLabel="بطاقة الخصم"
              playerLabel={opponentName}
              isWinner={!iWon && Boolean(winnerUid)}
              tilt={3}
            />
          </div>
        </motion.div>

        {/* ── COMPACT MATCH FOOTER (winning guess + category) ─── */}
        {(winMsg || categoryLabel) ? (
          <motion.div
            variants={item}
            className="flex flex-shrink-0 flex-wrap items-center justify-center gap-2 sm:gap-3"
          >
            {winMsg && (
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold sm:text-sm"
                style={{
                  background: "linear-gradient(135deg,#dcfce7,#bbf7d0)",
                  color: "#14532d",
                  boxShadow: "0 0 0 1.5px rgba(22,163,74,0.30), 0 4px 10px rgba(22,163,74,0.16)",
                }}
              >
                🎯 <span>{winMsg.text}</span>
              </span>
            )}
            {categoryLabel && (
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold sm:text-sm"
                style={{
                  background: "linear-gradient(135deg,#FFF8EE,#FFEDD8)",
                  color: "#9a4f1d",
                  boxShadow: "0 0 0 1.5px rgba(244,196,141,0.50), 0 4px 10px rgba(196,134,82,0.14)",
                }}
              >
                📂 <span>{categoryLabel}</span>
              </span>
            )}
          </motion.div>
        ) : null}

        {/* ── BUTTONS ─────────────────────────────────────────── */}
        <motion.div variants={item} className="mt-3 flex flex-shrink-0 flex-col items-stretch gap-2 pb-1 sm:mt-4 sm:flex-row sm:items-center sm:justify-center sm:gap-3">
          {/* PRIMARY — replay */}
          <div className="relative flex-1 sm:max-w-md">
            <motion.div
              aria-hidden
              animate={{ opacity: [0.55, 1, 0.55], scale: [0.94, 1.05, 0.94] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 -z-10 rounded-[1.4rem] blur-2xl"
              style={{ background: "radial-gradient(closest-side,rgba(255,138,30,0.7),transparent 70%)" }}
            />
            <motion.button
              type="button"
              onClick={onReplay}
              disabled={replayBusy}
              whileHover={replayBusy ? {} : { y: -3, scale: 1.02 }}
              whileTap={replayBusy ? {} : { y: 4, scale: 0.97 }}
              className="relative w-full overflow-hidden rounded-[1.4rem] py-3.5 text-lg font-black text-white disabled:opacity-60 sm:py-4 sm:text-xl"
              style={{
                background: "linear-gradient(180deg,#FF9F0A 0%,#FF5F00 100%)",
                boxShadow: "inset 0 2.5px 0 rgba(255,255,255,0.42), inset 0 -6px 14px rgba(150,50,0,0.32), 0 10px 0 #be5200, 0 18px 38px rgba(255,107,0,0.46)",
                textShadow: "0 2px 0 rgba(0,0,0,0.20)",
              }}
            >
              <span aria-hidden className="pointer-events-none absolute inset-x-14 top-2 h-2 rounded-full bg-white/32 blur-sm" />
              🎮 لعب مرة أخرى
            </motion.button>
          </div>

          {/* SECONDARY — home */}
          <motion.button
            type="button"
            onClick={onHome}
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ y: 2, scale: 0.98 }}
            className="rounded-[1.4rem] px-5 py-3.5 text-sm font-extrabold text-[#8a4f1d] sm:py-4 sm:text-base"
            style={{
              background: "linear-gradient(180deg,#FFFFFF 0%,#FFF4E4 100%)",
              boxShadow: "inset 0 1.5px 0 rgba(255,255,255,0.9), 0 6px 0 rgba(196,134,82,0.22), 0 12px 22px rgba(196,134,82,0.14)",
              border: "1.5px solid rgba(244,196,141,0.55)",
            }}
          >
            🏠 الرئيسية
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// ── Premium trading-card style component for the showdown ──
function CardShowdown({
  card,
  side,
  fallbackLabel,
  ownerLabel,
  playerLabel,
  isWinner,
  tilt,
}: {
  card: GameCard | null;
  side: "me" | "opponent";
  fallbackLabel: string;
  ownerLabel: string;
  playerLabel: string;
  isWinner: boolean;
  tilt: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, rotate: tilt * 2 }}
      animate={{ opacity: 1, y: 0, rotate: tilt }}
      transition={{ type: "spring", stiffness: 260, damping: 22, delay: side === "me" ? 0.15 : 0.30 }}
      className="relative flex min-w-0 flex-1 flex-col items-center"
    >
      {/* Owner label ribbon — clearly identifies which side */}
      <div
        className="z-10 mb-1.5 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-black sm:text-xs"
        style={
          isWinner
            ? {
                background: "linear-gradient(135deg,#FFE790,#FFC75A)",
                color: "#6f3000",
                boxShadow: "0 0 0 1.5px rgba(255,180,0,0.6), 0 4px 10px rgba(255,180,0,0.28)",
              }
            : {
                background: "linear-gradient(135deg,#FFF8EE,#FFEDD8)",
                color: "#9a4f1d",
                boxShadow: "inset 0 0 0 1.5px rgba(244,196,141,0.55), 0 2px 6px rgba(196,134,82,0.14)",
              }
        }
      >
        {isWinner && "👑"}
        {ownerLabel}
      </div>

      {/* card wrapper — keeps fixed aspect ratio so image never crops */}
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 4 + (side === "me" ? 0 : 0.5), repeat: Infinity, ease: "easeInOut" }}
        className="relative w-full max-w-[160px] sm:max-w-[200px] lg:max-w-[240px] xl:max-w-[260px]"
      >
        {/* the actual card */}
        <div
          className="relative overflow-hidden rounded-[1.1rem] sm:rounded-[1.4rem]"
          style={{
            background: "linear-gradient(180deg,#FFFCF4 0%,#FFF1DE 100%)",
            boxShadow: isWinner
              ? "0 0 0 2.5px rgba(255,208,96,0.7), 0 0 32px rgba(255,190,50,0.50), 0 16px 36px rgba(196,120,40,0.30), inset 0 2px 0 rgba(255,255,255,0.85)"
              : "0 0 0 2px rgba(244,196,141,0.55), 0 12px 28px rgba(196,120,40,0.20), inset 0 2px 0 rgba(255,255,255,0.75)",
          }}
        >
          {/* corner glows */}
          <div className="pointer-events-none absolute -left-3 -top-3 h-14 w-14 rounded-full bg-[#ffd080]/30 blur-2xl" />
          <div className="pointer-events-none absolute -right-3 bottom-0 h-14 w-14 rounded-full bg-[#ffb060]/22 blur-2xl" />

          {/* Image area — FIXED 3:4 aspect ratio with creamy backdrop.
              object-contain ensures the entire image is always visible. */}
          <div
            className="relative w-full overflow-hidden rounded-t-[1rem] sm:rounded-t-[1.3rem]"
            style={{
              aspectRatio: "3 / 4",
              background: "linear-gradient(135deg,#FFF6E5 0%,#FFEBC9 100%)",
            }}
          >
            {card?.imageUrl ? (
              <>
                <CardImage src={card.imageUrl} alt={card.nameAr || fallbackLabel} fit="contain" />
                {/* very subtle inner ring */}
                <div className="pointer-events-none absolute inset-0 rounded-t-[1rem] ring-1 ring-inset ring-white/30 sm:rounded-t-[1.3rem]" />
                {/* winner shimmer */}
                {isWinner && (
                  <motion.div
                    aria-hidden
                    animate={{ opacity: [0.0, 0.45, 0.0], x: ["-110%", "120%"] }}
                    transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
                    className="pointer-events-none absolute inset-y-0 left-0 w-1/3"
                    style={{
                      background: "linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.45) 50%, transparent 100%)",
                    }}
                  />
                )}
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-4xl">❓</div>
            )}
          </div>

          {/* Footer — card name + tiny player tag */}
          <div className="px-2 pb-2 pt-1.5 text-center sm:px-3 sm:pb-3 sm:pt-2">
            <p
              className="truncate font-black text-[#8a3f16]"
              style={{ fontSize: "clamp(0.78rem, 1.6vw, 1.05rem)" }}
            >
              {card?.nameAr || fallbackLabel}
            </p>
            <p
              className={`mt-0.5 truncate font-bold ${isWinner ? "text-[#a35200]" : "text-[#bc7a45]"}`}
              style={{ fontSize: "clamp(0.6rem, 1.1vw, 0.75rem)" }}
            >
              {playerLabel}
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── ROOM EXPERIENCE ────────────────────────────────────────────────────────

export function RoomExperience({ roomId }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const uid = user?.uid ?? null;
  const displayName = user?.displayName || user?.email || "زائر";

  const { room, match, messages, opponentCard, wireError } = useRoomWire(roomId, uid);

  const [draft, setDraft] = useState("");
  const [guessSureOpen, setGuessSureOpen] = useState(false);
  const [guessInputOpen, setGuessInputOpen] = useState(false);
  const [guessDraft, setGuessDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [turnPopup, setTurnPopup] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const autoStartRef = useRef(false);
  const firedTimeoutForDeadline = useRef<number | null>(null);
  const prevMyTurn = useRef(false);
  const prevMsgCount = useRef(0);
  const lastTickSecond = useRef<number | null>(null);
  const confettiDone = useRef(false);
  const defeatPlayed = useRef(false);
  const turnPopupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevRoomStatusRef = useRef<string | null>(null);
  const lobbyCustomFileRef = useRef<HTMLInputElement>(null);
  const [lobbyCustomName, setLobbyCustomName] = useState("");
  const [lobbyCustomPreview, setLobbyCustomPreview] = useState<string | null>(null);
  const [lobbyCustomBusy, setLobbyCustomBusy] = useState(false);
  const [customSavePulse, setCustomSavePulse] = useState(0);

  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setClock(Date.now()), 200);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const me = room?.players.find((p) => p.uid === uid);
  const isHost = Boolean(uid && room?.hostUid === uid);
  const bothReady = Boolean(
    room?.playerUids?.length === 2 &&
      room.playerUids.every((pid) => room.players.some((p) => p.uid === pid && p.ready)),
  );
  const voiceMode = Boolean(room?.voiceMode && !room?.randomMatch);

  const ended = room?.status === "ended" || match?.status === "ended";
  const winnerUid = match?.winnerUid ?? null;
  const iWon = Boolean(winnerUid && winnerUid === uid);
  const forfeitWin = Boolean(iWon && match?.winReason === "forfeit");

  const myTurn =
    Boolean(match?.status === "active" && match.actorUid && uid && match.actorUid === uid);
  const phase = match?.chatPhase ?? "question";
  const msLeft =
    match?.turnDeadline && typeof match.turnDeadline.toMillis === "function"
      ? match.turnDeadline.toMillis() - clock
      : null;
  const secLeft = msLeft !== null ? Math.max(0, Math.ceil(msLeft / 1000)) : null;
  const qSec = match?.questionSeconds ?? QUESTION_PHASE_SECONDS;
  const aSec = match?.answerSeconds ?? ANSWER_PHASE_SECONDS;
  const maxPhaseSec = phase === "answer" ? aSec : qSec;

  useEffect(() => {
    firedTimeoutForDeadline.current = null;
  }, [match?.turnDeadline]);

  useEffect(() => {
    if (!match || match.status !== "active" || ended || !uid) return;
    const dl = match.turnDeadline?.toMillis?.();
    if (!dl) return;
    if (match.actorUid !== uid) return;
    if (clock <= dl + 400) return;
    if (firedTimeoutForDeadline.current === dl) return;
    firedTimeoutForDeadline.current = dl;
    void postGame("/api/game/timeout", { roomId, matchId: match.id }).catch(() => {
      firedTimeoutForDeadline.current = null;
    });
  }, [clock, match, ended, uid, roomId]);

  useEffect(() => {
    if (!room || room.status !== "lobby" || !room.randomMatch) return;
    if (room.players.length < 2) return;
    if (!isHost) return;
    if (autoStartRef.current) return;
    autoStartRef.current = true;
    void (async () => {
      try {
        await postGame("/api/game/start", { roomId: room.id });
      } catch {
        autoStartRef.current = false;
      }
    })();
  }, [room, isHost]);

  useEffect(() => {
    resumeAudioContext();
  }, []);

  // Combined turn change: audio cue + transition popup
  useEffect(() => {
    const wasMyTurn = prevMyTurn.current;
    if (match?.status === "active" && myTurn !== wasMyTurn) {
      if (myTurn) playTurnCue();
      if (turnPopupTimer.current) clearTimeout(turnPopupTimer.current);
      setTurnPopup(myTurn ? "دورك الآن!" : "دور الخصم");
      turnPopupTimer.current = setTimeout(() => setTurnPopup(null), 1800);
    }
    prevMyTurn.current = myTurn;
  }, [myTurn, match?.status]);

  useEffect(() => {
    const n = messages.length;
    if (n > prevMsgCount.current && prevMsgCount.current > 0) {
      const last = messages[n - 1];
      if (last && last.senderUid !== uid && last.senderUid !== "system") {
        playMessagePop();
      }
    }
    prevMsgCount.current = n;
  }, [messages, uid]);

  useEffect(() => {
    if (!myTurn || secLeft === null || match?.status !== "active") {
      lastTickSecond.current = null;
      return;
    }
    if (secLeft > 5 || secLeft < 1) {
      lastTickSecond.current = null;
      return;
    }
    if (lastTickSecond.current !== secLeft) {
      lastTickSecond.current = secLeft;
      playCountdownTick(secLeft);
    }
  }, [secLeft, myTurn, match?.status]);

  useEffect(() => {
    if (!room?.lobbyLeftByUid || !uid) return;
    if (room.lobbyLeftByUid === uid) return;
    setBanner("اللاعب الآخر قام بالمغادرة.");
    window.setTimeout(() => router.replace("/"), 2200);
  }, [room?.lobbyLeftByUid, uid, router]);

  useEffect(() => {
    const s = room?.status;
    if (!s) return;
    const wasEnded = prevRoomStatusRef.current === "ended";
    prevRoomStatusRef.current = s;
    if (s === "lobby" && wasEnded) {
      confettiDone.current = false;
      defeatPlayed.current = false;
      autoStartRef.current = false;
      setLobbyCustomName("");
      setLobbyCustomPreview(null);
    }
  }, [room?.status]);

  useEffect(() => {
    if (!ended || !iWon || !winnerUid) return;
    if (!confettiDone.current) {
      confettiDone.current = true;
      playWinSparkle();
    }
  }, [ended, iWon, winnerUid]);

  useEffect(() => {
    if (!ended || iWon || !winnerUid) return;
    if (!defeatPlayed.current) {
      defeatPlayed.current = true;
      playDefeatTone();
    }
  }, [ended, iWon, winnerUid]);

  useEffect(() => {
    return () => {
      if (turnPopupTimer.current) clearTimeout(turnPopupTimer.current);
    };
  }, []);

  const startMatch = useCallback(async () => {
    if (!room) return;
    setBusy(true);
    setBanner(null);
    try {
      await postGame("/api/game/start", { roomId: room.id });
    } catch (e) {
      setBanner(e instanceof Error ? e.message : "تعذر بدء المباراة");
    } finally {
      setBusy(false);
    }
  }, [room]);

  const handleReplay = useCallback(async () => {
    if (!room) return;
    resumeAudioContext();
    if (room.randomMatch) {
      router.push("/play/random");
      return;
    }
    setBusy(true);
    setBanner(null);
    try {
      await postGame("/api/game/replay", { roomId: room.id });
    } catch (e) {
      setBanner(e instanceof Error ? e.message : "تعذر إعادة اللعب");
    } finally {
      setBusy(false);
    }
  }, [room, router]);

  const myLobbyPickId =
    uid && room?.customOpponentSelections?.[uid]
      ? room.customOpponentSelections[uid].id
      : undefined;

  useEffect(() => {
    if (room?.status !== "lobby" || !uid) return;
    const mine = room.customOpponentSelections?.[uid];
    if (!mine) {
      setLobbyCustomName("");
      setLobbyCustomPreview(null);
      return;
    }
    setLobbyCustomName(mine.nameAr);
    setLobbyCustomPreview(mine.imageUrl);
  }, [room?.status, uid, myLobbyPickId]);

  const onLobbyCustomFile = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setLobbyCustomBusy(true);
    try {
      const url = await processCardImageFile(file);
      setLobbyCustomPreview(url);
    } catch (err) {
      setBanner(err instanceof Error ? err.message : "تعذر معالجة الصورة");
    } finally {
      setLobbyCustomBusy(false);
    }
  }, []);

  const submitLobbyOpponentCard = useCallback(async () => {
    if (!room || !uid || !lobbyCustomPreview || !lobbyCustomName.trim()) return;
    setLobbyCustomBusy(true);
    setBanner(null);
    try {
      const existingId = room.customOpponentSelections?.[uid]?.id;
      await postGame("/api/game/opponent-custom-card", {
        roomId: room.id,
        card: {
          ...(existingId ? { id: existingId } : {}),
          nameAr: lobbyCustomName.trim(),
          imageUrl: lobbyCustomPreview,
          aliases: [...new Set(generateGuessAliases(lobbyCustomName.trim()))],
        },
      });
      setCustomSavePulse((n) => n + 1);
      setBanner("تم حفظ بطاقتك لخصمك ✓");
      window.setTimeout(() => setBanner(null), 2400);
    } catch (e) {
      setBanner(e instanceof Error ? e.message : "تعذر الحفظ");
    } finally {
      setLobbyCustomBusy(false);
    }
  }, [room, uid, lobbyCustomPreview, lobbyCustomName]);

  const toggleReady = useCallback(async () => {
    if (!room || !uid || !me) return;
    setBusy(true);
    try {
      await setPlayerReady(room.id, uid, !me.ready);
    } finally {
      setBusy(false);
    }
  }, [room, uid, me]);

  const sendDraft = useCallback(async () => {
    if (!room || !match || !draft.trim()) return;
    if (!myTurn) {
      setBanner("انتظر دورك");
      return;
    }
    setBusy(true);
    setBanner(null);
    try {
      await postGame("/api/game/chat", {
        roomId: room.id,
        matchId: match.id,
        text: draft,
        displayName,
      });
      setDraft("");
    } catch (e) {
      setBanner(e instanceof Error ? e.message : "تعذر الإرسال");
    } finally {
      setBusy(false);
    }
  }, [room, match, draft, displayName, myTurn]);

  const sendVoiceAck = useCallback(async () => {
    if (!room || !match || !myTurn) return;
    setBusy(true);
    setBanner(null);
    try {
      await postGame("/api/game/chat", {
        roomId: room.id,
        matchId: match.id,
        text: phase === "question" ? "(سؤال صوتي)" : "(إجابة صوتية)",
        displayName,
      });
    } catch (e) {
      setBanner(e instanceof Error ? e.message : "تعذر التقدم");
    } finally {
      setBusy(false);
    }
  }, [room, match, myTurn, phase, displayName]);

  const submitGuess = useCallback(async () => {
    if (!room || !match || !guessDraft.trim()) return;
    setBusy(true);
    setBanner(null);
    try {
      await postGame("/api/game/guess", {
        roomId: room.id,
        matchId: match.id,
        guess: guessDraft,
        displayName,
      });
      setGuessDraft("");
      setGuessInputOpen(false);
      setGuessSureOpen(false);
    } catch (e) {
      setBanner(e instanceof Error ? e.message : "تعذر إرسال التخمين");
    } finally {
      setBusy(false);
    }
  }, [room, match, guessDraft, displayName]);

  const copyCode = useCallback(async () => {
    if (!room) return;
    try {
      await navigator.clipboard.writeText(room.code);
      setBanner("تم نسخ الرمز ✓");
      window.setTimeout(() => setBanner(null), 1800);
    } catch {
      setBanner("تعذر النسخ");
    }
  }, [room]);

  const requestExit = useCallback(() => {
    resumeAudioContext();
    setLeaveConfirmOpen(true);
  }, []);

  const confirmLeave = useCallback(async () => {
    setLeaveConfirmOpen(false);
    try {
      if (room?.status === "playing" && match?.status === "active") {
        await postGame("/api/game/leave", { roomId: room.id });
      } else if (room?.status === "lobby") {
        await postGame("/api/game/leave", { roomId: room.id });
      }
    } catch {
      // still navigate home
    }
    router.replace("/");
  }, [room, match, router]);

  const openGuessFlow = useCallback(() => {
    resumeAudioContext();
    if (!myTurn) {
      setBanner("يمكن التخمين فقط في دورك");
      return;
    }
    setGuessSureOpen(true);
  }, [myTurn]);

  const confirmGuessSure = useCallback(() => {
    playGuessChime();
    setGuessSureOpen(false);
    setGuessInputOpen(true);
  }, []);

  if (!uid) return null;

  if (!room) {
    return (
      <div className="mx-auto flex min-h-[50vh] w-full max-w-lg flex-col justify-center px-4 py-10 text-center">
        <Panel>
          <p className="text-base text-[#a16231]">
            {wireError ? `خطأ: ${wireError}` : "جاري تحميل الغرفة أو لم تعد موجودة."}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Button type="button" variant="ghost" onClick={() => router.push("/")}>
              الرئيسية
            </Button>
          </div>
        </Panel>
      </div>
    );
  }

  // ─── LOBBY ──────────────────────────────────────────────────────────────────
  if (room.status === "lobby") {
    const randomLobby = Boolean(room.randomMatch);

    // Resolve player slots: me first, opponent second
    const mePlayer = room.players.find((p) => p.uid === uid);
    const opponent = room.players.find((p) => p.uid !== uid);

    const sel = room.customOpponentSelections ?? {};
    const assigned = room.customOpponentCardAssigned ?? {};
    const puids = room.playerUids;
    const customModeActive = room.customCardsEnabled === true;
    const uidCardComplete = (pid: string) =>
      assigned[pid] === true || isOpponentCustomCardComplete(sel[pid]);
    const bothPickedCustom =
      !customModeActive ||
      randomLobby ||
      (puids.length === 2 && puids.every((pid) => uidCardComplete(pid)));
    const customLobby = Boolean(customModeActive && !randomLobby && opponent);

    const mePickDone = uid ? uidCardComplete(uid) : false;
    const oppPickDone = opponent ? uidCardComplete(opponent.uid) : false;
    const myLobbyPickUi = uid ? sel[uid] : undefined;
    const tileImageSrc = lobbyCustomPreview ?? myLobbyPickUi?.imageUrl ?? null;
    const dirtyAgainstServer = Boolean(
      uid &&
        mePickDone &&
        myLobbyPickUi &&
        (lobbyCustomName.trim() !== (myLobbyPickUi.nameAr ?? "").trim() ||
          (lobbyCustomPreview != null && lobbyCustomPreview !== myLobbyPickUi.imageUrl)),
    );
    const showCardSuccessVisual = mePickDone && !dirtyAgainstServer;
    const showDraftEditVisual = mePickDone && dirtyAgainstServer;

    return (
      <div
        dir="rtl"
        className="relative min-h-[100dvh] w-full overflow-x-hidden select-none"
        style={{
          background:
            "radial-gradient(120% 70% at 50% 0%, #FFF1DD 0%, #FCE9D4 55%, #FFEED8 100%)",
        }}
      >
        {/* ── ambient decor ── */}
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <motion.div
            animate={{ y: [0, -22, 0], x: [0, 12, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#FFCB8A]/50 blur-3xl"
          />
          <motion.div
            animate={{ y: [0, 18, 0], x: [0, -10, 0] }}
            transition={{ duration: 17, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute -left-28 top-1/3 h-80 w-80 rounded-full bg-[#FFB574]/38 blur-3xl"
          />
          <motion.div
            animate={{ y: [0, -14, 0] }}
            transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 5 }}
            className="absolute bottom-28 right-1/4 h-56 w-56 rounded-full bg-[#FFD9A6]/46 blur-3xl"
          />
          {([
            { char: "؟", top: "6%",  left: "4%",   delay: 0,   size: 52, tint: "rgba(176,92,255,0.11)" },
            { char: "؟", top: "28%", right: "5%",  delay: 1.4, size: 42, tint: "rgba(255,138,30,0.16)" },
            { char: "؟", top: "65%", left: "7%",   delay: 3,   size: 48, tint: "rgba(78,163,255,0.12)" },
            { char: "✦", top: "15%", right: "13%", delay: 0.7, size: 18, tint: "rgba(255,180,90,0.68)"  },
            { char: "✦", top: "48%", left: "17%",  delay: 2.6, size: 14, tint: "rgba(155,89,255,0.58)"  },
            { char: "✦", top: "80%", right: "19%", delay: 4.3, size: 20, tint: "rgba(78,163,255,0.54)"  },
          ] as const).map((s, i) => (
            <motion.span
              key={i}
              aria-hidden
              style={{
                position: "absolute",
                top: s.top,
                left: "left" in s ? s.left : undefined,
                right: "right" in s ? s.right : undefined,
                fontSize: s.size,
                color: s.tint,
                fontWeight: 900,
                userSelect: "none",
              }}
              animate={{ y: [0, -10, 0], rotate: [0, 6, 0] }}
              transition={{ duration: 6 + s.delay, repeat: Infinity, ease: "easeInOut", delay: s.delay }}
            >
              {s.char}
            </motion.span>
          ))}
        </div>

        <input
          ref={lobbyCustomFileRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp,.png,.jpg,.jpeg,.webp"
          className="hidden"
          onChange={(ev) => void onLobbyCustomFile(ev)}
        />

        {/* ── scroll container ── */}
        <div className="relative z-10 mx-auto w-full max-w-md px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] sm:max-w-lg sm:px-6 lg:max-w-2xl lg:px-10">

          {/* ── Banner (copy success / error) ── */}
          <AnimatePresence>
            {banner ? (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-3 rounded-2xl border border-[#f4c48d] bg-[#fff2de] px-4 py-3 text-center text-sm font-bold text-[#9a5f2d]"
              >
                {banner}
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* ── Hero title ── */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 24 }}
            className="mb-1 text-center"
          >
            <h1
              className="text-5xl font-black sm:text-6xl lg:text-7xl"
              style={{
                background: "linear-gradient(180deg,#FF9F0A 0%,#E0660A 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 4px 12px rgba(224,102,10,0.4))",
              }}
            >
              غرفة اللعب
            </h1>
            <p className="mt-2 text-sm font-semibold text-[#bc7a45] sm:text-base">
              بانتظار استعداد اللاعبين
            </p>
          </motion.div>

          {/* ── Super card ── */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 190, damping: 22, delay: 0.08 }}
            className="relative mt-5 overflow-hidden rounded-[2rem] border border-white/80 bg-white/95 shadow-[0_20px_60px_rgba(196,134,82,0.28),0_6px_16px_rgba(196,134,82,0.12)] backdrop-blur-sm"
          >
            {/* warm inner top glow */}
            <div
              aria-hidden
              className="pointer-events-none absolute -top-12 left-1/2 h-32 w-3/4 -translate-x-1/2 rounded-full blur-3xl"
              style={{ background: "rgba(255,175,60,0.18)" }}
            />

            <div className="px-5 py-7 sm:px-7 sm:py-8">

              {/* ── Room code row (private rooms only) ── */}
              {!randomLobby ? (
                <div
                  className="mb-6 flex items-center gap-3 rounded-2xl px-4 py-3"
                  style={{
                    background: "linear-gradient(135deg,#FFF8EE 0%,#FFEDD8 100%)",
                    boxShadow: "0 4px 14px rgba(196,134,82,0.14), inset 0 0 0 1.5px rgba(244,196,141,0.6)",
                  }}
                >
                  {/* lock icon */}
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white shadow-[0_3px_10px_rgba(196,134,82,0.18)]">
                    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
                      <rect x="3" y="9" width="14" height="9" rx="2.5" stroke="#bc7a45" strokeWidth="1.7" fill="rgba(255,149,0,0.1)" />
                      <path d="M6 9V6.5a4 4 0 018 0V9" stroke="#bc7a45" strokeWidth="1.7" strokeLinecap="round" />
                    </svg>
                  </span>
                  {/* code */}
                  <span className="min-w-0 flex-1 text-center text-2xl font-black tracking-[0.3em] text-[#8a3f16] sm:text-3xl">
                    {room.code}
                  </span>
                  {/* copy button */}
                  <motion.button
                    type="button"
                    onClick={() => void copyCode()}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.92 }}
                    aria-label="نسخ الرمز"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white shadow-[0_3px_10px_rgba(196,134,82,0.18)]"
                  >
                    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
                      <rect x="7" y="7" width="10" height="10" rx="2" stroke="#bc7a45" strokeWidth="1.7" />
                      <path d="M5 13H4a1 1 0 01-1-1V4a1 1 0 011-1h8a1 1 0 011 1v1" stroke="#bc7a45" strokeWidth="1.7" strokeLinecap="round" />
                    </svg>
                  </motion.button>
                </div>
              ) : (
                /* random match badge */
                <div className="mb-6 flex items-center justify-center gap-2 rounded-2xl bg-[#FFF8EE] px-4 py-2.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <p className="text-sm font-extrabold text-[#8a3f16]">مطابقة عشوائية · خصمك جاهز</p>
                </div>
              )}

              {/* ── Player visual row ── */}
              <div className="flex items-center justify-center gap-2 sm:gap-4">

                {/* ── My avatar ── */}
                <div className="flex flex-col items-center gap-2">
                  <div className="relative">
                    <motion.div
                      aria-hidden
                      animate={{ opacity: [0.5, 1, 0.5], scale: [0.92, 1.06, 0.92] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute inset-0 -z-10 rounded-full blur-xl"
                      style={{ background: "rgba(255,149,0,0.5)" }}
                    />
                    <div
                      className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full sm:h-20 sm:w-20"
                      style={{
                        background: "linear-gradient(135deg,#FF9F0A 0%,#FF6B00 100%)",
                        boxShadow: "0 0 0 3px #FFB300, 0 0 0 6px rgba(255,179,0,0.22), 0 8px 24px rgba(255,122,0,0.4)",
                      }}
                    >
                      <svg viewBox="0 0 56 56" fill="none" className="h-10 w-10 sm:h-12 sm:w-12" aria-hidden>
                        <circle cx="28" cy="22" r="10" fill="rgba(255,255,255,0.9)" />
                        <ellipse cx="28" cy="44" rx="14" ry="9" fill="rgba(255,255,255,0.9)" />
                        <circle cx="24.5" cy="21" r="1.8" fill="#8a3f16" />
                        <circle cx="31.5" cy="21" r="1.8" fill="#8a3f16" />
                        <path d="M24 25.5 q4 3.5 8 0" stroke="#8a3f16" strokeWidth="1.6" strokeLinecap="round" fill="none" />
                      </svg>
                      <span aria-hidden className="pointer-events-none absolute inset-x-3 top-1.5 h-2.5 rounded-full bg-white/40 blur-[1.5px]" />
                    </div>
                    {/* crown for host */}
                    {isHost && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-lg leading-none" aria-label="مضيف">
                        👑
                      </span>
                    )}
                    {/* ready dot */}
                    <motion.span
                      animate={mePlayer?.ready
                        ? { scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }
                        : { scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 1.4, repeat: Infinity }}
                      className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full ring-2 ring-white ${mePlayer?.ready ? "bg-emerald-400" : "bg-amber-400"}`}
                    />
                  </div>
                  <div className="text-center">
                    <p className="max-w-[72px] truncate text-xs font-extrabold text-[#8a3f16] sm:max-w-[88px] sm:text-sm">
                      {displayName}
                    </p>
                    <p className={`mt-0.5 text-[10px] font-bold sm:text-xs ${mePlayer?.ready ? "text-emerald-600" : "text-amber-600"}`}>
                      {mePlayer?.ready ? "جاهز" : "بانتظار"}
                    </p>
                  </div>
                </div>

                {/* connection dots + center ؟ */}
                <div className="flex flex-1 items-center justify-center gap-1.5 sm:gap-2.5">
                  {/* left dots */}
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={`l${i}`}
                      className="h-1.5 w-1.5 rounded-full bg-[#FFB300]"
                      animate={{ scale: [1, 1.6, 1], opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1, repeat: Infinity, ease: "easeInOut", delay: i * 0.22 }}
                    />
                  ))}
                  {/* center disc */}
                  <div className="relative flex h-14 w-14 shrink-0 items-center justify-center sm:h-16 sm:w-16">
                    <motion.div
                      aria-hidden
                      animate={{ opacity: [0.4, 0.9, 0.4], scale: [0.85, 1.05, 0.85] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute inset-0 rounded-full blur-xl"
                      style={{ background: "rgba(255,159,10,0.55)" }}
                    />
                    <motion.div
                      aria-hidden
                      animate={{ scale: [1, 1.2, 1], opacity: [0.25, 0.08, 0.25] }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute inset-0 rounded-full border-2 border-[#FF9F0A]/70"
                    />
                    <div
                      className="relative z-10 flex h-10 w-10 items-center justify-center overflow-hidden rounded-full sm:h-12 sm:w-12"
                      style={{
                        background: "linear-gradient(160deg,#FF9F0A 0%,#FF6B00 100%)",
                        boxShadow: "inset 0 2px 0 rgba(255,255,255,0.45), 0 6px 0 #be5200, 0 10px 22px rgba(255,122,0,0.5)",
                      }}
                    >
                      <span className="text-2xl font-black text-white sm:text-3xl" style={{ textShadow: "0 2px 0 rgba(0,0,0,0.22)" }}>
                        ؟
                      </span>
                      <span aria-hidden className="pointer-events-none absolute inset-x-1.5 top-1 h-2 rounded-full bg-white/40 blur-[1px]" />
                    </div>
                  </div>
                  {/* right dots */}
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={`r${i}`}
                      className="h-1.5 w-1.5 rounded-full bg-[#FFB300]"
                      animate={{ scale: [1, 1.6, 1], opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1, repeat: Infinity, ease: "easeInOut", delay: 0.66 + i * 0.22 }}
                    />
                  ))}
                </div>

                {/* ── Opponent slot ── */}
                <div className="flex flex-col items-center gap-2">
                  <div className="relative">
                    {opponent ? (
                      <>
                        <motion.div
                          aria-hidden
                          animate={{ opacity: [0.4, 0.85, 0.4], scale: [0.9, 1.05, 0.9] }}
                          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                          className="absolute inset-0 -z-10 rounded-full blur-xl"
                          style={{ background: "rgba(255,149,0,0.4)" }}
                        />
                        <div
                          className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full sm:h-20 sm:w-20"
                          style={{
                            background: "linear-gradient(135deg,#FF9F0A 0%,#FF6B00 100%)",
                            boxShadow: "0 0 0 3px #FFB300, 0 0 0 6px rgba(255,179,0,0.2), 0 8px 24px rgba(255,122,0,0.38)",
                          }}
                        >
                          <svg viewBox="0 0 56 56" fill="none" className="h-10 w-10 sm:h-12 sm:w-12" aria-hidden>
                            <circle cx="28" cy="22" r="10" fill="rgba(255,255,255,0.9)" />
                            <ellipse cx="28" cy="44" rx="14" ry="9" fill="rgba(255,255,255,0.9)" />
                            <circle cx="24.5" cy="21" r="1.8" fill="#8a3f16" />
                            <circle cx="31.5" cy="21" r="1.8" fill="#8a3f16" />
                            <path d="M24 25.5 q4 3.5 8 0" stroke="#8a3f16" strokeWidth="1.6" strokeLinecap="round" fill="none" />
                          </svg>
                          <span aria-hidden className="pointer-events-none absolute inset-x-3 top-1.5 h-2.5 rounded-full bg-white/40 blur-[1.5px]" />
                        </div>
                        {opponent.uid === room.hostUid && (
                          <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-lg leading-none">👑</span>
                        )}
                        <motion.span
                          animate={opponent.ready
                            ? { scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }
                            : { scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
                          transition={{ duration: 1.4, repeat: Infinity, delay: 0.3 }}
                          className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full ring-2 ring-white ${opponent.ready ? "bg-emerald-400" : "bg-amber-400"}`}
                        />
                      </>
                    ) : (
                      /* silhouette waiting slot */
                      <>
                        <motion.div
                          aria-hidden
                          animate={{ opacity: [0.3, 0.6, 0.3], scale: [0.9, 1.07, 0.9] }}
                          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                          className="absolute inset-0 -z-10 rounded-full blur-xl"
                          style={{ background: "rgba(255,179,0,0.3)" }}
                        />
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-0 rounded-full"
                          style={{ background: "conic-gradient(rgba(255,179,0,0.5) 0deg, transparent 110deg, rgba(255,122,0,0.35) 240deg, transparent 360deg)" }}
                        />
                        <div
                          className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full sm:h-20 sm:w-20"
                          style={{ background: "linear-gradient(135deg,#F5E0C0 0%,#EAC898 100%)", boxShadow: "0 0 0 3px rgba(255,179,0,0.3), 0 6px 20px rgba(196,134,82,0.28)" }}
                        >
                          <svg viewBox="0 0 56 56" fill="none" className="h-10 w-10 sm:h-12 sm:w-12" aria-hidden>
                            <circle cx="28" cy="22" r="10" fill="rgba(139,100,50,0.22)" />
                            <ellipse cx="28" cy="44" rx="14" ry="9" fill="rgba(139,100,50,0.18)" />
                          </svg>
                          <motion.div
                            aria-hidden
                            animate={{ opacity: [0.1, 0.3, 0.1] }}
                            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute inset-0 rounded-full"
                            style={{ background: "radial-gradient(circle at 40% 35%, rgba(255,220,150,0.45), transparent 65%)" }}
                          />
                        </div>
                        <motion.span
                          animate={{ scale: [1, 1.4, 1], opacity: [0.8, 0.4, 0.8] }}
                          transition={{ duration: 1.6, repeat: Infinity }}
                          className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#FFB300] ring-2 ring-white text-[8px] font-black text-white"
                        >
                          ?
                        </motion.span>
                      </>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="max-w-[72px] truncate text-xs font-extrabold text-[#8a3f16] sm:max-w-[88px] sm:text-sm">
                      {opponent ? opponent.displayName : "خصمك؟"}
                    </p>
                    {opponent ? (
                      <p className={`mt-0.5 text-[10px] font-bold sm:text-xs ${opponent.ready ? "text-emerald-600" : "text-amber-600"}`}>
                        {opponent.ready ? "جاهز" : "بانتظار"}
                      </p>
                    ) : (
                      <p className="mt-0.5 text-[10px] font-bold text-[#bc7a45] sm:text-xs">في الطريق…</p>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Match settings chips ── */}
              <div className="mt-6 flex flex-wrap justify-center gap-2.5">
                {/* question timer */}
                <div
                  className="flex items-center gap-2 rounded-2xl px-3.5 py-2.5"
                  style={{ background: "#FFF8EE", boxShadow: "0 3px 10px rgba(196,134,82,0.14), inset 0 0 0 1.5px rgba(244,196,141,0.55)" }}
                >
                  <span className="grid h-7 w-7 place-items-center rounded-xl bg-[#FFF1DF]">
                    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
                      <circle cx="10" cy="10" r="7" stroke="#c2530c" strokeWidth="1.7" />
                      <path d="M10 6.5v3.5l2 2" stroke="#c2530c" strokeWidth="1.7" strokeLinecap="round" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-[10px] font-semibold text-[#bc7a45]">سؤال</p>
                    <p className="text-xs font-extrabold text-[#8a3f16]">{room.questionTimerSec ?? 20} ثانية</p>
                  </div>
                </div>
                {/* answer timer */}
                <div
                  className="flex items-center gap-2 rounded-2xl px-3.5 py-2.5"
                  style={{ background: "#FFF8EE", boxShadow: "0 3px 10px rgba(196,134,82,0.14), inset 0 0 0 1.5px rgba(244,196,141,0.55)" }}
                >
                  <span className="grid h-7 w-7 place-items-center rounded-xl bg-[#FFF1DF]">
                    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
                      <circle cx="10" cy="10" r="7" stroke="#c2530c" strokeWidth="1.7" />
                      <path d="M7 10l2 2 4-4" stroke="#c2530c" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-[10px] font-semibold text-[#bc7a45]">إجابة</p>
                    <p className="text-xs font-extrabold text-[#8a3f16]">{room.answerTimerSec ?? 15} ثانية</p>
                  </div>
                </div>
                {/* voice mode */}
                {voiceMode && (
                  <div
                    className="flex items-center gap-2 rounded-2xl px-3.5 py-2.5"
                    style={{ background: "#F0FDF4", boxShadow: "0 3px 10px rgba(22,163,74,0.14), inset 0 0 0 1.5px rgba(134,239,172,0.55)" }}
                  >
                    <span className="grid h-7 w-7 place-items-center rounded-xl bg-emerald-100">
                      <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
                        <path d="M6 8c0-2.21 1.79-4 4-4s4 1.79 4 4" stroke="#16a34a" strokeWidth="1.7" strokeLinecap="round" />
                        <rect x="4" y="7.5" width="4" height="6" rx="2" fill="#16a34a" opacity=".5" />
                        <rect x="12" y="7.5" width="4" height="6" rx="2" fill="#16a34a" opacity=".5" />
                        <path d="M10 15v2" stroke="#16a34a" strokeWidth="1.7" strokeLinecap="round" />
                      </svg>
                    </span>
                    <div>
                      <p className="text-[10px] font-semibold text-emerald-700">وضع المكالمة</p>
                      <p className="text-xs font-extrabold text-emerald-800">مفعل</p>
                    </div>
                  </div>
                )}
              </div>

              {customModeActive && !randomLobby && opponent ? (
                <div
                  className="mt-5 rounded-2xl border border-[#f5dcc8] bg-[#FFFBF6]/95 px-4 py-3 shadow-[0_8px_22px_rgba(196,134,82,0.12)]"
                  dir="rtl"
                >
                  <p className="mb-2.5 text-center text-[13px] font-extrabold text-[#8a3f16]">جاهزية الغرفة</p>
                  <div className="grid grid-cols-2 gap-3 text-[11px] font-bold sm:text-xs">
                    <div
                      className={`relative rounded-xl bg-white/90 px-2.5 py-2 transition-shadow duration-300 ${
                        mePickDone
                          ? "ring-2 ring-emerald-400/75 shadow-[0_0_22px_rgba(52,211,153,0.38)]"
                          : "ring-1 ring-[#f4e0cc]"
                      }`}
                    >
                      {mePickDone ? (
                        <span
                          className="absolute -top-1.5 end-1.5 grid h-6 w-6 place-items-center rounded-full bg-emerald-500 text-[11px] text-white shadow-md shadow-emerald-600/35 ring-2 ring-white"
                          aria-hidden
                        >
                          ✓
                        </span>
                      ) : null}
                      <p className="truncate text-[#bc7a45]">أنت</p>
                      <p className={`mt-1 ${mePlayer?.ready ? "text-emerald-700" : "text-amber-700"}`}>
                        {mePlayer?.ready ? "✓ جاهز" : "⋯ لم يُعلَن الجاهز بعد"}
                      </p>
                      <p className={`mt-0.5 ${mePickDone ? "text-emerald-700" : "text-amber-700"}`}>
                        {mePickDone ? "✓ تم اختيار بطاقة للخصم" : "⋯ بانتظار بطاقة للخصم"}
                      </p>
                    </div>
                    <div
                      className={`relative rounded-xl bg-white/90 px-2.5 py-2 transition-shadow duration-300 ${
                        oppPickDone
                          ? "ring-2 ring-emerald-400/75 shadow-[0_0_22px_rgba(52,211,153,0.38)]"
                          : "ring-1 ring-[#f4e0cc]"
                      }`}
                    >
                      {oppPickDone ? (
                        <span
                          className="absolute -top-1.5 end-1.5 grid h-6 w-6 place-items-center rounded-full bg-emerald-500 text-[11px] text-white shadow-md shadow-emerald-600/35 ring-2 ring-white"
                          aria-hidden
                        >
                          ✓
                        </span>
                      ) : null}
                      <p className="truncate text-[#bc7a45]">{opponent.displayName}</p>
                      <p className={`mt-1 ${opponent.ready ? "text-emerald-700" : "text-amber-700"}`}>
                        {opponent.ready ? "✓ جاهز" : "⋯ بانتظار الجاهز"}
                      </p>
                      <p className={`mt-0.5 ${oppPickDone ? "text-emerald-700" : "text-amber-700"}`}>
                        {oppPickDone ? "✓ تم اختيار البطاقة" : "⋯ بانتظار اختيار بطاقة الخصم"}
                      </p>
                    </div>
                  </div>
                  {isHost && bothReady && !bothPickedCustom ? (
                    <p className="mt-3 text-center text-[11px] font-bold text-[#c2530c]">
                      كل اللاعبين جاهزون — بقي أن يحفظ كلٌ بطاقته للخصم ثم يظهر زر «ابدأ المباراة».
                    </p>
                  ) : null}
                </div>
              ) : null}

              {customLobby ? (
                <section
                  className={`mt-6 overflow-hidden rounded-2xl bg-gradient-to-br from-[#FFF9FF] via-[#FFF7EE] to-[#FFF2DE] p-4 shadow-[0_10px_28px_rgba(168,85,247,0.12)] ${
                    showCardSuccessVisual
                      ? "border-2 border-emerald-400/55 ring-1 ring-emerald-300/40"
                      : "border border-[#f0dce8]"
                  }`}
                >
                  <div className="mb-3 flex items-start gap-3">
                    <span
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-lg font-black text-white"
                      style={{
                        background: "linear-gradient(135deg,#c084fc 0%,#FF9F0A 100%)",
                        boxShadow: "0 4px 12px rgba(168,85,247,0.35)",
                      }}
                      aria-hidden
                    >
                      ★
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-extrabold text-[#8a3f16]">اختر بطاقة لخصمك</p>
                      <p className="mt-1 text-xs font-semibold leading-relaxed text-[#a16231]">
                        صورة واحدة وإجابة صحيحة — الخصم هو من سيخمنها. يمكنك التعديل بدلًا منها في أي وقت قبل البدء.
                      </p>
                      {showCardSuccessVisual ? (
                        <motion.p
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/12 px-3 py-1 text-[11px] font-extrabold text-emerald-800 ring-1 ring-emerald-400/35"
                        >
                          <span className="text-emerald-600">✓</span>
                          تم اختيار بطاقة خصمك
                        </motion.p>
                      ) : null}
                    </div>
                  </div>

                  {dirtyAgainstServer ? (
                    <p className="mb-3 rounded-xl border border-amber-200/90 bg-amber-50/95 px-3 py-2 text-center text-[11px] font-bold leading-relaxed text-amber-950">
                      عدّلت الصورة أو الاسم — اضغط «حفظ بطاقة خصمك» لتحديث اختيارك على الخادم.
                    </p>
                  ) : null}

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
                    <motion.div
                      key={customSavePulse}
                      initial={customSavePulse === 0 ? false : { scale: 0.93, opacity: 0.86 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 24 }}
                      className="relative flex aspect-square w-full max-w-[168px] shrink-0 self-center sm:h-[156px] sm:w-[156px]"
                    >
                      {showCardSuccessVisual ? (
                        <motion.div
                          aria-hidden
                          className="pointer-events-none absolute inset-[-10px] -z-10 rounded-[24px] blur-2xl"
                          animate={{ opacity: [0.4, 0.75, 0.4], scale: [0.96, 1.03, 0.96] }}
                          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                          style={{
                            background:
                              "radial-gradient(closest-side,rgba(52,211,153,0.55),rgba(16,185,129,0.15),transparent 72%)",
                          }}
                        />
                      ) : null}
                      <motion.div
                        className="h-full w-full"
                        animate={
                          showCardSuccessVisual
                            ? { scale: [1, 1.02, 1] }
                            : { scale: 1 }
                        }
                        transition={{ duration: 0.55, ease: "easeOut" }}
                      >
                        <motion.button
                          type="button"
                          disabled={lobbyCustomBusy}
                          onClick={() => lobbyCustomFileRef.current?.click()}
                          whileTap={{ scale: 0.98 }}
                          className={`relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-2xl ${
                            showCardSuccessVisual
                              ? "border-2 border-emerald-400 shadow-[0_12px_32px_rgba(34,197,94,0.32),inset_0_2px_0_rgba(255,255,255,0.55)]"
                              : showDraftEditVisual
                                ? "border-2 border-amber-400/90 bg-gradient-to-br from-[#FFFBF0] to-[#FFF4D6] shadow-[0_8px_22px_rgba(245,158,11,0.2)]"
                                : "border-2 border-dashed border-[#f4c49a] bg-gradient-to-br from-[#FFF9F0] to-[#FFE8CC]"
                          }`}
                          style={
                            showCardSuccessVisual
                              ? {
                                  background:
                                    "linear-gradient(155deg,#ecfdf5 0%,#d1fae5 42%,#ecfccb 100%)",
                                }
                              : !showDraftEditVisual
                                ? {
                                    boxShadow:
                                      "inset 0 2px 0 rgba(255,255,255,0.65), 0 8px 20px rgba(255,149,0,0.14)",
                                  }
                                : undefined
                          }
                        >
                          {showCardSuccessVisual ? (
                            <span className="absolute end-2 top-2 z-20 grid h-8 w-8 place-items-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-700/30 ring-2 ring-white">
                              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
                                <path
                                  d="M5 13l4 4L19 7"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </span>
                          ) : null}
                          {lobbyCustomBusy ? (
                            <span className="text-sm font-bold text-[#c2530c]">جاري المعالجة…</span>
                          ) : tileImageSrc ? (
                            <>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={tileImageSrc}
                                alt=""
                                className="absolute inset-0 h-full w-full object-cover"
                              />
                              <div
                                className={`absolute inset-0 rounded-2xl ring-2 ring-inset ${
                                  showCardSuccessVisual ? "ring-emerald-200/90" : "ring-white/40"
                                }`}
                              />
                              <span className="relative z-10 mt-auto mb-2 rounded-full bg-black/55 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
                                {showCardSuccessVisual ? "تغيير البطاقة" : "تغيير الصورة"}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="text-3xl">📷</span>
                              <span className="mt-2 px-3 text-center text-sm font-black text-[#c2530c]">
                                رفع صورة
                              </span>
                              <span className="mt-1 px-2 text-center text-[9px] font-semibold text-[#a16231]/90">
                                PNG · JPG · WEBP
                              </span>
                            </>
                          )}
                        </motion.button>
                      </motion.div>
                    </motion.div>

                    <div className="min-w-0 flex-1 space-y-2">
                      <label className="block text-[11px] font-bold text-[#a16231]">
                        الإجابة الصحيحة التي سيخمنها خصمك
                      </label>
                      <Input
                        dir="rtl"
                        value={lobbyCustomName}
                        onChange={(ev) => setLobbyCustomName(ev.target.value)}
                        placeholder='مثال: رونالدو'
                        className="font-bold text-[#8a3f16]"
                      />
                      {lobbyCustomName.trim().length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {generateGuessAliases(lobbyCustomName.trim())
                            .slice(0, 8)
                            .map((h) => (
                              <span
                                key={h}
                                className="rounded-full bg-[#FFF1DF] px-2 py-0.5 text-[10px] font-bold text-[#9a4f1d] ring-1 ring-[#f4d4b0]/80"
                              >
                                {h}
                              </span>
                            ))}
                        </div>
                      )}
                      <motion.button
                        type="button"
                        disabled={
                          lobbyCustomBusy ||
                          !lobbyCustomPreview ||
                          !lobbyCustomName.trim()
                        }
                        onClick={() => void submitLobbyOpponentCard()}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="mt-2 w-full rounded-2xl py-3 text-base font-black text-white disabled:opacity-55"
                        style={{
                          background: "linear-gradient(180deg,#FF9F0A 0%,#FF5F00 100%)",
                          boxShadow:
                            "inset 0 2px 0 rgba(255,255,255,0.42), 0 8px 0 #be5200, 0 14px 28px rgba(255,107,0,0.35)",
                          textShadow: "0 1px 0 rgba(0,0,0,0.2)",
                        }}
                      >
                        حفظ بطاقة خصمك
                      </motion.button>
                    </div>
                  </div>

                  {!bothPickedCustom ? (
                    <p className="mt-3 text-center text-xs font-bold text-[#c2530c]">
                      انتظر حتى يختار كلٌ منكما بطاقة للآخر، ثم يمكن للمضيف بدء المباراة.
                    </p>
                  ) : null}
                </section>
              ) : null}

              {/* ── Primary CTA ── */}
              <div className="mt-7 space-y-3">
                {/* Ready toggle — always show for non-random non-host, or non-random host pre-start */}
                {!randomLobby && (
                  <div className="relative">
                    <motion.div
                      aria-hidden
                      animate={{ opacity: [0.55, 1, 0.55], scale: [0.95, 1.06, 0.95] }}
                      transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute inset-0 -z-10 rounded-[26px] blur-2xl"
                      style={{ background: mePlayer?.ready
                        ? "radial-gradient(closest-side,rgba(22,163,74,0.4),transparent 70%)"
                        : "radial-gradient(closest-side,rgba(255,138,30,0.6),transparent 70%)" }}
                    />
                    <motion.button
                      type="button"
                      disabled={busy}
                      onClick={() => void toggleReady()}
                      whileHover={{ y: -3, scale: 1.02 }}
                      whileTap={{ y: 5, scale: 0.97 }}
                      className="relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-[24px] py-[18px] text-2xl font-black text-white disabled:opacity-60 sm:text-3xl"
                      style={mePlayer?.ready
                        ? {
                            background: "linear-gradient(180deg,#22c55e 0%,#16a34a 100%)",
                            boxShadow: "inset 0 2.5px 0 rgba(255,255,255,0.45), inset 0 -7px 14px rgba(0,100,40,0.3), 0 12px 0 #15803d, 0 22px 36px rgba(22,163,74,0.45)",
                          }
                        : {
                            background: "linear-gradient(180deg,#FF9F0A 0%,#FF7A00 100%)",
                            boxShadow: "inset 0 2.5px 0 rgba(255,255,255,0.52), inset 0 -7px 16px rgba(150,50,0,0.38), 0 13px 0 #be5200, 0 24px 40px rgba(255,122,0,0.55)",
                          }
                      }
                    >
                      <span aria-hidden className="pointer-events-none absolute inset-x-8 top-2 h-3 rounded-full bg-white/35 blur-[2.5px]" />
                      {mePlayer?.ready ? (
                        <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
                          <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
                          <polygon points="5,3 19,12 5,21" fill="white" />
                        </svg>
                      )}
                      <span style={{ textShadow: "0 2px 0 rgba(0,0,0,0.22)" }}>
                        {mePlayer?.ready ? "جاهز ✓" : "جاهز"}
                      </span>
                    </motion.button>
                  </div>
                )}

                {/* Start match — host only, both ready, non-random */}
                {!randomLobby && isHost && (
                  <AnimatePresence mode="wait">
                    {bothReady && bothPickedCustom ? (
                      <motion.div
                        key="start-match-cta"
                        initial={{ opacity: 0, scale: 0.92, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.94, y: 8 }}
                        transition={{ type: "spring", stiffness: 340, damping: 26 }}
                        className="relative"
                      >
                        <motion.div
                          aria-hidden
                          animate={{ opacity: [0.55, 1, 0.55], scale: [0.96, 1.08, 0.96] }}
                          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                          className="absolute inset-0 -z-10 rounded-[26px] blur-2xl"
                          style={{
                            background:
                              "radial-gradient(closest-side,rgba(255,159,40,0.85),rgba(255,122,0,0.35),transparent 72%)",
                          }}
                        />
                        <motion.button
                          type="button"
                          disabled={busy}
                          onClick={() => void startMatch()}
                          whileHover={{ y: -4, scale: 1.03 }}
                          whileTap={{ y: 6, scale: 0.97 }}
                          className="relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-[24px] py-[18px] text-2xl font-black text-white disabled:opacity-60 sm:text-3xl"
                          style={{
                            background: "linear-gradient(180deg,#FFC933 0%,#FF7A00 100%)",
                            boxShadow:
                              "inset 0 3px 0 rgba(255,255,255,0.55), inset 0 -8px 18px rgba(180,70,0,0.35), 0 14px 0 #b45300, 0 26px 48px rgba(255,122,0,0.55)",
                          }}
                        >
                          <span aria-hidden className="pointer-events-none absolute inset-x-8 top-2 h-3 rounded-full bg-white/45 blur-[2px]" />
                          <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
                            <polygon points="5,3 19,12 5,21" fill="white" />
                          </svg>
                          <span style={{ textShadow: "0 2px 0 rgba(0,0,0,0.22)" }}>
                            ابدأ المباراة
                          </span>
                        </motion.button>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                )}

                {/* Guest waiting messages */}
                {!randomLobby && !isHost && !mePlayer?.ready && (
                  <p className="text-center text-sm font-semibold text-[#bc7a45]">
                    اضغط جاهز، ثم انتظر المضيف ليبدأ اللعب.
                  </p>
                )}
                {!randomLobby && !isHost && mePlayer?.ready && !bothReady && (
                  <p className="text-center text-sm font-semibold text-[#bc7a45]">
                    في انتظار جاهزية المضيف…
                  </p>
                )}
                {randomLobby && !isHost && (
                  <div className="flex items-center justify-center gap-2 text-sm font-semibold text-[#bc7a45]">
                    <span>جاري البدء تلقائياً</span>
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="block h-1.5 w-1.5 rounded-full bg-[#bc7a45]"
                        animate={{ y: [0, -4, 0], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                )}

                {/* Leave room */}
                <motion.button
                  type="button"
                  onClick={requestExit}
                  whileHover={{ y: -2, scale: 1.01 }}
                  whileTap={{ y: 3, scale: 0.98 }}
                  className="flex w-full items-center justify-center gap-2 rounded-[24px] py-4 text-base font-extrabold text-[#8a3f16]"
                  style={{
                    background: "linear-gradient(180deg,#FFFFFF 0%,#FFF4E4 100%)",
                    boxShadow: "inset 0 1.5px 0 rgba(255,255,255,0.9), 0 8px 0 rgba(196,134,82,0.26), 0 14px 28px rgba(196,134,82,0.16)",
                  }}
                >
                  <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0" aria-hidden>
                    <path d="M5 5l10 10M15 5L5 15" stroke="#8a3f16" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  مغادرة الغرفة
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── Leave confirm modal ── */}
        <AnimatePresence>
          {leaveConfirmOpen ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-[#6a3f1b]/45 px-4 backdrop-blur-sm"
              onClick={() => setLeaveConfirmOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.92 }}
                animate={{ scale: 1 }}
                onClick={(e: MouseEvent) => e.stopPropagation()}
              >
                <Panel className="max-w-sm text-center">
                  <p className="text-lg font-bold text-[#8a3f16]">هل أنت متأكد من الخروج؟</p>
                  <div className="mt-5 flex gap-3">
                    <Button type="button" className="flex-1" onClick={() => void confirmLeave()}>نعم</Button>
                    <Button type="button" variant="ghost" className="flex-1" onClick={() => setLeaveConfirmOpen(false)}>إلغاء</Button>
                  </div>
                </Panel>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    );
  }

  // ─── PLAYING / ENDED ────────────────────────────────────────────────────────

  const opponent = room.players.find((p) => p.uid !== uid);
  const opponentName = opponent?.displayName ?? "الخصم";

  // Turn label — surface action the current actor must do
  const turnAction = match?.status === "active"
    ? myTurn
      ? phase === "question"
        ? voiceMode ? "اسأل الآن بصوتك! 🎙️" : "اسأل الآن!"
        : voiceMode ? "أجب بصوتك! 🎙️" : "أجب الآن!"
      : phase === "question"
        ? voiceMode ? `${opponentName} يسألك…` : `${opponentName} يسأل…`
        : voiceMode ? `${opponentName} يجيب…` : `${opponentName} يجيب…`
    : null;

  const activeActorUid = match?.status === "active" ? match.actorUid ?? null : null;
  const activeActorName =
    activeActorUid ? room.players.find((p) => p.uid === activeActorUid)?.displayName ?? "اللاعب" : "";

  const voicePlayingUI =
    voiceMode && room.status === "playing" && match?.status === "active" && !ended;
  const voiceAwaitMatchUI = voiceMode && room.status === "playing" && !match && !ended;
  const voiceFocusPlaying = voiceAwaitMatchUI || voicePlayingUI;

  const voiceTurnHeadline =
    match?.status === "active"
      ? myTurn
        ? phase === "question"
          ? "اسأل الآن"
          : "أجب الآن"
        : phase === "question"
          ? "بانتظار السؤال"
          : "بانتظار الإجابة"
      : null;

  const voiceTurnSub =
    match?.status === "active"
      ? myTurn
        ? phase === "question"
          ? "اطرح سؤالك بالصوت على الخصم"
          : "أجِب بالصوت بوضوح"
        : phase === "question"
          ? `${opponentName} يطرح السؤال`
          : `${opponentName} يجيب الآن`
      : null;

  // Render a single chat message
  function renderMessage(m: (typeof messages)[number]) {
    const isMe = m.senderUid === uid;
    const isSystem = m.senderUid === "system";
    const isGuessMsg = m.type === "guess";
    // Some flows tag explicit "answer" messages; current backend uses "chat"
    // for the post-question reply, but we keep this branch for forward compat.
    const isAnswer = (m.type as string) === "answer";
    const isQuestion = m.type === "question";

    // ── system / event pill ──────────────────────────────────
    if (isSystem) {
      return (
        <motion.div
          key={m.id}
          layout
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 380, damping: 26 }}
          className="mx-auto w-fit max-w-[88%] rounded-2xl border border-[#f2d4b5] bg-[#fff4e4] px-4 py-1.5 text-center text-xs font-semibold text-[#8a5a2a]"
        >
          {m.text}
        </motion.div>
      );
    }

    // ── guess bubble ─────────────────────────────────────────
    if (isGuessMsg) {
      return (
        <motion.div
          key={m.id}
          layout
          initial={{ opacity: 0, scale: 0.84, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 340, damping: 22 }}
          className={`mx-1 overflow-hidden rounded-[1.4rem] ${
            m.correct
              ? "bg-[#dcfce7]"
              : "bg-[#fff0f0]"
          }`}
          style={
            m.correct
              ? {
                  border: "2px solid #16a34a",
                  boxShadow: "0 0 0 5px rgba(22,163,74,0.14), 0 10px 28px rgba(22,163,74,0.20)",
                }
              : {
                  border: "2px solid #fca5a5",
                  boxShadow: "0 0 0 3px rgba(252,165,165,0.22), 0 6px 18px rgba(220,80,80,0.10)",
                }
          }
        >
          <div className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold ${m.correct ? "bg-[#bbf7d0] text-[#166534]" : "bg-[#fecaca] text-[#991b1b]"}`}>
            <span>{m.correct ? "🎉 تخمين صحيح!" : "✗ تخمين خاطئ"}</span>
            <span className="mr-auto opacity-70">{isMe ? "أنت" : m.senderName}</span>
          </div>
          <div className={`px-4 py-2.5 text-sm font-black ${m.correct ? "text-[#14532d]" : "text-[#7f1d1d]"}`}>
            {m.text}
          </div>
        </motion.div>
      );
    }

    // ── normal question / answer / chat bubble ────────────────
    // Color semantics: question→purple, answer→green, plain→orange(me)/white(them)
    const bubbleStyle: CSSProperties = isQuestion
      ? { background: "#ede9fe", border: "1.5px solid #c4b5fd", color: "#3b1f6e" }
      : isAnswer
        ? { background: "#dcfce7", border: "1.5px solid #86efac", color: "#14532d" }
        : isMe
          ? { background: "#ffd7a8", border: "1.5px solid #f0bf8a", color: "#6f3714" }
          : { background: "#ffffff", border: "1.5px solid #e8d5b5", color: "#6f3714" };

    const avatarBg = isMe
      ? "linear-gradient(135deg,#FF9F0A,#FF6B00)"
      : "linear-gradient(135deg,#a78bfa,#7c3aed)";

    const typeTag = isQuestion ? "سؤال" : isAnswer ? "إجابة" : null;

    return (
      <motion.div
        key={m.id}
        layout
        initial={{ opacity: 0, x: isMe ? 16 : -16, y: 4 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 26 }}
        className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}
      >
        {/* mini avatar */}
        <div
          className="mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[9px] font-black text-white shadow-sm"
          style={{ background: avatarBg }}
        >
          {isMe ? "أنا" : (m.senderName?.[0] ?? "؟")}
        </div>

        {/* bubble */}
        <div
          className="max-w-[72%] rounded-3xl px-4 py-2.5 text-sm leading-relaxed shadow-sm sm:max-w-[68%]"
          style={bubbleStyle}
        >
          {typeTag && (
            <div className={`mb-1 text-[10px] font-extrabold uppercase tracking-wide ${isQuestion ? "text-[#7c3aed]" : "text-[#16a34a]"}`}>
              {typeTag}
            </div>
          )}
          {!isMe && !typeTag && (
            <div className="mb-0.5 text-[10px] font-semibold text-[#9b6338]">{m.senderName}</div>
          )}
          <div className="whitespace-pre-wrap break-words">{m.text}</div>
        </div>
      </motion.div>
    );
  }

  return (
    <div
      dir="rtl"
      className="relative flex min-h-[100dvh] w-full flex-col overflow-hidden select-none"
      style={{
        background: voiceFocusPlaying
          ? "radial-gradient(135% 82% at 50% 0%, #FFF1DD 0%, #FFECD7 52%, #FDE7CD 100%)"
          : "radial-gradient(130% 75% at 50% 0%, #FFF1DE 0%, #FFEBD3 55%, #FCE6CD 100%)",
      }}
    >
      <ConfettiBurst active={ended && iWon && Boolean(winnerUid)} />

      {/* ── Fixed ambient background ── */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <motion.div
          animate={{ y: [0, -24, 0], x: [0, 16, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#FFCB8A]/40 blur-3xl"
        />
        <motion.div
          animate={{ y: [0, 20, 0], x: [0, -12, 0] }}
          transition={{ duration: 19, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          className="absolute -left-28 top-2/5 h-80 w-80 rounded-full bg-[#FFB574]/28 blur-3xl"
        />
        <motion.div
          animate={{ y: [0, -14, 0] }}
          transition={{ duration: 13, repeat: Infinity, ease: "easeInOut", delay: 7 }}
          className="absolute bottom-24 right-1/3 h-56 w-56 rounded-full bg-[#FFD9A6]/36 blur-3xl"
        />
        {/* Subtle decorative particles */}
        {([
          { char: "؟", top: "7%",  left: "2%",    delay: 0,   size: 38, tint: "rgba(164,80,255,0.09)" },
          { char: "؟", top: "38%", right: "3%",   delay: 2,   size: 30, tint: "rgba(255,138,30,0.11)" },
          { char: "؟", top: "72%", left: "5%",    delay: 3.5, size: 34, tint: "rgba(60,150,255,0.09)" },
          { char: "✦", top: "16%", right: "10%",  delay: 1,   size: 13, tint: "rgba(255,180,90,0.55)"  },
          { char: "✦", top: "55%", left: "12%",   delay: 3,   size: 10, tint: "rgba(150,80,255,0.45)"  },
          { char: "✦", top: "84%", right: "16%",  delay: 4.8, size: 15, tint: "rgba(60,150,255,0.42)"  },
        ] as const).map((s, i) => (
          <motion.span
            key={i}
            aria-hidden
            style={{
              position: "absolute",
              top: s.top,
              left: "left" in s ? s.left : undefined,
              right: "right" in s ? s.right : undefined,
              fontSize: s.size,
              color: s.tint,
              fontWeight: 900,
              userSelect: "none",
              lineHeight: 1,
            }}
            animate={{ y: [0, -9, 0], rotate: [0, 6, 0] }}
            transition={{ duration: 6 + s.delay, repeat: Infinity, ease: "easeInOut", delay: s.delay }}
          >
            {s.char}
          </motion.span>
        ))}
        {voiceFocusPlaying ? (
          <>
            <motion.div
              aria-hidden
              animate={{ y: [0, -14, 0], rotate: [10, 14, 10], opacity: [0.22, 0.35, 0.22] }}
              transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-[6%] top-[32%] h-28 w-20 rounded-3xl bg-[#ffb84d]/25 blur-3xl"
            />
            <motion.div
              aria-hidden
              animate={{ y: [0, 12, 0], rotate: [-8, -12, -8], opacity: [0.18, 0.32, 0.18] }}
              transition={{ duration: 13, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              className="absolute right-[5%] top-[48%] h-32 w-24 rounded-3xl bg-[#ffd89e]/22 blur-3xl"
            />
          </>
        ) : null}
      </div>

      {/* ════════════════════════════════════════════════════════
          TOP HUD
      ════════════════════════════════════════════════════════ */}
      <div className="relative z-10 mx-auto w-full max-w-3xl flex-shrink-0 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5 lg:px-6">
        <div className="flex items-center justify-between gap-2">
          {/* X button — left */}
          <motion.button
            type="button"
            onClick={requestExit}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label="قائمة"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/90 shadow-[0_3px_12px_rgba(196,134,82,0.22)] backdrop-blur-sm"
          >
            <svg viewBox="0 0 18 18" fill="none" className="h-4 w-4" aria-hidden>
              <path d="M3.5 3.5l11 11M14.5 3.5l-11 11" stroke="#6b3d15" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </motion.button>

          {/* Logo center */}
          <span
            className="text-xl font-black tracking-tight sm:text-2xl"
            style={{
              background: "linear-gradient(180deg,#FF9F0A 0%,#E0660A 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 2px 5px rgba(224,102,10,0.30))",
            }}
          >
            مين أنا؟
          </span>

          {/* Leave capsule — right */}
          <motion.button
            type="button"
            onClick={requestExit}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            className="flex items-center gap-1.5 rounded-full bg-white/90 px-3.5 py-2 text-xs font-bold text-[#8a3f16] shadow-[0_3px_12px_rgba(196,134,82,0.18)] backdrop-blur-sm"
          >
            <svg viewBox="0 0 14 14" fill="none" className="h-3 w-3 shrink-0" aria-hidden>
              <path d="M9 2.5l4 4.5-4 4.5M13 7H5.5M2 1v12" stroke="#8a3f16" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            مغادرة
          </motion.button>
        </div>

        {/* Voice mode indicator — active during voice gameplay */}
        {voiceMode && room.status === "playing" && !ended ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 mt-2 flex justify-center px-3"
          >
            <motion.div
              animate={{ boxShadow: ["0 0 0 1.5px rgba(74,222,128,0.45), 0 6px 22px rgba(34,197,94,0.28)", "0 0 0 2px rgba(74,222,128,0.65), 0 8px 28px rgba(34,197,94,0.38)", "0 0 0 1.5px rgba(74,222,128,0.45), 0 6px 22px rgba(34,197,94,0.28)"] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 sm:px-5 sm:py-2.5"
              style={{
                background: "linear-gradient(135deg,#ecfdf5 0%,#d1fae5 100%)",
              }}
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-400/25">
                <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px] text-emerald-700" aria-hidden>
                  <path
                    d="M6 15v3a2 2 0 002 2h1M18 15v3a2 2 0 01-2 2h-1M6 15h-.5A2.5 2.5 0 013 12.5V11a9 9 0 0118 0v1.5A2.5 2.5 0 0118.5 15H18"
                    stroke="currentColor"
                    strokeWidth="1.85"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="text-xs font-black text-emerald-900 sm:text-sm">وضع المكالمة مفعل</span>
            </motion.div>
          </motion.div>
        ) : null}
      </div>

      {/* ════════════════════════════════════════════════════════
          MAIN BODY — chat scroll OR voice viewport (no scroll)
      ════════════════════════════════════════════════════════ */}
      <div
        className={
          voiceFocusPlaying
            ? "relative z-10 mx-auto flex w-full max-w-4xl flex-1 min-h-0 flex-col overflow-hidden px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 sm:px-6 lg:px-8"
            : "relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-3 pb-[max(5.5rem,env(safe-area-inset-bottom))] pt-3 sm:px-5 lg:px-6 [-webkit-overflow-scrolling:touch]"
        }
      >

        {voiceAwaitMatchUI ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-4 py-10">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.12, repeat: Infinity, ease: "linear" }}
              className="grid h-14 w-14 place-items-center rounded-full bg-white/92 shadow-[0_8px_28px_rgba(196,134,82,0.22)] ring-1 ring-[#fde68a]/70"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 text-[#FF9F0A]" aria-hidden>
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.2" strokeOpacity="0.22" />
                <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </motion.div>
            <p className="text-center text-lg font-black text-[#8a3f16]">جاري مزامنة حالة المباراة…</p>
            <p className="max-w-[280px] text-center text-sm font-semibold leading-relaxed text-[#bc7a45]">
              تحدّث بالصوت مع الخصم عبر Discord أو المكالمة. الدردشة النصية معطّلة في وضع المكالمة.
            </p>
          </div>
        ) : voicePlayingUI ? (
          <VoiceModePlayingPanel
            banner={banner}
            displayName={displayName}
            opponentName={opponentName}
            opponent={opponent}
            uid={uid}
            hostUid={room.hostUid}
            isHost={isHost}
            phase={phase}
            myTurn={myTurn}
            activeActorUid={activeActorUid}
            activeActorName={activeActorName}
            voiceTurnHeadline={voiceTurnHeadline}
            voiceTurnSub={voiceTurnSub}
            secLeft={secLeft}
            maxPhaseSec={maxPhaseSec}
            opponentCard={opponentCard}
            busy={busy}
            sendVoiceAck={sendVoiceAck}
            openGuessFlow={openGuessFlow}
          />
        ) : (
          <>
        {/* ── banners ── */}
        <AnimatePresence>
          {banner ? (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex-shrink-0 rounded-2xl border border-[#f4c48d] bg-[#fff2de] px-4 py-2.5 text-center text-sm font-bold text-[#9a5f2d]"
            >
              {banner}
            </motion.div>
          ) : null}
        </AnimatePresence>

        {room.status === "playing" && !match ? (
          <div className="flex-shrink-0 rounded-2xl border border-[#f4d4af] bg-[#fff9ef] px-4 py-2.5 text-center text-sm text-[#a16231]">
            جاري مزامنة حالة المباراة…
          </div>
        ) : null}

        {/* ════════════════════════════════════════════
            TURN INDICATOR — the most important element
        ════════════════════════════════════════════ */}
        {match?.status === "active" && !ended ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${myTurn ? "mine" : "theirs"}-${phase}`}
              initial={{ opacity: 0, scale: 0.93, y: -16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 16 }}
              transition={{ type: "spring", stiffness: 310, damping: 24 }}
              className="relative flex-shrink-0 overflow-hidden rounded-[1.75rem]"
              style={
                myTurn
                  ? {
                      background: "linear-gradient(140deg,#FF9F0A 0%,#FF5F00 100%)",
                      boxShadow: "0 0 0 3px rgba(255,180,0,0.30), 0 0 40px rgba(255,150,40,.45), 0 18px 52px rgba(255,100,0,0.38), inset 0 2.5px 0 rgba(255,255,255,0.36)",
                    }
                  : {
                      background: "linear-gradient(140deg,#FFF8EE 0%,#FFEDD8 100%)",
                      boxShadow: "0 0 0 2px rgba(244,196,141,0.50), 0 12px 28px rgba(196,134,82,0.16), inset 0 1.5px 0 rgba(255,255,255,0.7)",
                    }
              }
            >
              {/* breathing glow overlay when my turn */}
              {myTurn && (
                <motion.div
                  aria-hidden
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="pointer-events-none absolute inset-0"
                  style={{ background: "radial-gradient(ellipse at 50% -10%,rgba(255,230,80,0.50),transparent 60%)" }}
                />
              )}
              {/* inner top shine */}
              <span aria-hidden className="pointer-events-none absolute inset-x-12 top-2.5 h-2 rounded-full bg-white/28 blur-[2px]" />

              <div className="relative flex items-center gap-4 px-5 py-4 sm:px-6 sm:py-5">
                {/* Player avatar */}
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full sm:h-16 sm:w-16"
                  style={
                    myTurn
                      ? {
                          background: "linear-gradient(145deg,#fff3c4 0%,#ffd060 100%)",
                          boxShadow: "0 0 0 3px rgba(255,255,255,0.75), 0 0 20px rgba(255,200,50,0.55), 0 5px 16px rgba(0,0,0,0.12)",
                        }
                      : {
                          background: "linear-gradient(145deg,#FF9F0A 0%,#FF6B00 100%)",
                          boxShadow: "0 0 0 3px rgba(255,180,0,0.45), 0 5px 16px rgba(255,107,0,0.28)",
                        }
                  }
                >
                  <svg viewBox="0 0 48 48" fill="none" className="h-9 w-9 sm:h-10 sm:w-10" aria-hidden>
                    <circle cx="24" cy="18" r="9" fill={myTurn ? "rgba(255,130,0,0.9)" : "rgba(255,255,255,0.92)"} />
                    <ellipse cx="24" cy="38" rx="12" ry="8" fill={myTurn ? "rgba(255,130,0,0.9)" : "rgba(255,255,255,0.92)"} />
                    <circle cx="21" cy="17.5" r="1.5" fill={myTurn ? "#fff" : "#8a3f16"} />
                    <circle cx="27" cy="17.5" r="1.5" fill={myTurn ? "#fff" : "#8a3f16"} />
                    <path d="M21 22 q3 2.8 6 0" stroke={myTurn ? "#fff" : "#8a3f16"} strokeWidth="1.4" strokeLinecap="round" fill="none" />
                  </svg>
                </div>

                {/* Text block */}
                <div className="min-w-0 flex-1">
                  <p className={`text-[11px] font-bold uppercase tracking-widest ${myTurn ? "text-orange-100" : "text-[#bc7a45]"}`}>
                    {myTurn ? "دورك الآن" : `دور ${opponentName}`}
                  </p>
                  <p
                    className={`mt-0.5 truncate text-xl font-black leading-tight sm:text-2xl ${myTurn ? "text-white" : "text-[#8a3f16]"}`}
                    style={myTurn ? { textShadow: "0 2px 0 rgba(0,0,0,0.20)" } : {}}
                  >
                    {turnAction}
                  </p>
                </div>

                {/* Circular timer */}
                {secLeft !== null && (
                  <CircularTimer secLeft={secLeft} maxSec={maxPhaseSec} active={myTurn} />
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        ) : null}

        {/* ════════════════════════════════════════════
            DESKTOP SPLIT: card + chat side by side
        ════════════════════════════════════════════ */}
        <div className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-start">

          {/* ── OPPONENT CARD — left column on desktop ── */}
          <div className="flex-shrink-0 lg:w-[260px] xl:w-[280px]">

            {/* category pill */}
            <div className="mb-2 flex items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
                style={{
                  background: "linear-gradient(135deg,#FFF8EE,#FFEDD8)",
                  boxShadow: "0 2px 8px rgba(196,134,82,0.16), inset 0 0 0 1px rgba(244,196,141,0.45)",
                  color: "#9a4f1d",
                }}
              >
                <svg viewBox="0 0 12 12" fill="none" className="h-2.5 w-2.5" aria-hidden>
                  <path d="M6 1l1.5 3h3l-2.4 1.8.9 3L6 7.2 3 8.8l.9-3L1.5 4h3z" fill="#e07a20" />
                </svg>
                {(() => {
                  const catName = opponentCard?.categoryId
                    ? getCategoryById(opponentCard.categoryId)?.nameAr
                    : null;
                  return catName ? `الفئة: ${catName}` : "بطاقة خصمك";
                })()}
              </span>
            </div>

            {/* card frame */}
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
              className="relative overflow-hidden rounded-[1.5rem]"
              style={{
                background: "linear-gradient(180deg,#FFF9F1 0%,#FFF4E6 100%)",
                boxShadow: "0 0 0 2px rgba(244,196,141,0.50), 0 14px 40px rgba(196,120,40,0.20), inset 0 2px 0 rgba(255,255,255,0.72)",
              }}
            >
              {/* corner glows */}
              <div className="pointer-events-none absolute -left-5 -top-5 h-16 w-16 rounded-full bg-[#ffd080]/28 blur-2xl" />
              <div className="pointer-events-none absolute -right-5 bottom-0 h-16 w-16 rounded-full bg-[#ffb060]/18 blur-2xl" />

              {opponentCard?.imageUrl ? (
                <>
                  <div className="relative h-44 w-full overflow-hidden rounded-t-[1.4rem] sm:h-48 lg:h-44 xl:h-52">
                    <CardImage src={opponentCard.imageUrl} alt={opponentCard.nameAr} />
                    <div className="pointer-events-none absolute inset-0 rounded-t-[1.4rem] ring-1 ring-inset ring-white/25" />
                  </div>
                  <div className="px-4 pb-3 pt-2.5 text-center">
                    <p className="text-base font-black text-[#8a3f16] sm:text-lg">
                      {opponentCard.nameAr}
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex h-44 items-center justify-center text-sm text-[#bc7a45]">
                  بعد بدء المباراة
                </div>
              )}
            </motion.div>
          </div>

          {/* ── CHAT + INPUT — right column (flex-1 on desktop) ── */}
          <div className="flex flex-1 flex-col gap-3 lg:min-h-0">

            {/* CHAT FEED */}
            {!voiceMode && match?.status === "active" && !ended ? (
              <div
                className="flex flex-col overflow-hidden rounded-[1.5rem]"
                style={{
                  background: "#FFFFFF",
                  boxShadow: "0 0 0 1.5px rgba(244,196,141,0.45), 0 16px 44px rgba(196,134,82,0.16), inset 0 2px 0 rgba(255,255,255,0.85)",
                }}
              >
                {/* Chat header */}
                <div
                  className="flex flex-shrink-0 items-center justify-between px-4 pb-3 pt-3.5"
                  style={{ borderBottom: "1.5px solid #f8e8d4" }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-xl"
                      style={{ background: "linear-gradient(135deg,#FF9F0A,#FF6B00)", boxShadow: "0 3px 8px rgba(255,107,0,0.32)" }}
                    >
                      <svg viewBox="0 0 14 14" fill="none" className="h-3.5 w-3.5" aria-hidden>
                        <path d="M1.5 2.5a1 1 0 011-1h9a1 1 0 011 1v6a1 1 0 01-1 1H4.5l-3 2v-9z" fill="white" />
                      </svg>
                    </span>
                    <span className="text-sm font-black text-[#8a3f16]">الدردشة</span>
                  </div>

                  {/* turn type badge */}
                  <span
                    className={`rounded-xl px-3 py-1 text-[11px] font-extrabold ${
                      myTurn
                        ? phase === "answer"
                          ? "bg-[#dcfce7] text-[#166534]"
                          : "bg-[#ede9fe] text-[#5b21b6]"
                        : "bg-[#fff3e0] text-[#a16231]"
                    }`}
                  >
                    {myTurn
                      ? phase === "answer" ? "دورك: إجابة" : "دورك: سؤال"
                      : "دور الخصم"}
                  </span>
                </div>

                {/* Message list */}
                <div className="min-h-[140px] flex-1 space-y-3 overflow-y-auto px-3 py-3 overscroll-contain lg:min-h-[180px] lg:max-h-[340px] [-webkit-overflow-scrolling:touch]">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                      <span className="text-3xl">💬</span>
                      <p className="text-sm font-semibold text-[#c48652]">لا رسائل بعد — ابدأ بالأسئلة!</p>
                    </div>
                  ) : (
                    messages.map((m) => renderMessage(m))
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input area */}
                <div className="flex-shrink-0 p-3" style={{ borderTop: "1.5px solid #f8e8d4" }}>
                  {myTurn ? (
                    <div className="flex items-center gap-2">
                      <input
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        placeholder={phase === "answer" ? "اكتب إجابتك…" : "اكتب سؤالك أو تخمينك…"}
                        disabled={busy}
                        onKeyDown={(e) => { if (e.key === "Enter" && !busy) void sendDraft(); }}
                        dir="rtl"
                        className="min-h-[48px] flex-1 rounded-2xl px-4 text-sm font-semibold text-[#6f3714] placeholder-[#c9955e] outline-none transition-shadow"
                        style={{
                          background: "#FFF9F0",
                          boxShadow: "inset 0 0 0 1.5px rgba(244,196,141,0.55), inset 0 2px 6px rgba(196,134,82,0.07)",
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.boxShadow = "inset 0 0 0 2px rgba(255,149,0,0.50), inset 0 2px 6px rgba(196,134,82,0.08)";
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.boxShadow = "inset 0 0 0 1.5px rgba(244,196,141,0.55), inset 0 2px 6px rgba(196,134,82,0.07)";
                        }}
                      />
                      {/* Send button */}
                      <motion.button
                        type="button"
                        disabled={busy || !draft.trim()}
                        onClick={() => void sendDraft()}
                        whileTap={{ scale: 0.9, y: 2 }}
                        aria-label="إرسال"
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white disabled:opacity-50"
                        style={{
                          background: "linear-gradient(135deg,#FF9F0A,#FF6B00)",
                          boxShadow: "0 6px 0 #be5200, 0 10px 18px rgba(255,107,0,0.36)",
                        }}
                      >
                        <svg viewBox="0 0 18 18" fill="none" className="h-4.5 w-4.5" aria-hidden>
                          <path d="M2.5 9L15.5 3l-4 6 4 6-13-6z" fill="white" />
                        </svg>
                      </motion.button>
                    </div>
                  ) : (
                    <div
                      className="flex items-center justify-center gap-3 rounded-2xl px-4 py-3.5"
                      style={{ background: "#FFF9F0" }}
                    >
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          className="block h-2 w-2 rounded-full bg-[#e0a060]"
                          animate={{ scale: [1, 1.7, 1], opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut", delay: i * 0.24 }}
                        />
                      ))}
                      <span className="text-sm font-semibold text-[#c48652]">بانتظار دورك…</span>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

          </div>{/* end right column */}
        </div>{/* end desktop split */}
          </>
        )}

      </div>{/* end scrollable body */}

      {/* ════════════════════════════════════════════════════════
          FIXED BOTTOM — GUESS BUTTON (hidden in voice mode — guess lives in panel)
      ════════════════════════════════════════════════════════ */}
      {match?.status === "active" && !ended && !voicePlayingUI ? (
        <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-40 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="pointer-events-auto w-full max-w-[min(24rem,92vw)]">
            <motion.button
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.93, y: 3 }}
              onClick={openGuessFlow}
              animate={
                myTurn
                  ? {
                      boxShadow: [
                        "inset 0 2px 0 rgba(255,255,255,0.40), 0 10px 0 #be5200, 0 16px 32px rgba(255,100,0,0.42)",
                        "inset 0 2px 0 rgba(255,255,255,0.40), 0 10px 0 #be5200, 0 20px 44px rgba(255,100,0,0.60)",
                        "inset 0 2px 0 rgba(255,255,255,0.40), 0 10px 0 #be5200, 0 16px 32px rgba(255,100,0,0.42)",
                      ],
                    }
                  : {}
              }
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              className="relative w-full overflow-hidden rounded-[1.5rem] py-4 text-lg font-black"
              style={
                myTurn
                  ? {
                      background: "linear-gradient(140deg,#FF9F0A 0%,#FF5500 100%)",
                      color: "#fff",
                      boxShadow: "inset 0 2px 0 rgba(255,255,255,0.40), 0 10px 0 #be5200, 0 16px 32px rgba(255,100,0,0.42)",
                    }
                  : {
                      background: "linear-gradient(140deg,#FFF4E4 0%,#FFE8C8 100%)",
                      color: "#bc7a45",
                      boxShadow: "0 0 0 1.5px rgba(244,196,141,0.45), 0 6px 0 rgba(196,134,82,0.20), 0 10px 20px rgba(196,134,82,0.12)",
                    }
              }
            >
              <span aria-hidden className="pointer-events-none absolute inset-x-14 top-2 h-1.5 rounded-full bg-white/28 blur-[2px]" />
              🎯 تخمين
            </motion.button>
          </div>
        </div>
      ) : null}

      {/* ════════════════════════════════════════════════════════
          TURN TRANSITION POPUP
      ════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {turnPopup ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.68, y: 32 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.68, y: 32 }}
              transition={{ type: "spring", stiffness: 350, damping: 22 }}
              className="relative overflow-hidden rounded-[2rem] px-14 py-8 text-3xl font-black text-white sm:text-4xl"
              style={{
                background: "linear-gradient(140deg,#FF9F0A 0%,#FF5500 100%)",
                boxShadow: "inset 0 2.5px 0 rgba(255,255,255,0.40), 0 16px 0 #be5200, 0 28px 60px rgba(255,100,0,0.52)",
                textShadow: "0 2px 0 rgba(0,0,0,0.22)",
              }}
            >
              <span aria-hidden className="pointer-events-none absolute inset-x-12 top-3 h-3 rounded-full bg-white/28 blur-sm" />
              {turnPopup}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════════════
          MATCH RESULT SCREEN — full-screen takeover
      ════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {ended ? (
          <MatchResultScreen
            roomId={roomId}
            myUid={uid}
            iWon={iWon}
            winnerUid={winnerUid}
            forfeitWin={forfeitWin}
            myName={displayName}
            opponentName={opponentName}
            opponentCard={opponentCard}
            messages={messages}
            replayBusy={busy}
            onReplay={() => void handleReplay()}
            onHome={() => router.push("/")}
          />
        ) : null}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════════════
          GUESS: ARE YOU SURE
      ════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {guessSureOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[55] flex items-center justify-center bg-[#6a3f1b]/45 px-4 backdrop-blur-sm"
            onClick={() => setGuessSureOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.88, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              onClick={(e: MouseEvent) => e.stopPropagation()}
            >
              <Panel className="max-w-sm text-center">
                <div className="text-4xl">🎯</div>
                <p className="mt-3 text-xl font-black text-[#8a3f16]">هل أنت متأكد؟</p>
                <p className="mt-2 text-sm text-[#a16231]">سيتم استخدام محاولة التخمين في دورك الحالي.</p>
                <div className="mt-6 flex gap-3">
                  <Button type="button" className="min-h-[48px] flex-1" onClick={confirmGuessSure}>تأكيد</Button>
                  <Button type="button" variant="ghost" className="min-h-[48px] flex-1" onClick={() => setGuessSureOpen(false)}>إلغاء</Button>
                </div>
              </Panel>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════════════
          GUESS: INPUT
      ════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {guessInputOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[54] flex items-center justify-center bg-[#6a3f1b]/40 px-4 backdrop-blur-sm"
            onClick={() => setGuessInputOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.90, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 20 }}
              onClick={(e: MouseEvent) => e.stopPropagation()}
            >
              <Panel className="w-full max-w-sm">
                <h3 className="text-2xl font-black text-[#8a3f16]">🎯 تخمين</h3>
                <p className="mt-2 text-sm text-[#a16231]">ما اسم بطاقتك؟</p>
                <div className="mt-4 space-y-3">
                  <Input
                    value={guessDraft}
                    onChange={(e) => setGuessDraft(e.target.value)}
                    placeholder="مثال: جوال، قطة…"
                    className="min-h-[48px]"
                    onKeyDown={(e) => { if (e.key === "Enter") void submitGuess(); }}
                  />
                  <div className="flex flex-wrap gap-3">
                    <Button
                      type="button"
                      className="min-h-[48px] flex-1"
                      disabled={busy || !guessDraft.trim()}
                      onClick={() => void submitGuess()}
                    >
                      تأكيد التخمين
                    </Button>
                    <Button type="button" variant="ghost" className="min-h-[48px]" onClick={() => setGuessInputOpen(false)}>
                      إلغاء
                    </Button>
                  </div>
                </div>
              </Panel>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════════════
          LEAVE CONFIRM
      ════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {leaveConfirmOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[56] flex items-center justify-center bg-[#6a3f1b]/45 px-4 backdrop-blur-sm"
            onClick={() => setLeaveConfirmOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.92 }}
              animate={{ scale: 1 }}
              onClick={(e: MouseEvent) => e.stopPropagation()}
            >
              <Panel className="max-w-sm text-center">
                <p className="text-lg font-bold text-[#8a3f16]">هل أنت متأكد من الخروج؟</p>
                <div className="mt-5 flex gap-3">
                  <Button type="button" className="min-h-[48px] flex-1" onClick={() => void confirmLeave()}>نعم</Button>
                  <Button type="button" variant="ghost" className="min-h-[48px] flex-1" onClick={() => setLeaveConfirmOpen(false)}>إلغاء</Button>
                </div>
              </Panel>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
