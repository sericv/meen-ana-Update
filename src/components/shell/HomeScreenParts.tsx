"use client";

import { motion } from "framer-motion";
import { Baloo_Bhaijaan_2 } from "next/font/google";
import { ShellIcon } from "@/components/shell/ShellIcons";
import { ShellGameCard } from "@/components/shell/ShellGameCard";
import { ALL_CARDS } from "@/lib/game/cards";
import { getCategoryById } from "@/lib/game/categories";
import { SPRING_UI, SPRING_DRAMATIC, staggerContainer, staggerItem, EASE_OUT } from "@/lib/motion";

const HERO_CARD = ALL_CARDS.find((c) => c.nameAr.includes("ابن")) ?? ALL_CARDS[0]!;
const HOME_HERO_IMAGE_URL =
  "https://img.magnific.com/free-vector/handphone-floating-cartoon-vector-icon-illustration-technology-object-icon-isolated-flat-vector_138676-13457.jpg?semt=ais_hybrid&w=740&q=80";

/** Rounded, bubbly Arabic display font — home screen only (cartoon casual identity). */
export const homeToonFont = Baloo_Bhaijaan_2({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-toon",
  display: "swap",
});

/* ── Cartoon clay palette per tile tint ─────────────────────── */
const TOON_TINTS = {
  amber: {
    bg: "linear-gradient(165deg, #FFF1D2 0%, #FFD88E 100%)",
    edge: "#E89B2E",
    glow: "rgba(242, 166, 61, 0.40)",
    icon: "linear-gradient(180deg, #FFCB5E 0%, #F2952B 100%)",
    iconInk: "#6E4310",
    ring: "rgba(242, 166, 61, 0.50)",
  },
  terra: {
    bg: "linear-gradient(165deg, #FFE2D4 0%, #FFB99D 100%)",
    edge: "#D9633C",
    glow: "rgba(232, 109, 74, 0.38)",
    icon: "linear-gradient(180deg, #FF9A70 0%, #E85D3A 100%)",
    iconInk: "#FFFFFF",
    ring: "rgba(232, 109, 74, 0.48)",
  },
  sage: {
    bg: "linear-gradient(165deg, #E2F6EA 0%, #B4E6CC 100%)",
    edge: "#3F9E6C",
    glow: "rgba(78, 168, 122, 0.34)",
    icon: "linear-gradient(180deg, #7DD6A4 0%, #41A873 100%)",
    iconInk: "#FFFFFF",
    ring: "rgba(78, 168, 122, 0.46)",
  },
  muted: {
    bg: "linear-gradient(165deg, #F6EEE3 0%, #E6D7C4 100%)",
    edge: "#A98F73",
    glow: "rgba(168, 147, 125, 0.30)",
    icon: "linear-gradient(180deg, #D8C5AE 0%, #B49B80 100%)",
    iconInk: "#FFFFFF",
    ring: "rgba(168, 147, 125, 0.42)",
  },
} as const;

export function ActionTile({
  icon,
  title,
  subtitle,
  tint = "amber",
  badge,
  onClick,
}: {
  icon: string;
  title: string;
  subtitle: string;
  tint?: "amber" | "terra" | "sage" | "muted";
  badge?: string;
  onClick?: () => void;
}) {
  const t = TOON_TINTS[tint];

  return (
    <motion.button
      type="button"
      onClick={onClick}
      variants={staggerItem}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.93, rotate: tint === "terra" || tint === "muted" ? 1.2 : -1.2 }}
      transition={SPRING_UI}
      style={{
        padding: "14px 14px 13px",
        textAlign: "right",
        background: t.bg,
        border: "3px solid rgba(255,255,255,0.92)",
        borderRadius: 26,
        boxShadow: [
          `0 4px 0 ${t.edge}55`,
          `0 12px 24px -8px ${t.glow}`,
          "inset 0 2px 0 rgba(255,255,255,.65)",
          `0 0 0 1.5px ${t.ring}`,
        ].join(", "),
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        minHeight: 114,
        cursor: "pointer",
        overflow: "hidden",
        willChange: "transform",
      }}
    >
      {/* Decorative corner bubble */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          top: -26,
          left: -22,
          width: 84,
          height: 84,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.38)",
          pointerEvents: "none",
        }}
      />
      <span
        aria-hidden
        style={{
          position: "absolute",
          top: 26,
          left: 14,
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.45)",
          pointerEvents: "none",
        }}
      />

      {/* Squishy icon bubble */}
      <div
        style={{
          width: 50,
          height: 50,
          borderRadius: 18,
          background: t.icon,
          color: t.iconInk,
          display: "grid",
          placeItems: "center",
          position: "relative",
          transform: "rotate(-4deg)",
          border: "2.5px solid rgba(255,255,255,0.85)",
          boxShadow: [
            "inset 0 2px 0 rgba(255,255,255,.55)",
            `inset 0 -3px 0 ${t.edge}66`,
            `0 5px 12px -3px ${t.glow}`,
          ].join(", "),
        }}
      >
        <ShellIcon name={icon} size={24} />
      </div>

      <div style={{ position: "relative" }}>
        <div
          className="h-display"
          style={{ fontSize: 16.5, fontWeight: 800, color: "#3A2517", lineHeight: 1.25 }}
        >
          {title}
        </div>
        <div style={{ fontSize: 11.5, fontWeight: 600, color: "#8A6A50", marginTop: 1 }}>
          {subtitle}
        </div>
      </div>

      {badge ? (
        <span
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            fontSize: 10,
            fontWeight: 800,
            padding: "4px 9px",
            borderRadius: 999,
            color: "#6E4310",
            background: "linear-gradient(180deg, #FFE3A1, #F2B544)",
            border: "2px solid rgba(255,255,255,0.9)",
            boxShadow: "0 3px 8px -2px rgba(200,136,31,.45)",
          }}
        >
          {badge}
        </span>
      ) : null}
    </motion.button>
  );
}

/** Wrapper — stagger-animates its ActionTile children on mount */
export function ActionGrid({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={staggerContainer(0.07, 0.05)}
      initial="hidden"
      animate="show"
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 12,
        padding: "0 1px",
      }}
    >
      {children}
    </motion.div>
  );
}

/* ── Small 4-point sparkle (decorative) ─────────────────────── */
function ToonSpark({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg
      aria-hidden
      className="toon-spark"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={style}
    >
      <path
        d="M12 1.5c.9 5.4 2.4 7.5 8.5 8.6-6.1 1.1-7.6 3.2-8.5 8.6-.9-5.4-2.4-7.5-8.5-8.6 6.1-1.1 7.6-3.2 8.5-8.6Z"
        fill="#F2B544"
        stroke="#FFFFFF"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MajlisHero({ onPlay }: { onPlay: () => void }) {
  const cat = getCategoryById(HERO_CARD.categoryId)?.nameAr ?? "عام";

  return (
    <div style={{ position: "relative", padding: "12px 4px 0" }}>
      {/* Hero headline — bubbly sticker title */}
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.38, ease: EASE_OUT }}
        style={{ position: "relative", display: "flex", alignItems: "center", gap: 10 }}
      >
        <span className="toon-title h-display">مَن أنا؟</span>
        <ToonSpark size={22} style={{ marginTop: -16 }} />
      </motion.div>
      <motion.div
        className="toon-sub mt-2"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: EASE_OUT, delay: 0.08 }}
      >
        اسأل، خمّن، اكتشف نفسك في عيون خصمك.
      </motion.div>

      {/* Card stage — sunburst, floating cards, sparkles */}
      <motion.div
        className="toon-stage mt-4"
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.42, ease: EASE_OUT, delay: 0.12 }}
      >
        <div className="toon-rays" aria-hidden />

        <ToonSpark size={18} style={{ position: "absolute", top: 14, left: 38 }} />
        <ToonSpark size={12} style={{ position: "absolute", top: 64, right: 6, animationDelay: "0.9s" }} />
        <ToonSpark size={14} style={{ position: "absolute", bottom: 30, left: 6, animationDelay: "1.7s" }} />

        <div className="toon-float" style={{ position: "absolute", right: 24, top: 4 }}>
          <ShellGameCard
            width={132}
            height={184}
            title={HERO_CARD.nameAr}
            category={cat}
            imageUrl={HOME_HERO_IMAGE_URL}
            tilt={-9}
            priority
          />
        </div>
        <div className="toon-float toon-float-alt" style={{ position: "absolute", left: 20, bottom: 4 }}>
          <ShellGameCard width={120} height={168} variant="back" tilt={7} />
        </div>
      </motion.div>

      {/* Candy play button */}
      <motion.button
        type="button"
        className="btn btn-lg btn-block mt-4 toon-cta"
        onClick={onPlay}
        initial={{ opacity: 0, y: 12, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ ...SPRING_DRAMATIC, delay: 0.18 }}
        whileTap={{ scale: 0.97 }}
        style={{ height: 64, fontSize: 20, willChange: "transform" }}
      >
        <span className="toon-cta-shine" aria-hidden />
        <ShellIcon name="play" size={24} />
        ابحث عن خصم
      </motion.button>
    </div>
  );
}

/** Decorative cartoon backdrop — blobs + polka dots, home screen only. */
export function HomeToonBackdrop() {
  return (
    <div className="toon-backdrop" aria-hidden>
      <span className="toon-blob" style={{ top: -70, right: -50, width: 230, height: 230, background: "radial-gradient(closest-side, rgba(255,205,130,0.55), transparent 72%)" }} />
      <span className="toon-blob" style={{ top: 130, left: -70, width: 190, height: 190, background: "radial-gradient(closest-side, rgba(165,224,193,0.40), transparent 72%)" }} />
      <span className="toon-blob" style={{ bottom: 70, right: -60, width: 210, height: 210, background: "radial-gradient(closest-side, rgba(255,180,150,0.32), transparent 72%)" }} />
    </div>
  );
}

/** All cartoon-casual styles, scoped under .home-toon (home screen only). */
export function HomeToonStyles() {
  return (
    <style>{`
.home-toon,
.home-toon .h-display,
.home-toon .btn {
  font-family: var(--font-toon), var(--display), system-ui, sans-serif;
}

/* ── Backdrop ─────────────────────────────────────────────── */
.home-toon .toon-backdrop {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
  background-image: radial-gradient(rgba(200, 136, 31, 0.10) 1.5px, transparent 1.6px);
  background-size: 24px 24px;
  -webkit-mask-image: linear-gradient(180deg, black 0%, rgba(0,0,0,.5) 55%, transparent 90%);
          mask-image: linear-gradient(180deg, black 0%, rgba(0,0,0,.5) 55%, transparent 90%);
}
.home-toon .toon-blob {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

/* ── Identity pill (topbar) ───────────────────────────────── */
.home-toon .toon-id {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 12px 5px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.78);
  border: 2.5px solid rgba(255, 255, 255, 0.95);
  outline: 1.5px solid rgba(242, 166, 61, 0.32);
  box-shadow:
    0 6px 16px -6px rgba(122, 90, 69, 0.28),
    inset 0 1.5px 0 rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.18s var(--ease-out);
}
.home-toon .toon-id:active {
  transform: scale(0.96);
}
.home-toon .toon-id-hi {
  font-size: 11.5px;
  font-weight: 700;
  color: #C8881F;
}
.home-toon .toon-id-name {
  font-size: 16px;
  font-weight: 800;
  color: #3A2517;
}

/* ── Hero title — white sticker halo ──────────────────────── */
.home-toon .toon-title {
  font-size: 42px;
  line-height: 1.05;
  font-weight: 800;
  color: #3A2517;
  letter-spacing: -0.01em;
  text-shadow:
    0 2px 0 #fff, 0 -2px 0 #fff, 2px 0 0 #fff, -2px 0 0 #fff,
    2px 2px 0 #fff, -2px 2px 0 #fff, 2px -2px 0 #fff, -2px -2px 0 #fff,
    0 10px 22px rgba(242, 138, 61, 0.35);
}
.home-toon .toon-sub {
  font-size: 13.5px;
  font-weight: 600;
  color: #8A6A50;
}

/* ── Card stage ───────────────────────────────────────────── */
.home-toon .toon-stage {
  position: relative;
  height: 212px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.home-toon .toon-stage::after {
  content: "";
  position: absolute;
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  width: 250px;
  height: 26px;
  border-radius: 50%;
  background: radial-gradient(closest-side, rgba(122, 90, 69, 0.22), transparent);
  filter: blur(2px);
  pointer-events: none;
}
.home-toon .toon-rays {
  position: absolute;
  width: 340px;
  height: 340px;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -52%);
  border-radius: 50%;
  background: repeating-conic-gradient(
    from 0deg,
    rgba(242, 181, 68, 0.30) 0deg 14deg,
    transparent 14deg 30deg
  );
  -webkit-mask-image: radial-gradient(circle, black 0%, rgba(0,0,0,.55) 45%, transparent 70%);
          mask-image: radial-gradient(circle, black 0%, rgba(0,0,0,.55) 45%, transparent 70%);
  pointer-events: none;
}

/* ── CTA candy button ─────────────────────────────────────── */
.home-toon .toon-cta {
  background: linear-gradient(180deg, #FFC04D 0%, #FF9D2E 48%, #F0761F 100%);
  color: #5C2C0E;
  font-weight: 800;
  border-radius: 999px;
  border: 3px solid rgba(255, 255, 255, 0.92);
  box-shadow:
    inset 0 2px 0 rgba(255, 255, 255, 0.65),
    inset 0 -6px 0 rgba(160, 70, 10, 0.28),
    0 6px 0 #C75E14,
    0 16px 28px -8px rgba(242, 106, 31, 0.55);
}
.home-toon .toon-cta:active {
  transform: translateY(3px) scale(0.985);
  box-shadow:
    inset 0 2px 0 rgba(255, 255, 255, 0.65),
    inset 0 -4px 0 rgba(160, 70, 10, 0.28),
    0 2px 0 #C75E14,
    0 8px 16px -6px rgba(242, 106, 31, 0.45);
}
.home-toon .toon-cta-shine {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  overflow: hidden;
  pointer-events: none;
}
.home-toon .toon-cta-shine::before {
  content: "";
  position: absolute;
  top: -20%;
  bottom: -20%;
  width: 36%;
  left: -45%;
  background: linear-gradient(100deg, transparent, rgba(255, 255, 255, 0.45), transparent);
  transform: skewX(-18deg);
}

/* ── Section heading + pill link ──────────────────────────── */
.home-toon .toon-sechead {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 17px;
  font-weight: 800;
  color: #3A2517;
}
.home-toon .toon-sechead::before {
  content: "";
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: linear-gradient(180deg, #FFC04D, #F0761F);
  box-shadow: 0 0 0 2.5px rgba(255, 255, 255, 0.9), 0 2px 6px rgba(242, 106, 31, 0.4);
}
.home-toon .toon-pill {
  font-size: 12px;
  font-weight: 700;
  color: #C8881F;
  background: rgba(255, 255, 255, 0.78);
  border: 2px solid rgba(255, 255, 255, 0.95);
  outline: 1.5px solid rgba(242, 166, 61, 0.30);
  border-radius: 999px;
  padding: 5px 12px;
  cursor: pointer;
  box-shadow: 0 4px 10px -4px rgba(122, 90, 69, 0.25);
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.18s var(--ease-out);
}
.home-toon .toon-pill:active {
  transform: scale(0.94);
}

/* ── Friend chips ─────────────────────────────────────────── */
.home-toon .toon-friend {
  background: linear-gradient(180deg, #FFFFFF 0%, #FFF4E4 100%);
  border: 3px solid rgba(255, 255, 255, 0.95);
  outline: 1.5px solid rgba(242, 166, 61, 0.26);
  border-radius: 22px;
  box-shadow:
    0 4px 0 rgba(222, 168, 92, 0.30),
    0 12px 22px -10px rgba(122, 90, 69, 0.30),
    inset 0 1.5px 0 rgba(255, 255, 255, 0.9);
}
.home-toon .toon-friend-add {
  background: rgba(255, 255, 255, 0.55);
  border: 2.5px dashed rgba(200, 136, 31, 0.50);
  outline: none;
  box-shadow: none;
  color: #A8784A;
}

/* ── Motion (disabled under reduced-motion) ───────────────── */
@media (prefers-reduced-motion: no-preference) {
  .home-toon .toon-rays {
    animation: toonSpin 38s linear infinite;
  }
  .home-toon .toon-float {
    animation: toonBob 3.4s ease-in-out infinite;
  }
  .home-toon .toon-float-alt {
    animation-duration: 3.9s;
    animation-delay: 0.5s;
  }
  .home-toon .toon-spark {
    animation: toonTwinkle 2.6s ease-in-out infinite;
  }
  .home-toon .toon-cta-shine::before {
    animation: toonShine 3.2s ease-in-out infinite;
  }
}

@keyframes toonSpin {
  from { transform: translate(-50%, -52%) rotate(0deg); }
  to   { transform: translate(-50%, -52%) rotate(360deg); }
}
@keyframes toonBob {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-7px); }
}
@keyframes toonTwinkle {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%      { opacity: 0.45; transform: scale(0.72) rotate(18deg); }
}
@keyframes toonShine {
  0%       { transform: translateX(0) skewX(-18deg); }
  55%, 100% { transform: translateX(420%) skewX(-18deg); }
}
`}</style>
  );
}
