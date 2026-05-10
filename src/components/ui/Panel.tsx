"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";

export function Panel({
  children,
  className = "",
  ...rest
}: {
  children: ReactNode;
  className?: string;
} & Omit<HTMLMotionProps<"div">, "children" | "className">) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-[2rem] border border-[#f4cfa8] bg-[#fffdf9]/90 p-6 shadow-[0_14px_32px_rgba(187,117,43,0.16)] backdrop-blur-sm ${className}`}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
