import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { col } from "@/lib/firestore/paths";
import { ROOM_INACTIVE_MS } from "@/lib/game/constants";

/**
 * Call from a scheduler (e.g. Vercel Cron) with header:
 *   Authorization: Bearer <CRON_SECRET>
 */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return Response.json({ ok: false }, { status: 401 });
  }

  const db = getAdminDb();
  const cutoff = Timestamp.fromMillis(Date.now() - ROOM_INACTIVE_MS);
  const roomsSnap = await db
    .collection(col.rooms)
    .where("lastActivityAt", "<", cutoff)
    .limit(25)
    .get();

  let deleted = 0;
  for (const doc of roomsSnap.docs) {
    const batch = db.batch();
    const roomRef = doc.ref;
    const code = String(doc.data().code ?? "");
    if (code) batch.delete(db.collection(col.roomCodes).doc(code));
    const subs = ["messages", "presence", "typing", "playerCards", "serverRate"] as const;
    for (const s of subs) {
      const sub = await roomRef.collection(s).limit(500).get();
      for (const d of sub.docs) batch.delete(d.ref);
    }
    batch.delete(roomRef);
    const matchId = doc.data().matchId as string | undefined;
    if (matchId) batch.delete(db.collection(col.matches).doc(matchId));
    await batch.commit();
    deleted++;
  }

  return Response.json({ ok: true, deletedRooms: deleted });
}
