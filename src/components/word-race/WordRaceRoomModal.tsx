"use client";

import React, { useState } from "react";
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

const PRESET_DURATIONS = [15, 20, 30, 45, 60, 75, 90, 120, 180];

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
  const [isPrivate, setIsPrivate] = useState<boolean>(initialSettings?.isPrivate || false);

  React.useEffect(() => {
    if (isOpen && initialSettings) {
      setSelectedCategories(initialSettings.categories);
      setLetterMode(initialSettings.letterMode);
      setTimeLimitSec(initialSettings.timeLimitSec);
      setMaxPlayers(initialSettings.maxPlayers);
      setIsPrivate(initialSettings.isPrivate);
    }
  }, [isOpen, initialSettings]);

  if (!isOpen) return null;

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
      isPrivate,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fade-in dir-rtl overflow-y-auto" style={{ direction: "rtl" }}>
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white border border-slate-200/80 rounded-[28px] p-6 sm:p-8 shadow-2xl text-slate-800 space-y-6 my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-200 text-[#7C3AED] flex items-center justify-center">
              <SvgSparklesIcon size={22} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                {isEditing ? "تحديث إعدادات الغرفة" : "إعدادات غرفة اسم حيوان نبات"}
              </h2>
              <p className="text-xs text-slate-500 font-bold">خصص الفئات ونمط الحروف والمؤقت لمباراتك</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all active:scale-95"
          >
            <SvgCrossIcon size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* 1. Letter Mode Selection */}
          <div className="space-y-3">
            <label className="text-xs font-black uppercase text-purple-700 tracking-wider flex items-center gap-1.5">
              <SvgLightningIcon size={16} />
              <span>نمط اختيار الحروف العربية</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setLetterMode("SINGLE_UNIVERSAL")}
                className={`p-4 rounded-2xl border text-right transition-all flex items-start gap-3 ${
                  letterMode === "SINGLE_UNIVERSAL"
                    ? "bg-purple-50/80 border-purple-500 ring-2 ring-purple-500/20 text-purple-950 shadow-sm"
                    : "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700"
                }`}
              >
                <div className={`p-2 rounded-xl mt-0.5 ${letterMode === "SINGLE_UNIVERSAL" ? "bg-[#7C3AED] text-white" : "bg-slate-200 text-slate-500"}`}>
                  <SvgCheckIcon size={14} />
                </div>
                <div>
                  <div className="font-black text-sm">النمط 1: حرف واحد شامل</div>
                  <div className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                    حرف عربي عشوائي موحد ينطبق على جميع الفئات في المباراة.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setLetterMode("PER_CATEGORY")}
                className={`p-4 rounded-2xl border text-right transition-all flex items-start gap-3 ${
                  letterMode === "PER_CATEGORY"
                    ? "bg-amber-50/80 border-amber-500 ring-2 ring-amber-500/20 text-amber-950 shadow-sm"
                    : "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700"
                }`}
              >
                <div className={`p-2 rounded-xl mt-0.5 ${letterMode === "PER_CATEGORY" ? "bg-[#FFE600] text-black" : "bg-slate-200 text-slate-500"}`}>
                  <SvgCheckIcon size={14} />
                </div>
                <div>
                  <div className="font-black text-sm">النمط 2: حرف مختلف لكل فئة</div>
                  <div className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                    كل فئة تستلم حرفاً عربياً عشوائياً مختلفاً.
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Categories Selection Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase text-purple-700 tracking-wider flex items-center gap-1.5">
                <span>الفئات المتاحة</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-sans font-bold">
                  {selectedCategories.length} من {WORD_RACE_CATEGORIES.length}
                </span>
              </label>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs font-bold text-[#7C3AED] hover:underline"
              >
                {selectedCategories.length === WORD_RACE_CATEGORIES.length ? "تحديد الأساسي" : "تحديد الكل"}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-52 overflow-y-auto p-1 custom-scrollbar">
              {WORD_RACE_CATEGORIES.map((cat) => {
                const isSelected = selectedCategories.includes(cat.id);
                const IconComponent = CATEGORY_SVG_MAP[cat.icon] || SvgSparklesIcon;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={`p-3 rounded-2xl border text-right transition-all flex items-center gap-2.5 active:scale-95 ${
                      isSelected
                        ? "bg-purple-50/70 border-purple-300 text-purple-950 font-black shadow-sm"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <div className={`p-2 rounded-xl border ${isSelected ? "bg-white border-purple-200 " + cat.color : "bg-white border-slate-200 text-slate-400"}`}>
                      <IconComponent size={18} />
                    </div>
                    <div className="truncate text-xs">{cat.nameAr}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. CUSTOM DURATION & PLAYER LIMITS */}
          <div className="space-y-4 border-t border-slate-100 pt-4">
            
            {/* Custom Duration Section */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <SvgTimerIcon size={16} className="text-amber-500" />
                  <span>وقت الجولة (بالثواني)</span>
                </span>
                <span className="text-[10px] text-slate-400 font-bold">من 15 إلى 300 ثانية</span>
              </label>

              {/* Preset Duration Chips */}
              <div className="flex flex-wrap gap-1.5">
                {PRESET_DURATIONS.map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setTimeLimitSec(sec)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-sans font-black transition-all active:scale-95 ${
                      timeLimitSec === sec
                        ? "bg-[#7C3AED] text-white shadow-xs"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                    }`}
                  >
                    {sec}ث
                  </button>
                ))}
              </div>

              {/* Custom Input Field */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="number"
                  min={15}
                  max={300}
                  value={timeLimitSec}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setTimeLimitSec(val);
                  }}
                  onBlur={() => {
                    setTimeLimitSec((prev) => Math.min(300, Math.max(15, prev || 15)));
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-sans font-black text-slate-900 focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-purple-500/20"
                  placeholder="أدخل وقت مخصص بالثواني..."
                />
                <span className="text-xs font-black text-purple-900 shrink-0">ثانية</span>
              </div>
            </div>

            {/* Max Players & Privacy Grid */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <SvgUsersIcon size={15} className="text-blue-500" />
                  <span>الحد الأقصى للاعبين</span>
                </label>
                <select
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-purple-600"
                >
                  <option value={2}>لاعبان (1v1)</option>
                  <option value={3}>3 لاعبين</option>
                  <option value={4}>4 لاعبين</option>
                  <option value={6}>6 لاعبين</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <SvgShieldIcon size={15} className="text-emerald-500" />
                  <span>خصوصية الغرفة</span>
                </label>
                <select
                  value={isPrivate ? "true" : "false"}
                  onChange={(e) => setIsPrivate(e.target.value === "true")}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-purple-600"
                >
                  <option value="false">عامة (متاحة للجميع)</option>
                  <option value="true">خاصة (برمز الغرفة فقط)</option>
                </select>
              </div>
            </div>

          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isBusy}
              className="w-full py-3.5 rounded-2xl bg-[#7C3AED] hover:bg-purple-700 text-white text-xs font-black shadow-lg shadow-purple-200 transition-all active:scale-95 disabled:opacity-50"
            >
              {isBusy ? "جاري الحفظ..." : isEditing ? "تحديث إعدادات الغرفة" : "إنشاء الغرفة وبدء الصالة"}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
