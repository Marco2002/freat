export const CHROMATIC_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
export type ChromaticNote = typeof CHROMATIC_NOTES[number];

// Display labels for each chromatic note — black keys include the enharmonic flat name
export const NOTE_LABELS: readonly { name: string; alt?: string }[] = [
  { name: 'C' },
  { name: 'C#', alt: 'Db' },
  { name: 'D' },
  { name: 'D#', alt: 'Eb' },
  { name: 'E' },
  { name: 'F' },
  { name: 'F#', alt: 'Gb' },
  { name: 'G' },
  { name: 'G#', alt: 'Ab' },
  { name: 'A' },
  { name: 'A#', alt: 'Bb' },
  { name: 'B' },
];

// Semitone offsets from root for each major scale degree (I–VII)
export const MAJOR_INTERVALS = [0, 2, 4, 5, 7, 9, 11] as const;

export function getScaleNote(keyIdx: number, degreeIdx: number): ChromaticNote {
  return CHROMATIC_NOTES[(keyIdx + MAJOR_INTERVALS[degreeIdx]) % 12];
}

export const STRING_LABELS = ["E", "A", "D", "G", "B", "E"] as const;
export const STRING_THICKNESS = [2.4, 2.0, 1.7, 1.3, 1.0, 0.8] as const;
export const ALL_INLAY_FRETS = [3, 5, 7, 9, 12] as const;

// Scale degree 1–7 within the major scale (1 = root)
export type Degree = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface PositionNote {
  s: number; // string index 0–5 (low E → high E)
  f: number; // fret number (absolute, for C major currently)
  degree: Degree;
}

export interface Position {
  id: number;
  label: string;
  frets: readonly number[];
  notes: PositionNote[];
}

export interface Chord {
  rank: string;
  quality: string;
  tones: Degree[]; // scale degrees present in this chord
  degrees: string[]; // display labels e.g. ['1','3','5']
}

// 5 CAGED positions of the C major scale.
// Fret numbers are absolute for C major; degrees are key-agnostic (1=root).
// Degree map for C major: 1=C 2=D 3=E 4=F 5=G 6=A 7=B
export const POSITIONS: Position[] = [
  {
    id: 1,
    label: "Position 1",
    frets: [7, 8, 9, 10],
    notes: [
      { s: 0, f: 7, degree: 7 },
      { s: 0, f: 8, degree: 1 },
      { s: 0, f: 10, degree: 2 },
      { s: 1, f: 7, degree: 3 },
      { s: 1, f: 8, degree: 4 },
      { s: 1, f: 10, degree: 5 },
      { s: 2, f: 7, degree: 6 },
      { s: 2, f: 9, degree: 7 },
      { s: 2, f: 10, degree: 1 },
      { s: 3, f: 7, degree: 2 },
      { s: 3, f: 9, degree: 3 },
      { s: 3, f: 10, degree: 4 },
      { s: 4, f: 8, degree: 5 },
      { s: 4, f: 10, degree: 6 },
      { s: 5, f: 7, degree: 7 },
      { s: 5, f: 8, degree: 1 },
      { s: 5, f: 10, degree: 2 },
    ],
  },
  {
    id: 2,
    label: "Position 2",
    frets: [9, 10, 11, 12, 13],
    notes: [
      { s: 0, f: 10, degree: 2 },
      { s: 0, f: 12, degree: 3 },
      { s: 0, f: 13, degree: 4 },
      { s: 1, f: 10, degree: 5 },
      { s: 1, f: 12, degree: 6 },
      { s: 2, f: 9, degree: 7 },
      { s: 2, f: 10, degree: 1 },
      { s: 2, f: 12, degree: 2 },
      { s: 3, f: 9, degree: 3 },
      { s: 3, f: 10, degree: 4 },
      { s: 3, f: 12, degree: 5 },
      { s: 4, f: 10, degree: 6 },
      { s: 4, f: 12, degree: 7 },
      { s: 4, f: 13, degree: 1 },
      { s: 5, f: 10, degree: 2 },
      { s: 5, f: 12, degree: 3 },
      { s: 5, f: 13, degree: 4 },
    ],
  },
  {
    id: 3,
    label: "Position 3",
    frets: [12, 13, 14, 15],
    notes: [
      { s: 0, f: 12, degree: 3 },
      { s: 0, f: 13, degree: 4 },
      { s: 0, f: 15, degree: 5 },
      { s: 1, f: 12, degree: 6 },
      { s: 1, f: 14, degree: 7 },
      { s: 1, f: 15, degree: 1 },
      { s: 2, f: 12, degree: 2 },
      { s: 2, f: 14, degree: 3 },
      { s: 2, f: 15, degree: 4 },
      { s: 3, f: 12, degree: 5 },
      { s: 3, f: 14, degree: 6 },
      { s: 4, f: 12, degree: 7 },
      { s: 4, f: 13, degree: 1 },
      { s: 4, f: 15, degree: 2 },
      { s: 5, f: 12, degree: 3 },
      { s: 5, f: 13, degree: 4 },
      { s: 5, f: 15, degree: 5 },
    ],
  },
  {
    id: 4,
    label: "Position 4",
    frets: [2, 3, 4, 5, 6],
    notes: [
      { s: 0, f: 3, degree: 5 },
      { s: 0, f: 5, degree: 6 },
      { s: 1, f: 2, degree: 7 },
      { s: 1, f: 3, degree: 1 },
      { s: 1, f: 5, degree: 2 },
      { s: 2, f: 2, degree: 3 },
      { s: 2, f: 3, degree: 4 },
      { s: 2, f: 5, degree: 5 },
      { s: 3, f: 2, degree: 6 },
      { s: 3, f: 4, degree: 7 },
      { s: 3, f: 5, degree: 1 },
      { s: 4, f: 3, degree: 2 },
      { s: 4, f: 5, degree: 3 },
      { s: 4, f: 6, degree: 4 },
      { s: 5, f: 3, degree: 5 },
      { s: 5, f: 5, degree: 6 },
    ],
  },
  {
    id: 5,
    label: "Position 5",
    frets: [4, 5, 6, 7, 8],
    notes: [
      { s: 0, f: 5, degree: 6 },
      { s: 0, f: 7, degree: 7 },
      { s: 0, f: 8, degree: 1 },
      { s: 1, f: 5, degree: 2 },
      { s: 1, f: 7, degree: 3 },
      { s: 1, f: 8, degree: 4 },
      { s: 2, f: 5, degree: 5 },
      { s: 2, f: 7, degree: 6 },
      { s: 3, f: 4, degree: 7 },
      { s: 3, f: 5, degree: 1 },
      { s: 3, f: 7, degree: 2 },
      { s: 4, f: 5, degree: 3 },
      { s: 4, f: 6, degree: 4 },
      { s: 4, f: 8, degree: 5 },
      { s: 5, f: 5, degree: 6 },
      { s: 5, f: 7, degree: 7 },
      { s: 5, f: 8, degree: 1 },
    ],
  },
];

export const keyOf = (n: PositionNote): string => `${n.s}-${n.f}`;

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
