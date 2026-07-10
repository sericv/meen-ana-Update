"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLiveUserProfiles } from "@/hooks/useLiveUserProfiles";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { xpProgressInCurrentLevel } from "@/lib/profile/level";
import { getFirebaseDb } from "@/lib/firebase/client";
import { collection, onSnapshot } from "firebase/firestore";
import { col, userSub } from "@/lib/firestore/paths";
import { EASE_OUT, WHILE_TAP } from "@/lib/motion";
import { postSocial } from "@/lib/api/social-client";
import { clientEffectivePresence } from "@/lib/social/game-presence-client";

type ProfileContextType = {
  roomId?: string | null;
  matchId?: string | null;
  screen?: string;
};

type PlayerProfileModalContextType = {
  openProfile: (uid: string, context?: ProfileContextType) => void;
  closeProfile: () => void;
};

const PlayerProfileModalContext = createContext<PlayerProfileModalContextType | null>(null);

export function usePlayerProfileModal() {
  const ctx = useContext(PlayerProfileModalContext);
  if (!ctx) {
    throw new Error("usePlayerProfileModal must be used within PlayerProfileModalProvider");
  }
  return ctx;
}

// Vector icon helper for report reasons
function ReasonIcon({ type }: { type: string }) {
  const s = 18;
  const color = "currentColor";
  switch (type) {
    case "name":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#8B5CF6]">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
        </svg>
      );
    case "photo":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#EC4899]">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      );
    case "abuse":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#F59E0B]">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      );
    case "cheat":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#10B981]">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      );
    case "impersonation":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#3B82F6]">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
        </svg>
      );
    case "content":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#EF4444]">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      );
    default:
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
          <circle cx="12" cy="12" r="1" />
          <circle cx="19" cy="12" r="1" />
          <circle cx="5" cy="12" r="1" />
        </svg>
      );
  }
}

export function PlayerProfileModalProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const myUid = user?.uid ?? null;

  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [profileContext, setProfileContext] = useState<ProfileContextType | null>(null);
  const [myFriends, setMyFriends] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  // Report modal states
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState("");
  const [reportingBusy, setReportingBusy] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [successToastOpen, setSuccessToastOpen] = useState(false);

  // Sync current user's friends list in real-time
  useEffect(() => {
    if (!myUid) {
      setMyFriends([]);
      return;
    }
    const db = getFirebaseDb();
    const unsub = onSnapshot(
      collection(db, col.users, myUid, userSub.friends),
      (snap) => {
        setMyFriends(snap.docs.map((d) => d.id));
      },
      () => setMyFriends([])
    );
    return unsub;
  }, [myUid]);

  const openProfile = (uid: string, context?: ProfileContextType) => {
    setSelectedUid(uid);
    setProfileContext(context || null);
  };

  const closeProfile = () => {
    setSelectedUid(null);
    setProfileContext(null);
    setBusy(false);
    setReportModalOpen(false);
  };

  // Real-time listener for the viewed player's profile data
  const profilesMap = useLiveUserProfiles(selectedUid ? [selectedUid] : []);
  const profile = selectedUid ? profilesMap[selectedUid] : null;

  const isFriend = selectedUid ? myFriends.includes(selectedUid) : false;
  const isMe = selectedUid === myUid;

  // Recalculate presence dynamically to capture stale heartbeats (disconnects)
  const [effPresence, setEffPresence] = useState<string>("offline");

  useEffect(() => {
    if (!profile) {
      setEffPresence("offline");
      return;
    }
    const check = () => {
      const raw = profile.gamePresence;
      const updatedAtMs = profile.gamePresenceUpdatedAtMs;
      const ts = updatedAtMs ? ({ toMillis: () => updatedAtMs } as any) : null;
      const eff = clientEffectivePresence(raw, ts);
      setEffPresence(eff);
    };
    check();
    const timer = setInterval(check, 4000);
    return () => clearInterval(timer);
  }, [profile]);

  async function handleFriendAction() {
    if (!selectedUid || busy) return;
    setBusy(true);
    try {
      if (isFriend) {
        await postSocial("/api/social/friends/remove", { friendUid: selectedUid });
      } else {
        await postSocial("/api/social/friends/request", { toUid: selectedUid });
      }
    } catch (err) {
      console.error("[PlayerProfileModal] Action failed:", err);
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmitReport() {
    if (!selectedUid || !selectedReason || reportingBusy) return;
    setReportingBusy(true);
    setReportError(null);
    try {
      await postSocial("/api/social/reports/create", {
        reportedUid: selectedUid,
        reason: selectedReason,
        customReason: selectedReason === "سبب آخر" ? customReason : "",
        matchId: profileContext?.matchId || null,
        roomId: profileContext?.roomId || null,
        screen: profileContext?.screen || "profile",
      });

      // Close modals, reset state
      setReportModalOpen(false);
      setSelectedReason(null);
      setCustomReason("");
      setSelectedUid(null); // Close the profile card

      setSuccessToastOpen(true);
      setTimeout(() => setSuccessToastOpen(false), 4000);
    } catch (err: any) {
      setReportError(err?.message || "تعذر إرسال البلاغ.");
    } finally {
      setReportingBusy(false);
    }
  }

  const getPresenceDetails = (eff: string) => {
    switch (eff) {
      case "online":
      case "in_lobby":
      case "matchmaking":
      case "away":
        return {
          label: "متصل",
          color: "text-emerald-600 bg-emerald-50/50 border-emerald-100",
          dotColor: "bg-emerald-500",
        };
      case "in_match":
        return {
          label: "في مباراة",
          color: "text-amber-600 bg-amber-50/50 border-amber-100",
          dotColor: "bg-amber-500",
        };
      default:
        return {
          label: "غير متصل",
          color: "text-slate-400 bg-slate-50 border-slate-100/85",
          dotColor: "bg-slate-350",
        };
    }
  };

  const REASONS = [
    { id: "اسم غير مناسب", label: "اسم غير مناسب", icon: "name" },
    { id: "صورة غير مناسبة", label: "صورة غير مناسبة", icon: "photo" },
    { id: "إساءة أو إزعاج", label: "إساءة أو إزعاج", icon: "abuse" },
    { id: "غش أو استغلال ثغرات", label: "غش أو استغلال ثغرات", icon: "cheat" },
    { id: "انتحال شخصية", label: "انتحال شخصية", icon: "impersonation" },
    { id: "محتوى مسيء", label: "محتوى مسيء", icon: "content" },
    { id: "سبب آخر", label: "سبب آخر", icon: "other" },
  ];

  return (
    <PlayerProfileModalContext.Provider value={{ openProfile, closeProfile }}>
      {children}

      {/* Success Toast */}
      <AnimatePresence>
        {successToastOpen && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-[340px] game-card-outer shadow-2xl"
          >
            <div className="game-card-inner p-4 bg-emerald-50 border border-emerald-250 rounded-[20px] flex items-start gap-3 text-right">
              <span className="text-xl">✅</span>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-black text-emerald-800 font-sans">تم إرسال البلاغ بنجاح.</span>
                <span className="text-[10px] text-emerald-600 font-bold leading-normal font-sans">شكراً لمساعدتك في تحسين مجتمع اللعبة.</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedUid && !reportModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" dir="rtl">
            
            {/* Modal Backdrop Blur Mask */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeProfile}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-[3px]"
            />

            {/* Centered Profile Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 380, damping: 26 }}
              className="game-card-outer w-full max-w-[320px] shadow-2xl relative z-10"
            >
              <div className="game-card-inner p-5 bg-white border border-slate-100 rounded-[28px] flex flex-col gap-4 text-center relative overflow-hidden">
                
                {/* Background Sparkles */}
                <div aria-hidden className="pointer-events-none absolute inset-0 select-none overflow-hidden">
                  <span className="absolute right-[10%] top-[8%] text-lg text-purple-500/5 animate-pulse">✦</span>
                  <span className="absolute left-[12%] top-[25%] text-xs text-purple-500/5">✦</span>
                  <span className="absolute right-[20%] bottom-[16%] text-sm text-purple-500/5">✦</span>
                </div>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={closeProfile}
                  className="absolute top-4 left-4 grid h-7 w-7 place-items-center rounded-full bg-slate-50 border border-slate-200/40 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors active:scale-90"
                  style={{ cursor: "pointer" }}
                >
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>

                {!profile ? (
                  /* Skeletons */
                  <div className="py-8 flex flex-col items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-slate-100 animate-pulse" />
                    <div className="w-32 h-5 bg-slate-100 rounded-md animate-pulse" />
                    <div className="w-24 h-4 bg-slate-100 rounded-md animate-pulse" />
                    <div className="w-full h-10 bg-slate-100 rounded-xl animate-pulse mt-4" />
                  </div>
                ) : (
                  <>
                    {/* Header Avatar Section */}
                    <div className="flex flex-col items-center mt-2">
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.05, duration: 0.3 }}
                        className="relative"
                      >
                        <ProfileAvatar
                          cosmetic={profile.cosmetic}
                          fallbackPhotoURL={profile.photoURL}
                          displayName={profile.displayName || "لاعب"}
                          size="xl"
                          idle
                        />
                      </motion.div>

                      {/* Display name & username handle */}
                      <h3 className="h-display text-base font-black text-slate-800 mt-3.5 max-w-full truncate px-1 font-sans">
                        {profile.displayName || "زائر"}
                      </h3>
                      <p className="text-[11px] text-slate-400 font-bold mt-0.5 font-sans">
                        @{profile.username || "—"}
                      </p>

                      {/* Presence status badge */}
                      {(() => {
                        const details = getPresenceDetails(effPresence);
                        return (
                          <div className={`mt-2.5 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black border ${details.color} font-sans`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${details.dotColor}`} />
                            <span>{details.label}</span>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Progression bar */}
                    {(() => {
                      const levelInfo = xpProgressInCurrentLevel(profile.lifetimeXp ?? profile.xp ?? 0);
                      return (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1, duration: 0.25 }}
                          className="flex flex-col gap-1 text-right mt-1"
                        >
                          <div className="flex items-center justify-between text-[9.5px] font-black font-sans">
                            <span className="text-slate-400 uppercase tracking-wider">مستوى التقدم (Lv.{levelInfo.level})</span>
                            <span className="text-slate-500">
                              {levelInfo.xpInLevel} / {levelInfo.xpToNext} XP
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 border border-slate-200/40 rounded-full h-2 overflow-hidden shadow-inner">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${levelInfo.pct}%` }}
                              transition={{ delay: 0.2, duration: 0.7, ease: EASE_OUT }}
                              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-400 shadow-sm"
                            />
                          </div>
                        </motion.div>
                      );
                    })()}

                    {/* Statistics Cards Grid */}
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15, duration: 0.25 }}
                      className="grid grid-cols-3 gap-2.5 mt-1.5"
                    >
                      <div className="game-card-outer">
                        <div className="game-card-inner p-2.5 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center justify-center text-center">
                          <span className="text-xs font-black text-[#7C3AED] font-sans">
                            {profile.matchWins.toLocaleString("ar")}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 mt-0.5 font-sans">
                            🏆 الفوز
                          </span>
                        </div>
                      </div>

                      <div className="game-card-outer">
                        <div className="game-card-inner p-2.5 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center justify-center text-center">
                          <span className="text-xs font-black text-[#7C3AED] font-sans">
                            {profile.matchTotal.toLocaleString("ar")}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 mt-0.5 font-sans">
                            🎮 المباريات
                          </span>
                        </div>
                      </div>

                      <div className="game-card-outer">
                        <div className="game-card-inner p-2.5 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center justify-center text-center">
                          <span className="text-xs font-black text-[#7C3AED] font-sans">
                            {profile.matchTotal > 0 ? `${profile.winRate}%` : "—"}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 mt-0.5 font-sans">
                            📈 النسبة
                          </span>
                        </div>
                      </div>
                    </motion.div>

                    {/* Action buttons (only show if viewed user is NOT the logged-in user themselves) */}
                    {!isMe && myUid && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.25 }}
                        className="mt-2.5 flex flex-col gap-2"
                      >
                        <motion.button
                          type="button"
                          disabled={busy}
                          onClick={handleFriendAction}
                          whileHover={{ scale: 1.015 }}
                          whileTap={WHILE_TAP}
                          className="w-full py-3 rounded-2xl text-xs font-black text-white shadow-sm flex items-center justify-center gap-1.5 transition-all font-sans"
                          style={{
                            background: busy
                              ? "#CBD5E1"
                              : isFriend
                                ? "linear-gradient(to right, #EF4444, #F87171)"
                                : "linear-gradient(to right, #7C3AED, #9F7AEA)",
                            cursor: busy ? "not-allowed" : "pointer",
                          }}
                        >
                          {busy ? (
                            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="animate-spin">
                              <circle cx="12" cy="12" r="10" />
                            </svg>
                          ) : isFriend ? (
                            <>
                              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <line x1="17" y1="11" x2="23" y2="11" />
                              </svg>
                              <span>إزالة الصديق</span>
                            </>
                          ) : (
                            <>
                              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <line x1="19" y1="8" x2="19" y2="14" />
                                <line x1="16" y1="11" x2="22" y2="11" />
                              </svg>
                              <span>إضافة صديق</span>
                            </>
                          )}
                        </motion.button>

                        {/* Report Button */}
                        <motion.button
                          type="button"
                          onClick={() => {
                            setReportModalOpen(true);
                            setSelectedReason(null);
                            setCustomReason("");
                            setReportError(null);
                          }}
                          whileHover={{ scale: 1.015 }}
                          whileTap={WHILE_TAP}
                          className="w-full py-2.5 rounded-2xl text-[11px] font-black text-rose-600 bg-rose-50 border border-rose-200/50 flex items-center justify-center gap-1.5 shadow-sm hover:bg-rose-100/50 active:scale-[0.98] transition-all font-sans"
                          style={{ cursor: "pointer" }}
                        >
                          <span>🚩</span>
                          <span>إبلاغ عن اللاعب</span>
                        </motion.button>
                      </motion.div>
                    )}
                  </>
                )}

              </div>
            </motion.div>

          </div>
        )}
      </AnimatePresence>

      {/* Report Modal */}
      <AnimatePresence>
        {reportModalOpen && selectedUid && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4" dir="rtl">
            {/* Backdrop Blur Mask */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!reportingBusy) setReportModalOpen(false);
              }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-[3px]"
            />

            {/* Centered Report Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 380, damping: 26 }}
              className="game-card-outer w-full max-w-[340px] shadow-2xl relative z-10"
            >
              <div className="game-card-inner p-5 bg-white border border-slate-100 rounded-[28px] flex flex-col gap-4 relative overflow-hidden">
                
                {/* Header section */}
                <div className="flex flex-col items-center text-center mt-2">
                  <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center shadow-inner">
                    <span className="text-xl">🚩</span>
                  </div>
                  <h3 className="h-display text-base font-black text-slate-800 mt-3 font-sans">
                    إبلاغ عن لاعب
                  </h3>
                  <p className="text-[11px] text-slate-400 font-bold mt-1 max-w-[220px] font-sans">
                    ساعدنا بالحفاظ على مجتمع اللعبة آمناً.
                  </p>
                </div>

                {/* Reasons List */}
                <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-1 my-1">
                  {REASONS.map((r) => {
                    const selected = selectedReason === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          if (!reportingBusy) {
                            setSelectedReason(r.id);
                            setReportError(null);
                          }
                        }}
                        className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-right active:scale-[0.98] transition-all ${
                          selected
                            ? "bg-purple-50/70 border-purple-300 text-purple-700 font-black shadow-sm"
                            : "bg-[#FAFAF8] border-slate-200/50 text-slate-700 font-bold hover:bg-slate-50"
                        }`}
                        style={{ cursor: reportingBusy ? "not-allowed" : "pointer" }}
                      >
                        <div className="flex items-center gap-2">
                          <ReasonIcon type={r.icon} />
                          <span className="text-xs font-sans">{r.label}</span>
                        </div>
                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                          selected ? "border-purple-600 bg-purple-600" : "border-slate-350 bg-white"
                        }`}>
                          {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Step 2: Custom details text field */}
                {selectedReason === "سبب آخر" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="flex flex-col gap-1"
                  >
                    <textarea
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value.slice(0, 300))}
                      disabled={reportingBusy}
                      placeholder="اشرح المشكلة باختصار..."
                      rows={3}
                      className="w-full p-3 text-xs border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-purple-300 focus:bg-white resize-none font-sans"
                    />
                    <div className="text-[9px] text-slate-400 font-black text-left font-sans pr-1">
                      {customReason.length} / 300
                    </div>
                  </motion.div>
                )}

                {/* Error Banner */}
                {reportError && (
                  <div className="text-[10px] text-rose-500 font-black text-right font-sans px-1">
                    ⚠️ {reportError}
                  </div>
                )}

                {/* Step 3: Warning notice */}
                <div className="p-2.5 rounded-xl bg-rose-50/50 border border-rose-100/50 text-[10px] font-bold text-rose-600 text-center leading-normal font-sans">
                  يرجى استخدام البلاغات بشكل صحيح. البلاغات الكاذبة قد تؤثر على حسابك.
                </div>

                {/* Buttons Deck */}
                <div className="flex gap-2 mt-1">
                  <motion.button
                    type="button"
                    disabled={reportingBusy}
                    onClick={() => setReportModalOpen(false)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={WHILE_TAP}
                    className="flex-1 py-3 rounded-2xl text-xs font-black text-slate-700 bg-slate-50 border border-slate-200/50 shadow-sm transition-transform font-sans"
                    style={{ cursor: reportingBusy ? "not-allowed" : "pointer" }}
                  >
                    إلغاء
                  </motion.button>

                  <motion.button
                    type="button"
                    disabled={reportingBusy || !selectedReason}
                    onClick={handleSubmitReport}
                    whileHover={{ scale: 1.015 }}
                    whileTap={WHILE_TAP}
                    className="flex-1 py-3 rounded-2xl text-xs font-black text-white shadow-md shadow-purple-200/40 bg-gradient-to-r from-[#7C3AED] to-[#9F7AEA] border border-[#6D28D9] transition-all flex items-center justify-center gap-1.5 font-sans"
                    style={{
                      opacity: reportingBusy || !selectedReason ? 0.65 : 1,
                      cursor: reportingBusy || !selectedReason ? "not-allowed" : "pointer",
                    }}
                  >
                    {reportingBusy ? (
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="animate-spin">
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                    ) : (
                      "إرسال البلاغ"
                    )}
                  </motion.button>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PlayerProfileModalContext.Provider>
  );
}
