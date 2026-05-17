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
        padding: 18,
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(180deg, oklch(0.94 0.07 75), oklch(0.90 0.09 65))",
        border: "1px solid oklch(0.72 0.13 60 / .35)",
      }}
    >
      <div className="bloom" style={{ top: -40, left: -20, width: 220, height: 220, opacity: 0.6 }} />
      <div className="row gap-3" style={{ position: "relative" }}>
        <ProfileAvatar
          cosmetic={cosmetic}
          fallbackPhotoURL={fallbackPhotoURL}
          displayName={displayName}
          size="xl"
          idle
        />
        <div className="f-1" style={{ minWidth: 0 }}>
          <div className="h-display fw-8 text-xl">{displayName}</div>
          <div className="text-sm muted">@{username ?? "—"}</div>
          <div className="row gap-1 mt-2">
            <span className="chip chip-amber" style={{ gap: 4 }}>
              <ShellIcon name="sparkle" size={11} />
              Lv.{levelInfo.level}
            </span>
            <span className="chip">{progress?.xp.toLocaleString("ar") ?? 0} نقطة</span>
          </div>
        </div>
      </div>

      <div className="mt-3">
        <div className="row between text-xs">
          <span className="muted">التقدم</span>
          <span className="h-mono muted">
            {levelInfo.xpInLevel} / {levelInfo.xpToNext}
          </span>
        </div>
        <div
          style={{
            marginTop: 6,
            height: 8,
            borderRadius: 999,
            background: "oklch(0.40 0.06 50 / .15)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${levelInfo.pct}%`,
              height: "100%",
              background: "linear-gradient(90deg, var(--amber), var(--gold))",
              boxShadow: "0 0 8px var(--amber)",
            }}
          />
        </div>
      </div>

      <div className="mt-3" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
        {stats.map((s) => (
          <div
            key={s.label}
            className="col center"
            style={{
              padding: "8px 4px",
              borderRadius: 10,
              background: "oklch(0.98 0.015 80 / .65)",
              border: "1px solid oklch(0.75 0.05 60 / .3)",
            }}
          >
            <ShellIcon name={s.icon} size={16} color="var(--amber-3)" />
            <div className="h-display fw-8 text-md mt-2">{s.value}</div>
            <div className="text-xs muted">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
