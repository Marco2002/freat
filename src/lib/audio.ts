// Open string frequencies: E2, A2, D3, G3, B3, E4
const OPEN_STRING_FREQ = [82.41, 110.0, 146.83, 196.0, 246.94, 329.63];

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

function scheduleNote(ctx: AudioContext, string: number, fret: number, startOffset = 0): void {
  const freq = OPEN_STRING_FREQ[string] * Math.pow(2, fret / 12);
  const now = ctx.currentTime + startOffset;
  const duration = 2.0;

  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.value = freq;

  // Sweep the filter down to mimic how a plucked string loses high harmonics
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(freq * 20, now);
  filter.frequency.exponentialRampToValueAtTime(freq * 2, now + 0.6);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.35, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + duration);
}

function scheduleFreq(ctx: AudioContext, freq: number, startOffset = 0): void {
  const now = ctx.currentTime + startOffset;
  const duration = 2.0;
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.value = freq;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(freq * 20, now);
  filter.frequency.exponentialRampToValueAtTime(freq * 2, now + 0.6);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.35, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + duration);
}

// noteIdx: 0=C, 1=C#, ..., 11=B. Plays at octave 4 by default (middle octave).
export function playNoteByIndex(noteIdx: number, octave = 4): void {
  const freq = 261.63 * Math.pow(2, (noteIdx + (octave - 4) * 12) / 12);
  const ctx = getCtx();
  ctx.resume().then(() => scheduleFreq(ctx, freq));
}

export function playNote(string: number, fret: number): void {
  const ctx = getCtx();
  ctx.resume().then(() => scheduleNote(ctx, string, fret));
}

export function playChord(notes: { string: number; fret: number }[]): void {
  const ctx = getCtx();
  const sorted = [...notes].sort((a, b) => a.string - b.string);
  // Use the audio clock for timing instead of setTimeout — much more precise
  ctx.resume().then(() => {
    sorted.forEach((n, i) => scheduleNote(ctx, n.string, n.fret, i * 0.04));
  });
}
