"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { ShellIcon } from "@/components/shell/ShellIcons";
import { useAuth } from "@/components/providers/AuthProvider";
import { getFirebaseDb } from "@/lib/firebase/client";
import { col, userSub } from "@/lib/firestore/paths";
import { isFullAccountUser } from "@/lib/auth/google-user";
import { postSocial } from "@/lib/api/social-client";
import { normalizeCosmetic } from "@/lib/profile/cosmetics";
import {
  playRoomInviteAccept,
  resumeAudioContext,
} from "@/lib/audio/game-sounds";
import type { Timestamp } from "firebase/firestore";

type InviteDoc = {
  id: string;
  fromUid: string;
  roomId: string;
  roomCode: string;
  categoryLabel: string;
  questionTimerSec: number | null;
  answerTimerSec: number | null;
  message: string;
  hostDisplayName: string;
  hostPhotoURL: string | null;
  hostUsername: string;
  hostAvatarId?: string | null;
  hostAvatarFrameId?: string | null;
  createdMs: number;
};

function parseInvite(id: string, data: Record<string, unknown>): InviteDoc | null {
  const roomId = String(data.roomId ?? "");
  const fromUid = String(data.fromUid ?? "");
  if (!roomId || !fromUid) return null;
  const c = data.createdAt as Timestamp | undefined;
  const createdMs = c && typeof c.toMillis === "function" ? c.toMillis() : 0;
  return {
    id,
    fromUid,
    roomId,
    roomCode: String(data.roomCode ?? ""),
    categoryLabel: String(data.categoryLabel ?? "عام"),
    questionTimerSec:
      typeof data.questionTimerSec === "number" && Number.isFinite(data.questionTimerSec)
        ? Math.max(1, Math.floor(data.questionTimerSec))
        : null,
    answerTimerSec:
      typeof data.answerTimerSec === "number" && Number.isFinite(data.answerTimerSec)
        ? Math.max(1, Math.floor(data.answerTimerSec))
        : null,
    message: String(data.message ?? ""),
    hostDisplayName: String(data.hostDisplayName ?? "مضيف"),
    hostPhotoURL: data.hostPhotoURL != null ? String(data.hostPhotoURL) : null,
    hostUsername: String(data.hostUsername ?? ""),
    hostAvatarId: data.hostAvatarId != null ? String(data.hostAvatarId) : null,
    hostAvatarFrameId: data.hostAvatarFrameId != null ? String(data.hostAvatarFrameId) : null,
    createdMs,
  };
}

const AUTO_DISMISS_MS = 20_000;

function MetaChip({
  icon,
  label,
  value,
  mono,
}: {
  icon: string;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="ri-metachip">
      <span className="ri-metachip-ico">
        <ShellIcon name={icon} size={12} />
      </span>
      <span className="ri-metachip-text">
        <span className="ri-metachip-label">{label}</span>
        <span className={`ri-metachip-value${mono ? " ri-mono" : ""}`}>{value}</span>
      </span>
    </div>
  );
}

function RoomInviteToast({
  inv,
  busy,
  onAccept,
  onDecline,
}: {
  inv: InviteDoc;
  busy: boolean;
  onAccept: (inv: InviteDoc) => Promise<void>;
  onDecline: (inv: InviteDoc) => Promise<void>;
}) {
  const [phase, setPhase] = useState<"entering" | "idle" | "accepting" | "declining">("entering");
  const cosmetic = normalizeCosmetic({
    avatarId: inv.hostAvatarId ?? undefined,
    avatarFrameId: inv.hostAvatarFrameId ?? undefined,
    photoURL: inv.hostPhotoURL,
  });

  useEffect(() => {
    const t = window.setTimeout(() => setPhase("idle"), 700);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (phase !== "idle") return;
    const t = window.setTimeout(() => {
      setPhase("declining");
      window.setTimeout(() => void onDecline(inv), 320);
    }, AUTO_DISMISS_MS);
    return () => window.clearTimeout(t);
  }, [inv, onDecline, phase]);

  const accept = useCallback(async () => {
    if ((phase !== "idle" && phase !== "entering") || busy) return;
    resumeAudioContext();
    playRoomInviteAccept();
    setPhase("accepting");
    try {
      await onAccept(inv);
    } catch {
      setPhase("idle");
    }
  }, [busy, inv, onAccept, phase]);

  const decline = useCallback(() => {
    if ((phase !== "idle" && phase !== "entering") || busy) return;
    setPhase("declining");
    window.setTimeout(() => void onDecline(inv), 320);
  }, [busy, inv, onDecline, phase]);

  return (
    <motion.div
      className={`ri-overlay ri-phase-${phase}`}
      aria-live="polite"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28 }}
    >
      <div className="ri-card" role="dialog" aria-label="دعوة مباراة">
        <span className="ri-frame" />
        <span className="ri-sheen" />
        <div className="ri-motes" aria-hidden>
          {Array.from({ length: 8 }).map((_, i) => (
            <span
              key={i}
              className="ri-mote"
              style={{
                left: `${8 + i * 12}%`,
                animationDelay: `${-(i * 0.5)}s`,
              }}
            />
          ))}
        </div>

        <div className="ri-toprow">
          <span className="ri-live">
            <span className="ri-live-dot" />
            <span>متّصل الآن</span>
          </span>
          <span className="ri-kicker">دعوة مباراة</span>
        </div>

        <div className="ri-callerwrap">
          <span className="ri-ring ri-ring-1" />
          <span className="ri-ring ri-ring-2" />
          <span className="ri-ring ri-ring-3" />

          <span className="ri-avwrap">
            <ProfileAvatar
              cosmetic={cosmetic}
              fallbackPhotoURL={inv.hostPhotoURL}
              displayName={inv.hostDisplayName}
              size="xl"
              idle
              active
            />
            <span className="ri-online" />
          </span>

          <div className="ri-caller">
            <div className="ri-name">{inv.hostDisplayName || "صديق"}</div>
            <div className="ri-invitetext">يدعوك إلى مجلسه</div>
            {inv.message ? <div className="ri-message">{inv.message}</div> : null}
          </div>
        </div>

        <div className="ri-meta">
          <MetaChip icon="sparkle" label="الفئة" value={inv.categoryLabel || "عام"} />
          <span className="ri-sep" />
          <MetaChip
            icon="settings"
            label="وقت السؤال"
            value={inv.questionTimerSec ? `${inv.questionTimerSec}ث` : "حسب الغرفة"}
          />
          <span className="ri-sep" />
          <MetaChip icon="copy" label="الرمز" value={inv.roomCode || "—"} mono />
        </div>

        <div className="ri-actions">
          <button type="button" className="ri-btn ri-btn-accept" disabled={busy} onClick={accept}>
            <span className="ri-btn-glow" />
            <ShellIcon name="play" size={18} />
            <span>{busy && phase === "accepting" ? "جاري الدخول…" : "قبول"}</span>
          </button>
          <button type="button" className="ri-btn ri-btn-decline" disabled={busy} onClick={decline}>
            <ShellIcon name="close" size={16} />
            <span>تجاهل</span>
          </button>
        </div>
      </div>

      <RoomInviteStyles />
    </motion.div>
  );
}

function RoomInviteStyles() {
  return (
    <style>{`
      .ri-overlay {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 120;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding: max(56px, calc(env(safe-area-inset-top, 0px) + 28px)) 14px 0;
        font-family: var(--font-tajawal), var(--body), sans-serif;
        direction: rtl;
      }

      .ri-overlay::before {
        content: "";
        position: absolute;
        inset: 0;
        background: radial-gradient(120% 50% at 50% 0%, rgba(105, 69, 44, 0.22), transparent 55%);
        opacity: 0;
        transition: opacity .35s ease;
      }

      .ri-overlay::after {
        content: "";
        position: absolute;
        inset: 0;
        z-index: -1;
        background: rgba(58, 37, 23, 0.14);
        backdrop-filter: blur(2px) saturate(1.05);
        -webkit-backdrop-filter: blur(2px) saturate(1.05);
        opacity: 0;
        transition: opacity .35s ease;
      }

      .ri-phase-entering::before,
      .ri-phase-idle::before,
      .ri-phase-accepting::before,
      .ri-phase-entering::after,
      .ri-phase-idle::after,
      .ri-phase-accepting::after {
        opacity: 1;
      }

      .ri-card {
        pointer-events: auto;
        position: relative;
        width: min(360px, 100%);
        border-radius: 26px;
        padding: 16px 16px 14px;
        isolation: isolate;
        background:
          radial-gradient(140% 90% at 50% 0%, oklch(0.98 0.04 80), oklch(0.93 0.06 75) 60%, oklch(0.88 0.07 70) 100%);
        border: 1px solid oklch(0.72 0.10 60 / .45);
        box-shadow:
          0 22px 50px -16px oklch(0.45 0.10 45 / .45),
          0 6px 14px -6px oklch(0.45 0.08 45 / .25),
          inset 0 1px 0 rgba(255,255,255,.7),
          inset 0 -1px 0 oklch(0.65 0.08 55 / .25);
        opacity: 0;
        transform: translateY(-22px) scale(.96);
        animation: riIn .56s cubic-bezier(.2,1.25,.4,1) forwards;
      }

      .ri-phase-declining .ri-card {
        animation: riOut .32s cubic-bezier(.4,0,.7,.5) forwards;
      }

      .ri-phase-accepting .ri-card {
        animation: riAccept .72s cubic-bezier(.4,0,.4,1) forwards;
      }

      @keyframes riIn {
        0% { opacity: 0; transform: translateY(-32px) scale(.94); }
        70% { opacity: 1; transform: translateY(4px) scale(1.01); }
        100% { opacity: 1; transform: translateY(0) scale(1); }
      }

      @keyframes riOut {
        0% { opacity: 1; transform: translateY(0) scale(1); }
        100% { opacity: 0; transform: translateY(10px) scale(.97); }
      }

      @keyframes riAccept {
        0% { transform: translateY(0) scale(1); }
        25% { transform: translateY(-2px) scale(1.03); filter: brightness(1.06); }
        70% { transform: translateY(-8px) scale(1.08); filter: brightness(1.12) saturate(1.05); }
        100% { transform: translateY(-32px) scale(1.18); opacity: 0; filter: brightness(1.2); }
      }

      .ri-frame {
        position: absolute;
        inset: 0;
        border-radius: inherit;
        pointer-events: none;
        padding: 1px;
        background: conic-gradient(from 200deg, oklch(0.92 0.12 85 / .8), oklch(0.62 0.16 45 / .4), oklch(0.95 0.10 95 / .8), oklch(0.62 0.16 45 / .4), oklch(0.92 0.12 85 / .8));
        -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
        -webkit-mask-composite: xor;
        mask-composite: exclude;
        opacity: .9;
      }

      .ri-sheen {
        position: absolute;
        inset: 0;
        border-radius: inherit;
        pointer-events: none;
        overflow: hidden;
      }

      .ri-sheen::after {
        content: "";
        position: absolute;
        top: 0;
        bottom: 0;
        width: 50%;
        left: -60%;
        background: linear-gradient(105deg, transparent 30%, oklch(0.98 0.10 85 / .55) 50%, transparent 70%);
        mix-blend-mode: screen;
        animation: riSheen 1.4s ease-out .18s 1;
      }

      .ri-phase-accepting .ri-sheen::after {
        animation: riSheenFast .55s ease-out 1;
      }

      @keyframes riSheen {
        0% { transform: translateX(0); }
        100% { transform: translateX(260%); }
      }

      @keyframes riSheenFast {
        0% { transform: translateX(0); opacity: .9; }
        100% { transform: translateX(260%); opacity: 1; }
      }

      .ri-motes {
        position: absolute;
        inset: 0;
        border-radius: inherit;
        overflow: hidden;
        pointer-events: none;
      }

      .ri-mote {
        position: absolute;
        bottom: 8px;
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: oklch(0.92 0.14 80);
        box-shadow: 0 0 8px 1px oklch(0.85 0.18 70 / .8);
        opacity: 0;
        animation: riMote 4.4s linear infinite;
      }

      @keyframes riMote {
        0% { opacity: 0; transform: translateY(0) scale(.5); }
        20% { opacity: .7; }
        90% { opacity: .35; }
        100% { opacity: 0; transform: translateY(-180px) scale(1); }
      }

      .ri-toprow {
        position: relative;
        z-index: 2;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .ri-live {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px 4px 8px;
        border-radius: 999px;
        background: oklch(0.96 0.04 150 / .85);
        border: 1px solid oklch(0.60 0.13 150 / .5);
        color: oklch(0.32 0.13 150);
        font-size: 11px;
        font-weight: 700;
        letter-spacing: .02em;
      }

      .ri-live-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: oklch(0.62 0.16 150);
        box-shadow: 0 0 6px oklch(0.62 0.16 150);
        animation: riPulse 1.4s ease-in-out infinite;
      }

      @keyframes riPulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: .55; transform: scale(.7); }
      }

      .ri-kicker {
        font-family: var(--mono);
        font-size: 10px;
        letter-spacing: .14em;
        text-transform: uppercase;
        color: oklch(0.48 0.08 50);
      }

      .ri-callerwrap {
        position: relative;
        z-index: 2;
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 14px 6px;
      }

      .ri-avwrap {
        position: relative;
        flex-shrink: 0;
      }

      .ri-online {
        position: absolute;
        bottom: 6px;
        left: 6px;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: oklch(0.62 0.16 150);
        box-shadow: 0 0 0 3px oklch(0.96 0.04 80), 0 0 6px oklch(0.62 0.16 150);
      }

      .ri-ring {
        position: absolute;
        right: 2px;
        top: 50%;
        width: 86px;
        height: 86px;
        border-radius: 50%;
        border: 1.5px solid oklch(0.78 0.16 65 / .6);
        transform: translateY(-50%) scale(1);
        opacity: 0;
        animation: riRing 2.4s ease-out infinite;
        pointer-events: none;
      }

      .ri-ring-1 { animation-delay: 0s; }
      .ri-ring-2 { animation-delay: .8s; }
      .ri-ring-3 { animation-delay: 1.6s; }

      @keyframes riRing {
        0% { opacity: .6; transform: translateY(-50%) scale(.7); }
        80% { opacity: 0; transform: translateY(-50%) scale(1.7); }
        100% { opacity: 0; transform: translateY(-50%) scale(1.7); }
      }

      .ri-caller {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }

      .ri-name {
        font-family: var(--font-tajawal), var(--display), sans-serif;
        font-weight: 800;
        font-size: 22px;
        line-height: 1.15;
        color: oklch(0.22 0.06 40);
        text-shadow: 0 1px 0 oklch(0.97 0.05 85 / .5);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .ri-invitetext {
        font-weight: 700;
        font-size: 14px;
        color: oklch(0.45 0.07 50);
      }

      .ri-message {
        margin-top: 2px;
        max-width: 210px;
        color: oklch(0.43 0.06 48);
        font-size: 12px;
        font-weight: 600;
        line-height: 1.35;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .ri-meta {
        position: relative;
        z-index: 2;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 6px;
        padding: 10px 4px;
        border-top: 1px dashed oklch(0.72 0.08 60 / .45);
        border-bottom: 1px dashed oklch(0.72 0.08 60 / .45);
        margin: 0 2px;
      }

      .ri-sep {
        width: 1px;
        align-self: stretch;
        margin: 4px 0;
        background: oklch(0.72 0.08 60 / .3);
      }

      .ri-metachip {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 2px 4px;
        min-width: 0;
      }

      .ri-metachip-ico {
        display: grid;
        place-items: center;
        width: 24px;
        height: 24px;
        border-radius: 8px;
        background: linear-gradient(180deg, oklch(0.95 0.07 75), oklch(0.88 0.10 65));
        color: oklch(0.40 0.10 50);
        border: 1px solid oklch(0.75 0.10 60 / .35);
        flex-shrink: 0;
      }

      .ri-metachip-text {
        display: flex;
        flex-direction: column;
        line-height: 1.1;
        min-width: 0;
      }

      .ri-metachip-label {
        font-size: 10px;
        color: oklch(0.55 0.05 55);
      }

      .ri-metachip-value {
        font-size: 12px;
        font-weight: 800;
        color: var(--fg-0);
        white-space: nowrap;
      }

      .ri-mono {
        font-family: var(--mono);
        letter-spacing: .04em;
      }

      .ri-actions {
        position: relative;
        z-index: 2;
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 10px;
        padding-top: 12px;
      }

      .ri-btn {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 14px 16px;
        border-radius: 16px;
        font-family: var(--font-tajawal), var(--display), sans-serif;
        font-weight: 800;
        font-size: 15px;
        cursor: pointer;
        user-select: none;
        transition: transform .12s ease, filter .2s ease, box-shadow .2s ease;
        border: 0;
        overflow: hidden;
        isolation: isolate;
      }

      .ri-btn:active {
        transform: translateY(1px) scale(.985);
      }

      .ri-btn:disabled {
        opacity: .7;
        cursor: wait;
      }

      .ri-btn-accept {
        background: linear-gradient(180deg, oklch(0.86 0.16 75), oklch(0.68 0.18 55));
        color: oklch(0.22 0.04 35);
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,.6),
          inset 0 -2px 0 oklch(0.48 0.16 45),
          0 12px 26px -10px oklch(0.65 0.18 55 / .55),
          0 0 0 1px oklch(0.55 0.16 45 / .25);
        text-shadow: 0 1px 0 oklch(0.96 0.10 85 / .5);
      }

      .ri-btn-accept:hover {
        filter: brightness(1.05);
      }

      .ri-btn-glow {
        position: absolute;
        inset: -50% -10%;
        background: radial-gradient(closest-side, oklch(0.95 0.10 85 / .7), transparent 70%);
        opacity: .6;
        animation: riBtnGlow 2.4s ease-in-out infinite;
        z-index: -1;
      }

      @keyframes riBtnGlow {
        0%, 100% { opacity: .35; transform: scale(1); }
        50% { opacity: .75; transform: scale(1.06); }
      }

      .ri-btn-decline {
        background: oklch(0.96 0.02 80);
        color: oklch(0.45 0.06 50);
        border: 1px solid oklch(0.78 0.05 60 / .45);
        box-shadow: inset 0 1px 0 rgba(255,255,255,.7);
      }

      .ri-btn-decline:hover {
        background: oklch(0.94 0.03 78);
      }

      @media (prefers-reduced-motion: reduce) {
        .ri-card,
        .ri-sheen::after,
        .ri-mote,
        .ri-ring,
        .ri-live-dot,
        .ri-btn-glow {
          animation-duration: 0.001ms !important;
          animation-iteration-count: 1 !important;
        }
      }
    `}</style>
  );
}

export function GlobalRoomInviteDock() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const uid = user?.uid ?? null;
  const google = isFullAccountUser(user);
  const [invites, setInvites] = useState<InviteDoc[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading || !uid || !google) {
      setInvites([]);
      return;
    }
    const db = getFirebaseDb();
    const unsub = onSnapshot(
      collection(db, col.users, uid, userSub.roomInvites),
      (snap) => {
        const list: InviteDoc[] = [];
        for (const d of snap.docs) {
          const parsed = parseInvite(d.id, d.data() as Record<string, unknown>);
          if (parsed) list.push(parsed);
        }
        list.sort((a, b) => b.createdMs - a.createdMs);
        setInvites(list);
      },
      () => setInvites([]),
    );
    return () => unsub();
  }, [loading, uid, google]);

  const top = invites[0] ?? null;

  const onDecline = useCallback(async (inv: InviteDoc) => {
    setBusy(true);
    try {
      await postSocial("/api/social/room-invite/respond", { inviteId: inv.id, accept: false });
    } catch {
      // ignore
    } finally {
      setBusy(false);
    }
  }, []);

  const onAccept = useCallback(async (inv: InviteDoc) => {
    setBusy(true);
    try {
      resumeAudioContext();
      const res = (await postSocial<{ roomId?: string | null }>("/api/social/room-invite/respond", {
        inviteId: inv.id,
        accept: true,
      })) as { roomId?: string | null };
      const rid = res.roomId ? String(res.roomId) : "";
      if (rid) {
        router.replace(`/room/${rid}`);
        return;
      }
      throw new Error("INVITE_ACCEPT_NO_ROOM");
    } catch (err) {
      console.error("[room-invite] accept failed", err);
      throw err;
    } finally {
      setBusy(false);
    }
  }, [router]);

  if (!google || loading) return null;

  return (
    <AnimatePresence>
      {top ? (
        <RoomInviteToast
          key={top.id}
          inv={top}
          busy={busy}
          onAccept={onAccept}
          onDecline={onDecline}
        />
      ) : null}
    </AnimatePresence>
  );
}
