"use client";

import { useEffect } from "react";

/**
 * Mobile-keyboard-aware viewport sizing.
 *
 * Sets two CSS custom properties on <html> from the VisualViewport API:
 *   • --app-vh  → actual visible height (px). Use as `height: var(--app-vh)`
 *                 to make a region fill the visible area even while the
 *                 software keyboard is open.
 *   • --kbd-h   → number of px currently occupied by the keyboard (0 when
 *                 closed). Composers/footers use `.kbd-safe` (which reads
 *                 this var) to stay above the keyboard.
 *
 * The hook is idempotent — calling it from multiple components is fine
 * (the second installer just re-registers the same listeners against the
 * same global element).
 */
export function useVisualViewport(): void {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    const vv = window.visualViewport;

    let raf = 0;
    const apply = () => {
      raf = 0;
      const vh = vv?.height ?? window.innerHeight;
      const fullH = window.innerHeight;
      // Keyboard height = (window inner height) - (visible viewport).
      // Clamp to 0 to avoid tiny negative values from rounding.
      const kbd = Math.max(0, Math.round(fullH - vh));
      root.style.setProperty("--app-vh", `${Math.round(vh)}px`);
      root.style.setProperty("--kbd-h", `${kbd}px`);
      // Toggle a class so components can react to keyboard state with
      // pure CSS if they want (e.g. shrink decorative elements).
      if (kbd > 80) root.classList.add("kbd-open");
      else root.classList.remove("kbd-open");
    };

    const schedule = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(apply);
    };

    apply();

    if (vv) {
      vv.addEventListener("resize", schedule);
      vv.addEventListener("scroll", schedule);
    }
    window.addEventListener("resize", schedule);
    window.addEventListener("orientationchange", schedule);
    // Chat inputs: VisualViewport sometimes lags behind focus on mobile keyboards.
    document.addEventListener("focusin", schedule);
    document.addEventListener("focusout", schedule);

    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      if (vv) {
        vv.removeEventListener("resize", schedule);
        vv.removeEventListener("scroll", schedule);
      }
      window.removeEventListener("resize", schedule);
      window.removeEventListener("orientationchange", schedule);
      document.removeEventListener("focusin", schedule);
      document.removeEventListener("focusout", schedule);
    };
  }, []);
}
