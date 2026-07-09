"use client";

import { motion } from "framer-motion";
import { ShellIcon } from "@/components/shell/ShellIcons";
import { ShellGameCard } from "@/components/shell/ShellGameCard";
import { ALL_CARDS } from "@/lib/game/cards";
import { getCategoryById } from "@/lib/game/categories";
import { SPRING_UI, SPRING_DRAMATIC, staggerContainer, staggerItem, EASE_OUT } from "@/lib/motion";

const HERO_CARD = ALL_CARDS.find((c) => c.nameAr.includes("ابن")) ?? ALL_CARDS[0]!;
const HOME_HERO_IMAGE_URL =
  "https://img.magnific.com/free-vector/handphone-floating-cartoon-vector-icon-illustration-technology-object-icon-isolated-flat-vector_138676-13457.jpg?semt=ais_hybrid&w=740&q=80";

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
  const tints = {
    amber: "linear-gradient(160deg, #FFFDF9 0%, #FFF5E8 100%)",
    terra: "linear-gradient(160deg, #FFFDF9 0%, #FFEFE5 100%)",
    sage:  "linear-gradient(160deg, #FFFDF9 0%, #F0FAF5 100%)",
    muted: "linear-gradient(160deg, #FFFDF9 0%, #F5F3F0 100%)",
  };
  const outerBorders = {
    amber: "rgba(251, 146, 60, 0.18)",
    terra: "rgba(234, 88, 12, 0.16)",
    sage:  "rgba(16, 185, 129, 0.14)",
    muted: "rgba(120, 113, 108, 0.12)",
  };
  const iconBg = {
    amber: "linear-gradient(135deg, #FFB03A, #FF8A00)",
    terra: "linear-gradient(135deg, #FF6B4A, #E02E00)",
    sage:  "linear-gradient(135deg, #34D399, #059669)",
    muted: "linear-gradient(135deg, #A8A29E, #78716C)",
  };
  const iconColors = "#ffffff";
  const glowColors = {
    amber: "rgba(251, 146, 60, 0.06)",
    terra: "rgba(234, 88, 12, 0.05)",
    sage:  "rgba(16, 185, 129, 0.04)",
    muted: "rgba(120, 113, 108, 0.03)",
  };

  return (
    <motion.button
      type="button"
      onClick={onClick}
      variants={staggerItem}
      whileTap={{ scale: 0.95, y: 2 }}
      transition={SPRING_UI}
      className="bezel-outer"
      style={{
        padding: 5,
        background: "rgba(255, 255, 255, 0.45)",
        borderColor: outerBorders[tint],
        boxShadow: `0 6px 16px ${glowColors[tint]}`,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        minHeight: 112,
        willChange: "transform",
      }}
    >
      <div
        className="bezel-inner"
        style={{
          padding: "12px 10px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          minHeight: 100,
          background: tints[tint],
          borderColor: "rgba(255, 255, 255, 0.75)",
          textAlign: "right",
          width: "100%",
          alignItems: "flex-start",
          flex: "1 1 auto",
        }}
      >
        {/* Icon box */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 11,
            background: iconBg[tint],
            color: iconColors,
            display: "grid",
            placeItems: "center",
            boxShadow: "0 3px 8px rgba(180, 100, 30, 0.12)",
          }}
        >
          <ShellIcon name={icon} size={18} />
        </div>

        <div style={{ marginTop: "auto" }}>
          <div className="h-display fw-8 text-sm" style={{ color: "var(--fg-0)", fontSize: 14 }}>{title}</div>
          <div className="text-xs muted" style={{ marginTop: 2, fontSize: 11 }}>{subtitle}</div>
        </div>
      </div>

      {badge ? (
        <span
          className="chip chip-amber"
          style={{ position: "absolute", top: 12, left: 12, fontSize: 9, padding: "2px 6px" }}
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
        gap: 10,
      }}
    >
      {children}
    </motion.div>
  );
}

export function MajlisHero({ onPlay }: { onPlay: () => void }) {
  const cat = getCategoryById(HERO_CARD.categoryId)?.nameAr ?? "عام";

  return (
    <div style={{ position: "relative", padding: "12px 4px 0" }}>
      {/* Hero headline — staggered entry */}
      <motion.div
        className="h-display fw-8"
        initial={{ opacity: 0, y: 14, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.38, ease: EASE_OUT }}
        style={{
          fontSize: 36,
          lineHeight: 1.0,
          color: "var(--fg-0)",
          letterSpacing: "-0.02em",
        }}
      >
        مَن أنا؟
      </motion.div>
      <motion.div
        className="text-sm muted mt-2 fw-5"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: EASE_OUT, delay: 0.08 }}
      >
        اسأل، خمّن، واكتشف شخصيتك السرية في عيون خصمك.
      </motion.div>

      <motion.div
        className="mt-4"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.42, ease: EASE_OUT, delay: 0.12 }}
        style={{
          position: "relative",
          height: 208,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Ambient warmth blobs */}
        <div
          className="bloom"
          style={{
            inset: -20,
            opacity: 0.65,
            background: "radial-gradient(closest-side, rgba(255, 176, 58, 0.22), transparent)",
          }}
        />
        <div style={{ position: "absolute", right: 32, top: 4 }}>
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
        <div style={{ position: "absolute", left: 24, bottom: 4 }}>
          <ShellGameCard width={120} height={168} variant="back" tilt={7} />
        </div>
      </motion.div>

      <motion.button
        type="button"
        className="btn btn-primary btn-lg btn-block mt-4"
        onClick={onPlay}
        initial={{ opacity: 0, y: 12, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ ...SPRING_DRAMATIC, delay: 0.18 }}
        whileTap={{ scale: 0.96 }}
        style={{ height: 60, fontSize: 19, willChange: "transform" }}
      >
        <ShellIcon name="play" size={22} />
        ابحث عن خصم عشوائي
      </motion.button>
    </div>
  );
}
