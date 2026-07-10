"use client";

import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
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
    <div className="flex flex-col gap-5 w-full text-right relative z-10">
      
      {/* Identity row with Avatar & Name Details */}
      <div className="flex items-center gap-4">
        <div className="relative flex-shrink-0 active:scale-95 transition-transform duration-200">
          <ProfileAvatar
            cosmetic={cosmetic}
            fallbackPhotoURL={fallbackPhotoURL}
            displayName={displayName}
            size="xl"
            idle
          />
          <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-green-500 border-2 border-white animate-pulse" />
        </div>

        <div className="flex-1 min-w-0" style={{ lineHeight: 1.25 }}>
          <h2 className="h-display text-lg font-black text-slate-800 truncate">
            {displayName}
          </h2>
          <p className="text-xs text-slate-400 font-bold mt-0.5">
            @{username ?? "—"}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="text-[9px] font-black bg-purple-50 text-[#7C3AED] px-2 py-0.5 rounded-full border border-purple-100/50">
              Lv.{levelInfo.level}
            </span>
            <span className="text-[9px] font-black bg-slate-50 text-slate-500 px-2 py-0.5 rounded-full border border-slate-100">
              {progress?.xp.toLocaleString("ar") ?? 0} XP
            </span>
          </div>
        </div>
      </div>

      {/* XP progress bar section */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[10px] font-black">
          <span className="text-slate-400 uppercase tracking-wider">مستوى التقدم</span>
          <span className="text-slate-500 h-mono">
            {levelInfo.xpInLevel} / {levelInfo.xpToNext} XP
          </span>
        </div>
        <div className="w-full bg-slate-100 border border-slate-200/40 rounded-full h-2 overflow-hidden shadow-inner">
          <div
            style={{
              width: `${levelInfo.pct}%`,
              transition: "width 0.9s cubic-bezier(0.23,1,0.32,1)",
            }}
            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-400 shadow-sm"
          />
        </div>
      </div>

      {/* Stats Bento Box Grid */}
      <div className="grid grid-cols-3 gap-3 mt-1">
        {stats.map((s) => (
          <div
            key={s.label}
            className="game-card-outer"
          >
            <div className="game-card-inner p-3 bg-slate-50/50 border border-slate-100 rounded-2xl flex flex-col items-center gap-1 text-center justify-center">
              <span className="text-sm font-black text-[#7C3AED] block">
                {s.value}
              </span>
              <span className="text-[9px] font-bold text-slate-400 block mt-0.5">
                {s.label}
              </span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
