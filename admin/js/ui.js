// ═══════════════════════════════════════════════════════
//  UI Utilities — Modal, Toast, Confirm, Loading
// ═══════════════════════════════════════════════════════

// ── Toast ─────────────────────────────────────────────
const toastRoot = document.getElementById("toast-root");

export function toast(message, type = "default", duration = 3000) {
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = message;
  toastRoot.prepend(el);
  setTimeout(() => {
    el.classList.add("removing");
    el.addEventListener("animationend", () => el.remove(), { once: true });
  }, duration);
}

// ── Modal ─────────────────────────────────────────────
const backdrop   = document.getElementById("modal-backdrop");
const modalBox   = document.getElementById("modal-box");
const modalTitle = document.getElementById("modal-title");
const modalBody  = document.getElementById("modal-body");
const modalClose = document.getElementById("modal-close");

let _onModalClose = null;

modalClose.addEventListener("click",  closeModal);
backdrop.addEventListener("click", (e) => {
  if (e.target === backdrop) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

export function openModal(title, bodyHTML, onClose) {
  modalTitle.textContent = title;
  modalBody.innerHTML    = bodyHTML;
  _onModalClose          = onClose ?? null;
  backdrop.classList.remove("hidden");
  // Focus first input
  requestAnimationFrame(() => {
    const first = modalBody.querySelector("input, select, textarea");
    if (first) first.focus();
  });
}

export function closeModal() {
  backdrop.classList.add("hidden");
  modalBody.innerHTML = "";
  if (_onModalClose) { _onModalClose(); _onModalClose = null; }
}

export function getModalBody() { return modalBody; }

// ── Confirm ───────────────────────────────────────────
const confirmBackdrop = document.getElementById("confirm-backdrop");
const confirmMsg      = document.getElementById("confirm-msg");
const confirmOk       = document.getElementById("confirm-ok");
const confirmCancel   = document.getElementById("confirm-cancel");

let _confirmResolve = null;

confirmOk.addEventListener("click", () => {
  confirmBackdrop.classList.add("hidden");
  if (_confirmResolve) { _confirmResolve(true); _confirmResolve = null; }
});
confirmCancel.addEventListener("click", () => {
  confirmBackdrop.classList.add("hidden");
  if (_confirmResolve) { _confirmResolve(false); _confirmResolve = null; }
});

/** Returns a promise that resolves to true (confirmed) or false (cancelled). */
export function confirm(message) {
  confirmMsg.textContent = message;
  confirmBackdrop.classList.remove("hidden");
  return new Promise(res => { _confirmResolve = res; });
}

// ── Loading button state ──────────────────────────────
export function setButtonLoading(btn, loading, label) {
  if (loading) {
    btn.dataset.origLabel = btn.textContent;
    btn.textContent = label ?? "جاري…";
    btn.disabled = true;
  } else {
    btn.textContent = btn.dataset.origLabel ?? btn.textContent;
    btn.disabled = false;
  }
}

// ── Section switching ─────────────────────────────────
export function showSection(id) {
  document.querySelectorAll(".section").forEach(s => s.classList.add("hidden"));
  document.getElementById(`section-${id}`)?.classList.remove("hidden");
  document.querySelectorAll(".nav-item").forEach(n => {
    n.classList.toggle("active", n.dataset.section === id);
  });
}
