"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import type { PlayerCosmetic } from "@/lib/profile/cosmetics";
import { normalizeCosmetic } from "@/lib/profile/cosmetics";

/** Keep in sync with RoomExperience matchup timer. */
export const MATCHUP_VS_INTRO_DURATION_MS = 3000;

type Props = {
  open: boolean;
  /** Shown on the physical left (slides in from the left). */
  leftName: string;
  leftCosmetic?: PlayerCosmetic | null;
  leftPhotoURL?: string | null;
  /** Shown on the physical right (slides in from the right). */
  rightName: string;
  rightCosmetic?: PlayerCosmetic | null;
  rightPhotoURL?: string | null;
};

/**
 * Social matchup curtain: dim backdrop, dual avatars + VS, soft pulse — no heavy blur / 3D.
 */
export function MatchupVsTransitionOverlay({
  open,
  leftName,
  leftCosmetic,
  leftPhotoURL,
  rightName,
  rightCosmetic,
  rightPhotoURL,
}: Props) {
  const reduce = useReducedMotion();
  const lc = leftCosmetic ?? normalizeCosmetic(undefined);
  const rc = rightCosmetic ?? normalizeCosmetic(undefined);

  const tSlide = reduce ? 0.38 : 0.72;
  const tDelay = reduce ? 0.06 : 0.12;
  const vsIn = reduce ? 0.22 : 0.38;
  const vsDelay = reduce ? 0.28 : 0.52;
  const pulseDur = reduce ? 0.35 : 0.55;
  const pulseDelay = reduce ? 0.5 : 0.78;

  const floaters = useMemo(
    () =>
      [
        { top: "12%", left: "8%", s: 11, d: 0 },
        { top: "22%", right: "10%", s: 9, d: 0.08 },
        { bottom: "20%", left: "14%", s: 10, d: 0.15 },
      ] as const,
    [],
  );

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="matchup-vs"
          role="presentation"
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0.2 : 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-auto absolute inset-0 z-[62] flex flex-col items-center justify-center overflow-hidden px-3"
          style={{
            background:
              "linear-gradient(180deg, rgba(42,22,10,0.78) 0%, rgba(28,14,6,0.88) 48%, rgba(18,9,4,0.92) 100%)",
            boxShadow: "inset 0 0 min(100vw, 640px) rgba(0,0,0,0.25)",
          }}
        >
          {floaters.map((f, i) => (
            <motion.span
              key={i}
              aria-hidden
              className="pointer-events-none absolute font-black text-[#fff7e8]/20"
              style={{
                top: "top" in f ? f.top : undefined,
                bottom: "bottom" in f ? f.bottom : undefined,
                left: "left" in f ? f.left : undefined,
                right: "right" in f ? f.right : undefined,
                fontSize: f.s,
              }}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: [0, 0.5, 0.2], y: [6, -3, -6] }}
              transition={{
                duration: reduce ? 0.7 : 1.4,
                delay: f.d,
                ease: [0.33, 1, 0.68, 1],
              }}
            >
              ؟
            </motion.span>
          ))}

          {!reduce ? (
            <motion.div
              aria-hidden
              className="pointer-events-none absolute top-[28%] left-[-20%] h-[1.5px] w-[140%] max-w-none rotate-[12deg] opacity-40"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(255,220,160,0.7), transparent)",
              }}
              initial={{ x: "-20%" }}
              animate={{ x: "35%" }}
              transition={{ duration: 1.1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            />
          ) : null}

          {/* Physical L→R so slide directions stay intuitive on RTL pages */}
          <div
            dir="ltr"
            className="relative z-10 flex w-full max-w-[min(22rem,92vw)] flex-row items-center justify-center gap-1 sm:gap-2"
          >
            <motion.div
              className="flex min-w-0 flex-1 flex-col items-center gap-2"
              initial={{ x: reduce ? -24 : "-36vw", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{
                duration: tSlide,
                delay: tDelay,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <div
                className="rounded-full p-1"
                style={{
                  boxShadow:
                    "0 0 0 2px rgba(255,200,120,0.45), 0 12px 32px rgba(120,50,10,0.35), inset 0 1px 0 rgba(255,255,255,0.5)",
                }}
              >
                <ProfileAvatar
                  cosmetic={lc}
                  fallbackPhotoURL={leftPhotoURL}
                  displayName={leftName}
                  size="xl"
                  active
                  idle={false}
                />
              </div>
              <span className="max-w-[7.5rem] truncate text-center text-xs font-extrabold text-[#ffe8c8] sm:text-sm">
                {leftName}
              </span>
            </motion.div>

            <div className="relative flex shrink-0 flex-col items-center justify-center px-0.5 sm:px-1">
              <motion.span
                className="relative font-black tabular-nums tracking-tight text-transparent"
                style={{
                  fontSize: "clamp(2.5rem, 11vw, 3.75rem)",
                  background: "linear-gradient(185deg,#fff8e8 0%,#ffd27a 42%,#f59e0b 72%,#c2410c 100%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  textShadow: "0 2px 18px rgba(251,191,36,0.35)",
                }}
                initial={{ scale: reduce ? 0.88 : 0.72, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: vsIn, delay: vsDelay, ease: [0.34, 1.2, 0.64, 1] }}
              >
                VS
              </motion.span>
              {!reduce ? (
                <motion.div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 -z-10 rounded-full"
                  style={{
                    background: "radial-gradient(closest-side, rgba(255,180,60,0.55) 0%, transparent 75%)",
                  }}
                  initial={{ scale: 0.6, opacity: 0.4 }}
                  animate={{
                    scale: [0.75, 1.15, 1],
                    opacity: [0.35, 0.85, 0.45],
                  }}
                  transition={{
                    duration: pulseDur,
                    delay: pulseDelay,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                />
              ) : null}
            </div>

            <motion.div
              className="flex min-w-0 flex-1 flex-col items-center gap-2"
              initial={{ x: reduce ? 24 : "36vw", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{
                duration: tSlide,
                delay: tDelay,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <div
                className="rounded-full p-1"
                style={{
                  boxShadow:
                    "0 0 0 2px rgba(255,200,120,0.45), 0 12px 32px rgba(120,50,10,0.35), inset 0 1px 0 rgba(255,255,255,0.5)",
                }}
              >
                <ProfileAvatar
                  cosmetic={rc}
                  fallbackPhotoURL={rightPhotoURL}
                  displayName={rightName}
                  size="xl"
                  active
                  idle={false}
                />
              </div>
              <span className="max-w-[7.5rem] truncate text-center text-xs font-extrabold text-[#ffe8c8] sm:text-sm">
                {rightName}
              </span>
            </motion.div>
          </div>

          <motion.p
            className="relative z-10 mt-8 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-[#d4a574]/90"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduce ? 0.35 : 0.55, duration: 0.4 }}
          >
            مين أنا؟
          </motion.p>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
