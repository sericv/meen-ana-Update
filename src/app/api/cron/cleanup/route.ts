import { Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { col } from "@/lib/firestore/paths";
import {
  ROOM_INACTIVE_MS,
  ROOM_INVITE_TTL_MS,
  SOCIAL_INBOX_TTL_MS,
} from "@/lib/game/constants";
import { deleteRoomFully } from "@/lib/server/room-lifecycle";

/**
 * Cleanup cron — call from a scheduler with header:
 *   Authorization: Bearer <CRON_SECRET>
 *
 * Vercel Cron automatically supplies this header when CRON_SECRET is set
 * as a project environment variable. See vercel.json for the schedule.
 *
 * What each run deletes:
 *   1. Rooms whose cleanupAt ≤ now (set 5 min after match end)
 *   2. Rooms inactive for > ROOM_INACTIVE_MS with no future cleanupAt
 *   3. roomInvite docs older than ROOM_INVITE_TTL_MS (unanswered/orphaned)
 *   4. socialInbox notification docs older than SOCIAL_INBOX_TTL_MS
 *
 * Each category is capped at 50 docs per run to stay within Vercel's
 * 10-second cron execution limit. The next run will continue the sweep.
 */
async function runCleanup(req: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return Response.json({ ok: false }, { status: 401 });
  }

  const db = getAdminDb();
  const now = Timestamp.fromMillis(Date.now());
  let deletedRooms = 0;
  let deletedInvites = 0;
  let deletedInbox = 0;

  // ── 1. Scheduled room cleanup (cleanupAt ≤ now) ─────────────────────
  const scheduled = await db
    .collection(col.rooms)
    .where("cleanupAt", "<=", now)
    .limit(25)
    .get();

  for (const doc of scheduled.docs) {
    await deleteRoomFully(doc.id, doc.data());
    deletedRooms++;
  }

  // ── 2. Inactivity-based room cleanup ────────────────────────────────
  const cutoff = Timestamp.fromMillis(Date.now() - ROOM_INACTIVE_MS);
  const staleRooms = await db
    .collection(col.rooms)
    .where("lastActivityAt", "<", cutoff)
    .limit(25)
    .get();

  for (const doc of staleRooms.docs) {
    // Skip if a future cleanup is already scheduled (we'll get it next run)
    const ca = doc.data().cleanupAt as Timestamp | undefined;
    if (ca?.toMillis?.() && ca.toMillis() > Date.now()) continue;
    await deleteRoomFully(doc.id, doc.data());
    deletedRooms++;
  }

  // ── 3. Stale room invites ────────────────────────────────────────────
  // Invites older than ROOM_INVITE_TTL_MS whose room may have started,
  // been deleted, or whose recipient never responded.
  // deleteRoomFully handles invites for deleted rooms, but orphaned
  // invites in other scenarios (host cancels, room fills) still need this.
  try {
    const inviteCutoff = Timestamp.fromMillis(Date.now() - ROOM_INVITE_TTL_MS);
    const staleInvites = await db
      .collectionGroup("roomInvites")
      .where("createdAt", "<=", inviteCutoff)
      .limit(50)
      .get();

    if (!staleInvites.empty) {
      const batch = db.batch();
      for (const d of staleInvites.docs) {
        batch.delete(d.ref);
        deletedInvites++;
      }
      await batch.commit();
    }
  } catch {
    // Collection group index may not exist yet in local dev — non-fatal.
  }

  // ── 4. Stale socialInbox notifications ──────────────────────────────
  // These are decline notifications, etc. written by respondRoomInvite and
  // similar flows. They have no client-side deletion path, so the cron sweeps them.
  try {
    const inboxCutoff = Timestamp.fromMillis(Date.now() - SOCIAL_INBOX_TTL_MS);
    const staleInbox = await db
      .collectionGroup("socialInbox")
      .where("createdAt", "<=", inboxCutoff)
      .limit(50)
      .get();

    if (!staleInbox.empty) {
      const batch = db.batch();
      for (const d of staleInbox.docs) {
        batch.delete(d.ref);
        deletedInbox++;
      }
      await batch.commit();
    }
  } catch {
    // Collection group index may not exist yet in local dev — non-fatal.
  }

  return Response.json({ ok: true, deletedRooms, deletedInvites, deletedInbox });
}

// Vercel Cron triggers GET; external callers (CI, manual ops) use POST.
// Both require the same CRON_SECRET Authorization header.
export async function GET(req: Request) {
  return runCleanup(req);
}

export async function POST(req: Request) {
  return runCleanup(req);
}
