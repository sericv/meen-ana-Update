"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthGate } from "@/components/auth/AuthGate";
import { useAuth } from "@/components/providers/AuthProvider";
import { useDefaultOnlinePresence } from "@/hooks/useDefaultOnlinePresence";
import { useLiveUserProfile } from "@/hooks/useLiveUserProfile";
import { isFullAccountUser } from "@/lib/auth/google-user";
import { playUIButton, resumeAudioContext } from "@/lib/audio/game-sounds";
import { normalizeCosmetic } from "@/lib/profile/cosmetics";
import { xpProgressInCurrentLevel } from "@/lib/profile/level";
import type { PlayerProgress } from "@/lib/profile/progression";
import { ShellIcon } from "@/components/shell/ShellIcons";
import { ShellScreen } from "@/components/shell/ShellScreen";
import { ProfileIdentityCard } from "@/components/shell/ProfileIdentityCard";
import { ProfilePurchasesPanel } from "@/components/shell/ProfilePurchasesPanel";
import { ProfileSettingsPanel } from "@/components/shell/ProfileSettingsPanel";

type ProfileTab = "purchases" | "settings";

function ProfileScreenInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "settings" ? "settings" : "purchases";

  const { user, logout } = useAuth();
  const uid = user?.uid ?? null;
  const google = isFullAccountUser(user);
  useDefaultOnlinePresence(uid, google);

  const live = useLiveUserProfile(uid);
  const username = live?.username ?? null;

  const [tab, setTab] = useState<ProfileTab>(initialTab);

  const cosmetic = live?.cosmetic ?? normalizeCosmetic(undefined);
  const progress = live?.progress;
  const displayName =
    user?.displayName || (user?.isAnonymous ? "زائر" : (user?.email?.split("@")[0] ?? "لاعب"));

  const levelInfo = xpProgressInCurrentLevel(progress?.xp ?? 0);
  const totalMatches = progress?.matchTotal ?? 0;
  const winRate = progress && totalMatches > 0 ? `${progress.winRate}%` : "—";

  const stats = useMemo(
    () => [
      { label: "فوز", value: progress?.matchWins ?? 0, icon: "trophy" },
      { label: "مباريات", value: totalMatches, icon: "swords" },
      { label: "نسبة الفوز", value: winRate, icon: "flame" },
    ],
    [progress?.matchWins, totalMatches, winRate],
  );

  function tapTab(next: ProfileTab) {
    resumeAudioContext();
    playUIButton();
    setTab(next);
  }

  return (
    <ShellScreen activeTab="profile">
      <div className="topbar">
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => router.push("/")}
          style={{ padding: 8, borderRadius: 12 }}
          aria-label="رجوع"
        >
          <ShellIcon name="back" size={18} />
        </button>
        <div className="h-display fw-7">حسابي</div>
        <span style={{ width: 40 }} />
      </div>

      <div className="f-1 scroll-y" style={{ padding: "0 16px 12px" }}>
        <ProfileIdentityCard
          cosmetic={cosmetic}
          fallbackPhotoURL={user?.photoURL}
          displayName={displayName}
          username={username}
          levelInfo={levelInfo}
          progress={progress}
          stats={stats}
        />

        <div
          className="row gap-1 mt-4"
          style={{
            padding: 4,
            borderRadius: 14,
            background: "oklch(0.92 0.03 75 / .8)",
            border: "1px solid oklch(0.78 0.05 65 / .4)",
          }}
        >
          {(
            [
              { k: "purchases" as const, l: "المشتريات" },
              { k: "settings" as const, l: "الإعدادات" },
            ] as const
          ).map((t) => (
            <button
              key={t.k}
              type="button"
              onClick={() => tapTab(t.k)}
              className="f-1"
              style={{
                padding: "10px 0",
                borderRadius: 10,
                background:
                  tab === t.k
                    ? "linear-gradient(180deg, oklch(0.98 0.02 80), oklch(0.94 0.03 76))"
                    : "transparent",
                color: tab === t.k ? "var(--fg-0)" : "var(--fg-3)",
                fontFamily: "var(--display)",
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              {t.l}
            </button>
          ))}
        </div>

        <div className="mt-3">
          {tab === "purchases" && uid ? (
            <ProfilePurchasesPanel
              uid={uid}
              google={google}
              cosmetic={cosmetic}
              progress={progress}
              fallbackPhotoURL={user?.photoURL}
              displayName={displayName}
            />
          ) : null}
          {tab === "settings" && uid && user ? (
            <ProfileSettingsPanel
              uid={uid}
              google={google}
              user={{
                displayName: user.displayName,
                photoURL: user.photoURL,
                isAnonymous: user.isAnonymous,
                email: user.email,
              }}
              live={live}
            />
          ) : null}
        </div>

        {tab === "settings" ? (
          <div className="mt-5 col gap-3">
            <div className="row center gap-3 text-xs fw-7" style={{ color: "var(--fg-3)" }}>
              <Link className="underline-offset-4 hover:underline" href="/privacy">
                سياسة الخصوصية
              </Link>
              <span aria-hidden>·</span>
              <Link className="underline-offset-4 hover:underline" href="/terms">
                الشروط والأحكام
              </Link>
            </div>

            <button
              type="button"
              className="btn btn-ghost btn-block"
              onClick={() => {
                resumeAudioContext();
                playUIButton();
                void logout().then(() => router.replace("/"));
              }}
              style={{ color: "var(--lose)", borderColor: "oklch(0.62 0.14 25 / .35)" }}
            >
              تسجيل الخروج
            </button>
          </div>
        ) : null}
      </div>
    </ShellScreen>
  );
}

export default function ProfileHubPage() {
  return (
    <AuthGate>
      <Suspense fallback={<div className="shell-screen screen-enter" style={{ padding: 24 }}>…</div>}>
        <ProfileScreenInner />
      </Suspense>
    </AuthGate>
  );
}
