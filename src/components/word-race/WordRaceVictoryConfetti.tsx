"use client";

import React, { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { playVictoryFanfare } from "@/lib/audio/game-sounds";

const BRAND_COLORS = [
  "#7C3AED", // Vibrant Purple
  "#FFE600", // Bright Yellow
  "#00F0FF", // Neon Cyan
  "#22C55E", // Emerald Green
  "#EC4899", // Vivid Pink
  "#F97316", // Bright Orange
];

interface Particle {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  rotation: number;
  scale: number;
  color: string;
  shape: "rect" | "circle";
  duration: number;
  delay: number;
}

export const WordRaceVictoryConfetti: React.FC = () => {
  useEffect(() => {
    playVictoryFanfare();
  }, []);

  const particles: Particle[] = useMemo(() => {
    return Array.from({ length: 45 }, (_, i) => {
      const startX = 20 + Math.random() * 60; // 20% to 80% screen width
      const targetX = startX + (Math.random() * 40 - 20); // drift -20% to +20%
      const targetY = 70 + Math.random() * 400; // fall distance
      const color = BRAND_COLORS[i % BRAND_COLORS.length];
      const shape = i % 2 === 0 ? "rect" : "circle";
      const duration = 2.2 + Math.random() * 1.2;
      const delay = Math.random() * 0.4;

      return {
        id: i,
        x: startX,
        y: -20,
        targetX,
        targetY,
        rotation: Math.random() * 720 - 360,
        scale: 0.6 + Math.random() * 0.8,
        color,
        shape,
        duration,
        delay,
      };
    });
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden select-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{
            left: `${p.x}%`,
            top: -20,
            opacity: 1,
            scale: p.scale,
            rotate: 0,
          }}
          animate={{
            left: `${p.targetX}%`,
            top: `${p.targetY}px`,
            opacity: [1, 1, 0.8, 0],
            rotate: p.rotation,
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          style={{
            position: "absolute",
            width: p.shape === "circle" ? 10 : 12,
            height: p.shape === "circle" ? 10 : 8,
            backgroundColor: p.color,
            borderRadius: p.shape === "circle" ? "50%" : "3px",
            boxShadow: `0 0 6px ${p.color}80`,
          }}
        />
      ))}
    </div>
  );
};
