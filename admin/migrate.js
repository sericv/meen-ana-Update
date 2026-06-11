#!/usr/bin/env node
/**
 * من أنا؟ — Card Migration Script
 *
 * Reads all local card JSON files and uploads them to the Firestore `cards`
 * and `categories` collections using the same stable IDs the game generates.
 *
 * Usage:
 *   node admin/migrate.js [options]
 *
 * Options:
 *   --dry-run            Preview what would be written (no Firestore writes)
 *   --force              Overwrite existing documents (default: skip)
 *   --service-account    Path to service account JSON file
 *                        (overrides FIREBASE_SERVICE_ACCOUNT_JSON env var)
 *
 * Examples:
 *   node admin/migrate.js --dry-run
 *   node admin/migrate.js --service-account ./service-account.json
 *   node admin/migrate.js --force
 */

const path  = require('path');
const fs    = require('fs');
const admin = require('firebase-admin');

// ── CLI args ─────────────────────────────────────────────────────
const args      = process.argv.slice(2);
const DRY_RUN   = args.includes('--dry-run');
const FORCE     = args.includes('--force');
const saIdx     = args.indexOf('--service-account');
const SA_PATH   = saIdx !== -1 ? args[saIdx + 1] : null;

// ── Logging ───────────────────────────────────────────────────────
const c = {
  reset: '\x1b[0m',
  bold:  '\x1b[1m',
  dim:   '\x1b[2m',
  green: '\x1b[32m',
  yellow:'\x1b[33m',
  red:   '\x1b[31m',
  cyan:  '\x1b[36m',
  gray:  '\x1b[90m',
};
const log  = (msg)        => console.log(msg);
const ok   = (msg)        => console.log(`  ${c.green}✓${c.reset}  ${msg}`);
const skip = (msg)        => console.log(`  ${c.yellow}–${c.reset}  ${c.dim}${msg}${c.reset}`);
const err  = (msg)        => console.log(`  ${c.red}✗${c.reset}  ${msg}`);
const info = (msg)        => console.log(`  ${c.cyan}i${c.reset}  ${msg}`);
const head = (msg)        => console.log(`\n${c.bold}${msg}${c.reset}`);
const sep  = ()           => console.log(c.dim + '─'.repeat(56) + c.reset);

// ── Categories (mirrors src/lib/game/categories.ts) ──────────────
const CATEGORIES = [
  { id: 'cat_general',     nameAr: 'عام',       slug: 'general',     emoji: '🌐', order: 10 },
  { id: 'cat_celebrities', nameAr: 'مشاهير',    slug: 'celebrities', emoji: '⭐', order: 20 },
  { id: 'cat_animals',     nameAr: 'حيوانات',   slug: 'animals',     emoji: '🐾', order: 30 },
  { id: 'cat_games',       nameAr: 'ألعاب',     slug: 'games',       emoji: '🎮', order: 40 },
  { id: 'cat_anime',       nameAr: 'أنمي',      slug: 'anime',       emoji: '🌸', order: 50 },
];
const catMap = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

// ── ID generation (identical to src/lib/game/cards.ts) ───────────
function slugifyAscii(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function buildCardId(slug, name, image, seenIds) {
  const base = slugifyAscii(name) || slugifyAscii(image.replace(/\.[^.]+$/, ''));
  let id = `card_${slug}_${base}`;
  let n  = 2;
  while (seenIds.has(id)) {
    id = `card_${slug}_${base}_${n++}`;
  }
  seenIds.add(id);
  return id;
}

// ── Load card JSON files ──────────────────────────────────────────
const DATA_DIR = path.resolve(__dirname, '../src/lib/game/cards-data');
const DECK_FILES = ['general', 'animals', 'celebrities', 'games', 'anime'].map(
  n => path.join(DATA_DIR, `${n}.json`)
);

function loadDecks() {
  const decks = [];
  for (const file of DECK_FILES) {
    if (!fs.existsSync(file)) { err(`Deck file not found: ${file}`); continue; }
    const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
    decks.push(raw);
  }
  return decks;
}

// ── Build migration payload ───────────────────────────────────────
function buildMigrationPayload() {
  const decks = loadDecks();
  const seenIds = new Set();
  const cards = [];

  for (const deck of decks) {
    const catDef = catMap[deck.category];
    if (!catDef) { err(`Unknown category: ${deck.category}`); continue; }

    for (const item of deck.items) {
      const id = buildCardId(catDef.slug, item.name, item.image, seenIds);
      cards.push({
        id,
        name:       item.name,
        nameAr:     item.nameAr,
        imageUrl:   `/cards/${catDef.slug}/${item.image}`,
        categoryId: catDef.id,
        tags:       item.aliases ?? [],
        enabled:    true,
        difficulty: 'medium',
        source:     'migrated',
      });
    }
  }

  return { cards, categories: CATEGORIES };
}

// ── Firebase Admin init ───────────────────────────────────────────
function initFirebase() {
  let serviceAccount;

  // 1. Explicit --service-account flag
  if (SA_PATH) {
    const resolved = path.resolve(process.cwd(), SA_PATH);
    if (!fs.existsSync(resolved)) {
      err(`Service account file not found: ${resolved}`);
      process.exit(1);
    }
    serviceAccount = JSON.parse(fs.readFileSync(resolved, 'utf8'));
    info(`Using service account: ${resolved}`);
  }
  // 2. FIREBASE_SERVICE_ACCOUNT_JSON env var (same as the game)
  else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    try {
      serviceAccount = JSON.parse(raw);
    } catch {
      try {
        serviceAccount = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
      } catch {
        err('Could not parse FIREBASE_SERVICE_ACCOUNT_JSON');
        process.exit(1);
      }
    }
    info('Using FIREBASE_SERVICE_ACCOUNT_JSON env var');
  }
  // 3. Check for .env.local in project root
  else {
    const envFile = path.resolve(__dirname, '../.env.local');
    if (fs.existsSync(envFile)) {
      const envContent = fs.readFileSync(envFile, 'utf8');
      const match = envContent.match(/FIREBASE_SERVICE_ACCOUNT_JSON\s*=\s*(.+)/);
      if (match) {
        try {
          serviceAccount = JSON.parse(match[1].trim().replace(/^['"]|['"]$/g, ''));
          info('Using service account from .env.local');
        } catch (_) {}
      }
    }
  }

  if (!serviceAccount) {
    err('No Firebase service account found.');
    log('');
    log('Provide it via one of:');
    log('  1. --service-account ./path/to/service-account.json');
    log('  2. FIREBASE_SERVICE_ACCOUNT_JSON env var');
    log('  3. .env.local in the project root (FIREBASE_SERVICE_ACCOUNT_JSON=...)');
    log('');
    log('Get your service account from:');
    log('  Firebase Console → Project Settings → Service Accounts → Generate new private key');
    process.exit(1);
  }

  // Normalize private key
  if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'whoami-76238',
  });

  return admin.firestore();
}

// ── Write helpers ─────────────────────────────────────────────────
async function writeDoc(db, collection, id, data, existingIds) {
  if (existingIds.has(id)) {
    if (FORCE) {
      if (!DRY_RUN) {
        await db.collection(collection).doc(id).set({
          ...data,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      }
      ok(`[overwrite] ${collection}/${id}`);
      return 'overwrite';
    } else {
      skip(`[skip]      ${collection}/${id}  (already exists — use --force to overwrite)`);
      return 'skip';
    }
  } else {
    if (!DRY_RUN) {
      await db.collection(collection).doc(id).set({
        ...data,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    ok(`[create]   ${collection}/${id}`);
    return 'create';
  }
}

// ── Main ──────────────────────────────────────────────────────────
async function main() {
  log('');
  log(`${c.bold}${c.cyan}╔══════════════════════════════════════════╗${c.reset}`);
  log(`${c.bold}${c.cyan}║   من أنا؟  —  Card Migration Script     ║${c.reset}`);
  log(`${c.bold}${c.cyan}╚══════════════════════════════════════════╝${c.reset}`);
  log('');

  if (DRY_RUN) {
    info(`${c.yellow}DRY RUN mode — no Firestore writes will be made${c.reset}`);
  }
  if (FORCE) {
    info(`${c.yellow}FORCE mode — existing documents will be overwritten${c.reset}`);
  }

  // 1. Build payload
  head('📋  Building migration payload…');
  const { cards, categories } = buildMigrationPayload();
  info(`Found ${cards.length} cards across ${categories.length} categories`);

  // 2. Init Firebase (skip in dry run if we have no SA)
  let db = null;
  if (!DRY_RUN) {
    head('🔥  Initializing Firebase Admin…');
    db = initFirebase();
    ok('Firebase initialized');
  }

  // 3. Migrate categories
  head(`📁  Migrating ${categories.length} categories…`);
  sep();

  let existingCatIds = new Set();
  if (db) {
    const catSnap = await db.collection('categories').get();
    existingCatIds = new Set(catSnap.docs.map(d => d.id));
  }

  const catStats = { create: 0, overwrite: 0, skip: 0 };
  for (const cat of categories) {
    const { id, ...data } = cat;
    const result = await writeDoc(db, 'categories', id, data, existingCatIds);
    catStats[result]++;
  }

  log('');
  info(`Categories — created: ${catStats.create}, overwritten: ${catStats.overwrite}, skipped: ${catStats.skip}`);

  // 4. Migrate cards
  head(`🃏  Migrating ${cards.length} cards…`);
  sep();

  let existingCardIds = new Set();
  if (db) {
    const cardSnap = await db.collection('cards').get();
    existingCardIds = new Set(cardSnap.docs.map(d => d.id));
    info(`Existing cards in Firestore: ${existingCardIds.size}`);
  }

  const cardStats = { create: 0, overwrite: 0, skip: 0 };
  const batchSize = 25;
  const batches   = [];

  for (let i = 0; i < cards.length; i += batchSize) {
    batches.push(cards.slice(i, i + batchSize));
  }

  for (const batch of batches) {
    for (const card of batch) {
      const { id, ...data } = card;
      const result = await writeDoc(db, 'cards', id, data, existingCardIds);
      cardStats[result]++;
    }
  }

  // 5. Summary
  head('📊  Migration Summary');
  sep();
  log(`  Categories: ${c.green}${catStats.create} created${c.reset}, ${c.yellow}${catStats.overwrite} overwritten${c.reset}, ${c.dim}${catStats.skip} skipped${c.reset}`);
  log(`  Cards:      ${c.green}${cardStats.create} created${c.reset}, ${c.yellow}${cardStats.overwrite} overwritten${c.reset}, ${c.dim}${cardStats.skip} skipped${c.reset}`);
  log('');

  if (DRY_RUN) {
    info(`Dry run complete. Run without --dry-run to apply changes.`);
  } else {
    ok(`Migration complete! ${cardStats.create + cardStats.overwrite} cards now in Firestore.`);
    log('');
    info('Next steps:');
    log('    1. Open the admin dashboard: cd admin && npx serve .');
    log('    2. Sign in and verify all cards appeared correctly.');
    log('    3. Deploy updated firestore.rules: firebase deploy --only firestore:rules');
  }
  log('');
}

main().catch(e => {
  log('');
  err(`Fatal error: ${e.message}`);
  console.error(e);
  process.exit(1);
});
