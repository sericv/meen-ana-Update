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

function beepTriangle(freq: number, durSec: number, gainVal: number) {
  try {
    const c = getCtx();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "triangle";
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

/** UI tap / toggle — short, warm */
export function playUIButton(): void {
  beepTriangle(620, 0.04, 0.055);
}

/** Matchmaking / social “found” */
export function playMatchFound(): void {
  beep(392, 0.07, 0.05);
  window.setTimeout(() => beep(523, 0.08, 0.048), 75);
  window.setTimeout(() => beep(784, 0.1, 0.042), 170);
}

/** Ready toggle */
export function playReadyTap(): void {
  beep(480, 0.05, 0.048);
  window.setTimeout(() => beep(640, 0.055, 0.038), 65);
}

/** Someone joined the room lobby */
export function playRoomJoin(): void {
  beep(330, 0.08, 0.045);
  window.setTimeout(() => beep(440, 0.09, 0.04), 95);
}

/** Correct guess — bright, short */
export function playCorrectGuess(): void {
  beep(523, 0.06, 0.052);
  window.setTimeout(() => beep(659, 0.06, 0.048), 70);
  window.setTimeout(() => beep(784, 0.1, 0.045), 145);
}

/** Wrong guess — soft dip, not punishing */
export function playWrongGuess(): void {
  beep(300, 0.09, 0.042);
  window.setTimeout(() => beep(240, 0.11, 0.035), 100);
}

/** Tiny victory sparkle (legacy hook) */
export function playWinSparkle(): void {
  playVictoryFanfare();
}

/** Full victory sting — mobile-game lift */
export function playVictoryFanfare(): void {
  beep(523, 0.08, 0.05);
  window.setTimeout(() => beep(659, 0.08, 0.048), 85);
  window.setTimeout(() => beep(784, 0.09, 0.046), 170);
  window.setTimeout(() => beep(988, 0.12, 0.04), 265);
}

/** Soft defeat (legacy name) */
export function playDefeatTone(): void {
  playDefeatSoft();
}

/** Softer, playful loss */
export function playDefeatSoft(): void {
  beepTriangle(247, 0.14, 0.048);
  window.setTimeout(() => beepTriangle(196, 0.16, 0.036), 120);
  window.setTimeout(() => beepTriangle(175, 0.18, 0.028), 260);
}

/** Local player sent a chat line */
export function playMessageSend(): void {
  beep(698, 0.032, 0.04);
  window.setTimeout(() => beep(932, 0.028, 0.032), 45);
}

/** Everyone ready — lobby can start */
export function playRoomReady(): void {
  beep(415, 0.07, 0.046);
  window.setTimeout(() => beep(523, 0.08, 0.042), 80);
  window.setTimeout(() => beep(659, 0.1, 0.036), 165);
}

/** Premium room invite chime */
export function playRoomInviteChime(): void {
  beepTriangle(523, 0.09, 0.032);
  window.setTimeout(() => beep(784, 0.12, 0.036), 90);
  window.setTimeout(() => beepTriangle(659, 0.08, 0.024), 210);
}

/** Positive accept chirp for room invite */
export function playRoomInviteAccept(): void {
  beep(880, 0.09, 0.045);
  window.setTimeout(() => beep(1319, 0.12, 0.034), 75);
}

/**
 * Extra Time cinematic soundscape — uplifting layered cues timed to the overlay.
 * Returns a cleanup fn that stops any still-running nodes (call on unmount).
 */
export function playExtraTimeCinematic(): () => void {
  const handles: Array<{ stop: () => void }> = [];

  function scheduled(
    type: OscillatorType,
    freq: number,
    startSec: number,
    durSec: number,
    gain: number,
    freqEnd?: number,
  ) {
    try {
      const c = getCtx();
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = type;
      o.frequency.value = freq;
      if (freqEnd !== undefined) {
        o.frequency.linearRampToValueAtTime(freqEnd, c.currentTime + startSec + durSec);
      }
      g.gain.value = 0;
      g.gain.setValueAtTime(gain, c.currentTime + startSec);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + startSec + durSec);
      o.connect(g);
      g.connect(c.destination);
      o.start(c.currentTime + startSec);
      o.stop(c.currentTime + startSec + durSec + 0.05);
      handles.push({ stop: () => { try { o.stop(); } catch { /* already stopped */ } } });
    } catch { /* ignore */ }
  }

  // t=0.0s — soft whoosh entry: rising sweep
  scheduled("sawtooth", 160, 0.00, 0.20, 0.035, 420);
  scheduled("sine",     120, 0.05, 0.22, 0.040);

  // t=0.18s — hourglass appears: warm chime
  scheduled("sine",     523, 0.18, 0.16, 0.048);
  scheduled("triangle", 784, 0.20, 0.14, 0.038);
  scheduled("sine",     659, 0.26, 0.18, 0.032);

  // t=0.3s — ripple rings expand: soft energy pulses (3 rings)
  for (let i = 0; i < 3; i++) {
    scheduled("sine", 220, 0.25 + i * 0.25, 0.30, 0.030, 100);
  }

  // t=0.68s — "+15" title lands: upbeat sting
  scheduled("sine",     784, 0.68, 0.10, 0.052);
  scheduled("sine",     988, 0.72, 0.14, 0.045);
  scheduled("triangle", 523, 0.68, 0.18, 0.035);

  // t=0.82s — effect line fades in: warm sustain
  scheduled("sine",     440, 0.82, 0.35, 0.028);
  scheduled("triangle", 220, 0.85, 0.40, 0.022);

  // t=1.0s — actor chip appears: short lift
  scheduled("sine",     880, 1.00, 0.12, 0.040);
  scheduled("sine",    1047, 1.06, 0.14, 0.034);

  // t=1.5s — fade out: soft release
  scheduled("sine",     330, 1.50, 0.32, 0.020, 180);
  scheduled("triangle", 165, 1.55, 0.28, 0.016);

  return () => { handles.forEach((h) => h.stop()); };
}

/**
 * Time Pressure cinematic soundscape — layered Web Audio cues timed to the overlay.
 * Returns a cleanup fn that stops any still-running nodes (call on unmount).
 */
export function playTimePressureCinematic(): () => void {
  const handles: Array<{ stop: () => void }> = [];

  function scheduled(
    type: OscillatorType,
    freq: number,
    startSec: number,
    durSec: number,
    gain: number,
    freqEnd?: number,
  ) {
    try {
      const c = getCtx();
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = type;
      o.frequency.value = freq;
      if (freqEnd !== undefined) {
        o.frequency.linearRampToValueAtTime(freqEnd, c.currentTime + startSec + durSec);
      }
      g.gain.value = 0;
      g.gain.setValueAtTime(gain, c.currentTime + startSec);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + startSec + durSec);
      o.connect(g);
      g.connect(c.destination);
      o.start(c.currentTime + startSec);
      o.stop(c.currentTime + startSec + durSec + 0.05);
      handles.push({ stop: () => { try { o.stop(); } catch { /* already stopped */ } } });
    } catch { /* ignore */ }
  }

  // t=0s — Whoosh cinematic: descending sweep + low impact
  scheduled("sawtooth", 480,  0.00, 0.18, 0.045, 120);
  scheduled("triangle", 80,   0.05, 0.22, 0.060);
  scheduled("sine",     55,   0.08, 0.28, 0.055);

  // t=0.2s — Metallic clock appear: bright metallic ping
  scheduled("sine",     1480, 0.22, 0.12, 0.042);
  scheduled("triangle", 740,  0.22, 0.18, 0.035);
  // Deep tick
  scheduled("sine",     110,  0.28, 0.14, 0.058);
  scheduled("triangle", 55,   0.28, 0.20, 0.048);

  // t=0.55s — Hand spin starts: fast ticking escalation (6 ticks over ~0.5s)
  for (let i = 0; i < 6; i++) {
    scheduled("sine", 520 + i * 30, 0.55 + i * 0.08, 0.04, 0.035);
  }
  // Clock winding effect — rising tone
  scheduled("sawtooth", 200, 0.55, 0.55, 0.032, 460);

  // t=0.55s — Glass crack: sharp impact layers
  scheduled("triangle", 1200, 0.56, 0.08, 0.038);
  scheduled("sawtooth", 600,  0.56, 0.10, 0.032);
  scheduled("sine",     320,  0.58, 0.14, 0.040);

  // t=0.18s–0.42s — ShockRings expanding: energy pulse (3 rings)
  for (let i = 0; i < 3; i++) {
    scheduled("sine", 180, 0.18 + i * 0.12, 0.28, 0.038, 60);
  }

  // t=1.0s — "10s" stamp hit: heavy boom + reverb tail
  scheduled("sine",     80,   1.00, 0.35, 0.075);
  scheduled("triangle", 55,   1.00, 0.40, 0.065);
  scheduled("sine",     40,   1.02, 0.45, 0.055);
  // Deep cinematic boom
  scheduled("sawtooth", 120,  1.00, 0.20, 0.048, 40);
  // Short reverb tail — decaying harmonics
  scheduled("sine",     220,  1.08, 0.50, 0.032);
  scheduled("sine",     440,  1.08, 0.40, 0.024);

  // t=1.5s — Fade out atmosphere
  scheduled("sine",     180,  1.50, 0.30, 0.022, 80);
  scheduled("triangle", 90,   1.55, 0.28, 0.018);

  return () => { handles.forEach((h) => h.stop()); };
}

/** Opponent activated a tactical tool — short alert sting */
export function playTacticalAlert(blocked = false): void {
  if (blocked) {
    beepTriangle(420, 0.09, 0.05);
    window.setTimeout(() => beepTriangle(520, 0.1, 0.042), 95);
    return;
  }
  beep(330, 0.06, 0.052);
  window.setTimeout(() => beep(494, 0.07, 0.048), 72);
  window.setTimeout(() => beep(740, 0.11, 0.04), 155);
}
