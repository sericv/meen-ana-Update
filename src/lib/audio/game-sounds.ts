/**
 * Lightweight Web Audio “bloops” — no asset files, soft volumes.
 * Call `resumeAudioContext()` after a user gesture so playback works on mobile.
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (typeof window === "undefined") throw new Error("no window");
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

export function resumeAudioContext(): void {
  try {
    const c = getCtx();
    if (c.state === "suspended") void c.resume();
  } catch {
    // ignore
  }
}

function beep(freq: number, durSec: number, gainVal: number) {
  try {
    const c = getCtx();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "sine";
    o.frequency.value = freq;
    g.gain.value = gainVal;
    o.connect(g);
    g.connect(c.destination);
    const t = c.currentTime;
    o.start(t);
    g.gain.exponentialRampToValueAtTime(0.001, t + durSec);
    o.stop(t + durSec);
  } catch {
    // ignore
  }
}

/** Soft tick for countdown (last seconds) */
export function playCountdownTick(secRemaining: number): void {
  const pitch = 520 + (6 - Math.min(5, Math.max(1, secRemaining))) * 35;
  beep(pitch, 0.045, 0.06);
}

/** Your turn started */
export function playTurnCue(): void {
  beep(440, 0.06, 0.055);
  window.setTimeout(() => beep(660, 0.05, 0.045), 70);
}

/** Incoming chat message (other player) */
export function playMessagePop(): void {
  beep(880, 0.035, 0.04);
}

/** Guess flow confirmation */
export function playGuessChime(): void {
  beep(523, 0.05, 0.05);
  window.setTimeout(() => beep(784, 0.055, 0.045), 85);
}

/** Tiny victory sparkle */
export function playWinSparkle(): void {
  beep(740, 0.06, 0.05);
  window.setTimeout(() => beep(988, 0.08, 0.045), 90);
}

/** Soft defeat */
export function playDefeatTone(): void {
  beep(220, 0.12, 0.055);
  window.setTimeout(() => beep(180, 0.14, 0.04), 110);
}
