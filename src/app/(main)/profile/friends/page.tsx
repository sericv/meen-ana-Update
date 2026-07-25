"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, onSnapshot, type Timestamp } from "firebase/firestore";
import { AuthGate } from "@/components/auth/AuthGate";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { useAuth } from "@/components/providers/AuthProvider";
import { useDefaultOnlinePresence } from "@/hooks/useDefaultOnlinePresence";
import { useIncomingFriendRequestCount } from "@/hooks/useIncomingFriendRequestCount";
import { useLiveUserProfiles } from "@/hooks/useLiveUserProfiles";
import { playUIButton, resumeAudioContext } from "@/lib/audio/game-sounds";
import { getFirebaseDb } from "@/lib/firebase/client";
import { col, userSub } from "@/lib/firestore/paths";
import { isFullAccountUser } from "@/lib/auth/google-user";
import { postSocial, getSocial } from "@/lib/api/social-client";
import { clientEffectivePresence } from "@/lib/social/game-presence-client";
import { presenceLabelAr } from "@/lib/social/presence-constants";
import { levelFromXp } from "@/lib/profile/level";
import { motion, AnimatePresence } from "framer-motion";
import type { PlayerCosmetic } from "@/lib/profile/cosmetics";
import { usePlayerProfileModal } from "@/components/providers/PlayerProfileModalProvider";

type FriendRow = { friendUid: string };
type SearchHit = { uid: string; username: string; displayName: string; photoURL: string | null };

type InboxRow = {
  fromUid: string;
  displayName: string;
  photoURL: string | null;
  username: string;
};

function FriendsPageInner() {
  const router = useRouter();
  const { user } = useAuth();
  const { openProfile } = usePlayerProfileModal();
  const uid = user?.uid ?? null;
  const google = isFullAccountUser(user);
  useDefaultOnlinePresence(uid, google);
  const pendingIncoming = useIncomingFriendRequestCount(uid, google);

  const [friends, setFriends] = useState<FriendRow[]>([]);
  const [inbox, setInbox] = useState<InboxRow[]>([]);
  
  // Search states
  const [searchQ, setSearchQ] = useState("");
  const [searchBusy, setSearchBusy] = useState(false);
  const [hits, setHits] = useState<SearchHit[]>([]);
  
  // UI states
  const [socialBusy, setSocialBusy] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showSearchBox, setShowSearchBox] = useState(false);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  useEffect(() => {
    if (!uid || !google) {
      setFriends([]);
      setInbox([]);
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
    return () => {
      uFriends();
      uInbox();
    };
  }, [uid, google]);

  const friendUids = useMemo(() => friends.map((f) => f.friendUid), [friends]);
  const requestUids = useMemo(() => inbox.map((r) => r.fromUid), [inbox]);
  const liveUids = useMemo(() => [...new Set([...friendUids, ...requestUids])], [friendUids, requestUids]);
  const liveMap = useLiveUserProfiles(liveUids);
  const selfLive = useLiveUserProfiles(uid ? [uid] : []);
  const myUsername = uid ? selfLive[uid]?.username : null;

  // Filter online friends for the horizontal slider
  const onlineFriends = useMemo(() => {
    return friends.filter((f) => {
      const p = liveMap[f.friendUid];
      const raw = p?.gamePresence ?? "offline";
      const ts = p?.gamePresenceUpdatedAtMs
        ? ({ toMillis: () => p.gamePresenceUpdatedAtMs! } as Timestamp)
        : null;
      const eff = clientEffectivePresence(raw, ts);
      return eff !== "offline" && eff !== "away";
    });
  }, [friends, liveMap]);

  const runSearch = useCallback(async () => {
    const q = searchQ.trim();
    if (q.length < 2) {
      setHits([]);
      triggerToast("يرجى كتابة حرفين على الأقل للبحث");
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
      triggerToast("تم إرسال طلب الصداقة بنجاح!");
      setSearchQ("");
      setHits([]);
    } catch (e: any) {
      triggerToast(e?.message || "تعذر إرسال الطلب");
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
      triggerToast(accept ? "تم قبول طلب الصداقة 🎉" : "تم رفض الطلب");
    } catch (e: any) {
      triggerToast(e?.message || "فشلت العملية");
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
      triggerToast("تم إزالة الصديق من قائمتك");
    } catch (e: any) {
      triggerToast(e?.message || "تعذر إزالة الصديق");
    } finally {
      setSocialBusy(null);
    }
  };

  const handleCopyCode = () => {
    resumeAudioContext();
    playUIButton();
    if (myUsername) {
      navigator.clipboard.writeText(myUsername);
      triggerToast("تم نسخ اسمك العام للمشاركة! 📋");
    } else {
      triggerToast("لا يوجد اسم عام للمشاركة");
    }
  };

  return (
    <div className="shell-screen relative bg-[#FAFAF8]" dir="rtl">
      
      {/* Background low-opacity decals */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
        <div className="absolute top-[12%] left-[10%] text-amber-500/5 text-xl animate-pulse">✦</div>
        <div className="absolute top-[55%] right-[10%] text-purple-500/5 text-xl animate-pulse">✦</div>
        <div className="absolute bottom-[22%] left-[12%] text-rose-500/5 text-xl animate-pulse">✦</div>
      </div>

      {/* Floating Double-Bezel Header */}
      <div className="mx-4 mt-5 p-1 bg-slate-900/5 ring-1 ring-black/5 rounded-[22px] relative z-10">
        <div className="bg-white/95 rounded-[17px] p-2 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200/50 flex items-center justify-center active:scale-95 transition-transform"
              onClick={() => router.push("/")}
              aria-label="رجوع"
              style={{ cursor: "pointer" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
            <div className="flex flex-col text-right justify-center" style={{ lineHeight: 1.15 }}>
              <span className="h-display text-sm font-black text-slate-800">الأصدقاء</span>
              <span className="text-[8px] text-slate-400 font-bold mt-0.5">تواصل والعب مع أصدقائك</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {pendingIncoming > 0 && (
              <span className="bg-rose-500 text-white text-[9px] font-black px-2.5 py-1 rounded-full animate-bounce">
                {pendingIncoming} طلبات
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="f-1 scroll-y" style={{ padding: "14px 16px 85px" }}>
        {!google ? (
          <div className="game-card-outer text-center mt-6">
            <div className="game-card-inner p-6 bg-white border border-slate-100 rounded-[22px] flex flex-col items-center">
              <p className="h-display text-sm font-black text-slate-800">يتطلب حساب Google 👥</p>
              <p className="text-[10px] text-slate-400 font-bold mt-1">سجّل الدخول بـ Google لإدارة قائمة أصدقائك واللعب سوياً.</p>
              <button
                type="button"
                className="mt-5 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-purple-400 border border-purple-800 text-white text-xs font-black rounded-xl active:scale-95 transition-transform"
                onClick={() => router.push("/login?next=/profile/friends")}
                style={{ cursor: "pointer" }}
              >
                المتابعة عبر Google
              </button>
            </div>
          </div>
        ) : !myUsername ? (
          <div className="game-card-outer text-center mt-6">
            <div className="game-card-inner p-6 bg-white border border-slate-100 rounded-[22px] flex flex-col items-center">
              <p className="text-xs font-black text-slate-800">أنشئ اسمك العام أولاً من إعدادات الحساب لتتمكن من التفاعل.</p>
              <button 
                type="button" 
                className="mt-5 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-purple-400 border border-purple-800 text-white text-xs font-black rounded-xl active:scale-95 transition-transform" 
                onClick={() => router.push("/profile?tab=settings")}
                style={{ cursor: "pointer" }}
              >
                الإعدادات العامة
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            
            {/* Social Welcoming Hero Banner */}
            <div className="game-card-outer">
              <div
                className="game-card-inner p-5 text-white rounded-[26px] flex items-center justify-between relative overflow-hidden"
                style={{ background: "linear-gradient(135deg, #8B5CF6 0%, #5B21B6 100%)" }}
              >
                {/* Decorative background glow blobs */}
                <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-white/5 blur-2xl pointer-events-none" />
                <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-purple-400/10 blur-xl pointer-events-none animate-pulse" />

                <div className="flex-1 pr-1 text-right z-10">
                  <span className="text-[9px] font-black tracking-wider bg-white/15 px-3 py-1 rounded-full text-white inline-block">
                    المجلس الاجتماعي
                  </span>
                  <h3 className="h-display text-base font-black text-white mt-3">
                    تحدَّ أصدقاءك الآن!
                  </h3>
                  <p className="text-[10.5px] text-purple-100 mt-2.5 font-bold leading-relaxed max-w-[200px]">
                    العبوا وتحدثوا سوياً لتخمنوا الكروت التي تحملونها على رؤوسكم.
                  </p>
                </div>

                {/* Handcrafted Vector Multiplayer Illustration */}
                <div className="flex-shrink-0 relative w-24 h-24 flex items-center justify-center overflow-visible">
                  {/* Floating sparkles */}
                  <motion.span
                    animate={{
                      scale: [0.8, 1.2, 0.8],
                      opacity: [0.25, 0.65, 0.25],
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-2 right-2 text-yellow-300 text-xs pointer-events-none select-none"
                  >
                    ✦
                  </motion.span>
                  <motion.span
                    animate={{
                      scale: [1.2, 0.8, 1.2],
                      opacity: [0.3, 0.7, 0.3],
                    }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                    className="absolute bottom-2 left-2 text-purple-200 text-sm pointer-events-none select-none"
                  >
                    ✦
                  </motion.span>

                  {/* Character cards */}
                  <motion.div
                    animate={{
                      y: [0, -4, 0],
                      rotate: [-2, 2, -2]
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="relative w-16 h-16"
                  >
                    {/* Blue Card (Player A) */}
                    <motion.div
                      animate={{ rotate: [-6, -4, -6] }}
                      className="absolute left-1 top-2 w-10 h-13 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg border border-white/20 shadow-md flex flex-col items-center justify-center p-1"
                    >
                      <span className="text-[10px] text-white">👤</span>
                      <span className="text-[6px] text-blue-100 font-bold mt-0.5">لاعب أ</span>
                    </motion.div>

                    {/* Pink Card (Player B) */}
                    <motion.div
                      animate={{ rotate: [6, 4, 6] }}
                      className="absolute right-1 top-1 w-10 h-13 bg-gradient-to-br from-pink-400 to-rose-500 rounded-lg border border-white/20 shadow-md flex flex-col items-center justify-center p-1"
                    >
                      <span className="text-[10px] text-white">👤</span>
                      <span className="text-[6px] text-pink-100 font-bold mt-0.5">لاعب ب</span>
                    </motion.div>

                    {/* Speech bubble above */}
                    <motion.div
                      animate={{
                        y: [0, -3, 0],
                        scale: [1, 1.05, 1],
                      }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute -top-3 left-4 bg-white text-purple-600 rounded-full px-2 py-0.5 shadow-sm border border-purple-100 flex items-center justify-center text-[10px] font-black"
                    >
                      ؟
                    </motion.div>
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="flex gap-2 justify-between">
              <button
                type="button"
                onClick={() => setShowSearchBox(!showSearchBox)}
                className="flex-1 py-3.5 bg-white border border-slate-200/50 rounded-2xl flex flex-col items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-transform"
                style={{ cursor: "pointer" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <line x1="20" y1="8" x2="20" y2="14" />
                  <line x1="23" y1="11" x2="17" y2="11" />
                </svg>
                <span className="text-[10px] font-black text-slate-700">إضافة صديق</span>
              </button>

              <button
                type="button"
                onClick={handleCopyCode}
                className="flex-1 py-3.5 bg-white border border-slate-200/50 rounded-2xl flex flex-col items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-transform"
                style={{ cursor: "pointer" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
                <span className="text-[10px] font-black text-slate-700">مشاركة كودي</span>
              </button>
            </div>

            {/* Live Search Box (toggled) */}
            <AnimatePresence>
              {showSearchBox && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="game-card-outer overflow-hidden"
                >
                  <div className="game-card-inner p-4.5 bg-white border border-slate-100 flex flex-col gap-3 rounded-[24px]">
                    <SectionLabel title="بحث عن أصدقاء" desc="أدخل الاسم العام للاعب بدون الرمز @" />
                    
                    <div className="flex items-center gap-2 w-full">
                      <input
                        value={searchQ}
                        onChange={(e) => setSearchQ(e.target.value)}
                        placeholder="ابحث عن صديق بالاسم العام..."
                        className="flex-1 bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-300"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void runSearch();
                        }}
                      />
                      <button 
                        type="button" 
                        className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-400 border border-purple-800 text-white text-xs font-black rounded-xl active:scale-95 transition-transform disabled:opacity-40" 
                        disabled={searchBusy} 
                        onClick={() => void runSearch()}
                        style={{ cursor: "pointer" }}
                      >
                        {searchBusy ? "…" : "بحث"}
                      </button>
                    </div>

                    {hits.length > 0 && (
                      <div className="flex flex-col gap-2.5 mt-2.5 border-t border-slate-50 pt-2.5">
                        {hits.map((h) => (
                          <div key={h.uid} className="flex items-center justify-between gap-3 p-2 bg-slate-50 border border-slate-100/50 rounded-xl text-right">
                            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => openProfile(h.uid, { screen: "friends" })}>
                              <ProfileAvatar cosmetic={undefined} fallbackPhotoURL={h.photoURL} displayName={h.displayName} size="sm" idle />
                              <div className="flex flex-col text-right justify-center" style={{ lineHeight: 1.15 }}>
                                <span className="text-xs font-black text-slate-800">@{h.username}</span>
                                <span className="text-[9px] text-slate-400 font-bold">{h.displayName}</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-purple-400 border border-purple-800 text-white text-[10px] font-black rounded-full active:scale-95 transition-transform"
                              disabled={socialBusy === h.uid}
                              onClick={() => void sendRequest(h.uid)}
                              style={{ cursor: "pointer" }}
                            >
                              {socialBusy === h.uid ? "…" : "إضافة"}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Online Friends Section */}
            {onlineFriends.length > 0 && (
              <div className="flex flex-col gap-2">
                <SectionLabel title="الأصدقاء المتصلون" desc="أصدقاؤك المتصلون باللعبة حالياً" />
                <div 
                  className="flex gap-4 overflow-x-auto pb-3 pr-0.5 scroll-x select-none"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  {onlineFriends.map((f) => {
                    const p = liveMap[f.friendUid];
                    const name = p?.displayName ?? p?.username ?? "صديق";
                    const raw = p?.gamePresence ?? "online";
                    const ts = p?.gamePresenceUpdatedAtMs
                      ? ({ toMillis: () => p.gamePresenceUpdatedAtMs! } as Timestamp)
                      : null;
                    const eff = clientEffectivePresence(raw, ts);
                    return (
                      <div key={f.friendUid} className="w-20 flex-shrink-0 select-none">
                        <div className="flex flex-col items-center gap-1.5 text-center cursor-pointer" onClick={() => openProfile(f.friendUid, { screen: "friends" })}>
                          <div className="relative p-0.5 rounded-full bg-white ring-2 ring-emerald-500/80 shadow-md">
                            <ProfileAvatar
                              cosmetic={p?.cosmetic}
                              fallbackPhotoURL={p?.photoURL ?? null}
                              displayName={name}
                              size="sm"
                              idle
                            />
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border border-white animate-pulse" />
                          </div>
                          <span className="text-[9.5px] font-black text-slate-800 truncate max-w-[64px]">
                            {name}
                          </span>
                          <span className="text-[7.5px] font-black text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full leading-none">
                            {presenceLabelAr(eff)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Friend Requests (Incoming) */}
            {inbox.length > 0 && (
              <div className="flex flex-col gap-2">
                <SectionLabel title="طلبات الصداقة الواردة" desc="لاعبون يرغبون في إضافتك إلى قائمتهم" />
                <div className="flex flex-col gap-3">
                  {inbox.map((row) => {
                    const live = liveMap[row.fromUid];
                    const photo = live?.photoURL ?? row.photoURL;
                    const name = live?.displayName ?? row.displayName;
                    const userName = live?.username ?? row.username;
                    return (
                      <motion.div 
                        key={row.fromUid}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="game-card-outer"
                      >
                        <div className="game-card-inner p-3.5 bg-white border border-slate-100 rounded-2xl flex items-center justify-between shadow-sm">
                           <div className="flex items-center gap-3 cursor-pointer" onClick={() => openProfile(row.fromUid, { screen: "friends" })}>
                             <ProfileAvatar cosmetic={live?.cosmetic} fallbackPhotoURL={photo} displayName={name} size="md" idle />
                             <div className="flex flex-col text-right justify-center" style={{ lineHeight: 1.15 }}>
                               <span className="text-xs font-black text-slate-800">{name}</span>
                               <span className="text-[9px] text-slate-400 font-bold">{userName ? `@${userName}` : ""}</span>
                             </div>
                           </div>
                          
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-purple-400 border border-purple-800 text-white text-[10px] font-black active:scale-95 transition-transform"
                              disabled={socialBusy === `in:${row.fromUid}`}
                              onClick={() => void respond(row.fromUid, true)}
                              style={{ cursor: "pointer" }}
                            >
                              قبول
                            </button>
                            <button
                              type="button"
                              className="px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-black active:scale-95 transition-transform"
                              disabled={socialBusy === `in:${row.fromUid}`}
                              onClick={() => void respond(row.fromUid, false)}
                              style={{ cursor: "pointer" }}
                            >
                              رفض
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* General Friends List */}
            <div className="flex flex-col gap-2">
              <SectionLabel title="قائمة الأصدقاء" desc="قائمة بجميع أصدقائك المضافين باللعبة" />
              
              {friends.length === 0 ? (
                /* Empty state */
                <div className="game-card-outer text-center mt-2">
                  <div className="game-card-inner p-8 bg-white border border-slate-100 rounded-[28px] flex flex-col items-center justify-center gap-3 min-h-[160px]">
                    <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center border border-slate-150 text-slate-400">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-black text-slate-800">لا يوجد أصدقاء بعد</span>
                      <span className="text-[9.5px] text-slate-400 font-bold leading-normal">
                        أضف أصدقاءك لتتمكن من اللعب والتحدي معهم في غرف خاصة!
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowSearchBox(true)}
                      className="mt-2 px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-purple-400 border border-purple-800 text-white text-[10px] font-black active:scale-95 transition-transform"
                      style={{ cursor: "pointer" }}
                    >
                      إضافة صديق جديد
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {friends.map((f) => {
                    const p = liveMap[f.friendUid];
                    const raw = p?.gamePresence ?? "offline";
                    const ts = p?.gamePresenceUpdatedAtMs
                      ? ({ toMillis: () => p.gamePresenceUpdatedAtMs! } as Timestamp)
                      : null;
                    const eff = clientEffectivePresence(raw, ts);
                    const isAvailable = eff === "online" || eff === "in_lobby" || eff === "matchmaking";
                    const level = p ? levelFromXp(p.xp) : 1;

                    return (
                      <motion.div
                        key={f.friendUid}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="game-card-outer"
                      >
                        <div className="game-card-inner p-3.5 bg-white border border-slate-100 rounded-2xl flex flex-col gap-3 shadow-sm">
                          
                          {/* Top Row: User Avatar & Info */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 cursor-pointer" onClick={() => openProfile(f.friendUid, { screen: "friends" })}>
                              <ProfileAvatar
                                cosmetic={p?.cosmetic}
                                fallbackPhotoURL={p?.photoURL ?? null}
                                displayName={p?.displayName ?? p?.username ?? "…"}
                                size="md"
                                idle
                              />
                              <div className="flex flex-col text-right justify-center" style={{ lineHeight: 1.15 }}>
                                <span className="text-xs font-black text-slate-800">{p?.displayName ?? "…"}</span>
                                <span className="text-[9px] text-slate-400 font-bold">{p?.username ? `@${p.username}` : ""}</span>
                                <span className="text-[9px] text-purple-600 font-extrabold mt-1">
                                  المستوى {level} · {p?.matchWins ?? 0} فوز
                                </span>
                              </div>
                            </div>

                            {/* Status Chip */}
                            <span 
                              className={`text-[8px] font-black px-2 py-0.5 rounded-full select-none flex items-center gap-1 ${
                                eff === "in_match" ? "bg-rose-50 text-rose-600" :
                                isAvailable ? "bg-green-50 text-green-600" : "bg-slate-50 text-slate-400"
                              }`}
                            >
                              <span className={`w-1 h-1 rounded-full ${eff === "in_match" ? "bg-rose-500" : isAvailable ? "bg-green-500" : "bg-slate-400"}`} />
                              {presenceLabelAr(eff)}
                            </span>
                          </div>

                          <div className="border-t border-slate-100 my-0.5" />

                          {/* Bottom Row: Actions */}
                          <div className="flex items-center justify-between">
                            
                            {/* Invite button based on availability */}
                            {isAvailable ? (
                              <button
                                type="button"
                                onClick={() => {
                                  resumeAudioContext();
                                  playUIButton();
                                  triggerToast("تم إرسال دعوة الانضمام للعبة!");
                                }}
                                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 border border-amber-600 text-white text-[9.5px] font-black active:scale-95 transition-transform"
                                style={{ cursor: "pointer" }}
                              >
                                دعوة للعب
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled
                                className="px-4 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 text-[9.5px] font-black cursor-not-allowed opacity-60"
                              >
                                {eff === "in_match" ? "في مباراة حالياً" : "غير متاح"}
                              </button>
                            )}

                            {/* Utility Actions */}
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  resumeAudioContext();
                                  playUIButton();
                                  triggerToast("المحادثات الخاصة قريباً!");
                                }}
                                className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200/50 flex items-center justify-center active:scale-95 transition-transform"
                                aria-label="رسالة"
                                style={{ cursor: "pointer" }}
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                </svg>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  resumeAudioContext();
                                  playUIButton();
                                  openProfile(f.friendUid, { screen: "friends" });
                                }}
                                className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200/50 flex items-center justify-center active:scale-95 transition-transform"
                                aria-label="الملف الشخصي"
                                style={{ cursor: "pointer" }}
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                  <circle cx="12" cy="7" r="4" />
                                </svg>
                              </button>

                              <button
                                type="button"
                                disabled={socialBusy === `rm:${f.friendUid}`}
                                onClick={() => void remove(f.friendUid)}
                                className="w-8 h-8 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center active:scale-95 transition-transform disabled:opacity-40"
                                aria-label="إزالة"
                                style={{ cursor: "pointer" }}
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                              </button>
                            </div>

                          </div>

                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}
      </div>

      {/* Toast alert popup */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="fixed bottom-24 inset-x-4 z-[99] flex justify-center pointer-events-none"
          >
            <div className="bg-slate-900/90 text-white font-extrabold text-[10px] px-4 py-2.5 rounded-full shadow-lg backdrop-blur-sm border border-slate-800 text-center leading-normal">
              {toastMsg}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

function SectionLabel({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="mb-4 pb-2 border-b border-purple-100 flex flex-col gap-1 pr-1 text-right">
      <div className="h-display text-[11px] font-black text-slate-800 flex items-center gap-1.5">
        <span className="w-1 h-3 rounded-full bg-gradient-to-b from-amber-400 to-amber-600 inline-block" />
        {title}
      </div>
      {desc && (
        <div className="text-[9px] text-slate-400 font-bold leading-tight">
          {desc}
        </div>
      )}
    </div>
  );
}

export default function ProfileFriendsPage() {
  return (
    <AuthGate>
      <FriendsPageInner />
    </AuthGate>
  );
}
