"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { TacticalToolIcon } from "@/components/game/play/TacticalToolIcons";
import { GP } from "@/components/game/play/tokens";
import type { TacticalGameplayEvent } from "@/types";

export function TacticalEventBanner({ event }: { event: TacticalGameplayEvent | null | undefined }) {
  const [visible, setVisible] = useState<TacticalGameplayEvent | null>(null);
  const lastId = useRef<string | null>(null);

  useEffect(() => {
    if (!event?.id || event.id === lastId.current) return;
    lastId.current = event.id;
    setVisible(event);
    const t = window.setTimeout(() => setVisible(null), 4200);
    return () => window.clearTimeout(t);
  }, [event]);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key={visible.id}
          role="status"
          initial={{ opacity: 0, y: -16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          className="pointer-events-none absolute inset-x-3 top-2 z-50 mx-auto max-w-md"
        >
          <motion.div
            className="overflow-hidden rounded-2xl px-4 py-3"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,252,246,0.98) 0%, rgba(255,236,210,0.96) 100%)",
              boxShadow:
                "0 16px 40px rgba(140,80,30,0.22), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 0 0 1px rgba(244,196,141,0.55)",
            }}
          >
            <motion.div
              className="pointer-events-none absolute inset-0 opacity-40"
              animate={{ opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              style={{
                background:
                  "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255,159,10,0.35), transparent 70%)",
              }}
            />
            <motion.div
              className="relative flex flex-row items-center gap-3"
              dir="rtl"
              initial={{ filter: "blur(4px)" }}
              animate={{ filter: "blur(0px)" }}
              transition={{ duration: 0.35 }}
            >
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{
                  color: visible.blocked ? GP.green : GP.orangeDeep,
                  background: visible.blocked
                    ? "linear-gradient(180deg, #E8F6F0, #D4EDE4)"
                    : "linear-gradient(180deg, #FFE8C8, #FFD4A0)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)",
                }}
              >
                <TacticalToolIcon id={visible.toolId} size={24} />
              </div>
              <motion.div className="min-w-0 flex-1 text-right">
                <p className="text-sm font-black" style={{ color: GP.ink }}>
                  {visible.titleAr}
                </p>
                <p className="mt-0.5 text-xs font-semibold leading-snug" style={{ color: GP.inkSoft }}>
                  {visible.bodyAr}
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
