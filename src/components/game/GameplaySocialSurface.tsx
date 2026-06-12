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
import type { ChatMessage, GameCard, MatchState, TacticalGameplayEvent } from "@/types";
import type { Timestamp } from "firebase/firestore";
import { gpToonFont } from "@/components/game/play/toon-font";

function isHintChatMessage(m: ChatMessage): boolean {
  const t = m.text?.trim() ?? "";
  return m.senderUid === "system" && t.startsWith("تلميح");
}

/* ── Small 4-point sparkle (decorative) ─────────────────────── */
function GpSpark({ size = 14, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg
      aria-hidden
      className="gp-spark"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={style}
    >
      <path
        d="M12 1.5c.9 5.4 2.4 7.5 8.5 8.6-6.1 1.1-7.6 3.2-8.5 8.6-.9-5.4-2.4-7.5-8.5-8.6 6.1-1.1 7.6-3.2 8.5-8.6Z"
        fill="#F2B544"
        stroke="#FFFFFF"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ── Cartoon chat icon for the empty state (SVG, not emoji) ──── */
function GpChatIcon({ size = 30 }: { size?: number }) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3C6.9 3 3 6.4 3 10.6c0 2.4 1.3 4.5 3.3 5.9-.1 1-.5 2.1-1.4 3.2 1.8-.2 3.3-.8 4.4-1.5.9.2 1.8.4 2.7.4 5.1 0 9-3.4 9-7.6S17.1 3 12 3Z"
        fill="#FF9D2E"
        stroke="#FFFFFF"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="8.4" cy="10.8" r="1.15" fill="#FFF4E0" />
      <circle cx="12" cy="10.8" r="1.15" fill="#FFF4E0" />
      <circle cx="15.6" cy="10.8" r="1.15" fill="#FFF4E0" />
    </svg>
  );
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
  onSendDraft: () => void | Promise<void>;
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
  onUseTactical?: (toolId: TacticalToolId) => Promise<TacticalGameplayEvent | null>;
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
      className={`gp-toon ${gpToonFont.variable} relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden`}
      dir="rtl"
    >
      <GpToonStyles />
      {/* Decorative cartoon backdrop — dots + soft blobs (visual only) */}
      <div className="gp-backdrop" aria-hidden>
        <span className="gp-blob" style={{ top: -60, left: -50, width: 200, height: 200, background: "radial-gradient(closest-side, rgba(255,205,130,0.45), transparent 72%)" }} />
        <span className="gp-blob" style={{ top: 180, right: -70, width: 180, height: 180, background: "radial-gradient(closest-side, rgba(165,224,193,0.30), transparent 72%)" }} />
        <span className="gp-blob" style={{ bottom: 60, left: -60, width: 190, height: 190, background: "radial-gradient(closest-side, rgba(255,180,150,0.26), transparent 72%)" }} />
      </div>

      <div className="relative z-[1] shrink-0 px-3 pt-1">
        <AnimatePresence>
          {banner ? (
            <motion.p
              key="banner"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl px-4 py-2 text-center text-[11.5px] font-extrabold"
              style={{
                border: "2px solid rgba(255,255,255,0.95)",
                outline: "1.5px solid rgba(242,166,61,0.35)",
                color: "#9a5f2d",
                background: "linear-gradient(135deg,#fff7e8,#ffeed2)",
                boxShadow: "0 6px 14px -6px rgba(160,80,30,0.25)",
              }}
            >
              {banner}
            </motion.p>
          ) : null}
        </AnimatePresence>
        {matchSyncWaiting ? (
          <p
            className="mt-1.5 rounded-full px-3 py-1.5 text-center text-[10.5px] font-bold"
            style={{
              border: "2px solid rgba(255,255,255,0.95)",
              outline: "1.5px solid rgba(242,166,61,0.28)",
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
          />

          <div
            className="relative z-[1] mx-3 mt-1.5 flex flex-wrap items-center justify-between gap-2 rounded-2xl px-3 py-2"
            style={{
              border: "2.5px solid rgba(255,255,255,0.95)",
              outline: "1.5px solid rgba(242,166,61,0.30)",
              background: "linear-gradient(180deg, rgba(255,255,255,0.94), rgba(255,246,233,0.92))",
              boxShadow: "0 3px 0 rgba(222,168,92,0.28), 0 8px 16px -8px rgba(122,90,69,0.25), inset 0 1.5px 0 rgba(255,255,255,0.9)",
            }}
          >
            <GuessRemainingIndicator remaining={myGuessRemaining} compact />
            <span
              className="rounded-full px-2.5 py-1 text-[10px] font-extrabold"
              style={{
                color: GP.inkSoft,
                background: "rgba(255,241,221,0.9)",
                border: "1.5px solid rgba(255,255,255,0.95)",
                outline: "1px solid rgba(242,166,61,0.25)",
              }}
            >
              الخصم: {opponentGuessRemaining}/3
            </span>
          </div>

          <section className="relative z-[1] mx-auto w-full max-w-md shrink-0 px-3 pb-1 pt-0">
            <motion.div className="relative flex min-h-[218px] w-full items-center justify-center">
              {/* Soft halo + ground shadow behind the opponent card */}
              <div className="gp-stage-glow" aria-hidden />
              <div className="gp-stage-shadow" aria-hidden />
              <GpSpark size={16} style={{ position: "absolute", top: 18, right: 54, zIndex: 1 }} />
              <GpSpark size={11} style={{ position: "absolute", bottom: 42, left: 52, zIndex: 1, animationDelay: "1.2s" }} />
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
                <p
                  className="mb-1.5 rounded-full px-3.5 py-1 text-center text-[10px] font-extrabold tracking-[0.1em]"
                  style={{
                    color: "#6E4310",
                    background: "linear-gradient(180deg, #FFE3A1, #F2B544)",
                    border: "2px solid rgba(255,255,255,0.92)",
                    boxShadow: "0 3px 8px -2px rgba(200,136,31,0.45)",
                    transform: "rotate(-1.5deg)",
                  }}
                >
                  بطاقة الخصم
                </p>
                <GameplayHeroCard
                  opponentCard={opponentCard}
                  categoryLabel={categoryLabel}
                  size="stage"
                />
              </motion.div>
            </motion.div>
          </section>

          <motion.div className="relative z-[1] flex min-h-0 min-w-0 flex-1 flex-col px-2 pb-0 pt-1">
            <div
              ref={chatScrollRef}
              className="gp-chat min-h-0 flex-1 overflow-y-auto px-3 pb-1 pt-2"
              style={{
                display: "flex",
                flexDirection: "column",
                overscrollBehavior: "contain",
              }}
            >
              {chatMessages.length === 0 ? (
                <motion.div
                  className="flex flex-1 flex-col items-center justify-center gap-2 py-4 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <span
                    className="grid place-items-center"
                    style={{
                      width: 54,
                      height: 54,
                      borderRadius: 20,
                      background: "linear-gradient(180deg, #FFF6E8, #FFE9C8)",
                      border: "2.5px solid rgba(255,255,255,0.95)",
                      outline: "1.5px solid rgba(242,166,61,0.30)",
                      boxShadow: "0 4px 0 rgba(222,168,92,0.28), 0 10px 18px -8px rgba(122,90,69,0.28)",
                    }}
                  >
                    <GpChatIcon size={28} />
                  </span>
                  <p className="text-[12px] font-extrabold" style={{ color: GP.inkSoft }}>
                    ابدأ بطرح سؤالك
                  </p>
                </motion.div>
              ) : (
                chatMessages.map((m, i) => {
                  const isSystem = m.senderUid === "system";
                  const isMe = m.senderUid === uid;
                  const prev = chatMessages[i - 1];
                  const next = chatMessages[i + 1];
                  const contPrev = !isSystem && Boolean(prev && prev.senderUid === m.senderUid);
                  const contNext = !isSystem && Boolean(next && next.senderUid === m.senderUid);
                  const side = isSystem ? "sys" : isMe ? "me" : "them";
                  return (
                    <div
                      key={m.id}
                      className={`gp-msg ${side}${contPrev ? " cont" : ""}${contNext ? " grp" : ""}`}
                    >
                      {!isSystem && !isMe && !contPrev ? (
                        <span className="gp-msg-name">{opponentName}</span>
                      ) : null}
                      {renderMessage(m)}
                    </div>
                  );
                })
              )}
              {!myTurn && opponentTyping ? (
                <div className="gp-msg them shrink-0">
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
              onSend={() => void onSendDraft()}
              onGuess={onGuessClick}
              onComposerFocus={onComposerFocus}
              onComposerBlur={onComposerBlur}
              keyboardOverlapPx={keyboardOverlapPx}
            />
          </motion.div>

        </>
      ) : (
        <motion.div className="relative z-[1] flex flex-1 flex-col items-center justify-center gap-3 px-4 py-10 text-center">
          <motion.span
            className="grid place-items-center"
            animate={{ rotate: [0, 8, -8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            style={{
              width: 56,
              height: 56,
              borderRadius: 20,
              background: "linear-gradient(180deg, #FFF6E8, #FFE9C8)",
              border: "2.5px solid rgba(255,255,255,0.95)",
              outline: "1.5px solid rgba(242,166,61,0.30)",
              boxShadow: "0 4px 0 rgba(222,168,92,0.28), 0 10px 18px -8px rgba(122,90,69,0.28)",
            }}
          >
            <GpSpark size={26} />
          </motion.span>
          <p className="text-xs font-bold" style={{ color: GP.inkSoft }}>
            ستظهر واجهة اللعب عند بدء المباراة
          </p>
        </motion.div>
      )}
    </motion.div>
  );
});

/** All cartoon-casual gameplay styles, scoped under .gp-toon (gameplay screen only). */
function GpToonStyles() {
  return (
    <style>{`
.gp-toon,
.gp-toon input,
.gp-toon button {
  font-family: var(--font-toon-gp), var(--display), system-ui, sans-serif;
}

/* ── Backdrop ─────────────────────────────────────────────── */
.gp-toon .gp-backdrop {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
  background-image: radial-gradient(rgba(200, 136, 31, 0.08) 1.5px, transparent 1.6px);
  background-size: 24px 24px;
  -webkit-mask-image: linear-gradient(180deg, black 0%, rgba(0,0,0,.45) 60%, transparent 95%);
          mask-image: linear-gradient(180deg, black 0%, rgba(0,0,0,.45) 60%, transparent 95%);
}
.gp-toon .gp-blob {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

/* ── Opponent-card stage ──────────────────────────────────── */
.gp-toon .gp-stage-glow {
  position: absolute;
  width: 290px;
  height: 290px;
  left: 50%;
  top: 48%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: radial-gradient(closest-side, rgba(255, 196, 110, 0.40), rgba(255, 196, 110, 0.12) 55%, transparent 75%);
  pointer-events: none;
}
.gp-toon .gp-stage-shadow {
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  width: 190px;
  height: 20px;
  border-radius: 50%;
  background: radial-gradient(closest-side, rgba(122, 90, 69, 0.22), transparent);
  filter: blur(2px);
  pointer-events: none;
}

/* ── Chat: message grouping + player distinction ──────────── */
.gp-toon .gp-msg {
  display: flex;
  flex-direction: column;
  min-width: 0;
  margin-top: 10px;
}
.gp-toon .gp-msg:first-child {
  margin-top: 0;
}
.gp-toon .gp-msg.cont {
  margin-top: 3px;
}
.gp-toon .gp-msg-name {
  align-self: flex-start;
  font-size: 10.5px;
  font-weight: 800;
  color: #B8763A;
  margin: 0 10px 3px;
}

/* ── Chat bubbles — cartoon clay ──────────────────────────── */
.gp-toon .bubble {
  border-radius: 20px;
  padding: 10px 15px;
  font-size: 14.5px;
  font-weight: 700;
  line-height: 1.5;
  max-width: 80%;
}
.gp-toon .bubble.me {
  background: linear-gradient(180deg, #FFC861 0%, #FFAB43 55%, #FF9D2E 100%);
  border: 2px solid rgba(255, 255, 255, 0.92);
  color: #5C2C0E;
  box-shadow:
    0 3px 0 rgba(224, 134, 44, 0.55),
    0 10px 18px -8px rgba(242, 138, 61, 0.45),
    inset 0 1.5px 0 rgba(255, 255, 255, 0.45);
  border-bottom-left-radius: 7px;
}
.gp-toon .bubble.them {
  background: linear-gradient(180deg, #FFFFFF 0%, #FFF4E4 100%);
  border: 2px solid rgba(255, 255, 255, 0.95);
  outline: 1.5px solid rgba(242, 166, 61, 0.28);
  color: #4A2E1B;
  box-shadow:
    0 3px 0 rgba(222, 168, 92, 0.30),
    0 8px 16px -8px rgba(122, 90, 69, 0.25),
    inset 0 1.5px 0 rgba(255, 255, 255, 0.9);
  border-bottom-right-radius: 7px;
}
.gp-toon .bubble.system {
  border-radius: 999px;
  background: rgba(255, 246, 232, 0.92);
  border: 2px solid rgba(255, 255, 255, 0.92);
  outline: 1px solid rgba(242, 166, 61, 0.25);
  color: #8A6242;
  font-weight: 700;
  box-shadow: 0 4px 10px -6px rgba(122, 90, 69, 0.25);
}

/* Grouped corners — chain bubbles of the same sender */
.gp-toon .gp-msg.me.cont .bubble {
  border-top-left-radius: 7px;
}
.gp-toon .gp-msg.them.cont .bubble {
  border-top-right-radius: 7px;
}
.gp-toon .gp-msg.me.grp .bubble {
  border-bottom-left-radius: 7px;
}
.gp-toon .gp-msg.them.grp .bubble {
  border-bottom-right-radius: 7px;
}

/* ── Motion (disabled under reduced-motion) ───────────────── */
@media (prefers-reduced-motion: no-preference) {
  .gp-toon .gp-spark {
    animation: gpTwinkle 2.6s ease-in-out infinite;
  }
}
@keyframes gpTwinkle {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%      { opacity: 0.4; transform: scale(0.7) rotate(18deg); }
}
`}</style>
  );
}
