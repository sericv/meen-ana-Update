import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let adminApp: App | undefined;

type ServiceAccountShape = {
  project_id: string;
  client_email: string;
  private_key: string;
};

export class AdminConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminConfigError";
  }
}

/**
 * Parse FIREBASE_SERVICE_ACCOUNT_JSON, which may be stored as:
 *   1. Plain minified JSON      {"project_id":"...","private_key":"..."}
 *   2. Outer-quoted JSON string '"{ ... }"'  (some CI/CD systems wrap with quotes)
 *   3. Base64-encoded JSON      (Vercel / Railway secret encoding)
 *
 * The private_key may arrive with:
 *   a. Actual newline characters  (JSON.parse already decoded them)
 *   b. Literal "\n" two-char sequences (double-escaped by some env handlers)
 * Both are normalised to actual newlines before being passed to firebase-admin.
 */
function parseServiceAccount(raw: string): ServiceAccountShape {
  const trimmed = raw.trim();

  const candidates: string[] = [trimmed];

  // Strip wrapping quotes added by some deployment platforms
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    candidates.push(trimmed.slice(1, -1));
  }

  // Base64 variant
  try {
    const decoded = Buffer.from(trimmed, "base64").toString("utf8");
    if (decoded.trimStart().startsWith("{")) candidates.push(decoded);
  } catch {
    // ignore
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as Partial<ServiceAccountShape>;
      if (parsed?.project_id && parsed?.client_email && parsed?.private_key) {
        // Normalise private_key: replace literal \n sequences with real newlines.
        // JSON.parse already converts proper JSON escape sequences, but some env
        // handlers double-escape them (\\n → \n → needs one more pass).
        const privateKey = parsed.private_key.includes("\\n")
          ? parsed.private_key.replace(/\\n/g, "\n")
          : parsed.private_key;

        return {
          project_id: parsed.project_id,
          client_email: parsed.client_email,
          private_key: privateKey,
        };
      }
    } catch {
      // try next candidate
    }
  }

  throw new AdminConfigError(
    "تعذر قراءة FIREBASE_SERVICE_ACCOUNT_JSON. تأكد أن المتغير يحتوي على JSON صحيح أو Base64 صالح.",
  );
}

/**
 * Returns (or lazily initialises) the Firebase Admin App singleton.
 * Throws AdminConfigError when FIREBASE_SERVICE_ACCOUNT_JSON is missing/invalid.
 */
export function getAdminApp(): App {
  if (adminApp) return adminApp;

  // Reuse if another module already initialised Firebase Admin
  const existing = getApps();
  if (existing.length) {
    adminApp = existing[0]!;
    return adminApp;
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw?.trim()) {
    const msg =
      "FIREBASE_SERVICE_ACCOUNT_JSON غير موجود في متغيرات البيئة. " +
      "أضفه في .env.local (للتطوير) أو في إعدادات النشر.";
    console.error("[firebase/admin] ✗", msg);
    throw new AdminConfigError(msg);
  }

  let sa: ServiceAccountShape;
  try {
    sa = parseServiceAccount(raw);
  } catch (err) {
    const msg =
      err instanceof AdminConfigError
        ? err.message
        : "FIREBASE_SERVICE_ACCOUNT_JSON تعذر تحليله: " + String(err);
    console.error("[firebase/admin] ✗", msg);
    throw new AdminConfigError(msg);
  }

  try {
    adminApp = initializeApp({
      credential: cert({
        projectId: sa.project_id,
        clientEmail: sa.client_email,
        privateKey: sa.private_key,
      }),
    });
    console.log(
      `[firebase/admin] ✓ initialised — project: ${sa.project_id}, account: ${sa.client_email}`,
    );
  } catch (err) {
    const msg = "فشل تهيئة Firebase Admin SDK: " + String(err);
    console.error("[firebase/admin] ✗", msg);
    throw new AdminConfigError(msg);
  }

  return adminApp;
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}

/** Returns true when Admin is (or can be) initialised — used for health checks. */
export function isAdminConfigured(): boolean {
  if (getApps().length > 0) return true;
  return Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim());
}
