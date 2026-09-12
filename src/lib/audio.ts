// Open string frequencies: E2, A2, D3, G3, B3, E4
const OPEN_STRING_FREQ = [82.41, 110.0, 146.83, 196.0, 246.94, 329.63];

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

const DURATION = 2.2; // seconds the note rings for
const DECAY = 0.996; // string damping per loop pass (higher = longer sustain)

// Karplus-Strong plucks are deterministic per pitch, so cache the rendered
// buffer by delay-line length to avoid re-synthesising on every tap.
const pluckCache = new Map<number, AudioBuffer>();

/**
 * Render a plucked-string waveform using Karplus-Strong synthesis: a short
 * noise burst circulated through a delay line whose feedback is gently
 * low-passed. The low-pass makes higher harmonics fade faster than the
 * fundamental — exactly how a real plucked string behaves — which is what
 * gives this its acoustic character versus a raw oscillator.
 */
function renderPluck(ctx: AudioContext, freq: number): AudioBuffer {
  const sr = ctx.sampleRate;
  const N = Math.max(2, Math.round(sr / freq)); // delay length sets the pitch
  const cached = pluckCache.get(N);
  if (cached) return cached;

  const len = Math.floor(sr * DURATION);
  const buffer = ctx.createBuffer(1, len, sr);
  const data = buffer.getChannelData(0);

  // Excitation: a noise burst, lightly low-passed so the attack reads as a
  // warm, woody pluck rather than a harsh click.
  let prev = 0;
  for (let i = 0; i < N; i++) {
    const white = Math.random() * 2 - 1;
    prev = 0.5 * white + 0.5 * prev;
    data[i] = prev;
  }

  // The feedback loop: each sample is the damped average of the two samples
  // one period earlier. The averaging is the harmonic-rolloff low-pass.
  for (let i = N; i < len; i++) {
    data[i] = DECAY * 0.5 * (data[i - N] + data[i - N + 1]);
  }

  pluckCache.set(N, buffer);
  return buffer;
}

function pluck(ctx: AudioContext, freq: number, startOffset = 0): void {
  const now = ctx.currentTime + startOffset;
  const source = ctx.createBufferSource();
  source.buffer = renderPluck(ctx, freq);

  // Gentle low-frequency bump to suggest the resonance of an acoustic body.
  const body = ctx.createBiquadFilter();
  body.type = 'peaking';
  body.frequency.value = 120;
  body.Q.value = 0.7;
  body.gain.value = 4;

  // Roll a little off the very top so it isn't fizzy/buzzy.
  const tone = ctx.createBiquadFilter();
  tone.type = 'highshelf';
  tone.frequency.value = 3500;
  tone.gain.value = -6;

  const gain = ctx.createGain();
  const peak = 0.5;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(peak, now + 0.005); // soft attack, no click
  gain.gain.setValueAtTime(peak, now + DURATION - 0.12);
  gain.gain.linearRampToValueAtTime(0, now + DURATION); // clean fade-out tail

  source.connect(body);
  body.connect(tone);
  tone.connect(gain);
  gain.connect(ctx.destination);

  source.start(now);
  source.stop(now + DURATION);
}

// noteIdx: 0=C, 1=C#, ..., 11=B. Plays at octave 4 by default (middle octave).
export function playNoteByIndex(noteIdx: number, octave = 4): void {
  const freq = 261.63 * Math.pow(2, (noteIdx + (octave - 4) * 12) / 12);
  const ctx = getCtx();
  ctx.resume().then(() => pluck(ctx, freq));
}

export function playNote(string: number, fret: number): void {
  const freq = OPEN_STRING_FREQ[string] * Math.pow(2, fret / 12);
  const ctx = getCtx();
  ctx.resume().then(() => pluck(ctx, freq));
}

/**
 * A short, dry blip for the countdown — deliberately unlike the plucked
 * strings, so it reads as the clock rather than as a note the player hit. The
 * `urgency` (0–1) raises the pitch and bite as the last seconds run out.
 */
export function playTick(urgency = 0): void {
  const ctx = getCtx();
  ctx.resume().then(() => {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(660 + 220 * urgency, now);
    // A quick downward chirp gives it a knock rather than a beep.
    osc.frequency.exponentialRampToValueAtTime(
      330 + 110 * urgency,
      now + 0.09,
    );

    const gain = ctx.createGain();
    const peak = 0.1 + 0.12 * urgency;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(peak, now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  });
}

export function playChord(notes: { string: number; fret: number }[]): void {
  const ctx = getCtx();
  const sorted = [...notes].sort((a, b) => a.string - b.string);
  // Stagger the notes slightly so it strums like a chord rather than a stab.
  // Audio-clock timing keeps the spacing tight and precise.
  ctx.resume().then(() => {
    sorted.forEach((n, i) => {
      const freq = OPEN_STRING_FREQ[n.string] * Math.pow(2, n.fret / 12);
      pluck(ctx, freq, i * 0.045);
    });
  });
}
