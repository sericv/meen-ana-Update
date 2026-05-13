import type { User } from "firebase/auth";

export function isGoogleLinkedUser(user: User | null | undefined): boolean {
  if (!user || user.isAnonymous) return false;
  return user.providerData.some((p) => p.providerId === "google.com");
}
