"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, type Timestamp } from "firebase/firestore";
import { AuthGate } from "@/components/auth/AuthGate";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getFirebaseDb } from "@/lib/firebase/client";
import { col, userSub } from "@/lib/firestore/paths";
import { isFullAccountUser } from "@/lib/auth/google-user";
import { postSocial, getSocial } from "@/lib/api/social-client";
import { useLiveUserProfiles } from "@/hooks/useLiveUserProfiles";
import { useDefaultOnlinePresence } from "@/hooks/useDefaultOnlinePresence";
import { clientEffectivePresence } from "@/lib/social/game-presence-client";
import { presenceLabelAr } from "@/lib/social/presence-constants";
import { validateUsernameInput } from "@/lib/social/username";
import { playUIButton, resumeAudioContext } from "@/lib/audio/game-sounds";

type FriendRow = { friendUid: string };
type InboxRow = {
  fromUid: string;
  displayName: string;
  photoURL: string | null;
  username: string;
};

type SearchHit = {
  uid: string;
  username: string;
  displayName: string;
  photoURL: string | null;
};

export default function FriendsPage() {
  return (
    <AuthGate>
      <FriendsInner />
    </AuthGate>
  );
}

function FriendsInner() {
  const router = useRouter();
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const google = isFullAccountUser(user);
  useDefaultOnlinePresence(uid, google);

  const [friends, setFriends] = useState<FriendRow[]>([]);
  const [inbox, setInbox] = useState<InboxRow[]>([]);
  const [usernameDraft, setUsernameDraft] = useState("");
  const [usernameBusy, setUsernameBusy] = useState(false);
  const [usernameErr, setUsernameErr] = useState<string | null>(null);
  const [searchQ, setSearchQ] = useState("");
  const [searchBusy, setSearchBusy] = useState(false);
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [socialBusy, setSocialBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!uid || !google) {
      setFriends([]);
      setInbox([]);
      return;
    }
    const db = getFirebaseDb();
    const u1 = onSnapshot(
      collection(db, col.users, uid, userSub.friends),
      (snap) => {
        setFriends(snap.docs.map((d) => ({ friendUid: d.id })).sort((a, b) => (a.friendUid > b.friendUid ? 1 : -1)));
      },
      () => setFriends([]),
    );
    const u2 = onSnapshot(
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
    return () => {
      u1();
      u2();
    };
  }, [uid, google]);

  const selfUids = useMemo(() => (uid ? [uid] : []), [uid]);
  const selfLive = useLiveUserProfiles(selfUids);
  const myUsername = uid ? selfLive[uid]?.username : null;

  useEffect(() => {
    if (myUsername) setUsernameDraft(myUsername);
  }, [myUsername]);

  const friendUids = useMemo(() => friends.map((f) => f.friendUid), [friends]);
  const friendLive = useLiveUserProfiles(friendUids);

  const saveUsername = async () => {
    if (!uid) return;
    resumeAudioContext();
    playUIButton();
    const v = validateUsernameInput(usernameDraft);
    if (!v.ok) {
      setUsernameErr(v.error);
      return;
    }
    setUsernameBusy(true);
    setUsernameErr(null);
    try {
      await postSocial("/api/social/username", { username: v.usernameDisplay });
    } catch (e) {
      setUsernameErr(e instanceof Error ? e.message : "تعذر الحفظ");
    } finally {
      setUsernameBusy(false);
    }
  };

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
      // toast optional
    } finally {
      setSocialBusy(null);
    }
  };

  const respond = async (fromUid: string, accept: boolean) => {
    resumeAudioContext();
    playUIButton();
    setSocialBusy(fromUid);
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

  if (!google) {
    return (
      <div
        dir="rtl"
        className="relative min-h-[100dvh] w-full overflow-x-hidden select-none"
        style={{
          background: "radial-gradient(120% 70% at 50% 0%, #FFF1DF 0%, #FCE8D2 55%, #FFEFD8 100%)",
        }}
      >
        <div className="relative z-10 mx-auto max-w-md px-4 py-16 text-center sm:max-w-lg">
          <p className="text-lg font-black text-[#8a3f16]">الأصدقاء — حساب كامل</p>
          <p className="mt-2 text-sm font-semibold text-[#bc7a45]">
            سجّل الدخول بـ Google أو رابط البريد لاستخدام الأسماء المستعارة والأصدقاء والدعوات.
          </p>
          <Button type="button" className="mt-6" onClick={() => router.push("/login?next=/friends")}>
            تسجيل الدخول
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className="relative min-h-[100dvh] w-full overflow-x-hidden select-none"
      style={{
        background: "radial-gradient(120% 70% at 50% 0%, #FFF1DF 0%, #FCE8D2 55%, #FFEFD8 100%)",
      }}
    >
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <motion.div
          animate={{ y: [0, -18, 0], opacity: [0.35, 0.55, 0.35] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute -right-20 top-24 h-64 w-64 rounded-full bg-[#FFCB8A]/45 blur-3xl"
        />
        <motion.div
          animate={{ y: [0, 14, 0] }}
          transition={{ duration: 10, repeat: Infinity, delay: 1 }}
          className="absolute -left-24 bottom-32 h-72 w-72 rounded-full bg-[#FFB574]/35 blur-3xl"
        />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-md px-4 pb-12 pt-[max(1rem,env(safe-area-inset-top))] sm:max-w-lg sm:px-6">
        <header className="mb-5 flex items-center justify-between gap-3">
          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={() => router.push("/")}
            className="rounded-2xl bg-white/90 px-4 py-2 text-sm font-extrabold text-[#8a3f16] shadow-[0_4px_14px_rgba(196,134,82,0.22)] ring-1 ring-[#f4d4b0]"
          >
            رجوع
          </motion.button>
          <h1
            className="text-xl font-black sm:text-2xl"
            style={{
              background: "linear-gradient(180deg,#FF9F0A 0%,#E0660A 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            الأصدقاء
          </h1>
          <span className="w-14" />
        </header>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 rounded-[1.75rem] border border-white/80 bg-white/95 p-5 shadow-[0_18px_44px_rgba(196,134,82,0.2)]"
        >
          <p className="text-sm font-black text-[#8a3f16]">اسم المستخدم العام</p>
          <p className="mt-1 text-xs font-semibold text-[#bc7a45]">فريد عالمياً — يمكن تغييره مرة كل 24 ساعة.</p>
          <div className="mt-3 flex gap-2">
            <div className="relative min-w-0 flex-1">
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-lg font-black text-[#ea8c2f]">
                @
              </span>
              <Input
                value={usernameDraft}
                onChange={(e) => setUsernameDraft(e.target.value)}
                placeholder="shehab"
                className="min-h-[48px] pr-8"
                disabled={usernameBusy}
              />
            </div>
            <Button type="button" className="min-h-[48px] shrink-0 px-5" disabled={usernameBusy} onClick={() => void saveUsername()}>
              {usernameBusy ? "…" : "حفظ"}
            </Button>
          </div>
          {usernameErr ? <p className="mt-2 text-sm font-bold text-red-700">{usernameErr}</p> : null}
          {myUsername ? (
            <p className="mt-3 text-center text-xs font-bold text-emerald-700">اسمك الحالي: @{myUsername}</p>
          ) : (
            <p className="mt-3 text-center text-xs font-bold text-amber-700">أنشئ اسم مستخدم للبحث وإرسال الطلبات.</p>
          )}
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-5 rounded-[1.75rem] border border-[#f4d4af] bg-[#fffaf5] p-4 shadow-inner"
        >
          <p className="mb-2 text-sm font-black text-[#8a3f16]">بحث عن لاعبين</p>
          <div className="flex gap-2">
            <Input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="@ghost"
              className="min-h-[44px] flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter") void runSearch();
              }}
            />
            <Button type="button" className="min-h-[44px] shrink-0 px-4" disabled={searchBusy} onClick={() => void runSearch()}>
              بحث
            </Button>
          </div>
          <div className="mt-3 space-y-2">
            <AnimatePresence initial={false}>
              {hits.map((h) => (
                <motion.div
                  key={h.uid}
                  layout
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  className="flex items-center gap-3 rounded-2xl border border-white/80 bg-white/95 px-3 py-2 shadow-sm"
                >
                  <ProfileAvatar
                    cosmetic={undefined}
                    fallbackPhotoURL={h.photoURL}
                    displayName={h.displayName}
                    size="sm"
                    idle
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-[#5e3011]">@{h.username}</p>
                    <p className="truncate text-xs text-[#bc7a45]">{h.displayName}</p>
                  </div>
                  <Button
                    type="button"
                    className="shrink-0 px-3 py-2 text-xs"
                    disabled={!myUsername || socialBusy === h.uid}
                    onClick={() => void sendRequest(h.uid)}
                  >
                    {socialBusy === h.uid ? "…" : "إضافة"}
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.section>

        {inbox.length > 0 ? (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 rounded-[1.75rem] border border-[#ede9fe] bg-[#faf5ff] p-4 shadow-[0_12px_30px_rgba(139,92,246,0.12)]"
          >
            <p className="mb-3 text-sm font-black text-[#5b21b6]">طلبات واردة</p>
            <ul className="space-y-2">
              {inbox.map((row) => (
                <li
                  key={row.fromUid}
                  className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/80 bg-white/95 px-3 py-2.5"
                >
                  <ProfileAvatar
                    cosmetic={undefined}
                    fallbackPhotoURL={row.photoURL}
                    displayName={row.displayName}
                    size="sm"
                    idle
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-[#5e3011]">{row.displayName}</p>
                    <p className="text-xs font-bold text-[#bc7a45]">@{row.username || "…"}</p>
                  </div>
                  <div className="flex w-full gap-2 sm:w-auto sm:flex-initial">
                    <Button
                      type="button"
                      variant="ghost"
                      className="min-h-[40px] flex-1 text-xs"
                      disabled={socialBusy === row.fromUid}
                      onClick={() => void respond(row.fromUid, false)}
                    >
                      رفض
                    </Button>
                    <Button
                      type="button"
                      className="min-h-[40px] flex-1 text-xs"
                      disabled={socialBusy === row.fromUid}
                      onClick={() => void respond(row.fromUid, true)}
                    >
                      قبول
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </motion.section>
        ) : null}

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="rounded-[1.75rem] border border-white/80 bg-white/95 p-4 shadow-[0_18px_44px_rgba(196,134,82,0.18)]"
        >
          <p className="mb-3 text-sm font-black text-[#8a3f16]">قائمة الأصدقاء</p>
          {friends.length === 0 ? (
            <p className="py-10 text-center text-sm font-semibold text-[#bc7a45]">ابدأ بإرسال طلب من البحث أعلاه.</p>
          ) : (
            <ul className="space-y-2">
              {friends.map((f) => {
                const p = friendLive[f.friendUid];
                const raw = p?.gamePresence ?? "offline";
                const ts = p?.gamePresenceUpdatedAtMs
                  ? ({ toMillis: () => p.gamePresenceUpdatedAtMs! } as Timestamp)
                  : null;
                const eff = clientEffectivePresence(raw, ts);
                return (
                  <motion.li
                    layout
                    key={f.friendUid}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="flex items-center gap-3 rounded-2xl border border-[#f4d4b0] bg-gradient-to-l from-[#fffaf5] to-white px-3 py-2.5"
                  >
                    <div className="relative shrink-0">
                      <ProfileAvatar
                        cosmetic={p?.cosmetic}
                        fallbackPhotoURL={null}
                        displayName={p?.displayName ?? undefined}
                        size="md"
                        idle
                        active={eff === "online" || eff === "in_lobby"}
                      />
                      <motion.span
                        className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-white ${
                          eff === "online" || eff === "in_lobby"
                            ? "bg-emerald-400"
                            : eff === "matchmaking" || eff === "in_match"
                              ? "bg-amber-400"
                              : "bg-slate-300"
                        }`}
                        animate={
                          eff === "online" || eff === "in_lobby"
                            ? { scale: [1, 1.25, 1], opacity: [0.8, 1, 0.8] }
                            : {}
                        }
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-[#5e3011]">
                        {p?.username ? `@${p.username}` : p?.displayName ?? f.friendUid.slice(0, 8)}
                      </p>
                      <p className="text-[11px] font-bold text-[#bc7a45]">{presenceLabelAr(eff)}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      className="shrink-0 px-2 py-1.5 text-[11px] font-bold text-[#b45309]"
                      disabled={socialBusy === `rm:${f.friendUid}`}
                      onClick={() => void remove(f.friendUid)}
                    >
                      إزالة
                    </Button>
                  </motion.li>
                );
              })}
            </ul>
          )}
        </motion.section>
      </div>
    </div>
  );
}
