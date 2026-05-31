"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import type { MouseEvent } from "react";

type Props = {
  open: boolean;
  /** Busy while the API call to surrender is in-flight */
  busy?: boolean;
  onStay: () => void;
  onLeave: () => void;
};

const SPRING = { type: "spring", stiffness: 400, damping: 28 } as const;
const EASE_OUT = [0.22, 1, 0.36, 1] as const;

export function MatchLeaveConfirm({ open, busy = false, onStay, onLeave }: Props) {
  return (
    <AnimatePresence>
      {open && (
        /* Backdrop */
        <motion.div
          key="leave-confirm-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: EASE_OUT }}
          className="absolute inset-0 z-[90] flex items-center justify-center px-5"
          style={{
            background: "oklch(0.18 0.04 40 / 0.60)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
          }}
          onClick={onStay}
        >
          {/* Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={SPRING}
            style={{ width: "min(100%, 360px)" }}
            onClick={(e: MouseEvent) => e.stopPropagation()}
          >
            <div
              dir="rtl"
              style={{
                borderRadius: 24,
                background: "linear-gradient(180deg, oklch(0.99 0.01 80) 0%, oklch(0.97 0.025 75) 100%)",
                boxShadow: [
                  "0 2px 0 oklch(0.82 0.06 68 / .55)",
                  "0 12px 40px -8px oklch(0.30 0.08 40 / .35)",
                  "0 32px 72px -16px oklch(0.22 0.06 40 / .22)",
                  "inset 0 1.5px 0 rgba(255,255,255,0.9)",
                ].join(", "),
                border: "1px solid oklch(0.84 0.06 68 / .45)",
                overflow: "hidden",
              }}
            >
              {/* Top accent stripe */}
              <div
                style={{
                  height: 3,
                  background: "linear-gradient(90deg, oklch(0.70 0.16 28), oklch(0.60 0.18 22), oklch(0.70 0.16 28))",
                }}
              />

              <div style={{ padding: "28px 24px 24px" }}>
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ ...SPRING, delay: 0.06 }}
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: "50%",
                    background: "linear-gradient(160deg, oklch(0.96 0.04 30), oklch(0.90 0.08 28))",
                    border: "1.5px solid oklch(0.78 0.10 28 / .45)",
                    boxShadow: "0 6px 18px -4px oklch(0.60 0.16 25 / .28)",
                    display: "grid",
                    placeItems: "center",
                    margin: "0 auto 20px",
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
                    <path
                      d="M11 3v10M11 17v1.5"
                      stroke="oklch(0.52 0.18 26)"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                    <circle
                      cx="11"
                      cy="11"
                      r="9.25"
                      stroke="oklch(0.62 0.16 28 / .55)"
                      strokeWidth="1.5"
                    />
                  </svg>
                </motion.div>

                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: EASE_OUT, delay: 0.10 }}
                  style={{
                    fontWeight: 800,
                    fontSize: 20,
                    lineHeight: 1.2,
                    textAlign: "center",
                    color: "oklch(0.25 0.06 35)",
                    marginBottom: 12,
                    letterSpacing: "-0.01em",
                  }}
                >
                  مغادرة المباراة
                </motion.h2>

                {/* Body */}
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: EASE_OUT, delay: 0.16 }}
                  style={{
                    fontSize: 13.5,
                    lineHeight: 1.7,
                    textAlign: "center",
                    color: "oklch(0.44 0.06 40)",
                    marginBottom: 24,
                    maxWidth: 280,
                    margin: "0 auto 24px",
                  }}
                >
                  إذا غادرت الآن سيتم اعتبارك منسحباً من المباراة،
                  <br />
                  وسيتم احتساب الفوز للخصم.
                </motion.p>

                {/* Divider */}
                <div
                  style={{
                    height: 1,
                    background: "oklch(0.84 0.04 68 / .5)",
                    marginBottom: 20,
                  }}
                />

                {/* Actions */}
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, ease: EASE_OUT, delay: 0.22 }}
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  {/* البقاء — primary */}
                  <Button
                    type="button"
                    variant="primary"
                    className="w-full min-h-[50px] text-base"
                    onClick={onStay}
                    disabled={busy}
                  >
                    البقاء
                  </Button>

                  {/* الانسحاب — ghost with danger tint */}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={onLeave}
                    style={{
                      width: "100%",
                      minHeight: 48,
                      borderRadius: 16,
                      border: "1.5px solid oklch(0.72 0.14 28 / .40)",
                      background: busy
                        ? "oklch(0.95 0.02 40)"
                        : "linear-gradient(180deg, oklch(0.99 0.01 80), oklch(0.96 0.02 75))",
                      color: busy ? "oklch(0.60 0.04 40)" : "oklch(0.50 0.16 28)",
                      fontWeight: 700,
                      fontSize: 15,
                      cursor: busy ? "not-allowed" : "pointer",
                      transition: "opacity 0.18s, background 0.18s",
                      opacity: busy ? 0.6 : 1,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {busy ? "جاري الانسحاب…" : "الانسحاب"}
                  </button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
