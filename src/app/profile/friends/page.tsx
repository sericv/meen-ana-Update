"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, type Timestamp } from "firebase/firestore";
import { AuthGate } from "@/components/auth/AuthGate";
import { AccountSubpageLayout } from "@/components/profile/AccountSubpageLayout";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/components/providers/AuthProvider";
import { useDefaultOnlinePresence } from "@/hooks/useDefaultOnlinePresence";
import { useLiveUserProfiles } from "@/hooks/useLiveUserProfiles";
import { playUIButton, resumeAudioContext } from "@/lib/audio/game-sounds";
import { getFirebaseDb } from "@/lib/firebase/client";
import { col, userSub } from "@/lib/firestore/paths";
import { isFullAccountUser } from "@/lib/auth/google-user";
import { postSocial, getSocial } from "@/lib/api/social-client";
import { clientEffectivePresence } from "@/lib/social/game-presence-client";
import { presenceLabelAr } from "@/lib/social/presence-constants";

type FriendRow = { friendUid: string };
type SearchHit = { uid: string; username: string; displayName: string; photoURL: string | null };

function FriendsPageInner() {
  const router = useRouter();
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const google = isFullAccountUser(user);
  useDefaultOnlinePresence(uid, google);

  const [friends, setFriends] = useState<FriendRow[]>([]);
  const [searchQ, setSearchQ] = useState("");
  const [searchBusy, setSearchBusy] = useState(false);
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [socialBusy, setSocialBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!uid || !google) {
      setFriends([]);
      return;
    }
    const db = getFirebaseDb();
    return onSnapshot(
      collection(db, col.users, uid, userSub.friends),
      (snap) =>
        setFriends(snap.docs.map((d) => ({ friendUid: d.id })).sort((a, b) => (a.friendUid > b.friendUid ? 1 : -1))),
      () => setFriends([]),
    );
  }, [uid, google]);

  const friendUids = useMemo(() => friends.map((f) => f.friendUid), [friends]);
  const friendLive = useLiveUserProfiles(friendUids);
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
    } catch {
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

  if (!google) {
    return (
      <AccountSubpageLayout title="الأصدقاء">
        <div className="rounded-[1.5rem] border border-white/80 bg-white/90 p-8 text-center shadow-inner">
          <p className="text-base font-black text-[#8a3f16]">يتطلب Google</p>
          <p className="mt-2 text-sm font-semibold text-[#a16231]">سجّل الدخول بـ Google لإدارة الأصدقاء.</p>
          <Button type="button" className="mt-6" onClick={() => router.push("/login?next=/profile/friends")}>
            المتابعة عبر Google
          </Button>
        </div>
      </AccountSubpageLayout>
    );
  }

  if (!myUsername) {
    return (
      <AccountSubpageLayout title="الأصدقاء">
        <div className="rounded-[1.5rem] border border-amber-200/80 bg-amber-50/90 p-6 text-center">
          <p className="text-sm font-extrabold text-[#92400e]">أنشئ اسمك العام أولاً من «المظهر والاسم» لإضافة أصدقاء.</p>
          <Button type="button" className="mt-5" onClick={() => router.push("/profile/appearance")}>
            المظهر والاسم
          </Button>
        </div>
      </AccountSubpageLayout>
    );
  }

  return (
    <AccountSubpageLayout title="الأصدقاء">
      <section className="mb-5 overflow-hidden rounded-[1.75rem] glass-card p-5">
        <p className="mb-3 text-sm font-black text-[#8a3f16]">بحث بالاسم العام</p>
        <div className="flex gap-2">
          <Input
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="بدون @"
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter") void runSearch();
            }}
          />
          <Button type="button" className="shrink-0 px-4" disabled={searchBusy} onClick={() => void runSearch()}>
            {searchBusy ? "…" : "بحث"}
          </Button>
        </div>
        <div className="mt-3 space-y-2">
          <AnimatePresence initial={false}>
            {hits.map((h) => (
              <motion.div
                key={h.uid}
                layout
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 rounded-2xl border border-[#f4e0c8]/90 bg-white/90 px-3 py-2.5"
              >
                <ProfileAvatar cosmetic={undefined} fallbackPhotoURL={h.photoURL} displayName={h.displayName} size="sm" idle />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-[#5e3011]">@{h.username}</p>
                  <p className="truncate text-xs text-[#bc7a45]">{h.displayName}</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  disabled={socialBusy === h.uid}
                  onClick={() => void sendRequest(h.uid)}
                  className="shrink-0"
                >
                  إضافة
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </section>

      <section className="overflow-hidden rounded-[1.75rem] glass-card p-5">
        <p className="mb-4 text-sm font-black text-[#8a3f16]">قائمة الأصدقاء</p>
        {friends.length === 0 ? (
          <p className="py-10 text-center text-sm font-semibold text-[#a16231]">لا يوجد أصدقاء بعد.</p>
        ) : (
          <ul className="space-y-2">
            {friends.map((f) => {
              const p = friendLive[f.friendUid];
              const raw = p?.gamePresence ?? "offline";
              const ts = p?.gamePresenceUpdatedAtMs
                ? ({ toMillis: () => p.gamePresenceUpdatedAtMs! } as Timestamp)
                : null;
              const eff = clientEffectivePresence(raw, ts);
              const isOnline = eff === "online" || eff === "in_lobby";
              const isActive = eff === "matchmaking" || eff === "in_match";
              const dotColor = isOnline ? "bg-emerald-400" : isActive ? "bg-amber-400" : "bg-slate-300";
              return (
                <li key={f.friendUid} className="flex items-center gap-3 rounded-2xl border border-[#f4e0c8]/80 bg-white/90 px-3 py-3">
                  <div className="relative shrink-0">
                    <ProfileAvatar
                      cosmetic={p?.cosmetic}
                      fallbackPhotoURL={null}
                      displayName={p?.displayName ?? undefined}
                      size="md"
                      idle
                      active={isOnline}
                    />
                    <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-white ${dotColor}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-[#5e3011]">
                      {p?.username ? `@${p.username}` : p?.displayName ?? "…"}
                    </p>
                    <p className={`text-[11px] font-bold ${isOnline ? "text-emerald-600" : "text-[#bc7a45]"}`}>
                      {presenceLabelAr(eff)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={socialBusy === `rm:${f.friendUid}`}
                    onClick={() => void remove(f.friendUid)}
                  >
                    إزالة
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </AccountSubpageLayout>
  );
}

export default function ProfileFriendsPage() {
  return (
    <AuthGate>
      <FriendsPageInner />
    </AuthGate>
  );
}
