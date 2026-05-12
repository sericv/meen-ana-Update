"use client";

import type { User } from "firebase/auth";
import {
  GoogleAuthProvider,
  browserPopupRedirectResolver,
  getRedirectResult,
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
} from "firebase/auth";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { upsertUserDocument } from "@/lib/firestore/users.client";
import { useVisualViewport } from "@/hooks/useVisualViewport";

type AuthState = {
  user: User | null;
  loading: boolean;
  signInGoogle: () => Promise<void>;
  signInGuest: () => Promise<void>;
  logout: () => Promise<void>;
  setDisplayName: (name: string) => Promise<void>;
};

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Keep --app-vh / --kbd-h in sync with the soft keyboard for the whole app.
  useVisualViewport();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    // Completes OAuth when signInWithRedirect was used (popup blocked / strict browsers).
    void getRedirectResult(auth).catch(() => undefined);

    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (u) {
        void upsertUserDocument(u).catch(() => {
          // offline / rules — non-fatal; auth user still valid
        });
      }
    });
  }, []);

  const signInGoogle = useCallback(async () => {
    const auth = getFirebaseAuth();
    const provider = new GoogleAuthProvider();
    provider.addScope("profile");
    provider.addScope("email");
    provider.setCustomParameters({ prompt: "select_account" });
    try {
      await signInWithPopup(auth, provider, browserPopupRedirectResolver);
    } catch (e: unknown) {
      const code =
        e && typeof e === "object" && "code" in e ? String((e as { code: unknown }).code) : "";
      if (
        code === "auth/popup-blocked" ||
        code === "auth/operation-not-supported-in-this-environment"
      ) {
        await signInWithRedirect(auth, provider, browserPopupRedirectResolver);
        return;
      }
      throw e;
    }
  }, []);

  const signInGuest = useCallback(async () => {
    const auth = getFirebaseAuth();
    await signInAnonymously(auth);
  }, []);

  const logout = useCallback(async () => {
    const auth = getFirebaseAuth();
    await signOut(auth);
  }, []);

  const setDisplayName = useCallback(async (name: string) => {
    const auth = getFirebaseAuth();
    const u = auth.currentUser;
    if (!u) throw new Error("يجب تسجيل الدخول");
    const trimmed = name.trim().slice(0, 40);
    if (trimmed.length < 1) throw new Error("اسم غير صالح");
    await updateProfile(u, { displayName: trimmed });
    await upsertUserDocument(u);
  }, []);

  const value = useMemo(
    () => ({ user, loading, signInGoogle, signInGuest, logout, setDisplayName }),
    [user, loading, signInGoogle, signInGuest, logout, setDisplayName],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
}
