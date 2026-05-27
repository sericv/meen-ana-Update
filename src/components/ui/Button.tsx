"use client";

import { motion, type HTMLMotionProps } from "framer-motion";

type Props = HTMLMotionProps<"button"> & {
  variant?: "primary" | "ghost" | "danger";
  size?: "sm" | "md";
};

/* Emil Kowalski principles:
   - scale(0.97) on press — pure compositor, no layout cost
   - No translateY on press (causes paint) — only on hover (pointer: fine)
   - Strong ease-out cubic-bezier(0.23, 1, 0.32, 1)
   - Enter slower, exit fast (spring handles this)
*/
const SPRING = { type: "spring", stiffness: 420, damping: 28 } as const;

export function Button({ variant = "primary", size = "md", className = "", ...props }: Props) {
  const base =
    "inline-flex items-center justify-center rounded-2xl font-bold select-none focus-visible:outline-none focus-visible:ring-4 disabled:opacity-50 disabled:cursor-not-allowed";

  const transition =
    "transition-[box-shadow,filter] duration-[180ms] [transition-timing-function:cubic-bezier(0.23,1,0.32,1)]";

  const sizeClass = size === "sm" ? "px-4 py-2 text-sm" : "px-6 py-3.5 text-base";

  const styles =
    variant === "primary"
      ? [
          "btn-gloss",
          "bg-gradient-to-b from-[#FFB340] via-[#F59A28] to-[#E07A18]",
          "text-[#3a1f00] [text-shadow:0_1px_0_rgba(255,255,255,0.18)]",
          "shadow-[inset_0_1.5px_0_rgba(255,255,255,0.55),inset_0_-2px_0_rgba(0,0,0,0.12),0_2px_0_#c86a10,0_6px_16px_rgba(240,141,47,0.38),0_14px_32px_-6px_rgba(240,141,47,0.28)]",
          "hover:shadow-[inset_0_1.5px_0_rgba(255,255,255,0.55),inset_0_-2px_0_rgba(0,0,0,0.12),0_2px_0_#c86a10,0_10px_24px_rgba(240,141,47,0.50),0_20px_40px_-8px_rgba(240,141,47,0.32)]",
          "focus-visible:ring-[#ef932f]/40",
          transition,
        ].join(" ")
      : variant === "danger"
        ? [
            "bg-gradient-to-b from-[#f97966] via-[#ee5844] to-[#df4030]",
            "text-white [text-shadow:0_1px_0_rgba(0,0,0,0.18)]",
            "shadow-[inset_0_1.5px_0_rgba(255,255,255,0.38),inset_0_-2px_0_rgba(0,0,0,0.14),0_2px_0_#b83020,0_8px_20px_rgba(223,64,48,0.38),0_16px_32px_-8px_rgba(223,64,48,0.28)]",
            "focus-visible:ring-[#df4f3f]/40",
            transition,
          ].join(" ")
        : [
            "bg-gradient-to-b from-white to-[#fff6e6]",
            "text-[#8a4f1d] border border-[#f0c880]/70",
            "shadow-[inset_0_1.5px_0_rgba(255,255,255,0.96),inset_0_-1px_0_rgba(196,130,60,0.12),0_2px_0_rgba(228,168,100,0.38),0_6px_16px_rgba(196,130,60,0.14),0_12px_28px_-6px_rgba(196,130,60,0.12)]",
            "hover:shadow-[inset_0_1.5px_0_rgba(255,255,255,0.96),inset_0_-1px_0_rgba(196,130,60,0.12),0_2px_0_rgba(228,168,100,0.38),0_10px_24px_rgba(196,130,60,0.20),0_20px_40px_-8px_rgba(196,130,60,0.16)]",
            "focus-visible:ring-[#efad63]/40",
            transition,
          ].join(" ");

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      transition={SPRING}
      style={{ willChange: "transform" }}
      className={`${base} ${sizeClass} ${styles} ${className}`}
      {...props}
    />
  );
}
