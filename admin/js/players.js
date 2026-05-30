// ═══════════════════════════════════════════════════════
//  Players — List, Search, Profile
// ═══════════════════════════════════════════════════════

import { fetchUsers, fetchUser } from "./firebase.js";
import { openModal, closeModal, getModalBody, toast } from "./ui.js";

// ── Level helper (mirrors src/lib/profile/level.ts) ───
function levelFromXp(xp) {
  const safe = Math.max(0, Math.floor(xp ?? 0));
  let level = 1;
  while (level < 200) {
    let total = 0;
    for (let k = 1; k <= level; k++) total += Math.floor(50 * Math.pow(k, 1.75));
    if (total > safe) break;
    level++;
  }
  return level;
}

function fmtNum(n) { return (n ?? 0).toLocaleString("ar"); }
function fmtCoins(n) { return `${fmtNum(n)} 🪙`; }

// ── State ─────────────────────────────────────────────
let _players   = [];
let _cursor    = null;
let _hasMore   = false;
let _sortField = "xp";
let _sortDir   = "desc";
let _search    = "";

// ── Init ─────────────────────────────────────────────
export async function initPlayers() {
  document.getElementById("btn-load-players")?.addEventListener("click", () => loadPlayers(true));
  document.getElementById("btn-more-players")?.addEventListener("click", loadMorePlayers);
  document.getElementById("players-search")?.addEventListener("input", e => {
    _search = e.target.value.toLowerCase();
    renderTable();
  });
  document.querySelectorAll("[data-sort]").forEach(btn => {
    btn.addEventListener("click", () => {
      const field = btn.dataset.sort;
      if (_sortField === field) {
        _sortDir = _sortDir === "desc" ? "asc" : "desc";
      } else {
        _sortField = field;
        _sortDir   = "desc";
      }
      document.querySelectorAll("[data-sort]").forEach(b => b.classList.remove("sort-active"));
      btn.classList.add("sort-active");
      loadPlayers(true);
    });
  });

  await loadPlayers(true);
}

async function loadPlayers(reset = false) {
  if (reset) { _players = []; _cursor = null; }

  const loadingEl = document.getElementById("players-loading");
  if (loadingEl) loadingEl.classList.remove("hidden");

  try {
    const res = await fetchUsers({ sortField: _sortField, sortDir: _sortDir, pageSize: 50, cursor: _cursor });
    _players  = reset ? res.docs : [..._players, ...res.docs];
    _cursor   = res.lastDoc;
    _hasMore  = res.hasMore;
    renderTable();

    const subtitle = document.getElementById("players-subtitle");
    if (subtitle) subtitle.textContent = `${_players.length}${_hasMore ? "+" : ""} لاعب`;
  } catch (e) {
    toast("فشل تحميل اللاعبين: " + e.message, "error");
  } finally {
    if (loadingEl) loadingEl.classList.add("hidden");
    const moreBtn = document.getElementById("btn-more-players");
    if (moreBtn) moreBtn.classList.toggle("hidden", !_hasMore);
  }
}

async function loadMorePlayers() { await loadPlayers(false); }

// ── Render table ──────────────────────────────────────
function renderTable() {
  const tbody = document.getElementById("players-tbody");
  if (!tbody) return;

  const filtered = _search
    ? _players.filter(p =>
        (p.displayName ?? "").toLowerCase().includes(_search) ||
        (p.uid ?? "").toLowerCase().includes(_search)
      )
    : _players;

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-3)">لا توجد نتائج</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map((p, i) => {
    const level   = levelFromXp(p.xp);
    const wins    = p.matchWins ?? 0;
    const total   = p.matchTotal ?? 0;
    const wr      = total > 0 ? Math.round((wins / total) * 100) : 0;
    const name    = p.displayName ?? `لاعب #${p.uid?.slice(0, 6) ?? "؟"}`;
    const isGuest = !p.photoURL && (!p.displayName || p.displayName === "زائر");

    return `<tr class="player-row" data-uid="${p.uid}" title="عرض الملف الشخصي">
      <td style="color:var(--text-3);font-size:11px">${i + 1}</td>
      <td>
        <div class="player-name-cell">
          <div class="player-avatar-sm">${(name[0] ?? "؟").toUpperCase()}</div>
          <div>
            <div class="player-name">${escHtml(name)}</div>
            <div class="player-uid">${p.uid?.slice(0, 10) ?? ""}…</div>
          </div>
        </div>
      </td>
      <td><span class="badge ${isGuest ? "badge-guest" : "badge-google"}">${isGuest ? "ضيف" : "Google"}</span></td>
      <td><span class="level-badge">مستوى ${level}</span></td>
      <td>${fmtNum(p.xp)} XP</td>
      <td>${wins} / ${total}</td>
      <td><span class="wr-badge ${wr >= 50 ? "wr-good" : ""}">${wr}%</span></td>
      <td>${fmtNum(p.coins)} 🪙</td>
    </tr>`;
  }).join("");

  // Wire click → profile
  tbody.querySelectorAll(".player-row").forEach(row => {
    row.addEventListener("click", () => openPlayerProfile(row.dataset.uid));
  });
}

// ── Player profile modal ──────────────────────────────
async function openPlayerProfile(uid) {
  openModal("جاري التحميل…", `<div class="loading-state"><div class="spinner"></div></div>`);

  try {
    const p = await fetchUser(uid);
    if (!p) { toast("لم يُعثر على اللاعب", "error"); closeModal(); return; }

    const level     = levelFromXp(p.xp);
    const wins      = p.matchWins    ?? 0;
    const losses    = p.matchLosses  ?? 0;
    const total     = p.matchTotal   ?? 0;
    const wr        = total > 0 ? Math.round((wins / total) * 100) : 0;
    const name      = p.displayName  ?? `لاعب ${uid.slice(0, 8)}`;
    const isGuest   = !p.photoURL && (!p.displayName || p.displayName === "زائر");
    const letterH   = p.hintLetterCredits ?? 0;
    const countH    = p.hintCountCredits  ?? 0;
    const tactic    = {
      extra_time:     p.tacticalExtraTime     ?? 0,
      time_pressure:  p.tacticalTimePressure  ?? 0,
      extra_question: p.tacticalExtraQuestion ?? 0,
      shield:         p.tacticalShield        ?? 0,
    };

    const body = getModalBody();
    document.getElementById("modal-title").textContent = name;

    body.innerHTML = `
      <div class="profile-header">
        <div class="profile-avatar-lg">${(name[0] ?? "؟").toUpperCase()}</div>
        <div class="profile-info">
          <div class="profile-name">${escHtml(name)}</div>
          <div class="profile-uid">${uid}</div>
          <div class="profile-badges">
            <span class="badge ${isGuest ? "badge-guest" : "badge-google"}">${isGuest ? "حساب ضيف" : "Google Account"}</span>
            <span class="level-badge">مستوى ${level}</span>
          </div>
        </div>
      </div>

      <div class="profile-stats-grid">
        <div class="pstat"><div class="pstat-val">${fmtNum(p.xp)}</div><div class="pstat-lbl">نقاط الخبرة</div></div>
        <div class="pstat"><div class="pstat-val">${fmtNum(p.coins)}</div><div class="pstat-lbl">العملات</div></div>
        <div class="pstat"><div class="pstat-val">${wins}</div><div class="pstat-lbl">فوز</div></div>
        <div class="pstat"><div class="pstat-val">${losses}</div><div class="pstat-lbl">خسارة</div></div>
        <div class="pstat"><div class="pstat-val">${total}</div><div class="pstat-lbl">إجمالي المباريات</div></div>
        <div class="pstat"><div class="pstat-val">${wr}%</div><div class="pstat-lbl">نسبة الفوز</div></div>
      </div>

      <div class="profile-section-title">التلميحات والأدوات</div>
      <div class="profile-inventory">
        <div class="inv-row"><span>تلميح حرف</span><span class="inv-val">${letterH}</span></div>
        <div class="inv-row"><span>تلميح عدد</span><span class="inv-val">${countH}</span></div>
        <div class="inv-row"><span>وقت إضافي</span><span class="inv-val">${tactic.extra_time}</span></div>
        <div class="inv-row"><span>ضغط الوقت</span><span class="inv-val">${tactic.time_pressure}</span></div>
        <div class="inv-row"><span>سؤال إضافي</span><span class="inv-val">${tactic.extra_question}</span></div>
        <div class="inv-row"><span>الدرع</span><span class="inv-val">${tactic.shield}</span></div>
      </div>
    `;
  } catch (e) {
    toast("خطأ في تحميل الملف: " + e.message, "error");
    closeModal();
  }
}

function escHtml(s) {
  return String(s ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}
