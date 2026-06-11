"use client";

/**
 * ShopFrameCard — premium animated frame preview card.
 * Shows animated GIF frame preview with rarity-based glow.
 */

import { motion, useReducedMotion } from "framer-motion";
import { useState, useCallback } from "react";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { ShellCoin } from "@/components/shell/ShellCoin";
import type { FrameRarity, PlayerCosmetic } from "@/lib/profile/cosmetics";

const RARITY_STYLES: Record<
  FrameRarity,
  {
    label: string;
    chipBg: string;
    chipColor: string;
    borderColor: string;
    borderHover: string;
    glowColor: string;
    cardBg: string;
  }
> = {
  common: {
    label: "عادي",
    chipBg: "oklch(0.88 0.03 70)",
    chipColor: "oklch(0.42 0.04 60)",
    borderColor: "oklch(0.84 0.04 70 / .55)",
    borderHover: "oklch(0.78 0.06 68 / .7)",
    glowColor: "oklch(0.78 0.06 70 / .0)",
    cardBg: "linear-gradient(180deg, oklch(0.99 0.01 80 / .97), oklch(0.95 0.02 74 / .98))",
  },
  rare: {
    label: "نادر",
    chipBg: "oklch(0.82 0.12 235)",
    chipColor: "oklch(0.25 0.10 230)",
    borderColor: "oklch(0.80 0.10 235 / .45)",
    borderHover: "oklch(0.68 0.16 240 / .65)",
    glowColor: "oklch(0.70 0.14 240 / .35)",
    cardBg: "linear-gradient(180deg, oklch(0.99 0.02 225 / .97), oklch(0.94 0.04 220 / .98))",
  },
  epic: {
    label: "ملحمي",
    chipBg: "linear-gradient(135deg, oklch(0.80 0.15 300), oklch(0.72 0.18 280))",
    chipColor: "oklch(0.98 0.02 300)",
    borderColor: "oklch(0.80 0.12 295 / .45)",
    borderHover: "oklch(0.68 0.18 290 / .65)",
    glowColor: "oklch(0.68 0.18 290 / .35)",
    cardBg: "linear-gradient(180deg, oklch(0.99 0.02 290 / .97), oklch(0.94 0.04 285 / .98))",
  },
  legendary: {
    label: "أسطوري",
    chipBg: "linear-gradient(135deg, oklch(0.82 0.18 78), oklch(0.70 0.20 65))",
    chipColor: "oklch(0.98 0.03 80)",
    borderColor: "oklch(0.80 0.16 74 / .50)",
    borderHover: "oklch(0.68 0.22 72 / .70)",
    glowColor: "oklch(0.68 0.22 72 / .45)",
    cardBg: "linear-gradient(180deg, oklch(0.99 0.03 80 / .97), oklch(0.95 0.05 74 / .98))",
  },
};

export function ShopFrameCard({
  frameId,
  displayNameAr,
  rarity,
  previewCosmetic,
  fallbackPhotoURL,
  displayName,
  price,
  owned,
  equipped,
  busy,
  canBuy,
  insufficientCoins,
  onBuy,
  onEquip,
}: {
  frameId: string;
  displayNameAr: string;
  rarity: FrameRarity;
  previewCosmetic?: PlayerCosmetic;
  fallbackPhotoURL?: string | null;
  displayName?: string;
  price: number;
  owned?: boolean;
  equipped?: boolean;
  busy?: boolean;
  canBuy?: boolean;
  insufficientCoins?: boolean;
  onBuy?: () => void;
  onEquip?: () => void;
}) {
  const reduced = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const rs = RARITY_STYLES[rarity];

  const handleBuy = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      onBuy?.();
    },
    [onBuy],
  );

  const handleEquip = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      onEquip?.();
    },
    [onEquip],
  );

  return (
    <motion.article
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onTouchStart={() => setHovered(true)}
      onTouchEnd={() => setHovered(false)}
      animate={
        !reduced
          ? {
              y: hovered ? -4 : 0,
              boxShadow: hovered
                ? `0 10px 32px ${rs.glowColor}, 0 2px 8px oklch(0.60 0.04 60 / .15)`
                : `0 2px 8px oklch(0.60 0.04 60 / .10)`,
            }
          : {}
      }
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: rs.cardBg,
        borderRadius: 18,
        border: `1.5px solid ${hovered ? rs.borderHover : rs.borderColor}`,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "14px 12px 12px",
        gap: 10,
        position: "relative",
        cursor: "default",
        willChange: "transform",
        WebkitTapHighlightColor: "transparent",
        transition: "border-color 0.22s",
      }}
    >
      {/* Rarity chip */}
      <div
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          background: rs.chipBg,
          color: rs.chipColor,
          fontSize: 9,
          fontWeight: 800,
          fontFamily: "var(--display)",
          padding: "2px 7px",
          borderRadius: 20,
          letterSpacing: "0.04em",
          boxShadow: "0 1px 4px oklch(0.50 0.06 60 / .2)",
        }}
      >
        {rs.label}
      </div>

      {/* Ambient glow behind avatar for high rarities */}
      {(rarity === "epic" || rarity === "legendary") && (
        <motion.div
          animate={{ opacity: [0.3, 0.65, 0.3], scale: [0.9, 1.05, 0.9] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            top: 20,
            left: "50%",
            translateX: "-50%",
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${rs.glowColor.replace("0.35", "0.6")} 0%, transparent 70%)`,
            filter: "blur(12px)",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Avatar with frame */}
      <div style={{ position: "relative", zIndex: 1 }}>
        {previewCosmetic ? (
          <ProfileAvatar
            cosmetic={previewCosmetic}
            fallbackPhotoURL={fallbackPhotoURL}
            displayName={displayName}
            size="lg"
            idle
          />
        ) : null}
      </div>

      {/* Name */}
      <div
        style={{
          fontFamily: "var(--display)",
          fontWeight: 800,
          fontSize: 12,
          color: "oklch(0.28 0.05 48)",
          textAlign: "center",
          lineHeight: 1.2,
        }}
      >
        {displayNameAr}
      </div>

      {/* Price + button */}
      {owned ? (
        onEquip ? (
          <motion.button
            type="button"
            whileTap={{ scale: 0.93 }}
            onClick={handleEquip}
            onTouchEnd={handleEquip}
            disabled={busy || equipped}
            className="btn btn-primary btn-sm btn-block"
            style={{ fontSize: 12 }}
          >
            {busy ? "…" : equipped ? "مفعّل ✓" : "تجهيز"}
          </motion.button>
        ) : (
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              fontFamily: "var(--display)",
              color: "oklch(0.55 0.10 75)",
              background: "oklch(0.88 0.08 78 / .6)",
              padding: "3px 9px",
              borderRadius: 20,
            }}
          >
            تمتلكه ✓
          </span>
        )
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
            width: "100%",
          }}
        >
          <ShellCoin value={price} compact />
          <motion.button
            type="button"
            whileTap={{ scale: 0.93 }}
            onClick={handleBuy}
            onTouchEnd={handleBuy}
            disabled={!canBuy || busy}
            className="btn btn-primary btn-sm btn-block"
            style={{
              fontSize: 12,
              opacity: insufficientCoins ? 0.55 : 1,
            }}
          >
            {busy ? "…" : "شراء"}
          </motion.button>
        </div>
      )}
    </motion.article>
  );
}
