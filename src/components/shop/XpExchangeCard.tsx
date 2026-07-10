"use client";

/**
 * XpExchangeCard — Emil Kowalski design principles:
 *
 * Motion decisions:
 *  - Button press: scale(0.97) on :active, 160ms ease-out [Emil: buttons must feel responsive]
 *  - Number change: AnimatePresence key-swap, enter scale(0.88)→1 + opacity 0→1, exit scale(0.95)→0.92 opacity 0
 *    [Emil: never animate from scale(0); 0.88 feels like the number "pops in" naturally]
 *  - Reward flash: brief scale(1.04) bounce on coin display after success — spring, bounce 0.25
 *  - Content blur on button state change [Emil: blur masks imperfect crossfades]
 *  - All easing: cubic-bezier(0.23, 1, 0.32, 1) = strong ease-out [Emil: custom curves, no built-in]
 *  - Exit faster than enter [Emil: asymmetric timing — exit 120ms, enter 220ms]
 *
 * No looping animations. No emojis for currency (uses ShellCoin component). No browser alerts.
 */

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useState } from "react";
import { ShellCoin } from "@/components/shell/ShellCoin";
import {
  exchangeXpForCoins,
  XP_EXCHANGE_BLOCK,
  COINS_PER_BLOCK,
} from "@/lib/firestore/users.client";
import { xpProgressInCurrentLevel } from "@/lib/profile/level";

/* ── Easing curves (Emil: always use custom curves) ── */
const EASE_OUT  = [0.23, 1, 0.32, 1] as const;
const EASE_SPRING = { type: "spring" as const, stiffness: 420, damping: 28 };

/* ── Small animated number display ─────────────────────────── */
function AnimatedNumber({
  value,
  className,
  style,
}: {
  value: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const reduce = useReducedMotion();
  return (
    <span className={className} style={{ ...style, display: "inline-flex", position: "relative" }}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.88, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: -4 }}
          transition={
            reduce
              ? { duration: 0.12 }
              : { ...EASE_SPRING, duration: 0.22 }
          }
          style={{ display: "inline-block" }}
        >
          {value.toLocaleString("en-US")}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/* ── XP ring progress bar ────────────────────────────────────
 * Shows progress towards the next 500-XP exchange block.
 * Thin arc-style bar — pure transform/opacity, no layout shift.
 */
function XpBlockProgress({ xp }: { xp: number }) {
  const blockRemainder = xp % XP_EXCHANGE_BLOCK; // XP within current block
  const pct = Math.min(100, Math.round((blockRemainder / XP_EXCHANGE_BLOCK) * 100));

  return (
    <div style={{ marginTop: 10 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 10,
          fontWeight: 700,
          fontFamily: "var(--display)",
          color: "oklch(0.52 0.06 58)",
          marginBottom: 5,
        }}
      >
        <span>{blockRemainder} / {XP_EXCHANGE_BLOCK} نقطة للاستبدال التالي</span>
        <span style={{ color: "oklch(0.46 0.12 74)" }}>{pct}%</span>
      </div>
      <div
        style={{
          height: 5,
          borderRadius: 999,
          background: "oklch(0.88 0.06 72 / .40)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <motion.div
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.55, ease: EASE_OUT }}
          style={{
            position: "absolute",
            inset: "0 auto 0 0",
            borderRadius: 999,
            background: "linear-gradient(90deg, oklch(0.72 0.18 74), oklch(0.60 0.20 52))",
            boxShadow: "0 0 8px oklch(0.68 0.20 70 / .55)",
          }}
        />
      </div>
    </div>
  );
}

/* ── Main card ───────────────────────────────────────────────  */
type ExchangeState = "idle" | "busy" | "success" | "error";

export function XpExchangeCard({
  uid,
  xp,
  coins,
  google,
}: {
  uid: string | null;
  xp: number;
  coins: number;
  google: boolean;
}) {
  const reduce = useReducedMotion();
  const [state, setState] = useState<ExchangeState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [flashCoins, setFlashCoins] = useState(false);

  /* Derived exchange values */
  const exchangeableBlocks = Math.floor(xp / XP_EXCHANGE_BLOCK);
  const xpToConsume = exchangeableBlocks * XP_EXCHANGE_BLOCK;
  const coinsToEarn = exchangeableBlocks * COINS_PER_BLOCK;
  const canExchange = google && !!uid && exchangeableBlocks >= 1 && state === "idle";

  const doExchange = useCallback(async () => {
    if (!uid || !canExchange) return;
    setState("busy");
    setErrorMsg(null);
    try {
      await exchangeXpForCoins(uid, xpToConsume);
      setState("success");
      /* Trigger coin flash */
      setFlashCoins(true);
      window.setTimeout(() => setFlashCoins(false), 600);
      window.setTimeout(() => setState("idle"), 2800);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "تعذر الاستبدال");
      setState("error");
      window.setTimeout(() => setState("idle"), 3000);
    }
  }, [uid, canExchange, xpToConsume]);

  /* Button label + blur (Emil: blur masks imperfect crossfades between states) */
  const btnContent: Record<ExchangeState, string> = {
    idle: coinsToEarn > 0 ? `استبدل ${xpToConsume} نقطة` : "لا يوجد ما يكفي",
    busy: "جارٍ الاستبدال…",
    success: `تم! +${coinsToEarn} عملة`,
    error: "تعذّر الاستبدال",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: EASE_OUT }}
      className="game-card-outer"
      style={{
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        className="game-card-inner p-5 border border-black/5 flex flex-col gap-4 text-right"
        style={{
          background: "#FFFFFF",
        }}
      >
        {/* Header row: title + current XP */}
        <div className="flex items-start justify-between gap-4 w-full">
          <div className="flex flex-col gap-1 text-right">
            <h4 className="h-display text-sm font-black text-slate-800 leading-tight">
              استبدال نقاط الخبرة
            </h4>
            <p className="text-[10px] text-slate-400 font-bold">
              كل {XP_EXCHANGE_BLOCK} نقطة = {COINS_PER_BLOCK} عملات ذهبية
            </p>
          </div>

          {/* Current XP chip */}
          <div className="bg-purple-50 border border-purple-100 px-3 py-1 rounded-full text-xs font-black text-[#7C3AED] flex-shrink-0">
            <AnimatedNumber value={xp} /> XP
          </div>
        </div>

        {/* Conversion preview row */}
        {exchangeableBlocks >= 1 ? (
          <motion.div
            key="conversion-preview"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.26, ease: EASE_OUT, delay: 0.06 }}
            className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100"
          >
            {/* XP going out */}
            <div className="flex-1 text-right">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
                تستهلك
              </span>
              <span className="text-sm font-black text-slate-700 block mt-0.5">
                <AnimatedNumber value={xpToConsume} /> XP
              </span>
            </div>

            {/* RTL Arrow */}
            <div className="text-slate-300 font-black text-sm select-none" style={{ transform: "scaleX(-1)" }}>
              →
            </div>

            {/* Coins coming in */}
            <div className="flex-1 text-left">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
                تكسب
              </span>
              <motion.div
                animate={flashCoins && !reduce ? { scale: [1, 1.14, 1] } : { scale: 1 }}
                transition={flashCoins ? { type: "spring", stiffness: 500, damping: 18, bounce: 0.25 } : {}}
                className="inline-block mt-0.5"
              >
                <ShellCoin value={coinsToEarn} compact />
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-center text-xs font-bold text-slate-400">
            تحتاج {XP_EXCHANGE_BLOCK - (xp % XP_EXCHANGE_BLOCK)} نقطة إضافية للاستبدال
          </div>
        )}

        {/* XP block progress bar */}
        <XpBlockProgress xp={xp} />

        {/* Error message */}
        <AnimatePresence>
          {state === "error" && errorMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.20, ease: EASE_OUT }}
              className="p-2 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold text-center"
            >
              {errorMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Exchange button */}
        {!google ? (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 text-xs font-bold text-center">
            سجّل الدخول بـ Google للاستبدال
          </div>
        ) : (
          <motion.button
            type="button"
            disabled={!canExchange}
            onClick={() => void doExchange()}
            whileTap={reduce ? {} : { scale: 0.97 }}
            transition={{ duration: 0.12, ease: EASE_OUT }}
            className={`w-full py-3.5 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 border select-none ${
              state === "success"
                ? "bg-emerald-500 border-emerald-600 text-white shadow-sm"
                : state === "error"
                  ? "bg-rose-500 border-rose-600 text-white shadow-sm"
                  : canExchange
                    ? "bg-[#7C3AED] hover:bg-[#6D28D9] border-purple-800 text-white shadow-md active:scale-95"
                    : "bg-slate-50 border-slate-200 text-slate-400"
            }`}
            style={{ cursor: canExchange ? "pointer" : "default" }}
          >
            <motion.span
              animate={{
                filter: state === "busy" && !reduce ? "blur(2px)" : "blur(0px)",
                opacity: state === "busy" ? 0.6 : 1,
              }}
              transition={{ duration: 0.18, ease: EASE_OUT }}
              className="inline-block"
            >
              {btnContent[state]}
            </motion.span>
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
