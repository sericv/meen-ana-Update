"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import type { PlayerCosmetic } from "@/lib/profile/cosmetics";
import { normalizeCosmetic } from "@/lib/profile/cosmetics";
import { levelFromXp } from "@/lib/profile/level";

/** Keep in sync with RoomExperience matchup timer. */
export const MATCHUP_VS_INTRO_DURATION_MS = 3000;

type Props = {
  open: boolean;
  /** Shown on the physical left (slides in from the left). */
  leftName: string;
  leftCosmetic?: PlayerCosmetic | null;
  leftPhotoURL?: string | null;
  leftXp?: number;
  leftMatchWins?: number;
  /** Shown on the physical right (slides in from the right). */
  rightName: string;
  rightCosmetic?: PlayerCosmetic | null;
  rightPhotoURL?: string | null;
  rightXp?: number;
  rightMatchWins?: number;
};

/** Small level + wins badge for the VS intro */
function VsPlayerBadge({
  xp,
  matchWins,
  reduce,
}: {
  xp: number | undefined;
  matchWins: number | undefined;
  reduce: boolean | null;
}) {
  if (xp === undefined && matchWins === undefined) return null;
  const level = xp !== undefined ? levelFromXp(xp) : null;
  const wins = matchWins ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.88 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 28,
        delay: reduce ? 0.38 : 0.72,
      }}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
        marginTop: 6,
      }}
    >
      {level !== null && (
        <span
          style={{
            background: "linear-gradient(180deg, #FFE8A8 0%, #F2C14E 100%)",
            color: "#5e3011",
            fontSize: 9.5,
            fontWeight: 800,
            padding: "2px 8px",
            borderRadius: 20,
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.55), 0 2px 6px rgba(200,130,20,0.30)",
            letterSpacing: "0.02em",
            lineHeight: 1.7,
            whiteSpace: "nowrap",
          }}
        >
          ⭐ {level}
        </span>
      )}
      <span
        style={{
          background: "oklch(0.20 0.02 40 / .55)",
          color: "oklch(0.95 0.04 78)",
          fontSize: 9.5,
          fontWeight: 700,
          padding: "2px 8px",
          borderRadius: 20,
          letterSpacing: "0.02em",
          lineHeight: 1.7,
          whiteSpace: "nowrap",
        }}
      >
        {wins} فوز
      </span>
    </motion.div>
  );
}

/**
 * Cinematic VS matchup curtain.
 * Stages (all compositor-layer, no blur):
 *   0ms  → dark backdrop fades in
 *   50ms → ambient glow burst (radial, opacity keyframe)
 *   120ms→ left player slides in from far left
 *   220ms→ right player slides in from far right
 *   540ms→ VS text pops with spring overshoot + glow pulse
 *   640ms→ level/wins badges fade up below avatars
 *   800ms→ slash divider line sweeps across
 */
export function MatchupVsTransitionOverlay({
  open,
  leftName,
  leftCosmetic,
  leftPhotoURL,
  leftXp,
  leftMatchWins,
  rightName,
  rightCosmetic,
  rightPhotoURL,
  rightXp,
  rightMatchWins,
}: Props) {
  const reduce = useReducedMotion();
  const lc = leftCosmetic ?? normalizeCosmetic(undefined);
  const rc = rightCosmetic ?? normalizeCosmetic(undefined);

  /* Timing constants — halved for reduced motion */
  const r = reduce ? 0.5 : 1;

  /* Ambient particles — static CSS floaters */
  const particles = useMemo(
    () => [
      { top: "9%",  left: "6%",   s: 10, d: 0.0,  o: 0.18 },
      { top: "16%", right: "8%",  s: 8,  d: 0.06, o: 0.14 },
      { top: "72%", left: "11%",  s: 9,  d: 0.12, o: 0.16 },
      { top: "78%", right: "13%", s: 7,  d: 0.18, o: 0.12 },
      { top: "44%", left: "3%",   s: 6,  d: 0.22, o: 0.10 },
      { top: "38%", right: "4%",  s: 6,  d: 0.28, o: 0.10 },
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
          exit={{ opacity: 0, transition: { duration: reduce ? 0.18 : 0.28 } }}
          transition={{ duration: reduce ? 0.18 : 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-auto absolute inset-0 z-[62] flex flex-col items-center justify-center overflow-hidden"
          style={{
            background:
              "linear-gradient(175deg, rgba(36,18,6,0.82) 0%, rgba(22,10,3,0.92) 50%, rgba(14,7,2,0.95) 100%)",
          }}
        >
          {/* ── Stage 0: deep ambient glow burst (compositor, opacity only) ── */}
          {!reduce && (
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.55, 0.20, 0.32] }}
              transition={{ duration: 1.2 * r, delay: 0.04 * r, ease: "easeOut" }}
              style={{
                background:
                  "radial-gradient(ellipse 80% 55% at 50% 50%, rgba(251,180,60,0.22) 0%, transparent 75%)",
              }}
            />
          )}

          {/* ── Ambient floater particles ── */}
          {!reduce &&
            particles.map((p, i) => (
              <motion.span
                key={i}
                aria-hidden
                className="pointer-events-none absolute select-none font-black"
                style={{
                  top: "top" in p ? p.top : undefined,
                  left: "left" in p ? p.left : undefined,
                  right: "right" in p ? p.right : undefined,
                  fontSize: p.s,
                  color: `rgba(255,232,190,${p.o})`,
                }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: [0, p.o * 2.5, p.o], y: [8, -4, -8] }}
                transition={{
                  duration: 1.6 * r,
                  delay: p.d * r,
                  ease: [0.33, 1, 0.68, 1],
                }}
              >
                ؟
              </motion.span>
            ))}

          {/* ── Stage 1: diagonal slash line sweeps left→right ── */}
          {!reduce && (
            <motion.div
              aria-hidden
              className="pointer-events-none absolute"
              style={{
                top: "26%",
                left: "-30%",
                width: "160%",
                height: "1.5px",
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(255,215,140,0.65) 40%, rgba(255,215,140,0.65) 60%, transparent 100%)",
                rotate: "11deg",
                transformOrigin: "left center",
              }}
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: [0, 0.9, 0.5] }}
              transition={{ duration: 0.55 * r, delay: 0.18 * r, ease: [0.22, 1, 0.36, 1] }}
            />
          )}

          {/* ── Main players + VS layout (LTR so slide direction is always correct) ── */}
          <div
            dir="ltr"
            className="relative z-10 flex w-full max-w-[min(24rem,94vw)] flex-row items-center justify-center gap-0 px-2"
          >
            {/* Left player */}
            <motion.div
              className="flex min-w-0 flex-1 flex-col items-center"
              initial={{ x: reduce ? -28 : "-44vw", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: reduce ? 280 : 260,
                damping: reduce ? 28 : 24,
                delay: 0.12 * r,
              }}
            >
              {/* Avatar with premium ring */}
              <motion.div
                initial={{ scale: reduce ? 0.92 : 0.78 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 380,
                  damping: 22,
                  delay: 0.22 * r,
                }}
                style={{
                  borderRadius: "50%",
                  padding: 3,
                  background:
                    "linear-gradient(145deg, rgba(255,210,110,0.55), rgba(200,120,30,0.30))",
                  boxShadow:
                    "0 0 0 1.5px rgba(255,200,100,0.40), 0 14px 36px rgba(120,50,8,0.40)",
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
              </motion.div>

              {/* Name */}
              <motion.span
                className="mt-2 max-w-[8rem] truncate text-center text-xs font-extrabold"
                style={{ color: "#FFE8C8" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.30 * r, duration: 0.30 }}
              >
                {leftName}
              </motion.span>

              {/* Level + wins */}
              <VsPlayerBadge xp={leftXp} matchWins={leftMatchWins} reduce={reduce} />
            </motion.div>

            {/* VS center */}
            <div className="relative mx-1 flex shrink-0 flex-col items-center justify-center sm:mx-2">
              {/* VS glow halo */}
              {!reduce && (
                <motion.div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 -z-10 rounded-full"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{
                    scale: [0.6, 1.45, 1.10, 1.25],
                    opacity: [0, 0.80, 0.35, 0.50],
                  }}
                  transition={{
                    duration: 0.60 * r,
                    delay: 0.54 * r,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  style={{
                    background:
                      "radial-gradient(closest-side, rgba(255,185,65,0.70) 0%, transparent 70%)",
                  }}
                />
              )}

              {/* VS text — spring pop with overshoot */}
              <motion.span
                className="relative select-none font-black tabular-nums tracking-tight text-transparent"
                style={{
                  fontSize: "clamp(2.6rem, 12vw, 4rem)",
                  background:
                    "linear-gradient(190deg, #FFF9EC 0%, #FFD068 38%, #F59E0B 68%, #C2410C 100%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  textShadow: "0 3px 22px rgba(251,191,36,0.40)",
                  lineHeight: 1,
                }}
                initial={{ scale: reduce ? 0.88 : 0.55, opacity: 0, rotate: reduce ? 0 : -4 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: reduce ? 320 : 480,
                  damping: reduce ? 26 : 18,
                  delay: reduce ? 0.28 : 0.52,
                }}
              >
                VS
              </motion.span>

              {/* Spark burst lines radiating from VS (CSS only) */}
              {!reduce && (
                <motion.div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 -z-10"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: [0, 0.75, 0], scale: [0.7, 1.8] }}
                  transition={{ duration: 0.50 * r, delay: 0.56 * r, ease: "easeOut" }}
                  style={{
                    background:
                      "radial-gradient(closest-side, rgba(255,215,80,0.35) 0%, transparent 65%)",
                    borderRadius: "50%",
                  }}
                />
              )}
            </div>

            {/* Right player */}
            <motion.div
              className="flex min-w-0 flex-1 flex-col items-center"
              initial={{ x: reduce ? 28 : "44vw", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: reduce ? 280 : 260,
                damping: reduce ? 28 : 24,
                delay: 0.22 * r,
              }}
            >
              {/* Avatar with premium ring */}
              <motion.div
                initial={{ scale: reduce ? 0.92 : 0.78 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 380,
                  damping: 22,
                  delay: 0.30 * r,
                }}
                style={{
                  borderRadius: "50%",
                  padding: 3,
                  background:
                    "linear-gradient(145deg, rgba(255,210,110,0.55), rgba(200,120,30,0.30))",
                  boxShadow:
                    "0 0 0 1.5px rgba(255,200,100,0.40), 0 14px 36px rgba(120,50,8,0.40)",
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
              </motion.div>

              {/* Name */}
              <motion.span
                className="mt-2 max-w-[8rem] truncate text-center text-xs font-extrabold"
                style={{ color: "#FFE8C8" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.38 * r, duration: 0.30 }}
              >
                {rightName}
              </motion.span>

              {/* Level + wins */}
              <VsPlayerBadge xp={rightXp} matchWins={rightMatchWins} reduce={reduce} />
            </motion.div>
          </div>

          {/* ── Bottom label ── */}
          <motion.p
            className="relative z-10 mt-7 text-center text-[10px] font-bold uppercase tracking-[0.22em]"
            style={{ color: "rgba(212,165,116,0.85)" }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduce ? 0.36 : 0.62, duration: 0.38 }}
          >
            مين أنا؟
          </motion.p>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
