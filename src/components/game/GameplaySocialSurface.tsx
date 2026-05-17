"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { RefObject } from "react";
import { useMemo, useState } from "react";
import { GameplayChatActionBar } from "@/components/game/play/GameplayChatActionBar";
import { GameplayChatFadeViewport } from "@/components/game/play/GameplayChatFadeViewport";
import { GameplayHeroCard } from "@/components/game/play/GameplayHeroCard";
import { GameplayMyHiddenCard } from "@/components/game/play/GameplayMyHiddenCard";
import { MyHiddenCardSheet } from "@/components/game/play/GameplaySheets";
import { GameplayTopBar } from "@/components/game/play/GameplayTopBar";
import { useLiveUserProfile } from "@/hooks/useLiveUserProfile";
import { GP } from "@/components/game/play/tokens";
import { useMatchHints } from "@/hooks/useMatchHints";
import { useOpponentTyping } from "@/hooks/useOpponentTyping";
import { getCategoryById } from "@/lib/game/categories";
import type { PlayerCosmetic } from "@/lib/profile/cosmetics";
import type { ChatMessage, GameCard } from "@/types";

const VISIBLE_CHAT_MESSAGE_COUNT = 3;

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
}: GameplaySocialSurfaceProps) {
  const [cardSheetOpen, setCardSheetOpen] = useState(false);
  const [hintBusy, setHintBusy] = useState(false);
  const liveProfile = useLiveUserProfile(uid);

  const hintsEnabled = socialMatchLive && Boolean(roomId && matchId && uid);
  const { hintsLeft, revealedIdx, letters, countRevealed, useHint } = useMatchHints(
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

  const visibleMessages = useMemo(
    () => chatMessages.slice(-VISIBLE_CHAT_MESSAGE_COUNT),
    [chatMessages],
  );

  const handleDraftChange = (v: string) => {
    onDraftChange(v);
    if (v.trim()) pulseTyping();
  };

  const handleUseHint = async (kind: "letter" | "count") => {
    setHintBusy(true);
    try {
      await useHint(kind);
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

          <section className="relative mx-auto w-full max-w-md shrink-0 px-3 pb-1 pt-0">
            <motion.div className="relative flex min-h-[218px] w-full items-center justify-center">
              <div className="absolute bottom-2 left-0 z-20">
                <GameplayMyHiddenCard
                  hintsLeft={hintsLeft}
                  bonusHints={liveProfile?.progress.hintCredits ?? 0}
                  revealedIdx={revealedIdx}
                  letters={letters}
                  size="compact"
                  onPress={() => setCardSheetOpen(true)}
                />
              </div>

              <div className="flex w-full flex-col items-center justify-center px-2">
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
              </div>
            </motion.div>
          </section>

          <motion.div className="flex min-h-0 min-w-0 flex-1 flex-col justify-end px-2 pb-0 pt-1">
            <GameplayChatFadeViewport>
              <div
                ref={chatScrollRef}
                className="flex min-h-0 flex-1 flex-col justify-end overflow-hidden px-1 pb-1"
              >
                <motion.div className="flex min-h-0 flex-col justify-end gap-2.5 pb-0.5 pt-1">
                  {chatMessages.length === 0 ? (
                    <motion.div
                      className="flex flex-col items-center justify-center gap-1 py-4 text-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <span className="text-2xl">💬</span>
                      <p className="text-[11px] font-bold" style={{ color: GP.inkSoft }}>
                        ابدأ بطرح سؤالك
                      </p>
                    </motion.div>
                  ) : (
                    <AnimatePresence mode="popLayout" initial={false}>
                      {visibleMessages.map((m) => (
                        <motion.div
                          key={m.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{
                            opacity: 0,
                            y: -4,
                          }}
                          transition={{ duration: 0.42, ease: [0.4, 0, 0.2, 1] }}
                          className="shrink-0"
                        >
                          {renderMessage(m)}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
                  {!myTurn && opponentTyping ? (
                    <motion.div layout className="flex shrink-0 justify-start">
                      <TypingDots />
                    </motion.div>
                  ) : null}
                  <motion.div layout ref={chatEndRef} className="h-0 shrink-0" />
                </motion.div>
              </div>
            </GameplayChatFadeViewport>

            <GameplayChatActionBar
              myTurn={myTurn}
              phase={phase}
              draft={draft}
              busy={busy}
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
            bonusHints={liveProfile?.progress.hintCredits ?? 0}
            coins={liveProfile?.progress.coins ?? 0}
            busy={hintBusy}
            onClose={() => setCardSheetOpen(false)}
            onUseHint={(k) => void handleUseHint(k)}
          />
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
