"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { AuthGate } from "@/components/auth/AuthGate";
import { useAuth } from "@/components/providers/AuthProvider";
import { ShellIcon } from "@/components/shell/ShellIcons";
import { Toggle } from "@/components/ui/Toggle";
import { useDefaultOnlinePresence } from "@/hooks/useDefaultOnlinePresence";
import { isFullAccountUser } from "@/lib/auth/google-user";
import { WORD_RACE_CATEGORIES } from "@/lib/game/word-race-data";
import {
  CATEGORY_SVG_MAP,
  SvgCheckIcon,
  SvgLightningIcon,
  SvgSparklesIcon,
  SvgTimerIcon,
  SvgUsersIcon,
  SvgShieldIcon,
} from "@/lib/game/word-race-svgs";
import { createWordRaceRoom } from "@/lib/firestore/word-race-rooms.client";
import type { WordRaceRoomSettings, LetterMode } from "@/types/word-race";

const TIMER_PRESETS = [15, 20, 30, 45, 60, 75, 90, 120, 180] as const;
const PLAYER_PRESETS = [2, 4, 8] as const;

const CreateWordRaceHero = () => (
  <div className="my-2 flex items-center justify-center">
    <svg width="220" height="75" viewBox="0 0 220 75" className="opacity-95">
      <g transform="translate(60, 38) rotate(-8)">
        <rect x="-22" y="-28" width="44" height="54" rx="8" fill="#22C55E" stroke="#000000" strokeWidth="1.5" />
        <text x="0" y="8" fontSize="16" fontWeight="900" textAnchor="middle" fill="#FFFFFF">اسم</text>
      </g>
      <g transform="translate(110, 34) rotate(6)">
        <rect x="-22" y="-28" width="44" height="54" rx="8" fill="#FFE600" stroke="#000000" strokeWidth="1.5" />
        <text x="0" y="10" fontSize="22" fontWeight="900" textAnchor="middle" fill="#000000">س</text>
      </g>
      <g transform="translate(160, 40) rotate(2)">
        <rect x="-20" y="-26" width="40" height="50" rx="8" fill="#00F0FF" stroke="#000000" strokeWidth="1.5" />
        <text x="0" y="8" fontSize="16" fontWeight="900" textAnchor="middle" fill="#000000">أ</text>
      </g>
    </svg>
  </div>
);

export default function CreateWordRaceRoomPage() {
  return (
    <AuthGate>
      <CreateWordRaceRoomInner />
    </AuthGate>
  );
}

function CreateWordRaceRoomInner() {
  const { user } = useAuth();
  useDefaultOnlinePresence(user?.uid ?? null, isFullAccountUser(user));
  const router = useRouter();

  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    "name",
    "animal",
    "plant",
    "object",
    "country",
    "city",
  ]);
  const [letterMode, setLetterMode] = useState<LetterMode>("SINGLE_UNIVERSAL");
  const [timeLimitSec, setTimeLimitSec] = useState<number>(90);
  const [maxPlayers, setMaxPlayers] = useState<number>(2);
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const toggleCategory = (catId: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(catId)) {
        if (prev.length <= 2) return prev;
        return prev.filter((id) => id !== catId);
      } else {
        return [...prev, catId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedCategories.length === WORD_RACE_CATEGORIES.length) {
      setSelectedCategories(["name", "animal", "plant", "object"]);
    } else {
      setSelectedCategories(WORD_RACE_CATEGORIES.map((c) => c.id));
    }
  };

  const handleStart = async () => {
    if (!user) return;
    setBusy(true);
    setErr(null);
    try {
      const settings: WordRaceRoomSettings = {
        categories: selectedCategories,
        letterMode,
        timeLimitSec: Math.min(300, Math.max(15, timeLimitSec)),
        maxPlayers,
        isPrivate,
      };

      const displayName = user.displayName || (user.isAnonymous ? "زائر" : (user.email?.split("@")[0] ?? "متسابق"));
      const { roomId } = await createWordRaceRoom({
        uid: user.uid,
        displayName,
        settings,
      });

      // Save roomId to session storage and navigate back to Word Race main view
      if (typeof window !== "undefined") {
        sessionStorage.setItem("active_word_race_room_id", roomId);
      }
      router.push(`/play/word-race?roomId=${roomId}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "تعذر إنشاء الغرفة");
      setBusy(false);
    }
  };

  return (
    <div className="shell-screen relative memphis-grid" style={{ background: "transparent" }}>
      {/* Background floaters */}
      <div className="bg-shape text-2xl memphis-float" style={{ top: "12%", left: "6%", opacity: 0.05 }}>✨</div>
      <div className="bg-shape text-2xl memphis-float-delayed" style={{ top: "45%", right: "6%", opacity: 0.05 }}>⭐</div>

      {/* Double Bezel Floating Header */}
      <div className="mx-4 mt-5 p-1 bg-slate-900/5 ring-1 ring-black/5 rounded-[22px] relative z-10">
        <div className="bg-white/95 rounded-[17px] p-2 flex items-center justify-between shadow-[inset_0_1px_0px_rgba(255,255,255,0.8)]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
              onClick={() => router.push("/play/word-race")}
              aria-label="رجوع"
            >
              <ShellIcon name="back" size={16} color="#64748B" />
            </button>
            <div className="flex flex-col text-right justify-center" style={{ lineHeight: 1.15 }}>
              <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-wider">تجهيز الجلسة</span>
              <span className="h-display text-sm font-black text-slate-800">إنشاء غرفة اسم حيوان نبات</span>
            </div>
          </div>
          <div style={{ width: 32 }} />
        </div>
      </div>

      {/* Setup Form Body */}
      <div className="f-1 scroll-y" style={{ padding: "16px 16px 100px" }}>
        
        {/* Compact Hero */}
        <div className="text-center mb-6 flex flex-col gap-2">
          <CreateWordRaceHero />
          <div style={{ lineHeight: 1.25 }}>
            <h2 className="h-display text-sm font-black text-slate-800">جهز تحديك الأبجدي</h2>
            <p className="text-[10px] text-slate-400 font-bold max-w-[240px] mx-auto">
              خصص الفئات ونمط الحروف والمؤقت لمباراتك قبل دعوة أصدقائك!
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          
          {/* 1. Letter Mode Selection */}
          <div>
            <SectionLabel
              title="نمط اختيار الحروف العربية"
              note="حدد طريقة توزيع الحروف الكاشفة على الفئات أثناء اللعب"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => setLetterMode("SINGLE_UNIVERSAL")}
                className="game-card-outer text-right cursor-pointer"
              >
                <div
                  className={`game-card-inner p-4 bg-white border rounded-[22px] flex items-start gap-3 transition-all ${
                    letterMode === "SINGLE_UNIVERSAL"
                      ? "border-[#7C3AED] bg-purple-50/20 ring-2 ring-purple-500/20"
                      : "border-slate-100 hover:border-slate-200"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      letterMode === "SINGLE_UNIVERSAL"
                        ? "bg-[#7C3AED] text-white"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    <SvgCheckIcon size={14} />
                  </div>
                  <div>
                    <div className="font-black text-xs text-slate-800">النمط 1: حرف واحد شامل</div>
                    <p className="text-[10px] text-slate-400 font-bold mt-1 leading-relaxed">
                      حرف عربي عشوائي موحد ينطبق على جميع الفئات في المباراة.
                    </p>
                  </div>
                </div>
              </motion.button>

              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => setLetterMode("PER_CATEGORY")}
                className="game-card-outer text-right cursor-pointer"
              >
                <div
                  className={`game-card-inner p-4 bg-white border rounded-[22px] flex items-start gap-3 transition-all ${
                    letterMode === "PER_CATEGORY"
                      ? "border-amber-500 bg-amber-50/20 ring-2 ring-amber-500/20"
                      : "border-slate-100 hover:border-slate-200"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      letterMode === "PER_CATEGORY"
                        ? "bg-amber-500 text-white"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    <SvgCheckIcon size={14} />
                  </div>
                  <div>
                    <div className="font-black text-xs text-slate-800">النمط 2: حرف مختلف لكل فئة</div>
                    <p className="text-[10px] text-slate-400 font-bold mt-1 leading-relaxed">
                      كل فئة تستلم حرفاً عربياً عشوائياً مختلفاً لتحدٍّ أعمق.
                    </p>
                  </div>
                </div>
              </motion.button>
            </div>
          </div>

          {/* 2. Categories Selection Grid */}
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-purple-100">
              <div className="flex flex-col gap-0.5 pr-1 text-right">
                <div className="h-display text-sm font-black text-slate-800 flex items-center gap-1.5">
                  <span className="w-1.5 h-3.5 rounded-full bg-gradient-to-b from-[#FFE600] to-[#EAB308] inline-block" />
                  <span>فئات الكلمات</span>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-50 text-[#7C3AED] font-mono font-bold border border-purple-100">
                    {selectedCategories.length} من {WORD_RACE_CATEGORIES.length}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-bold">
                  اختر فئات الكلمات التي سيتم التنافس عليها (على الأقل فئتان)
                </div>
              </div>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs font-black text-[#7C3AED] hover:underline whitespace-nowrap cursor-pointer"
              >
                {selectedCategories.length === WORD_RACE_CATEGORIES.length ? "تحديد الأساسي" : "تحديد الكل"}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {WORD_RACE_CATEGORIES.map((cat) => {
                const isSelected = selectedCategories.includes(cat.id);
                const IconComponent = CATEGORY_SVG_MAP[cat.icon] || SvgSparklesIcon;

                return (
                  <motion.button
                    key={cat.id}
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={() => toggleCategory(cat.id)}
                    className="game-card-outer text-right cursor-pointer"
                  >
                    <div
                      className={`game-card-inner p-3 bg-white border rounded-[22px] flex items-center gap-2.5 transition-all ${
                        isSelected
                          ? "border-[#7C3AED] bg-purple-50/10"
                          : "border-slate-100 hover:border-slate-200"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          isSelected ? "bg-purple-100/50 text-[#7C3AED]" : "bg-slate-50 text-slate-400"
                        }`}
                      >
                        <IconComponent size={18} />
                      </div>
                      <span
                        className={`text-xs font-black truncate ${
                          isSelected ? "text-[#7C3AED]" : "text-slate-700"
                        }`}
                      >
                        {cat.nameAr}
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* 3. Timer Preset Picker */}
          <div>
            <SectionLabel
              title="مؤقت الجولة"
              note="حدد الوقت المتاح للتفكير وإدخال الكلمات لكل جولة"
            />
            <div className="game-card-outer w-full">
              <div className="game-card-inner p-3 bg-white border border-slate-100 rounded-[22px] flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-xs font-black text-slate-700 pr-1">مدة المؤقت:</span>
                
                <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 border border-slate-200/50 p-1.5 rounded-xl w-full sm:w-auto justify-center">
                  {TIMER_PRESETS.map((p) => {
                    const active = timeLimitSec === p;
                    return (
                      <motion.button
                        key={p}
                        type="button"
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setTimeLimitSec(p)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-colors cursor-pointer ${
                          active
                            ? "bg-[#7C3AED] text-white shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        {p} ثانية
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 4. Room Options (Max Players & Privacy) */}
          <div>
            <SectionLabel
              title="خصائص الغرفة والإتاحة"
              note="إعدادات الخصوصية والحد الأقصى للمتسابقين"
            />
            
            <div className="flex flex-col gap-3">
              {/* Max Players Selector Card */}
              <div className="game-card-outer w-full">
                <div className="game-card-inner p-4 bg-white border border-slate-100 rounded-[22px] flex items-center justify-between gap-4">
                  <div className="flex gap-2.5 items-center flex-1 min-w-0 text-right">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#7C3AED] flex items-center justify-center flex-shrink-0">
                      <SvgUsersIcon size={18} />
                    </div>
                    <div className="flex flex-col" style={{ lineHeight: 1.2 }}>
                      <span className="text-xs font-black text-slate-800">أقصى عدد للاعبين</span>
                      <span className="text-[9px] text-slate-400 font-bold mt-0.5">عدد المتسابقين المسموح بدخولهم الغرفة</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-200/50 p-1 rounded-xl">
                    {PLAYER_PRESETS.map((count) => {
                      const active = maxPlayers === count;
                      return (
                        <motion.button
                          key={count}
                          type="button"
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setMaxPlayers(count)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-colors cursor-pointer ${
                            active
                              ? "bg-[#7C3AED] text-white shadow-sm"
                              : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          {count} لاعبين
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Private Room Toggle */}
              <ToggleRow
                label="غرفة خاصة مغلقة"
                hint={isPrivate ? "الانضمام عبر الرابط أو رمز الكود فقط" : "متاحة للجميع في البحث السريع"}
                icon="shield"
                on={isPrivate}
                onToggle={() => setIsPrivate((v) => !v)}
              />
            </div>
          </div>

        </div>

        {err && (
          <p className="text-[10px] font-black text-rose-600 text-center mt-4">
            {err}
          </p>
        )}
      </div>

      {/* Sticky Bottom Action Create Button */}
      <div className="p-5 z-20 w-full max-w-[32rem] mx-auto absolute bottom-0 left-1/2 -translate-x-1/2">
        <motion.button
          type="button"
          disabled={busy}
          whileTap={{ scale: 0.96 }}
          onClick={() => void handleStart()}
          className="w-full py-4 rounded-2xl text-sm font-black text-white shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2 border border-purple-800 cursor-pointer"
          style={{
            background: "linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)",
          }}
        >
          <ShellIcon name="sparkle" size={16} color="#FFFFFF" />
          {busy ? "جاري إنشاء غرفة اسم حيوان نبات..." : "إنشاء الغرفة والبدء"}
        </motion.button>
      </div>
    </div>
  );
}

/* ── Toggle Row Card ── */
function ToggleRow({
  label,
  hint,
  icon,
  on,
  onToggle,
}: {
  label: string;
  hint: string;
  icon: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="game-card-outer w-full">
      <div className="game-card-inner p-4 bg-white border border-slate-100 rounded-[22px] flex items-center justify-between gap-4">
        <div className="flex gap-2.5 items-start flex-1 min-w-0 text-right">
          <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#7C3AED] flex items-center justify-center flex-shrink-0">
            <ShellIcon name={icon} size={15} color="#7C3AED" />
          </div>
          <div className="flex flex-col" style={{ lineHeight: 1.2 }}>
            <span className="text-xs font-black text-slate-800">{label}</span>
            <span className="text-[9px] text-slate-400 font-bold mt-0.5 leading-tight">{hint}</span>
          </div>
        </div>

        <Toggle on={on} onToggle={onToggle} />
      </div>
    </div>
  );
}

/* ── Section Label ── */
function SectionLabel({ title, note }: { title: string; note?: string }) {
  return (
    <div className="mb-4 pb-2 border-b border-purple-100 flex flex-col gap-1 pr-1 text-right">
      <div className="h-display text-sm font-black text-slate-800 flex items-center gap-1.5">
        <span className="w-1.5 h-3.5 rounded-full bg-gradient-to-b from-[#FFE600] to-[#EAB308] inline-block" />
        {title}
      </div>
      {note && (
        <div className="text-[10px] text-slate-400 font-bold leading-tight">
          {note}
        </div>
      )}
    </div>
  );
}
