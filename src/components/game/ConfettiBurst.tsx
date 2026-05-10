"use client";

import { motion } from "framer-motion";

const COLORS = ["#f97316", "#fbbf24", "#fb923c", "#fde68a", "#fff", "#fca5a5", "#86efac"];

export function ConfettiBurst({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      {Array.from({ length: 42 }).map((_, i) => {
        const left = `${(i * 37) % 100}%`;
        const delay = (i % 8) * 0.04;
        const dur = 2.4 + (i % 5) * 0.12;
        const rot = (i * 47) % 360;
        const color = COLORS[i % COLORS.length];
        return (
          <motion.span
            key={i}
            className="absolute top-0 block h-2 w-2 rounded-sm shadow-sm"
            style={{ left, backgroundColor: color }}
            initial={{ y: "-10%", opacity: 1, rotate: rot }}
            animate={{
              y: "110vh",
              opacity: [1, 1, 0.9, 0],
              rotate: rot + 320,
              x: [(i % 3) * 12 - 12, ((i + 2) % 5) * 18 - 24],
            }}
            transition={{ duration: dur, delay, ease: "easeIn" }}
          />
        );
      })}
    </div>
  );
}
