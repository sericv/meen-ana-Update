"use client";

import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { ShellIcon } from "@/components/shell/ShellIcons";
import type { PlayerCosmetic } from "@/lib/profile/cosmetics";
import type { LevelProgress } from "@/lib/profile/level";
import type { PlayerProgress } from "@/lib/profile/progression";

export function ProfileIdentityCard({
  cosmetic,
  fallbackPhotoURL,
  displayName,
  username,
  levelInfo,
  progress,
  stats,
}: {
  cosmetic: PlayerCosmetic;
  fallbackPhotoURL?: string | null;
  displayName: string;
  username: string | null;
  levelInfo: LevelProgress;
  progress: PlayerProgress | undefined;
  stats: { label: string; value: string | number; icon: string }[];
}) {
  return (
    <div
      className="surf"
      style={{
        padding: 20,
        position: "relative",
        overflow: "hidden",
        /* Richer amber gradient — warm top, deeper amber base */
        background:
          "linear-gradient(148deg, oklch(0.95 0.06 78) 0%, oklch(0.90 0.10 68) 55%, oklch(0.84 0.12 58) 100%)",
        border: "1px solid oklch(0.74 0.13 62 / 0.38)",
        boxShadow:
          "var(--sh-2), inset 0 1.5px 0 rgba(255,255,255,0.62), inset 0 -1px 0 oklch(0.62 0.14 50 / 0.18)",
      }}
    >
      {/* Ambient double bloom for depth */}
      <div
        className="bloom"
        style={{ top: -50, left: -30, width: 260, height: 260, opacity: 0.55 }}
      />
      <div
        className="bloom"
        style={{
          bottom: -30,
          right: -20,
          width: 180,
          height: 180,
          opacity: 0.28,
          background: "radial-gradient(closest-side, oklch(0.72 0.17 55 / 0.40), transparent 70%)",
        }}
      />

      {/* Identity row */}
      <div className="row gap-3" style={{ position: "relative" }}>
        <ProfileAvatar
          cosmetic={cosmetic}
          fallbackPhotoURL={fallbackPhotoURL}
          displayName={displayName}
          size="xl"
          idle
        />
        <div className="f-1" style={{ minWidth: 0 }}>
          <div
            className="h-display fw-8 text-xl"
            style={{ letterSpacing: "-0.02em", lineHeight: 1.1 }}
          >
            {displayName}
          </div>
          <div
            className="text-sm"
            style={{ color: "oklch(0.38 0.06 45)", fontWeight: 600, marginTop: 2 }}
          >
            @{username ?? "—"}
          </div>
          <div className="row gap-1 mt-2">
            <span
              className="chip chip-amber"
              style={{
                gap: 4,
                boxShadow: "inset 0 1.5px 0 rgba(255,255,255,0.55), 0 2px 6px oklch(0.62 0.16 55 / 0.28)",
              }}
            >
              <ShellIcon name="sparkle" size={11} />
              Lv.{levelInfo.level}
            </span>
            <span
              className="chip"
              style={{
                background: "oklch(0.98 0.014 80 / 0.65)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.55)",
              }}
            >
              {progress?.xp.toLocaleString("ar") ?? 0} XP
            </span>
          </div>
        </div>
      </div>

      {/* XP progress bar */}
      <div className="mt-4" style={{ position: "relative" }}>
        <div className="row between text-xs" style={{ marginBottom: 6 }}>
          <span style={{ color: "oklch(0.40 0.06 48)", fontWeight: 700 }}>التقدم</span>
          <span
            className="h-mono"
            style={{ color: "oklch(0.40 0.06 48)", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}
          >
            {levelInfo.xpInLevel} / {levelInfo.xpToNext} XP
          </span>
        </div>
        <div
          style={{
            height: 9,
            borderRadius: 999,
            background: "oklch(0.38 0.06 48 / 0.14)",
            overflow: "hidden",
            boxShadow: "inset 0 1px 2px rgba(0,0,0,0.10)",
          }}
        >
          <div
            style={{
              width: `${levelInfo.pct}%`,
              height: "100%",
              background: "linear-gradient(90deg, oklch(0.82 0.16 72), oklch(0.88 0.14 82), oklch(0.76 0.17 62))",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.48), 0 0 10px oklch(0.78 0.18 68 / 0.5)",
              borderRadius: 999,
              transition: "width 0.9s cubic-bezier(0.23,1,0.32,1)",
            }}
          />
        </div>
      </div>

      {/* Stats grid */}
      <div className="mt-3" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 7 }}>
        {stats.map((s) => (
          <div
            key={s.label}
            className="col center"
            style={{
              padding: "10px 4px",
              borderRadius: 12,
              background: "oklch(0.99 0.010 82 / 0.68)",
              border: "1px solid oklch(0.80 0.05 65 / 0.38)",
              boxShadow:
                "inset 0 1.5px 0 rgba(255,255,255,0.82), 0 2px 6px oklch(0.50 0.06 50 / 0.08)",
            }}
          >
            <ShellIcon name={s.icon} size={16} color="var(--amber-3)" />
            <div
              className="h-display fw-8 text-md mt-2"
              style={{ letterSpacing: "-0.02em", lineHeight: 1 }}
            >
              {s.value}
            </div>
            <div className="text-xs muted" style={{ marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
