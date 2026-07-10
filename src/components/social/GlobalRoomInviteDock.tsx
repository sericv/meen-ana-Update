"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { useAuth } from "@/components/providers/AuthProvider";
import { getFirebaseDb } from "@/lib/firebase/client";
import { col, userSub } from "@/lib/firestore/paths";
import { isFullAccountUser } from "@/lib/auth/google-user";
import { postSocial } from "@/lib/api/social-client";
import { normalizeCosmetic } from "@/lib/profile/cosmetics";
import {
  playRoomInviteAccept,
  playRoomInviteChime,
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

const AUTO_DISMISS_MS = 20000;

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
    const t = window.setTimeout(() => setPhase("idle"), 500);
    return () => window.clearTimeout(t);
  }, []);

  // Auto-dismiss timeline
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={decline}
      dir="rtl"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 10 }}
        transition={{ type: "spring", stiffness: 420, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        className="game-card-outer w-full max-w-sm shadow-2xl overflow-hidden"
      >
        <div className="game-card-inner p-5 bg-white/95 rounded-[26px] border border-slate-100 flex flex-col gap-4 text-right">
          
          {/* Header row & Countdown Timer */}
          <div className="flex items-start justify-between">
            <div style={{ lineHeight: 1.2 }}>
              <h3 className="h-display text-sm font-black text-slate-800">دعوة إلى غرفة</h3>
              <p className="text-[9px] text-slate-400 font-bold mt-0.5">
                قام <span className="text-[#7C3AED] font-black">{inv.hostDisplayName}</span> بدعوتك للانضمام إلى تحدٍ خاص.
              </p>
            </div>

            {/* Circular Countdown Progress Badge */}
            <div className="relative w-7 h-7 flex items-center justify-center bg-slate-50 border border-slate-200/50 rounded-full flex-shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" className="transform -rotate-90">
                <circle cx="12" cy="12" r="10" stroke="#E2E8F0" strokeWidth="2.5" fill="transparent" />
                <motion.circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="#7C3AED"
                  strokeWidth="2.5"
                  fill="transparent"
                  strokeDasharray="62.8"
                  initial={{ strokeDashoffset: 0 }}
                  animate={{ strokeDashoffset: 62.8 }}
                  transition={{ duration: AUTO_DISMISS_MS / 1000, ease: "linear" }}
                />
              </svg>
              <span className="absolute text-[8px] font-black text-[#7C3AED] tabular-nums">⏰</span>
            </div>
          </div>

          {/* Invitation Envelope Illustration */}
          <div className="w-12 h-12 rounded-full bg-purple-50 border border-purple-100 flex items-center justify-center mx-auto my-1 flex-shrink-0 text-purple-600">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>

          {/* Room Information card details */}
          <div className="game-card-outer w-full">
            <div className="game-card-inner p-4 bg-slate-50/50 border border-slate-200/50 rounded-2xl flex flex-col gap-3">
              
              {/* Host and Slots Row */}
              <div className="flex items-center gap-3">
                <div className="relative flex-shrink-0">
                  <ProfileAvatar
                    cosmetic={cosmetic}
                    fallbackPhotoURL={inv.hostPhotoURL}
                    displayName={inv.hostDisplayName}
                    size="sm"
                    idle
                  />
                </div>

                <div className="flex-1 min-w-0" style={{ lineHeight: 1.15 }}>
                  <span className="text-xs font-black text-slate-800 truncate block">
                    {inv.hostDisplayName}
                  </span>
                  <span className="text-[8px] text-slate-400 font-bold block mt-0.5">
                    {inv.hostUsername ? `@${inv.hostUsername}` : "مضيف الغرفة"}
                  </span>
                </div>

                {/* Overlapping player slot previews */}
                <div className="flex -space-x-1.5 overflow-hidden">
                  <div className="w-5.5 h-5.5 rounded-full border border-white bg-purple-50 text-[7px] font-black text-purple-600 flex items-center justify-center flex-shrink-0 z-10">
                    {inv.hostDisplayName.slice(0, 1)}
                  </div>
                  <div className="w-5.5 h-5.5 rounded-full border border-white bg-slate-200 text-[6px] text-slate-400 flex items-center justify-center flex-shrink-0 z-0 select-none">
                    +
                  </div>
                </div>
              </div>

              {/* Horizontal divider */}
              <div className="h-[1px] bg-slate-200/50" />

              {/* Chips Details Grid */}
              <div className="flex flex-wrap gap-2 text-[8px] font-bold text-slate-500">
                <div className="px-2.5 py-1 rounded-full bg-white border border-slate-200/50 flex items-center gap-1">
                  <span>فئة:</span>
                  <span className="text-[#7C3AED] font-black">{inv.categoryLabel || "عام"}</span>
                </div>
                <div className="px-2.5 py-1 rounded-full bg-white border border-slate-200/50 flex items-center gap-1">
                  <span>وقت السؤال:</span>
                  <span className="text-slate-800 font-black">{inv.questionTimerSec ? `${inv.questionTimerSec}ث` : "تلقائي"}</span>
                </div>
                <div className="px-2.5 py-1 rounded-full bg-white border border-slate-200/50 flex items-center gap-1 font-mono">
                  <span>الرمز:</span>
                  <span className="text-slate-700 font-black">{inv.roomCode || "—"}</span>
                </div>
              </div>

              {/* Optional host custom message bubble */}
              {inv.message && (
                <div className="p-2.5 rounded-xl bg-purple-50/50 border border-purple-100 text-[9px] font-bold text-purple-700 leading-normal relative">
                  <span className="absolute -top-1.5 right-3 text-[7px] bg-purple-100 text-purple-700 px-1 rounded-full font-black">
                    ملاحظة
                  </span>
                  {inv.message}
                </div>
              )}

            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 mt-1">
            <motion.button
              type="button"
              disabled={busy}
              whileTap={busy ? {} : { scale: 0.96 }}
              onClick={decline}
              className="flex-1 py-3.5 rounded-xl text-xs font-black text-slate-500 bg-slate-50 border border-slate-200/50 active:scale-95 transition-transform flex items-center justify-center hover:bg-slate-100"
              style={{ cursor: "pointer" }}
            >
              رفض الدعوة
            </motion.button>

            <motion.button
              type="button"
              disabled={busy}
              whileTap={busy ? {} : { scale: 0.96 }}
              onClick={accept}
              className="flex-1 py-3.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-purple-600 to-purple-400 border border-purple-800 active:scale-95 transition-transform flex items-center justify-center gap-1.5 shadow-md"
              style={{ cursor: "pointer" }}
            >
              {busy && phase === "accepting" ? (
                <span>جاري الانضمام...</span>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>قبول وانضمام</span>
                </>
              )}
            </motion.button>
          </div>

        </div>
      </motion.div>
    </motion.div>
  );
}

export function GlobalRoomInviteDock() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const uid = user?.uid ?? null;
  const google = isFullAccountUser(user);
  const [invites, setInvites] = useState<InviteDoc[]>([]);
  const [busy, setBusy] = useState(false);
  const chimedInviteIds = useRef(new Set<string>());

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

  useEffect(() => {
    if (!top || chimedInviteIds.current.has(top.id)) return;
    chimedInviteIds.current.add(top.id);
    resumeAudioContext();
    playRoomInviteChime();
  }, [top]);

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
