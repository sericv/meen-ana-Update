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
      style={{
        borderRadius: 20,
        overflow: "hidden",
        position: "relative",
        background:
          "linear-gradient(160deg, oklch(0.995 0.008 82) 0%, oklch(0.970 0.022 74) 60%, oklch(0.950 0.030 68) 100%)",
        border: "1.5px solid oklch(0.84 0.08 72 / .55)",
        boxShadow:
          "0 4px 24px oklch(0.70 0.14 68 / .14), inset 0 1px 0 rgba(255,255,255,0.95)",
      }}
    >
      {/* Top accent bar — XP purple-gold gradient */}
      <div
        style={{
          height: 2.5,
          background:
            "linear-gradient(90deg, transparent, oklch(0.68 0.20 72), oklch(0.60 0.22 52), transparent)",
        }}
      />

      {/* Ambient glow — GPU opacity only */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: -20,
          right: -20,
          width: 120,
          height: 120,
          borderRadius: "50%",
          background:
            "radial-gradient(closest-side, oklch(0.78 0.18 72 / .22) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ padding: "14px 16px 16px" }}>
        {/* ── Header row: title + current XP ── */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 8,
            marginBottom: 10,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "var(--display)",
                fontWeight: 800,
                fontSize: 14.5,
                color: "oklch(0.26 0.06 48)",
                letterSpacing: "-0.01em",
                lineHeight: 1.2,
              }}
            >
              استبدال نقاط الخبرة
            </div>
            <div
              style={{
                fontSize: 10.5,
                color: "oklch(0.52 0.05 58)",
                marginTop: 2,
                fontFamily: "var(--display)",
              }}
            >
              كل {XP_EXCHANGE_BLOCK} نقطة = {COINS_PER_BLOCK} عملات
            </div>
          </div>

          {/* Current XP chip */}
          <div
            style={{
              background:
                "linear-gradient(145deg, oklch(0.88 0.16 74 / .40), oklch(0.80 0.20 60 / .30))",
              border: "1px solid oklch(0.78 0.14 70 / .45)",
              borderRadius: 12,
              padding: "4px 10px",
              fontFamily: "var(--display)",
              fontWeight: 800,
              fontSize: 11,
              color: "oklch(0.36 0.12 52)",
              whiteSpace: "nowrap",
              boxShadow: "0 2px 8px oklch(0.68 0.16 68 / .18)",
              flexShrink: 0,
            }}
          >
            <AnimatedNumber value={xp} /> نقطة
          </div>
        </div>

        {/* ── Conversion preview row ── */}
        {exchangeableBlocks >= 1 ? (
          <motion.div
            key="conversion-preview"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.26, ease: EASE_OUT, delay: 0.06 }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px",
              borderRadius: 12,
              background:
                "linear-gradient(135deg, oklch(0.96 0.04 78 / .70), oklch(0.92 0.06 72 / .60))",
              border: "1px solid oklch(0.86 0.06 72 / .50)",
              marginBottom: 10,
            }}
          >
            {/* XP going out */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 9.5,
                  fontWeight: 700,
                  color: "oklch(0.55 0.06 58)",
                  fontFamily: "var(--display)",
                  marginBottom: 1,
                }}
              >
                تستهلك
              </div>
              <div
                style={{
                  fontFamily: "var(--display)",
                  fontWeight: 800,
                  fontSize: 15,
                  color: "oklch(0.44 0.10 52)",
                  letterSpacing: "-0.02em",
                }}
              >
                <AnimatedNumber value={xpToConsume} /> نقطة
              </div>
            </div>

            {/* Arrow */}
            <div
              style={{
                color: "oklch(0.65 0.12 68)",
                fontSize: 14,
                fontWeight: 900,
                flexShrink: 0,
                transform: "scaleX(-1)", /* RTL arrow → */
              }}
            >
              →
            </div>

            {/* Coins coming in — uses official ShellCoin */}
            <div style={{ flex: 1, minWidth: 0, textAlign: "right" }}>
              <div
                style={{
                  fontSize: 9.5,
                  fontWeight: 700,
                  color: "oklch(0.55 0.06 58)",
                  fontFamily: "var(--display)",
                  marginBottom: 1,
                }}
              >
                تكسب
              </div>
              <motion.div
                animate={
                  flashCoins && !reduce
                    ? { scale: [1, 1.14, 1] }
                    : { scale: 1 }
                }
                transition={
                  flashCoins
                    ? { type: "spring", stiffness: 500, damping: 18, bounce: 0.25 }
                    : {}
                }
                style={{ display: "inline-block" }}
              >
                <ShellCoin value={coinsToEarn} compact />
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <div
            style={{
              padding: "8px 12px",
              borderRadius: 12,
              background: "oklch(0.94 0.02 70 / .60)",
              border: "1px solid oklch(0.86 0.03 70 / .40)",
              fontSize: 11.5,
              fontWeight: 600,
              color: "oklch(0.58 0.04 58)",
              fontFamily: "var(--display)",
              textAlign: "center",
              marginBottom: 10,
            }}
          >
            تحتاج {XP_EXCHANGE_BLOCK - (xp % XP_EXCHANGE_BLOCK)} نقطة إضافية للاستبدال
          </div>
        )}

        {/* ── XP block progress bar ── */}
        <XpBlockProgress xp={xp} />

        {/* ── Error message ── */}
        <AnimatePresence>
          {state === "error" && errorMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.20, ease: EASE_OUT }}
              style={{
                overflow: "hidden",
                marginTop: 8,
                padding: "6px 10px",
                borderRadius: 10,
                background: "oklch(0.96 0.05 28 / .70)",
                border: "1px solid oklch(0.80 0.12 28 / .40)",
                fontSize: 11,
                fontWeight: 700,
                color: "oklch(0.40 0.16 28)",
                fontFamily: "var(--display)",
                textAlign: "center",
              }}
            >
              {errorMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Exchange button ── */}
        {!google ? (
          <div
            style={{
              marginTop: 12,
              padding: "9px 14px",
              borderRadius: 12,
              background: "oklch(0.92 0.03 70 / .60)",
              fontSize: 11.5,
              fontWeight: 600,
              color: "oklch(0.56 0.04 58)",
              fontFamily: "var(--display)",
              textAlign: "center",
            }}
          >
            سجّل الدخول بـ Google للاستبدال
          </div>
        ) : (
          <motion.button
            type="button"
            disabled={!canExchange}
            onClick={() => void doExchange()}
            /* Emil: scale(0.97) on press — instant, tells the UI it heard you */
            whileTap={reduce ? {} : { scale: 0.97 }}
            transition={{ duration: 0.12, ease: EASE_OUT }}
            style={{
              marginTop: 12,
              width: "100%",
              padding: "11px 16px",
              borderRadius: 13,
              border: "none",
              cursor: canExchange ? "pointer" : "default",
              fontFamily: "var(--display)",
              fontWeight: 800,
              fontSize: 13.5,
              letterSpacing: "-0.01em",
              background:
                state === "success"
                  ? "linear-gradient(135deg, oklch(0.65 0.18 148), oklch(0.58 0.20 148))"
                  : state === "error"
                    ? "linear-gradient(135deg, oklch(0.60 0.18 28), oklch(0.52 0.20 28))"
                    : canExchange
                      ? "linear-gradient(135deg, oklch(0.68 0.20 68), oklch(0.58 0.22 52))"
                      : "oklch(0.88 0.04 70)",
              color:
                canExchange || state === "success" || state === "error"
                  ? "oklch(0.97 0.02 82)"
                  : "oklch(0.58 0.04 58)",
              boxShadow:
                canExchange && state === "idle"
                  ? "0 4px 16px oklch(0.62 0.20 64 / .38), inset 0 1px 0 rgba(255,255,255,0.22)"
                  : "none",
              /* Transition only transform + background (Emil: specify exact props, never 'all') */
              transition:
                "background 0.22s cubic-bezier(0.23,1,0.32,1), box-shadow 0.22s cubic-bezier(0.23,1,0.32,1), opacity 0.18s",
              opacity: state === "busy" ? 0.75 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            {/* Emil: blur on content while state changes — masks the crossfade */}
            <motion.span
              animate={{
                filter: state === "busy" && !reduce ? "blur(2px)" : "blur(0px)",
                opacity: state === "busy" ? 0.6 : 1,
              }}
              transition={{ duration: 0.18, ease: EASE_OUT }}
              style={{ display: "inline-block" }}
            >
              {btnContent[state]}
            </motion.span>
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
