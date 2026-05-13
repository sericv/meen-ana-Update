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

  if (id === "flame") {
    return (
      <div className="relative flex items-center justify-center" style={{ width: s + 6, height: s + 10 }}>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            aria-hidden
            className="pointer-events-none absolute bottom-0 rounded-full bg-gradient-to-t from-[#ff6b00] to-[#ffd54a]"
            style={{
              width: 5 + i,
              height: 10 + i * 3,
              left: `calc(50% + ${(i - 1) * 10}px)`,
              transformOrigin: "bottom center",
              filter: "blur(0.3px)",
            }}
            animate={{ scaleY: [0.7, 1.15, 0.85], opacity: [0.55, 1, 0.65] }}
            transition={{ duration: 1.1 + i * 0.12, repeat: Infinity, ease: "easeInOut", delay: i * 0.08 }}
          />
        ))}
        <motion.div
          className="relative z-10 rounded-full"
          style={{
            width: s,
            height: s,
            boxShadow: "0 0 0 2.5px rgba(255,140,40,0.75), 0 0 18px rgba(255,100,0,0.35)",
          }}
          animate={{ boxShadow: ["0 0 0 2.5px rgba(255,140,40,0.65), 0 0 14px rgba(255,100,0,0.28)", "0 0 0 2.5px rgba(255,160,60,0.9), 0 0 22px rgba(255,120,0,0.45)", "0 0 0 2.5px rgba(255,140,40,0.65), 0 0 14px rgba(255,100,0,0.28)"] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          {children}
        </motion.div>
      </div>
    );
  }

  if (id === "pulse") {
    return (
      <div className="relative flex items-center justify-center" style={{ width: s + 8, height: s + 8 }}>
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full border-2 border-cyan-300/50"
          animate={{ scale: [1, 1.18, 1], opacity: [0.55, 0, 0.55] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
        />
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full border-2 border-violet-400/45"
          animate={{ scale: [1, 1.28, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut", delay: 0.35 }}
        />
        <div
          className="relative z-10 rounded-full"
          style={{ width: s, height: s, boxShadow: "0 0 0 2px rgba(255,200,120,0.65)" }}
        >
          {children}
        </div>
      </div>
    );
  }

  if (id === "galaxy") {
    return (
      <div className="relative flex items-center justify-center" style={{ width: s + 10, height: s + 10 }}>
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          animate={{ rotate: -360 }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
        >
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <span
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: i % 2 === 0 ? 4 : 3,
                height: i % 2 === 0 ? 4 : 3,
                top: "50%",
                left: "50%",
                marginTop: -1.5,
                marginLeft: -1.5,
                transform: `rotate(${i * 60}deg) translateY(-${s / 2 + 7}px)`,
                opacity: 0.75,
                boxShadow: "0 0 6px rgba(200,180,255,0.9)",
              }}
            />
          ))}
        </motion.div>
        <div
          className="relative z-10 rounded-full ring-2 ring-[#c4b5fd]/55"
          style={{ width: s, height: s, boxShadow: "0 0 16px rgba(139,92,246,0.22)" }}
        >
          {children}
        </div>
      </div>
    );
  }

  if (id === "hearts") {
    return (
      <div className="relative flex items-center justify-center" style={{ width: s + 4, height: s + 12 }}>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            aria-hidden
            className="pointer-events-none absolute text-sm"
            style={{ left: `${28 + i * 18}%`, bottom: 0 }}
            animate={{ y: [0, -(14 + i * 6)], opacity: [0, 1, 0], scale: [0.7, 1, 0.6] }}
            transition={{ duration: 2.2 + i * 0.2, repeat: Infinity, delay: i * 0.35, ease: "easeOut" }}
          >
            💕
          </motion.span>
        ))}
        <div className="relative z-10 rounded-full" style={{ width: s, height: s, boxShadow: "0 0 0 2px rgba(255,180,200,0.55)" }}>
          {children}
        </div>
      </div>
    );
  }

  if (id === "royal") {
    return (
      <div className="relative flex items-center justify-center" style={{ width: s + 12, height: s + 12 }}>
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full opacity-70"
          style={{
            background: "conic-gradient(from 0deg, transparent, rgba(255,210,120,0.5), transparent, rgba(255,180,60,0.45), transparent)",
          }}
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        />
        <span aria-hidden className="pointer-events-none absolute -top-1 left-1/2 z-20 -translate-x-1/2 text-base drop-shadow-[0_2px_3px_rgba(180,120,0,0.4)]">
          👑
        </span>
        <div
          className="relative z-10 rounded-full"
          style={{
            width: s,
            height: s,
            boxShadow: "0 0 0 3px rgba(255,200,90,0.85), 0 0 20px rgba(255,180,40,0.35)",
          }}
        >
          {children}
        </div>
      </div>
    );
  }

  if (id === "neonShard") {
    return (
      <motion.div
        className="relative rounded-full p-[2px]"
        style={{
          width: s + 4,
          height: s + 4,
          background: "linear-gradient(135deg, rgba(168,85,247,0.65), rgba(255,149,0,0.65), rgba(244,114,182,0.6))",
        }}
        animate={{ opacity: [0.88, 1, 0.88] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full opacity-60"
          style={{
            background: "linear-gradient(120deg, transparent 35%, rgba(255,255,255,0.5) 50%, transparent 65%)",
          }}
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
        />
        <div
          className="relative flex items-center justify-center overflow-hidden rounded-full bg-[#fff8ee]"
          style={{ width: s, height: s }}
        >
          {children}
        </div>
      </motion.div>
    );
  }

  if (id === "goldSpark") {
    return (
      <div className="relative flex items-center justify-center" style={{ width: s + 6, height: s + 6 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.span
            key={i}
            aria-hidden
            className="pointer-events-none absolute rounded-full bg-[#ffe08a]"
            style={{
              width: 3,
              height: 3,
              top: "50%",
              left: "50%",
              marginTop: -1.5,
              marginLeft: -1.5,
              transform: `rotate(${i * 72}deg) translateY(-${s / 2 + 5}px)`,
              boxShadow: "0 0 6px rgba(255,220,120,0.95)",
            }}
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.12 }}
          />
        ))}
        <div
          className="relative z-10 rounded-full"
          style={{ width: s, height: s, boxShadow: "0 0 0 2.5px rgba(255,200,80,0.9), 0 0 14px rgba(255,190,60,0.4)" }}
        >
          {children}
        </div>
      </div>
    );
  }

  if (id === "wave") {
    return (
      <div className="relative flex items-center justify-center" style={{ width: s + 8, height: s + 8 }}>
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full border-2 border-[#ffb347]/60"
          animate={{ scale: [1, 1.22], opacity: [0.5, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
        />
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full border-2 border-[#ff9f0a]/45"
          animate={{ scale: [1, 1.35], opacity: [0.35, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut", delay: 0.45 }}
        />
        <div className="relative z-10 rounded-full" style={{ width: s, height: s, boxShadow: "0 0 0 2px rgba(244,196,141,0.6)" }}>
          {children}
        </div>
      </div>
    );
  }

  if (id === "ghostFlame") {
    return (
      <div className="relative flex items-center justify-center" style={{ width: s + 6, height: s + 6 }}>
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{ boxShadow: "0 0 24px 4px rgba(200,180,255,0.45)" }}
          animate={{ opacity: [0.35, 0.7, 0.35], scale: [0.95, 1.05, 0.95] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="relative z-10 rounded-full ring-2 ring-violet-200/50" style={{ width: s, height: s }}>
          {children}
        </div>
      </div>
    );
  }

  if (id === "rainbow") {
    return (
      <div className="relative rounded-full p-[2px]" style={{ width: s + 4, height: s + 4 }}>
        <motion.div
          className="absolute inset-0 rounded-full opacity-90"
          style={{
            background:
              "conic-gradient(from 0deg, #ffb347, #ffd54a, #ff9f0a, #f9a8d4, #c4b5fd, #93c5fd, #ffb347)",
          }}
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        />
        <div className="relative flex items-center justify-center overflow-hidden rounded-full bg-[#fffaf3]" style={{ width: s, height: s }}>
          {children}
        </div>
      </div>
    );
  }

  if (id === "bolt") {
    return (
      <div className="relative flex items-center justify-center" style={{ width: s + 4, height: s + 4 }}>
        <motion.span
          aria-hidden
          className="pointer-events-none absolute -right-0.5 top-1 z-20 text-lg leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
          animate={{ y: [0, -3, 0], opacity: [1, 0.75, 1], rotate: [0, 8, -6, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
        >
          ⚡
        </motion.span>
        <div
          className="relative z-10 rounded-full"
          style={{ width: s, height: s, boxShadow: "0 0 0 2.5px rgba(250,204,21,0.75), 0 0 12px rgba(250,200,40,0.35)" }}
        >
          {children}
        </div>
      </div>
    );
  }

  if (id === "softAura") {
    return (
      <div className="relative flex items-center justify-center" style={{ width: s + 14, height: s + 14 }}>
        <motion.div
          aria-hidden
          className="pointer-events-none absolute rounded-full"
          style={{
            width: s + 14,
            height: s + 14,
            background: "radial-gradient(circle, rgba(255,200,160,0.55) 0%, transparent 68%)",
          }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.45, 0.75, 0.45] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="relative z-10 rounded-full" style={{ width: s, height: s, boxShadow: "0 0 0 2px rgba(255,220,200,0.65)" }}>
          {children}
        </div>
      </div>
    );
  }

  if (id === "stars") {
    return (
      <div className="relative flex items-center justify-center" style={{ width: s + 8, height: s + 8 }}>
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          animate={{ rotate: 360 }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        >
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <span
              key={i}
              className="absolute text-[9px] font-black text-[#ffb020]"
              style={{
                top: "50%",
                left: "50%",
                marginTop: -4,
                marginLeft: -4,
                transform: `rotate(${i * 60}deg) translateY(-${s / 2 + 6}px)`,
                opacity: 0.85,
                textShadow: "0 0 6px rgba(255,200,80,0.8)",
              }}
            >
              ✦
            </span>
          ))}
        </motion.div>
        <div className="relative z-10 rounded-full" style={{ width: s, height: s, boxShadow: "0 0 0 2px rgba(244,196,141,0.55)" }}>
          {children}
        </div>
      </div>
    );
  }

  return base;
}
