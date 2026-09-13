export const CHROMATIC_NOTES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
] as const;
export type ChromaticNote = (typeof CHROMATIC_NOTES)[number];

// Display labels for each chromatic note — black keys include the enharmonic flat name
export const NOTE_LABELS: readonly { name: string; alt?: string }[] = [
  { name: "C" },
  { name: "C#", alt: "Db" },
  { name: "D" },
  { name: "D#", alt: "Eb" },
  { name: "E" },
  { name: "F" },
  { name: "F#", alt: "Gb" },
  { name: "G" },
  { name: "G#", alt: "Ab" },
  { name: "A" },
  { name: "A#", alt: "Bb" },
  { name: "B" },
];

// The major pentatonic is the major scale without its two half-step tensions,
// the 4th and the 7th — the notes that are hardest to place by ear.
export const PENTATONIC_DEGREES = [1, 2, 3, 5, 6] as const;
export const NON_PENTATONIC_DEGREES = [4, 7] as const;

// Semitone offsets from root for each major scale degree (I–VII)
export const MAJOR_INTERVALS = [0, 2, 4, 5, 7, 9, 11] as const;

export function getScaleNote(keyIdx: number, degreeIdx: number): ChromaticNote {
  return CHROMATIC_NOTES[(keyIdx + MAJOR_INTERVALS[degreeIdx]) % 12];
}

export const STRING_LABELS = ["E", "A", "D", "G", "B", "E"] as const;
export const STRING_THICKNESS = [2.4, 2.0, 1.7, 1.3, 1.0, 0.8] as const;

// Pitch class of each open string in standard tuning, low E → high E.
export const OPEN_STRING_PC = [4, 9, 2, 7, 11, 4] as const;

// The same strings as absolute pitch (MIDI: E2, A2, D3, G3, B3, E4). Pitch
// classes cannot order two notes — B3 and E4 are 11 and 4 — so anything that
// needs low-to-high has to count from here.
export const OPEN_STRING_MIDI = [40, 45, 50, 55, 59, 64] as const;

/** How high a note sounds, in semitones. Higher number, higher pitch. */
export const pitchOf = (n: { s: number; f: number }): number =>
  OPEN_STRING_MIDI[n.s] + n.f;

// The major scale repeats every 12 frets, so a shape moved by this much is the
// identical fingering an octave away. That repetition is what lets the neck be
// treated as endless: there is always another copy of every position further up
// or further down, so the camera never has to run back to a fixed board.
export const OCTAVE_FRETS = 12;

// Scale degree 1–7 within the major scale (1 = root)
export type Degree = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface PositionNote {
  s: number; // string index 0–5 (low E → high E)
  f: number; // fret number (absolute, for C major currently)
  degree: Degree;
}

export interface Position {
  number: number;
  frets: readonly number[];
  notes: PositionNote[];
}

export interface Chord {
  rank: string;
  quality: string;
  tones: Degree[]; // scale degrees present in this chord
  degrees: string[]; // display labels e.g. ['1','3','5']
}

// Takes anything with a string and a fret, so it keys plain board slots as well
// as scale notes.
/**
 * The next third up from a triad — the note that makes it a seventh chord.
 * Stacking thirds means skipping a degree, which is +6 around the seven.
 */
export const seventhTone = (c: Chord): Degree =>
  ((((c.tones[0] + 5) % 7) + 1) as Degree);

/**
 * A triad as its diatonic seventh. Which seventh it is falls out of the scale
 * rather than being listed: eleven semitones above the root is a major 7th, ten
 * is a minor one — which is what separates IVmaj7 from V7 even though both sit
 * on a major triad.
 */
export function chordWithSeventh(c: Chord): Chord {
  const seventh = seventhTone(c);
  const semitones =
    (MAJOR_INTERVALS[seventh - 1] - MAJOR_INTERVALS[c.tones[0] - 1] + 12) % 12;
  const stem = c.rank.replace("°", "");
  const [rank, quality] =
    c.quality === "diminished"
      ? [`${stem}ø7`, "half-diminished"]
      : semitones === 11
        ? [`${stem}maj7`, "major 7"]
        : c.quality === "major"
          ? [`${stem}7`, "dominant 7"]
          : [`${stem}7`, "minor 7"];

  return {
    rank,
    quality,
    tones: [...c.tones, seventh],
    degrees: [...c.degrees, String(seventh)],
  };
}

/**
 * A chord's rank split into its roman numeral and whatever is stacked on top —
 * "Imaj7" into "I" and "maj7" — so the extension can be picked out in print.
 */
export function splitRank(rank: string): { stem: string; suffix: string } {
  const m = /^([IViv]+°?)(.*)$/.exec(rank);
  return m ? { stem: m[1], suffix: m[2] } : { stem: rank, suffix: "" };
}

/** The note stacked on top of a triad, if this chord has one. */
export const extensionTone = (c: Chord): Degree | null =>
  c.tones.length > 3 ? c.tones[3] : null;

// Interval from a chord's root, in the shorthand chord and arpeggio charts
// use: a bare number is the major-scale interval, a flat lowers it. One or two
// characters, which is what lets it sit inside a note.
const INTERVAL_LABELS = [
  "R",
  "♭2",
  "2",
  "♭3",
  "3",
  "4",
  "♭5",
  "5",
  "♭6",
  "6",
  "♭7",
  "7",
] as const;

/**
 * How a chord tone reads against that chord's own root — so the ii is R ♭3 5
 * rather than 2 4 6, and the V7's 4th degree shows as the ♭7 it actually is.
 */
export function intervalLabel(root: Degree, degree: Degree): string {
  const semitones =
    (MAJOR_INTERVALS[degree - 1] - MAJOR_INTERVALS[root - 1] + 12) % 12;
  return INTERVAL_LABELS[semitones];
}

/** Every tone of a chord, labelled against its root. */
export const chordToneLabels = (c: Chord): Map<Degree, string> =>
  new Map(c.tones.map((d) => [d, intervalLabel(c.tones[0], d)]));

export const keyOf = (n: { s: number; f: number }): string => `${n.s}-${n.f}`;

export const keysOf = (notes: PositionNote[]): Set<string> =>
  new Set(notes.map(keyOf));

/**
 * The notes of a drill in playing order, lowest pitch first — the sequence In
 * Order expects. Ties cannot arise: no position holds the same pitch twice.
 */
export const ascendingKeys = (
  notes: PositionNote[],
  targets: Set<string>,
): string[] =>
  notes
    .filter((n) => targets.has(keyOf(n)))
    .sort((a, b) => pitchOf(a) - pitchOf(b))
    .map(keyOf);

/** The inverse of {@link keyOf}. */
export const keyFromParts = (key: string): { s: number; f: number } => {
  const [s, f] = key.split("-").map(Number);
  return { s, f };
};

/**
 * Every string-and-fret slot inside a position's window, in the scale or not.
 *
 * When a rule has taken notes off the neck, the whole window becomes tappable:
 * an unmarked slot might be a scale note gone dark, or might be nothing at all,
 * and there is no way to tell them apart by looking.
 */
export function slotKeysIn(frets: readonly number[]): Set<string> {
  const keys = new Set<string>();
  for (let s = 0; s < OPEN_STRING_PC.length; s++)
    for (const f of frets) keys.add(`${s}-${f}`);
  return keys;
}

/** The notes of `chord` within a drawn position — what a drill asks for. */
export const chordKeysIn = (notes: PositionNote[], chord: Chord): Set<string> =>
  new Set(notes.filter((n) => chord.tones.includes(n.degree)).map(keyOf));

// Semitones above the root → scale degree, for the major scale
const DEGREE_BY_OFFSET = new Map<number, Degree>(
  MAJOR_INTERVALS.map((semitones, i) => [semitones, (i + 1) as Degree]),
);

/**
 * Every major-scale note on the neck between two frets (inclusive), ordered by
 * string then fret. Fret numbers are absolute, so notes from any two ranges
 * share one coordinate system — that is what lets the fretboard slide between
 * positions instead of re-laying itself out.
 */
export function scaleNotesInRange(
  firstFret: number,
  lastFret: number,
  rootPc = 0, // 0 = C
): PositionNote[] {
  const notes: PositionNote[] = [];
  for (let s = 0; s < OPEN_STRING_PC.length; s++) {
    for (let f = firstFret; f <= lastFret; f++) {
      const offset = (((OPEN_STRING_PC[s] + f - rootPc) % 12) + 12) % 12;
      const degree = DEGREE_BY_OFFSET.get(offset);
      if (degree) notes.push({ s, f, degree });
    }
  }
  return notes;
}

// The 5 CAGED positions of the C major scale, as fret windows on the neck.
// Their notes are derived from the tuning + scale rather than listed by hand,
// so a position is just "which frets", and the note data can never drift.
//
// They are laid out as a rising ring: each one starts two or three frets above
// the last, and 4 and 5 sit an octave up from where they are usually written
// (2–6 and 4–8) so that the sequence only ever climbs. Position 1 of the next
// lap then follows 5 by the same short step, which is what makes 5 and 1 read
// as adjacent.
const POSITION_FRETS: readonly (readonly number[])[] = [
  [7, 8, 9, 10],
  [9, 10, 11, 12, 13],
  [12, 13, 14, 15],
  [14, 15, 16, 17, 18],
  [16, 17, 18, 19, 20],
];

export const POSITIONS: Position[] = POSITION_FRETS.map((frets, i) => ({
  number: i + 1,
  frets,
  notes: scaleNotesInRange(frets[0], frets[frets.length - 1]),
}));

// Where the ring begins. Any copy of any position can be folded back to here,
// which is the octave it is really fingered — and sounded — in.
export const RING_FIRST_FRET = Math.min(...POSITIONS.map((p) => p.frets[0]));

export const positionById = (number: number): Position =>
  POSITIONS.find((p) => p.number === number)!;

const shiftFrets = (frets: readonly number[], by: number): number[] =>
  frets.map((f) => f + by);

const shiftNotes = (notes: PositionNote[], by: number): PositionNote[] =>
  notes.map((n) => ({ ...n, f: n.f + by }));

/** A position as it is currently drawn: which one, and where on the neck. */
export interface Placement {
  id: number;
  frets: number[];
  notes: PositionNote[];
}

/**
 * Place `position` for a camera already sitting at `fromFirstFret`.
 *
 * The neck has no ends as far as the fretboard is concerned. Every position
 * repeats every 12 frets, so the copy to draw is whichever one lies closest to
 * where the camera already is — above it or below it. That is what makes the
 * five positions a ring rather than a row: going 5 → 1 draws 1 an octave up,
 * going 1 → 5 draws 5 an octave down, and either way it is the same short
 * slide to the neighbouring shape instead of a run to the other end.
 */
export function placePosition(
  position: Position,
  fromFirstFret: number,
): Placement {
  const shift =
    Math.round((fromFirstFret - position.frets[0]) / OCTAVE_FRETS) *
    OCTAVE_FRETS;
  return {
    id: position.number,
    frets: shiftFrets(position.frets, shift),
    notes: shiftNotes(position.notes, shift),
  };
}

/** Where a position starts out, before the camera has gone anywhere. */
export const initialPlacement = (number: number): Placement =>
  placePosition(positionById(number), positionById(number).frets[0]);

/**
 * The next position to drill, drawn at random from `ids` — the current one
 * included, which simply leaves the neck where it is for another round. When it
 * does move it goes to the copy nearest the neck already on screen, so any pair
 * of positions is a short slide apart.
 */
export function nextPlacement(current: Placement, ids: number[]): Placement {
  const id = ids[Math.floor(Math.random() * ids.length)];
  if (id === current.id) return current;
  return placePosition(positionById(id), current.frets[0]);
}

/**
 * The fret a drawn note is really fingered at, with the octaves the neck has
 * rotated through folded back off. Sound this rather than the drawn fret, or a
 * shape would ring higher and higher the longer a session runs.
 */
export const soundingFret = (drawnFret: number, firstFret: number): number =>
  drawnFret -
  Math.floor((firstFret - RING_FIRST_FRET) / OCTAVE_FRETS) * OCTAVE_FRETS;

export const CHORDS: Chord[] = [
  { rank: "I", quality: "major", tones: [1, 3, 5], degrees: ["1", "3", "5"] },
  { rank: "ii", quality: "minor", tones: [2, 4, 6], degrees: ["2", "4", "6"] },
  { rank: "iii", quality: "minor", tones: [3, 5, 7], degrees: ["3", "5", "7"] },
  { rank: "IV", quality: "major", tones: [4, 6, 1], degrees: ["4", "6", "1"] },
  { rank: "V", quality: "major", tones: [5, 7, 2], degrees: ["5", "7", "2"] },
  { rank: "vi", quality: "minor", tones: [6, 1, 3], degrees: ["6", "1", "3"] },
  {
    rank: "vii°",
    quality: "diminished",
    tones: [7, 2, 4],
    degrees: ["7", "2", "4"],
  },
];

/** Each triad's diatonic seventh, by the same index. */
export const SEVENTH_CHORDS: Chord[] = CHORDS.map(chordWithSeventh);

/**
 * Every chord a drill can draw, as one flat list: the seven triads, then their
 * sevenths. A seventh is a chord in its own right, not a version of another —
 * a run holding both the V and the V7 drills each of them in turn — so they
 * share one index space and one roster.
 */
export const ALL_CHORDS: Chord[] = [...CHORDS, ...SEVENTH_CHORDS];

/** Where the sevenths start in {@link ALL_CHORDS}. */
export const SEVENTH_OFFSET = CHORDS.length;

export const seventhIndexOf = (chordIdx: number): number =>
  chordIdx + SEVENTH_OFFSET;
export const isSeventhIndex = (idx: number): boolean => idx >= SEVENTH_OFFSET;
export const triadIndexOf = (idx: number): number => idx % SEVENTH_OFFSET;
