/* global React, Icon */
/* eslint-disable react/no-unknown-property */
/*
  Tactical Tools system for مَن أنا؟

  Exports (on window):
    TOOLS              : id → { name, en, glyph, accent, palette, blurb, effect }
    useTacticalTools() : state container — fire(), fireRemote(), effects, used flags
    ToolDock           : bottom-of-screen-ish strip of tool pills (with confirmation)
    ActiveEffectsBar   : compact chip showing any currently-active modifier
    ToolActivationOverlay : the cinematic — full-bleed, ~1.8s, mounted only while active

  Motion is GPU keyframes + animation-delay only — no JS animation loops.
*/
const { useState: useState_tt, useEffect: useEffect_tt, useRef: useRef_tt, useCallback: useCallback_tt, useMemo: useMemo_tt } = React;

/* ============================================================
   Tool catalog
============================================================ */
const TOOLS = {
  pressure: {
    id: "pressure",
    name: "ضغط الوقت",
    en: "Time Pressure",
    glyph: "timer",
    accent: "rose",
    // palette tuned to feel dangerous/urgent without breaking the warm system
    palette: {
      hue1: "oklch(0.72 0.18 25)",          // primary rose
      hue2: "oklch(0.55 0.20 20)",          // deeper terra-rose
      glow: "oklch(0.78 0.20 22 / .55)",
      ink:  "oklch(0.22 0.10 25)",
      mist: "oklch(0.30 0.10 25 / .55)",
    },
    blurb: "ضغط نفسي على الخصم",
    actorLineForMe: (n) => `${n} فرضت الضغط`,
    actorLineForThem: (n) => `${n} فرضت ضغط الوقت!`,
    effectLine: "دور الخصم القادم ١٠ ثوانٍ فقط للسؤال",
  },
  extra_q: {
    id: "extra_q",
    name: "سؤال إضافي",
    en: "Extra Question",
    glyph: "sparkle",
    accent: "amber",
    palette: {
      hue1: "oklch(0.82 0.16 75)",
      hue2: "oklch(0.62 0.18 55)",
      glow: "oklch(0.82 0.18 70 / .55)",
      ink:  "oklch(0.30 0.10 50)",
      mist: "oklch(0.35 0.10 55 / .50)",
    },
    blurb: "سؤالان متتاليان",
    actorLineForMe: (n) => `${n} حصل على سؤال إضافي`,
    actorLineForThem: (n) => `${n} حصلت على سؤال إضافي`,
    effectLine: "اطرح سؤالين قبل أن ينتقل الدور",
  },
  extra_t: {
    id: "extra_t",
    name: "وقت إضافي",
    en: "Extra Time",
    glyph: "plus",
    accent: "teal",
    palette: {
      hue1: "oklch(0.78 0.10 175)",
      hue2: "oklch(0.55 0.10 195)",
      glow: "oklch(0.80 0.12 180 / .55)",
      ink:  "oklch(0.25 0.06 180)",
      mist: "oklch(0.32 0.05 180 / .50)",
    },
    blurb: "+١٥ ثانية للدور الحالي",
    actorLineForMe: (n) => `${n} فعّل وقتًا إضافيًا`,
    actorLineForThem: (n) => `${n} فعّلت وقتًا إضافيًا`,
    effectLine: "أُضيفت ١٥ ثانية إلى دورك الحالي",
  },
};

/* ============================================================
   Hook — central state
   `pending` = effects queued waiting to be picked up by gameplay logic
   gameplay code calls consume(...) once it has applied them
============================================================ */
function useTacticalTools({ players }) {
  const [activation, setActivation] = useState_tt(null); // { tool, actor: 'me'|'them', key }
  const [usedByMe, setUsedByMe]     = useState_tt({});   // {pressure:true,...}
  const [usedByThem, setUsedByThem] = useState_tt({});
  // pending effects waiting for gameplay logic to absorb
  const [pending, setPending] = useState_tt({
    pressureOnNextOppTurn: false,  // when true, next opponent question turn → 10s
    extraQuestionForMe:    false,  // when true, my next send() does NOT switch turn
    extraQuestionForThem:  false,  // when true, opponent gets a second sim question
  });
  // active visible chip in top bar (display only, auto-clears on consume)
  const [chip, setChip] = useState_tt(null); // { tool, actor, text, expiresAt? }

  const armEffect = useCallback_tt((tool, actor) => {
    if (tool.id === "pressure") {
      if (actor === "me") {
        setPending(p => ({ ...p, pressureOnNextOppTurn: true }));
        setChip({ tool, actor, text: "الضغط مفعّل على الدور القادم", sticky: true });
      } else {
        // opponent pressed pressure on ME: my next turn will be capped to 10s
        setPending(p => ({ ...p, pressureOnMeNextTurn: true }));
        setChip({ tool, actor, text: "خصمك فرض الضغط على دورك القادم", sticky: true });
      }
    }
    if (tool.id === "extra_q") {
      if (actor === "me") setPending(p => ({ ...p, extraQuestionForMe: true }));
      else                setPending(p => ({ ...p, extraQuestionForThem: true }));
      setChip({ tool, actor, text: actor === "me" ? "لك سؤال إضافي هذا الدور" : "للخصم سؤال إضافي", sticky: true });
    }
    if (tool.id === "extra_t") {
      // gameplay reads `pending.extraTimeFor` and bumps timer immediately
      const dur = 15;
      setPending(p => ({ ...p, extraTimeFor: actor, extraTimeAmount: dur }));
      setChip({ tool, actor, text: `+${dur}s مُضافة`, autoHideMs: 3200 });
    }
  }, []);

  // Fire (from local action) — runs cinematic, then applies after overlay completes
  const fire = useCallback_tt((toolId, actor = "me") => {
    const tool = TOOLS[toolId]; if (!tool) return;
    if (actor === "me" && usedByMe[toolId]) return;
    if (actor === "them" && usedByThem[toolId]) return;
    setActivation({ tool, actor, key: Date.now() });
  }, [usedByMe, usedByThem]);

  // Same as fire — kept as a separate name so it's clear this is the
  // server-pushed path. In production a Firestore subscription would call this.
  const fireRemote = useCallback_tt((toolId, actor = "them") => {
    const tool = TOOLS[toolId]; if (!tool) return;
    setActivation({ tool, actor, key: Date.now() });
  }, []);

  const onActivationComplete = useCallback_tt(() => {
    if (!activation) return;
    const { tool, actor } = activation;
    armEffect(tool, actor);
    if (actor === "me")  setUsedByMe(u => ({ ...u, [tool.id]: true }));
    else                 setUsedByThem(u => ({ ...u, [tool.id]: true }));
    setActivation(null);
  }, [activation, armEffect]);

  const consumePending = useCallback_tt((patch) => {
    setPending(p => ({ ...p, ...patch }));
  }, []);

  const clearChip = useCallback_tt(() => setChip(null), []);

  return {
    fire, fireRemote,
    activation, onActivationComplete,
    usedByMe, usedByThem,
    pending, consumePending,
    chip, clearChip, setChip,
  };
}

/* ============================================================
   ToolDock — premium horizontal strip placed just under the top bar.
   Each item: round token with glyph, tiny Arabic label below, used-state x.
   Tap → confirmation popover with full title + blurb + إطلاق button.
============================================================ */
function ToolDock({ tools = ["pressure", "extra_q", "extra_t"], usedByMe, onFire, turn }) {
  const [confirming, setConfirming] = useState_tt(null);

  return (
    <div style={{
      padding: "0 14px 6px",
      display: "flex", justifyContent: "center",
      position: "relative",
    }}>
      <div style={{
        display: "flex", gap: 10,
        padding: "8px 10px",
        borderRadius: 18,
        background: "linear-gradient(180deg, oklch(0.96 0.025 78 / .9), oklch(0.92 0.035 75 / .9))",
        border: "1px solid oklch(0.75 0.06 60 / .45)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,.65), " +
          "0 8px 18px -10px oklch(0.50 0.08 50 / .35), " +
          "0 2px 4px oklch(0.50 0.06 50 / .12)",
        backdropFilter: "blur(6px)",
      }}>
        {tools.map(id => {
          const t = TOOLS[id];
          const used = !!usedByMe[id];
          return (
            <ToolToken
              key={id}
              tool={t}
              used={used}
              disabled={used}
              onTap={() => !used && setConfirming(id)}
            />
          );
        })}
      </div>

      {confirming && (
        <ConfirmPop
          tool={TOOLS[confirming]}
          turn={turn}
          onCancel={() => setConfirming(null)}
          onConfirm={() => { onFire(confirming); setConfirming(null); }}
        />
      )}
    </div>
  );
}

function ToolToken({ tool, used, disabled, onTap }) {
  const p = tool.palette;
  return (
    <button
      onClick={onTap}
      disabled={disabled}
      style={{
        position: "relative",
        width: 60, height: 64,
        padding: 0,
        borderRadius: 14,
        background: used
          ? "linear-gradient(180deg, oklch(0.86 0.02 70), oklch(0.78 0.02 65))"
          : `linear-gradient(180deg, ${p.hue1}, ${p.hue2})`,
        border: "1px solid " + (used ? "oklch(0.65 0.02 65 / .5)" : p.hue2),
        boxShadow: used
          ? "inset 0 1px 0 rgba(255,255,255,.4)"
          : `inset 0 1px 0 rgba(255,255,255,.4), inset 0 -2px 0 ${p.hue2}, 0 8px 14px -8px ${p.glow}`,
        opacity: used ? 0.55 : 1,
        transition: "transform .18s cubic-bezier(.2,.8,.2,1), filter .25s",
        cursor: disabled ? "default" : "pointer",
        display: "grid", placeItems: "center",
        filter: used ? "saturate(0.5)" : "none",
      }}
      onMouseDown={e => !disabled && (e.currentTarget.style.transform = "scale(.94)")}
      onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
      onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
    >
      {!used && (
        <span style={{
          position: "absolute", inset: -3, borderRadius: 16,
          background: `radial-gradient(closest-side, ${p.glow}, transparent 70%)`,
          opacity: .7, pointerEvents: "none",
          animation: "toolPulse 2.4s ease-in-out infinite",
          filter: "blur(2px)",
        }}/>
      )}
      <div style={{
        position: "relative", zIndex: 1,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
        color: "oklch(0.98 0.01 80)",
        textShadow: "0 1px 2px rgba(0,0,0,.25)",
      }}>
        <Icon name={tool.glyph} size={22} color="oklch(0.98 0.02 80)" stroke={2.2}/>
        <span style={{
          fontFamily: "var(--display)", fontWeight: 700, fontSize: 10,
          letterSpacing: "-.01em", lineHeight: 1,
        }}>{tool.name}</span>
      </div>
      {used && (
        <span style={{
          position: "absolute", top: 4, left: 4,
          fontSize: 9, fontFamily: "var(--mono)", fontWeight: 700,
          color: "var(--fg-3)", letterSpacing: ".05em",
        }}>—</span>
      )}
      <style>{`
        @keyframes toolPulse {
          0%, 100% { opacity: .35; transform: scale(1); }
          50%      { opacity: .75; transform: scale(1.04); }
        }
      `}</style>
    </button>
  );
}

function ConfirmPop({ tool, turn, onCancel, onConfirm }) {
  const p = tool.palette;
  const isExtraQ = tool.id === "extra_q";
  const isExtraT = tool.id === "extra_t";
  const canFire = isExtraQ || isExtraT ? turn === "me" : true;
  return (
    <div
      onClick={onCancel}
      style={{
        position: "absolute", inset: 0, zIndex: 40,
        background: "oklch(0.32 0.04 50 / .35)",
        backdropFilter: "blur(8px)",
        animation: "fadeIn .18s ease",
      }}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: "absolute", left: "50%", top: "calc(100% + 10px)",
          transform: "translateX(-50%)",
          width: 280,
          padding: 16,
          borderRadius: 18,
          background: "linear-gradient(180deg, oklch(0.98 0.02 80), oklch(0.94 0.03 76))",
          border: "1px solid oklch(0.78 0.06 60 / .5)",
          boxShadow: "0 24px 50px -12px oklch(0.40 0.08 45 / .45)",
          animation: "popIn .35s cubic-bezier(.2,.8,.2,1)",
        }}>
        <div className="row gap-3" style={{ alignItems: "flex-start" }}>
          <div style={{
            width: 46, height: 46, borderRadius: 12,
            background: `linear-gradient(180deg, ${p.hue1}, ${p.hue2})`,
            color: "white",
            display: "grid", placeItems: "center",
            boxShadow: `inset 0 1px 0 rgba(255,255,255,.4), 0 6px 12px -4px ${p.glow}`,
          }}>
            <Icon name={tool.glyph} size={22}/>
          </div>
          <div className="f-1" style={{ minWidth: 0 }}>
            <div className="h-display fw-7 text-md" style={{ color: p.ink }}>{tool.name}</div>
            <div className="text-xs muted" style={{ lineHeight: 1.45, marginTop: 2 }}>
              {tool.effectLine}
            </div>
          </div>
        </div>
        <div className="row gap-2 mt-3">
          <button className="btn btn-secondary f-1" onClick={onCancel}>تراجع</button>
          <button
            onClick={canFire ? onConfirm : undefined}
            className="btn f-1"
            disabled={!canFire}
            style={{
              background: canFire
                ? `linear-gradient(180deg, ${p.hue1}, ${p.hue2})`
                : "oklch(0.85 0.02 70)",
              color: canFire ? "oklch(0.99 0.01 80)" : "var(--fg-3)",
              boxShadow: canFire
                ? `inset 0 1px 0 rgba(255,255,255,.4), 0 8px 16px -6px ${p.glow}`
                : "none",
              fontWeight: 700,
            }}>
            {canFire ? "إطلاق" : "ليس دورك"}
          </button>
        </div>
        {/* tiny pointer up to the dock */}
        <div style={{
          position: "absolute", top: -6, left: "50%", transform: "translateX(-50%) rotate(45deg)",
          width: 12, height: 12,
          background: "oklch(0.98 0.02 80)",
          border: "1px solid oklch(0.78 0.06 60 / .5)",
          borderRight: "none", borderBottom: "none",
        }}/>
      </div>
      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-8px) scale(.96); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

/* ============================================================
   ActiveEffectsBar — slim chip docked under turn arc.
   Displays the currently-queued modifier, with a clean fade-in.
============================================================ */
function ActiveEffectsBar({ chip, onDismiss }) {
  useEffect_tt(() => {
    if (chip?.autoHideMs) {
      const t = setTimeout(onDismiss, chip.autoHideMs);
      return () => clearTimeout(t);
    }
  }, [chip, onDismiss]);
  if (!chip) return null;
  const p = chip.tool.palette;
  return (
    <div style={{
      position: "absolute", left: 0, right: 0, top: 92,
      display: "flex", justifyContent: "center",
      pointerEvents: "none",
      zIndex: 5,
    }}>
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        padding: "5px 12px 5px 8px",
        borderRadius: 999,
        background: `linear-gradient(180deg, ${p.hue1}, ${p.hue2})`,
        color: "oklch(0.99 0.01 80)",
        fontFamily: "var(--display)", fontWeight: 700, fontSize: 11,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,.4), 0 6px 14px -6px ${p.glow}`,
        animation: "chipIn .35s cubic-bezier(.2,.8,.2,1)",
        pointerEvents: "auto",
      }}>
        <span style={{
          width: 18, height: 18, borderRadius: "50%",
          background: "rgba(255,255,255,.18)",
          display: "grid", placeItems: "center",
        }}>
          <Icon name={chip.tool.glyph} size={11} stroke={2.4}/>
        </span>
        <span style={{ letterSpacing: "-.01em" }}>{chip.text}</span>
      </div>
      <style>{`
        @keyframes chipIn {
          from { opacity: 0; transform: translateY(-6px) scale(.92); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

/* ============================================================
   The CINEMATIC — full-bleed overlay that plays for ~1.8s.
   - Phase 1 (0→200ms): backdrop dims, accent vignette zooms in
   - Phase 2 (180→700ms): main motif scales in with overshoot
   - Phase 3 (650→1100ms): title + effect line cascade up
   - Phase 4 (1500→1850ms): exit fade

   Each tool gets its own motif component (CrackedClock / SplitGlyph / PlusFifteen).
============================================================ */
function ToolActivationOverlay({ activation, players, onComplete }) {
  const totalMs = 1900;
  useEffect_tt(() => {
    if (!activation) return;
    const t = setTimeout(onComplete, totalMs);
    return () => clearTimeout(t);
  }, [activation?.key, onComplete]);

  if (!activation) return null;
  const { tool, actor } = activation;
  const p = tool.palette;
  const name = actor === "me" ? players.player.name : players.opponent.name;
  const subtitle = actor === "me" ? tool.actorLineForMe(name) : tool.actorLineForThem(name);

  return (
    <div key={activation.key} style={{
      position: "absolute", inset: 0, zIndex: 80,
      overflow: "hidden",
      pointerEvents: "none",
      animation: `overlayLife ${totalMs}ms forwards`,
    }}>
      {/* Layer 1 — backdrop dim + blur */}
      <div style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(120% 100% at 50% 50%, ${p.mist}, oklch(0.18 0.04 40 / .68) 75%)`,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        animation: "backdropIn .35s ease both",
      }}/>

      {/* Layer 2 — accent vignette zoom */}
      <div style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(60% 50% at 50% 50%, ${p.glow}, transparent 70%)`,
        opacity: 0,
        animation: "vignetteIn .8s cubic-bezier(.2,.8,.2,1) .08s forwards",
        mixBlendMode: "screen",
      }}/>

      {/* Layer 3 — concentric pulse rings */}
      {tool.id === "extra_t" && <RippleRings color={p.hue1}/>}
      {tool.id === "pressure" && <ShockRings color={p.hue1}/>}

      {/* Layer 4 — ambient particles (motes / glass / sand) */}
      <ParticleField toolId={tool.id} palette={p}/>

      {/* Layer 5 — main motif */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "0 24px",
        gap: 14,
      }}>
        <div style={{
          opacity: 0,
          animation: "motifIn .55s cubic-bezier(.18,1.4,.4,1) .18s forwards",
        }}>
          {tool.id === "pressure" && <CrackedClock palette={p}/>}
          {tool.id === "extra_q"  && <SplitGlyph   palette={p}/>}
          {tool.id === "extra_t"  && <PlusFifteen  palette={p}/>}
        </div>

        {/* Title */}
        <div style={{
          opacity: 0,
          animation: "lineIn .5s cubic-bezier(.2,.8,.2,1) .68s forwards",
          textAlign: "center",
        }}>
          <div style={{
            fontFamily: "var(--display)", fontWeight: 800,
            fontSize: 30, lineHeight: 1.05,
            color: "oklch(0.99 0.02 80)",
            letterSpacing: "-.01em",
            textShadow: `0 2px 12px ${p.glow}, 0 0 28px ${p.glow}`,
          }}>
            {tool.name}
          </div>
          <div style={{
            fontFamily: "var(--mono)", fontSize: 10,
            color: "oklch(0.85 0.06 80 / .7)",
            letterSpacing: ".25em", marginTop: 4,
            textTransform: "uppercase",
          }}>
            {tool.en}
          </div>
        </div>

        {/* Effect line */}
        <div style={{
          opacity: 0,
          animation: "lineIn .5s cubic-bezier(.2,.8,.2,1) .82s forwards",
          fontFamily: "var(--body)", fontSize: 14,
          color: "oklch(0.95 0.04 75 / .85)",
          textAlign: "center", maxWidth: 280, lineHeight: 1.5,
        }}>
          {tool.effectLine}
        </div>

        {/* Actor line — who triggered it */}
        <div style={{
          opacity: 0,
          animation: "actorIn .5s cubic-bezier(.2,.8,.2,1) 1s forwards",
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "6px 12px",
          borderRadius: 999,
          background: "oklch(0.20 0.04 40 / .55)",
          border: `1px solid ${p.hue1}55`,
          color: "oklch(0.96 0.04 75 / .92)",
          fontFamily: "var(--display)", fontWeight: 700, fontSize: 12,
          backdropFilter: "blur(6px)",
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: "50%",
            background: p.hue1,
            boxShadow: `0 0 8px ${p.hue1}`,
          }}/>
          {subtitle}
        </div>
      </div>

      <style>{`
        @keyframes overlayLife {
          0%   { opacity: 0; }
          8%   { opacity: 1; }
          82%  { opacity: 1; }
          100% { opacity: 0; pointer-events: none; }
        }
        @keyframes backdropIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes vignetteIn {
          0%   { opacity: 0; transform: scale(0.4); }
          60%  { opacity: 0.95; transform: scale(1.08); }
          100% { opacity: 0.7; transform: scale(1); }
        }
        @keyframes motifIn {
          0%   { opacity: 0; transform: scale(0.35) rotate(-6deg); filter: blur(8px); }
          70%  { opacity: 1; transform: scale(1.06) rotate(1deg); filter: blur(0); }
          100% { opacity: 1; transform: scale(1) rotate(0); }
        }
        @keyframes lineIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes actorIn {
          from { opacity: 0; transform: translateY(6px) scale(.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

/* ============================================================
   Tool MOTIFS
============================================================ */
function CrackedClock({ palette: p }) {
  return (
    <div style={{
      position: "relative",
      width: 220, height: 220,
      animation: "clockShake .12s cubic-bezier(.5,1,.5,1) .55s 8",
    }}>
      {/* Outer glow ring */}
      <div style={{
        position: "absolute", inset: -20, borderRadius: "50%",
        background: `radial-gradient(closest-side, ${p.glow}, transparent 70%)`,
        filter: "blur(6px)",
      }}/>
      {/* Face */}
      <svg viewBox="0 0 200 200" width="220" height="220" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="face-tp" cx="50%" cy="38%" r="60%">
            <stop offset="0" stopColor="oklch(0.96 0.05 30)"/>
            <stop offset="1" stopColor="oklch(0.72 0.10 30)"/>
          </radialGradient>
          <linearGradient id="ring-tp" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={p.hue1}/>
            <stop offset="1" stopColor={p.hue2}/>
          </linearGradient>
        </defs>
        {/* outer bezel */}
        <circle cx="100" cy="100" r="92" fill="url(#ring-tp)"/>
        <circle cx="100" cy="100" r="80" fill="url(#face-tp)"/>
        {/* tick marks */}
        {Array.from({ length: 12 }).map((_, i) => {
          const ang = (i * 30 - 90) * Math.PI / 180;
          const x1 = 100 + Math.cos(ang) * 70;
          const y1 = 100 + Math.sin(ang) * 70;
          const x2 = 100 + Math.cos(ang) * 76;
          const y2 = 100 + Math.sin(ang) * 76;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={p.ink} strokeWidth={i % 3 === 0 ? 3 : 1.5} strokeLinecap="round"/>;
        })}
        {/* cracks (drawn over face) */}
        <g style={{
          opacity: 0,
          animation: "crackIn .45s cubic-bezier(.2,1.6,.4,1) .55s forwards",
          transformOrigin: "100px 100px",
        }}>
          <path d="M100 100 L60 35 L72 50 L52 38 L44 60 L70 70 L42 92"
                stroke={p.ink} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity=".75"/>
          <path d="M100 100 L150 60 L142 78 L168 70 L160 92 L138 88"
                stroke={p.ink} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity=".55"/>
          <path d="M100 100 L130 158 L120 142 L138 152 L122 168"
                stroke={p.ink} strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity=".5"/>
        </g>
        {/* spinning hands that snap */}
        <g style={{
          transformOrigin: "100px 100px",
          animation: "handSpin 1.1s cubic-bezier(.2,.7,.3,1) .2s forwards",
        }}>
          <line x1="100" y1="100" x2="100" y2="46" stroke={p.ink} strokeWidth="4" strokeLinecap="round"/>
        </g>
        <g style={{
          transformOrigin: "100px 100px",
          animation: "handSpin2 1.1s cubic-bezier(.2,.7,.3,1) .2s forwards",
        }}>
          <line x1="100" y1="100" x2="100" y2="64" stroke={p.ink} strokeWidth="3" strokeLinecap="round" opacity=".7"/>
        </g>
        <circle cx="100" cy="100" r="5" fill={p.ink}/>
      </svg>
      {/* "10" stamp */}
      <div style={{
        position: "absolute", inset: 0,
        display: "grid", placeItems: "center",
        opacity: 0,
        animation: "tenStamp .55s cubic-bezier(.2,1.5,.4,1) 1s forwards",
      }}>
        <div style={{
          fontFamily: "var(--mono)", fontWeight: 800,
          fontSize: 72, lineHeight: 1, color: "oklch(0.99 0.02 80)",
          textShadow: `0 4px 24px ${p.hue1}, 0 0 40px ${p.glow}`,
          letterSpacing: "-.04em",
        }}>10s</div>
      </div>

      <style>{`
        @keyframes clockShake {
          0%, 100% { transform: translate(0,0) rotate(0); }
          25% { transform: translate(-2px, 1px) rotate(-.5deg); }
          75% { transform: translate(2px, -1px) rotate(.5deg); }
        }
        @keyframes handSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(900deg); }
        }
        @keyframes handSpin2 {
          from { transform: rotate(0deg); }
          to   { transform: rotate(540deg); }
        }
        @keyframes crackIn {
          from { opacity: 0; transform: scale(0.5); }
          to   { opacity: .8; transform: scale(1); }
        }
        @keyframes tenStamp {
          0% { opacity: 0; transform: scale(2.4) rotate(-6deg); filter: blur(8px); }
          60% { opacity: 1; transform: scale(.92) rotate(2deg); filter: blur(0); }
          100% { opacity: 1; transform: scale(1) rotate(0); }
        }
      `}</style>
    </div>
  );
}

function SplitGlyph({ palette: p }) {
  return (
    <div style={{ position: "relative", width: 240, height: 200 }}>
      {/* halo */}
      <div style={{
        position: "absolute", inset: -10, borderRadius: 28,
        background: `radial-gradient(closest-side, ${p.glow}, transparent 70%)`,
        filter: "blur(8px)",
      }}/>
      {/* Card A — slides slightly left */}
      <CardGlyph
        style={{
          position: "absolute", left: 30, top: 8,
          animation: "qSplitA .9s cubic-bezier(.2,.9,.3,1) .15s forwards",
        }}
        palette={p}
      />
      {/* Card B — emerges from center, slides right */}
      <CardGlyph
        style={{
          position: "absolute", left: 30, top: 8,
          opacity: 0,
          animation: "qSplitB .9s cubic-bezier(.2,.9,.3,1) .25s forwards",
        }}
        palette={p}
      />
      {/* x2 stamp */}
      <div style={{
        position: "absolute", right: -6, top: -10,
        padding: "6px 12px",
        borderRadius: 12,
        background: `linear-gradient(180deg, ${p.hue1}, ${p.hue2})`,
        color: "oklch(0.99 0.02 80)",
        fontFamily: "var(--display)", fontWeight: 800, fontSize: 26,
        letterSpacing: "-.05em",
        boxShadow: `inset 0 1px 0 rgba(255,255,255,.4), 0 8px 18px -4px ${p.glow}`,
        transform: "rotate(8deg) scale(0)",
        animation: "x2Stamp .5s cubic-bezier(.2,1.6,.4,1) .85s forwards",
      }}>×2</div>

      <style>{`
        @keyframes qSplitA {
          0%   { transform: translateX(60px) rotate(0) scale(.9); opacity: 0; }
          50%  { transform: translateX(-2px) rotate(-4deg) scale(1.02); opacity: 1; }
          100% { transform: translateX(-22px) rotate(-7deg) scale(1); opacity: 1; }
        }
        @keyframes qSplitB {
          0%   { transform: translateX(0) rotate(0) scale(.9); opacity: 0; }
          40%  { opacity: 1; }
          100% { transform: translateX(64px) rotate(7deg) scale(1); opacity: 1; }
        }
        @keyframes x2Stamp {
          0%   { transform: rotate(20deg) scale(0); }
          70%  { transform: rotate(4deg) scale(1.15); }
          100% { transform: rotate(8deg) scale(1); }
        }
      `}</style>
    </div>
  );
}

function CardGlyph({ style, palette: p }) {
  return (
    <div style={{
      width: 130, height: 180,
      borderRadius: 14,
      background:
        `linear-gradient(180deg, oklch(0.96 0.06 80), oklch(0.88 0.10 70))`,
      border: `1px solid ${p.hue2}`,
      boxShadow: `inset 0 1px 0 rgba(255,255,255,.5), 0 18px 30px -10px ${p.glow}`,
      display: "grid", placeItems: "center",
      ...style,
    }}>
      <div style={{
        fontFamily: "var(--display)", fontWeight: 800,
        fontSize: 78, color: p.ink, lineHeight: 1,
        textShadow: "0 2px 0 rgba(255,255,255,.4)",
      }}>؟</div>
    </div>
  );
}

function PlusFifteen({ palette: p }) {
  return (
    <div style={{
      position: "relative", width: 260, height: 200,
      display: "grid", placeItems: "center",
    }}>
      <div style={{
        position: "absolute", inset: -20, borderRadius: "50%",
        background: `radial-gradient(closest-side, ${p.glow}, transparent 70%)`,
        filter: "blur(10px)",
      }}/>
      {/* Hourglass — small */}
      <svg viewBox="0 0 80 100" width="80" height="100" style={{
        position: "absolute", left: 16, top: 32,
        opacity: .85,
        animation: "hourFlip 1.2s cubic-bezier(.2,.8,.3,1) .3s forwards",
        transformOrigin: "40px 50px",
      }}>
        <defs>
          <linearGradient id="hg" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={p.hue1}/>
            <stop offset="1" stopColor={p.hue2}/>
          </linearGradient>
        </defs>
        <path d="M16 8 H64 V20 L44 50 L64 80 V92 H16 V80 L36 50 L16 20 Z"
              fill="oklch(0.98 0.02 80 / .15)" stroke="url(#hg)" strokeWidth="2.5"/>
        <path d="M20 12 H60 L42 48 Z" fill={p.hue1} opacity=".6"/>
        <path d="M22 88 H58 L40 56 Z" fill={p.hue1} opacity=".25"/>
      </svg>
      {/* +15 BIG */}
      <div style={{
        fontFamily: "var(--display)", fontWeight: 800,
        fontSize: 130, lineHeight: 1,
        color: "oklch(0.99 0.02 80)",
        textShadow: `0 6px 30px ${p.glow}, 0 0 50px ${p.glow}`,
        letterSpacing: "-.05em",
        position: "relative",
        transform: "translateX(20px)",
      }}>
        +15
        <span style={{
          fontFamily: "var(--mono)", fontWeight: 700, fontSize: 20,
          color: "oklch(0.95 0.04 80 / .8)",
          position: "absolute", right: -10, bottom: 18,
          letterSpacing: "-.02em",
        }}>s</span>
      </div>
    </div>
  );
}

/* ============================================================
   Particles + rings
============================================================ */
function RippleRings({ color }) {
  return (
    <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", pointerEvents: "none" }}>
      {[0, .25, .5].map(d => (
        <div key={d} style={{
          position: "absolute",
          width: 80, height: 80, borderRadius: "50%",
          border: `2px solid ${color}`,
          opacity: 0,
          animation: `ringPop 1.6s cubic-bezier(.2,.7,.3,1) ${0.25 + d}s forwards`,
        }}/>
      ))}
      <style>{`
        @keyframes ringPop {
          0%   { opacity: .8; transform: scale(.3); border-width: 3px; }
          100% { opacity: 0; transform: scale(5); border-width: .5px; }
        }
      `}</style>
    </div>
  );
}

function ShockRings({ color }) {
  return (
    <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", pointerEvents: "none" }}>
      {[0, .12, .24].map((d, i) => (
        <div key={i} style={{
          position: "absolute",
          width: 80, height: 80, borderRadius: "50%",
          border: `2px solid ${color}`,
          opacity: 0,
          animation: `shockPop 1.2s cubic-bezier(.1,.7,.3,1) ${0.18 + d}s forwards`,
          mixBlendMode: "screen",
        }}/>
      ))}
      <style>{`
        @keyframes shockPop {
          0%   { opacity: 1; transform: scale(.2); border-width: 4px; }
          100% { opacity: 0; transform: scale(7); border-width: .5px; }
        }
      `}</style>
    </div>
  );
}

function ParticleField({ toolId, palette: p }) {
  const items = useMemo_tt(() => {
    const count = toolId === "pressure" ? 14 : toolId === "extra_t" ? 12 : 16;
    return Array.from({ length: count }, (_, i) => ({
      i,
      angle: (i / count) * 360 + Math.random() * 20,
      dist: 120 + Math.random() * 120,
      size: 4 + Math.random() * 6,
      delay: 0.25 + Math.random() * 0.5,
      dur: 1.0 + Math.random() * 0.6,
      rot: Math.random() * 360,
    }));
  }, [toolId]);
  return (
    <div style={{
      position: "absolute", inset: 0, pointerEvents: "none",
      display: "grid", placeItems: "center",
    }}>
      {items.map(it => {
        const tx = Math.cos(it.angle * Math.PI / 180) * it.dist;
        const ty = Math.sin(it.angle * Math.PI / 180) * it.dist;
        return (
          <span key={it.i} style={{
            position: "absolute",
            width: it.size, height: it.size,
            borderRadius: toolId === "pressure" ? 2 : "50%",
            background: toolId === "extra_q"
              ? `radial-gradient(circle, oklch(0.95 0.14 80), ${p.hue1})`
              : p.hue1,
            boxShadow: `0 0 8px ${p.glow}`,
            opacity: 0,
            ["--tx"]: tx + "px",
            ["--ty"]: ty + "px",
            ["--rot"]: it.rot + "deg",
            animation: `particleBurst ${it.dur}s cubic-bezier(.15,.85,.3,1) ${it.delay}s forwards`,
          }}/>
        );
      })}
      <style>{`
        @keyframes particleBurst {
          0%   { opacity: 0; transform: translate(0,0) scale(.4) rotate(0); }
          15%  { opacity: 1; }
          100% { opacity: 0; transform: translate(var(--tx), var(--ty)) scale(0.6) rotate(var(--rot)); }
        }
      `}</style>
    </div>
  );
}

/* ============================================================
   Floating "+15s" pop on the live timer (used when extra_t lands)
============================================================ */
function TimerBumpPop({ amount = 15, color = "oklch(0.78 0.10 175)", onDone }) {
  useEffect_tt(() => {
    const t = setTimeout(onDone, 1100);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div style={{
      position: "absolute", left: "50%", top: "50%",
      transform: "translate(-50%, -50%)",
      fontFamily: "var(--mono)", fontWeight: 800, fontSize: 18,
      color, textShadow: `0 0 10px ${color}`,
      pointerEvents: "none",
      animation: "timerBump 1.05s cubic-bezier(.2,.7,.3,1) forwards",
      zIndex: 6,
    }}>
      +{amount}s
      <style>{`
        @keyframes timerBump {
          0%   { opacity: 0; transform: translate(-50%, -10%) scale(.6); }
          25%  { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
          100% { opacity: 0; transform: translate(-50%, -110%) scale(1); }
        }
      `}</style>
    </div>
  );
}

/* expose */
Object.assign(window, {
  TOOLS,
  useTacticalTools,
  ToolDock,
  ActiveEffectsBar,
  ToolActivationOverlay,
  TimerBumpPop,
});
