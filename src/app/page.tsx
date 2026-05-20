"use client";

import { collection, onSnapshot, type Timestamp } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useDefaultOnlinePresence } from "@/hooks/useDefaultOnlinePresence";
import { useLiveUserProfile } from "@/hooks/useLiveUserProfile";
import { useLiveUserProfiles } from "@/hooks/useLiveUserProfiles";
import { isFullAccountUser } from "@/lib/auth/google-user";
import { getFirebaseDb } from "@/lib/firebase/client";
import { col, userSub } from "@/lib/firestore/paths";
import { clientEffectivePresence } from "@/lib/social/game-presence-client";
import { presenceLabelAr } from "@/lib/social/presence-constants";
import { playUIButton, resumeAudioContext } from "@/lib/audio/game-sounds";
import { ShellEmbers } from "@/components/shell/ShellEmbers";
import { ShellCoin } from "@/components/shell/ShellCoin";
import { ShellFramedAvatar } from "@/components/shell/ShellFramedAvatar";
import { ShellIcon } from "@/components/shell/ShellIcons";
import { ShellTabBar } from "@/components/shell/ShellTabBar";
import { ActionTile, MajlisHero } from "@/components/shell/HomeScreenParts";

type FriendRow = { friendUid: string };

const FRAME_RING: ("gold" | "silver" | "simple")[] = ["gold", "silver", "simple"];

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const google = isFullAccountUser(user);
  const uid = user?.uid ?? null;

  useDefaultOnlinePresence(uid, google);

  const liveProfile = useLiveUserProfile(uid);
  const myCosmetic = liveProfile?.cosmetic;

  const [friends, setFriends] = useState<FriendRow[]>([]);

  useEffect(() => {
    if (!uid || !google) {
      setFriends([]);
      return;
    }
    const db = getFirebaseDb();
    return onSnapshot(
      collection(db, col.users, uid, userSub.friends),
      (snap) =>
        setFriends(
          snap.docs.map((d) => ({ friendUid: d.id })).sort((a, b) => (a.friendUid > b.friendUid ? 1 : -1)),
        ),
      () => setFriends([]),
    );
  }, [uid, google]);

  const friendUids = useMemo(() => friends.map((f) => f.friendUid).slice(0, 4), [friends]);
  const friendLive = useLiveUserProfiles(friendUids);

  const displayName = user
    ? user.displayName || (user.isAnonymous ? "زائر" : (user.email?.split("@")[0] ?? "لاعب"))
    : "لاعب";

  const coins = liveProfile?.progress.coins ?? 0;

  function nav(href: string, requireAuth = false) {
    resumeAudioContext();
    playUIButton();
    if (requireAuth && !loading && !user) {
      router.push(`/login?next=${encodeURIComponent(href)}`);
      return;
    }
    router.push(href);
  }

  return (
    <div className="shell-screen" style={{ background: "transparent" }}>
      <ShellEmbers count={6} />
      <div className="topbar">
        <button
          type="button"
          className="row gap-2"
          onClick={() => nav("/profile", true)}
          style={{ alignItems: "center", background: "none", border: "none", cursor: "pointer" }}
        >
          <ShellFramedAvatar
            cosmetic={myCosmetic}
            fallbackPhotoURL={user?.photoURL}
            displayName={displayName}
            size={44}
            frame="gold"
          />
          <div className="col" style={{ alignItems: "flex-start", lineHeight: 1.2 }}>
            <span className="text-sm muted">مرحبًا</span>
            <span className="h-display fw-7 text-md">{loading ? "…" : displayName}</span>
          </div>
        </button>
        <div className="topbar-slot-end">
          {user ? <ShellCoin value={coins} /> : null}
        </div>
      </div>

      <div className="f-1 scroll-y" style={{ padding: "4px 16px 12px" }}>
        <MajlisHero onPlay={() => nav("/play/random")} />

        <div className="mt-5" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <ActionTile
            icon="plus"
            title="غرفة خاصة"
            subtitle="ادعُ أصدقاءك"
            tint="terra"
            onClick={() => nav("/play/new", true)}
          />
          <ActionTile
            icon="search"
            title="انضم بكود"
            subtitle="رمز مكوّن من ٦"
            tint="sage"
            onClick={() => nav("/join", true)}
          />
          <ActionTile icon="shop" title="المتجر" subtitle="إطارات وعملات" tint="amber" onClick={() => nav("/shop", true)} />
          <ActionTile icon="trophy" title="التصنيف" subtitle="قريبًا" tint="muted" badge="قريبًا" onClick={() => nav("/ranking")} />
        </div>

        <div className="mt-5 row between" style={{ padding: "0 4px" }}>
          <div className="h-display fw-7 text-md">أصدقاؤك</div>
          <button
            type="button"
            className="text-sm muted"
            style={{ background: "none", border: "none", cursor: "pointer" }}
            onClick={() => nav("/profile/friends", true)}
          >
            عرض الكل ←
          </button>
        </div>

        <div className="scroll-x mt-2" style={{ paddingBottom: 8 }}>
          <div style={{ display: "flex", gap: 10 }}>
            {friendUids.map((friendUid, i) => {
              const p = friendLive[friendUid];
              const name = p?.displayName ?? p?.username ?? "صديق";
              const ts = p?.gamePresenceUpdatedAtMs
                ? ({ toMillis: () => p.gamePresenceUpdatedAtMs! } as Timestamp)
                : null;
              const presence = clientEffectivePresence(p?.gamePresence ?? null, ts);
              const online = presence !== "offline" && presence !== "away";
              return (
                <div
                  key={friendUid}
                  className="surf"
                  style={{
                    minWidth: 96,
                    padding: 12,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <ShellFramedAvatar
                    cosmetic={p?.cosmetic}
                    displayName={name}
                    size={52}
                    frame={FRAME_RING[i % FRAME_RING.length] ?? "simple"}
                    online={online}
                  />
                  <div className="text-sm fw-7" style={{ whiteSpace: "nowrap" }}>
                    {name}
                  </div>
                  <div className="text-xs muted" style={{ whiteSpace: "nowrap" }}>
                    {presenceLabelAr(presence)}
                  </div>
                </div>
              );
            })}
            <button
              type="button"
              className="surf"
              onClick={() => nav("/profile/friends", true)}
              style={{
                minWidth: 96,
                padding: 12,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                borderStyle: "dashed",
                color: "var(--fg-2)",
                cursor: "pointer",
              }}
            >
              <ShellIcon name="plus" size={20} />
              <span className="text-xs fw-6">إضافة صديق</span>
            </button>
          </div>
        </div>
      </div>

      <ShellTabBar active="home" />
    </div>
  );
}
