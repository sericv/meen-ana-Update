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
      sizes="132px"
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
      layout
      className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
      animate={active ? { scale: 1 } : { scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
    >
      <motion.div
        className="relative flex flex-col items-center"
        animate={active ? { y: [0, -2, 0] } : { y: 0 }}
        transition={
          active
            ? { duration: 2.8, repeat: Infinity, ease: "easeInOut" }
            : { duration: 0.2 }
        }
      >
        <AvatarTurnRing
          density="compact"
          showTimer={showTimer}
          emphasize={active}
          secLeft={secLeft}
          maxSec={maxPhaseSec}
        >
          <motion.div
            className="rounded-full p-0.5"
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
      layout
      className="relative mx-0 shrink-0"
      style={{ width: 132, marginInline: -4 }}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-3.5 rounded-[28px]"
        style={{
          background: `radial-gradient(ellipse, ${ORANGE}33 0%, transparent 70%)`,
          filter: "blur(8px)",
        }}
        animate={{ opacity: [0.65, 1, 0.65] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        layout
        className="gameplay-secret-card relative flex flex-col items-center justify-between overflow-hidden rounded-[22px] px-2.5 pb-2.5 pt-3.5"
        style={{ width: 132, height: 168 }}
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
          className="relative flex w-full flex-1 items-center justify-center"
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
              className="relative h-[88px] w-[88px] overflow-hidden rounded-2xl"
              style={{
                boxShadow: `inset 0 -4px 8px rgba(0,0,0,0.12), 0 6px 14px ${ORANGE}33`,
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
                className="absolute top-2 h-[70px] w-[70px] rounded-full"
                style={{
                  background: `linear-gradient(160deg, ${ORANGE_DEEP} 0%, #8E3F12 100%)`,
                  boxShadow: `inset 0 -6px 10px rgba(0,0,0,0.25), inset 0 4px 6px ${ORANGE}88`,
                }}
              />
              <span
                className="relative z-[2] mt-3 text-[64px] font-black leading-none"
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
          className="relative z-[1] max-w-full truncate px-1 text-center text-[11px] font-extrabold leading-tight"
          style={{ color: INK }}
        >
          {opponentCard?.nameAr ?? "بطاقة الخصم"}
        </p>

        {catName ? (
          <div
            className="relative z-[1] flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-extrabold text-white"
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

function FloatingGuessButton({
  myTurn,
  onGuessClick,
}: {
  myTurn: boolean;
  onGuessClick: () => void;
}) {
  return (
    <div className="pointer-events-none absolute end-2.5 top-[52%] z-[5] -translate-y-1/2">
      <div className="pointer-events-auto relative">
        <div
          aria-hidden
          className="absolute -inset-2 rounded-[22px]"
          style={{
            background: `radial-gradient(circle, ${GOLD}66 0%, transparent 70%)`,
            filter: "blur(6px)",
          }}
        />
        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          whileHover={myTurn ? { scale: 1.05 } : undefined}
          onClick={onGuessClick}
          aria-label="تخمين"
          className="relative flex h-[50px] w-[50px] items-center justify-center rounded-2xl border-0"
          style={{
            background: myTurn
              ? `linear-gradient(180deg, ${GOLD} 0%, #D8941F 100%)`
              : `linear-gradient(180deg, ${CREAM} 0%, ${CREAM_DEEP} 100%)`,
            boxShadow: myTurn
              ? `0 8px 16px ${GOLD}66, inset 0 1.5px 0 rgba(255,255,255,0.5), inset 0 -3px 0 rgba(0,0,0,0.15)`
              : "0 4px 12px rgba(58,37,23,0.10), inset 0 0 0 1px rgba(255,255,255,0.9)",
            opacity: myTurn ? 1 : 0.88,
          }}
        >
          <IconBulb color={myTurn ? "#fff" : INK_SOFT} />
        </motion.button>
        <span
          className="absolute -bottom-1.5 -end-1.5 rounded-[10px] border-[1.5px] bg-white px-1.5 py-0.5 text-[10px] font-black"
          style={{
            color: INK,
            borderColor: GOLD,
            boxShadow: "0 3px 8px rgba(0,0,0,0.18)",
          }}
        >
          تخمين
        </span>
      </div>
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
      <section className="relative shrink-0 px-4 pt-3">
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
          <div className="relative flex items-center justify-center gap-2">
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
            <FloatingGuessButton myTurn={myTurn} onGuessClick={onGuessClick} />
          </div>
        ) : (
          <motion.div layout className="flex justify-center py-1">
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
                  <motion.div
                    layout
                    className="gameplay-input-shell flex items-center gap-1.5 rounded-[22px] p-1.5"
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
                ) : (
                  <div
                    className="flex min-h-[44px] items-center justify-center gap-2.5 rounded-[14px] px-3 py-2"
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
