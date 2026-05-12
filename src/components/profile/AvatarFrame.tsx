"use client";

import { motion } from "framer-motion";
import type { FrameId } from "@/lib/profile/cosmetics";

type Props = {
  frameId: string;
  sizePx: number;
  active?: boolean;
  children: React.ReactNode;
};

/**
 * Decorative frame around a circular avatar. GPU-friendly: mostly
 * transforms, opacity, and box-shadow — no heavy backdrop filters.
 */
export function AvatarFrame({ frameId, sizePx, active = false, children }: Props) {
  const s = sizePx;
  const id = (frameId || "none") as FrameId;

  const base = (
    <div className="relative flex items-center justify-center" style={{ width: s, height: s }}>
      {children}
    </div>
  );

  if (id === "none") return base;

  if (id === "crown") {
    return (
      <div className="relative flex items-center justify-center" style={{ width: s + 10, height: s + 14 }}>
        <motion.span
          aria-hidden
          className="pointer-events-none absolute -top-1 left-1/2 z-20 -translate-x-1/2 text-lg leading-none drop-shadow-[0_2px_4px_rgba(180,120,0,0.45)]"
          animate={{ y: [0, -2, 0], rotate: [-4, 4, -4] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        >
          👑
        </motion.span>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            aria-hidden
            className="pointer-events-none absolute rounded-full bg-[#ffd54a]"
            style={{
              width: 4,
              height: 4,
              left: `calc(50% + ${(i - 1) * 14}px)`,
              top: -2,
              boxShadow: "0 0 8px rgba(255,200,80,0.9)",
            }}
            animate={{ opacity: [0.35, 1, 0.35], scale: [0.8, 1.15, 0.8] }}
            transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.25, ease: "easeInOut" }}
          />
        ))}
        <motion.div
          className="relative rounded-full"
          style={{
            width: s,
            height: s,
            boxShadow: active
              ? "0 0 0 3px rgba(255,200,90,0.95), 0 0 22px rgba(255,180,40,0.55)"
              : "0 0 0 2.5px rgba(255,200,90,0.75), 0 0 14px rgba(255,180,60,0.35)",
          }}
          animate={{ boxShadow: active ? undefined : ["0 0 0 2.5px rgba(255,200,90,0.65), 0 0 12px rgba(255,180,60,0.28)", "0 0 0 2.5px rgba(255,200,90,0.85), 0 0 18px rgba(255,180,60,0.42)", "0 0 0 2.5px rgba(255,200,90,0.65), 0 0 12px rgba(255,180,60,0.28)"] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          {children}
        </motion.div>
      </div>
    );
  }

  if (id === "neon") {
    return (
      <motion.div
        className="relative rounded-full p-[3px]"
        style={{
          background: "linear-gradient(135deg,#a78bfa 0%,#FF9F0A 55%,#f472b6 100%)",
        }}
        animate={{
          opacity: [0.88, 1, 0.88],
          scale: [1, 1.03, 1],
        }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <motion.div
          className="overflow-hidden rounded-full bg-[#fff8ee] p-[2px]"
          animate={{
            boxShadow: [
              "0 0 0 0 rgba(255,149,0,0)",
              "0 0 18px 2px rgba(168,85,247,0.35)",
              "0 0 0 0 rgba(255,149,0,0)",
            ],
          }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          style={{ width: s, height: s }}
        >
          {children}
        </motion.div>
      </motion.div>
    );
  }

  if (id === "cat") {
    return (
      <div className="relative flex items-center justify-center" style={{ width: s + 4, height: s + 8 }}>
        <span
          aria-hidden
          className="pointer-events-none absolute left-[18%] top-0 z-10 h-3.5 w-3.5 rounded-t-md bg-gradient-to-b from-[#ffd699] to-[#ffb347]"
          style={{ transform: "rotate(-18deg)", boxShadow: "0 1px 2px rgba(0,0,0,0.12)" }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute right-[18%] top-0 z-10 h-3.5 w-3.5 rounded-t-md bg-gradient-to-b from-[#ffd699] to-[#ffb347]"
          style={{ transform: "rotate(18deg)", boxShadow: "0 1px 2px rgba(0,0,0,0.12)" }}
        />
        <motion.div
          className="relative z-20 overflow-hidden rounded-full"
          style={{ width: s, height: s, boxShadow: "0 0 0 2px rgba(244,196,141,0.55)" }}
          animate={{ y: [0, -1, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        >
          {children}
        </motion.div>
      </div>
    );
  }

  if (id === "orbit") {
    return (
      <div className="relative flex items-center justify-center" style={{ width: s + 8, height: s + 8 }}>
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center"
          animate={{ rotate: 360 }}
          transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
        >
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="absolute rounded-full bg-[#ffb020]"
              style={{
                width: 5,
                height: 5,
                top: "50%",
                left: "50%",
                marginTop: -2.5,
                marginLeft: -2.5,
                transform: `rotate(${i * 90}deg) translateY(-${s / 2 + 6}px)`,
                opacity: 0.8,
                boxShadow: "0 0 6px rgba(255,160,40,0.75)",
              }}
            />
          ))}
        </motion.div>
        <div className="relative z-10 rounded-full" style={{ width: s, height: s }}>
          {children}
        </div>
      </div>
    );
  }

  if (id === "crystal") {
    return (
      <div className="relative rounded-full p-[2px]" style={{ width: s + 4, height: s + 4 }}>
        <div
          className="absolute inset-0 rounded-full opacity-90"
          style={{
            background: "conic-gradient(from 0deg, rgba(255,200,120,0.9), rgba(200,230,255,0.85), rgba(255,180,200,0.85), rgba(255,200,120,0.9))",
          }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            background: "linear-gradient(120deg, transparent 35%, rgba(255,255,255,0.55) 50%, transparent 65%)",
          }}
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
        <div
          className="relative flex items-center justify-center overflow-hidden rounded-full bg-[#fffaf3]"
          style={{ width: s, height: s }}
        >
          {children}
        </div>
      </div>
    );
  }

  return base;
}
