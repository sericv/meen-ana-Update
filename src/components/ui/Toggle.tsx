"use client";

import { motion } from "framer-motion";

interface ToggleProps {
  on: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function Toggle({ on, onToggle, disabled = false }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={onToggle}
      className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 flex items-center border border-transparent focus:outline-none ${
        on 
          ? "bg-[#7C3AED] justify-end border-[#7C3AED]/20 shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)]" 
          : "bg-slate-200 justify-start border-slate-300/30"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <motion.div
        layout
        className="w-4 h-4 rounded-full bg-white shadow-[0_2px_4px_rgba(15,23,42,0.15)]"
        transition={{
          type: "spring",
          stiffness: 550,
          damping: 32,
        }}
      />
    </button>
  );
}
