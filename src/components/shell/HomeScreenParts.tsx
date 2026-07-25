"use client";

import { motion } from "framer-motion";
import { ShellIcon } from "@/components/shell/ShellIcons";
import { staggerItem, staggerContainer, EASE_OUT } from "@/lib/motion";

export function ActionTile({
  icon,
  title,
  subtitle,
  tint = "indigo",
  badge,
  onClick,
  primary = false,
}: {
  icon: string;
  title: string;
  subtitle: string;
  tint?: "blue" | "indigo" | "purple" | "amber";
  badge?: string;
  onClick?: () => void;
  primary?: boolean;
}) {
  const bgColors = {
    blue: "#00F0FF",      // Cyan
    indigo: "#22C55E",    // Lime Green
    purple: "#7C3AED",    // Purple
    amber: "#FFE600",     // Yellow
  };

  // 1. Primary Bento Card (e.g. Private Room)
  if (primary) {
    return (
      <motion.button
        type="button"
        onClick={onClick}
        variants={staggerItem}
        whileTap={{ scale: 0.97 }}
        className="game-card-outer text-right w-full block select-none"
        style={{ cursor: "pointer" }}
      >
        <div 
          className="game-card-inner p-5 flex flex-col justify-between relative overflow-hidden group min-h-[140px]"
          style={{
            background: "linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)",
            color: "#FFFFFF",
          }}
        >
          {/* Decorative background vector */}
          <div className="absolute left-3 bottom-3 opacity-30 group-hover:scale-110 transition-transform duration-300">
            <svg width="56" height="56" viewBox="0 0 32 32" fill="none">
              <path d="M8 12h12c2.2 0 4 1.8 4 4s-1.8 4-4 4h-2l-4 4v-4H8c-2.2 0-4-1.8-4-4s1.8-4 4-4z" fill="#FFF" opacity="0.15" />
              <path d="M8 12h12c2.2 0 4 1.8 4 4s-1.8 4-4 4h-2l-4 4v-4H8c-2.2 0-4-1.8-4-4s1.8-4 4-4z" stroke="#FFF" strokeWidth="2" strokeLinejoin="round" />
              <circle cx="12" cy="16" r="1.5" fill="#FFF" />
              <circle cx="16" cy="16" r="1.5" fill="#FFF" />
              <circle cx="20" cy="16" r="1.5" fill="#FFF" />
            </svg>
          </div>

          <div className="flex justify-between items-start">
            <span className="text-[9px] font-extrabold uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-full">
              لعب جماعي 👥
            </span>
            {badge ? (
              <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-[#FF007F] text-white">
                {badge}
              </span>
            ) : null}
          </div>

          <div className="mt-6">
            <h3 className="h-display text-lg font-black tracking-tight text-white">
              {title}
            </h3>
            <p className="text-xs mt-1 text-purple-200 font-medium leading-snug max-w-[85%]">
              {subtitle}
            </p>
          </div>
        </div>
      </motion.button>
    );
  }

  // 2. Secondary Bento Cards (Cleaner, soft structuralism, white backgrounds)
  const renderTileIllustration = () => {
    if (icon === "search") { // Join Room Code
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#06B6D4]">
          <rect x="5" y="11" width="14" height="10" rx="2" ry="2" />
          <path d="M12 15v2M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
      );
    }
    if (icon === "shop") { // Store
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#EAB308]">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0" />
        </svg>
      );
    }
    if (icon === "word-race" || icon === "lightning") { // Word Race (اسم حيوان نبات)
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#7C3AED]">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    }
    // Default (Trophy / Ranking / Other)
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#EC4899]">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34M12 2a4 4 0 0 0-4 4v5c0 2.2 1.8 4 4 4s4-1.8 4-4V6a4 4 0 0 0-4-4z" />
      </svg>
    );
  };

  return (
    <motion.button
      type="button"
      onClick={onClick}
      variants={staggerItem}
      whileTap={{ scale: 0.98 }}
      className="game-card-outer text-right w-full block select-none"
      style={{ cursor: "pointer" }}
    >
      <div 
        className="game-card-inner p-4 flex flex-col justify-between relative overflow-hidden group min-h-[140px] border border-black/5"
        style={{ background: "#FFFFFF" }}
      >
        <div className="flex justify-between items-start w-full">
          <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:scale-105 transition-transform duration-200">
            {renderTileIllustration()}
          </div>
          {badge ? (
            <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
              {badge}
            </span>
          ) : null}
        </div>

        <div className="mt-4">
          <h3 className="h-display text-sm font-black tracking-tight text-slate-800">
            {title}
          </h3>
          <p className="text-[10px] mt-0.5 text-slate-400 font-bold leading-snug">
            {subtitle}
          </p>
        </div>
      </div>
    </motion.button>
  );
}

export function ActionGrid({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={staggerContainer(0.07, 0.05)}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 gap-4"
    >
      {children}
    </motion.div>
  );
}

export function MajlisHero({ onPlay }: { onPlay: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: EASE_OUT }}
      className="game-card-outer w-full text-center relative overflow-hidden"
    >
      <div 
        className="game-card-inner p-6 flex flex-col items-center justify-between relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #7C3AED 0%, #4C1D95 100%)",
          color: "#FFFFFF",
        }}
      >
        {/* Glowing radial background inside the card */}
        <div 
          className="absolute pointer-events-none rounded-full" 
          style={{
            width: 150,
            height: 150,
            background: "radial-gradient(circle, rgba(255, 0, 127, 0.2) 0%, transparent 70%)",
            top: -30,
            right: -30,
            filter: "blur(20px)",
          }}
        />

        <div className="flex flex-col items-center">
          <span className="text-[9px] font-extrabold tracking-wider text-purple-200 uppercase px-2.5 py-0.5 rounded bg-white/10 border border-white/20 select-none">
            تحدي الذكاء والتخمين 🕵️‍♂️
          </span>

          <h1 
            className="h-display text-4xl font-black mt-4 text-white tracking-tight select-none"
            style={{
              textShadow: "0 2px 4px rgba(0,0,0,0.15)",
            }}
          >
            مين أنا؟
          </h1>

          <p className="text-xs text-purple-200 max-w-[260px] mt-1.5 font-bold select-none leading-relaxed">
           اسأل بذكاء، فكّر بذكاء، واكتشف البطاقة التي يحملها خصمك قبل أن يكتشف بطاقتك
          </p>
        </div>

        {/* Customized Game Illustration */}
        <div className="my-6 w-full flex items-center justify-center">
          <svg width="200" height="80" viewBox="0 0 200 80" className="opacity-95">
            {/* Card 1: Cyan (Rotated slightly left) */}
            <g transform="translate(60, 40) rotate(-10)">
              <rect x="-20" y="-30" width="40" height="56" rx="8" fill="#00F0FF" stroke="#000000" strokeWidth="1.5" />
              {/* Peeking cartoon eyes inside card */}
              <circle cx="-6" cy="-10" r="4" fill="#FFFFFF" stroke="#000000" strokeWidth="1" />
              <circle cx="-6" cy="-10" r="1.5" fill="#000000" />
              <circle cx="6" cy="-10" r="4" fill="#FFFFFF" stroke="#000000" strokeWidth="1" />
              <circle cx="6" cy="-10" r="1.5" fill="#000000" />
              {/* Secret text symbol */}
              <text x="0" y="14" fontSize="14" fontWeight="900" textAnchor="middle" fill="#000000" fontFamily="var(--display)">من؟</text>
            </g>
            
            {/* Card 2: Hot Pink (Rotated slightly right) */}
            <g transform="translate(100, 36) rotate(8)">
              <rect x="-20" y="-30" width="40" height="56" rx="8" fill="#FF007F" stroke="#000000" strokeWidth="1.5" />
              {/* Mystery symbols */}
              <text x="0" y="8" fontSize="20" fontWeight="900" textAnchor="middle" fill="#FFFFFF" fontFamily="var(--display)">؟</text>
            </g>

            {/* Card 3: Yellow (Center front) */}
            <g transform="translate(140, 42) rotate(3)">
              <rect x="-18" y="-26" width="36" height="52" rx="8" fill="#FFE600" stroke="#000000" strokeWidth="1.5" />
              <text x="0" y="6" fontSize="16" fontWeight="900" textAnchor="middle" fill="#000000">🕵️‍♂️</text>
            </g>

            {/* Magnifying Glass floating */}
            <g transform="translate(25, 30) rotate(-20)">
              <circle cx="10" cy="10" r="8" fill="none" stroke="#000000" strokeWidth="2.5" />
              <line x1="15.5" y1="15.5" x2="24" y2="24" stroke="#000000" strokeWidth="3" strokeLinecap="round" />
            </g>
          </svg>
        </div>

        {/* Premium Island CTA Button */}
        <motion.button
          type="button"
          onClick={onPlay}
          whileTap={{ scale: 0.97 }}
          className="w-full flex items-center justify-between p-1 bg-white/10 hover:bg-white/15 rounded-full border border-white/20 shadow-md group"
          style={{ cursor: "pointer" }}
        >
          <span className="text-white text-base font-black pr-5">
            ابدأ اللعب الآن
          </span>
          <div className="w-10 h-10 rounded-full bg-[#FFE600] flex items-center justify-center shadow-md active:scale-95 transition-transform">
            <ShellIcon name="play" size={18} color="#000000" />
          </div>
        </motion.button>
      </div>
    </motion.div>
  );
}
