"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

const CARD_PLACEHOLDER = "/cards/_placeholder.svg";

export type GuessRevealOutcome = "correct" | "wrong-guess" | "neutral";

export type GuessRevealProps = {
  /** "أصبتَ!" verdict — your own card was guessed correctly (by you, ending the match in your favor). */
  won: boolean;
  /**
   * Fine-grained outcome:
   *  - "correct"    → win stamp «أصبتَ!»
   *  - "wrong-guess" → loss stamp «أخطأتَ» + guess/actual comparison (you ran out of guesses)
   *  - "neutral"    → loss without a verdict stamp, just «هذه كانت بطاقتك»
   */
  outcome: GuessRevealOutcome;
  /** What the player guessed (only meaningful for "correct" / "wrong-guess"). */
  guess?: string;
  /** The player's own true identity (revealed). */
  actual: string;
  /** Arabic category label for the revealed card. */
  category?: string;
  /** Card image for the revealed identity. */
  imageUrl?: string | null;
  subtitle?: string;
  onDone?: () => void;
};

/* ============================================================
   GuessReveal — «لحظة الكشف» (The Moment of Reveal)

   Plays AFTER a match ends and BEFORE the result screen, for
   every player. Reveals the player's own hidden card and adapts
   its palette + verdict to how the match ended for them.
============================================================ */
export function GuessReveal({
  won,
  outcome,
  guess,
  actual,
  category,
  imageUrl,
  subtitle,
  onDone,
}: GuessRevealProps) {
  const [step, setStep] = useState(0);
  const [reduced] = useState(
    () =>
      typeof window !== "undefined" &&
      Boolean(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches),
  );
  const skippedRef = useRef(false);

  const motes = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => {
        const ang = (i / 20) * 360 + (i % 2 ? 9 : -9);
        const dist = 120 + (i % 4) * 34;
        const gold = i % 3 === 0;
        return {
          ang,
          dist,
          size: 4 + (i % 3) * 2,
          delay: (i % 5) * 22,
          hue: gold ? 78 : 50,
          l: gold ? 0.74 : 0.66,
          c: gold ? 0.18 : 0.18,
        };
      }),
    [],
  );

  useEffect(() => {
    playVerdictCue(won, reduced);

    const timeline = reduced
      ? [[2, 60], [3, 700], [99, 980]]
      : [[1, 760], [2, 1500], [3, 2700], [99, 3120]];

    const timers = timeline.map(([next, at]) =>
      setTimeout(() => {
        if (skippedRef.current) return;
        if (next === 99) onDone?.();
        else setStep(next);
      }, at),
    );
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const skip = () => {
    if (skippedRef.current) return;
    skippedRef.current = true;
    onDone?.();
  };

  const sub =
    subtitle ??
    (outcome === "correct"
      ? "خمّنتَ اسمكَ بنجاح"
      : outcome === "wrong-guess"
        ? "هذا لم يكن اسمك"
        : "هذه كانت بطاقتك");

  const showCompare = outcome === "wrong-guess" && guess;
  const showStamp = outcome !== "neutral";

  const cardSrc = imageUrl && imageUrl.length > 0 ? imageUrl : CARD_PLACEHOLDER;

  return (
    <div
      className="gr-overlay"
      data-step={step}
      data-won={won ? "true" : "false"}
      data-reduced={reduced ? "true" : "false"}
      onClick={skip}
      role="img"
      aria-label={won ? "تخمين صحيح" : "تخمين خاطئ"}
    >
      {/* deep void + outcome-tinted vignette */}
      <div className="gr-veil" />
      <div className="gr-pool" />

      {/* radial rays — only meaningful on a win, sit behind the card */}
      <div className="gr-rays" aria-hidden>
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i} className="gr-ray" style={{ transform: `rotate(${i * 30}deg)` }} />
        ))}
      </div>

      {/* expanding verdict rings */}
      <div className="gr-rings" aria-hidden>
        <span className="gr-ring gr-ring-1" />
        <span className="gr-ring gr-ring-2" />
        <span className="gr-ring gr-ring-3" />
      </div>

      {/* burst motes (win) */}
      <div className="gr-motes" aria-hidden>
        {motes.map((m, i) => (
          <span
            key={i}
            className="gr-mote"
            style={
              {
                "--ang": m.ang + "deg",
                "--dist": m.dist + "px",
                width: m.size,
                height: m.size,
                animationDelay: m.delay + "ms",
                background: `oklch(${m.l} ${m.c} ${m.hue})`,
                boxShadow: `0 0 ${m.size + 4}px 1px oklch(${m.l} ${m.c} ${m.hue} / .8)`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* seam flash at the flip midpoint */}
      <div className="gr-flash" aria-hidden />

      {/* ===== centre stage ===== */}
      <div className="gr-stage">
        {outcome !== "neutral" && (
          <div className="gr-kicker">
            <span className="gr-kicker-eyebrow">لحظة الكشف</span>
            {guess ? (
              <span className="gr-kicker-guess">
                راهنتَ على «<b>{guess}</b>»
              </span>
            ) : null}
          </div>
        )}

        <div className="gr-cardwrap">
          <div className="gr-cardfloat">
            <div className="gr-card">
              {/* back — the hidden «؟» the player carried all match */}
              <div className="gr-face gr-back">
                <span className="gr-back-kicker">مَن أنا</span>
                <span className="gr-back-q">؟</span>
              </div>

              {/* front — the truth, finally seen */}
              <div className="gr-face gr-front">
                <div className="gr-front-top">
                  <span>{category}</span>
                  <span className="gr-front-seal">
                    <DiamondIcon size={12} />
                  </span>
                </div>
                <div className="gr-front-glyph">
                  <div className="gr-front-img">
                    <Image src={cardSrc} alt={actual} fill sizes="140px" className="object-cover" unoptimized />
                  </div>
                </div>
                <div className="gr-front-name">{actual}</div>
                <div className="gr-front-sheen" />
              </div>
            </div>
          </div>
        </div>

        {/* verdict stamp + comparison */}
        <div className="gr-verdict">
          {showStamp ? (
            <div className="gr-stamp">
              <span className="gr-stamp-icon">
                {won ? <CheckIcon size={26} /> : <CrossIcon size={26} />}
              </span>
              <span className="gr-stamp-word">{won ? "أصبتَ!" : "أخطأتَ"}</span>
            </div>
          ) : null}
          <div className="gr-sub">{sub}</div>

          {showCompare && (
            <div className="gr-compare">
              <div className="gr-compare-row gr-compare-wrong">
                <span className="gr-compare-label">تخمينك</span>
                <span className="gr-compare-val">{guess}</span>
              </div>
              <div className="gr-compare-row gr-compare-true">
                <span className="gr-compare-label">الصحيح</span>
                <span className="gr-compare-val">{actual}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="gr-skip">اضغط للتخطّي</div>

      <GuessRevealStyles />
    </div>
  );
}

/* ============================================================
   Small inline icons (kept local — no external icon dependency)
============================================================ */
function CheckIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 12.5l4.5 4.5L19 7" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function CrossIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function DiamondIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 2l5 7-5 13-5-13 5-7z" fill="currentColor" />
    </svg>
  );
}

/* ============================================================
   Audio — WebAudio verdict cue (no assets).
   Win  → bright rising major arpeggio + sparkle.
   Lose → soft descending minor fall.
============================================================ */
let _grAc: AudioContext | null = null;
function getGrAc(): AudioContext | null {
  if (_grAc) return _grAc;
  const AC = typeof window !== "undefined" ? (window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext) : null;
  if (!AC) return null;
  _grAc = new AC();
  return _grAc;
}
function grTone(ctx: AudioContext, freq: number, when: number, dur: number, gain: number, type: OscillatorType = "sine") {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, when);
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(gain, when + Math.min(0.18, dur * 0.3));
  g.gain.exponentialRampToValueAtTime(0.0006, when + dur);
  o.connect(g).connect(ctx.destination);
  o.start(when);
  o.stop(when + dur + 0.05);
}
function playVerdictCue(won: boolean, reduced: boolean) {
  try {
    const ctx = getGrAc();
    if (!ctx) return;
    if (ctx.state === "suspended") void ctx.resume();
    const t = ctx.currentTime;
    // low suspense pad under act 0
    grTone(ctx, won ? 196.0 : 174.61, t + 0.0, reduced ? 0.7 : 1.5, 0.045, "sine");
    if (reduced) return;
    // flip "turn" tick lands ~1.5s
    grTone(ctx, 330.0, t + 1.46, 0.28, 0.05, "triangle");
    if (won) {
      // rising major arpeggio at the verdict (~1.55s)
      grTone(ctx, 523.25, t + 1.55, 0.5, 0.06, "triangle"); // C5
      grTone(ctx, 659.25, t + 1.70, 0.5, 0.06, "triangle"); // E5
      grTone(ctx, 783.99, t + 1.86, 0.7, 0.06, "sine");     // G5
      grTone(ctx, 1046.5, t + 2.04, 1.0, 0.05, "sine");     // C6 sparkle
      grTone(ctx, 1567.98, t + 2.16, 0.7, 0.028, "sine");   // G6 shimmer
    } else {
      // gentle descending minor fall
      grTone(ctx, 440.0, t + 1.55, 0.45, 0.05, "sine");     // A4
      grTone(ctx, 349.23, t + 1.74, 0.5, 0.05, "sine");     // F4
      grTone(ctx, 261.63, t + 1.96, 1.1, 0.05, "sine");     // C4 settle
    }
  } catch {
    /* no-op */
  }
}

/* ============================================================
   Styles
============================================================ */
function GuessRevealStyles() {
  return (
    <style>{`
      .gr-overlay {
        position: absolute; inset: 0; z-index: 110;
        overflow: hidden; isolation: isolate;
        font-family: var(--display); direction: rtl; cursor: pointer;
        --tint-h: 70; --tint-l: 0.78; --tint-c: 0.16;   /* win amber/gold */
      }
      .gr-overlay[data-won="false"] { --tint-h: 30; --tint-l: 0.62; --tint-c: 0.16; }

      /* warm cream backdrop + outcome vignette — mirrors MatchResultScreen */
      .gr-veil {
        position: absolute; inset: 0;
        background:
          radial-gradient(120% 85% at 50% 38%,
            oklch(var(--tint-l) var(--tint-c) var(--tint-h) / .30), transparent 55%),
          radial-gradient(900px 500px at 50% -5%, rgba(255,220,160,0.85), transparent),
          linear-gradient(180deg, #fff9f0 0%, #fce8d2 100%);
        opacity: 0; animation: grVeilIn .4s ease forwards;
      }
      @keyframes grVeilIn { from { opacity: 0; } to { opacity: 1; } }

      /* spotlight pool on the "table" */
      .gr-pool {
        position: absolute; left: 50%; top: 47%;
        width: 380px; height: 380px; transform: translate(-50%, -50%);
        background: radial-gradient(closest-side,
          oklch(var(--tint-l) var(--tint-c) var(--tint-h) / .35), transparent 70%);
        filter: blur(6px); opacity: 0;
        animation: grPoolIn .9s ease .35s forwards; pointer-events: none;
      }
      @keyframes grPoolIn { from { opacity: 0; } to { opacity: 1; } }
      .gr-overlay[data-step="2"] .gr-pool { animation: grPoolFlare .8s ease forwards; }
      @keyframes grPoolFlare {
        0% { opacity: 1; } 30% { opacity: 1; transform: translate(-50%,-50%) scale(1.18); }
        100% { opacity: .8; transform: translate(-50%,-50%) scale(1); }
      }

      /* ===== rays (win) ===== */
      .gr-rays {
        position: absolute; left: 50%; top: 46%;
        width: 2px; height: 2px; transform: translate(-50%, -50%);
        opacity: 0; pointer-events: none;
      }
      .gr-ray {
        position: absolute; left: 50%; top: 50%;
        width: 3px; height: 320px; transform-origin: top center;
        margin-left: -1.5px;
        background: linear-gradient(180deg,
          oklch(0.84 0.16 86 / .5), oklch(var(--tint-l) var(--tint-c) var(--tint-h) / .12) 45%, transparent 78%);
      }
      .gr-overlay[data-won="true"][data-step="2"] .gr-rays { animation: grRays 1.1s ease forwards; }
      @keyframes grRays {
        0% { opacity: 0; transform: translate(-50%,-50%) scale(.4) rotate(-8deg); }
        35% { opacity: .9; }
        100% { opacity: .42; transform: translate(-50%,-50%) scale(1) rotate(6deg); }
      }
      .gr-overlay[data-won="true"][data-step="3"] .gr-rays {
        opacity: .42; animation: grRaysSpin 8s linear infinite;
      }
      @keyframes grRaysSpin {
        from { transform: translate(-50%,-50%) rotate(0); }
        to { transform: translate(-50%,-50%) rotate(360deg); }
      }

      /* ===== verdict rings ===== */
      .gr-rings {
        position: absolute; left: 50%; top: 46%; transform: translate(-50%,-50%);
        pointer-events: none;
      }
      .gr-ring {
        position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%) scale(0);
        border-radius: 50%; opacity: 0;
        border: 2px solid oklch(var(--tint-l) var(--tint-c) var(--tint-h) / .55);
        width: 180px; height: 180px;
      }
      .gr-overlay[data-step="2"] .gr-ring-1 { animation: grRing 1.0s cubic-bezier(.2,.7,.3,1) .02s forwards; }
      .gr-overlay[data-step="2"] .gr-ring-2 { animation: grRing 1.1s cubic-bezier(.2,.7,.3,1) .16s forwards; }
      .gr-overlay[data-step="2"] .gr-ring-3 { animation: grRing 1.25s cubic-bezier(.2,.7,.3,1) .30s forwards; }
      @keyframes grRing {
        0% { opacity: 0; transform: translate(-50%,-50%) scale(.2); }
        25% { opacity: .8; }
        100% { opacity: 0; transform: translate(-50%,-50%) scale(2.4); }
      }

      /* ===== burst motes (win) ===== */
      .gr-motes {
        position: absolute; left: 50%; top: 44%; transform: translate(-50%,-50%);
        pointer-events: none;
      }
      .gr-mote {
        position: absolute; left: 0; top: 0; border-radius: 50%;
        opacity: 0;
        transform: rotate(var(--ang)) translateY(0) scale(.4);
      }
      .gr-overlay[data-won="true"][data-step="2"] .gr-mote {
        animation: grMote 1.0s cubic-bezier(.15,.7,.3,1) forwards;
      }
      @keyframes grMote {
        0% { opacity: 0; transform: rotate(var(--ang)) translateY(0) scale(.3); }
        18% { opacity: 1; }
        100% { opacity: 0; transform: rotate(var(--ang)) translateY(calc(var(--dist) * -1)) scale(1); }
      }

      /* ===== flip seam flash ===== */
      .gr-flash {
        position: absolute; inset: 0; pointer-events: none; opacity: 0;
        background: radial-gradient(60% 45% at 50% 44%,
          oklch(0.96 calc(var(--tint-c) * 1.1) var(--tint-h) / .55), transparent 70%);
        mix-blend-mode: multiply;
      }
      .gr-overlay[data-step="2"] .gr-flash { animation: grFlash .7s ease-out forwards; }
      @keyframes grFlash {
        0% { opacity: 0; } 42% { opacity: .6; } 100% { opacity: 0; }
      }

      /* ===== centre stage ===== */
      .gr-stage {
        position: absolute; inset: 0;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        gap: 0; pointer-events: none;
      }

      /* guess kicker above the card */
      .gr-kicker {
        position: absolute; top: calc(50% - 232px);
        display: flex; flex-direction: column; align-items: center; gap: 7px;
        opacity: 0; transform: translateY(-10px);
        transition: opacity .5s ease, transform .55s cubic-bezier(.2,.85,.2,1);
      }
      .gr-overlay[data-step="0"] .gr-kicker,
      .gr-overlay[data-step="1"] .gr-kicker { opacity: 1; transform: none; transition-delay: .25s; }
      .gr-kicker-eyebrow {
        font-family: var(--mono); font-size: 10.5px; letter-spacing: .32em;
        text-transform: uppercase;
        color: oklch(0.50 calc(var(--tint-c) * .9) var(--tint-h) / .9);
      }
      .gr-kicker-guess {
        font-family: var(--body); font-size: 14px; color: #7A5A45;
      }
      .gr-kicker-guess b { color: #3A2517; font-weight: 700; }

      /* the card — three nested layers: wrap(enter/exit) / float(breathe) / card(flip) */
      .gr-cardwrap {
        position: relative; width: 176px; height: 244px;
        opacity: 1; transform: none;
        animation: grCardDrop .8s cubic-bezier(.22,1.1,.3,1) .12s backwards;
        perspective: 1100px;
      }
      @keyframes grCardDrop {
        0% { opacity: 0; transform: translateY(-130px) scale(.62) rotate(-7deg); }
        70% { opacity: 1; transform: translateY(8px) scale(1.03) rotate(2deg); }
        100% { opacity: 1; transform: translateY(0) scale(1) rotate(0deg); }
      }
      .gr-cardfloat {
        width: 100%; height: 100%;
        animation: grBreathe 3.4s ease-in-out 1s infinite;
      }
      .gr-overlay[data-step="2"] .gr-cardfloat,
      .gr-overlay[data-step="3"] .gr-cardfloat { animation: none; }

      @keyframes grBreathe {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-6px); }
      }
      .gr-card {
        position: relative; width: 100%; height: 100%;
        transform-style: preserve-3d;
        transform: rotateY(0deg);
        transition: transform .76s cubic-bezier(.5,.05,.25,1);
      }
      .gr-overlay[data-step="2"] .gr-card,
      .gr-overlay[data-step="3"] .gr-card { transform: rotateY(180deg); }
      .gr-overlay[data-reduced="true"] .gr-card { transition: none; }
      .gr-overlay[data-reduced="true"][data-step="2"] .gr-card,
      .gr-overlay[data-reduced="true"][data-step="3"] .gr-card { transform: rotateY(180deg); }

      .gr-face {
        position: absolute; inset: 0; border-radius: 20px;
        backface-visibility: hidden; -webkit-backface-visibility: hidden;
        overflow: hidden;
        background: linear-gradient(160deg,#fff 0%,#fff1dd 48%,#fbe0bd 100%);
      }
      .gr-back {
        transform: rotateY(0deg); display: grid; place-items: center;
        background: linear-gradient(160deg,#fff 0%,#fff1dd 48%,#fbe0bd 100%);
      }
      .gr-back-kicker {
        position: absolute; top: 16px; left: 0; right: 0; text-align: center;
        font-family: var(--display); font-size: 11px; letter-spacing: .18em;
        color: #C8881F;
      }
      .gr-back-q {
        font-family: var(--display); font-weight: 800; font-size: 92px;
        color: #F2B544;
        text-shadow: 0 2px 14px rgba(200,136,31,.35), 0 0 36px rgba(242,181,68,.3);
      }

      /* front (revealed) — gilded edge on a win */
      .gr-front {
        transform: rotateY(180deg);
        display: flex; flex-direction: column;
        padding: 14px 14px 16px;
        border: 1px solid oklch(0.30 0.08 285 / .5);
      }
      .gr-overlay[data-won="true"] .gr-front {
        border-color: oklch(0.72 0.15 86 / .55);
        box-shadow: var(--sh-card), 0 0 38px -6px oklch(0.82 0.16 86 / .5), inset 0 0 0 1px oklch(0.80 0.14 86 / .25);
      }
      .gr-overlay[data-won="false"] .gr-front {
        border-color: oklch(0.55 0.16 25 / .5);
        box-shadow: var(--sh-card), 0 0 32px -8px oklch(0.55 0.18 25 / .45);
      }
      .gr-front-top {
        display: flex; align-items: center; justify-content: space-between;
        font-family: var(--mono); font-size: 10px; letter-spacing: .14em;
        color: oklch(0.40 0.06 50 / .85);
      }
      .gr-front-seal { color: oklch(0.62 0.16 86 / .9); display: inline-flex; }
      .gr-overlay[data-won="false"] .gr-front-seal { color: oklch(0.56 0.16 25 / .85); }
      .gr-front-glyph { flex: 1; display: grid; place-items: center; padding: 6px 4px; min-height: 0; }
      .gr-front-img {
        position: relative; width: 100%; height: 100%; border-radius: 12px; overflow: hidden;
        background: oklch(0.93 0.02 75);
      }
      .gr-front-name {
        text-align: center; font-family: var(--display); font-weight: 800;
        font-size: 22px; line-height: 1.15; color: var(--fg-0);
        text-shadow: none;
      }
      .gr-front-sheen {
        position: absolute; inset: 0; pointer-events: none; mix-blend-mode: screen;
        background: radial-gradient(150px 110px at 64% 16%,
          oklch(var(--tint-l) var(--tint-c) var(--tint-h) / .16), transparent 60%);
      }

      /* ===== verdict ===== */
      .gr-verdict {
        position: absolute; top: calc(50% + 150px);
        display: flex; flex-direction: column; align-items: center; gap: 10px;
        opacity: 0; transition: opacity .5s ease .34s;
      }
      .gr-overlay[data-step="2"] .gr-verdict,
      .gr-overlay[data-step="3"] .gr-verdict { opacity: 1; }

      .gr-stamp {
        display: inline-flex; align-items: center; gap: 11px;
        padding: 9px 20px 9px 16px; border-radius: 999px;
        transform: scale(.5); opacity: 0;
        transition: opacity .42s ease .34s, transform .58s cubic-bezier(.2,1.55,.3,1) .34s;
      }
      .gr-overlay[data-step="2"] .gr-stamp,
      .gr-overlay[data-step="3"] .gr-stamp { opacity: 1; transform: scale(1); }
      .gr-overlay[data-won="true"] .gr-stamp {
        background: linear-gradient(180deg, #fff8ec, #ffe9c2);
        border: 1px solid rgba(242,181,68,.7);
        box-shadow: 0 10px 30px -10px rgba(242,138,61,.45), inset 0 1px 0 rgba(255,255,255,.6);
      }
      .gr-overlay[data-won="false"] .gr-stamp {
        background: linear-gradient(180deg, #fff3ee, #ffe1da);
        border: 1px solid rgba(196,90,74,.45);
        box-shadow: 0 10px 26px -12px rgba(138,48,40,.35);
      }
      .gr-stamp-icon {
        display: inline-grid; place-items: center; width: 30px; height: 30px; border-radius: 50%;
        color: #fff;
      }
      .gr-overlay[data-won="true"] .gr-stamp-icon {
        background: linear-gradient(180deg, #FFC58A, #F26A1F);
        box-shadow: 0 0 16px rgba(242,181,68,.55);
      }
      .gr-overlay[data-won="false"] .gr-stamp-icon {
        background: linear-gradient(180deg, #c45a4a, #8a3028);
      }
      .gr-stamp-word {
        font-family: var(--display); font-weight: 800; font-size: 30px; line-height: 1;
      }
      .gr-overlay[data-won="true"] .gr-stamp-word {
        background: linear-gradient(180deg, #FF8A3D 0%, #C8881F 100%);
        -webkit-background-clip: text; background-clip: text; color: transparent;
        filter: drop-shadow(0 2px 8px rgba(242,181,68,.35));
      }
      .gr-overlay[data-won="false"] .gr-stamp-word { color: #8a3028; }

      .gr-sub {
        font-family: var(--body); font-size: 13.5px; color: #7A5A45;
        opacity: 0; transform: translateY(4px);
        transition: opacity .5s ease .56s, transform .5s ease .56s;
      }
      .gr-overlay[data-step="2"] .gr-sub,
      .gr-overlay[data-step="3"] .gr-sub { opacity: 1; transform: none; color: #7A5A45; }

      /* loss comparison */
      .gr-compare {
        margin-top: 4px; display: flex; flex-direction: column; gap: 6px;
        opacity: 0; transform: translateY(4px);
        transition: opacity .5s ease .72s, transform .5s ease .72s;
      }
      .gr-overlay[data-step="2"] .gr-compare,
      .gr-overlay[data-step="3"] .gr-compare { opacity: 1; transform: none; }
      .gr-compare-row {
        display: flex; align-items: center; gap: 10px;
        padding: 7px 14px; border-radius: 12px; min-width: 184px;
        justify-content: space-between;
        background: rgba(255,255,255,.6);
        border: 1px solid rgba(122,90,69,.18);
      }
      .gr-compare-label {
        font-family: var(--mono); font-size: 10px; letter-spacing: .12em; color: #9a7a62;
      }
      .gr-compare-val { font-family: var(--display); font-weight: 700; font-size: 16px; color: #3A2517; }
      .gr-compare-wrong .gr-compare-val {
        color: #c45a4a; text-decoration: line-through;
        text-decoration-color: rgba(196,90,74,.7);
      }
      .gr-compare-true { border-color: rgba(63,184,122,.35); }
      .gr-compare-true .gr-compare-val { color: #2f9d63; }

      /* recoil the card on a loss verdict */
      .gr-overlay[data-won="false"][data-step="2"] .gr-cardwrap,
      .gr-overlay[data-won="false"][data-step="3"] .gr-cardwrap {
        animation: grRecoil .5s ease .3s both;
      }
      @keyframes grRecoil {
        0% { filter: saturate(1); }
        20% { transform: translateX(-5px) rotate(-1.5deg); }
        45% { transform: translateX(4px) rotate(1deg); }
        70% { transform: translateX(-2px); }
        100% { transform: translateX(0); filter: saturate(.82) brightness(.94); }
      }

      /* ===== dissolve to result ===== */
      .gr-overlay[data-step="3"] .gr-veil,
      .gr-overlay[data-step="3"] .gr-pool { animation: grOut .42s ease .02s forwards; }
      @keyframes grOut { to { opacity: 0; } }

      /* skip hint */
      .gr-skip {
        position: absolute; bottom: 22px; left: 0; right: 0; text-align: center;
        font-family: var(--mono); font-size: 10px; letter-spacing: .18em; text-transform: uppercase;
        color: rgba(122,90,69,.6); opacity: 0;
        animation: grSkipIn .5s ease 1.2s forwards;
      }
      @keyframes grSkipIn { to { opacity: .7; } }
      .gr-overlay[data-step="3"] .gr-skip { opacity: 0; }

      /* ===== reduced motion ===== */
      .gr-overlay[data-reduced="true"] .gr-kicker,
      .gr-overlay[data-reduced="true"] .gr-rays,
      .gr-overlay[data-reduced="true"] .gr-rings,
      .gr-overlay[data-reduced="true"] .gr-motes,
      .gr-overlay[data-reduced="true"] .gr-flash,
      .gr-overlay[data-reduced="true"] .gr-skip { display: none; }
      .gr-overlay[data-reduced="true"] .gr-cardwrap { animation: none; opacity: 1; transform: none; }
      .gr-overlay[data-reduced="true"] .gr-cardfloat { animation: none; }
    `}</style>
  );
}
