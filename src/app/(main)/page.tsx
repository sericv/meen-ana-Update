"use client";

import { collection, onSnapshot, type Timestamp } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
import { ShellFramedAvatar } from "@/components/shell/ShellFramedAvatar";
import { ShellCoin } from "@/components/shell/ShellCoin";
import { ShellIcon } from "@/components/shell/ShellIcons";

import { MajlisHero, ActionGrid, ActionTile } from "@/components/shell/HomeScreenParts";

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
  const [howToPlayOpen, setHowToPlayOpen] = useState(false);

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
    <div className="shell-screen relative memphis-grid" style={{ background: "transparent" }}>
      {/* Soft floating game background shapes */}
      <div className="bg-shape text-3xl memphis-float" style={{ top: "12%", left: "8%", opacity: 0.08 }}>❓</div>
      <div className="bg-shape text-3xl memphis-float-delayed" style={{ top: "45%", right: "8%", opacity: 0.08 }}>🔍</div>
      <div className="bg-shape text-2xl memphis-float" style={{ bottom: "25%", left: "10%", opacity: 0.08 }}>🕵️‍♂️</div>
      <div className="bg-shape text-2xl memphis-float-delayed" style={{ bottom: "12%", right: "12%", opacity: 0.08 }}>💭</div>
      <div className="bg-shape text-xl memphis-float" style={{ top: "35%", right: "20%", opacity: 0.08 }}>⭐</div>
      <div className="bg-shape text-xl memphis-float-delayed" style={{ top: "8%", right: "15%", opacity: 0.08 }}>✨</div>

      {/* Floating Double-Bezel Header */}
      <div className="mx-4 mt-5 p-1 bg-slate-900/5 ring-1 ring-black/5 rounded-[22px] relative z-10">
        <div className="bg-white/95 rounded-[17px] p-2 flex items-center justify-between shadow-[inset_0_1px_0px_rgba(255,255,255,0.8)]">
          {/* Profile card */}
          <button
            type="button"
            className="flex items-center gap-2 text-right p-1 hover:bg-slate-50 rounded-xl active:scale-[0.98] transition-transform"
            onClick={() => nav("/profile", true)}
            style={{ cursor: "pointer" }}
          >
            <ShellFramedAvatar
              cosmetic={myCosmetic}
              fallbackPhotoURL={user?.photoURL}
              displayName={displayName}
              size={34}
              frame="simple"
            />
            <div className="flex flex-col text-right justify-center" style={{ lineHeight: 1.15 }}>
              <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-wider">مرحبًا بك</span>
              <span className="h-display text-xs font-black text-slate-800">{loading ? "…" : displayName}</span>
            </div>
          </button>

          <div className="flex items-center gap-2">
            {/* Help Button (؟) */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setHowToPlayOpen(true)}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-50 border border-slate-200/60 text-[#7C3AED] hover:bg-[#F3E8FF] hover:border-purple-200/80 shadow-sm active:scale-95 transition-all"
              style={{ cursor: "pointer" }}
              aria-label="كيفية اللعب"
            >
              <span className="text-sm font-black font-sans leading-none">؟</span>
            </motion.button>

            {user ? (
              /* Coins counter only — NO Diamonds */
              <div className="bg-[#FFE600]/10 border border-[#FFE600]/30 px-3 py-1.5 rounded-full flex items-center gap-1.5 min-w-[70px]">
                <ShellCoin value={coins} compact />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 px-4 pt-4 pb-28">
        <MajlisHero onPlay={() => nav("/play/random")} />

        {/* Space gap */}
        <div className="my-6" />

        {/* Asymmetrical Bento Grid */}
        <ActionGrid>
          <div className="col-span-2">
            <ActionTile
              primary
              icon="plus"
              title="غرفة خاصة"
              subtitle="ادعُ أصدقاءك والعبوا سوياً بالصوت والدردشة"
              tint="purple"
              onClick={() => nav("/play/new", true)}
            />
          </div>

          <ActionTile
            icon="word-race"
            title="اسم حيوان نبات"
            subtitle="لعبة السرعة والتحدي البصري للحروف العربية"
            tint="purple"
            onClick={() => nav("/play/word-race")}
          />
          
          <ActionTile
            icon="search"
            title="انضم بكود"
            subtitle="ادخل رمز الغرفة"
            tint="blue"
            onClick={() => nav("/join", true)}
          />
          
          <ActionTile 
            icon="shop" 
            title="المتجر" 
            subtitle="إطارات حصرية" 
            tint="amber" 
            onClick={() => nav("/shop", true)} 
          />

          <ActionTile
            icon="trophy"
            title="التصنيف العالمي"
            subtitle="قريباً: تصدر قائمة أذكى اللاعبين في الوطن العربي"
            tint="blue"
            badge="قريباً"
            onClick={() => nav("/ranking")}
          />
        </ActionGrid>

        {/* Spacing gap */}
        <div className="my-6" />

        <div className="row between" style={{ padding: "0 4px" }}>
          <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">الأصدقاء المتصلون</span>
          <button
            type="button"
            className="text-xs font-black text-[#7C3AED] hover:underline"
            style={{ background: "none", border: "none", cursor: "pointer" }}
            onClick={() => nav("/profile/friends", true)}
          >
            عرض الكل
          </button>
        </div>

        {/* Horizontal Friends List wrapped in Double Bezel Enclosure */}
        <div className="scroll-x mt-2" style={{ paddingBottom: 8 }}>
          <div style={{ display: "flex", gap: 14 }}>
            {friendUids.map((friendUid, i) => {
              const p = friendLive[friendUid];
              const name = p?.displayName ?? p?.username ?? "صديق";
              const ts = p?.gamePresenceUpdatedAtMs
                ? ({ toMillis: () => p.gamePresenceUpdatedAtMs! } as Timestamp)
                : null;
              const presence = clientEffectivePresence(p?.gamePresence ?? null, ts);
              const online = presence !== "offline" && presence !== "away";
              return (
                <motion.div
                  key={friendUid}
                  className="game-card-outer group"
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  style={{
                    minWidth: 104,
                    cursor: "pointer",
                  }}
                >
                  <div className="game-card-inner p-3.5 flex flex-col items-center gap-2.5">
                    <ShellFramedAvatar
                      cosmetic={p?.cosmetic}
                      displayName={name}
                      size={44}
                      frame={FRAME_RING[i % FRAME_RING.length] ?? "simple"}
                      online={online}
                    />
                    <div className="text-[11px] font-black text-slate-800" style={{ whiteSpace: "nowrap", textAlign: "center" }}>
                      {name.length > 9 ? name.slice(0, 8) + "…" : name}
                    </div>
                    <div
                      className="text-[9px] font-bold px-2 py-0.5 rounded-full border"
                      style={{
                        whiteSpace: "nowrap",
                        background: online ? "rgba(34, 197, 94, 0.1)" : "#F8FAFC",
                        borderColor: online ? "rgba(34, 197, 94, 0.2)" : "#E2E8F0",
                        color: online ? "#16A34A" : "#64748B",
                      }}
                    >
                      {presenceLabelAr(presence)}
                    </div>
                  </div>
                </motion.div>
              );
            })}
            <motion.button
              type="button"
              className="game-card-outer"
              onClick={() => nav("/profile/friends", true)}
              whileTap={{ scale: 0.97 }}
              style={{
                minWidth: 104,
                cursor: "pointer",
              }}
            >
              <div className="game-card-inner p-3.5 flex flex-col items-center justify-center gap-2 border border-dashed border-slate-300 min-h-[114px]">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-200">
                  <ShellIcon name="plus" size={16} color="#64748B" />
                </div>
                <span className="text-[10px] font-black text-slate-800">إضافة صديق</span>
              </div>
            </motion.button>
          </div>
        </div>

        {/* ── Footer ─────────────────────────────────────────────── */}
        <div className="mt-10 mb-2">
          <div className="game-card-outer" style={{ borderRadius: 18 }}>
            <div
              className="game-card-inner flex flex-col items-center gap-2.5"
              style={{ borderRadius: 14, padding: "14px 18px 12px" }}
            >
              {/* Links row */}
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
                <motion.button
                  type="button"
                  className="text-[11px] font-bold text-[#7C3AED] hover:text-[#6D28D9] transition-colors"
                  style={{ background: "none", border: "none", cursor: "pointer" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => nav("/privacy")}
                >
                  سياسة الخصوصية
                </motion.button>
                <span className="text-[10px] text-slate-300 select-none" aria-hidden>·</span>
                <motion.button
                  type="button"
                  className="text-[11px] font-bold text-[#7C3AED] hover:text-[#6D28D9] transition-colors"
                  style={{ background: "none", border: "none", cursor: "pointer" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => nav("/terms")}
                >
                  شروط الاستخدام
                </motion.button>
              </div>

              {/* Copyright */}
              <span className="text-[9px] font-semibold text-slate-400 select-none">
                © 2026 مين أنا؟ جميع الحقوق محفوظة.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── How To Play Dialog ─────────────────────────────────── */}
      <AnimatePresence>
        {howToPlayOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setHowToPlayOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
              className="w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="game-card-outer w-full">
                <div className="game-card-inner p-6 bg-white rounded-[22px] border border-slate-100 shadow-xl flex flex-col gap-4 text-right">
                  
                  {/* Title */}
                  <div className="text-center flex flex-col gap-1 border-b border-slate-100 pb-3">
                    <h3 className="h-display text-sm font-black text-slate-800">كيفية اللعب</h3>
                  </div>

                  {/* Body Copy */}
                  <div className="flex flex-col gap-3 font-sans text-slate-600 font-bold leading-relaxed pr-1 text-[11px]" dir="rtl">
                    <p className="text-slate-800 font-black text-xs mb-1">كيف تلعب؟</p>
                    <div className="flex flex-col gap-2.5 text-[10px] text-slate-500 leading-normal pr-1">
                      <div>• أنشئ غرفة أو انضم إلى مباراة</div>
                      <div>• سيحصل كل لاعب على بطاقة لا يستطيع رؤيتها، بينما يراها اللاعب الآخر</div>
                      <div>• اطرح أسئلة ذكية لتكتشف البطاقة الخاصة بك</div>
                      <div>
                        • عندما يسألك خصمك، أجب باستخدام :
                        <div className="flex gap-1.5 mt-1.5 mr-3">
                          <span className="px-2 py-0.5 rounded-md bg-purple-50 border border-purple-100/50 text-[#7C3AED] font-black text-[9px]">نعم</span>
                          <span className="px-2 py-0.5 rounded-md bg-purple-50 border border-purple-100/50 text-[#7C3AED] font-black text-[9px]">لا</span>
                          <span className="px-2 py-0.5 rounded-md bg-purple-50 border border-purple-100/50 text-[#7C3AED] font-black text-[9px]">ربما</span>
                          <span className="px-2 py-0.5 rounded-md bg-purple-50 border border-purple-100/50 text-[#7C3AED] font-black text-[9px]">إجابة أخرى</span>
                        </div>
                      </div>
                      <div>• عندما تعتقد أنك عرفت بطاقتك، اضغط "تخمين" واكتب الإجابة</div>
                      <div>• أول لاعب يكتشف بطاقته يفوز بالمباراة</div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-[1px] bg-slate-100 my-1" />

                  {/* Action button */}
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setHowToPlayOpen(false)}
                    className="w-full py-3.5 rounded-2xl text-xs font-black text-white shadow-md active:scale-95 transition-transform flex items-center justify-center border border-purple-800"
                    style={{
                      background: "linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)",
                      cursor: "pointer",
                    }}
                  >
                    فهمت
                  </motion.button>

                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
