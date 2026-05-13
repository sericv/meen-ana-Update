/** Prefer redirect-based Google OAuth on mobile / touch where popups often fail. */
export function preferGoogleAuthRedirect(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  if (/Mobi|Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    return true;
  }
  // iPadOS 13+ can report as desktop Safari.
  if (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1) return true;
  // Desktop Safari (not Chrome/Firefox/Edge): popups + COOP are unreliable; use full-page redirect.
  const isSafari = /Safari/i.test(ua) && !/Chrome|Chromium|CriOS|FxiOS|Edg/i.test(ua);
  if (isSafari) return true;
  return false;
}
