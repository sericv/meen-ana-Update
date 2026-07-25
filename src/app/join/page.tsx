"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import { AuthGate } from "@/components/auth/AuthGate";
import { useAuth } from "@/components/providers/AuthProvider";
import { ShellIcon } from "@/components/shell/ShellIcons";
import { useDefaultOnlinePresence } from "@/hooks/useDefaultOnlinePresence";
import { isFullAccountUser } from "@/lib/auth/google-user";
import { joinRoomByCode } from "@/lib/firestore/rooms.client";
import { motion, AnimatePresence } from "framer-motion";

const JoinHeroIllustration = () => (
  <svg className="w-24 h-24 mx-auto text-[#7C3AED]" viewBox="0 0 100 100" fill="none">
    <circle cx="50" cy="50" r="45" fill="rgba(124, 58, 237, 0.04)" />
    <path d="M35 55c-4-4-6-10-6-16a21 21 0 0 1 42 0c0 6-2 12-6 16L50 70 35 55z" fill="#FFFFFF" stroke="#7C3AED" strokeWidth="2.5" />
    <circle cx="50" cy="38" r="8" fill="#7C3AED" fillOpacity="0.2" />
    <circle cx="50" cy="50" r="14" fill="#FFFFFF" stroke="#7C3AED" strokeWidth="3" />
    <path d="M48 45c0-1.5 1-2.5 2.5-2.5s2.5 1 2.5 2.5c0 1.5-1.5 2-2 2.5-.5.5-.5 1-.5 1.5m0 3v0.5" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const VectorKeyIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
  </svg>
);

const GamepadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="6" y1="12" x2="10" y2="12" />
    <line x1="8" y1="10" x2="8" y2="14" />
    <rect x="2" y="6" width="20" height="12" rx="3" />
  </svg>
);

const UsersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const PlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export default function JoinPage() {
  return (
    <AuthGate>
      <JoinInner />
    </AuthGate>
  );
}

function JoinInner() {
  const { user } = useAuth();
  useDefaultOnlinePresence(user?.uid ?? null, isFullAccountUser(user));
  const router = useRouter();
  
  const [codeArray, setCodeArray] = useState<string[]>(Array(6).fill(""));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const code = codeArray.join("").toUpperCase();

  const submit = async () => {
    if (!user || code.length < 4) return;
    setBusy(true);
    setErr(null);
    try {
      const { roomId } = await joinRoomByCode({
        code,
        uid: user.uid,
        displayName: user.displayName || user.email || "زائر",
      });
      router.push(`/room/${roomId}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "تعذر الانضمام للغرفة");
    } finally {
      setBusy(false);
    }
  };

  const handleInputChange = (index: number, val: string) => {
    const cleanVal = val.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!cleanVal) {
      const newArray = [...codeArray];
      newArray[index] = "";
      setCodeArray(newArray);
      return;
    }

    // Take the last character typed
    const char = cleanVal[cleanVal.length - 1];
    const newArray = [...codeArray];
    newArray[index] = char;
    setCodeArray(newArray);
    setErr(null);

    // Auto-advance to the next input box
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!codeArray[index] && index > 0) {
        const newArray = [...codeArray];
        newArray[index - 1] = "";
        setCodeArray(newArray);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newArray = [...codeArray];
        newArray[index] = "";
        setCodeArray(newArray);
      }
      setErr(null);
    } else if (e.key === "Enter" && code.length >= 4 && !busy) {
      void submit();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    if (!pastedData) return;

    const newArray = [...codeArray];
    for (let i = 0; i < 6; i++) {
      newArray[i] = pastedData[i] || "";
    }
    setCodeArray(newArray);
    setErr(null);

    // Focus on the last filled box or the next empty box
    const focusIndex = Math.min(5, pastedData.length);
    inputRefs.current[focusIndex]?.focus();
  };

  const canJoin = !busy && code.length >= 4;

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
              <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-wider">انضمام لغرفة</span>
              <span className="h-display text-sm font-black text-slate-800">الدخول برمز</span>
            </div>
          </div>
          <div style={{ width: 32 }} />
        </div>
      </div>

      {/* Form content */}
      <div className="f-1 scroll-y" style={{ padding: "16px 16px 100px" }}>
        
        {/* Compact Hero */}
        <div className="text-center mb-6 flex flex-col gap-2">
          <JoinHeroIllustration />
          <div style={{ lineHeight: 1.25 }}>
            <h2 className="h-display text-sm font-black text-slate-800">أصدقاؤك بانتظارك!</h2>
            <p className="text-[10px] text-slate-400 font-bold max-w-[220px] mx-auto">
              أدخل رمز الغرفة الخاص والمكوّن من 6 خانات للانضمام للعب
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          
          {/* Room Code Card & Inputs */}
          <div className="game-card-outer w-full">
            <div className="game-card-inner p-5 bg-white border border-slate-100 rounded-[22px] flex flex-col gap-4 text-center">
              
              {/* Six Input Boxes */}
              <div className="flex items-center justify-center gap-2" dir="ltr">
                {codeArray.map((char, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    maxLength={1}
                    value={char}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className="w-10 h-12 text-center text-lg font-black rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 focus:bg-white focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 focus:outline-none transition-all"
                  />
                ))}
              </div>

              {err ? (
                <p className="text-[10px] font-black text-rose-600">
                  {err}
                </p>
              ) : (
                <p className="text-[9px] font-bold text-slate-400">
                  الرمز يتكون من 6 حروف أو أرقام إنجليزية
                </p>
              )}

            </div>
          </div>

          {/* Help Bento Card */}
          <div className="game-card-outer w-full">
            <div className="game-card-inner p-4 bg-purple-50/10 border border-slate-100 rounded-[22px] flex items-start gap-3 text-right">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#7C3AED] flex items-center justify-center flex-shrink-0">
                <VectorKeyIcon />
              </div>
              <div className="flex flex-col" style={{ lineHeight: 1.25 }}>
                <span className="text-xs font-black text-slate-800">كيف تحصل على الرمز؟</span>
                <span className="text-[9px] text-slate-400 font-bold mt-0.5 leading-tight">
                  اطلب من منشئ الغرفة أو صديقك نسخ الرمز المكوّن من 6 خانات وإرساله لك للدخول الفوري.
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions / Shortcuts */}
          <div>
            <SectionLabel title="اختصارات اللعب السريع" note="أو اختر من خيارات البدء البديلة" />
            
            <div className="flex flex-col gap-3">
              
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push("/play/new")}
                className="game-card-outer w-full text-right"
              >
                <div className="game-card-inner p-4 bg-white border border-slate-100 rounded-[22px] flex items-center justify-between gap-4">
                  <div className="flex gap-2.5 items-center flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#7C3AED] flex items-center justify-center flex-shrink-0">
                      <PlusIcon />
                    </div>
                    <div className="flex flex-col" style={{ lineHeight: 1.2 }}>
                      <span className="text-xs font-black text-slate-800">إنشاء غرفة خاصة</span>
                      <span className="text-[9px] text-slate-400 font-bold mt-0.5">اصنع غرفتك الخاصة واضبط القوانين</span>
                    </div>
                  </div>
                  <span className="text-slate-300 font-black text-xs">←</span>
                </div>
              </motion.button>

              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push("/play/random")}
                className="game-card-outer w-full text-right"
              >
                <div className="game-card-inner p-4 bg-white border border-slate-100 rounded-[22px] flex items-center justify-between gap-4">
                  <div className="flex gap-2.5 items-center flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#7C3AED] flex items-center justify-center flex-shrink-0">
                      <GamepadIcon />
                    </div>
                    <div className="flex flex-col" style={{ lineHeight: 1.2 }}>
                      <span className="text-xs font-black text-slate-800">بحث عشوائي سريع</span>
                      <span className="text-[9px] text-slate-400 font-bold mt-0.5">ادخل طابور البحث المباشر للعب فوراً</span>
                    </div>
                  </div>
                  <span className="text-slate-300 font-black text-xs">←</span>
                </div>
              </motion.button>

              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push("/ranking")}
                className="game-card-outer w-full text-right"
              >
                <div className="game-card-inner p-4 bg-white border border-slate-100 rounded-[22px] flex items-center justify-between gap-4">
                  <div className="flex gap-2.5 items-center flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#7C3AED] flex items-center justify-center flex-shrink-0">
                      <UsersIcon />
                    </div>
                    <div className="flex flex-col" style={{ lineHeight: 1.2 }}>
                      <span className="text-xs font-black text-slate-800">المتصدرون والتصنيف</span>
                      <span className="text-[9px] text-slate-400 font-bold mt-0.5">شاهد أبطال التخمين هذا الموسم</span>
                    </div>
                  </div>
                  <span className="text-slate-300 font-black text-xs">←</span>
                </div>
              </motion.button>

            </div>
          </div>

        </div>

      </div>

      {/* Sticky Action Footer Join button */}
      <div className="p-5 z-20 w-full max-w-[32rem] mx-auto absolute bottom-0 left-1/2 -translate-x-1/2">
        <motion.button
          type="button"
          disabled={!canJoin}
          whileTap={{ scale: 0.96 }}
          onClick={() => void submit()}
          className={`w-full py-4 rounded-2xl text-sm font-black text-white shadow-md transition-transform flex items-center justify-center gap-2 border ${
            canJoin 
              ? "bg-gradient-to-r from-[#7C3AED] to-[#A78BFA] border-purple-800" 
              : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
          }`}
          style={{ cursor: canJoin ? "pointer" : "not-allowed" }}
        >
          <ShellIcon name="play" size={16} color={canJoin ? "#FFFFFF" : "#94A3B8"} />
          {busy ? "جاري الاتصال والتحقق..." : "دخول الغرفة واللعب"}
        </motion.button>
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
