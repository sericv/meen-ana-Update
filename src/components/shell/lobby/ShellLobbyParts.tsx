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
  return (
    <div className="col center" style={{ gap: 8, opacity: hidden ? 0.35 : 1, transition: "opacity .4s" }}>
      <div style={{ position: "relative" }}>
        <div
          className="bloom"
          style={{
            inset: -12,
            opacity: 0.6,
            background: `radial-gradient(closest-side, ${
              side === "me" ? "oklch(0.78 0.18 65 / .45)" : "oklch(0.68 0.14 25 / .4)"
            }, transparent 70%)`,
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
      <div className="h-display fw-7 text-md">{hidden ? "..." : name}</div>
      {!hidden ? (
        <div className="row gap-2 text-xs muted">
          <span>المستوى {level}</span>
          <span style={{ opacity: 0.5 }}>•</span>
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
  ready,
  isMe,
}: {
  name: string;
  cosmetic?: PlayerCosmetic;
  photoURL?: string | null;
  xp?: number;
  ready: boolean;
  isMe?: boolean;
}) {
  const level = levelFromXp(xp ?? 0);
  return (
    <div className="surf" style={{ padding: 14, minHeight: 200, position: "relative", overflow: "hidden" }}>
      {isMe ? (
        <span className="chip chip-amber" style={{ position: "absolute", top: 10, left: 10, fontSize: 10 }}>
          أنت
        </span>
      ) : null}
      <div className="col center" style={{ gap: 8 }}>
        <div style={{ position: "relative" }}>
          <div
            className="bloom"
            style={{ inset: -10, opacity: ready ? 0.7 : 0.3 }}
          />
          <ShellLobbyPlayerAvatar displayName={name} cosmetic={cosmetic} photoURL={photoURL} size="md" />
        </div>
        <div className="h-display fw-7 text-md">{name}</div>
        <div className="text-xs muted">المستوى {level}</div>
        <div className={`chip ${ready ? "chip-win" : ""}`} style={{ marginTop: 4, gap: 4 }}>
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
