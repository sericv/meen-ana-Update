"use client";

import { motion, type HTMLMotionProps } from "framer-motion";

type Props = HTMLMotionProps<"button"> & {
  variant?: "primary" | "ghost" | "danger";
};

export function Button({ variant = "primary", className = "", ...props }: Props) {
  const base =
    "inline-flex items-center justify-center rounded-2xl px-6 py-3.5 text-base font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const styles =
    variant === "primary"
      ? "bg-gradient-to-b from-[#ffb35d] to-[#f58c2b] text-white shadow-[0_8px_0_#d9761f,0_14px_24px_rgba(240,141,47,0.35)] hover:brightness-105 focus-visible:outline-[#ef932f]"
      : variant === "danger"
        ? "bg-gradient-to-b from-[#f97966] to-[#df4f3f] text-white shadow-[0_8px_0_#c23f30,0_14px_24px_rgba(223,79,63,0.28)] hover:brightness-105 focus-visible:outline-[#df4f3f]"
        : "bg-[#fff4e4] text-[#8a4f1d] border-2 border-[#f7c891] shadow-[0_8px_0_#ebb06f,0_12px_18px_rgba(235,176,111,0.23)] hover:bg-[#ffedd4] focus-visible:outline-[#efad63]";

  return (
    <motion.button
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ y: 2, scale: 0.98 }}
      className={`${base} ${styles} ${className}`}
      {...props}
    />
  );
}
