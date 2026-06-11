/**
 * Unified motion constants — single source of truth for all animation
 * parameters across the game. Follows Emil Kowalski design principles.
 *
 * Rules:
 * - Enters: ease-out (starts fast, gives instant feedback)
 * - Exits:  faster ease-in variant
 * - Never animate layout properties (only transform + opacity)
 * - @media (hover:hover) guard all hover states
 * - Springs for interruptible/gesture-driven UI
 * - CSS for ambient/looping animations (off main thread)
 */

// ─── Easing curves ─────────────────────────────────────────────────────────

/** Emil's strong ease-out: snappy enter, instant feedback */
export const EASE_OUT = [0.23, 1, 0.32, 1] as const;

/** iOS drawer curve (Ionic-style): heavier, more premium */
export const EASE_DRAWER = [0.32, 0.72, 0, 1] as const;

/** Smooth ease-in-out for on-screen morphs */
export const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const;

/** Fast exit: elements leaving should be quick */
export const EASE_EXIT = [0.32, 0, 0.67, 0] as const;

// ─── Spring configs ────────────────────────────────────────────────────────

/** Standard UI spring — button presses, card moves */
export const SPRING_UI = {
  type: "spring",
  stiffness: 420,
  damping: 28,
} as const;

/** Dramatic spring — overshoot for emotional moments (match found, level up) */
export const SPRING_DRAMATIC = {
  type: "spring",
  stiffness: 380,
  damping: 22,
} as const;

/** Gentle spring — ambient floats, hover lifts */
export const SPRING_GENTLE = {
  type: "spring",
  stiffness: 260,
  damping: 30,
} as const;

/** Stiff spring — fast snaps, instant-feeling presses */
export const SPRING_SNAP = {
  type: "spring",
  stiffness: 600,
  damping: 35,
} as const;

// ─── Duration-based configs ────────────────────────────────────────────────

/** Standard enter: 280ms with strong ease-out */
export const ENTER = { duration: 0.28, ease: EASE_OUT } as const;

/** Standard exit: 160ms — asymmetrically faster */
export const EXIT = { duration: 0.16, ease: EASE_EXIT } as const;

/** Slow reveal for cinematic moments */
export const CINEMATIC = { duration: 0.55, ease: EASE_DRAWER } as const;

/** Micro interaction: 120-160ms */
export const MICRO = { duration: 0.14, ease: EASE_OUT } as const;

// ─── Stagger helpers ────────────────────────────────────────────────────────

/** Generate staggered animation delay for item index */
export const staggerDelay = (i: number, base = 0.04) => i * base;

/** Framer Motion staggerChildren container variants */
export const staggerContainer = (stagger = 0.06, delayChildren = 0.08) => ({
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: stagger,
      delayChildren,
    },
  },
});

/** Standard child variant for stagger parent */
export const staggerItem = {
  hidden: { opacity: 0, y: 10, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: SPRING_UI,
  },
};

// ─── Whilepress/WhileTap ──────────────────────────────────────────────────

/** Standard tactile press (Emil: scale only, compositor-safe) */
export const WHILE_TAP = { scale: 0.97 } as const;

/** Stronger press for small controls */
export const WHILE_TAP_STRONG = { scale: 0.93 } as const;

/** Subtle press for large surfaces */
export const WHILE_TAP_SUBTLE = { scale: 0.985 } as const;

// ─── Initial/animate pairs ─────────────────────────────────────────────────

/** Standard enter from below */
export const fadeUp = {
  initial: { opacity: 0, y: 12, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.97 },
};

/** Pop in from scale */
export const popIn = {
  initial: { opacity: 0, scale: 0.88 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.92 },
};

/** Fade only — for crossfades */
export const fadeOnly = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};
