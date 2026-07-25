"use client";

import React, { useEffect, useRef } from "react";
import { ARABIC_ALPHABET } from "@/lib/game/word-race-data";

export const WordRaceHeroBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Floating Arabic Letter Particles (Subtle Light Theme Accent)
    const particlesCount = 32;
    const particles = Array.from({ length: particlesCount }, (_, i) => ({
      char: ARABIC_ALPHABET[i % ARABIC_ALPHABET.length],
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.25,
      vy: -0.15 - Math.random() * 0.25,
      size: 24 + Math.random() * 32,
      opacity: 0.04 + Math.random() * 0.05,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.005,
    }));

    let isFontLoaded = false;
    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.ready.then(() => {
        isFontLoaded = true;
      });
    } else {
      isFontLoaded = true;
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Clean Uniform Light Background Fill (#FAF9FF)
      ctx.fillStyle = "#FAF9FF";
      ctx.fillRect(0, 0, width, height);

      // Soft Floating Purple Radial Gradient
      const grad1 = ctx.createRadialGradient(width * 0.3, height * 0.25, 20, width * 0.3, height * 0.25, width * 0.6);
      grad1.addColorStop(0, "rgba(124, 58, 237, 0.05)");
      grad1.addColorStop(1, "rgba(124, 58, 237, 0)");
      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, width, height);

      // Soft Ambient Amber Radial Accent Gradient
      const grad2 = ctx.createRadialGradient(width * 0.7, height * 0.75, 20, width * 0.7, height * 0.75, width * 0.6);
      grad2.addColorStop(0, "rgba(255, 230, 0, 0.04)");
      grad2.addColorStop(1, "rgba(255, 230, 0, 0)");
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, width, height);

      // Render floating letter particles in application primary font (Baloo Bhaijaan 2)
      const primaryFont = "var(--font-baloo), 'Baloo Bhaijaan 2', system-ui, -apple-system, sans-serif";

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed;

        // Continuous seamless loop across viewport
        if (p.y < -60) {
          p.y = height + 60;
          p.x = Math.random() * width;
        }
        if (p.x < -60) p.x = width + 60;
        if (p.x > width + 60) p.x = -60;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.font = `800 ${p.size}px ${primaryFont}`;
        ctx.fillStyle = `rgba(124, 58, 237, ${p.opacity})`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(p.char, 0, 0);
        ctx.restore();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none -z-10"
    />
  );
};
