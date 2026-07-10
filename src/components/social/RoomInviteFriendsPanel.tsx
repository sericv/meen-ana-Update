"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, type Timestamp } from "firebase/firestore";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { getFirebaseDb } from "@/lib/firebase/client";
import { col, userSub } from "@/lib/firestore/paths";
import { postSocial } from "@/lib/api/social-client";
import { useLiveUserProfiles } from "@/hooks/useLiveUserProfiles";
import { clientEffectivePresence } from "@/lib/social/game-presence-client";
import { INVITE_BLOCKING_PRESENCE, presenceLabelAr } from "@/lib/social/presence-constants";
import { playUIButton } from "@/lib/audio/game-sounds";
import { levelFromXp } from "@/lib/profile/level";
import { usePlayerProfileModal } from "@/components/providers/PlayerProfileModalProvider";
import type { GamePresence } from "@/lib/social/presence-constants";

type FriendRow = { friendUid: string; since?: Timestamp | null };

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  online:     { bg: "bg-emerald-50/70", text: "text-emerald-700", dot: "bg-emerald-500" },
  in_lobby:   { bg: "bg-emerald-50/70", text: "text-emerald-700", dot: "bg-emerald-500" },
  in_match:   { bg: "bg-amber-50/70",   text: "text-amber-700",   dot: "bg-amber-500" },
  matchmaking:{ bg: "bg-purple-50/70",  text: "text-purple-700",  dot: "bg-purple-500" },
  away:       { bg: "bg-amber-50/70",   text: "text-amber-700",   dot: "bg-amber-500" },
  offline:    { bg: "bg-slate-50/70",   text: "text-slate-500",   dot: "bg-slate-400" },
};

export function RoomInviteFriendsPanel({
  myUid,
  roomId,
  onClose,
}: {
  myUid: string;
  roomId: string;
  onClose: () => void;
}) {
  const { openProfile } = usePlayerProfileModal();
  const [friends, setFriends] = useState<FriendRow[]>([]);
  const [inviteBusy, setInviteBusy] = useState<string | null>(null);
  const [invitedOk, setInvitedOk] = useState<string | null>(null);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  // Fetch friends in real-time
  useEffect(() => {
    if (!myUid) return;
    
    const db = getFirebaseDb();
    const unsub = onSnapshot(
      collection(db, col.users, myUid, userSub.friends),
      (snap) => {
        const rows: FriendRow[] = snap.docs.map((d) => ({
          friendUid: d.id,
          since: (d.data().since as Timestamp | null) ?? null,
        }));
        rows.sort((a, b) => (a.friendUid > b.friendUid ? 1 : -1));
        setFriends(rows);
        setFirebaseError(null);
      },
      (err) => {
        console.error("[RoomInviteFriendsPanel] snapshot error:", err);
        setFirebaseError("عذراً، فشل تحميل قائمة الأصدقاء من قاعدة البيانات.");
        setFriends([]);
      }
    );

    return () => unsub();
  }, [myUid]);

  const friendUids = useMemo(() => friends.map((f) => f.friendUid), [friends]);
  const liveMap = useLiveUserProfiles(friendUids);

  const sendInvite = async (toUid: string) => {
    playUIButton();
    setInviteBusy(toUid);
    setInvitedOk(null);
    try {
      await postSocial("/api/social/room-invite", { roomId, toUid });
      setInvitedOk(toUid);
      setTimeout(() => {
        setInvitedOk(null);
      }, 1500);
    } catch (e) {
      console.error("[RoomInviteFriendsPanel] invite error:", e);
    } finally {
      setInviteBusy(null);
    }
  };

  const filteredFriends = useMemo(() => {
    if (!query.trim()) return friends;
    const q = query.trim().toLowerCase();
    return friends.filter((f) => {
      const p = liveMap[f.friendUid];
      const name = p?.username?.toLowerCase() ?? p?.displayName?.toLowerCase() ?? "";
      return name.includes(q);
    });
  }, [friends, liveMap, query]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
      dir="rtl"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 10 }}
        transition={{ type: "spring", stiffness: 420, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        className="game-card-outer w-full max-w-sm shadow-2xl overflow-hidden"
      >
        <div className="game-card-inner p-5 bg-white rounded-[24px] border border-slate-100 flex flex-col gap-4 max-h-[500px]">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div style={{ lineHeight: 1.2 }}>
              <h3 className="h-display text-sm font-black text-slate-800">دعوة الأصدقاء للغرفة</h3>
              <p className="text-[9px] text-slate-400 font-bold">اختر صديقاً للانضمام والتحدي فورياً</p>
            </div>
            
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200/50 flex items-center justify-center text-slate-400 active:scale-95 transition-transform"
              aria-label="إغلاق"
              style={{ cursor: "pointer" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Search bar wrapper */}
          <div className="game-card-outer w-full">
            <div className="game-card-inner bg-slate-50/50 border border-slate-200/50 rounded-xl px-3 py-1.5 flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-400">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث باسم المستخدم..."
                className="w-full border-0 bg-transparent py-1 text-xs font-bold outline-none text-slate-800 placeholder-slate-400"
              />
            </div>
          </div>

          {/* Alert error box if firebase fails */}
          {firebaseError && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-[10px] font-black text-center">
              {firebaseError}
            </div>
          )}

          {/* Scrollable Friends List Area */}
          <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-2.5 pr-0.5">
            
            {friends.length === 0 ? (
              /* Truly empty friends state */
              <div className="py-8 px-4 text-center flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="9" cy="7" r="4" />
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <line x1="19" y1="8" x2="19" y2="14" />
                    <line x1="22" y1="11" x2="16" y2="11" />
                  </svg>
                </div>
                <div style={{ lineHeight: 1.25 }}>
                  <h4 className="text-xs font-black text-slate-700">لا يوجد أصدقاء بعد</h4>
                  <p className="text-[9px] text-slate-400 font-bold mt-1">
                    أضف أصدقاء من لوحة الصداقة بالخارج لتتمكن من دعوتهم للعب معك.
                  </p>
                </div>
              </div>
            ) : filteredFriends.length === 0 ? (
              /* Search results empty state */
              <div className="py-8 px-4 text-center flex flex-col items-center justify-center gap-2">
                <span className="text-2xl">🔍</span>
                <div style={{ lineHeight: 1.25 }}>
                  <h4 className="text-xs font-black text-slate-600">لا توجد نتائج مطابقة</h4>
                  <p className="text-[9px] text-slate-400 font-bold mt-0.5">تأكد من كتابة الاسم بشكل صحيح.</p>
                </div>
              </div>
            ) : (
              /* Scrollable list items */
              filteredFriends.map((f) => {
                const p = liveMap[f.friendUid];
                const raw = p?.gamePresence ?? "offline";
                const ts = p?.gamePresenceUpdatedAtMs
                  ? ({ toMillis: () => p.gamePresenceUpdatedAtMs! } as Timestamp)
                  : null;
                const eff = clientEffectivePresence(raw, ts);
                const blocked = INVITE_BLOCKING_PRESENCE.has(eff);
                const ss = STATUS_COLORS[eff] ?? STATUS_COLORS.offline;
                const level = levelFromXp(p?.xp ?? 0);
                const wins = p?.matchWins ?? 0;
                const display = p?.username
                  ? `@${p.username}`
                  : p?.displayName ?? f.friendUid.slice(0, 8);
                
                const isInvited = invitedOk === f.friendUid;
                const isBusy = inviteBusy === f.friendUid;

                return (
                  <div key={f.friendUid} className="game-card-outer w-full">
                    <div className="game-card-inner p-3 bg-white border border-slate-100 rounded-xl flex items-center justify-between gap-3">
                      
                      {/* Avatar & Details Clickable wrapper */}
                      <div
                        className="flex-1 flex items-center gap-3 cursor-pointer select-none min-w-0"
                        onClick={() => openProfile(f.friendUid, { roomId, screen: "lobby" })}
                      >
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                          <ProfileAvatar
                            cosmetic={p?.cosmetic}
                            fallbackPhotoURL={null}
                            displayName={p?.displayName ?? undefined}
                            size="sm"
                            idle
                          />
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0" style={{ lineHeight: 1.15 }}>
                          <span className="text-xs font-black text-slate-800 truncate block">
                            {display}
                          </span>
                          
                          <div className="flex items-center gap-2 mt-1.5">
                            {/* status pill */}
                            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[8px] font-black ${ss.bg} ${ss.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${ss.dot}`} />
                              <span>{presenceLabelAr(eff)}</span>
                            </div>

                            {/* Level */}
                            <span className="text-[8px] font-bold text-slate-400">
                              مستوى {level} · {wins} فوز
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Invite Button */}
                      <motion.button
                        type="button"
                        disabled={blocked || isBusy}
                        whileTap={isBusy || blocked ? {} : { scale: 0.94 }}
                        onClick={() => void sendInvite(f.friendUid)}
                        className={`flex-shrink-0 py-2 px-4 rounded-xl text-[9px] font-black border transition-transform flex items-center justify-center gap-1.5 ${
                          isInvited
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                            : blocked
                              ? "bg-slate-50 border-slate-200/50 text-slate-400 cursor-not-allowed"
                              : "bg-gradient-to-r from-purple-600 to-purple-400 border-purple-800 text-white shadow-sm hover:from-purple-500"
                        }`}
                        style={{ cursor: blocked || isBusy ? "not-allowed" : "pointer" }}
                      >
                        {isInvited ? (
                          <>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span>تمت</span>
                          </>
                        ) : isBusy ? (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="animate-spin">
                            <circle cx="12" cy="12" r="10" />
                          </svg>
                        ) : blocked ? (
                          "غير متاح"
                        ) : (
                          "دعوة"
                        )}
                      </motion.button>

                    </div>
                  </div>
                );
              })
            )}

          </div>

        </div>
      </motion.div>
    </motion.div>
  );
}
