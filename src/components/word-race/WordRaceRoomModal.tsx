"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { WordRaceRoomSettings, LetterMode } from "@/types/word-race";
import { WORD_RACE_CATEGORIES } from "@/lib/game/word-race-data";
import {
  CATEGORY_SVG_MAP,
  SvgCheckIcon,
  SvgCrossIcon,
  SvgTimerIcon,
  SvgUsersIcon,
  SvgShieldIcon,
  SvgLightningIcon,
  SvgSparklesIcon,
} from "@/lib/game/word-race-svgs";

interface WordRaceRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (settings: WordRaceRoomSettings) => void;
  isBusy?: boolean;
  initialSettings?: WordRaceRoomSettings;
  isEditing?: boolean;
}

const PRESET_DURATIONS = [15, 20, 30, 45, 60, 75, 90, 120, 180, 300];

export const WordRaceRoomModal: React.FC<WordRaceRoomModalProps> = ({
  isOpen,
  onClose,
  onCreateRoom,
  isBusy = false,
  initialSettings,
  isEditing = false,
}) => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialSettings?.categories || ["name", "animal", "plant", "object", "country", "city"]
  );
  const [letterMode, setLetterMode] = useState<LetterMode>(initialSettings?.letterMode || "SINGLE_UNIVERSAL");
  const [timeLimitSec, setTimeLimitSec] = useState<number>(initialSettings?.timeLimitSec || 90);
  const [maxPlayers, setMaxPlayers] = useState<number>(initialSettings?.maxPlayers || 2);
  const [roundsCount, setRoundsCount] = useState<number>(initialSettings?.roundsCount || 3);
  const [isPrivate, setIsPrivate] = useState<boolean>(initialSettings?.isPrivate || false);

  useEffect(() => {
    if (isOpen && initialSettings) {
      setSelectedCategories(initialSettings.categories);
      setLetterMode(initialSettings.letterMode);
      setTimeLimitSec(initialSettings.timeLimitSec);
      setMaxPlayers(initialSettings.maxPlayers);
      setRoundsCount(initialSettings.roundsCount || 3);
      setIsPrivate(initialSettings.isPrivate);
    }
  }, [isOpen, initialSettings]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateRoom({
      categories: selectedCategories,
      letterMode,
      timeLimitSec: Math.min(300, Math.max(15, timeLimitSec)),
      maxPlayers,
      roundsCount,
      isPrivate,
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Glassmorphic Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs"
          />

          {/* Inline Side Panel / Drawer Container */}
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="fixed top-0 right-0 z-50 h-full w-full max-w-lg bg-white/95 backdrop-blur-xl border-l border-slate-200/90 shadow-2xl overflow-y-auto custom-scrollbar p-5 sm:p-7 text-slate-800 space-y-6 dir-rtl select-none"
            style={{ direction: "rtl" }}
          >
            {/* Top Drag Handle Bar (Mobile) */}
            <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-1 sm:hidden" />

            {/* 1. Side Panel Header Bar */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-200 text-[#7C3AED] flex items-center justify-center shadow-2xs">
                  <SvgSparklesIcon size={22} />
                </div>
                <div>
                  <h2 className="h-display text-lg sm:text-xl font-black text-slate-900">
                    {isEditing ? "تعديل إعدادات المباراة" : "إعدادات غرفة اسم حيوان نبات"}
                  </h2>
                  <p className="text-xs text-slate-500 font-bold mt-0.5">خصص الفئات ونمط الحروف والجولات للمباراة</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
              >
                <SvgCrossIcon size={18} />
              </button>
            </div>

            {/* 2. Side Panel Form */}
            <form onSubmit={handleSubmit} className="space-y-6 pb-6">
              
              {/* CARD 1: Letter Mode Selection */}
              <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase text-purple-700 tracking-wider flex items-center gap-1.5">
                    <SvgLightningIcon size={16} />
                    <span>نمط اختيار الحروف العربية</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setLetterMode("SINGLE_UNIVERSAL")}
                    className={`p-3.5 rounded-2xl border text-right transition-all flex items-start gap-3 cursor-pointer ${
                      letterMode === "SINGLE_UNIVERSAL"
                        ? "bg-purple-50/90 border-[#7C3AED] ring-2 ring-purple-500/20 text-purple-950 shadow-2xs"
                        : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
                    }`}
                  >
                    <div className={`p-2 rounded-xl mt-0.5 shrink-0 ${letterMode === "SINGLE_UNIVERSAL" ? "bg-[#7C3AED] text-white" : "bg-slate-200 text-slate-500"}`}>
                      <SvgCheckIcon size={14} />
                    </div>
                    <div>
                      <div className="font-black text-xs sm:text-sm text-slate-900">النمط 1: حرف واحد شامل</div>
                      <div className="text-xs text-slate-500 font-medium mt-0.5 leading-relaxed">
                        حرف عربي عشوائي موحد ينطبق على جميع الفئات في المباراة.
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLetterMode("PER_CATEGORY")}
                    className={`p-3.5 rounded-2xl border text-right transition-all flex items-start gap-3 cursor-pointer ${
                      letterMode === "PER_CATEGORY"
                        ? "bg-amber-50/90 border-amber-500 ring-2 ring-amber-500/20 text-amber-950 shadow-2xs"
                        : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
                    }`}
                  >
                    <div className={`p-2 rounded-xl mt-0.5 shrink-0 ${letterMode === "PER_CATEGORY" ? "bg-[#FFE600] text-black font-black" : "bg-slate-200 text-slate-500"}`}>
                      <SvgCheckIcon size={14} />
                    </div>
                    <div>
                      <div className="font-black text-xs sm:text-sm text-slate-900">النمط 2: حرف مختلف لكل فئة</div>
                      <div className="text-xs text-slate-500 font-medium mt-0.5 leading-relaxed">
                        كل فئة تستلم حرفاً عربياً عشوائياً مختلفاً.
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* CARD 2: Categories Selection Grid */}
              <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-4 space-y-3.5 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-black uppercase text-purple-700 tracking-wider flex items-center gap-1.5">
                      <SvgSparklesIcon size={16} />
                      <span>الفئات المتاحة في الجولة</span>
                    </label>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-100 border border-purple-200 text-[#7C3AED] font-sans font-black">
                      {selectedCategories.length} من {WORD_RACE_CATEGORIES.length}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-xs font-black text-[#7C3AED] hover:underline cursor-pointer"
                  >
                    {selectedCategories.length === WORD_RACE_CATEGORIES.length ? "الأساسي" : "تحديد الكل"}
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto p-1 custom-scrollbar">
                  {WORD_RACE_CATEGORIES.map((cat) => {
                    const isSelected = selectedCategories.includes(cat.id);
                    const IconComponent = CATEGORY_SVG_MAP[cat.icon] || SvgSparklesIcon;

                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCategory(cat.id)}
                        className={`p-2.5 rounded-2xl border text-right transition-all flex items-center gap-2 active:scale-95 cursor-pointer ${
                          isSelected
                            ? "bg-white border-purple-300 ring-2 ring-purple-400/20 text-purple-950 font-black shadow-2xs"
                            : "bg-white/60 border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        <div className={`p-1.5 rounded-xl border shrink-0 ${isSelected ? "bg-purple-50 border-purple-200 " + cat.color : "bg-slate-100 border-slate-200 text-slate-400"}`}>
                          <IconComponent size={16} />
                        </div>
                        <span className="text-xs font-bold text-slate-800 truncate">{cat.nameAr}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* CARD 3: Duration, Player Limits & Privacy Segmented Pickers */}
              <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-4 space-y-4 shadow-2xs">
                
                {/* Preset Duration Grid & Custom Input */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                    <label className="text-xs font-black uppercase text-purple-700 tracking-wider flex items-center gap-1.5">
                      <SvgTimerIcon size={16} className="text-amber-500" />
                      <span>وقت الجولة (بالثواني)</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-bold">15ث - 300ث</span>
                  </div>

                  {/* 10 Segmented Preset Timer Buttons */}
                  <div className="grid grid-cols-5 gap-1.5">
                    {PRESET_DURATIONS.map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => setTimeLimitSec(sec)}
                        className={`py-2 rounded-xl text-xs font-sans font-black transition-all active:scale-95 cursor-pointer ${
                          timeLimitSec === sec
                            ? "bg-[#7C3AED] text-white shadow-2xs scale-102"
                            : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                      >
                        {sec}ث
                      </button>
                    ))}
                  </div>

                  {/* Secondary Custom Time Input */}
                  <div className="flex items-center gap-3 pt-1">
                    <div className="flex-1 flex items-center gap-2 bg-white border border-slate-300 rounded-xl px-3 py-2 shadow-inner">
                      <span className="text-xs font-bold text-slate-400">وقت مخصص:</span>
                      <input
                        type="number"
                        min={15}
                        max={300}
                        value={timeLimitSec}
                        onChange={(e) => setTimeLimitSec(Number(e.target.value))}
                        onBlur={() => setTimeLimitSec((prev) => Math.min(300, Math.max(15, prev || 15)))}
                        className="w-full bg-transparent text-xs font-sans font-black text-slate-900 focus:outline-none"
                        placeholder="90"
                      />
                      <span className="text-xs font-black text-[#7C3AED] shrink-0">ثانية</span>
                    </div>
                  </div>
                </div>

                {/* Segmented Pickers for Rounds Count, Max Players & Privacy */}
                <div className="space-y-3.5 border-t border-slate-200/60 pt-3.5">

                  {/* Number of Rounds Segmented Pill Picker */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                      <SvgSparklesIcon size={16} className="text-purple-600" />
                      <span>عدد الجولات في المباراة:</span>
                    </label>
                    <div className="grid grid-cols-4 gap-1.5 p-1 bg-white border border-slate-200 rounded-2xl">
                      {[1, 3, 5, 7].map((count) => (
                        <button
                          key={count}
                          type="button"
                          onClick={() => setRoundsCount(count)}
                          className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            roundsCount === count
                              ? "bg-[#7C3AED] text-white font-black shadow-2xs"
                              : "text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {count === 1 ? "جولة" : `${count} جولات`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    
                    {/* Max Players Segmented Pill Picker */}
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                        <SvgUsersIcon size={16} className="text-blue-500" />
                        <span>الحد الأقصى للاعبين:</span>
                      </label>
                      <div className="grid grid-cols-4 gap-1.5 p-1 bg-white border border-slate-200 rounded-2xl">
                        {[2, 3, 4, 6].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setMaxPlayers(num)}
                            className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              maxPlayers === num
                                ? "bg-[#7C3AED] text-white font-black shadow-2xs"
                                : "text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            {num === 2 ? "1v1" : `${num} لاعبين`}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Privacy Segmented Pill Picker */}
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                        <SvgShieldIcon size={16} className="text-emerald-500" />
                        <span>خصوصية الغرفة:</span>
                      </label>
                      <div className="grid grid-cols-2 gap-1.5 p-1 bg-white border border-slate-200 rounded-2xl">
                        <button
                          type="button"
                          onClick={() => setIsPrivate(false)}
                          className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            !isPrivate
                              ? "bg-emerald-600 text-white font-black shadow-2xs"
                              : "text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          عامة (للجميع)
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsPrivate(true)}
                          className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isPrivate
                              ? "bg-amber-600 text-white font-black shadow-2xs"
                              : "text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          خاصة (برمز)
                        </button>
                      </div>
                    </div>

                  </div>

                </div>

              </div>

              {/* Submit Action Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isBusy}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#7C3AED] to-purple-900 text-white text-xs sm:text-sm font-black shadow-[0_6px_20px_rgba(124,58,237,0.35)] hover:shadow-lg transition-all active:scale-98 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  <SvgSparklesIcon size={16} />
                  <span>{isBusy ? "جاري الحفظ..." : isEditing ? "حفظ وتطبيق إعدادات الغرفة ⚡" : "إنشاء الغرفة وبدء الصالة"}</span>
                </button>
              </div>

            </form>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
