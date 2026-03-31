// ──────────────────────────────────────────────────────
//  Retro pixel-style synthesized sound effects
//  Uses Web Audio API — no external files needed
// ──────────────────────────────────────────────────────

let _ctx = null;
let _sfxMuted = false;

function ctx() {
  if (!_ctx) {
    _ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (_ctx.state === 'suspended') {
    _ctx.resume();
  }
  return _ctx;
}

// ── Helpers ──

function playTone(freq, duration, type = 'square', volume = 0.15, detune = 0) {
  if (_sfxMuted) return;
  const c = ctx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.detune.value = detune;
  gain.gain.setValueAtTime(volume, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + duration);
}

function playNoise(duration, volume = 0.08) {
  if (_sfxMuted) return;
  const c = ctx();
  const bufferSize = c.sampleRate * duration;
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const noise = c.createBufferSource();
  noise.buffer = buffer;

  const filter = c.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 3000;

  const gain = c.createGain();
  gain.gain.setValueAtTime(volume, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(c.destination);
  noise.start(c.currentTime);
  noise.stop(c.currentTime + duration);
}

// ── Sound Effects ──

/** High chirpy "snap" when a robot part locks into place */
export function playPartSnap() {
  playTone(880, 0.08, 'square', 0.12);
  setTimeout(() => playTone(1320, 0.12, 'square', 0.10), 50);
}

/** Quick upward blip for jumping */
export function playJump() {
  if (_sfxMuted) return;
  const c = ctx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(260, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(560, c.currentTime + 0.1);
  gain.gain.setValueAtTime(0.10, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + 0.15);
}

/** Satisfying "click-lock" for code block slotting in */
export function playCodeSlot() {
  // Short noise tick + tonal confirmation
  playNoise(0.04, 0.10);
  setTimeout(() => playTone(660, 0.06, 'triangle', 0.12), 30);
  setTimeout(() => playTone(880, 0.10, 'triangle', 0.10), 70);
}

/** Ascending arpeggio melody for level completion */
export function playLevelComplete() {
  const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.18, 'square', 0.10), i * 120);
  });
  // Sustain the final note with triangle for warmth
  setTimeout(() => playTone(1047, 0.4, 'triangle', 0.08), notes.length * 120);
}

/** Triumphant fanfare for game complete / victory screen */
export function playVictory() {
  if (_sfxMuted) return;
  //  C5 - E5 - G5 - (pause) - C6 - E6 - G5 - C6 (octave jump)
  const melody = [
    { freq: 523, delay: 0,   dur: 0.15 },
    { freq: 659, delay: 130, dur: 0.15 },
    { freq: 784, delay: 260, dur: 0.15 },
    { freq: 1047, delay: 450, dur: 0.20 },
    { freq: 1319, delay: 600, dur: 0.15 },
    { freq: 784, delay: 750, dur: 0.15 },
    { freq: 1047, delay: 900, dur: 0.35 },
  ];

  melody.forEach(({ freq, delay, dur }) => {
    setTimeout(() => playTone(freq, dur, 'square', 0.10), delay);
    // Layered triangle for fuller sound
    setTimeout(() => playTone(freq, dur + 0.1, 'triangle', 0.06), delay + 20);
  });
}

/** Platform breaking / crumbling sound */
export function playBreak() {
  if (_sfxMuted) return;
  // Descending noise burst — crackle
  const c = ctx();
  const bufLen = Math.floor(c.sampleRate * 0.15);
  const buf = c.createBuffer(1, bufLen, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const filt = c.createBiquadFilter();
  filt.type = 'bandpass';
  filt.frequency.setValueAtTime(2000, c.currentTime);
  filt.frequency.exponentialRampToValueAtTime(300, c.currentTime + 0.12);
  filt.Q.value = 2;
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.12, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
  src.connect(filt);
  filt.connect(gain);
  gain.connect(c.destination);
  src.start(c.currentTime);
  src.stop(c.currentTime + 0.16);
}

/** Error buzz — wrong placement */
export function playError() {
  if (_sfxMuted) return;
  // Two quick low dissonant tones
  playTone(180, 0.10, 'square', 0.10);
  setTimeout(() => playTone(150, 0.14, 'square', 0.08), 80);
}

/** Toggle SFX mute */
export function toggleSFX() {
  _sfxMuted = !_sfxMuted;
  return !_sfxMuted; // returns true if SFX are now ON
}

/** Check if SFX are muted */
export function isSFXOn() {
  return !_sfxMuted;
}

/** Check if BGM is on (not muted) */
export function isBGMOn() {
  return !_bgmMuted;
}

/** Call once on first user interaction to unlock audio context */
export function unlockAudio() {
  ctx();
}

// ──────────────────────────────────────────────────────
//  Background Music — Retro chiptune loop
//  Two-voice melody + bass + simple percussion
// ──────────────────────────────────────────────────────

let _bgmPlaying = false;
let _bgmTimer = null;
let _bgmMuted = false;
let _bgmGain = null;        // master gain node — disconnect to kill all scheduled BGM

const BPM = 138;
const BEAT = 60 / BPM;           // seconds per beat
const NOTE = BEAT / 2;           // eighth note

// Note frequencies
const N = {
  C4: 262, D4: 294, Eb4: 311, E4: 330, F4: 349, G4: 392, Ab4: 415, A4: 440, Bb4: 466, B4: 494,
  C5: 523, D5: 587, Eb5: 622, E5: 659, F5: 698, G5: 784, Ab5: 831, A5: 880,
  R: 0,  // rest
};

// ── Original melody — A minor pentatonic / dorian feel ──
// Intervals: steps, 4ths, 5ths — no direct game quotes
const MELODY = [
  // Bar 1: simple rising motif
  N.A4, N.R,  N.C5, N.R,  N.D5, N.R,  N.E5, N.R,
  // Bar 2: hold + step down
  N.E5, N.R,  N.R,  N.R,  N.D5, N.R,  N.C5, N.R,
  // Bar 3: repeat motif, variation
  N.A4, N.R,  N.C5, N.R,  N.D5, N.R,  N.G5, N.R,
  // Bar 4: resolve down
  N.E5, N.R,  N.R,  N.R,  N.R,  N.R,  N.R,  N.R,
  // Bar 5: contrasting phrase (lower)
  N.G4, N.R,  N.A4, N.R,  N.C5, N.R,  N.A4, N.R,
  // Bar 6: stepping up
  N.D5, N.R,  N.C5, N.R,  N.A4, N.R,  N.G4, N.R,
  // Bar 7: echo of bar 1, octave answer
  N.A4, N.R,  N.C5, N.R,  N.E5, N.R,  N.D5, N.R,
  // Bar 8: land on root — clean loop point
  N.A4, N.R,  N.R,  N.R,  N.R,  N.R,  N.R,  N.R,
];

// ── Bass — root notes, simple and steady ──
const BASS = [
  // Bar 1-2: Am
  N.A4, N.R,  N.A4, N.R,  N.A4, N.R,  N.A4, N.R,
  N.A4, N.R,  N.A4, N.R,  N.A4, N.R,  N.A4, N.R,
  // Bar 3-4: Am → Em
  N.A4, N.R,  N.A4, N.R,  N.A4, N.R,  N.A4, N.R,
  N.E4, N.R,  N.E4, N.R,  N.E4, N.R,  N.E4, N.R,
  // Bar 5-6: G → Am
  N.G4, N.R,  N.G4, N.R,  N.G4, N.R,  N.G4, N.R,
  N.A4, N.R,  N.A4, N.R,  N.A4, N.R,  N.A4, N.R,
  // Bar 7-8: Am → resolve
  N.A4, N.R,  N.A4, N.R,  N.E4, N.R,  N.E4, N.R,
  N.A4, N.R,  N.A4, N.R,  N.A4, N.R,  N.A4, N.R,
];

// Simple kick-hat pattern — minimal and steady
const PERC = [
  'K','R','H','R', 'K','R','H','R',
  'K','R','H','R', 'K','R','H','R',
  'K','R','H','R', 'K','R','H','R',
  'K','R','H','R', 'K','R','H','K',
  'K','R','H','R', 'K','R','H','R',
  'K','R','H','R', 'K','R','H','R',
  'K','R','H','R', 'K','R','H','R',
  'K','R','H','R', 'K','R','R','R',
];

// 8 bars of 4/4 = 8 × 8 eighth-notes = 64 slots
// At 120 BPM each eighth note = 0.25s → total loop = 16s
const EIGHTHS_PER_BAR = 8;
const TOTAL_BARS = 8;
const LOOP_LENGTH = EIGHTHS_PER_BAR * TOTAL_BARS; // must be 64

let _bgmNextStart = 0; // audio-clock time for the next loop start

function scheduleLoop() {
  if (!_bgmPlaying) return;
  const c = ctx();

  // Create a fresh master gain for this scheduling batch
  if (!_bgmGain || _bgmGain.context !== c) {
    _bgmGain = c.createGain();
    _bgmGain.connect(c.destination);
  }
  const dest = _bgmGain;

  // If first call or clock has drifted past our mark, anchor to now
  if (_bgmNextStart <= c.currentTime) {
    _bgmNextStart = c.currentTime + 0.05;
  }

  const startTime = _bgmNextStart;
  const loopDuration = LOOP_LENGTH * NOTE;

  for (let i = 0; i < LOOP_LENGTH; i++) {
    const t = startTime + i * NOTE;

    // ── Melody (square, quiet) ──
    const mFreq = MELODY[i % MELODY.length];
    if (mFreq > 0) {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'square';
      osc.frequency.value = mFreq;
      gain.gain.setValueAtTime(0.06, t);
      gain.gain.setValueAtTime(0.06, t + NOTE * 0.7);
      gain.gain.exponentialRampToValueAtTime(0.001, t + NOTE * 0.95);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(t);
      osc.stop(t + NOTE);
    }

    // ── Bass (triangle, warm) ──
    const bFreq = BASS[i % BASS.length];
    if (bFreq > 0) {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'triangle';
      osc.frequency.value = bFreq * 0.5; // one octave down
      gain.gain.setValueAtTime(0.07, t);
      gain.gain.setValueAtTime(0.07, t + NOTE * 0.6);
      gain.gain.exponentialRampToValueAtTime(0.001, t + NOTE * 0.9);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(t);
      osc.stop(t + NOTE);
    }

    // ── Percussion ──
    const perc = PERC[i % PERC.length];
    if (perc === 'K') {
      // Kick — short low-frequency thump
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.08);
      gain.gain.setValueAtTime(0.10, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.10);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(t);
      osc.stop(t + 0.12);
    } else if (perc === 'H') {
      // Hi-hat — filtered noise burst
      const bufLen = Math.floor(c.sampleRate * 0.04);
      const buf = c.createBuffer(1, bufLen, c.sampleRate);
      const d = buf.getChannelData(0);
      for (let j = 0; j < bufLen; j++) d[j] = Math.random() * 2 - 1;
      const src = c.createBufferSource();
      src.buffer = buf;
      const filt = c.createBiquadFilter();
      filt.type = 'highpass';
      filt.frequency.value = 8000;
      const gain = c.createGain();
      gain.gain.setValueAtTime(0.03, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      src.connect(filt);
      filt.connect(gain);
      gain.connect(dest);
      src.start(t);
      src.stop(t + 0.05);
    }
  }

  // Schedule the next loop to start at exactly the right audio-clock time
  _bgmNextStart = startTime + loopDuration;

  // Use setTimeout to wake up ~500ms before the next loop needs scheduling
  const msUntilNext = (_bgmNextStart - c.currentTime) * 1000 - 500;
  _bgmTimer = setTimeout(() => scheduleLoop(), Math.max(msUntilNext, 50));
}

/** Start the background music loop */
export function startBGM() {
  if (_bgmPlaying || _bgmMuted) return;
  _bgmPlaying = true;
  _bgmNextStart = 0;            // force re-anchor on next scheduleLoop
  _bgmGain = null;              // create fresh gain node
  scheduleLoop();
}

/** Stop the background music */
export function stopBGM() {
  _bgmPlaying = false;
  _bgmNextStart = 0;
  if (_bgmTimer) {
    clearTimeout(_bgmTimer);
    _bgmTimer = null;
  }
  // Disconnect the master gain to instantly silence all scheduled nodes
  if (_bgmGain) {
    _bgmGain.disconnect();
    _bgmGain = null;
  }
}

/** Toggle BGM mute (stops / restarts) */
export function toggleBGM() {
  _bgmMuted = !_bgmMuted;
  if (_bgmMuted) {
    stopBGM();
  } else {
    startBGM();
  }
  return !_bgmMuted;
}

/** Check if BGM is currently playing */
export function isBGMPlaying() {
  return _bgmPlaying;
}
