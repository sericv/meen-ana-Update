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
  query, where, orderBy, serverTimestamp, Timestamp,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { FIREBASE_CONFIG } from "./config.js";

// ── Init ─────────────────────────────────────────────
const app  = initializeApp(FIREBASE_CONFIG);
const auth = getAuth(app);
const db   = getFirestore(app);

// ── Auth ─────────────────────────────────────────────
export function onAuthChange(cb) {
  return onAuthStateChanged(auth, cb);
}

export async function signInGoogle() {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

export async function signOutUser() {
  return signOut(auth);
}

// ── Cards CRUD ────────────────────────────────────────

/** Fetch all admin cards from Firestore. */
export async function fetchCards() {
  const snap = await getDocs(
    query(collection(db, "cards"), orderBy("createdAt", "desc"))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/** Add a new card. Returns the new doc ID. */
export async function addCard(data) {
  const ref = await addDoc(collection(db, "cards"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

/** Update an existing card. */
export async function updateCard(id, data) {
  await updateDoc(doc(db, "cards", id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/** Delete a card. */
export async function deleteCard(id) {
  await deleteDoc(doc(db, "cards", id));
}

/** Toggle a card's enabled status. */
export async function toggleCardEnabled(id, enabled) {
  await updateDoc(doc(db, "cards", id), {
    enabled,
    updatedAt: serverTimestamp(),
  });
}

// ── Categories CRUD ───────────────────────────────────

/** Fetch all categories from Firestore. */
export async function fetchCategories() {
  const snap = await getDocs(
    query(collection(db, "categories"), orderBy("order", "asc"))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/** Upsert a category (creates or updates). */
export async function saveCategory(data) {
  const ref = doc(db, "categories", data.id);
  await setDoc(ref, {
    nameAr:    data.nameAr,
    slug:      data.slug,
    emoji:     data.emoji ?? "🌐",
    order:     data.order ?? 99,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

/** Delete a category by ID. */
export async function deleteCategory(id) {
  await deleteDoc(doc(db, "categories", id));
}

/** Count cards in a given category. */
export async function countCardsInCategory(categoryId) {
  const snap = await getDocs(
    query(collection(db, "cards"), where("categoryId", "==", categoryId))
  );
  return snap.size;
}

export { db, auth, serverTimestamp };
