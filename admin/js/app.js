// ═══════════════════════════════════════════════════════
//  App Bootstrap — Auth, Navigation, Init
// ═══════════════════════════════════════════════════════

import { onAuthChange, signInGoogle, signOutUser } from "./firebase.js";
import { showSection, toast } from "./ui.js";
import { initCards } from "./cards.js";
import { initCategories, getCategories } from "./categories.js";

// ── Elements ──────────────────────────────────────────
const authScreen   = document.getElementById("auth-screen");
const appShell     = document.getElementById("app");
const btnGoogle    = document.getElementById("btn-google-signin");
const btnSignout   = document.getElementById("btn-signout");
const authError    = document.getElementById("auth-error");
const connIndicator = document.getElementById("conn-indicator");
const connLabel     = document.getElementById("conn-label");
const userRow       = document.getElementById("user-row");

// ── Auth flow ─────────────────────────────────────────
btnGoogle.addEventListener("click", async () => {
  authError.classList.add("hidden");
  btnGoogle.textContent = "جاري التسجيل…";
  btnGoogle.disabled = true;
  try {
    await signInGoogle();
  } catch (e) {
    authError.textContent = "تعذّر تسجيل الدخول: " + (e.message ?? e);
    authError.classList.remove("hidden");
    btnGoogle.innerHTML = `<svg width="20" height="20" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.6 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 2.9l5.7-5.7C34.5 6.5 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.6 18.9 12 24 12c3.1 0 5.8 1.1 8 2.9l5.7-5.7C34.5 6.5 29.5 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5.1l-6.2-5.3C29.3 35.5 26.8 36 24 36c-5.2 0-9.6-3.3-11.3-8H6.1C9.4 35.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.4 4.3-4.4 5.7l6.2 5.3C36.9 40.1 44 35 44 24c0-1.3-.1-2.6-.4-3.9z"/>
    </svg> تسجيل الدخول بـ Google`;
    btnGoogle.disabled = false;
  }
});

btnSignout.addEventListener("click", async () => {
  await signOutUser();
});

// ── Auth state listener ───────────────────────────────
let _appBooted = false;

onAuthChange(async (user) => {
  if (user) {
    // Show app
    authScreen.classList.add("hidden");
    appShell.classList.remove("hidden");

    // Show user info
    userRow.innerHTML = user.photoURL
      ? `<img class="user-avatar" src="${user.photoURL}" alt="${user.displayName ?? ""}"><span class="user-name">${user.displayName ?? user.email ?? ""}</span>`
      : `<span class="user-name">${user.displayName ?? user.email ?? ""}</span>`;

    // Boot app once
    if (!_appBooted) {
      _appBooted = true;
      await bootApp();
    }
  } else {
    // Show auth
    authScreen.classList.remove("hidden");
    appShell.classList.add("hidden");
    _appBooted = false;
  }
});

// ── Boot ──────────────────────────────────────────────
async function bootApp() {
  try {
    // 1. Load categories first (cards need them for dropdowns)
    const cats = await initCategories();

    // 2. Load cards section
    await initCards(cats.length > 0 ? cats : getCategories());

    // 3. Wire navigation
    document.querySelectorAll(".nav-item").forEach(link => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        showSection(link.dataset.section);
      });
    });

    // Start on cards
    showSection("cards");
    setConnected(true);
  } catch (e) {
    toast("خطأ في تشغيل التطبيق: " + e.message, "error");
    setConnected(false);
  }
}

function setConnected(ok) {
  connIndicator.classList.toggle("offline", !ok);
  connLabel.textContent = ok ? "متصل" : "غير متصل";
}
