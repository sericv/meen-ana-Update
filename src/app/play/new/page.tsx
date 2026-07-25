"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AuthGate } from "@/components/auth/AuthGate";
import { useAuth } from "@/components/providers/AuthProvider";
import { ShellIcon } from "@/components/shell/ShellIcons";
import { useDefaultOnlinePresence } from "@/hooks/useDefaultOnlinePresence";
import { isFullAccountUser } from "@/lib/auth/google-user";
import { fetchCategories } from "@/lib/firestore/categories.client";
import { createPrivateRoom } from "@/lib/firestore/rooms.client";
import {
  ANSWER_PHASE_SECONDS,
  QUESTION_PHASE_SECONDS,
  ROOM_TIMER_MAX_SECONDS,
  ROOM_TIMER_MIN_SECONDS,
} from "@/lib/game/constants";
import { CATEGORIES as LOCAL_CATEGORIES, DEFAULT_CATEGORY_ID } from "@/lib/game/categories";
import type { Category } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { Toggle } from "@/components/ui/Toggle";

const Q_PRESETS = [10, 20, 30, 60] as const;
const A_PRESETS = [10, 15, 20, 30] as const;

/* ── Vector Illustrations for categories ── */

const PawIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 10c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm-5 4c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm10 0c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm-5 6c-2.2 0-4-1.8-4-4 0-1.5.8-2.8 2-3.5 1-.6 2.2-.6 3.2 0 1.2.7 2 2 2 3.5 0 2.2-1.8 4-4 4z" />
  </svg>
);

const FilmIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
    <line x1="7" y1="2" x2="7" y2="22" />
    <line x1="17" y1="2" x2="17" y2="22" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <line x1="2" y1="7" x2="7" y2="7" />
    <line x1="2" y1="17" x2="7" y2="17" />
    <line x1="17" y1="17" x2="22" y2="17" />
    <line x1="17" y1="7" x2="22" y2="7" />
  </svg>
);

const GamepadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="6" y1="12" x2="10" y2="12" />
    <line x1="8" y1="10" x2="8" y2="14" />
    <line x1="15" y1="13" x2="15.01" y2="13" />
    <line x1="18" y1="11" x2="18.01" y2="11" />
    <rect x="2" y="6" width="20" height="12" rx="3" />
  </svg>
);

const SparklesIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707.707M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z" />
  </svg>
);

const GeneralIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const getCategoryIcon = (id: string) => {
  switch (id) {
    case "animals":
      return <PawIcon />;
    case "movies":
      return <FilmIcon />;
    case "games":
      return <GamepadIcon />;
    case "anime":
      return <SparklesIcon />;
    default:
      return <GeneralIcon />;
  }
};

const CreateRoomHero = () => (
  <svg className="w-24 h-24 mx-auto text-[#7C3AED]" viewBox="0 0 100 100" fill="none">
    <circle cx="50" cy="50" r="45" fill="rgba(124, 58, 237, 0.04)" />
    <rect x="35" y="25" width="30" height="42" rx="4" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" transform="rotate(-6 50 46)" />
    <circle cx="46" cy="40" r="5" fill="#7C3AED" fillOpacity="0.2" />
    <path d="M42 50h12M42 56h8" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="50" cy="50" r="14" fill="#FFFFFF" stroke="#7C3AED" strokeWidth="3" />
    <path d="M48 45c0-1.5 1-2.5 2.5-2.5s2.5 1 2.5 2.5c0 1.5-1.5 2-2 2.5-.5.5-.5 1-.5 1.5m0 3v0.5" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export default function NewRoomPage() {
  return (
    <AuthGate>
      <NewRoomInner />
    </AuthGate>
  );
}

function NewRoomInner() {
  const { user } = useAuth();
  useDefaultOnlinePresence(user?.uid ?? null, isFullAccountUser(user));
  const router = useRouter();
  
  const localFallback = useMemo<Category[]>(
    () => LOCAL_CATEGORIES.map((c) => ({ id: c.id, nameAr: c.nameAr, slug: c.slug, order: c.order })),
    [],
  );
  
  const [cats, setCats] = useState<Category[]>(localFallback);
  const [catId, setCatId] = useState(DEFAULT_CATEGORY_ID);
  const [questionTimerSec, setQuestionTimerSec] = useState(QUESTION_PHASE_SECONDS);
  const [answerTimerSec, setAnswerTimerSec] = useState(ANSWER_PHASE_SECONDS);
  const [voiceMode, setVoiceMode] = useState(false);
  const [hintsEnabled, setHintsEnabled] = useState(true);
  const [customCardsEnabled, setCustomCardsEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void fetchCategories()
      .then((remote) => {
        if (remote.length === 0) return;
        const remoteIds = new Set(remote.map((c) => c.id));
        const localOnly = localFallback.filter((c) => !remoteIds.has(c.id));
        const merged = [...remote, ...localOnly].sort(
          (a, b) => (a.order ?? 99) - (b.order ?? 99),
        );
        setCats(merged);
      })
      .catch(() => undefined);
  }, [localFallback]);

  const start = async () => {
    if (!user) return;
    setBusy(true);
    setErr(null);
    try {
      const clamp = (v: number) =>
        Math.min(ROOM_TIMER_MAX_SECONDS, Math.max(ROOM_TIMER_MIN_SECONDS, Math.round(v)));
      const { roomId } = await createPrivateRoom({
        uid: user.uid,
        displayName: user.displayName || user.email || "زائر",
        categoryId: catId,
        questionTimerSec: clamp(questionTimerSec),
        answerTimerSec: clamp(answerTimerSec),
        voiceMode,
        hintsEnabled,
        customCardsEnabled,
        vsBot: false,
      });
      router.push(`/room/${roomId}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "تعذر إنشاء الغرفة");
    } finally {
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
              className="w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center active:scale-95 transition-transform"
              onClick={() => router.push("/")}
              aria-label="رجوع"
              style={{ cursor: "pointer" }}
            >
              <ShellIcon name="back" size={16} color="#64748B" />
            </button>
            <div className="flex flex-col text-right justify-center" style={{ lineHeight: 1.15 }}>
              <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-wider">تجهيز الجلسة</span>
              <span className="h-display text-sm font-black text-slate-800">إنشاء غرفة خاصة</span>
            </div>
          </div>
          <div style={{ width: 32 }} />
        </div>
      </div>

      {/* Setup Form */}
      <div className="f-1 scroll-y" style={{ padding: "16px 16px 100px" }}>
        
        {/* Compact Hero */}
        <div className="text-center mb-6 flex flex-col gap-2">
          <CreateRoomHero />
          <div style={{ lineHeight: 1.25 }}>
            <h2 className="h-display text-sm font-black text-slate-800">جهز تحديك المثالي</h2>
            <p className="text-[10px] text-slate-400 font-bold max-w-[220px] mx-auto">
              اضبط قواعد اللعب المفضلة لديك قبل دعوة أصدقائك للمباراة!
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          
          {/* Category Selector Section */}
          <div>
            <SectionLabel title="الفئة الرئيسية" note="اختر فئة الكلمات التي سيتم التخمين منها" />
            <div className="grid grid-cols-2 gap-3">
              {cats.map((c) => {
                const isSelected = catId === c.id;
                return (
                  <motion.button
                    key={c.id}
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setCatId(c.id)}
                    className="game-card-outer text-right"
                    style={{ cursor: "pointer" }}
                  >
                    <div
                      className={`game-card-inner p-3 bg-white border rounded-[22px] flex items-center gap-2.5 transition-all ${
                        isSelected ? "border-[#7C3AED] bg-purple-50/10" : "border-slate-100"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                          isSelected ? "bg-purple-100/50 text-[#7C3AED]" : "bg-slate-50 text-slate-400"
                        }`}
                      >
                        {getCategoryIcon(c.id)}
                      </div>
                      <span
                        className={`text-xs font-black ${
                          isSelected ? "text-[#7C3AED]" : "text-slate-700"
                        }`}
                      >
                        {c.nameAr}
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Time Limit Pickers */}
          <div>
            <SectionLabel title="مؤقت الجولات" note="حدد المدة الزمنية المتاحة للتفكير في كل مرحلة" />
            <div className="flex flex-col gap-4">
              <TimerPick label="وقت السؤال" value={questionTimerSec} presets={Q_PRESETS} onChange={setQuestionTimerSec} />
              <TimerPick label="وقت الإجابة" value={answerTimerSec} presets={A_PRESETS} onChange={setAnswerTimerSec} />
            </div>
          </div>

          {/* Toggle Switches Options */}
          <div>
            <SectionLabel title="خصائص اللعب الإضافية" note="قوانين إضافية لتخصيص متعة الغرفة" />
            
            <div className="flex flex-col gap-3">
              <ToggleRow
                label="وضع الجلسة"
                hint={voiceMode ? "دردشة صوتية فقط — بدون دردشة نصية" : "دردشة نصية وتخمين مرن أثناء اللعب"}
                icon={voiceMode ? "sound" : "chat"}
                on={voiceMode}
                onToggle={() => setVoiceMode((v) => !v)}
              />

              <ToggleRow
                label="تفعيل التلميحات"
                hint={hintsEnabled ? "يُسمح للاعبين باستخدام تلميحات المتجر لتسهيل الحل" : "تعطيل التلميحات تماماً للحصول على منافسة أصعب"}
                icon="lightbulb"
                on={hintsEnabled}
                onToggle={() => setHintsEnabled((v) => !v)}
              />

              <ToggleRow
                label="بطاقة الخصم المخصصة"
                hint={customCardsEnabled ? "كل لاعب يختار صورة وإجابة سرية لخصمه في اللوبي" : "استخدام الأوراق والأسماء العشوائية التلقائية من اللعبة"}
                icon="image"
                on={customCardsEnabled}
                onToggle={() => setCustomCardsEnabled((v) => !v)}
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

      {/* Sticky Bottom Action Create button */}
      <div className="p-5 z-20 w-full max-w-[32rem] mx-auto absolute bottom-0 left-1/2 -translate-x-1/2">
        <motion.button
          type="button"
          disabled={busy}
          whileTap={{ scale: 0.96 }}
          onClick={() => void start()}
          className="w-full py-4 rounded-2xl text-sm font-black text-white shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2 border border-purple-800"
          style={{
            background: "linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)",
            cursor: "pointer",
          }}
        >
          <ShellIcon name="sparkle" size={16} color="#FFFFFF" />
          {busy ? "جاري إنشاء الغرفة السحرية..." : "إنشاء الغرفة والبدء"}
        </motion.button>
      </div>
    </div>
  );
}

/* ── Timer segmented selector ── */
function TimerPick({
  label,
  value,
  presets,
  onChange,
}: {
  label: string;
  value: number;
  presets: readonly number[];
  onChange: (v: number) => void;
}) {
  return (
    <div className="game-card-outer w-full">
      <div className="game-card-inner p-3 bg-white border border-slate-100 rounded-[22px] flex items-center justify-between gap-3">
        <span className="text-xs font-black text-slate-700 pr-1">{label}</span>
        
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/50 p-1 rounded-xl">
          {presets.map((p) => {
            const active = value === p;
            return (
              <motion.button
                key={p}
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => onChange(p)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-colors ${
                  active 
                    ? "bg-[#7C3AED] text-white shadow-sm" 
                    : "text-slate-500 hover:text-slate-700"
                }`}
                style={{ cursor: "pointer" }}
              >
                {p} ثانية
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Toggle Row card ── */
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

        {/* Toggle Switch */}
        <Toggle on={on} onToggle={onToggle} />
      </div>
    </div>
  );
}

/* ── Section label ── */
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
