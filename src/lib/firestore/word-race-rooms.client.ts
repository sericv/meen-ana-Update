import { getFirebaseDb } from "@/lib/firebase/client";
import { doc, setDoc, getDoc } from "firebase/firestore";
import type { WordRaceRoom, WordRaceRoomSettings } from "@/types/word-race";

const sanitizeDoc = <T extends Record<string, any>>(obj: T): T => {
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      clean[key] = null;
    } else if (value && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) {
      clean[key] = sanitizeDoc(value);
    } else {
      clean[key] = value;
    }
  }
  return clean as T;
};

export async function createWordRaceRoom(params: {
  uid: string;
  displayName: string;
  settings: WordRaceRoomSettings;
}): Promise<{ roomId: string; room: WordRaceRoom }> {
  const { uid, displayName, settings } = params;
  const roomId = `wr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  const roomData: WordRaceRoom = sanitizeDoc({
    id: roomId,
    code,
    hostUid: uid,
    status: "lobby",
    players: [
      {
        uid,
        displayName: displayName || "متسابق",
        ready: true,
        isHost: true,
        joinedAt: Date.now(),
      },
    ],
    playerUids: [uid],
    settings,
    matchId: null,
    createdAt: Date.now(),
    lastActivityAt: Date.now(),
  });

  const db = getFirebaseDb();
  await setDoc(doc(db, "word_race_rooms", roomId), roomData);
  await setDoc(doc(db, "word_race_codes", code), { roomId });

  return { roomId, room: roomData };
}

export async function fetchWordRaceRoom(roomId: string): Promise<WordRaceRoom | null> {
  try {
    const db = getFirebaseDb();
    const snap = await getDoc(doc(db, "word_race_rooms", roomId));
    if (snap.exists()) {
      return snap.data() as WordRaceRoom;
    }
    return null;
  } catch (err) {
    console.error("Failed to fetch Word Race room:", err);
    return null;
  }
}
