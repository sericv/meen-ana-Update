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
      sizes="(max-width: 400px) 40vw, 200px"
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
};

/**
 * Mobile-first social gameplay: compact player strip, small opponent card,
 * dominant chat with isolated message scroll and bottom composer.
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
}: GameplaySocialSurfaceProps) {
  const catName = opponentCard?.categoryId ? getCategoryById(opponentCard.categoryId)?.nameAr : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 space-y-1.5 px-2 pt-1">
        <AnimatePresence>
          {banner ? (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-xl border border-[#f4c48d] bg-[#fff2de]/95 px-3 py-2 text-center text-xs font-bold text-[#9a5f2d] shadow-sm"
            >
              {banner}
            </motion.div>
          ) : null}
        </AnimatePresence>
        {matchSyncWaiting ? (
          <div className="rounded-xl border border-[#f4d4af] bg-[#fff9ef]/95 px-3 py-2 text-center text-xs text-[#a16231]">
            جاري مزامنة حالة المباراة…
          </div>
        ) : null}
      </div>

      {socialMatchLive ? (
        <section className="shrink-0 px-2 pt-1.5">
          <div
            className="flex items-end justify-between gap-1 rounded-2xl border border-white/70 px-2 py-1.5 shadow-[0_6px_20px_rgba(160,80,30,0.08)]"
            style={{
              background: "linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,248,238,0.88))",
            }}
          >
            <div className="flex min-w-0 flex-1 flex-col items-center gap-0.5">
              <AvatarTurnRing
                density="compact"
                showTimer={myTurn}
                emphasize={myTurn}
                secLeft={secLeft}
                maxSec={maxPhaseSec}
              >
                <ProfileAvatar
                  cosmetic={uid ? cosmeticsMap[uid] : null}
                  fallbackPhotoURL={userPhotoURL}
                  displayName={displayName}
                  size="md"
                  active={myTurn}
                  idle={!myTurn}
                  showPulseDot={myTurn}
                />
              </AvatarTurnRing>
              <span
                className={`max-w-[88px] truncate text-[10px] font-black ${
                  myTurn ? "text-[#c2410c]" : "text-[#a16231]"
                }`}
              >
                أنت
              </span>
            </div>

            <div className="flex shrink-0 flex-col items-center justify-end pb-1">
              <span className="text-[10px] font-black tracking-wide text-[#c48652]">ضد</span>
              <span className="text-sm font-black text-[#e07a20]/80" aria-hidden>
                ⚔
              </span>
            </div>

            <div className="flex min-w-0 flex-1 flex-col items-center gap-0.5">
              <AvatarTurnRing
                density="compact"
                showTimer={!myTurn}
                emphasize={!myTurn}
                secLeft={secLeft}
                maxSec={maxPhaseSec}
              >
                <ProfileAvatar
                  cosmetic={opponent ? cosmeticsMap[opponent.uid] : null}
                  displayName={opponentName}
                  size="md"
                  active={!myTurn}
                  idle={myTurn}
                  showPulseDot={!myTurn}
                />
              </AvatarTurnRing>
              <span
                className={`max-w-[88px] truncate text-[10px] font-black ${
                  !myTurn ? "text-[#c2410c]" : "text-[#a16231]"
                }`}
              >
                {opponentName}
              </span>
            </div>
          </div>

          {turnAction ? (
            <div className="mt-1.5 flex justify-center px-1">
              <div
                className={`max-w-full truncate rounded-full px-3 py-1 text-center text-[11px] font-black shadow-sm ${
                  myTurn ? "bg-[#fff4e6] text-[#9a3412]" : "bg-white/80 text-[#8a3f16]"
                }`}
                style={{ boxShadow: "0 0 0 1px rgba(244,196,141,0.45)" }}
              >
                {turnAction}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col gap-2 px-2 pb-1 pt-2 sm:px-3">
        <div className="shrink-0">
          <div className="mx-auto w-full max-w-[220px]">
            {catName ? (
              <p className="mb-1 text-center text-[10px] font-bold text-[#bc7a45]">الفئة: {catName}</p>
            ) : (
              <p className="mb-1 text-center text-[10px] font-bold text-[#bc7a45]">بطاقة الخصم</p>
            )}
            <div
              className="relative overflow-hidden rounded-2xl"
              style={{
                background: "linear-gradient(180deg,#FFF9F1 0%,#FFF4E6 100%)",
                boxShadow: "0 0 0 1.5px rgba(244,196,141,0.45), 0 8px 22px rgba(196,120,40,0.12)",
              }}
            >
              {opponentCard?.imageUrl ? (
                <>
                  <div className="relative mx-auto w-full overflow-hidden rounded-t-[1.1rem] gameplay-card-compact">
                    <CardImage src={opponentCard.imageUrl} alt={opponentCard.nameAr} />
                    <div className="pointer-events-none absolute inset-0 rounded-t-[1.1rem] ring-1 ring-inset ring-white/25" />
                  </div>
                  <div className="px-2 pb-2 pt-1.5 text-center">
                    <p className="truncate text-sm font-black text-[#8a3f16]">{opponentCard.nameAr}</p>
                  </div>
                </>
              ) : (
                <div className="gameplay-card-compact flex items-center justify-center text-xs text-[#bc7a45]">
                  بعد بدء المباراة
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[#f4dcc4]/90 bg-gradient-to-b from-white to-[#fffbf6] shadow-[0_12px_36px_rgba(120,55,20,0.08)]">
          <header className="flex h-9 shrink-0 items-center justify-between border-b border-[#f8ead8] bg-[#fffaf4]/95 px-2.5">
            <span className="text-xs font-black text-[#7a3410]">الدردشة</span>
            <span
              className={`rounded-lg px-2 py-0.5 text-[10px] font-extrabold ${
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

          {socialMatchLive ? (
            <>
              <div
                ref={chatScrollRef}
                className="scroll-y scroll-y-hidden min-h-0 flex-1 space-y-2.5 overflow-y-auto px-2.5 py-2"
              >
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-1 py-6 text-center">
                    <span className="text-2xl">💬</span>
                    <p className="text-xs font-semibold text-[#c48652]">ابدأ الحوار مع خصمك</p>
                  </div>
                ) : (
                  messages.map((m) => renderMessage(m))
                )}
                <div ref={chatEndRef} />
              </div>

              <footer className="kbd-safe-area-only shrink-0 space-y-2 border-t border-[#f8ead8] bg-[#fffaf6]/98 p-2 pt-1.5">
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
                    style={{ background: "rgba(255,249,240,0.95)" }}
                  >
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="block h-1.5 w-1.5 rounded-full bg-[#e0a060]"
                        animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut", delay: i * 0.22 }}
                      />
                    ))}
                    <span className="text-xs font-semibold text-[#c48652]">بانتظار دورك…</span>
                  </div>
                )}

                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={onGuessClick}
                  className="relative w-full overflow-hidden rounded-xl py-2.5 text-sm font-black"
                  style={
                    myTurn
                      ? {
                          background: "linear-gradient(140deg,#FF9F0A 0%,#FF5500 100%)",
                          color: "#fff",
                          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35), 0 5px 0 #be5200",
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
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 px-4 py-8 text-center">
              <p className="text-sm font-semibold text-[#c48652]">ستظهر الدردشة هنا عند بدء المباراة</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
