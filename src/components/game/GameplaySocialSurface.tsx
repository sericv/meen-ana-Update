"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { RefObject } from "react";
import { memo, useMemo, useState, useCallback } from "react";
import { GameplayChatActionBar } from "@/components/game/play/GameplayChatActionBar";
import { GameplayHeroCard } from "@/components/game/play/GameplayHeroCard";
import { GuessRemainingIndicator } from "@/components/game/play/GuessRemainingIndicator";
import { GameplayTopBar } from "@/components/game/play/GameplayTopBar";
import { IconTarget } from "@/components/game/play/icons";
import { useLiveUserProfile } from "@/hooks/useLiveUserProfile";
import { GP } from "@/components/game/play/tokens";
import { SideActionRail } from "@/components/game/play/SideActionRail";
import { useMatchHints } from "@/hooks/useMatchHints";
import { useOpponentTyping } from "@/hooks/useOpponentTyping";
import type { TacticalInventory } from "@/lib/profile/tactical-tools";
import type { TacticalToolId } from "@/lib/profile/tactical-tools";
import { getCategoryById } from "@/lib/game/categories";
import type { PlayerCosmetic } from "@/lib/profile/cosmetics";
import type { ChatMessage, GameCard, MatchState } from "@/types";
import type { Timestamp } from "firebase/firestore";

function isHintChatMessage(m: ChatMessage): boolean {
  const t = m.text?.trim() ?? "";
  return m.senderUid === "system" && t.startsWith("تلميح");
}

// memo: TypingDots has no props — it never needs to re-render from parent updates.
// Uses CSS animation (compositor-only) instead of Framer Motion repeat:Infinity.
const TypingDots = memo(function TypingDots() {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="bubble them"
      style={{ display: "inline-flex", gap: 4, padding: "12px 14px" }}
    >
      {[0, 0.15, 0.3].map((delay, i) => (
        <span
          key={i}
          aria-hidden
          className="typing-dot"
          style={{ animationDelay: `${delay}s` }}
        />
      ))}
    </motion.div>
  );
});

export type GameplaySocialSurfaceProps = {
  banner: string | null;
  roomId: string | null;
  matchId: string | null;
  matchSyncWaiting: boolean;
  socialMatchLive: boolean;
  myTurn: boolean;
  phase: string;
  /** Firestore deadline — passed straight to GameplayTopBar which owns the countdown */
  turnDeadline: Timestamp | null | undefined;
  maxPhaseSec: number;
  displayName: string;
  opponentName: string;
  uid: string | null;
  opponentUid: string | null;
  cosmeticsMap: Record<string, PlayerCosmetic>;
  userPhotoURL: string | null | undefined;
  opponentCard: GameCard | null;
  messages: ChatMessage[];
  renderMessage: (m: ChatMessage) => React.ReactNode;
  chatScrollRef: RefObject<HTMLDivElement | null>;
  chatEndRef: RefObject<HTMLDivElement | null>;
  draft: string;
  onDraftChange: (v: string) => void;
  onSendDraft: (customText?: string) => void | Promise<void>;
  busy: boolean;
  onGuessClick: () => void;
  onComposerFocus: (el: HTMLInputElement) => void;
  onComposerBlur: (el: HTMLInputElement) => void;
  keyboardOverlapPx?: number;
  /** When false, in-match hints from the shop are disabled for this room. */
  roomHintsEnabled?: boolean;
  match?: MatchState | null;
  tacticalInventory?: TacticalInventory;
  tacticalBusy?: TacticalToolId | null;
  onUseTactical?: (toolId: TacticalToolId) => void;
  /** Called when the local player fires a tool — bubbles the activation up to
   *  RoomExperience so the cinematic renders at the root level (no clip/overflow). */
  onTacticalFired?: (toolId: TacticalToolId) => void;
  tacticalError?: string | null;
  myGuessRemaining?: number;
  opponentGuessRemaining?: number;
};

export const GameplaySocialSurface = memo(function GameplaySocialSurface({
  banner,
  roomId,
  matchId,
  matchSyncWaiting,
  socialMatchLive,
  myTurn,
  phase,
  turnDeadline,
  maxPhaseSec,
  displayName,
  opponentName,
  uid,
  opponentUid,
  cosmeticsMap,
  userPhotoURL,
  opponentCard,
  messages,
  renderMessage,
  chatScrollRef,
  chatEndRef,
  draft,
  onDraftChange,
  onSendDraft,
  busy,
  onGuessClick,
  onComposerFocus,
  onComposerBlur,
  keyboardOverlapPx = 0,
  roomHintsEnabled = true,
  match = null,
  tacticalInventory,
  tacticalBusy = null,
  onUseTactical,
  onTacticalFired,
  tacticalError = null,
  myGuessRemaining = 3,
  opponentGuessRemaining = 3,
}: GameplaySocialSurfaceProps) {
  const [hintBusy, setHintBusy] = useState(false);
  const liveProfile = useLiveUserProfile(uid);

  const hintsEnabled =
    roomHintsEnabled && socialMatchLive && Boolean(roomId && matchId && uid);
  const {
    hintsLeft,
    hintUsed,
    revealedIdx,
    letters,
    useHint: spendHint,
  } = useMatchHints(
    roomId,
    matchId,
    uid,
    hintsEnabled,
  );
  const { opponentTyping, pulseTyping } = useOpponentTyping(
    roomId,
    uid,
    opponentUid,
    hintsEnabled,
  );

  const categoryLabel = opponentCard?.categoryId
    ? (getCategoryById(opponentCard.categoryId)?.nameAr ?? opponentCard.categoryId)
    : null;

  /**
   * True when extra-question tool is active for me this turn:
   * questionQuota=2 and questionsThisTurn < quota — player has a 2nd question to ask.
   */
  const extraQuestionPending = useMemo(() => {
    if (!match || !uid || !myTurn || phase !== "question") return false;
    const myTactical = match.tacticalByUid?.[uid];
    if (!myTactical) return false;
    const quota = myTactical.questionQuota ?? 1;
    const asked = myTactical.questionsThisTurn ?? 0;
    return quota >= 2 && asked > 0 && asked < quota;
  }, [match, uid, myTurn, phase]);

  const chatMessages = useMemo(
    () => messages.filter((m) => !isHintChatMessage(m)),
    [messages],
  );

  const handleDraftChange = useCallback((v: string) => {
    onDraftChange(v);
    if (v.trim()) pulseTyping();
  }, [onDraftChange, pulseTyping]);

  const handleUseHint = async (kind: "letter" | "count") => {
    setHintBusy(true);
    try {
      await spendHint(kind);
    } finally {
      setHintBusy(false);
    }
  };

  return (
    <motion.div
      layout
      className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
      style={{ background: "var(--home-bg, #FCFCFA)" }}
      dir="rtl"
    >
      {/* Premium decorative elements */}
      <div className="absolute pointer-events-none select-none home-deco-bob" style={{ top: "12%", left: "6%", opacity: 0.08 }}>
        <svg width={24} height={30} fill="none" aria-hidden>
          <path d="M12 8c-4 0-7 2.7-7 6.5" stroke="#C4B5FD" strokeWidth={2.5} strokeLinecap="round" />
          <path d="M12 3c-6.5 0-11.5 4.5-11.5 11" stroke="#DDD6FE" strokeWidth={2.5} strokeLinecap="round" />
          <circle cx={12} cy={22} r={2.5} fill="#C4B5FD" />
        </svg>
      </div>
      <div className="absolute pointer-events-none select-none home-deco-bob-delayed" style={{ top: "55%", right: "4%", opacity: 0.06 }}>
        <svg width={18} height={22} fill="none" aria-hidden>
          <path d="M9 6c-3 0-5 2-5 5" stroke="#FECDD3" strokeWidth={2} strokeLinecap="round" />
          <path d="M9 2c-4.5 0-8 3.5-8 8" stroke="#FDA4AF" strokeWidth={2} strokeLinecap="round" />
          <circle cx={9} cy={16} r={2} fill="#FECDD3" />
        </svg>
      </div>
      <div className="absolute pointer-events-none select-none home-deco-drift" style={{ bottom: "20%", left: "10%", opacity: 0.06 }}>
        <svg width={14} height={14} fill="none" aria-hidden>
          <path d="M7 2l1.5 3.5H12l-2.5 2 1 4L7 9 4 11.5l1-4L2.5 5.5H6z" fill="#FDE68A" />
        </svg>
      </div>
      <div className="absolute pointer-events-none select-none home-deco-pulse" style={{ top: "40%", right: "12%", width: 5, height: 5, borderRadius: "50%", background: "#DDD6FE", opacity: 0.15 }} />
      <div className="absolute pointer-events-none select-none home-deco-pulse" style={{ bottom: "35%", left: "4%", width: 3, height: 3, borderRadius: "50%", background: "#BAE6FD", opacity: 0.12 }} />

      <div className="shrink-0 px-3 pt-1 relative z-10">
        <AnimatePresence>
          {banner ? (
            <motion.p
              key="banner"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl border px-4 py-2 text-center text-[10px] font-black"
              style={{
                borderColor: `${GP.orangeSoft}cc`,
                color: "#9a5f2d",
                background: "linear-gradient(135deg,#fff7e8,#fff0d8)",
              }}
            >
              {banner}
            </motion.p>
          ) : null}
        </AnimatePresence>
        {matchSyncWaiting ? (
          <p
            className="mt-1.5 rounded-xl border px-3 py-1.5 text-center text-[10px] font-black"
            style={{
              borderColor: GP.creamDeep,
              background: "rgba(255,249,239,0.95)",
              color: "#a16231",
            }}
          >
            جاري مزامنة حالة المباراة…
          </p>
        ) : null}
      </div>

      {socialMatchLive ? (
        <>
          <GameplayTopBar
            myName={displayName}
            opponentName={opponentName}
            myUid={uid}
            opponentUid={opponentUid}
            myCosmetic={uid ? cosmeticsMap[uid] : undefined}
            opponentCosmetic={opponentUid ? cosmeticsMap[opponentUid] : undefined}
            myPhotoURL={userPhotoURL}
            myTurn={myTurn}
            turnDeadline={turnDeadline}
            maxPhaseSec={maxPhaseSec}
            phase={phase}
            roomId={roomId}
            matchId={matchId}
          />

          <div className="mx-4 mt-3 z-10 relative">
            <div
              className="w-full flex items-center justify-between gap-2 text-right"
              style={{
                background: "#FFFFFF",
                borderRadius: 18,
                padding: "10px 14px",
                boxShadow: "0 2px 8px rgba(139,92,246,0.04), 0 4px 16px rgba(0,0,0,0.02)",
              }}
            >
              {/* Round indicator */}
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center justify-center font-black text-xs"
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 10,
                    background: "#F5F3FF",
                    color: "#8B5CF6",
                    fontFamily: "var(--display)",
                  }}
                >
                  {Math.floor((match?.questionCountTotal ?? 0) / 2) + 1}
                </div>
                <div className="flex flex-col" style={{ lineHeight: 1.15 }}>
                  <span
                    className="text-[10px] font-black"
                    style={{ color: "#374151", fontFamily: "var(--display)" }}
                  >
                    الجولة
                  </span>
                  <span className="text-[7px] font-bold" style={{ color: "#9CA3AF" }}>
                    مواجهة تخمين
                  </span>
                </div>
              </div>

              {/* Guesses */}
              <div className="flex items-center gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: i < myGuessRemaining ? "#8B5CF6" : "#EDE9FE",
                      transition: "background 0.3s ease",
                    }}
                  />
                ))}
                <span className="text-[7px] font-bold" style={{ color: "#9CA3AF" }}>
                  {myGuessRemaining}/3
                </span>
              </div>

              {/* Phase */}
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] font-bold" style={{ color: "#9CA3AF" }}>
                  {phase === "answer" ? "إجابة" : phase === "guess" ? "تخمين" : "أسئلة"}
                </span>
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 8,
                    background: "#F5F3FF",
                    color: "#8B5CF6",
                  }}
                >
                  <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <section className="relative mx-auto w-full max-w-md shrink-0 px-3 pb-1 pt-0">
            <motion.div className="relative flex min-h-[218px] w-full items-center justify-center">
              {/* SideActionRail — replaces the two corner buttons */}
              {tacticalInventory && onUseTactical ? (
                <SideActionRail
                  match={match}
                  uid={uid}
                  myTurn={myTurn}
                  phase={phase}
                  inventory={tacticalInventory}
                  tacticalBusy={tacticalBusy ?? null}
                  bonusLetterHints={liveProfile?.progress.hintLetterCredits ?? 0}
                  bonusCountHints={liveProfile?.progress.hintCountCredits ?? 0}
                  hintsLeft={hintsLeft}
                  hintUsed={hintUsed}
                  letters={letters}
                  revealedIdx={revealedIdx}
                  hintBusy={hintBusy}
                  onUseTactical={onUseTactical}
                  onTacticalFired={onTacticalFired}
                  onUseHint={(kind) => void handleUseHint(kind)}
                />
              ) : null}

              <motion.div className="flex w-full flex-col items-center justify-center px-2">
                <span
                  className="mb-2 inline-flex items-center gap-1.5 px-3 py-1 text-[9px] font-extrabold tracking-wider"
                  style={{
                    background: "#F5F3FF",
                    color: "#8B5CF6",
                    borderRadius: 999,
                    border: "1px solid rgba(139,92,246,0.08)",
                    fontFamily: "var(--display)",
                  }}
                >
                  <svg width={10} height={10} viewBox="0 0 24 24" fill="none" aria-hidden>
                    <rect x="3" y="5" width="18" height="14" rx="2" stroke="#8B5CF6" strokeWidth="2" />
                    <path d="M3 16l5-5 4 4 3-3 6 6" stroke="#8B5CF6" strokeWidth="2" strokeLinejoin="round" />
                  </svg>
                  بطاقة الخصم
                </span>
                <GameplayHeroCard
                  opponentCard={opponentCard}
                  categoryLabel={categoryLabel}
                  size="stage"
                />
              </motion.div>
            </motion.div>
          </section>

          <motion.div className="flex min-h-0 min-w-0 flex-1 flex-col px-2 pb-0 pt-1">
            <div
              ref={chatScrollRef}
              className="min-h-0 flex-1 overflow-y-auto px-3 pb-1 pt-2"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                overscrollBehavior: "contain",
              }}
            >
              {chatMessages.length === 0 ? (
                <motion.div
                  className="flex flex-1 flex-col items-center justify-center gap-1 py-4 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <span className="text-2xl">💬</span>
                  <p className="text-[11px] font-bold" style={{ color: GP.inkSoft }}>
                    ابدأ بطرح سؤالك
                  </p>
                </motion.div>
              ) : (
                chatMessages.map((m) => renderMessage(m))
              )}
              {!myTurn && opponentTyping ? (
                <div className="shrink-0">
                  <TypingDots />
                </div>
              ) : null}
              <div ref={chatEndRef} className="h-0 shrink-0" />
            </div>

            <GameplayChatActionBar
              myTurn={myTurn}
              phase={phase}
              draft={draft}
              busy={busy}
              guessRemaining={myGuessRemaining}
              extraQuestionPending={extraQuestionPending}
              onDraftChange={handleDraftChange}
              onSend={(customText) => void onSendDraft(customText)}
              onGuess={onGuessClick}
              onComposerFocus={onComposerFocus}
              onComposerBlur={onComposerBlur}
              keyboardOverlapPx={keyboardOverlapPx}
            />
          </motion.div>

        </>
      ) : (
        <motion.div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-10 text-center">
          <motion.span
            className="text-3xl"
            animate={{ rotate: [0, 8, -8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            ⏳
          </motion.span>
          <p className="text-xs font-semibold" style={{ color: GP.inkSoft }}>
            ستظهر واجهة اللعب عند بدء المباراة
          </p>
        </motion.div>
      )}
    </motion.div>
  );
});
