"use client";

import { getFirebaseAuth } from "@/lib/firebase/client";

export async function postGame<T extends Record<string, unknown>>(
  path: string,
  body: Record<string, unknown>,
): Promise<T & { ok: true }> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("يجب تسجيل الدخول");
  const token = await user.getIdToken();
  const res = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const j = (await res.json()) as { ok?: boolean; error?: string } & Record<string, unknown>;
  if (!j.ok) throw new Error(j.error ?? "فشل الطلب");
  return j as T & { ok: true };
}
