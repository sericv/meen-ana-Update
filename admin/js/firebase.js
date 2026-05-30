// ═══════════════════════════════════════════════════════
//  Firebase Initialization & Firestore Helpers
// ═══════════════════════════════════════════════════════

import { initializeApp }                          from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged }
                                                  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  collection, doc,
  getDocs, getDoc, addDoc, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, startAfter,
  serverTimestamp, Timestamp,
  writeBatch,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { FIREBASE_CONFIG } from "./config.js";

// ── Init ─────────────────────────────────────────────
const app  = initializeApp(FIREBASE_CONFIG);
const auth = getAuth(app);
const db   = getFirestore(app);

// ── Auth ─────────────────────────────────────────────
export function onAuthChange(cb) { return onAuthStateChanged(auth, cb); }
export async function signInGoogle() {
  return signInWithPopup(auth, new GoogleAuthProvider());
}
export async function signOutUser() { return signOut(auth); }

// ── Cards CRUD ────────────────────────────────────────
export async function fetchCards() {
  const snap = await getDocs(query(collection(db, "cards"), orderBy("createdAt", "desc")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
export async function addCard(data) {
  const ref = await addDoc(collection(db, "cards"), {
    ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });
  return ref.id;
}
export async function updateCard(id, data) {
  await updateDoc(doc(db, "cards", id), { ...data, updatedAt: serverTimestamp() });
}
export async function deleteCard(id) { await deleteDoc(doc(db, "cards", id)); }
export async function toggleCardEnabled(id, enabled) {
  await updateDoc(doc(db, "cards", id), { enabled, updatedAt: serverTimestamp() });
}

// ── Categories CRUD ───────────────────────────────────
export async function fetchCategories() {
  const snap = await getDocs(query(collection(db, "categories"), orderBy("order", "asc")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
export async function saveCategory(data) {
  await setDoc(doc(db, "categories", data.id), {
    nameAr: data.nameAr, slug: data.slug, emoji: data.emoji ?? "🌐",
    order: data.order ?? 99, updatedAt: serverTimestamp(),
  }, { merge: true });
}
export async function deleteCategory(id) { await deleteDoc(doc(db, "categories", id)); }
export async function countCardsInCategory(categoryId) {
  const snap = await getDocs(
    query(collection(db, "cards"), where("categoryId", "==", categoryId), limit(500))
  );
  return snap.size;
}

// ── Analytics — Counts ────────────────────────────────

export async function countCollection(collName, constraints = []) {
  // getDocs with a 500-doc cap. getCountFromServer returns 400 with document-level
  // security rules (e.g. matches, rooms) because the rules engine evaluates each
  // document individually — the aggregation API cannot resolve that at query time.
  // getDocs degrades to a clean 403 when rules are not yet deployed, and returns
  // accurate counts once the admin wildcard-read rule is live.
  const snap = await getDocs(query(collection(db, collName), ...constraints, limit(500)));
  return snap.size;
}

export async function getOverviewStats() {
  const [totalUsers, totalCards, totalCats, activeMatches, totalMatches, playingRooms] =
    await Promise.all([
      countCollection("users"),
      countCollection("cards"),
      countCollection("categories"),
      countCollection("matches", [where("status", "==", "active")]),
      countCollection("matches"),
      countCollection("rooms",   [where("status", "==", "playing")]),
    ]);

  // Online = players in playing rooms * 2 (approximation)
  const onlineApprox = playingRooms * 2;

  return { totalUsers, totalCards, totalCats, activeMatches, totalMatches, onlineApprox, playingRooms };
}

// ── Users ─────────────────────────────────────────────

export async function fetchUsers({ sortField = "xp", sortDir = "desc", pageSize = 50, cursor = null } = {}) {
  const constraints = [orderBy(sortField, sortDir), limit(pageSize)];
  if (cursor) constraints.push(startAfter(cursor));
  const snap = await getDocs(query(collection(db, "users"), ...constraints));
  return {
    docs: snap.docs.map(d => ({ uid: d.id, ...d.data() })),
    lastDoc: snap.docs[snap.docs.length - 1] ?? null,
    hasMore: snap.docs.length === pageSize,
  };
}

export async function fetchUser(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? { uid: snap.id, ...snap.data() } : null;
}

// ── Matches ───────────────────────────────────────────

export async function fetchActiveMatches() {
  const snap = await getDocs(
    query(collection(db, "matches"), where("status", "==", "active"), limit(50))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function fetchMatchHistory({ pageSize = 30, cursor = null } = {}) {
  const constraints = [
    where("status", "==", "ended"),
    orderBy("endedAt", "desc"),
    limit(pageSize),
  ];
  if (cursor) constraints.push(startAfter(cursor));
  const snap = await getDocs(query(collection(db, "matches"), ...constraints));
  return {
    docs: snap.docs.map(d => ({ id: d.id, ...d.data() })),
    lastDoc: snap.docs[snap.docs.length - 1] ?? null,
    hasMore: snap.docs.length === pageSize,
  };
}

export async function fetchRecentMatchesForChart(days = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const snap = await getDocs(
    query(
      collection(db, "matches"),
      where("startedAt", ">=", Timestamp.fromDate(since)),
      orderBy("startedAt", "asc"),
      limit(500),
    )
  );
  return snap.docs.map(d => d.data());
}

// ── Rooms ─────────────────────────────────────────────

export async function fetchPlayingRooms() {
  const snap = await getDocs(
    query(collection(db, "rooms"), where("status", "==", "playing"), limit(50))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── Cleanup helpers ───────────────────────────────────

function daysAgoTimestamp(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return Timestamp.fromDate(d);
}

export async function previewCleanup(type, days) {
  const threshold = daysAgoTimestamp(days);
  if (type === "matches") {
    const snap = await getDocs(
      query(collection(db, "matches"),
        where("status",  "==", "ended"),
        where("endedAt", "<",  threshold),
        limit(500))
    );
    return snap.size;
  }
  if (type === "rooms") {
    const snap = await getDocs(
      query(collection(db, "rooms"),
        where("status",         "==", "ended"),
        where("lastActivityAt", "<",  threshold),
        limit(500))
    );
    return snap.size;
  }
  return 0;
}

export async function executeCleanup(type, days, onProgress) {
  const threshold = daysAgoTimestamp(days);
  let deleted = 0;

  while (true) {
    let q;
    if (type === "matches") {
      q = query(collection(db, "matches"),
        where("status",  "==", "ended"),
        where("endedAt", "<",  threshold),
        limit(100));
    } else if (type === "rooms") {
      q = query(collection(db, "rooms"),
        where("status",         "==", "ended"),
        where("lastActivityAt", "<",  threshold),
        limit(100));
    } else break;

    const snap = await getDocs(q);
    if (snap.empty) break;

    // Safety double-check: never delete active/playing documents
    const batch = writeBatch(db);
    let batchCount = 0;
    for (const d of snap.docs) {
      const s = d.data().status;
      if (s === "active" || s === "playing") continue; // extra safety
      batch.delete(d.ref);
      batchCount++;
    }
    if (batchCount > 0) await batch.commit();
    deleted += batchCount;
    if (onProgress) onProgress(deleted);
    if (snap.docs.length < 100) break;
  }
  return deleted;
}

export { db, auth, serverTimestamp, Timestamp };
