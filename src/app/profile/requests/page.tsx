"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { AuthGate } from "@/components/auth/AuthGate";
import { AccountSubpageLayout } from "@/components/profile/AccountSubpageLayout";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/providers/AuthProvider";
import { useDefaultOnlinePresence } from "@/hooks/useDefaultOnlinePresence";
import { useIncomingFriendRequestCount } from "@/hooks/useIncomingFriendRequestCount";
import { playUIButton, resumeAudioContext } from "@/lib/audio/game-sounds";
import { getFirebaseDb } from "@/lib/firebase/client";
import { col, userSub } from "@/lib/firestore/paths";
import { isFullAccountUser } from "@/lib/auth/google-user";
import { postSocial } from "@/lib/api/social-client";

type InboxRow = {
  fromUid: string;
  displayName: string;
  photoURL: string | null;
  username: string;
};

type OutboxRow = {
  toUid: string;
  displayName: string;
  photoURL: string | null;
  username: string;
};

function RequestsInner() {
  const router = useRouter();
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const google = isFullAccountUser(user);
  useDefaultOnlinePresence(uid, google);
  const pendingIncoming = useIncomingFriendRequestCount(uid, google);

  const [inbox, setInbox] = useState<InboxRow[]>([]);
  const [outbox, setOutbox] = useState<OutboxRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!uid || !google) {
      setInbox([]);
      setOutbox([]);
      return;
    }
    const db = getFirebaseDb();
    const u1 = onSnapshot(
      collection(db, col.users, uid, userSub.friendInbox),
      (snap) => {
        const rows: InboxRow[] = [];
        for (const d of snap.docs) {
          const x = d.data() as Record<string, unknown>;
          rows.push({
            fromUid: String(x.fromUid ?? d.id),
            displayName: String(x.displayName ?? "لاعب"),
            photoURL: x.photoURL != null ? String(x.photoURL) : null,
            username: String(x.username ?? ""),
          });
        }
        setInbox(rows);
      },
      () => setInbox([]),
    );
    const u2 = onSnapshot(
      collection(db, col.users, uid, userSub.friendOutbox),
      (snap) => {
        const rows: OutboxRow[] = [];
        for (const d of snap.docs) {
          const x = d.data() as Record<string, unknown>;
          rows.push({
            toUid: String(x.toUid ?? d.id),
            displayName: String(x.displayName ?? "لاعب"),
            photoURL: x.photoURL != null ? String(x.photoURL) : null,
            username: String(x.username ?? ""),
          });
        }
        setOutbox(rows);
      },
      () => setOutbox([]),
    );
    return () => {
      u1();
      u2();
    };
  }, [uid, google]);

  const respond = async (fromUid: string, accept: boolean) => {
    resumeAudioContext();
    playUIButton();
    setBusy(fromUid);
    try {
      await postSocial("/api/social/friends/respond", { fromUid, accept });
    } finally {
      setBusy(null);
    }
  };

  if (!google) {
    return (
      <AccountSubpageLayout title="طلبات الصداقة">
        <div className="rounded-[1.5rem] border border-white/80 bg-white/90 p-8 text-center">
          <p className="text-base font-black text-[#8a3f16]">يتطلب Google</p>
          <Button type="button" className="mt-6" onClick={() => router.push("/login?next=/profile/requests")}>
            المتابعة عبر Google
          </Button>
        </div>
      </AccountSubpageLayout>
    );
  }

  return (
    <AccountSubpageLayout title="طلبات الصداقة">
      <div className="mb-3 flex items-center gap-2">
        {pendingIncoming > 0 ? (
          <span className="inline-flex h-2 w-2 rounded-full border border-white/90 shadow-[0_0_8px_rgba(249,115,22,0.6)]" style={{
            background: "radial-gradient(circle at 30% 30%, #ffb347 0%, #ea580c 100%)",
          }} />
        ) : null}
        <p className="text-xs font-bold text-[#a16231]">
          {pendingIncoming > 0 ? "لديك طلبات بانتظار ردّك" : "لا توجد طلبات جديدة"}
        </p>
      </div>

      <section className="mb-6 overflow-hidden rounded-[1.75rem] border border-[#ede9fe]/60 bg-gradient-to-b from-[#faf5ff] to-[#f5f0fe] p-5">
        <p className="mb-3 text-sm font-black text-[#5b21b6]">الوارد</p>
        {inbox.length === 0 ? (
          <p className="py-6 text-center text-xs font-semibold text-[#7c3aed]/80">لا شيء هنا حالياً.</p>
        ) : (
          <ul className="space-y-2">
            {inbox.map((row) => (
              <li
                key={row.fromUid}
                className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/70 bg-white/95 px-3 py-3 shadow-sm"
              >
                <ProfileAvatar cosmetic={undefined} fallbackPhotoURL={row.photoURL} displayName={row.displayName} size="sm" idle />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-[#5e3011]">{row.displayName}</p>
                  <p className="text-xs font-bold text-[#7c3aed]">@{row.username || "…"}</p>
                </div>
                <div className="flex w-full gap-2 sm:w-auto">
                  <Button type="button" variant="ghost" size="sm" className="flex-1" disabled={busy === row.fromUid} onClick={() => void respond(row.fromUid, false)}>
                    رفض
                  </Button>
                  <Button type="button" size="sm" className="flex-1" disabled={busy === row.fromUid} onClick={() => void respond(row.fromUid, true)}>
                    قبول
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="overflow-hidden rounded-[1.75rem] glass-card p-5">
        <p className="mb-3 text-sm font-black text-[#8a3f16]">المرسل</p>
        {outbox.length === 0 ? (
          <p className="py-6 text-center text-xs font-semibold text-[#bc7a45]">لم ترسل أي طلب معلّق.</p>
        ) : (
          <ul className="space-y-2">
            {outbox.map((row) => (
              <motion.li
                layout
                key={row.toUid}
                className="flex items-center gap-3 rounded-2xl border border-[#f4e0c8]/80 bg-white/90 px-3 py-3"
              >
                <ProfileAvatar cosmetic={undefined} fallbackPhotoURL={row.photoURL} displayName={row.displayName} size="sm" idle />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-[#5e3011]">{row.displayName}</p>
                  <p className="text-xs font-bold text-[#a16231]">@{row.username || "…"}</p>
                  <p className="text-[10px] font-bold text-amber-700">في انتظار الرد</p>
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </section>
    </AccountSubpageLayout>
  );
}

export default function ProfileRequestsPage() {
  return (
    <AuthGate>
      <RequestsInner />
    </AuthGate>
  );
}
