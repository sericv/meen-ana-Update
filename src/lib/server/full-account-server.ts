import { getAdminAuth } from "@/lib/firebase/admin";
import { HttpError } from "@/lib/server/auth";

/** Matches client `isFullAccountUser`: Google-linked, not guest-only. */
export async function assertFullAccountUser(uid: string): Promise<void> {
  const record = await getAdminAuth().getUser(uid);
  const ids = record.providerData.map((p) => p.providerId);
  const onlyAnonymous = ids.length === 1 && ids[0] === "anonymous";
  if (onlyAnonymous) {
    throw new HttpError(403, "سجّل الدخول بحساب كامل لاستخدام هذه الميزة.");
  }
  if (!ids.includes("google.com")) {
    throw new HttpError(403, "هذه الميزة متاحة بعد تسجيل الدخول بـ Google.");
  }
}
