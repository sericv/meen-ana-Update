"use client";

import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { ShellIcon } from "@/components/shell/ShellIcons";
import { levelFromXp } from "@/lib/profile/level";
import type { PlayerCosmetic } from "@/lib/profile/cosmetics";

const iconBoxStyle = {
  width: 30,
  height: 30,
  borderRadius: 8,
  background: "linear-gradient(180deg, oklch(0.94 0.07 75), oklch(0.88 0.10 65))",
  display: "grid",
  placeItems: "center",
  color: "oklch(0.40 0.10 50)",
} as const;

export function ShellSettingRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="row between" style={{ padding: "8px 4px", borderRadius: 10 }}>
      <div className="row gap-2">
        <div style={iconBoxStyle}>
          <ShellIcon name={icon} size={16} />
        </div>
        <span className="text-sm fw-6">{label}</span>
      </div>
      <div className="row gap-1">
        <span className="text-sm muted">{value}</span>
        <ShellIcon name="back" size={16} color="var(--fg-3)" />
      </div>
    </div>
  );
}

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
  const amberGlow = "oklch(0.80 0.20 68 / 0.50)";
  const redGlow = "oklch(0.65 0.16 22 / 0.45)";
  return (
    <div
      className="col center"
      style={{ gap: 8, opacity: hidden ? 0.32 : 1, transition: "opacity 0.4s cubic-bezier(0.23,1,0.32,1)" }}
    >
      <div style={{ position: "relative" }}>
        {/* Outer warm bloom */}
        <div
          className="bloom"
          style={{
            inset: -18,
            opacity: 0.65,
            background: `radial-gradient(closest-side, ${side === "me" ? amberGlow : redGlow}, transparent 70%)`,
          }}
        />
        {/* Tighter accent bloom */}
        <div
          className="bloom"
          style={{
            inset: -6,
            opacity: 0.42,
            background: `radial-gradient(closest-side, ${side === "me" ? "oklch(0.88 0.16 70 / 0.5)" : "oklch(0.72 0.14 18 / 0.42)"}, transparent 65%)`,
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
        className="h-display fw-7 text-md"
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
            padding: "3px 10px",
            borderRadius: 20,
            background: "rgba(255,255,255,0.55)",
            border: "1px solid rgba(244,196,141,0.42)",
            fontSize: 11,
            fontWeight: 700,
            color: "var(--fg-2)",
          }}
        >
          <span>مستوى {level}</span>
          <span style={{ opacity: 0.45 }}>·</span>
          <span>{wins ?? 0} فوز</span>
        </div>
      ) : null}
    </div>
  );
}

export function ShellLobbySlotCard({
  name,
  cosmetic,
  photoURL,
  xp,
  matchWins,
  ready,
  isMe,
}: {
  name: string;
  cosmetic?: PlayerCosmetic;
  photoURL?: string | null;
  xp?: number;
  matchWins?: number;
  ready: boolean;
  isMe?: boolean;
}) {
  const level = levelFromXp(xp ?? 0);
  return (
    <div
      className="surf"
      style={{
        padding: 14,
        minHeight: 204,
        position: "relative",
        overflow: "hidden",
        /* Ready state: warm amber top glow */
        ...(ready ? {
          boxShadow:
            "var(--sh-2), inset 0 0 0 1.5px oklch(0.78 0.16 68 / 0.35), 0 0 20px -4px oklch(0.78 0.18 65 / 0.30)",
        } : {}),
        transition: "box-shadow 0.4s cubic-bezier(0.23, 1, 0.32, 1)",
      }}
    >
      {/* Ready state warm gradient overlay */}
      {ready && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, oklch(0.94 0.08 72 / 0.18) 0%, transparent 55%)",
            pointerEvents: "none",
            borderRadius: "inherit",
          }}
        />
      )}
      {isMe ? (
        <span className="chip chip-amber" style={{ position: "absolute", top: 10, left: 10, fontSize: 10 }}>
          أنت
        </span>
      ) : null}
      <div className="col center" style={{ gap: 8, position: "relative" }}>
        <div style={{ position: "relative" }}>
          <div
            className="bloom"
            style={{
              inset: -12,
              opacity: ready ? 0.75 : 0.32,
              transition: "opacity 0.4s ease",
            }}
          />
          <ShellLobbyPlayerAvatar displayName={name} cosmetic={cosmetic} photoURL={photoURL} size="md" />
        </div>
        <div className="h-display fw-7 text-md" style={{ letterSpacing: "-0.01em" }}>{name}</div>
        {/* Level + wins badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "3px 10px",
            borderRadius: 20,
            background: "linear-gradient(180deg, #FFE8A8 0%, #F2B544 60%, #E0A030 100%)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.62), inset 0 -1px 0 rgba(160,90,0,0.12), 0 2px 8px rgba(200,130,20,0.28)",
          }}
        >
          <span
            style={{
              fontSize: 9.5,
              fontWeight: 800,
              color: "#5e3011",
              fontFamily: "var(--display)",
              letterSpacing: "0.01em",
            }}
          >
            مستوى {level}
            {matchWins !== undefined && (
              <span style={{ opacity: 0.55, margin: "0 4px" }}>·</span>
            )}
            {matchWins !== undefined && `${matchWins} فوز`}
          </span>
        </div>
        {/* Ready chip */}
        <div
          className={`chip ${ready ? "chip-win" : ""}`}
          style={{
            marginTop: 4,
            gap: 4,
            transition: "background 0.3s ease, color 0.3s ease",
          }}
        >
          {ready ? (
            <>
              <ShellIcon name="check" size={11} />
              جاهز
            </>
          ) : (
            "غير جاهز"
          )}
        </div>
      </div>
    </div>
  );
}

export function ShellLobbyWaitingSlot() {
  return (
    <div
      className="surf"
      style={{
        padding: 16,
        textAlign: "center",
        minHeight: 200,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 10,
        borderStyle: "dashed",
        borderColor: "oklch(0.42 0.05 60 / .5)",
      }}
    >
      <div style={{ position: "relative", display: "inline-block", margin: "0 auto" }}>
        <div className="bloom" style={{ inset: -16, opacity: 0.5 }} />
        <div
          style={{
            width: 70,
            height: 70,
            borderRadius: "50%",
            background: "oklch(0.92 0.04 75)",
            border: "2px dashed oklch(0.68 0.07 60 / .55)",
            display: "grid",
            placeItems: "center",
            color: "var(--fg-3)",
            margin: "0 auto",
          }}
        >
          <ShellIcon name="plus" size={26} />
        </div>
      </div>
      <div>
        <div className="h-display fw-7 text-md">بانتظار خصم</div>
        <div className="text-xs muted">شارك الرمز لبدء اللعب</div>
        <div className="row center gap-2 mt-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="dot pulse"
              style={{
                color: "var(--amber)",
                width: 6,
                height: 6,
                animationDelay: `${-i * 0.5}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
