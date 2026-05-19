export const STRING_LABELS = ['E', 'A', 'D', 'G', 'B', 'E'] as const;
export const STRING_THICKNESS = [2.4, 2.0, 1.7, 1.3, 1.0, 0.8] as const;

export const ROOT_NOTE = 'C' as const;

export const FRETS = [4, 5, 6, 7, 8] as const;

export type NoteName = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';

export interface PositionNote {
  s: number;
  f: number;
  note: NoteName;
}

export interface Chord {
  rank: string;
  quality: string;
  tones: NoteName[];
  degrees: string[];
}

export const POSITION_NOTES: PositionNote[] = [
  { s: 0, f: 5, note: 'A' },
  { s: 0, f: 7, note: 'B' },
  { s: 0, f: 8, note: 'C' },
  { s: 1, f: 5, note: 'D' },
  { s: 1, f: 7, note: 'E' },
  { s: 1, f: 8, note: 'F' },
  { s: 2, f: 5, note: 'G' },
  { s: 2, f: 7, note: 'A' },
  { s: 3, f: 4, note: 'B' },
  { s: 3, f: 5, note: 'C' },
  { s: 3, f: 7, note: 'D' },
  { s: 4, f: 5, note: 'E' },
  { s: 4, f: 6, note: 'F' },
  { s: 4, f: 8, note: 'G' },
  { s: 5, f: 5, note: 'A' },
  { s: 5, f: 7, note: 'B' },
  { s: 5, f: 8, note: 'C' },
];

export const CHORDS: Chord[] = [
  { rank: 'I',    quality: 'major',      tones: ['C', 'E', 'G'], degrees: ['1', '3', '5'] },
  { rank: 'ii',   quality: 'minor',      tones: ['D', 'F', 'A'], degrees: ['2', '4', '6'] },
  { rank: 'iii',  quality: 'minor',      tones: ['E', 'G', 'B'], degrees: ['3', '5', '7'] },
  { rank: 'IV',   quality: 'major',      tones: ['F', 'A', 'C'], degrees: ['4', '6', '1'] },
  { rank: 'V',    quality: 'major',      tones: ['G', 'B', 'D'], degrees: ['5', '7', '2'] },
  { rank: 'vi',   quality: 'minor',      tones: ['A', 'C', 'E'], degrees: ['6', '1', '3'] },
  { rank: 'vii°', quality: 'diminished', tones: ['B', 'D', 'F'], degrees: ['7', '2', '4'] },
];

export const keyOf = (n: PositionNote): string => `${n.s}-${n.f}`;
