"use client";

import type { ReactNode } from "react";
import { ShellEmbers } from "@/components/shell/ShellEmbers";
import { ShellIcon } from "@/components/shell/ShellIcons";
import { ShellMatchPlayerBlock } from "@/components/shell/lobby/ShellLobbyParts";
import type { PlayerCosmetic } from "@/lib/profile/cosmetics";

export type ShellMatchStage = "idle" | "searching" | "found" | "connecting";

function formatElapsed(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
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

  return (
    <div className="shell-screen screen-enter" style={{ background: "transparent" }}>
      <ShellEmbers count={26} />
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
        <span className="chip">{chipLabel}</span>
        <div style={{ width: 36 }} />
      </div>

      <div className="f-1 col center" style={{ padding: 24, gap: 24, position: "relative" }}>
        <div className="row" style={{ width: "100%", justifyContent: "space-around", alignItems: "center" }}>
          <ShellMatchPlayerBlock
            side="me"
            name={myName}
            cosmetic={myCosmetic}
            photoURL={myPhotoURL}
            xp={myXp}
            wins={myWins}
          />
          <div className="col center" style={{ gap: 6 }}>
            <div
              className="h-display fw-8"
              style={{
                fontSize: 28,
                background: "linear-gradient(180deg, oklch(0.58 0.18 60), oklch(0.42 0.18 35))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              VS
            </div>
            {(stage === "searching" || stage === "found") && (
              <div className="text-xs muted h-mono">{formatElapsed(elapsedSec)}</div>
            )}
          </div>
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

        <div className="surf" style={{ width: "100%", padding: 18, textAlign: "center" }}>
          {searching ? (
            <>
              <div className="h-display fw-7 text-lg">{statusTitle}</div>
              <div className="text-sm muted mt-2">{statusSubtitle}</div>
              <div
                style={{
                  marginTop: 14,
                  height: 6,
                  borderRadius: 999,
                  background: "oklch(0.96 0.018 80 / .08)",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <div className="loading-stripe" />
              </div>
            </>
          ) : (
            <>
              <div className="h-display fw-7 text-lg row center gap-2" style={{ color: "var(--amber)" }}>
                <ShellIcon name="sparkle" size={16} />
                {statusTitle}
                <ShellIcon name="sparkle" size={16} />
              </div>
              <div className="text-sm muted mt-2">{statusSubtitle}</div>
            </>
          )}
        </div>

        {error ? (
          <p className="text-sm" style={{ color: "var(--lose)", fontWeight: 700, textAlign: "center" }}>
            {error}
          </p>
        ) : null}
      </div>

      <div style={{ padding: "10px 16px calc(14px + env(safe-area-inset-bottom, 0px))" }}>{footer}</div>
    </div>
  );
}
