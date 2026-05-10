/**
 * Seed categories + cards into Firestore using the Firebase Admin SDK.
 *
 * Usage (PowerShell):
 *   $env:FIREBASE_SERVICE_ACCOUNT_JSON = Get-Content serviceAccount.json -Raw
 *   node scripts/seed-firestore.mjs
 */
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
if (!raw) {
  console.error("Missing FIREBASE_SERVICE_ACCOUNT_JSON");
  process.exit(1);
}

const parsed = JSON.parse(raw);
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: parsed.project_id,
      clientEmail: parsed.client_email,
      privateKey: parsed.private_key.replace(/\\n/g, "\n"),
    }),
  });
}

const db = getFirestore();

const categories = [
  { id: "cat_objects", nameAr: "أشياء", slug: "objects", order: 10 },
  { id: "cat_animals", nameAr: "حيوانات", slug: "animals", order: 20 },
];

const cards = [
  {
    id: "card_iphone",
    name: "iPhone",
    nameAr: "آيفون",
    categoryId: "cat_objects",
    imageUrl: "https://picsum.photos/seed/iphone/800/600",
    tags: ["electronic", "phone", "screen", "portable"],
  },
  {
    id: "card_watch",
    name: "Smartwatch",
    nameAr: "ساعة ذكية",
    categoryId: "cat_objects",
    imageUrl: "https://picsum.photos/seed/watch/800/600",
    tags: ["electronic", "wearable", "screen", "portable"],
  },
  {
    id: "card_banana",
    name: "Banana",
    nameAr: "موز",
    categoryId: "cat_objects",
    imageUrl: "https://picsum.photos/seed/banana/800/600",
    tags: ["food", "fruit", "portable"],
  },
  {
    id: "card_cat",
    name: "Cat",
    nameAr: "قطة",
    categoryId: "cat_animals",
    imageUrl: "https://picsum.photos/seed/cat/800/600",
    tags: ["animal", "mammal"],
  },
  {
    id: "card_camel",
    name: "Camel",
    nameAr: "جمل",
    categoryId: "cat_animals",
    imageUrl: "https://picsum.photos/seed/camel/800/600",
    tags: ["animal", "mammal"],
  },
];

let batch = db.batch();
let n = 0;

async function commitIfNeeded(force = false) {
  if (n >= 400 || force) {
    if (n) await batch.commit();
    batch = db.batch();
    n = 0;
  }
}

for (const c of categories) {
  batch.set(
    db.collection("categories").doc(c.id),
    {
      nameAr: c.nameAr,
      slug: c.slug,
      order: c.order,
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  n++;
  await commitIfNeeded();
}

for (const card of cards) {
  batch.set(
    db.collection("cards").doc(card.id),
    {
      name: card.name,
      nameAr: card.nameAr,
      categoryId: card.categoryId,
      imageUrl: card.imageUrl,
      tags: card.tags,
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  n++;
  await commitIfNeeded();
}

await commitIfNeeded(true);
console.log(`Seeded ${categories.length} categories and ${cards.length} cards.`);
