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
      // object-contain keeps the full character/subject visible without
      // aggressive cropping — gives consistent composition across devices.
      className="object-contain"
      sizes="100px"
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
 * Phase 1 redesign: premium social mobile-game layout.
 *
 * Structure (top → bottom):
 *   1. System banner (conditional)
 *   2. Player strip  — avatars + VS badge, active player highlighted
 *   3. Turn banner   — whose turn it is, animated between states
 *   4. Card section  — opponent card with category, clean mini-card
 *   5. Chat panel    — flex-1, messages + composer
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
  const catName = opponentCard?.categoryId
    ? getCategoryById(opponentCard.categoryId)?.nameAr
    : null;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">

      {/* ── 1. SYSTEM BANNER ─────────────────────────────────── */}
      <div className="shrink-0 px-3 pt-1">
        <AnimatePresence>
          {banner ? (
            <motion.div
              key="banner"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="rounded-xl border border-[#f4c48d]/80 bg-gradient-to-b from-[#fff7e8] to-[#fff2de] px-3 py-1.5 text-center text-[11px] font-extrabold text-[#9a5f2d] shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_4px_12px_rgba(196,134,82,0.12)]"
            >
              {banner}
            </motion.div>
          ) : null}
        </AnimatePresence>
        {matchSyncWaiting ? (
          <div className="mt-1 rounded-lg border border-[#f4d4af] bg-[#fff9ef]/95 px-2.5 py-1 text-center text-[10.5px] font-semibold text-[#a16231]">
            جاري مزامنة حالة المباراة…
          </div>
        ) : null}
      </div>

      {/* ── 2. PLAYER STRIP ──────────────────────────────────── */}
      {socialMatchLive ? (
        <section className="shrink-0 px-3 pt-2">
          <div
            className="flex items-center justify-between overflow-hidden rounded-2xl border border-white/80 px-2 py-2"
            style={{
              background:
                "linear-gradient(180deg,rgba(255,255,255,0.98) 0%,rgba(255,250,242,0.96) 100%)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.92), 0 6px 22px rgba(160,80,30,0.09), 0 0 0 0.5px rgba(244,196,141,0.4)",
            }}
          >
            {/* ── Me ── */}
            <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
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
                className={`max-w-[86px] truncate text-center text-[10.5px] font-extrabold leading-tight ${
                  myTurn ? "text-[#c2410c]" : "text-[#a16231]"
                }`}
              >
                أنت
              </span>
            </div>

            {/* ── VS Badge ── */}
            <div className="mx-1 flex shrink-0 flex-col items-center">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{
                  background: "linear-gradient(140deg,#FF9F0A 0%,#FF5500 100%)",
                  boxShadow:
                    "inset 0 2px 0 rgba(255,255,255,0.40), 0 5px 0 #be5200, 0 9px 18px rgba(255,107,0,0.34)",
                }}
              >
                <span
                  className="text-[11px] font-black text-white"
                  style={{ textShadow: "0 1.5px 0 rgba(0,0,0,0.22)" }}
                >
                  VS
                </span>
              </div>
            </div>

            {/* ── Opponent ── */}
            <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
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
                className={`max-w-[86px] truncate text-center text-[10.5px] font-extrabold leading-tight ${
                  !myTurn ? "text-[#c2410c]" : "text-[#a16231]"
                }`}
              >
                {opponentName}
              </span>
            </div>
          </div>
        </section>
      ) : null}

      {/* ── 3. TURN BANNER ───────────────────────────────────── */}
      {socialMatchLive && turnAction ? (
        <section className="shrink-0 px-3 pt-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={turnAction}
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="relative flex items-center gap-3 overflow-hidden rounded-2xl px-4 py-2.5"
              style={
                myTurn
                  ? {
                      background:
                        "linear-gradient(135deg,#FF9F0A 0%,#FF6200 100%)",
                      boxShadow:
                        "inset 0 1.5px 0 rgba(255,255,255,0.40), inset 0 -3px 8px rgba(150,50,0,0.22), 0 6px 0 #be5200, 0 12px 28px rgba(255,107,0,0.34)",
                    }
                  : {
                      background:
                        "linear-gradient(135deg,rgba(255,255,255,0.98) 0%,rgba(255,249,239,0.96) 100%)",
                      boxShadow:
                        "inset 0 1px 0 rgba(255,255,255,0.92), 0 4px 16px rgba(160,80,30,0.08), 0 0 0 0.5px rgba(244,196,141,0.5)",
                    }
              }
            >
              {/* Gloss streak on active turn */}
              {myTurn && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-8 top-1.5 h-2 rounded-full bg-white/28 blur-[2px]"
                />
              )}
              <span
                className={`min-w-0 flex-1 truncate text-[13px] font-extrabold ${
                  myTurn ? "text-white" : "text-[#8a3f16]"
                }`}
                style={
                  myTurn ? { textShadow: "0 1.5px 0 rgba(0,0,0,0.18)" } : {}
                }
              >
                {turnAction}
              </span>
              {/* Live countdown on active turn */}
              {myTurn && secLeft !== null && (
                <span
                  className={`shrink-0 font-black tabular-nums ${
                    secLeft <= 5
                      ? "text-[15px] text-red-100"
                      : "text-[14px] text-white/90"
                  }`}
                  style={{ textShadow: "0 1.5px 0 rgba(0,0,0,0.18)" }}
                >
                  {secLeft}ث
                </span>
              )}
            </motion.div>
          </AnimatePresence>
        </section>
      ) : null}

      {/* ── 4. CARD SECTION ──────────────────────────────────── */}
      <section className="shrink-0 px-3 pt-2">
        <div
          className="flex items-center gap-3 overflow-hidden rounded-2xl border border-[#f0d8bc]/80 px-3 py-2"
          style={{
            background:
              "linear-gradient(135deg,rgba(255,255,255,0.97) 0%,rgba(255,249,238,0.96) 100%)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.9), 0 6px 20px rgba(160,80,30,0.07), 0 0 0 0.5px rgba(244,196,141,0.35)",
          }}
        >
          {/* Card visual — portrait 3∶4 ratio, responsive width.
               object-contain ensures the full subject stays in frame. */}
          <div
            className="relative shrink-0 overflow-hidden rounded-[14px]"
            style={{
              width: "clamp(60px, 15vw, 80px)",
              aspectRatio: "3 / 4",
              background:
                "linear-gradient(160deg,#FFF6E5 0%,#FFE8BF 60%,#FFDFA0 100%)",
              boxShadow:
                "0 0 0 1.5px rgba(244,196,141,0.70), 0 2px 0 rgba(244,196,141,0.35), 0 6px 18px rgba(196,120,40,0.22), inset 0 1.5px 0 rgba(255,255,255,0.55)",
            }}
          >
            {opponentCard?.imageUrl ? (
              <CardImage
                src={opponentCard.imageUrl}
                alt={opponentCard.nameAr || "بطاقة الخصم"}
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-0.5">
                <span
                  className="text-4xl leading-none"
                  style={{ filter: "opacity(0.35)" }}
                >
                  ؟
                </span>
              </div>
            )}
          </div>

          {/* Card metadata */}
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-extrabold uppercase tracking-widest text-[#bc7a45]">
              الشخصية السرية
            </p>
            <p className="mt-0.5 truncate text-[13px] font-black text-[#6f3714]">
              {opponentCard?.nameAr ?? "بطاقة الخصم"}
            </p>
            {catName ? (
              <span
                className="mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-extrabold"
                style={{
                  background:
                    "linear-gradient(135deg,#FFF4E4,#FFE8C8)",
                  color: "#9a4f1d",
                  boxShadow: "0 0 0 1px rgba(244,196,141,0.55)",
                }}
              >
                🐾 {catName}
              </span>
            ) : (
              <p className="mt-0.5 text-[9.5px] font-semibold text-[#c48652]">
                {opponentCard ? "بدون تصنيف" : "تظهر بعد بدء المباراة"}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── 5. CHAT PANEL ────────────────────────────────────── */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col px-3 pb-1 pt-2">
        <div
          className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[#f0d4bc]/70"
          style={{
            background:
              "linear-gradient(180deg,rgba(255,255,255,0.98) 0%,rgba(255,251,246,0.97) 100%)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.9), 0 0 0 0.5px rgba(244,196,141,0.28), 0 10px 30px rgba(120,55,20,0.06)",
          }}
        >
          {/* Chat header — minimal: label + phase badge */}
          <header className="flex h-9 shrink-0 items-center justify-between border-b border-[#f5e6d6] bg-[#fffaf6]/98 px-3">
            <span className="text-[10.5px] font-extrabold tracking-wide text-[#7a3410]">
              الدردشة
            </span>
            {socialMatchLive && (
              <span
                className={`rounded-lg px-2 py-0.5 text-[9px] font-extrabold shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] ${
                  myTurn
                    ? phase === "answer"
                      ? "bg-gradient-to-b from-[#d1fae5] to-[#bbf7d0] text-[#166534]"
                      : "bg-gradient-to-b from-[#ede9fe] to-[#ddd6fe] text-[#5b21b6]"
                    : "bg-gradient-to-b from-[#fff3e0] to-[#ffe8c4] text-[#a16231]"
                }`}
              >
                {myTurn
                  ? phase === "answer"
                    ? "إجابة"
                    : "سؤال"
                  : "دور الخصم"}
              </span>
            )}
          </header>

          {socialMatchLive ? (
            <>
              {/* Message list — space-y-3 for breathing room between bubbles */}
              <div
                ref={chatScrollRef}
                className="scroll-y-chat min-h-0 flex-1 space-y-3 px-3 py-3"
              >
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                    <span className="text-3xl opacity-60">💬</span>
                    <p className="text-[12px] font-bold text-[#c48652]">
                      ابدأ بطرح سؤالك على خصمك
                    </p>
                    <p className="text-[10.5px] font-medium text-[#d4a574]">
                      اسأل بـ «نعم» أو «لا»
                    </p>
                  </div>
                ) : (
                  messages.map((m) => renderMessage(m))
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Composer footer */}
              <footer
                className="relative z-20 shrink-0 space-y-1.5 border-t border-[#f5e6d6] bg-gradient-to-b from-[#fffaf6] to-[#fffbf7] p-2 pt-1.5"
                style={{
                  paddingBottom: `calc(max(env(safe-area-inset-bottom, 0px), 8px) + ${keyboardOverlapPx}px)`,
                }}
              >
                {myTurn ? (
                  <div className="flex items-center gap-2">
                    <input
                      value={draft}
                      onChange={(e) => onDraftChange(e.target.value)}
                      placeholder={
                        phase === "answer" ? "اكتب إجابتك…" : "اكتب سؤالك…"
                      }
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
                        background:
                          "linear-gradient(180deg,#FFFCF7,#FFF6EB)",
                        boxShadow:
                          "inset 0 0 0 1.5px rgba(244,196,141,0.55), inset 0 2px 6px rgba(196,134,82,0.06)",
                      }}
                      onFocus={(e) => onComposerFocus(e.currentTarget)}
                      onBlur={(e) => onComposerBlur(e.currentTarget)}
                    />
                    <motion.button
                      type="button"
                      disabled={busy || !draft.trim()}
                      onClick={() => void onSendDraft()}
                      whileTap={{ scale: 0.9 }}
                      aria-label="إرسال"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white disabled:opacity-50"
                      style={{
                        background:
                          "linear-gradient(135deg,#FF9F0A,#FF6B00)",
                        boxShadow:
                          "inset 0 1.5px 0 rgba(255,255,255,0.35), 0 4px 0 #be5200, 0 6px 12px rgba(255,107,0,0.26)",
                      }}
                    >
                      <svg
                        viewBox="0 0 18 18"
                        fill="none"
                        className="h-3.5 w-3.5"
                        aria-hidden
                      >
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
                        animate={{
                          scale: [1, 1.5, 1],
                          opacity: [0.4, 1, 0.4],
                        }}
                        transition={{
                          duration: 1.1,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: i * 0.22,
                        }}
                      />
                    ))}
                    <span className="text-[11px] font-semibold text-[#c48652]">
                      بانتظار دورك…
                    </span>
                  </div>
                )}

                {/* Guess CTA */}
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={onGuessClick}
                  className="relative w-full overflow-hidden rounded-xl py-2 text-[13px] font-black"
                  style={
                    myTurn
                      ? {
                          background:
                            "linear-gradient(140deg,#FF9F0A 0%,#FF5500 100%)",
                          color: "#fff",
                          boxShadow:
                            "inset 0 1px 0 rgba(255,255,255,0.35), 0 4px 0 #be5200, 0 7px 16px rgba(255,107,0,0.26)",
                        }
                      : {
                          background:
                            "linear-gradient(140deg,#FFF4E4 0%,#FFE8C8 100%)",
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
              <span className="text-2xl">⏳</span>
              <p className="text-[12px] font-semibold text-[#c48652]">
                ستظهر الدردشة هنا عند بدء المباراة
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
