"use client";

import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShellEmbers } from "@/components/shell/ShellEmbers";
import { ShellIcon } from "@/components/shell/ShellIcons";
import { ShellMatchPlayerBlock } from "@/components/shell/lobby/ShellLobbyParts";
import type { PlayerCosmetic } from "@/lib/profile/cosmetics";
import { EASE_OUT, SPRING_DRAMATIC } from "@/lib/motion";

export type ShellMatchStage = "idle" | "searching" | "found" | "connecting";

function formatElapsed(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Pulsing status dot — small colored circle that breathes */
function PulseDot({ color }: { color: string }) {
  return (
    <motion.span
      aria-hidden
      style={{
        display: "inline-block",
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: color,
        flexShrink: 0,
      }}
      animate={{ scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }}
      transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

export function ShellMatchmakingView({
  stage,
  elapsedSec,
  chipLabel,
  myName,
  myCosmetic,
  myPhotoURL,
  myXp,
  myWins,
  opponentName,
  opponentCosmetic,
  opponentPhotoURL,
  opponentXp,
  opponentWins,
  statusTitle,
  statusSubtitle,
  searching,
  onClose,
  footer,
  error,
}: {
  stage: ShellMatchStage;
  elapsedSec: number;
  chipLabel: string;
  myName: string;
  myCosmetic?: PlayerCosmetic;
  myPhotoURL?: string | null;
  myXp?: number;
  myWins?: number;
  opponentName: string;
  opponentCosmetic?: PlayerCosmetic;
  opponentPhotoURL?: string | null;
  opponentXp?: number;
  opponentWins?: number;
  statusTitle: string;
  statusSubtitle: string;
  searching: boolean;
  onClose: () => void;
  footer: ReactNode;
  error?: string | null;
}) {
  const opponentHidden = stage === "idle" || stage === "searching";
  const isFound = stage === "found" || stage === "connecting";

  return (
    <div className="shell-screen screen-enter" style={{ background: "transparent" }}>
      <ShellEmbers count={14} />
      <div className="topbar">
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={onClose}
          style={{ padding: 8, borderRadius: 12 }}
          aria-label="إغلاق"
        >
          <ShellIcon name="close" size={18} />
        </button>
        <AnimatePresence mode="wait">
          <motion.span
            key={chipLabel}
            initial={{ opacity: 0, y: -4, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.92 }}
            transition={{ duration: 0.28, ease: EASE_OUT }}
            className={`chip ${isFound ? "chip-win" : ""}`}
          >
            {isFound && <PulseDot color="oklch(0.58 0.18 148)" />}
            {chipLabel}
          </motion.span>
        </AnimatePresence>
        <div style={{ width: 36 }} />
      </div>

      <div className="f-1 col center" style={{ padding: 24, gap: 24, position: "relative" }}>
        {/* VS players row */}
        <div className="row" style={{ width: "100%", justifyContent: "space-around", alignItems: "center" }}>

          {/* My side */}
          <ShellMatchPlayerBlock
            side="me"
            name={myName}
            cosmetic={myCosmetic}
            photoURL={myPhotoURL}
            xp={myXp}
            wins={myWins}
          />

          {/* Center VS badge */}
          <div className="col center" style={{ gap: 8 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={isFound ? "found" : "searching"}
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                transition={isFound ? SPRING_DRAMATIC : { duration: 0.28, ease: EASE_OUT }}
              >
                {/* One-shot pop burst on found — tween only, safe with 3 keyframes */}
                <motion.div
                  key={`vs-pop-${isFound}`}
                  animate={isFound ? { scale: [1, 1.22, 1] } : {}}
                  transition={isFound ? { duration: 0.45, ease: [0.23, 1, 0.32, 1], times: [0, 0.4, 1] } : {}}
                >
                  <div
                    className="h-display fw-8"
                    style={{
                      fontSize: 30,
                      letterSpacing: "-0.02em",
                      background: isFound
                        ? "linear-gradient(180deg, oklch(0.62 0.18 150), oklch(0.45 0.18 140))"
                        : "linear-gradient(180deg, oklch(0.58 0.18 60), oklch(0.42 0.18 35))",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      filter: isFound
                        ? "drop-shadow(0 0 12px oklch(0.62 0.18 150 / 0.6))"
                        : "drop-shadow(0 0 6px oklch(0.58 0.18 60 / 0.35))",
                      transition: "filter 0.4s ease",
                    }}
                  >
                    VS
                  </div>
                </motion.div>
              </motion.div>
            </AnimatePresence>

            {(stage === "searching" || stage === "found") && (
              <motion.div
                className="text-xs muted h-mono"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {formatElapsed(elapsedSec)}
              </motion.div>
            )}
          </div>

          {/* Opponent side */}
          <ShellMatchPlayerBlock
              side="them"
              name={opponentName}
              cosmetic={opponentCosmetic}
              photoURL={opponentPhotoURL}
              xp={opponentXp}
              wins={opponentWins}
              hidden={opponentHidden}
            />
        </div>

        {/* Status card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={searching ? "searching" : "found"}
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
            className="surf"
            style={{
              width: "100%",
              padding: 20,
              textAlign: "center",
              ...(isFound ? {
                background: "linear-gradient(160deg, rgba(62,184,122,0.09), rgba(255,255,255,0.98))",
                boxShadow: [
                  "var(--sh-2)",
                  "inset 0 0 0 1.5px oklch(0.62 0.14 150 / 0.28)",
                  "0 0 28px -4px oklch(0.62 0.14 150 / 0.25)",
                ].join(", "),
              } : {}),
            }}
          >
            {searching ? (
              <>
                <div className="h-display fw-7 text-lg" style={{ letterSpacing: "-0.01em" }}>
                  {statusTitle}
                </div>
                <div className="text-sm muted mt-2">{statusSubtitle}</div>
                <div
                  style={{
                    marginTop: 16,
                    height: 6,
                    borderRadius: 999,
                    background: "oklch(0.90 0.025 76 / 0.45)",
                    overflow: "hidden",
                    position: "relative",
                    boxShadow: "inset 0 1px 2px rgba(0,0,0,0.06)",
                  }}
                >
                  <div className="loading-stripe" />
                </div>
              </>
            ) : (
              <>
                <motion.div
                  className="h-display fw-7 text-lg row center gap-2"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ ...SPRING_DRAMATIC, delay: 0.05 }}
                  style={{
                    color: "var(--win)",
                    filter: "drop-shadow(0 0 8px oklch(0.62 0.14 150 / 0.4))",
                  }}
                >
                  <ShellIcon name="sparkle" size={16} />
                  {statusTitle}
                  <ShellIcon name="sparkle" size={16} />
                </motion.div>
                <div className="text-sm muted mt-2">{statusSubtitle}</div>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Error */}
        <AnimatePresence>
          {error ? (
            <motion.p
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.22, ease: EASE_OUT }}
              className="text-sm"
              style={{ color: "var(--lose)", fontWeight: 700, textAlign: "center" }}
            >
              {error}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>

      <div style={{ padding: "10px 16px calc(14px + env(safe-area-inset-bottom, 0px))" }}>{footer}</div>
    </div>
  );
}
