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
  const amberGlow = "rgba(255, 159, 10, 0.22)";
  const redGlow = "rgba(239, 68, 68, 0.18)";
  return (
    <div
      className="col center"
      style={{ gap: 10, opacity: hidden ? 0.35 : 1, transition: "opacity 0.4s cubic-bezier(0.23,1,0.32,1)" }}
    >
      <div style={{ position: "relative" }}>
        {/* Outer warm bloom */}
        <div
          className="bloom"
          style={{
            inset: -20,
            opacity: 0.7,
            background: `radial-gradient(closest-side, ${side === "me" ? amberGlow : redGlow}, transparent 70%)`,
          }}
        />
        {/* Tighter accent bloom */}
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
      className="bezel-outer"
      style={{
        padding: 5,
        minHeight: 206,
        background: ready ? "rgba(255, 176, 58, 0.22)" : "rgba(255, 255, 255, 0.42)",
        borderColor: ready ? "rgba(255, 159, 10, 0.35)" : "rgba(251, 146, 60, 0.14)",
        boxShadow: ready ? "0 8px 24px rgba(255, 159, 10, 0.15)" : "0 4px 12px rgba(180, 100, 30, 0.04)",
        transition: "all 0.35s cubic-bezier(0.23, 1, 0.32, 1)",
      }}
    >
      <div
        className="bezel-inner"
        style={{
          padding: 14,
          background: ready 
            ? "linear-gradient(180deg, #FFFDF0 0%, #FFFDF8 100%)" 
            : "linear-gradient(180deg, #FFFDF9 0%, #FFF9F0 100%)",
          borderColor: ready ? "rgba(255, 159, 10, 0.25)" : "rgba(255, 255, 255, 0.75)",
          height: "100%",
          width: "100%",
          borderRadius: 21,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
        }}
      >
        {isMe ? (
          <span className="chip chip-amber" style={{ position: "absolute", top: 10, left: 10, fontSize: 9, padding: "2px 6px" }}>
            أنت
          </span>
        ) : null}

        <div style={{ position: "relative" }}>
          <div
            className="bloom"
            style={{
              inset: -12,
              opacity: ready ? 0.75 : 0.32,
              background: "radial-gradient(closest-side, rgba(255, 159, 10, 0.25), transparent)",
              transition: "opacity 0.4s ease",
            }}
          />
          <ShellLobbyPlayerAvatar displayName={name} cosmetic={cosmetic} photoURL={photoURL} size="md" />
        </div>

        <div className="h-display fw-8 text-md text-[#5e3011]" style={{ letterSpacing: "-0.01em" }}>{name}</div>

        {/* Level + wins badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "3px 10px",
            borderRadius: 20,
            background: "linear-gradient(180deg, #FFEAB2 0%, #F5BE50 60%, #E6A933 100%)",
            boxShadow:
              "inset 0 1.5px 0 rgba(255,255,255,0.7), inset 0 -1px 0 rgba(160,90,0,0.15), 0 2px 6px rgba(200,130,20,0.18)",
          }}
        >
          <span
            style={{
              fontSize: 9.5,
              fontWeight: 800,
              color: "#4f260a",
              fontFamily: "var(--display)",
              letterSpacing: "0.01em",
            }}
          >
            مستوى {level}
            {matchWins !== undefined && (
              <span style={{ opacity: 0.5, margin: "0 4px" }}>·</span>
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
            transition: "all 0.3s ease",
            ...(ready ? {
              background: "rgba(52, 211, 153, 0.15)",
              borderColor: "rgba(52, 211, 153, 0.35)",
              color: "#047857",
            } : {}),
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
      className="bezel-outer"
      style={{
        padding: 5,
        minHeight: 206,
        background: "rgba(255,255,255,0.22)",
        borderColor: "rgba(251, 146, 60, 0.12)",
        borderStyle: "dashed",
        boxShadow: "none",
      }}
    >
      <div
        className="bezel-inner"
        style={{
          padding: 16,
          height: "100%",
          width: "100%",
          borderRadius: 21,
          borderStyle: "dashed",
          borderColor: "rgba(251, 146, 60, 0.25)",
          background: "transparent",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 12,
          minHeight: 194,
        }}
      >
        <div style={{ position: "relative", display: "inline-block", margin: "0 auto" }}>
          <div
            className="bloom"
            style={{
              inset: -16,
              opacity: 0.5,
              background: "radial-gradient(closest-side, rgba(251, 146, 60, 0.12), transparent)",
            }}
          />
          <div
            className="avatar-idle-bob"
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.7)",
              border: "1.5px dashed rgba(251, 146, 60, 0.35)",
              display: "grid",
              placeItems: "center",
              color: "var(--fg-3)",
              margin: "0 auto",
              boxShadow: "0 2px 8px rgba(180, 100, 30, 0.03)",
            }}
          >
            <ShellIcon name="plus" size={24} />
          </div>
        </div>
        <div>
          <div className="h-display fw-8 text-sm text-[#5e3011]">بانتظار خصم</div>
          <div className="text-xs muted" style={{ marginTop: 2 }}>شارك الرمز لبدء اللعب</div>
          <div className="row center gap-1.5 mt-2">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="dot pulse"
                style={{
                  color: "rgba(251, 146, 60, 0.8)",
                  width: 5,
                  height: 5,
                  animationDelay: `${-i * 0.4}s`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
