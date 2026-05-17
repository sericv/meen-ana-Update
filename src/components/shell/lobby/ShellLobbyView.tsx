"use client";

import type { ReactNode } from "react";
import { ShellEmbers } from "@/components/shell/ShellEmbers";
import { ShellIcon } from "@/components/shell/ShellIcons";
import {
  ShellLobbySlotCard,
  ShellLobbyWaitingSlot,
  ShellSettingRow,
} from "@/components/shell/lobby/ShellLobbyParts";
import type { PlayerCosmetic } from "@/lib/profile/cosmetics";

export type ShellLobbyPlayer = {
  uid: string;
  displayName: string;
  ready: boolean;
  cosmetic?: PlayerCosmetic;
  photoURL?: string | null;
  xp?: number;
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
}) {
  const sessionLabel = voiceMode ? "صوت فقط" : "دردشة";
  const hintsLabel = hintsEnabled ? "مفعّلة" : "معطّلة";

  return (
    <div className="shell-screen screen-enter" style={{ background: "transparent" }}>
      <ShellEmbers count={12} />
      <div className="topbar">
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={onBack}
          style={{ padding: 8, borderRadius: 12 }}
          aria-label="رجوع"
        >
          <ShellIcon name="back" size={18} />
        </button>
        <div className="col center" style={{ lineHeight: 1.1 }}>
          <span className="text-xs muted">{roomSubtitle}</span>
          <span className="h-display fw-7">{roomTitle}</span>
        </div>
        <div style={{ width: 36 }} />
      </div>

      <div className="f-1 scroll-y" style={{ padding: "8px 16px 12px" }}>
        {banner ? (
          <div className="surf mb-3" style={{ padding: 12, textAlign: "center" }}>
            <p className="text-sm fw-7">{banner}</p>
          </div>
        ) : null}

        {!randomLobby && roomCode ? (
          <div className="surf" style={{ padding: 16 }}>
            <div className="text-xs muted">رمز الغرفة</div>
            <div className="row between mt-2">
              <div
                className="h-mono fw-8"
                style={{ fontSize: 30, letterSpacing: ".15em", color: "var(--fg-0)" }}
              >
                {roomCode}
              </div>
              <div className="row gap-2">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ padding: 10, borderRadius: 12 }}
                  onClick={onCopyCode}
                  aria-label="نسخ الرمز"
                >
                  <ShellIcon name="copy" size={18} />
                </button>
              </div>
            </div>
            {showInviteFriends ? (
              <div className="row gap-2 mt-3">
                <button type="button" className="btn btn-secondary btn-sm f-1" onClick={onInviteFriends}>
                  <ShellIcon name="friends" size={16} />
                  دعوة صديق
                </button>
              </div>
            ) : null}
          </div>
        ) : randomLobby ? (
          <div className="surf mb-3" style={{ padding: 14, textAlign: "center" }}>
            <span className="chip chip-win">مطابقة عشوائية</span>
            <p className="text-sm muted mt-2">خصمك جاهز — تبدأ المباراة تلقائياً</p>
          </div>
        ) : null}

        <div className="mt-4" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <ShellLobbySlotCard
            name={me.displayName}
            cosmetic={me.cosmetic}
            photoURL={me.photoURL}
            xp={me.xp}
            ready={myReady}
            isMe
          />
          {opponent ? (
            <ShellLobbySlotCard
              name={opponent.displayName}
              cosmetic={opponent.cosmetic}
              photoURL={opponent.photoURL}
              xp={opponent.xp}
              ready={opponent.ready}
            />
          ) : (
            <ShellLobbyWaitingSlot />
          )}
        </div>

        <div className="surf mt-4" style={{ padding: 14 }}>
          <div className="h-display fw-7 text-md">إعدادات المباراة</div>
          <div className="mt-3 col gap-3">
            <ShellSettingRow label="الفئة" value={categoryLabel} icon="sparkle" />
            <ShellSettingRow label="وقت السؤال" value={`${questionTimerSec} ثانية`} icon="flame" />
            <ShellSettingRow label="وقت الإجابة" value={`${answerTimerSec} ثانية`} icon="flame" />
            <ShellSettingRow label="نوع الجلسة" value={sessionLabel} icon={voiceMode ? "sound" : "chat"} />
            <ShellSettingRow label="التلميحات" value={hintsLabel} icon="lightbulb" />
          </div>
        </div>

        {customPanels}
      </div>

      <div
        style={{
          padding: "10px 16px calc(14px + env(safe-area-inset-bottom, 0px))",
          background: "linear-gradient(180deg, transparent, oklch(0.95 0.025 78) 30%)",
        }}
      >
        {!randomLobby ? (
          <button
            type="button"
            disabled={busy}
            className={`btn btn-block btn-lg ${myReady ? "btn-secondary" : "btn-primary"}`}
            style={{ height: 56, marginBottom: 10 }}
            onClick={onToggleReady}
          >
            {myReady ? (
              <>
                <ShellIcon name="check" size={20} />
                جاهز
              </>
            ) : (
              <>
                <ShellIcon name="star" size={20} />
                أنا مستعد
              </>
            )}
          </button>
        ) : null}

        {!randomLobby && isHost ? (
          <>
            <button
              type="button"
              disabled={busy || !canStart}
              className="btn btn-block btn-lg btn-primary"
              style={{ height: 56, marginBottom: 10, opacity: canStart ? 1 : 0.55 }}
              onClick={onStartMatch}
            >
              <ShellIcon name="play" size={20} />
              بدء المباراة
            </button>
            {!canStart && startMissing.length > 0 ? (
              <p className="text-xs muted text-center mb-3">ينقص: {startMissing.join(" • ")}</p>
            ) : null}
          </>
        ) : null}

        {!randomLobby && !isHost && !myReady ? (
          <p className="text-xs muted text-center mb-3">اضغط «أنا مستعد» ثم انتظر المضيف.</p>
        ) : null}

        {randomLobby ? (
          <p className="text-xs muted text-center mb-3">جاري البدء تلقائياً…</p>
        ) : null}

        <button type="button" className="btn btn-block btn-secondary" onClick={onLeave}>
          مغادرة الغرفة
        </button>
      </div>

      {overlays}
    </div>
  );
}
