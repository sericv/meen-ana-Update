"use client";

import type { User } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/client";
import { col } from "@/lib/firestore/paths";

export async function upsertUserDocument(user: User) {
  const db = getFirebaseDb();
  const ref = doc(db, col.users, user.uid);
  await setDoc(
    ref,
    {
      displayName: user.displayName || "زائر",
      photoURL: user.photoURL || null,
      isGuest: user.isAnonymous,
      lastSeen: serverTimestamp(),
    },
    { merge: true },
  );
}
