// ═══════════════════════════════════════════════════════
//  Matches — Live + History
// ═══════════════════════════════════════════════════════

import { fetchActiveMatches, fetchMatchHistory, fetchPlayingRooms } from "./firebase.js";
import { toast } from "./ui.js";

// ── State ─────────────────────────────────────────────
let _histCursor = null;
let _histHasMore = false;
let _categories = [];

export function setCategories(cats) { _categories = cats; }

// ── Init ─────────────────────────────────────────────
export async function initMatches() {
  document.getElementById("btn-refresh-live")?.addEventListener("click",    loadLive);
  document.getElementById("btn-refresh-history")?.addEventListener("click", loadHistory);
  document.getElementById("btn-more-history")?.addEventListener("click",    loadMoreHistory);

  document.querySelectorAll(".match-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".match-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      const target = tab.dataset.tab;
      document.querySelectorAll(".match-tab-panel").forEach(p => p.classList.add("hidden"));
      document.getElementById(`match-panel-${target}`)?.classList.remove("hidden");
    });
  });

  await Promise.all([loadLive(), loadHistory()]);
}

// ── Live matches (rooms with status playing) ──────────
async function loadLive() {
  const el = document.getElementById("live-matches-list");
  const cnt = document.getElementById("live-matches-count");
  if (!el) return;

  el.innerHTML = `<div class="loading-state"><div class="spinner"></div></div>`;

  try {
    const rooms = await fetchPlayingRooms();
    if (cnt) cnt.textContent = rooms.length > 0 ? `${rooms.length} مباراة نشطة` : "لا توجد مباريات الآن";

    if (rooms.length === 0) {
      el.innerHTML = `<div class="empty-state"><div class="empty-icon">⚔️</div><p class="empty-title">لا توجد مباريات نشطة</p></div>`;
      return;
    }

    el.innerHTML = rooms.map(r => renderLiveRoom(r)).join("");
  } catch (e) {
    el.innerHTML = `<div class="empty-state"><p style="color:var(--red)">${e.message}</p></div>`;
    toast("فشل تحميل المباريات النشطة: " + e.message, "error");
  }
}

function renderLiveRoom(room) {
  const players = (room.players ?? []).map(p => p.displayName ?? "لاعب").join(" vs ");
  const cat     = _categories.find(c => c.id === room.categoryId)?.nameAr ?? room.categoryId ?? "غير محدد";
  const created = room.createdAt?.toDate?.();
  const dur     = created ? fmtDuration(Date.now() - created.getTime()) : "—";
  const isBot   = room.vsBot === true;

  return `
    <div class="match-card">
      <div class="match-status-dot active-dot"></div>
      <div class="match-main">
        <div class="match-players">${escHtml(players)}${isBot ? " 🤖" : ""}</div>
        <div class="match-meta">${escHtml(cat)} · ${dur} · ${room.randomMatch ? "عشوائي" : "خاص"}</div>
      </div>
      <div class="match-badge badge-active">نشط</div>
    </div>
  `;
}

// ── Match history ─────────────────────────────────────
async function loadHistory(reset = true) {
  if (reset) { _histCursor = null; }
  const el = document.getElementById("history-list");
  if (!el) return;

  if (reset) el.innerHTML = `<div class="loading-state"><div class="spinner"></div></div>`;

  try {
    const res = await fetchMatchHistory({ cursor: _histCursor });
    _histCursor  = res.lastDoc;
    _histHasMore = res.hasMore;

    const rows = res.docs.map(renderHistoryRow).join("");
    if (reset) {
      el.innerHTML = rows || `<div class="empty-state"><div class="empty-icon">📋</div><p class="empty-title">لا توجد مباريات منتهية</p></div>`;
    } else {
      el.insertAdjacentHTML("beforeend", rows);
    }

    const moreBtn = document.getElementById("btn-more-history");
    if (moreBtn) moreBtn.classList.toggle("hidden", !_histHasMore);
  } catch (e) {
    toast("فشل تحميل السجل: " + e.message, "error");
  }
}

async function loadMoreHistory() { await loadHistory(false); }

function renderHistoryRow(m) {
  const players = (m.playerOrder ?? []).join(", ");
  const cat     = _categories.find(c => c.id === m.categoryId)?.nameAr ?? "—";
  const startMs = m.startedAt?.toMillis?.() ?? 0;
  const endMs   = m.endedAt?.toMillis?.() ?? 0;
  const dur     = startMs && endMs ? fmtDuration(endMs - startMs) : "—";
  const endDate = m.endedAt?.toDate?.();
  const endStr  = endDate ? endDate.toLocaleDateString("ar", { year:"numeric", month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" }) : "—";
  const winnerUid = m.winnerUid ?? null;
  const reason    = reasonLabel(m.winReason);

  return `
    <div class="match-card history-card">
      <div class="match-status-dot ended-dot"></div>
      <div class="match-main">
        <div class="match-players" title="${escHtml(players)}">
          ${winnerUid ? `🏆 ${escHtml(winnerUid.slice(0, 8))}…` : "بدون فائز"}
        </div>
        <div class="match-meta">${escHtml(cat)} · ${dur} · ${reason}</div>
        <div class="match-date">${endStr}</div>
      </div>
      <div class="match-badge badge-ended">منتهي</div>
    </div>
  `;
}

function reasonLabel(r) {
  const map = { guess:"تخمين", forfeit:"استسلام", guess_limit:"نفاد محاولات" };
  return map[r] ?? r ?? "—";
}

function fmtDuration(ms) {
  if (!ms || ms < 0) return "—";
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${String(sec).padStart(2, "0")}`;
}

function escHtml(s) {
  return String(s ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}
