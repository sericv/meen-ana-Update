"use client";

import { useEffect, useRef, useState } from "react";

/* ============================================================
   MatchTransition — "العتبة والبطاقة"

   ACT I  · العتبة ~0–940ms
     Warm veil blooms. Two gold rules converge — opponent name
     from top, player name from bottom — meeting at a bright seam.

   ACT II · البطاقة ~940–2160ms
     A face-down card is dealt from the seam, flips up to reveal
     the ؟ back. One shimmer sweep. Mystery line fades in.
     Card tips toward viewer and dissolves into gameplay.

   Props:
     player   — { name: string }
     opponent — { name: string }
     subtitle — string (default: "تبدأ المباراة")
     onDone   — () => void  (called when transition finishes or is skipped)
============================================================ */

export type MatchTransitionPlayer = { name: string };

type Props = {
  player: MatchTransitionPlayer;
  opponent: MatchTransitionPlayer;
  subtitle?: string;
  onDone: () => void;
};

export function MatchTransition({ player, opponent, subtitle = "تبدأ المباراة", onDone }: Props) {
  const [step, setStep] = useState(0);
  const reducedRef = useRef(
    typeof window !== "undefined" &&
    window.matchMedia != null &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const skippedRef = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    playDealCue(reducedRef.current);

    const timeline: Array<[number, number]> = reducedRef.current
      ? [[3, 60], [4, 540], [99, 840]]
      : [[1, 560], [2, 940], [3, 1540], [4, 2160], [99, 2520]];

    const timers = timeline.map(([next, at]) =>
      setTimeout(() => {
        if (skippedRef.current) return;
        if (next === 99) { onDoneRef.current(); }
        else setStep(next);
      }, at),
    );
    return () => timers.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const skip = () => {
    if (skippedRef.current) return;
    skippedRef.current = true;
    onDoneRef.current();
  };

  return (
    <div
      className="mt2-overlay"
      data-step={step}
      data-reduced={reducedRef.current ? "true" : "false"}
      onClick={skip}
      role="img"
      aria-label="بدء المباراة"
    >
      <div className="mt2-veil" />
      <div className="mt2-pool" />

      {/* ultralight motes */}
      <div className="mt2-motes" aria-hidden>
        {Array.from({ length: 6 }).map((_, i) => (
          <span
            key={i}
            className="mt2-mote"
            style={{
              left: (12 + i * 15) + "%",
              animationDelay: -(i * 1.1) + "s",
              animationDuration: (6.5 + (i % 3)) + "s",
            }}
          />
        ))}
      </div>

      {/* ACT I — threshold */}
      <div className="mt2-threshold">
        <div className="mt2-name mt2-name-top">
          <span className="mt2-name-text">{opponent?.name || "خصمك"}</span>
          <span className="mt2-name-rule" />
        </div>

        <div className="mt2-seam"><span className="mt2-seam-core" /></div>

        <div className="mt2-name mt2-name-bot">
          <span className="mt2-name-rule" />
          <span className="mt2-name-text">{player?.name || "أنت"}</span>
        </div>
      </div>

      {/* ACT II — hidden card */}
      <div className="mt2-cardwrap">
        <div className="mt2-card mt2-gcard mt2-gcard-back">
          <span className="mt2-card-kicker">مَن أنا</span>
          <span className="mt2-card-q">؟</span>
          <span className="mt2-card-shimmer" />
        </div>
        <div className="mt2-line">
          <div className="mt2-line-main">مَن خلف البطاقة؟</div>
          <div className="mt2-line-kicker">{subtitle}</div>
        </div>
      </div>

      <div className="mt2-skip">اضغط للتخطّي</div>

      <MatchTransitionStyles />
    </div>
  );
}

/* ============================================================
   Audio — soft "deal" cue, Web Audio, no assets
============================================================ */
let _mtAc: AudioContext | null = null;

function getMtAc(): AudioContext | null {
  if (_mtAc) return _mtAc;
  const AC =
    typeof window !== "undefined"
      ? (window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)
      : undefined;
  if (!AC) return null;
  _mtAc = new AC();
  return _mtAc;
}

function mtTone(
  ctx: AudioContext,
  freq: number,
  when: number,
  dur: number,
  gain: number,
  type: OscillatorType = "sine",
) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, when);
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(gain, when + Math.min(0.25, dur * 0.3));
  g.gain.exponentialRampToValueAtTime(0.0006, when + dur);
  o.connect(g);
  g.connect(ctx.destination);
  o.start(when);
  o.stop(when + dur + 0.05);
}

function playDealCue(reduced: boolean) {
  try {
    const ctx = getMtAc();
    if (!ctx) return;
    if (ctx.state === "suspended") void ctx.resume();
    const t = ctx.currentTime;
    mtTone(ctx, 174.61, t + 0.00, reduced ? 0.7 : 2.1, 0.05, "sine");
    if (reduced) return;
    mtTone(ctx, 392.00, t + 0.94, 0.35, 0.06, "triangle");
    mtTone(ctx, 587.33, t + 1.10, 1.2,  0.06, "sine");
    mtTone(ctx, 880.00, t + 1.34, 0.9,  0.035, "sine");
  } catch { /* no-op */ }
}

/* ============================================================
   Inline styles — scoped via mt2- prefix, no globals polluted
============================================================ */
function MatchTransitionStyles() {
  return (
    <style>{`
      .mt2-overlay {
        position: absolute; inset: 0; z-index: 100;
        overflow: hidden; isolation: isolate;
        font-family: var(--display);
        direction: rtl; cursor: pointer;
      }

      .mt2-veil {
        position: absolute; inset: 0;
        background:
          radial-gradient(140% 95% at 50% 46%, oklch(0.97 0.04 78), oklch(0.92 0.07 68) 52%, oklch(0.83 0.10 56) 100%),
          linear-gradient(180deg, oklch(0.96 0.04 78), oklch(0.87 0.08 58));
        opacity: 0;
        animation: mt2VeilIn .42s ease forwards;
      }
      @keyframes mt2VeilIn { from { opacity: 0; } to { opacity: 1; } }

      .mt2-pool {
        position: absolute; left: 50%; top: 50%;
        width: 360px; height: 360px; transform: translate(-50%, -46%);
        background: radial-gradient(closest-side, oklch(0.96 0.07 80 / .8), transparent 70%);
        opacity: 0;
        animation: mt2PoolIn .8s ease .5s forwards;
        pointer-events: none;
      }
      @keyframes mt2PoolIn { from { opacity: 0; } to { opacity: 1; } }

      .mt2-motes { position: absolute; inset: 0; pointer-events: none; }
      .mt2-mote {
        position: absolute; bottom: -14px;
        width: 4px; height: 4px; border-radius: 50%;
        background: oklch(0.92 0.13 80);
        box-shadow: 0 0 7px 1px oklch(0.85 0.18 70 / .7);
        opacity: 0;
        animation-name: mt2Mote;
        animation-timing-function: linear;
        animation-iteration-count: infinite;
      }
      @keyframes mt2Mote {
        0%   { opacity: 0; transform: translateY(0) scale(.4); }
        18%  { opacity: .6; }
        82%  { opacity: .3; }
        100% { opacity: 0; transform: translateY(-92vh) scale(1); }
      }

      /* ACT I — threshold */
      .mt2-threshold {
        position: absolute; inset: 0;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        gap: 0; pointer-events: none;
      }
      .mt2-name {
        display: flex; align-items: center; gap: 12px;
        position: absolute; left: 0; right: 0;
        justify-content: center; opacity: 0;
      }
      .mt2-name-text {
        font-family: var(--display); font-weight: 700; font-size: 21px;
        letter-spacing: -.01em;
        background: linear-gradient(180deg, oklch(0.50 0.15 52), oklch(0.36 0.16 40));
        -webkit-background-clip: text; background-clip: text; color: transparent;
        white-space: nowrap;
      }
      .mt2-name-rule {
        display: block; width: 46px; height: 1px;
        background: linear-gradient(90deg, transparent, oklch(0.62 0.14 55 / .7), transparent);
      }
      .mt2-name-top { top: calc(50% - 86px); transform: translateY(-30px); }
      .mt2-name-bot { top: calc(50% + 66px); transform: translateY(30px); }

      .mt2-overlay[data-step="0"] .mt2-name-top,
      .mt2-overlay[data-step="1"] .mt2-name-top {
        animation: mt2NameTop .7s cubic-bezier(.2,.85,.2,1) .12s forwards;
      }
      .mt2-overlay[data-step="0"] .mt2-name-bot,
      .mt2-overlay[data-step="1"] .mt2-name-bot {
        animation: mt2NameBot .7s cubic-bezier(.2,.85,.2,1) .12s forwards;
      }
      @keyframes mt2NameTop {
        from { opacity: 0; transform: translateY(-30px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes mt2NameBot {
        from { opacity: 0; transform: translateY(30px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .mt2-overlay[data-step="2"] .mt2-name,
      .mt2-overlay[data-step="3"] .mt2-name,
      .mt2-overlay[data-step="4"] .mt2-name {
        animation: mt2NameOut .4s ease forwards;
      }
      @keyframes mt2NameOut { to { opacity: 0; } }

      .mt2-seam {
        position: absolute; left: 50%; top: 50%;
        width: 220px; height: 2px; transform: translate(-50%, -50%) scaleX(0);
        transform-origin: center;
        background: linear-gradient(90deg, transparent, oklch(0.80 0.14 78 / .9), transparent);
        opacity: 0;
        animation: mt2SeamDraw .6s cubic-bezier(.2,.8,.2,1) .18s forwards;
      }
      .mt2-seam-core {
        position: absolute; left: 50%; top: 50%;
        width: 70px; height: 2px; transform: translate(-50%, -50%);
        background: oklch(0.97 0.10 88);
        border-radius: 2px; opacity: 0;
      }
      @keyframes mt2SeamDraw {
        from { opacity: 0; transform: translate(-50%, -50%) scaleX(0); }
        to   { opacity: 1; transform: translate(-50%, -50%) scaleX(1); }
      }
      .mt2-overlay[data-step="1"] .mt2-seam-core {
        animation: mt2SeamPulse .55s ease forwards;
      }
      @keyframes mt2SeamPulse {
        0%   { opacity: 0; transform: translate(-50%, -50%) scaleX(.5); }
        45%  { opacity: 1; transform: translate(-50%, -50%) scaleX(1.5); }
        100% { opacity: 0; transform: translate(-50%, -50%) scaleX(2.4); }
      }
      .mt2-overlay[data-step="2"] .mt2-seam,
      .mt2-overlay[data-step="3"] .mt2-seam,
      .mt2-overlay[data-step="4"] .mt2-seam {
        animation: mt2SeamOut .35s ease forwards;
      }
      @keyframes mt2SeamOut { to { opacity: 0; } }

      /* ACT II — card */
      .mt2-cardwrap {
        position: absolute; left: 50%; top: 50%;
        transform: translate(-50%, -50%);
        display: flex; flex-direction: column; align-items: center; gap: 18px;
        pointer-events: none;
      }
      .mt2-card {
        position: relative;
        width: 152px; height: 210px;
        border-radius: 18px;
        backface-visibility: hidden;
        transform-style: preserve-3d;
        opacity: 0;
        transform: translateY(70px) scale(.18) rotateY(-96deg);
      }

      /* standalone card face styles (not scoped to .shell-screen) */
      .mt2-gcard {
        border-radius: 18px;
        box-shadow: 0 8px 28px -6px rgba(120,60,10,0.30), 0 2px 6px -2px rgba(0,0,0,0.14),
                    inset 0 1px 0 rgba(255,255,255,0.55);
        border: 1px solid oklch(0.82 0.06 68 / 0.42);
        outline: 1px solid rgba(255,255,255,0.65);
        overflow: hidden;
      }
      .mt2-gcard-back {
        background:
          repeating-linear-gradient(45deg, oklch(0.5 0.13 35) 0 14px, oklch(0.44 0.13 32) 14px 28px),
          oklch(0.46 0.13 35);
        color: oklch(0.94 0.05 80);
      }

      .mt2-card-kicker {
        position: absolute; top: 12px; left: 0; right: 0;
        text-align: center;
        font-family: var(--display); font-size: 11px; letter-spacing: .15em;
        color: oklch(0.82 0.13 75 / .7);
      }
      .mt2-card-q {
        position: absolute; inset: 0;
        display: grid; place-items: center;
        font-family: var(--display); font-weight: 800; font-size: 78px;
        color: oklch(0.88 0.13 78 / .9);
        text-shadow: 0 2px 10px rgba(0,0,0,.35), 0 0 22px oklch(0.80 0.18 68 / .45);
      }
      .mt2-card-shimmer {
        position: absolute; inset: 0; border-radius: inherit; overflow: hidden;
        pointer-events: none;
      }
      .mt2-card-shimmer::after {
        content: ""; position: absolute; top: -20%; bottom: -20%; width: 46%;
        left: -60%;
        background: linear-gradient(105deg, transparent 30%, oklch(0.98 0.10 88 / .6) 50%, transparent 70%);
        mix-blend-mode: screen; opacity: 0;
      }

      .mt2-overlay[data-step="2"] .mt2-card,
      .mt2-overlay[data-step="3"] .mt2-card,
      .mt2-overlay[data-step="4"] .mt2-card {
        animation: mt2Deal .62s cubic-bezier(.2,.9,.25,1) forwards;
      }
      @keyframes mt2Deal {
        0%   { opacity: 0; transform: translateY(70px) scale(.18) rotateY(-96deg); }
        55%  { opacity: 1; transform: translateY(-12px) scale(1.04) rotateY(9deg); }
        100% { opacity: 1; transform: translateY(0) scale(1) rotateY(0deg); }
      }
      .mt2-overlay[data-step="3"] .mt2-card {
        animation:
          mt2Deal .62s cubic-bezier(.2,.9,.25,1) forwards,
          mt2Breathe 3.6s ease-in-out .62s infinite;
      }
      @keyframes mt2Breathe {
        0%, 100% { transform: translateY(0) scale(1) rotateY(0deg); }
        50%      { transform: translateY(-5px) scale(1) rotateY(0deg); }
      }
      .mt2-overlay[data-step="3"] .mt2-card-shimmer::after {
        animation: mt2Shimmer .9s ease-out .05s 1;
      }
      @keyframes mt2Shimmer {
        0%   { transform: translateX(0); opacity: 0; }
        15%  { opacity: .9; }
        100% { transform: translateX(360%); opacity: 0; }
      }

      /* mystery line */
      .mt2-line {
        text-align: center;
        display: flex; flex-direction: column; align-items: center; gap: 5px;
        opacity: 0; transform: translateY(8px);
      }
      .mt2-line-main {
        font-family: var(--display); font-weight: 700; font-size: 18px;
        white-space: nowrap;
        background: linear-gradient(180deg, oklch(0.50 0.15 52), oklch(0.36 0.16 40));
        -webkit-background-clip: text; background-clip: text; color: transparent;
      }
      .mt2-line-kicker {
        font-family: var(--body); font-weight: 500; font-size: 12.5px;
        color: oklch(0.46 0.07 50); letter-spacing: .01em; white-space: nowrap;
      }
      .mt2-overlay[data-step="3"] .mt2-line,
      .mt2-overlay[data-step="4"] .mt2-line {
        animation: mt2LineIn .5s cubic-bezier(.2,.85,.2,1) .18s forwards;
      }
      @keyframes mt2LineIn {
        from { opacity: 0; transform: translateY(8px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      /* dissolve */
      .mt2-overlay[data-step="4"] .mt2-cardwrap {
        animation: mt2Dissolve .36s cubic-bezier(.4,0,.7,.5) .04s forwards;
      }
      @keyframes mt2Dissolve {
        to { opacity: 0; transform: translate(-50%, -58%) scale(1.07) rotateX(14deg); }
      }
      .mt2-overlay[data-step="4"] .mt2-veil,
      .mt2-overlay[data-step="4"] .mt2-pool,
      .mt2-overlay[data-step="4"] .mt2-motes {
        animation: mt2FadeOut .4s ease forwards;
      }
      @keyframes mt2FadeOut { to { opacity: 0; } }

      /* skip hint */
      .mt2-skip {
        position: absolute; bottom: 22px; left: 0; right: 0;
        text-align: center;
        font-family: var(--mono); font-size: 10px; letter-spacing: .18em;
        text-transform: uppercase; color: oklch(0.48 0.06 50 / .8);
        opacity: 0;
        animation: mt2SkipIn .5s ease 1.1s forwards;
      }
      @keyframes mt2SkipIn { to { opacity: .75; } }
      .mt2-overlay[data-step="4"] .mt2-skip { opacity: 0; }

      /* reduced motion */
      .mt2-overlay[data-reduced="true"] .mt2-threshold,
      .mt2-overlay[data-reduced="true"] .mt2-motes,
      .mt2-overlay[data-reduced="true"] .mt2-skip { display: none; }
      .mt2-overlay[data-reduced="true"] .mt2-card {
        animation: none !important; opacity: 1; transform: none;
      }
      .mt2-overlay[data-reduced="true"] .mt2-card-shimmer::after { display: none; }
      .mt2-overlay[data-reduced="true"] .mt2-line {
        animation: none !important; opacity: 1; transform: none;
      }
      .mt2-overlay[data-reduced="true"][data-step="4"] .mt2-cardwrap {
        animation: mt2FadeOut .36s ease forwards;
      }
    `}</style>
  );
}
