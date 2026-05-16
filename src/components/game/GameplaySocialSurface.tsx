"use client";
// v3 — premium social UI from game.jsx layout reference
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import type { RefObject } from "react";
import { memo, useMemo, useState } from "react";
import { AvatarTurnRing } from "@/components/game/AvatarTurnRing";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { getCategoryById } from "@/lib/game/categories";
import type { PlayerCosmetic } from "@/lib/profile/cosmetics";
import type { ChatMessage, GameCard, Room } from "@/types";

const CARD_PLACEHOLDER = "/cards/_placeholder.svg";

/** أحدث رسائل تظهر في الشات فقط؛ الأقدم تُزال من الواجهة ولا يمكن التمرير إليها. */
const VISIBLE_CHAT_MESSAGE_COUNT = 6;

/* ─── Design tokens (game.jsx) ───────────────────────────────────── */
const ORANGE = "#FF8A3D";
const ORANGE_DEEP = "#F26A1F";
const ORANGE_SOFT = "#FFC58A";
const CREAM = "#FFF1DD";
const CREAM_DEEP = "#FBE0BD";
const INK = "#3A2517";
const INK_SOFT = "#7A5A45";
const GOLD = "#F2B544";
const GREEN = "#3FB87A";

function formatPhaseTimer(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function IconSend({ color = "#fff" }: { color?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M16.5 9L1.5 1.5l3 7.5-3 7.5L16.5 9z" fill={color} />
    </svg>
  );
}

function IconBulb({ color = "#fff" }: { color?: string }) {
  return (
    <svg width="20" height="22" viewBox="0 0 20 22" fill="none" aria-hidden>
      <path
        d="M10 1.5a6.5 6.5 0 00-4 11.6c.7.6 1 1.4 1 2.3v1.1h6v-1.1c0-.9.3-1.7 1-2.3A6.5 6.5 0 0010 1.5z"
        fill={color}
      />
      <rect x="7" y="17.5" width="6" height="2" rx="1" fill={color} />
      <rect x="8" y="20" width="4" height="1.5" rx="0.75" fill={color} />
    </svg>
  );
}

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
      sizes="(max-width: 640px) 42vw, (max-width: 1024px) 28vw, 220px"
      unoptimized
      onError={() => setErrored(true)}
    />
  );
});

function PlayerColumn({
  active,
  label,
  uid,
  cosmeticsMap,
  userPhotoURL,
  displayName,
  showTimer,
  secLeft,
  maxPhaseSec,
}: {
  active: boolean;
  label: string;
  uid: string | null;
  cosmeticsMap: Record<string, PlayerCosmetic>;
  userPhotoURL: string | null | undefined;
  displayName: string;
  showTimer: boolean;
  secLeft: number | null;
  maxPhaseSec: number;
}) {
  return (
    <motion.div
      layout={false}
      className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
      animate={active ? { opacity: 1 } : { opacity: 0.88 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        layout={false}
        className="relative flex shrink-0 flex-col items-center"
        animate={active ? { y: [0, -2, 0] } : { y: 0 }}
        transition={
          active
            ? { duration: 2.8, repeat: Infinity, ease: "easeInOut" }
            : { duration: 0.2 }
        }
      >
        <AvatarTurnRing
          density="compact"
          innerPx={56}
          showTimer={showTimer}
          emphasize={active}
          secLeft={secLeft}
          maxSec={maxPhaseSec}
        >
          <motion.div
            layout={false}
            className="flex items-center justify-center rounded-full p-0.5"
            style={{
              background: active ? "#fff" : "rgba(255,255,255,0.88)",
              boxShadow: active
                ? `0 6px 16px ${ORANGE}55, inset 0 0 0 1px rgba(255,255,255,0.9)`
                : "0 4px 12px rgba(58,37,23,0.12), inset 0 0 0 1px rgba(255,255,255,0.9)",
            }}
          >
            <ProfileAvatar
              cosmetic={uid ? cosmeticsMap[uid] : null}
              fallbackPhotoURL={userPhotoURL}
              displayName={displayName}
              size="md"
              active={active}
              idle={!active}
              showPulseDot={active}
            />
          </motion.div>
        </AvatarTurnRing>
        {active ? (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute -bottom-0.5 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-[10px] border-[1.5px] border-white px-2 py-0.5 text-[9px] font-extrabold text-white"
            style={{
              background: ORANGE,
              boxShadow: `0 3px 8px ${ORANGE}66`,
            }}
          >
            دوره
          </motion.span>
        ) : null}
      </motion.div>
      <div
        className="max-w-[72px] truncate text-center text-[11px] font-bold"
        style={{ color: INK }}
      >
        {label}
      </div>
    </motion.div>
  );
}

function SecretCardVisual({
  opponentCard,
  catName,
  catEmoji,
}: {
  opponentCard: GameCard | null;
  catName: string | null;
  catEmoji: string;
}) {
  const hasImage = Boolean(opponentCard?.imageUrl);

  return (
    <motion.div
      layout={false}
      className="relative mx-0 w-[min(184px,46vw)] max-w-[184px] shrink-0 sm:w-[min(208px,36vw)] sm:max-w-[208px] md:max-w-[228px] lg:max-w-[244px]"
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-4 rounded-[28px] sm:-inset-5 sm:rounded-[32px]"
        style={{
          background: `radial-gradient(ellipse, ${ORANGE}33 0%, transparent 70%)`,
          filter: "blur(8px)",
        }}
        animate={{ opacity: [0.65, 1, 0.65] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        layout
        className="gameplay-secret-card relative flex h-[min(210px,47vw)] w-full flex-col items-center justify-between overflow-hidden rounded-[24px] px-3 pb-3 pt-4 sm:h-[min(238px,41vw)] sm:rounded-[26px] sm:px-3.5 sm:pb-3.5 sm:pt-4 md:h-[min(258px,35vw)] lg:h-[min(272px,30vw)]"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -left-5 -top-5 h-[200px] w-20 rotate-[20deg]"
          style={{
            background:
              "linear-gradient(110deg, transparent, rgba(255,255,255,0.65), transparent)",
          }}
        />

        <motion.div
          className="relative flex w-full flex-1 flex-col items-center justify-center py-0.5"
          animate={hasImage ? undefined : { y: [0, -3, 0] }}
          transition={
            hasImage
              ? undefined
              : { duration: 2.6, repeat: Infinity, ease: "easeInOut" }
          }
        >
          {hasImage ? (
            <motion.div
              layout
              className="relative aspect-square w-[min(124px,40vw)] max-w-[154px] overflow-hidden rounded-2xl sm:w-[min(144px,32vw)] sm:max-w-[172px] md:max-w-[188px] lg:max-w-[198px]"
              style={{
                boxShadow: `inset 0 -4px 10px rgba(0,0,0,0.14), 0 8px 18px ${ORANGE}38`,
              }}
            >
              <CardImage
                src={opponentCard!.imageUrl!}
                alt={opponentCard?.nameAr || "بطاقة الخصم"}
              />
            </motion.div>
          ) : (
            <>
              <div
                aria-hidden
                className="absolute top-1 h-[min(5.5rem,30vw)] w-[min(5.5rem,30vw)] max-h-[100px] max-w-[100px] rounded-full sm:top-2 sm:max-h-[112px] sm:max-w-[112px]"
                style={{
                  background: `linear-gradient(160deg, ${ORANGE_DEEP} 0%, #8E3F12 100%)`,
                  boxShadow: `inset 0 -6px 10px rgba(0,0,0,0.25), inset 0 4px 6px ${ORANGE}88`,
                }}
              />
              <span
                className="relative z-[2] mt-2 text-[clamp(3.25rem,17vw,4.5rem)] font-black leading-none sm:mt-3 sm:text-[4.5rem]"
                style={{
                  fontFamily: "var(--font-rubik, Rubik), system-ui",
                  background: "linear-gradient(180deg, #fff 0%, #F2B544 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  filter: `drop-shadow(0 4px 6px ${ORANGE_DEEP}55)`,
                }}
              >
                ؟
              </span>
              <span
                aria-hidden
                className="absolute right-3.5 top-1 h-1.5 w-1.5 rounded-full bg-white"
                style={{ boxShadow: "0 0 6px #fff" }}
              />
              <span
                aria-hidden
                className="absolute bottom-7 left-3 h-1 w-1 rounded-full"
                style={{ background: GOLD, boxShadow: `0 0 6px ${GOLD}` }}
              />
            </>
          )}
        </motion.div>

        <p
          className="relative z-[1] max-w-full truncate px-1 text-center text-[11.5px] font-extrabold leading-snug sm:text-xs md:text-[13px]"
          style={{ color: INK }}
        >
          {opponentCard?.nameAr ?? "بطاقة الخصم"}
        </p>

        {catName ? (
          <div
            className="relative z-[1] flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-extrabold text-white sm:px-3.5 sm:py-1.5 sm:text-[11px]"
            style={{
              background: `linear-gradient(180deg, ${INK} 0%, #2A1810 100%)`,
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.15), 0 3px 8px rgba(0,0,0,0.2)",
            }}
          >
            <span
              className="h-1 w-1 shrink-0 rounded-full"
              style={{ background: GOLD, boxShadow: `0 0 4px ${GOLD}` }}
            />
            الفئة: {catEmoji} {catName}
          </div>
        ) : (
          <p className="text-[9px] font-semibold" style={{ color: INK_SOFT }}>
            {opponentCard ? "بدون تصنيف" : "تظهر بعد بدء المباراة"}
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}

/** زر تخمين مدمج بجانب حقل المحادثة (لا يُعرض فوق الأفاتار). */
function InlineChatGuessButton({
  myTurn,
  onGuessClick,
}: {
  myTurn: boolean;
  onGuessClick: () => void;
}) {
  return (
    <div className="flex shrink-0 flex-col items-center gap-0.5 self-stretch justify-center py-0.5">
      <motion.button
        type="button"
        whileTap={{ scale: 0.92 }}
        whileHover={myTurn ? { scale: 1.04 } : undefined}
        onClick={onGuessClick}
        aria-label="تخمين"
        className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-0 sm:h-12 sm:w-12 sm:rounded-2xl"
        style={{
          background: myTurn
            ? `linear-gradient(180deg, ${GOLD} 0%, #D8941F 100%)`
            : `linear-gradient(180deg, ${CREAM} 0%, ${CREAM_DEEP} 100%)`,
          boxShadow: myTurn
            ? `0 6px 14px ${GOLD}55, inset 0 1.5px 0 rgba(255,255,255,0.5), inset 0 -2px 0 rgba(0,0,0,0.12)`
            : "0 3px 10px rgba(58,37,23,0.10), inset 0 0 0 1px rgba(255,255,255,0.9)",
          opacity: myTurn ? 1 : 0.9,
        }}
      >
        <IconBulb color={myTurn ? "#fff" : INK_SOFT} />
      </motion.button>
      <span
        className="max-w-[3.25rem] truncate rounded-md border border-white/90 bg-white px-1 py-0.5 text-center text-[8.5px] font-black leading-none shadow-sm sm:text-[9px]"
        style={{
          color: INK,
          borderColor: GOLD,
        }}
      >
        تخمين
      </span>
    </div>
  );
}

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
  keyboardOverlapPx?: number;
};

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
    ? (getCategoryById(opponentCard.categoryId)?.nameAr ?? null)
    : null;

  const CAT_EMOJI: Record<string, string> = {
    cat_general: "🌟",
    cat_celebrities: "🎬",
    cat_animals: "🐾",
    cat_games: "🎮",
    cat_anime: "⛩️",
  };
  const catEmoji = opponentCard?.categoryId
    ? (CAT_EMOJI[opponentCard.categoryId] ?? "🐾")
    : "🐾";

  const visibleMessages = useMemo(
    () => messages.slice(-VISIBLE_CHAT_MESSAGE_COUNT),
    [messages],
  );

  const meColumn = (
    <PlayerColumn
      active={myTurn}
      label="أنت"
      uid={uid}
      cosmeticsMap={cosmeticsMap}
      userPhotoURL={userPhotoURL}
      displayName={displayName}
      showTimer={myTurn}
      secLeft={secLeft}
      maxPhaseSec={maxPhaseSec}
    />
  );

  const opponentColumn = (
    <PlayerColumn
      active={!myTurn}
      label={opponentName}
      uid={opponent?.uid ?? null}
      cosmeticsMap={cosmeticsMap}
      userPhotoURL={undefined}
      displayName={opponentName}
      showTimer={!myTurn}
      secLeft={secLeft}
      maxPhaseSec={maxPhaseSec}
    />
  );

  return (
    <motion.div
      layout
      className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
      dir="rtl"
    >
      {/* ── System banner ──────────────────────────────────── */}
      <div className="shrink-0 px-4 pt-2">
        <AnimatePresence>
          {banner ? (
            <motion.div
              key="banner"
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              className="rounded-2xl border px-4 py-2 text-center text-[11px] font-extrabold"
              style={{
                borderColor: `${ORANGE_SOFT}cc`,
                color: "#9a5f2d",
                background: "linear-gradient(135deg,#fff7e8,#fff0d8)",
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.85), 0 6px 18px rgba(196,134,82,0.14)",
              }}
            >
              {banner}
            </motion.div>
          ) : null}
        </AnimatePresence>
        {matchSyncWaiting ? (
          <div
            className="mt-1.5 rounded-xl border px-3 py-1.5 text-center text-[10.5px] font-semibold"
            style={{
              borderColor: CREAM_DEEP,
              background: "rgba(255,249,239,0.95)",
              color: "#a16231",
            }}
          >
            جاري مزامنة حالة المباراة…
          </div>
        ) : null}
      </div>

      {/* ── Turn banner (centered pill) ───────────────────── */}
      {socialMatchLive && turnAction ? (
        <section className="shrink-0 px-4 pt-3.5">
          <AnimatePresence mode="wait">
            <motion.div
              key={turnAction}
              initial={{ opacity: 0, y: -10, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.94 }}
              transition={{ type: "spring", stiffness: 440, damping: 32 }}
              className="flex justify-center"
            >
              <div
                className="gameplay-turn-pill relative min-w-[200px] rounded-[22px] px-7 py-2.5 text-center"
              >
                <span
                  aria-hidden
                  className="absolute -top-1 end-3.5 h-1.5 w-1.5 rounded-full bg-white"
                  style={{ boxShadow: "0 0 8px #fff" }}
                />
                <span
                  aria-hidden
                  className="absolute start-3 top-1.5 h-1 w-1 rounded-full"
                  style={{ background: GOLD, boxShadow: `0 0 6px ${GOLD}` }}
                />
                <p
                  className="text-[19px] font-black text-white"
                  style={{ textShadow: "0 1.5px 0 rgba(0,0,0,0.18)" }}
                >
                  {turnAction}
                </p>
                {myTurn && secLeft !== null ? (
                  <p className="-mt-0.5 text-[11.5px] font-bold text-white/92">
                    {phase === "answer" ? "أجب بسرعة!" : "اسأل بسرعة!"}{" "}
                    <span className="tabular-nums">⏱ {formatPhaseTimer(secLeft)}</span>
                  </p>
                ) : null}
              </div>
            </motion.div>
          </AnimatePresence>
        </section>
      ) : null}

      {/* ── Players + secret card ─────────────────────────── */}
      <section className="relative shrink-0 overflow-hidden px-4 pt-3">
        <span
          aria-hidden
          className="pointer-events-none absolute end-8 top-2.5 select-none text-[26px] font-black"
          style={{ color: ORANGE_SOFT, opacity: 0.35, transform: "rotate(-18deg)" }}
        >
          ؟
        </span>
        <span
          aria-hidden
          className="pointer-events-none absolute start-4 top-20 select-none text-xl font-black"
          style={{ color: ORANGE_SOFT, opacity: 0.35, transform: "rotate(15deg)" }}
        >
          ؟
        </span>
        <span
          aria-hidden
          className="pointer-events-none absolute end-2 top-[130px] select-none text-base font-black"
          style={{ color: GOLD, opacity: 0.4, transform: "rotate(8deg)" }}
        >
          ؟
        </span>

        {socialMatchLive ? (
          <motion.div layout={false} className="relative flex min-w-0 items-center justify-center gap-1.5 sm:gap-3">
            {myTurn ? (
              <>
                {meColumn}
                <SecretCardVisual
                  opponentCard={opponentCard}
                  catName={catName}
                  catEmoji={catEmoji}
                />
                {opponentColumn}
              </>
            ) : (
              <>
                {opponentColumn}
                <SecretCardVisual
                  opponentCard={opponentCard}
                  catName={catName}
                  catEmoji={catEmoji}
                />
                {meColumn}
              </>
            )}
          </motion.div>
        ) : (
          <motion.div layout={false} className="flex justify-center py-1">
            <SecretCardVisual
              opponentCard={opponentCard}
              catName={catName}
              catEmoji={catEmoji}
            />
          </motion.div>
        )}
      </section>

      {/* ── Chat panel ─────────────────────────────────────── */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col px-3.5 pb-1 pt-3">
        <div className="gameplay-glass-chat flex min-h-0 flex-1 flex-col overflow-hidden rounded-[22px]">
          <header
            className="flex shrink-0 items-center justify-between px-4 pb-2 pt-2.5"
            style={{ borderBottom: `1px dashed ${CREAM_DEEP}` }}
          >
            <div
              className="flex items-center gap-1.5 text-xs font-extrabold"
              style={{ color: INK }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: GREEN, boxShadow: `0 0 6px ${GREEN}` }}
              />
              الدردشة
            </div>
            {socialMatchLive ? (
              <span
                className="rounded-full px-2.5 py-0.5 text-[9px] font-extrabold"
                style={
                  myTurn
                    ? phase === "answer"
                      ? {
                          background: `linear-gradient(135deg, #d1fae5, #bbf7d0)`,
                          color: "#166534",
                        }
                      : {
                          background: `linear-gradient(135deg, #ede9fe, #ddd6fe)`,
                          color: "#5b21b6",
                        }
                    : {
                        background: `linear-gradient(135deg, ${CREAM}, ${CREAM_DEEP})`,
                        color: "#a16231",
                      }
                }
              >
                {myTurn
                  ? phase === "answer"
                    ? "إجابة"
                    : "سؤال"
                  : "دور الخصم"}
              </span>
            ) : null}
          </header>

          {socialMatchLive ? (
            <>
              <motion.div
                layout
                ref={chatScrollRef}
                className="scroll-y-chat min-h-0 flex-1 space-y-2.5 px-2.5 py-2.5"
              >
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2.5 py-10 text-center">
                    <motion.span
                      className="text-4xl leading-none"
                      animate={{ y: [0, -5, 0] }}
                      transition={{
                        duration: 2.4,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      💬
                    </motion.span>
                    <p className="text-[12px] font-bold" style={{ color: INK_SOFT }}>
                      ابدأ بطرح سؤالك على خصمك
                    </p>
                    <p className="text-[10.5px] font-medium opacity-80" style={{ color: INK_SOFT }}>
                      اسأل بـ «نعم» أو «لا»
                    </p>
                  </div>
                ) : (
                  visibleMessages.map((m) => renderMessage(m))
                )}
                <motion.div layout ref={chatEndRef} />
              </motion.div>

              <footer
                className="relative z-20 shrink-0 px-2.5 pb-2 pt-1.5"
                style={{
                  paddingBottom: `calc(max(env(safe-area-inset-bottom, 0px), 8px) + ${keyboardOverlapPx}px)`,
                }}
              >
                {myTurn ? (
                  <div className="flex min-w-0 flex-row items-stretch gap-2" dir="ltr">
                    <InlineChatGuessButton myTurn={myTurn} onGuessClick={onGuessClick} />
                    <motion.div
                      layout
                      className="gameplay-input-shell flex min-w-0 flex-1 items-center gap-1.5 rounded-[22px] p-1.5"
                      dir="rtl"
                    >
                    <motion.button
                      type="button"
                      disabled={busy || !draft.trim()}
                      onClick={() => void onSendDraft()}
                      whileTap={{ scale: 0.88 }}
                      aria-label="إرسال"
                      className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[14px] border-0 disabled:opacity-50"
                      style={{
                        background: `linear-gradient(180deg, ${ORANGE} 0%, ${ORANGE_DEEP} 100%)`,
                        boxShadow: `0 6px 14px ${ORANGE}66, inset 0 1.5px 0 rgba(255,255,255,0.4), inset 0 -2px 0 rgba(0,0,0,0.1)`,
                        transform: "scaleX(-1)",
                      }}
                    >
                      <IconSend />
                    </motion.button>

                    <input
                      value={draft}
                      onChange={(e) => onDraftChange(e.target.value)}
                      placeholder={
                        phase === "answer" ? "اكتب إجابتك…" : "اكتب سؤالك..."
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
                      className="min-h-[38px] min-w-0 flex-1 border-0 bg-transparent px-1 py-2 font-semibold outline-none"
                      style={{
                        fontSize: "16px",
                        color: INK,
                      }}
                      onFocus={(e) => {
                        onComposerFocus(e.currentTarget);
                      }}
                      onBlur={(e) => {
                        onComposerBlur(e.currentTarget);
                      }}
                    />
                  </motion.div>
                  </div>
                ) : (
                  <div className="flex min-w-0 flex-row items-center gap-2" dir="ltr">
                    <InlineChatGuessButton myTurn={myTurn} onGuessClick={onGuessClick} />
                    <div
                      className="flex min-h-[44px] min-w-0 flex-1 items-center justify-center gap-2.5 rounded-[14px] px-3 py-2"
                      style={{
                        background: "rgba(255,249,240,0.96)",
                        boxShadow: `inset 0 0 0 1px ${CREAM_DEEP}88`,
                      }}
                    >
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="block h-1.5 w-1.5 rounded-full"
                        style={{ background: ORANGE_SOFT }}
                        animate={{
                          scale: [1, 1.6, 1],
                          opacity: [0.35, 1, 0.35],
                        }}
                        transition={{
                          duration: 1.1,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: i * 0.22,
                        }}
                      />
                    ))}
                    <span className="text-[11px] font-semibold" style={{ color: INK_SOFT }}>
                      بانتظار دورك…
                    </span>
                  </div>
                  </div>
                )}
              </footer>
            </>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-4 py-8 text-center">
              <motion.span
                className="text-3xl"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                ⏳
              </motion.span>
              <p className="text-[12px] font-semibold" style={{ color: INK_SOFT }}>
                ستظهر الدردشة هنا عند بدء المباراة
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
