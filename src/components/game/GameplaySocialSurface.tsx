"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import type { RefObject } from "react";
import { memo, useState } from "react";
import { AvatarTurnRing } from "@/components/game/AvatarTurnRing";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { getCategoryById } from "@/lib/game/categories";
import type { PlayerCosmetic } from "@/lib/profile/cosmetics";
import type { ChatMessage, GameCard, Room } from "@/types";

const CARD_PLACEHOLDER = "/cards/_placeholder.svg";

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
      className="object-cover"
      sizes="120px"
      unoptimized
      onError={() => setErrored(true)}
    />
  );
});

export type GameplaySocialSurfaceProps = {
  banner: string | null;
  matchSyncWaiting: boolean;
  socialMatchLive: boolean;
  myTurn: boolean;
  phase: string;
  turnAction: string | null;
  secLeft: number | null;
  maxPhaseSec: number;
  displayName: string;
  opponentName: string;
  uid: string | null;
  opponent: Room["players"][number] | undefined;
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
  /** iOS overlay keyboard: layout viewport stays tall; pad footer by obscured px. */
  keyboardOverlapPx?: number;
};

/**
 * Mobile-first: one dominant chat column (flex-1 + min-h-0). Card lives in a
 * fixed-height horizontal strip inside that column so it cannot steal vertical
 * space from messages. Only the message list scrolls; composer stays at bottom.
 */
export function GameplaySocialSurface({
  banner,
  matchSyncWaiting,
  socialMatchLive,
  myTurn,
  phase,
  turnAction,
  secLeft,
  maxPhaseSec,
  displayName,
  opponentName,
  uid,
  opponent,
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
  const catName = opponentCard?.categoryId ? getCategoryById(opponentCard.categoryId)?.nameAr : null;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 space-y-1 px-2 pt-0.5">
        <AnimatePresence>
          {banner ? (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-lg border border-[#f4c48d] bg-[#fff2de]/95 px-2.5 py-1.5 text-center text-[11px] font-bold text-[#9a5f2d]"
            >
              {banner}
            </motion.div>
          ) : null}
        </AnimatePresence>
        {matchSyncWaiting ? (
          <div className="rounded-lg border border-[#f4d4af] bg-[#fff9ef]/95 px-2.5 py-1.5 text-center text-[11px] text-[#a16231]">
            جاري مزامنة حالة المباراة…
          </div>
        ) : null}
      </div>

      {socialMatchLive ? (
        <section className="shrink-0 px-2 pt-1">
          <div
            className="flex items-end justify-between gap-0.5 rounded-xl border border-white/70 px-1.5 py-1 shadow-[0_4px_16px_rgba(160,80,30,0.07)]"
            style={{
              background: "linear-gradient(180deg,rgba(255,255,255,0.94),rgba(255,248,238,0.9))",
            }}
          >
            <div className="flex min-w-0 flex-1 flex-col items-center gap-0">
              <AvatarTurnRing
                density="comfortable"
                showTimer={myTurn}
                emphasize={myTurn}
                secLeft={secLeft}
                maxSec={maxPhaseSec}
              >
                <ProfileAvatar
                  cosmetic={uid ? cosmeticsMap[uid] : null}
                  fallbackPhotoURL={userPhotoURL}
                  displayName={displayName}
                  size="lg"
                  active={myTurn}
                  idle={!myTurn}
                  showPulseDot={myTurn}
                />
              </AvatarTurnRing>
              <span
                className={`max-w-[96px] truncate text-[10px] font-black ${
                  myTurn ? "text-[#c2410c]" : "text-[#a16231]"
                }`}
              >
                أنت
              </span>
            </div>

            <div className="flex shrink-0 flex-col items-center justify-end pb-1.5">
              <span className="text-[9px] font-black text-[#c48652]">ضد</span>
              <span className="text-xs font-black text-[#e07a20]/75" aria-hidden>
                ⚔
              </span>
            </div>

            <div className="flex min-w-0 flex-1 flex-col items-center gap-0">
              <AvatarTurnRing
                density="comfortable"
                showTimer={!myTurn}
                emphasize={!myTurn}
                secLeft={secLeft}
                maxSec={maxPhaseSec}
              >
                <ProfileAvatar
                  cosmetic={opponent ? cosmeticsMap[opponent.uid] : null}
                  displayName={opponentName}
                  size="lg"
                  active={!myTurn}
                  idle={myTurn}
                  showPulseDot={!myTurn}
                />
              </AvatarTurnRing>
              <span
                className={`max-w-[96px] truncate text-[10px] font-black ${
                  !myTurn ? "text-[#c2410c]" : "text-[#a16231]"
                }`}
              >
                {opponentName}
              </span>
            </div>
          </div>

          {turnAction ? (
            <div className="mt-1 flex justify-center px-0.5">
              <div
                className={`max-w-full truncate rounded-full px-2.5 py-0.5 text-center text-[10px] font-black ${
                  myTurn ? "bg-[#fff4e6] text-[#9a3412]" : "bg-white/85 text-[#8a3f16]"
                }`}
                style={{ boxShadow: "0 0 0 1px rgba(244,196,141,0.4)" }}
              >
                {turnAction}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {/* Single flex-1 column: chat owns almost all remaining height */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col px-2 pb-1 pt-1.5 sm:px-2.5">
        <div
          className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[#f0d4bc] bg-gradient-to-b from-white to-[#fffbf6] shadow-[0_10px_32px_rgba(120,55,20,0.07)]"
          style={{ boxShadow: "0 0 0 1px rgba(244,196,141,0.35), 0 12px 36px rgba(120,55,20,0.06)" }}
        >
          <header className="flex h-8 shrink-0 items-center justify-between border-b border-[#f5e6d6] bg-[#fffaf6]/98 px-2">
            <span className="text-[11px] font-black text-[#7a3410]">الدردشة</span>
            <span
              className={`rounded-md px-1.5 py-0.5 text-[9px] font-extrabold ${
                myTurn
                  ? phase === "answer"
                    ? "bg-[#dcfce7] text-[#166534]"
                    : "bg-[#ede9fe] text-[#5b21b6]"
                  : "bg-[#fff3e0] text-[#a16231]"
              }`}
            >
              {myTurn ? (phase === "answer" ? "إجابة" : "سؤال") : "دور الخصم"}
            </span>
          </header>

          {/* Opponent card as horizontal strip — fixed height, never flex-grows */}
          <div className="flex shrink-0 items-center gap-2 border-b border-[#f5e6d6] bg-[#fff9f3]/95 px-2 py-1.5">
            <div className="gameplay-card-thumb relative bg-[#fff4e6]">
              {opponentCard?.imageUrl ? (
                <CardImage src={opponentCard.imageUrl} alt={opponentCard.nameAr} />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-[#d4a574]">
                  ؟
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-black text-[#8a3f16]">
                {opponentCard?.nameAr ?? "بطاقة الخصم"}
              </p>
              <p className="truncate text-[10px] font-semibold text-[#bc7a45]">
                {catName ? `الفئة: ${catName}` : "تظهر بعد بدء المباراة"}
              </p>
            </div>
          </div>

          {socialMatchLive ? (
            <>
              <div
                ref={chatScrollRef}
                className="scroll-y-chat min-h-0 flex-1 space-y-2 px-2 py-2"
              >
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-1 py-8 text-center">
                    <span className="text-2xl">💬</span>
                    <p className="text-[11px] font-semibold text-[#c48652]">ابدأ الحوار مع خصمك</p>
                  </div>
                ) : (
                  messages.map((m) => renderMessage(m))
                )}
                <div ref={chatEndRef} />
              </div>

              <footer
                className="relative z-20 shrink-0 space-y-1.5 border-t border-[#f5e6d6] bg-[#fffaf6] p-2 pt-1.5"
                style={{
                  paddingBottom: `calc(max(env(safe-area-inset-bottom, 0px), 8px) + ${keyboardOverlapPx}px)`,
                }}
              >
                {myTurn ? (
                  <div className="flex items-center gap-2">
                    <input
                      value={draft}
                      onChange={(e) => onDraftChange(e.target.value)}
                      placeholder={phase === "answer" ? "اكتب إجابتك…" : "اكتب سؤالك…"}
                      disabled={busy}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !busy) void onSendDraft();
                      }}
                      dir="rtl"
                      inputMode="text"
                      enterKeyHint="send"
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                      className="min-h-[44px] flex-1 rounded-xl px-3 py-2 font-semibold text-[#6f3714] placeholder-[#c9955e] outline-none"
                      style={{
                        fontSize: "16px",
                        background: "linear-gradient(180deg,#FFFCF7,#FFF6EB)",
                        boxShadow: "inset 0 0 0 1.5px rgba(244,196,141,0.55)",
                      }}
                      onFocus={(e) => onComposerFocus(e.currentTarget)}
                      onBlur={(e) => onComposerBlur(e.currentTarget)}
                    />
                    <motion.button
                      type="button"
                      disabled={busy || !draft.trim()}
                      onClick={() => void onSendDraft()}
                      whileTap={{ scale: 0.92 }}
                      aria-label="إرسال"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white disabled:opacity-50"
                      style={{
                        background: "linear-gradient(135deg,#FF9F0A,#FF6B00)",
                        boxShadow: "0 4px 0 #be5200, 0 6px 12px rgba(255,107,0,0.28)",
                      }}
                    >
                      <svg viewBox="0 0 18 18" fill="none" className="h-3.5 w-3.5" aria-hidden>
                        <path d="M2.5 9L15.5 3l-4 6 4 6-13-6z" fill="white" />
                      </svg>
                    </motion.button>
                  </div>
                ) : (
                  <div
                    className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-3 py-2"
                    style={{ background: "rgba(255,249,240,0.96)" }}
                  >
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="block h-1.5 w-1.5 rounded-full bg-[#e0a060]"
                        animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut", delay: i * 0.22 }}
                      />
                    ))}
                    <span className="text-[11px] font-semibold text-[#c48652]">بانتظار دورك…</span>
                  </div>
                )}

                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={onGuessClick}
                  className="relative w-full overflow-hidden rounded-xl py-2 text-[13px] font-black"
                  style={
                    myTurn
                      ? {
                          background: "linear-gradient(140deg,#FF9F0A 0%,#FF5500 100%)",
                          color: "#fff",
                          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35), 0 4px 0 #be5200",
                        }
                      : {
                          background: "linear-gradient(140deg,#FFF4E4 0%,#FFE8C8 100%)",
                          color: "#bc7a45",
                          boxShadow: "0 0 0 1px rgba(244,196,141,0.45)",
                        }
                  }
                >
                  🎯 تخمين
                </motion.button>
              </footer>
            </>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 px-4 py-10 text-center">
              <p className="text-[12px] font-semibold text-[#c48652]">ستظهر الدردشة هنا عند بدء المباراة</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
