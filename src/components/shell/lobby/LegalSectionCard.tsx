"use client";

import { motion } from "framer-motion";
import { useRef } from "react";
import { staggerItem } from "@/lib/motion";

type Props = {
  id: string;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
};

export function LegalSectionCard({ id, icon, title, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      ref={ref}
      id={id}
      variants={staggerItem}
      className="group game-card-outer cursor-default transition-shadow duration-500"
      style={{
        background: "rgba(139, 92, 246, 0.03)",
        borderColor: "rgba(139, 92, 246, 0.07)",
        willChange: "transform",
      }}
    >
      <div
        className="game-card-inner"
        style={{
          padding: "20px 20px 22px",
          background: "#FFFFFF",
          transition: "box-shadow 0.4s cubic-bezier(0.23, 1, 0.32, 1)",
        }}
      >
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div
            aria-hidden
            className="grid shrink-0 place-items-center"
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: "linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)",
              boxShadow: "0 3px 10px rgba(139, 92, 246, 0.2)",
              color: "#FFFFFF",
            }}
          >
            {icon}
          </div>
          {/* Content */}
          <div className="min-w-0 flex-1">
            <h2
              className="mb-2 text-base font-black tracking-tight"
              style={{ fontFamily: "var(--display)", color: "#1e1b4b" }}
            >
              {title}
            </h2>
            <div
              className="space-y-2.5 text-sm font-semibold leading-7"
              style={{ color: "#4B5563" }}
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
