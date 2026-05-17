"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { collection, onSnapshot, type Timestamp } from "firebase/firestore";
import { AuthGate } from "@/components/auth/AuthGate";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { useAuth } from "@/components/providers/AuthProvider";
import { useDefaultOnlinePresence } from "@/hooks/useDefaultOnlinePresence";
import { useIncomingFriendRequestCount } from "@/hooks/useIncomingFriendRequestCount";
import { useLiveUserProfiles } from "@/hooks/useLiveUserProfiles";
import { ShellIcon } from "@/components/shell/ShellIcons";
import { ShellScreen } from "@/components/shell/ShellScreen";
import { playUIButton, resumeAudioContext } from "@/lib/audio/game-sounds";
import { getFirebaseDb } from "@/lib/firebase/client";
import { col, userSub } from "@/lib/firestore/paths";
import { isFullAccountUser } from "@/lib/auth/google-user";
import { postSocial, getSocial } from "@/lib/api/social-client";
import { clientEffectivePresence } from "@/lib/social/game-presence-client";
import { presenceLabelAr } from "@/lib/social/presence-constants";
import { levelFromXp } from "@/lib/profile/level";
import type { PlayerCosmetic } from "@/lib/profile/cosmetics";

type FriendRow = { friendUid: string };
type SearchHit = { uid: string; username: string; displayName: string; photoURL: string | null };

type InboxRow = {
  fromUid: string;
  displayName: string;
  photoURL: string | null;
  username: string;
};

type OutboxRow = {
  toUid: string;
  displayName: string;
  photoURL: string | null;
  username: string;
};

function SocialPlayerRow({
  displayName,
  username,
  photoURL,
  cosmetic,
  xp,
  matchWins,
  trailing,
  subtitle,
}: {
  displayName: string;
  username: string;
  photoURL: string | null;
  cosmetic?: PlayerCosmetic;
  xp: number;
  matchWins: number;
  trailing: ReactNode;
  subtitle?: string;
}) {
  const level = levelFromXp(xp);
  return (
    <div className="surf row gap-3" style={{ padding: 12, alignItems: "center" }}>
      <ProfileAvatar
        cosmetic={cosmetic}
        fallbackPhotoURL={photoURL}
        displayName={displayName}
        size="md"
        idle
      />
      <div className="f-1" style={{ minWidth: 0 }}>
        <p className="text-sm fw-7 truncate">{displayName}</p>
        <p className="text-xs muted truncate">{username ? `@${username}` : "لاعب"}</p>
        <p className="text-xs muted mt-1">
          المستوى {level}
          <span style={{ opacity: 0.5 }}> · </span>
          {matchWins} فوز
        </p>
        {subtitle ? <p className="text-xs amber-text mt-0.5">{subtitle}</p> : null}
      </div>
      {trailing}
    </div>
  );
}

function FriendsPageInner() {
  const router = useRouter();
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const google = isFullAccountUser(user);
  useDefaultOnlinePresence(uid, google);
  const pendingIncoming = useIncomingFriendRequestCount(uid, google);

  const [friends, setFriends] = useState<FriendRow[]>([]);
  const [inbox, setInbox] = useState<InboxRow[]>([]);
  const [outbox, setOutbox] = useState<OutboxRow[]>([]);
  const [searchQ, setSearchQ] = useState("");
  const [searchBusy, setSearchBusy] = useState(false);
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [socialBusy, setSocialBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!uid || !google) {
      setFriends([]);
      setInbox([]);
      setOutbox([]);
      return;
    }
    const db = getFirebaseDb();
    const uFriends = onSnapshot(
      collection(db, col.users, uid, userSub.friends),
      (snap) =>
        setFriends(
          snap.docs.map((d) => ({ friendUid: d.id })).sort((a, b) => (a.friendUid > b.friendUid ? 1 : -1)),
        ),
      () => setFriends([]),
    );
    const uInbox = onSnapshot(
      collection(db, col.users, uid, userSub.friendInbox),
      (snap) => {
        const rows: InboxRow[] = [];
        for (const d of snap.docs) {
          const x = d.data() as Record<string, unknown>;
          rows.push({
            fromUid: String(x.fromUid ?? d.id),
            displayName: String(x.displayName ?? "لاعب"),
            photoURL: x.photoURL != null ? String(x.photoURL) : null,
            username: String(x.username ?? ""),
          });
        }
        setInbox(rows);
      },
      () => setInbox([]),
    );
    const uOutbox = onSnapshot(
      collection(db, col.users, uid, userSub.friendOutbox),
      (snap) => {
        const rows: OutboxRow[] = [];
        for (const d of snap.docs) {
          const x = d.data() as Record<string, unknown>;
          rows.push({
            toUid: String(x.toUid ?? d.id),
            displayName: String(x.displayName ?? "لاعب"),
            photoURL: x.photoURL != null ? String(x.photoURL) : null,
            username: String(x.username ?? ""),
          });
        }
        setOutbox(rows);
      },
      () => setOutbox([]),
    );
    return () => {
      uFriends();
      uInbox();
      uOutbox();
    };
  }, [uid, google]);

  const friendUids = useMemo(() => friends.map((f) => f.friendUid), [friends]);
  const requestUids = useMemo(
    () => [...inbox.map((r) => r.fromUid), ...outbox.map((r) => r.toUid)],
    [inbox, outbox],
  );
  const liveUids = useMemo(
    () => [...new Set([...friendUids, ...requestUids])],
    [friendUids, requestUids],
  );
  const liveMap = useLiveUserProfiles(liveUids);
  const selfLive = useLiveUserProfiles(uid ? [uid] : []);
  const myUsername = uid ? selfLive[uid]?.username : null;

  const runSearch = useCallback(async () => {
    const q = searchQ.trim();
    if (q.length < 2) {
      setHits([]);
      return;
    }
    setSearchBusy(true);
    try {
      const res = (await getSocial<{ results: SearchHit[] }>(
        `/api/social/users/search?q=${encodeURIComponent(q)}`,
      )) as { results: SearchHit[] };
      setHits((res.results ?? []).filter((h) => h.uid !== uid));
    } catch {
      setHits([]);
    } finally {
      setSearchBusy(false);
    }
  }, [searchQ, uid]);

  const sendRequest = async (toUid: string) => {
    resumeAudioContext();
    playUIButton();
    setSocialBusy(toUid);
    try {
      await postSocial("/api/social/friends/request", { toUid });
    } finally {
      setSocialBusy(null);
    }
  };

  const respond = async (fromUid: string, accept: boolean) => {
    resumeAudioContext();
    playUIButton();
    setSocialBusy(`in:${fromUid}`);
    try {
      await postSocial("/api/social/friends/respond", { fromUid, accept });
    } finally {
      setSocialBusy(null);
    }
  };

  const remove = async (friendUid: string) => {
    resumeAudioContext();
    playUIButton();
    setSocialBusy(`rm:${friendUid}`);
    try {
      await postSocial("/api/social/friends/remove", { friendUid });
    } finally {
      setSocialBusy(null);
    }
  };

  return (
    <ShellScreen activeTab="friends">
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
        <div className="col center" style={{ lineHeight: 1.1 }}>
          <span className="text-xs muted">المجتمع</span>
          <span className="h-display fw-7">الأصدقاء</span>
        </div>
        {pendingIncoming > 0 ? (
          <span className="chip chip-amber" style={{ fontSize: 11 }}>
            {pendingIncoming} طلب
          </span>
        ) : (
          <span style={{ width: 40 }} />
        )}
      </div>

      <div className="f-1 scroll-y" style={{ padding: "0 16px 12px" }}>
        {!google ? (
          <div className="surf" style={{ padding: 20, textAlign: "center" }}>
            <p className="h-display fw-7 text-md">يتطلب Google</p>
            <p className="text-sm muted mt-2">سجّل الدخول بـ Google لإدارة الأصدقاء والطلبات.</p>
            <button
              type="button"
              className="btn btn-primary btn-sm mt-4"
              onClick={() => router.push("/login?next=/profile/friends")}
            >
              المتابعة عبر Google
            </button>
          </div>
        ) : !myUsername ? (
          <div className="surf" style={{ padding: 20, textAlign: "center" }}>
            <p className="text-sm fw-7">أنشئ اسمك العام أولاً من إعدادات الحساب.</p>
            <button type="button" className="btn btn-primary btn-sm mt-4" onClick={() => router.push("/profile?tab=settings")}>
              الإعدادات
            </button>
          </div>
        ) : (
          <>
            <section className="surf mb-3" style={{ padding: 14 }}>
              <div className="row between mb-2">
                <p className="h-display fw-7 text-md">طلبات واردة</p>
                {pendingIncoming > 0 ? <span className="chip chip-live">{pendingIncoming}</span> : null}
              </div>
              {inbox.length === 0 ? (
                <p className="text-sm muted text-center py-4">لا توجد طلبات جديدة.</p>
              ) : (
                <div className="col gap-2">
                  {inbox.map((row) => {
                    const live = liveMap[row.fromUid];
                    const photo = live?.photoURL ?? row.photoURL;
                    const name = live?.displayName ?? row.displayName;
                    const userName = live?.username ?? row.username;
                    return (
                      <SocialPlayerRow
                        key={row.fromUid}
                        displayName={name}
                        username={userName}
                        photoURL={photo}
                        cosmetic={live?.cosmetic}
                        xp={live?.xp ?? 0}
                        matchWins={live?.matchWins ?? 0}
                        trailing={
                          <div className="col gap-1" style={{ minWidth: 88 }}>
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              disabled={socialBusy === `in:${row.fromUid}`}
                              onClick={() => void respond(row.fromUid, true)}
                            >
                              قبول
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              disabled={socialBusy === `in:${row.fromUid}`}
                              onClick={() => void respond(row.fromUid, false)}
                            >
                              رفض
                            </button>
                          </div>
                        }
                      />
                    );
                  })}
                </div>
              )}
            </section>

            {outbox.length > 0 ? (
              <section className="surf mb-3" style={{ padding: 14 }}>
                <p className="h-display fw-7 text-md mb-2">طلبات مرسلة</p>
                <div className="col gap-2">
                  {outbox.map((row) => {
                    const live = liveMap[row.toUid];
                    const photo = live?.photoURL ?? row.photoURL;
                    const name = live?.displayName ?? row.displayName;
                    const userName = live?.username ?? row.username;
                    return (
                      <SocialPlayerRow
                        key={row.toUid}
                        displayName={name}
                        username={userName}
                        photoURL={photo}
                        cosmetic={live?.cosmetic}
                        xp={live?.xp ?? 0}
                        matchWins={live?.matchWins ?? 0}
                        subtitle="في انتظار الرد"
                        trailing={<span className="chip">معلّق</span>}
                      />
                    );
                  })}
                </div>
              </section>
            ) : null}

            <section className="surf mb-3" style={{ padding: 14 }}>
              <p className="h-display fw-7 text-md mb-2">بحث بالاسم العام</p>
              <div className="row gap-2">
                <input
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder="بدون @"
                  className="f-1"
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid oklch(0.78 0.04 65 / .4)",
                    background: "oklch(0.98 0.012 80)",
                    fontSize: 16,
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void runSearch();
                  }}
                />
                <button type="button" className="btn btn-primary btn-sm" disabled={searchBusy} onClick={() => void runSearch()}>
                  {searchBusy ? "…" : "بحث"}
                </button>
              </div>
              <div className="col gap-2 mt-3">
                {hits.map((h) => (
                  <div key={h.uid} className="surf row gap-2" style={{ padding: 10, alignItems: "center" }}>
                    <ProfileAvatar cosmetic={undefined} fallbackPhotoURL={h.photoURL} displayName={h.displayName} size="sm" idle />
                    <div className="f-1" style={{ minWidth: 0 }}>
                      <p className="text-sm fw-7 truncate">@{h.username}</p>
                      <p className="text-xs muted truncate">{h.displayName}</p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      disabled={socialBusy === h.uid}
                      onClick={() => void sendRequest(h.uid)}
                    >
                      إضافة
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <p className="h-display fw-7 text-md mb-2 px-1">قائمة الأصدقاء</p>
            {friends.length === 0 ? (
              <div className="surf center col" style={{ padding: 24, textAlign: "center" }}>
                <ShellIcon name="friends" size={32} color="var(--fg-3)" />
                <p className="text-sm muted mt-2">لا يوجد أصدقاء بعد.</p>
              </div>
            ) : (
              <div className="col gap-2">
                {friends.map((f) => {
                  const p = liveMap[f.friendUid];
                  const raw = p?.gamePresence ?? "offline";
                  const ts = p?.gamePresenceUpdatedAtMs
                    ? ({ toMillis: () => p.gamePresenceUpdatedAtMs! } as Timestamp)
                    : null;
                  const eff = clientEffectivePresence(raw, ts);
                  return (
                    <SocialPlayerRow
                      key={f.friendUid}
                      displayName={p?.displayName ?? p?.username ?? "…"}
                      username={p?.username ?? ""}
                      photoURL={p?.photoURL ?? null}
                      cosmetic={p?.cosmetic}
                      xp={p?.xp ?? 0}
                      matchWins={p?.matchWins ?? 0}
                      subtitle={presenceLabelAr(eff)}
                      trailing={
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          disabled={socialBusy === `rm:${f.friendUid}`}
                          onClick={() => void remove(f.friendUid)}
                        >
                          إزالة
                        </button>
                      }
                    />
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </ShellScreen>
  );
}

export default function ProfileFriendsPage() {
  return (
    <AuthGate>
      <FriendsPageInner />
    </AuthGate>
  );
}
