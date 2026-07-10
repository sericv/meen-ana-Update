"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { ShellEmbers } from "@/components/shell/ShellEmbers";
import { ShellIcon } from "@/components/shell/ShellIcons";
import {
  ShellLobbySlotCard,
  ShellLobbyWaitingSlot,
  ShellSettingRow,
} from "@/components/shell/lobby/ShellLobbyParts";
import { EASE_OUT, SPRING_UI, WHILE_TAP } from "@/lib/motion";
import type { PlayerCosmetic } from "@/lib/profile/cosmetics";

export type ShellLobbyPlayer = {
  uid: string;
  displayName: string;
  ready: boolean;
  cosmetic?: PlayerCosmetic;
  photoURL?: string | null;
  xp?: number;
  matchWins?: number;
  isHost?: boolean;
};

export function ShellLobbyView({
  roomTitle,
  roomSubtitle,
  randomLobby,
  roomCode,
  banner,
  categoryLabel,
  questionTimerSec,
  answerTimerSec,
  voiceMode,
  hintsEnabled,
  me,
  opponent,
  myReady,
  isHost,
  busy,
  canStart,
  startMissing,
  showInviteFriends,
  onBack,
  onCopyCode,
  onInviteFriends,
  onToggleReady,
  onStartMatch,
  onLeave,
  customPanels,
  overlays,
  roomId,
}: {
  roomTitle: string;
  roomSubtitle: string;
  randomLobby: boolean;
  roomCode?: string;
  banner?: string | null;
  categoryLabel: string;
  questionTimerSec: number;
  answerTimerSec: number;
  voiceMode: boolean;
  hintsEnabled: boolean;
  me: ShellLobbyPlayer;
  opponent: ShellLobbyPlayer | null;
  myReady: boolean;
  isHost: boolean;
  busy: boolean;
  canStart: boolean;
  startMissing: string[];
  showInviteFriends: boolean;
  onBack: () => void;
  onCopyCode: () => void;
  onInviteFriends: () => void;
  onToggleReady: () => void;
  onStartMatch: () => void;
  onLeave: () => void;
  customPanels?: ReactNode;
  overlays?: ReactNode;
  roomId?: string;
}) {
  const sessionLabel = voiceMode ? "صوت فقط" : "دردشة";
  const hintsLabel = hintsEnabled ? "مفعّلة" : "معطّلة";

  return (
    <div className="shell-screen screen-enter" style={{ background: "transparent" }}>
      <ShellEmbers count={10} />

      {/* Topbar */}
      <div className="topbar px-4">
        <motion.button
          type="button"
          whileTap={WHILE_TAP}
          transition={SPRING_UI}
          onClick={onBack}
          style={{
            width: 34,
            height: 34,
            borderRadius: 999,
            background: "rgba(255,255,255,0.85)",
            border: "1px solid rgba(0,0,0,0.04)",
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
          }}
          aria-label="رجوع"
        >
          <ShellIcon name="back" size={16} color="#64748B" />
        </motion.button>
        <div className="col center" style={{ lineHeight: 1.1 }}>
          <span className="text-xs fw-7" style={{ color: "#94A3B8", fontFamily: "var(--display)" }}>{roomSubtitle}</span>
          <span className="h-display fw-8" style={{ fontSize: 16, color: "#334155" }}>{roomTitle}</span>
        </div>
        <div style={{ width: 34 }} />
      </div>

      <div className="f-1 scroll-y" style={{ padding: "8px 16px 12px" }}>

        {/* Hero Banner */}
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: EASE_OUT }}
          className="game-card-outer"
          style={{ marginBottom: 14 }}
        >
          <div
            className="game-card-inner relative overflow-hidden"
            style={{
              background: randomLobby
                ? "linear-gradient(135deg, #059669 0%, #047857 100%)"
                : "linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)",
              padding: 20,
              color: "#FFFFFF",
            }}
          >
            {/* Decorative glow */}
            <div
              aria-hidden
              style={{
                position: "absolute",
                width: 160,
                height: 160,
                borderRadius: "50%",
                background: randomLobby
                  ? "radial-gradient(circle, rgba(52, 211, 153, 0.2) 0%, transparent 70%)"
                  : "radial-gradient(circle, rgba(139, 92, 246, 0.25) 0%, transparent 70%)",
                top: -40,
                right: -40,
                pointerEvents: "none",
              }}
            />
            <div
              aria-hidden
              style={{
                position: "absolute",
                width: 100,
                height: 100,
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, transparent 70%)",
                bottom: -20,
                left: -20,
                pointerEvents: "none",
              }}
            />

            {/* Category chip */}
            <span
              className="select-none"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "4px 10px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.2)",
                fontSize: 9,
                fontWeight: 900,
                letterSpacing: "0.03em",
                fontFamily: "var(--display)",
                color: randomLobby ? "#A7F3D0" : "#DDD6FE",
              }}
            >
              <svg width={10} height={10} viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx={12} cy={12} r={10} stroke="currentColor" strokeWidth={2} />
                <circle cx={12} cy={12} r={3} fill="currentColor" />
              </svg>
              {randomLobby ? "مطابقة عشوائية" : categoryLabel}
            </span>

            {/* Title */}
            <div className="h-display fw-9" style={{ fontSize: 22, marginTop: 10, letterSpacing: "-0.02em" }}>
              {randomLobby ? "مطابقة عشوائية" : roomTitle}
            </div>

            {/* Subtitle */}
            <p className="text-xs fw-6" style={{ color: randomLobby ? "#A7F3D0" : "#C4B5FD", marginTop: 4, lineHeight: 1.4 }}>
              {banner ?? (randomLobby
                ? "خصمك جاهز — تبدأ المباراة تلقائياً"
                : "غرفة خاصة — شارك الرمز مع أصدقائك")
              }
            </p>
          </div>
        </motion.div>

        {/* Room Code Card */}
        {!randomLobby && roomCode ? (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, ease: EASE_OUT, delay: 0.05 }}
            className="game-card-outer"
            style={{ marginBottom: 14 }}
          >
            <div
              className="game-card-inner"
              style={{
                padding: 16,
              }}
            >
              <div className="row between" style={{ alignItems: "center" }}>
                <div className="col" style={{ gap: 2 }}>
                  <span
                    className="text-xs fw-7"
                    style={{
                      color: "#94A3B8",
                      fontFamily: "var(--display)",
                      letterSpacing: "0.03em",
                    }}
                  >
                    رمز الغرفة
                  </span>
                  <div
                    className="h-mono fw-9"
                    style={{
                      fontSize: 28,
                      letterSpacing: ".18em",
                      color: "#334155",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {roomCode}
                  </div>
                </div>
                <div className="row" style={{ gap: 6 }}>
                  <motion.button
                    type="button"
                    whileTap={WHILE_TAP}
                    transition={SPRING_UI}
                    onClick={onCopyCode}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: "#F5F3FF",
                      border: "1px solid rgba(139, 92, 246, 0.1)",
                      display: "grid",
                      placeItems: "center",
                      cursor: "pointer",
                      color: "#7C3AED",
                    }}
                    aria-label="نسخ الرمز"
                  >
                    <ShellIcon name="copy" size={18} />
                  </motion.button>
                </div>
              </div>
              {showInviteFriends ? (
                <motion.button
                  type="button"
                  whileTap={WHILE_TAP}
                  transition={SPRING_UI}
                  onClick={onInviteFriends}
                  style={{
                    marginTop: 12,
                    width: "100%",
                    padding: "10px 0",
                    borderRadius: 12,
                    background: "linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)",
                    border: "none",
                    color: "#FFFFFF",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    fontSize: 13,
                    fontWeight: 800,
                    fontFamily: "var(--display)",
                  }}
                >
                  <ShellIcon name="friends" size={16} color="#FFFFFF" />
                  دعوة صديق
                </motion.button>
              ) : null}
            </div>
          </motion.div>
        ) : null}

        {/* Random lobby info */}
        {randomLobby ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: EASE_OUT, delay: 0.05 }}
            style={{
              padding: 14,
              borderRadius: 16,
              background: "rgba(5, 150, 105, 0.06)",
              border: "1px solid rgba(5, 150, 105, 0.12)",
              textAlign: "center",
              marginBottom: 14,
            }}
          >
            <p className="text-xs fw-7" style={{ color: "#047857" }}>
              جاري البدء تلقائياً…
            </p>
          </motion.div>
        ) : null}

        {/* Player Cards Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: EASE_OUT, delay: 0.1 }}
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}
        >
          <ShellLobbySlotCard
            uid={me.uid}
            name={me.displayName}
            cosmetic={me.cosmetic}
            photoURL={me.photoURL}
            xp={me.xp}
            matchWins={me.matchWins}
            ready={myReady}
            isMe
            roomId={roomId}
          />
          {opponent ? (
            <ShellLobbySlotCard
              uid={opponent.uid}
              name={opponent.displayName}
              cosmetic={opponent.cosmetic}
              photoURL={opponent.photoURL}
              xp={opponent.xp}
              matchWins={opponent.matchWins}
              ready={opponent.ready}
              roomId={roomId}
            />
          ) : (
            <ShellLobbyWaitingSlot />
          )}
        </motion.div>

        {/* Settings Card */}
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: EASE_OUT, delay: 0.15 }}
          className="game-card-outer"
          style={{ marginBottom: 14 }}
        >
          <div className="game-card-inner" style={{ padding: 16 }}>
            <div className="row gap-2" style={{ marginBottom: 12 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 10,
                  background: "linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(139, 92, 246, 0.05))",
                  display: "grid",
                  placeItems: "center",
                  color: "#7C3AED",
                }}
              >
                <ShellIcon name="settings" size={14} />
              </div>
              <span className="h-display fw-8" style={{ fontSize: 14, color: "#334155" }}>
                إعدادات المباراة
              </span>
            </div>
            <div className="col" style={{ gap: 6 }}>
              <ShellSettingRow label="الفئة" value={categoryLabel} icon="sparkle" />
              <ShellSettingRow label="وقت السؤال" value={`${questionTimerSec} ثانية`} icon="flame" />
              <ShellSettingRow label="وقت الإجابة" value={`${answerTimerSec} ثانية`} icon="flame" />
              <ShellSettingRow label="نوع الجلسة" value={sessionLabel} icon={voiceMode ? "sound" : "chat"} />
              <ShellSettingRow label="التلميحات" value={hintsLabel} icon="lightbulb" />
            </div>
          </div>
        </motion.div>

        {customPanels}
      </div>

      {/* Bottom Action Bar */}
      <div
        style={{
          padding: "10px 16px calc(14px + env(safe-area-inset-bottom, 0px))",
          background: "linear-gradient(180deg, transparent, rgba(255,255,255,0.9) 28%, #FFFFFF 100%)",
        }}
      >
        {/* Ready button (private room only) */}
        {!randomLobby ? (
          <motion.button
            type="button"
            disabled={busy}
            whileTap={busy ? {} : WHILE_TAP}
            transition={SPRING_UI}
            onClick={onToggleReady}
            style={{
              width: "100%",
              height: 52,
              borderRadius: 16,
              border: "none",
              cursor: busy ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              fontSize: 14,
              fontWeight: 800,
              fontFamily: "var(--display)",
              marginBottom: 8,
              opacity: busy ? 0.5 : 1,
              ...(myReady
                ? {
                    background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                    color: "#FFFFFF",
                    boxShadow: "0 4px 12px rgba(16, 185, 129, 0.25)",
                  }
                : {
                    background: "linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)",
                    color: "#FFFFFF",
                    boxShadow: "0 4px 12px rgba(139, 92, 246, 0.25)",
                  }),
            }}
          >
            {myReady ? (
              <>
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M5 12l5 5L19 7" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                جاهز
              </>
            ) : (
              <>
                <ShellIcon name="star" size={18} color="#FFFFFF" />
                أنا مستعد
              </>
            )}
          </motion.button>
        ) : null}

        {/* Start button (host only) */}
        {!randomLobby && isHost ? (
          <>
            <motion.button
              type="button"
              disabled={busy || !canStart}
              whileTap={canStart && !busy ? WHILE_TAP : {}}
              transition={SPRING_UI}
              onClick={onStartMatch}
              style={{
                width: "100%",
                height: 52,
                borderRadius: 16,
                border: "none",
                cursor: canStart && !busy ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                fontSize: 14,
                fontWeight: 800,
                fontFamily: "var(--display)",
                marginBottom: 8,
                background: canStart
                  ? "linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)"
                  : "rgba(148, 163, 184, 0.15)",
                color: canStart ? "#5e3011" : "#94A3B8",
                boxShadow: canStart ? "0 4px 12px rgba(251, 191, 36, 0.3)" : "none",
                opacity: canStart ? 1 : 0.5,
              }}
            >
              <ShellIcon name="play" size={18} color={canStart ? "#5e3011" : "#94A3B8"} />
              بدء المباراة
            </motion.button>
            {!canStart && startMissing.length > 0 ? (
              <p className="text-xs fw-6 text-center" style={{ color: "#94A3B8", marginBottom: 8 }}>
                ينقص: {startMissing.join(" • ")}
              </p>
            ) : null}
          </>
        ) : null}

        {/* Waiting hint for non-host non-ready */}
        {!randomLobby && !isHost && !myReady ? (
          <p className="text-xs fw-6 text-center" style={{ color: "#94A3B8", marginBottom: 8 }}>
            اضغط «أنا مستعد» ثم انتظر المضيف.
          </p>
        ) : null}

        {/* Leave button */}
        <motion.button
          type="button"
          whileTap={WHILE_TAP}
          transition={SPRING_UI}
          onClick={onLeave}
          style={{
            width: "100%",
            padding: "12px 0",
            borderRadius: 14,
            background: "transparent",
            border: "1.5px solid rgba(148, 163, 184, 0.25)",
            color: "#64748B",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            fontSize: 13,
            fontWeight: 700,
            fontFamily: "var(--display)",
          }}
        >
          <ShellIcon name="close" size={16} color="#64748B" />
          مغادرة الغرفة
        </motion.button>
      </div>

      {overlays}
    </div>
  );
}
