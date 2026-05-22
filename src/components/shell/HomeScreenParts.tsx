"use client";

import { ShellIcon } from "@/components/shell/ShellIcons";
import { ShellGameCard } from "@/components/shell/ShellGameCard";
import { ALL_CARDS } from "@/lib/game/cards";
import { getCategoryById } from "@/lib/game/categories";

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
    amber: "linear-gradient(160deg, oklch(0.94 0.07 75), oklch(0.88 0.10 65))",
    terra: "linear-gradient(160deg, oklch(0.92 0.07 35), oklch(0.85 0.10 28))",
    sage: "linear-gradient(160deg, oklch(0.93 0.04 165), oklch(0.87 0.05 160))",
    muted: "linear-gradient(160deg, oklch(0.95 0.02 75), oklch(0.90 0.03 70))",
  };
  const borderColors = {
    amber: "oklch(0.78 0.13 65 / .45)",
    terra: "oklch(0.72 0.13 30 / .45)",
    sage: "oklch(0.70 0.07 165 / .40)",
    muted: "oklch(0.78 0.05 65 / .40)",
  };
  const iconBg = {
    amber: "linear-gradient(180deg, oklch(0.86 0.14 70), oklch(0.74 0.16 55))",
    terra: "linear-gradient(180deg, oklch(0.78 0.13 35), oklch(0.66 0.15 28))",
    sage: "linear-gradient(180deg, oklch(0.78 0.07 165), oklch(0.62 0.08 160))",
    muted: "linear-gradient(180deg, oklch(0.86 0.03 70), oklch(0.78 0.04 65))",
  };
  const iconColors = {
    amber: "oklch(0.30 0.08 45)",
    terra: "oklch(0.96 0.02 80)",
    sage: "oklch(0.96 0.02 80)",
    muted: "var(--fg-2)",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: 14,
        textAlign: "right",
        background: tints[tint],
        border: `1px solid ${borderColors[tint]}`,
        borderRadius: 18,
        boxShadow: "var(--sh-2), inset 0 1px 0 rgba(255,255,255,.55)",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        minHeight: 110,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: iconBg[tint],
          color: iconColors[tint],
          display: "grid",
          placeItems: "center",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,.5), 0 2px 4px oklch(0.45 0.06 50 / .15)",
        }}
      >
        <ShellIcon name={icon} size={22} />
      </div>
      <div>
        <div className="h-display fw-7 text-md">{title}</div>
        <div className="text-xs muted">{subtitle}</div>
      </div>
      {badge ? (
        <span className="chip chip-amber" style={{ position: "absolute", top: 10, left: 10, fontSize: 10 }}>
          {badge}
        </span>
      ) : null}
    </button>
  );
}

export function MajlisHero({ onPlay }: { onPlay: () => void }) {
  const cat = getCategoryById(HERO_CARD.categoryId)?.nameAr ?? "عام";

  return (
    <div style={{ position: "relative", padding: "12px 4px 0" }}>
      <div
        className="h-display fw-7"
        style={{ fontSize: 32, lineHeight: 1.05, color: "var(--fg-0)" }}
      >
        مَن أنا؟
      </div>
      <div className="text-sm muted mt-2">اسأل، خمّن، اكتشف نفسك في عيون خصمك.</div>

      <div
        className="mt-4"
        style={{
          position: "relative",
          height: 200,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div className="bloom" style={{ inset: -20, opacity: 0.65 }} />
        <div style={{ position: "absolute", right: 30, top: 6 }}>
          <ShellGameCard
            width={130}
            height={180}
            title={HERO_CARD.nameAr}
            category={cat}
            imageUrl={HOME_HERO_IMAGE_URL}
            tilt={-9}
            priority
          />
        </div>
        <div style={{ position: "absolute", left: 24, bottom: 6 }}>
          <ShellGameCard width={120} height={166} variant="back" tilt={7} />
        </div>
      </div>

      <button type="button" className="btn btn-primary btn-lg btn-block mt-4" onClick={onPlay} style={{ height: 60, fontSize: 19 }}>
        <ShellIcon name="play" size={22} />
        ابحث عن خصم
      </button>
    </div>
  );
}
