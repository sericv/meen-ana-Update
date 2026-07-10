"use client";

import { motion } from "framer-motion";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { ShellIcon } from "@/components/shell/ShellIcons";
import { levelFromXp } from "@/lib/profile/level";
import { EASE_OUT } from "@/lib/motion";
import type { PlayerCosmetic } from "@/lib/profile/cosmetics";
import { usePlayerProfileModal } from "@/components/providers/PlayerProfileModalProvider";

/* ─── Preserved exports (used by ShellMatchmakingView) ──────────── */

export function ShellLobbyPlayerAvatar({
  displayName,
  cosmetic,
  photoURL,
  size = "md",
  hidden,
}: {
  displayName: string;
  cosmetic?: PlayerCosmetic;
  photoURL?: string | null;
  size?: "md" | "lg";
  hidden?: boolean;
}) {
  if (hidden) {
    return (
      <div
        className="avatar"
        style={{
          width: size === "lg" ? 76 : 62,
          height: size === "lg" ? 76 : 62,
          borderRadius: "50%",
          background: "oklch(0.90 0.04 70)",
          display: "grid",
          placeItems: "center",
        }}
      >
        <span className="h-display fw-8" style={{ fontSize: size === "lg" ? 36 : 28, color: "var(--fg-3)" }}>
          ؟
        </span>
      </div>
    );
  }
  return (
    <ProfileAvatar
      cosmetic={cosmetic}
      fallbackPhotoURL={photoURL}
      displayName={displayName}
      size={size === "lg" ? "lg" : "md"}
      idle
    />
  );
}

export function ShellMatchPlayerBlock({
  name,
  cosmetic,
  photoURL,
  xp,
  wins,
  hidden,
  side,
}: {
  name: string;
  cosmetic?: PlayerCosmetic;
  photoURL?: string | null;
  xp?: number;
  wins?: number;
  hidden?: boolean;
  side: "me" | "them";
}) {
  const level = levelFromXp(xp ?? 0);
  const amberGlow = "rgba(255, 159, 10, 0.22)";
  const redGlow = "rgba(239, 68, 68, 0.18)";
  return (
    <div
      className="col center"
      style={{ gap: 10, opacity: hidden ? 0.35 : 1, transition: "opacity 0.4s cubic-bezier(0.23,1,0.32,1)" }}
    >
      <div style={{ position: "relative" }}>
        <div
          className="bloom"
          style={{
            inset: -20,
            opacity: 0.7,
            background: `radial-gradient(closest-side, ${side === "me" ? amberGlow : redGlow}, transparent 70%)`,
          }}
        />
        <div
          className="bloom"
          style={{
            inset: -8,
            opacity: 0.5,
            background: `radial-gradient(closest-side, ${side === "me" ? "rgba(255, 159, 10, 0.15)" : "rgba(239, 68, 68, 0.12)"}, transparent 65%)`,
          }}
        />
        <ShellLobbyPlayerAvatar
          displayName={name}
          cosmetic={cosmetic}
          photoURL={photoURL}
          size="lg"
          hidden={hidden}
        />
      </div>
      <div
        className="h-display fw-8 text-md text-[#5e3011]"
        style={{ letterSpacing: "-0.01em", textAlign: "center" }}
      >
        {hidden ? "…" : name}
      </div>
      {!hidden ? (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 12px",
            borderRadius: 20,
            background: "rgba(255, 255, 255, 0.8)",
            border: "1.5px solid rgba(251, 146, 60, 0.18)",
            fontSize: 11,
            fontWeight: 800,
            color: "var(--fg-1)",
            boxShadow: "0 2px 6px rgba(180, 100, 30, 0.04)",
          }}
        >
          <span>مستوى {level}</span>
          <span style={{ opacity: 0.35 }}>·</span>
          <span>{wins ?? 0} فوز</span>
        </div>
      ) : null}
    </div>
  );
}

/* ─── Premium Setting Row ───────────────────────────────────────── */

export function ShellSettingRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  const colors: Record<string, string> = {
    sparkle: "#8B5CF6",
    flame: "#FB7185",
    sound: "#06B6D4",
    chat: "#22C55E",
    lightbulb: "#FBBF24",
  };
  const accent = colors[icon] ?? "#8B5CF6";

  return (
    <div
      className="row between"
      style={{
        padding: "8px 8px 8px 12px",
        borderRadius: 14,
        background: "rgba(245, 243, 255, 0.5)",
        border: "1px solid rgba(139, 92, 246, 0.06)",
      }}
    >
      <div className="row gap-2.5">
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 10,
            background: `linear-gradient(135deg, color-mix(in srgb, ${accent} 18%, white), color-mix(in srgb, ${accent} 8%, white))`,
            display: "grid",
            placeItems: "center",
            color: accent,
          }}
        >
          <ShellIcon name={icon} size={15} />
        </div>
        <span className="text-sm fw-7" style={{ fontFamily: "var(--display)" }}>{label}</span>
      </div>
      <div className="row gap-1.5">
        <span className="text-xs fw-6" style={{ color: "var(--fg-2)" }}>{value}</span>
      </div>
    </div>
  );
}

/* ─── Premium Player Card (Lobby) ──────────────────────────────── */

export function ShellLobbySlotCard({
  uid,
  name,
  cosmetic,
  photoURL,
  xp,
  matchWins,
  ready,
  isMe,
  roomId,
}: {
  uid?: string;
  name: string;
  cosmetic?: PlayerCosmetic;
  photoURL?: string | null;
  xp?: number;
  matchWins?: number;
  ready: boolean;
  isMe?: boolean;
  roomId?: string;
}) {
  const { openProfile } = usePlayerProfileModal();
  const level = levelFromXp(xp ?? 0);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: EASE_OUT }}
      className="game-card-outer"
      onClick={uid ? () => openProfile(uid, { roomId, screen: "lobby" }) : undefined}
      style={{ willChange: "transform", cursor: uid ? "pointer" : "default" }}
    >
      <div
        className="game-card-inner"
        style={{
          padding: 16,
          background: ready
            ? "linear-gradient(180deg, #FAFFFE 0%, #F0FDF4 100%)"
            : "#FFFFFF",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative ambient glow */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: -40,
            right: -40,
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: ready
              ? "radial-gradient(circle, rgba(52, 211, 153, 0.1) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(139, 92, 246, 0.06) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* "أنت" badge */}
        {isMe && (
          <span
            className="select-none"
            style={{
              position: "absolute",
              top: 10,
              insetInlineStart: 10,
              fontSize: 8,
              fontWeight: 900,
              padding: "2px 7px",
              borderRadius: 999,
              background: "#F5F3FF",
              color: "#7C3AED",
              border: "1px solid rgba(139, 92, 246, 0.12)",
              fontFamily: "var(--display)",
              letterSpacing: "0.02em",
            }}
          >
            أنت
          </span>
        )}

        {/* Avatar */}
        <div style={{ position: "relative" }}>
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: -14,
              borderRadius: "50%",
              background: ready
                ? "radial-gradient(closest-side, rgba(52, 211, 153, 0.18), transparent)"
                : "radial-gradient(closest-side, rgba(139, 92, 246, 0.10), transparent)",
              opacity: 0.7,
              pointerEvents: "none",
            }}
          />
          <ShellLobbyPlayerAvatar displayName={name} cosmetic={cosmetic} photoURL={photoURL} size="md" />
        </div>

        {/* Name */}
        <div className="h-display fw-8" style={{ fontSize: 14, color: "#1e293b", lineHeight: 1.2 }}>
          {name}
        </div>

        {/* Level + wins badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "3px 10px",
            borderRadius: 999,
            background: ready
              ? "linear-gradient(180deg, #D1FAE5 0%, #A7F3D0 100%)"
              : "linear-gradient(180deg, #F5F3FF 0%, #EDE9FE 100%)",
            boxShadow: ready
              ? "inset 0 1px 0 rgba(255,255,255,0.7), 0 2px 6px rgba(52, 211, 153, 0.12)"
              : "inset 0 1px 0 rgba(255,255,255,0.7), 0 2px 6px rgba(139, 92, 246, 0.08)",
          }}
        >
          <span
            style={{
              fontSize: 9,
              fontWeight: 800,
              color: ready ? "#047857" : "#6D28D9",
              fontFamily: "var(--display)",
              letterSpacing: "0.01em",
            }}
          >
            مستوى {level}
            {matchWins !== undefined && (
              <span style={{ opacity: 0.4, margin: "0 3px" }}>·</span>
            )}
            {matchWins !== undefined && `${matchWins} فوز`}
          </span>
        </div>

        {/* Ready chip */}
        <div
          className="chip"
          style={{
            marginTop: 2,
            gap: 4,
            padding: "3px 10px",
            borderRadius: 999,
            fontSize: 10,
            fontWeight: 800,
            border: "1.5px solid",
            fontFamily: "var(--display)",
            transition: "all 0.3s cubic-bezier(0.23, 1, 0.32, 1)",
            ...(ready
              ? {
                  background: "rgba(52, 211, 153, 0.12)",
                  borderColor: "rgba(52, 211, 153, 0.3)",
                  color: "#047857",
                }
              : {
                  background: "rgba(148, 163, 184, 0.08)",
                  borderColor: "rgba(148, 163, 184, 0.2)",
                  color: "#94A3B8",
                }),
          }}
        >
          {ready ? (
            <>
              <svg width={11} height={11} viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M5 12l5 5L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              جاهز
            </>
          ) : (
            "غير جاهز"
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Premium Waiting Slot ──────────────────────────────────────── */

export function ShellLobbyWaitingSlot() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: EASE_OUT, delay: 0.08 }}
      className="game-card-outer"
      style={{
        background: "rgba(255,255,255,0.5)",
        borderStyle: "dashed",
        borderColor: "rgba(139, 92, 246, 0.12)",
        willChange: "transform",
      }}
    >
      <div
        className="game-card-inner"
        style={{
          background: "rgba(255, 255, 255, 0.6)",
          borderStyle: "dashed",
          borderColor: "rgba(139, 92, 246, 0.2)",
          padding: 24,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
          minHeight: 206,
        }}
      >
        <div style={{ position: "relative" }}>
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: -18,
              borderRadius: "50%",
              background: "radial-gradient(closest-side, rgba(139, 92, 246, 0.08), transparent)",
              pointerEvents: "none",
            }}
          />
          <div
            className="avatar-idle-bob"
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "#F5F3FF",
              border: "2px dashed rgba(139, 92, 246, 0.25)",
              display: "grid",
              placeItems: "center",
              color: "#8B5CF6",
              margin: "0 auto",
            }}
          >
            <ShellIcon name="plus" size={26} />
          </div>
        </div>
        <div className="col center" style={{ gap: 4 }}>
          <div className="h-display fw-8" style={{ fontSize: 14, color: "#475569" }}>
            بانتظار خصم
          </div>
          <div className="text-xs fw-6" style={{ color: "#94A3B8" }}>
            شارك الرمز لبدء اللعب
          </div>
        </div>
        <div className="row center" style={{ gap: 5 }}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="dot pulse"
              style={{
                background: "#8B5CF6",
                width: 5,
                height: 5,
                animationDelay: `${-i * 0.4}s`,
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
