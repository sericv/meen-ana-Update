"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { RefObject } from "react";
import { useMemo, useState } from "react";
import { GameplayChatActionBar } from "@/components/game/play/GameplayChatActionBar";
import { GameplayHeroCard } from "@/components/game/play/GameplayHeroCard";
import { GameplayMyHiddenCard } from "@/components/game/play/GameplayMyHiddenCard";
import { MyHiddenCardSheet } from "@/components/game/play/GameplaySheets";
import { GuessRemainingIndicator } from "@/components/game/play/GuessRemainingIndicator";
import { GameplayTopBar } from "@/components/game/play/GameplayTopBar";
import { useLiveUserProfile } from "@/hooks/useLiveUserProfile";
import { GP } from "@/components/game/play/tokens";
import { GameplayTacticalButton } from "@/components/game/play/GameplayTacticalButton";
import { TacticalToolsSheet } from "@/components/game/play/TacticalToolsSheet";
import { useMatchHints } from "@/hooks/useMatchHints";
import { useOpponentTyping } from "@/hooks/useOpponentTyping";
import type { TacticalInventory } from "@/lib/profile/tactical-tools";
import type { TacticalToolId } from "@/lib/profile/tactical-tools";
import { getCategoryById } from "@/lib/game/categories";
import type { PlayerCosmetic } from "@/lib/profile/cosmetics";
import type { ChatMessage, GameCard, MatchState } from "@/types";

function isHintChatMessage(m: ChatMessage): boolean {
  const t = m.text?.trim() ?? "";
  return m.senderUid === "system" && t.startsWith("تلميح");
}

function TypingDots() {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="inline-flex gap-1 rounded-2xl px-3.5 py-2.5"
      style={{
        background: "rgba(255,255,255,0.92)",
        boxShadow: "inset 0 0 0 1px rgba(244,196,141,0.45)",
      }}
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block h-1.5 w-1.5 rounded-full"
          style={{ background: GP.orangeSoft }}
          animate={{ y: [0, -4, 0], opacity: [0.35, 1, 0.35] }}
          transition={{
            duration: 1.1,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.15,
          }}
        />
      ))}
    </motion.div>
  );
}

export type GameplaySocialSurfaceProps = {
  banner: string | null;
  roomId: string | null;
  matchId: string | null;
  matchSyncWaiting: boolean;
  socialMatchLive: boolean;
  myTurn: boolean;
  phase: string;
  secLeft: number | null;
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
  onUseTactical?: (toolId: TacticalToolId) => void;
  tacticalError?: string | null;
  myGuessRemaining?: number;
  opponentGuessRemaining?: number;
};

export function GameplaySocialSurface({
  banner,
  roomId,
  matchId,
  matchSyncWaiting,
  socialMatchLive,
  myTurn,
  phase,
  secLeft,
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
  tacticalError = null,
  myGuessRemaining = 3,
  opponentGuessRemaining = 3,
}: GameplaySocialSurfaceProps) {
  const [cardSheetOpen, setCardSheetOpen] = useState(false);
  const [tacticalSheetOpen, setTacticalSheetOpen] = useState(false);
  const [hintBusy, setHintBusy] = useState(false);
  const liveProfile = useLiveUserProfile(uid);

  const hintsEnabled =
    roomHintsEnabled && socialMatchLive && Boolean(roomId && matchId && uid);
  const {
    hintsLeft,
    hintUsed,
    revealedIdx,
    letters,
    countRevealed,
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
    ? (getCategoryById(opponentCard.categoryId)?.nameAr ?? null)
    : null;

  const chatMessages = useMemo(
    () => messages.filter((m) => !isHintChatMessage(m)),
    [messages],
  );

  const handleDraftChange = (v: string) => {
    onDraftChange(v);
    if (v.trim()) pulseTyping();
  };

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
      dir="rtl"
    >
      <div className="shrink-0 px-3 pt-1">
        <AnimatePresence>
          {banner ? (
            <motion.p
              key="banner"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl border px-4 py-2 text-center text-[11px] font-extrabold"
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
            className="mt-1.5 rounded-xl border px-3 py-1.5 text-center text-[10.5px] font-semibold"
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
            secLeft={secLeft}
            maxPhaseSec={maxPhaseSec}
            phase={phase}
          />

          <div
            className="mx-3 mt-1.5 flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2"
            style={{
              borderColor: "rgba(244,196,141,0.45)",
              background: "rgba(255,255,255,0.88)",
            }}
          >
            <GuessRemainingIndicator remaining={myGuessRemaining} compact />
            <span className="text-[10px] font-bold" style={{ color: GP.inkSoft }}>
              الخصم: {opponentGuessRemaining}/3
            </span>
          </div>

          <section className="relative mx-auto w-full max-w-md shrink-0 px-3 pb-1 pt-0">
            <motion.div className="relative flex min-h-[218px] w-full items-center justify-center">
              <div className="absolute bottom-2 left-0 z-20">
                <GameplayMyHiddenCard
                  hintsLeft={hintsLeft}
                  bonusLetterHints={liveProfile?.progress.hintLetterCredits ?? 0}
                  bonusCountHints={liveProfile?.progress.hintCountCredits ?? 0}
                  hintUsed={hintUsed}
                  revealedIdx={revealedIdx}
                  letters={letters}
                  size="compact"
                  onPress={() => setCardSheetOpen(true)}
                />
              </div>

              {tacticalInventory && onUseTactical ? (
                <div className="absolute bottom-2 right-0 z-20">
                  <GameplayTacticalButton
                    inventory={tacticalInventory}
                    size="compact"
                    onPress={() => setTacticalSheetOpen(true)}
                  />
                </div>
              ) : null}

              <motion.div className="flex w-full flex-col items-center justify-center px-2">
                <p
                  className="mb-1 text-center text-[10px] font-bold uppercase tracking-[0.15em]"
                  style={{ color: GP.inkSoft }}
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
                <div className="flex shrink-0 justify-start">
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
              onDraftChange={handleDraftChange}
              onSend={() => void onSendDraft()}
              onGuess={onGuessClick}
              onComposerFocus={onComposerFocus}
              onComposerBlur={onComposerBlur}
              keyboardOverlapPx={keyboardOverlapPx}
            />
          </motion.div>

          <MyHiddenCardSheet
            open={cardSheetOpen}
            letters={letters}
            revealedIdx={revealedIdx}
            countRevealed={countRevealed}
            hintsLeft={hintsLeft}
            bonusLetterHints={liveProfile?.progress.hintLetterCredits ?? 0}
            bonusCountHints={liveProfile?.progress.hintCountCredits ?? 0}
            hintUsed={hintUsed}
            busy={hintBusy}
            onClose={() => setCardSheetOpen(false)}
            onUseHint={(k) => void handleUseHint(k)}
          />
          {tacticalInventory && onUseTactical ? (
            <TacticalToolsSheet
              open={tacticalSheetOpen}
              match={match}
              uid={uid}
              myTurn={myTurn}
              phase={phase}
              inventory={tacticalInventory}
              busy={tacticalBusy}
              error={tacticalError}
              onClose={() => setTacticalSheetOpen(false)}
              onUse={onUseTactical}
            />
          ) : null}
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
}
