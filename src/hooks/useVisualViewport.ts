"use client";

import { useEffect } from "react";

/**
 * Mobile-keyboard-aware viewport sizing.
 *
 * Sets CSS custom properties on <html> from the VisualViewport API:
 *   • --app-vh   → visible height (px) — use as `height: var(--app-vh)` for
 *                  shells that should match the on-screen area (keyboard
 *                  included in the shrink on Chrome `resizes-content`, or
 *                  overlay keyboards on iOS).
 *   • --vv-top / --vv-left → visual viewport offset inside the layout
 *                  viewport (iOS Safari). Pair with `position: fixed;
 *                  top: var(--vv-top); height: var(--app-vh)` so gameplay
 *                  tracks the visible rectangle instead of the layout box.
 *   • --kbd-h    → legacy estimate: max(0, innerHeight - visualViewport.height).
 *                  **Do not add this inside a flex column that already uses
 *                  `--app-vh` as its total height** — that double-counts the
 *                  keyboard and collapses scroll areas (e.g. in-game chat).
 *                  Reserved for fixed footers on full-layout pages only.
 *
 * The hook is idempotent — calling it from multiple components is fine.
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
      const top = vv ? Math.round(vv.offsetTop) : 0;
      const left = vv ? Math.round(vv.offsetLeft) : 0;
      // Keyboard height = (window inner height) - (visible viewport).
      // Clamp to 0 to avoid tiny negative values from rounding.
      const kbd = Math.max(0, Math.round(fullH - vh));
      const vw = vv ? Math.round(vv.width) : Math.round(window.innerWidth);
      root.style.setProperty("--app-vh", `${Math.round(vh)}px`);
      root.style.setProperty("--vv-top", `${top}px`);
      root.style.setProperty("--vv-left", `${left}px`);
      root.style.setProperty("--vv-width", `${vw}px`);
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
