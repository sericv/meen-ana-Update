"use client";

import { AnimatePresence, motion } from "framer-motion";

type ToastState = { msg: string; ok: boolean } | null;

interface PurchaseToastProps {
  toast: ToastState;
}

/**
 * PurchaseToast — lightweight bottom-center fixed toast.
 *
 * Design:
 *  - Fixed position: bottom safe-area + 20px, horizontally centered
 *  - Warm premium styling — success = gold-green, error = warm red
 *  - Spring entrance from below, fade exit
 *  - No backdrop filter, no blur — GPU-safe
 *  - pointer-events:none so it never blocks taps beneath
 */
export function PurchaseToast({ toast }: PurchaseToastProps) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.msg + (toast.ok ? "ok" : "err")}
          initial={{ opacity: 0, y: 24, scale: 0.90 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.94 }}
          transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.85 }}
          aria-live="polite"
          style={{
            position: "fixed",
            bottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9999,
            pointerEvents: "none",
            /* sizing */
            maxWidth: "calc(100vw - 40px)",
            width: "fit-content",
            minWidth: 180,
            /* appearance */
            padding: "11px 20px",
            borderRadius: 40,
            background: toast.ok
              ? "linear-gradient(135deg, oklch(0.26 0.08 44 / .92) 0%, oklch(0.22 0.06 40 / .95) 100%)"
              : "linear-gradient(135deg, oklch(0.28 0.10 22 / .92) 0%, oklch(0.24 0.08 18 / .95) 100%)",
            border: `1.5px solid ${
              toast.ok
                ? "oklch(0.58 0.14 60 / .50)"
                : "oklch(0.54 0.18 22 / .50)"
            }`,
            boxShadow: toast.ok
              ? "0 8px 28px oklch(0.20 0.08 44 / .38), 0 2px 8px oklch(0.22 0.06 44 / .22)"
              : "0 8px 28px oklch(0.22 0.10 22 / .38), 0 2px 8px oklch(0.24 0.08 22 / .22)",
            /* text */
            fontFamily: "var(--display)",
            fontWeight: 700,
            fontSize: 13.5,
            letterSpacing: "-0.01em",
            color: toast.ok ? "oklch(0.88 0.10 72)" : "oklch(0.88 0.08 28)",
            textAlign: "center",
            whiteSpace: "nowrap",
            /* leader dot */
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {/* status dot */}
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              flexShrink: 0,
              background: toast.ok
                ? "oklch(0.72 0.16 80)"
                : "oklch(0.68 0.20 22)",
              boxShadow: toast.ok
                ? "0 0 6px oklch(0.72 0.16 80 / .8)"
                : "0 0 6px oklch(0.68 0.20 22 / .8)",
            }}
          />
          {toast.msg}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
