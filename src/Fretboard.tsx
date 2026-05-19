import {
  FRETS,
  POSITION_NOTES,
  ROOT_NOTE,
  STRING_LABELS,
  STRING_THICKNESS,
  keyOf,
} from './data';

const PAD_L = 60, PAD_R = 34, PAD_T = 40, PAD_B = 26;
const FRET_W = 124, STRING_GAP = 48;
const INNER_W = FRETS.length * FRET_W;
const INNER_H = 5 * STRING_GAP;
const BOARD_W = PAD_L + PAD_R + INNER_W;
const BOARD_H = PAD_T + PAD_B + INNER_H;

const fretX = (fret: number): number =>
  PAD_L + (fret - FRETS[0]) * FRET_W + FRET_W / 2;

const stringY = (s: number, invert: boolean): number =>
  PAD_T + (invert ? 5 - s : s) * STRING_GAP;

export type Phase = 'playing' | 'success';

interface FretboardProps {
  selected: Set<string>;
  targetKeys: Set<string>;
  phase: Phase;
  invert: boolean;
  onToggle: (key: string) => void;
}

const INLAY_FRETS = [5, 7];

export function Fretboard({ selected, targetKeys, phase, invert, onToggle }: FretboardProps) {
  return (
    <svg
      viewBox={`0 0 ${BOARD_W} ${BOARD_H}`}
      width="100%"
      style={{ maxWidth: BOARD_W, display: 'block' }}
    >
      <defs>
        <linearGradient id="grain" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a342d" stopOpacity="0.3" />
          <stop offset="50%" stopColor="#231f1b" stopOpacity="0" />
          <stop offset="100%" stopColor="#1a1714" stopOpacity="0.5" />
        </linearGradient>
      </defs>

      {/* board surface */}
      <rect x={PAD_L - 14} y={PAD_T - 16} width={INNER_W + 28} height={INNER_H + 32} rx={8} fill="#231f1b" />
      <rect x={PAD_L - 14} y={PAD_T - 16} width={INNER_W + 28} height={INNER_H + 32} rx={8} fill="url(#grain)" opacity={0.4} />

      {/* inlay dots */}
      {INLAY_FRETS.map((f) => (
        <circle key={`dot-${f}`} cx={fretX(f)} cy={PAD_T + INNER_H / 2} r={5.5} fill="#f0eee9" opacity={0.13} />
      ))}

      {/* fret wires */}
      {Array.from({ length: FRETS.length + 1 }, (_, i) => (
        <line
          key={i}
          x1={PAD_L + i * FRET_W} y1={PAD_T - 16}
          x2={PAD_L + i * FRET_W} y2={PAD_T + INNER_H + 16}
          stroke="#8a857d" strokeWidth={2.2} strokeLinecap="round"
        />
      ))}

      {/* strings */}
      {Array.from({ length: 6 }, (_, i) => (
        <line
          key={i}
          x1={PAD_L - 14} y1={stringY(i, invert)}
          x2={PAD_L + INNER_W + 14} y2={stringY(i, invert)}
          stroke="#d8d2c4" strokeWidth={STRING_THICKNESS[i]} opacity={0.85}
        />
      ))}

      {/* string labels */}
      {STRING_LABELS.map((label, i) => (
        <text
          key={i}
          x={PAD_L - 30} y={stringY(i, invert)}
          fill="#7d7a72" fontSize={11.5}
          textAnchor="middle" dominantBaseline="central"
          fontFamily="'JetBrains Mono', monospace"
          fontWeight={500} letterSpacing="0.04em"
        >
          {label}
        </text>
      ))}

      {/* notes */}
      {POSITION_NOTES.map((n) => {
        const key = keyOf(n);
        const isSelected = selected.has(key);
        const isSuccess = phase === 'success' && targetKeys.has(key);
        const isRoot = n.note === ROOT_NOTE;
        const x = fretX(n.f);
        const y = stringY(n.s, invert);

        const fill = isSuccess ? '#4a9c7f' : isSelected ? '#e0a458' : '#f0eee9';
        const stroke = isSuccess ? '#3a7d63' : isSelected ? '#b8853d' : 'rgba(0,0,0,0.08)';
        const dotFill = isSuccess ? '#ffffff' : '#29261b';

        return (
          <g
            key={key}
            className={`note${isSuccess ? ' note-success' : ''}`}
            style={{ cursor: phase === 'playing' ? 'pointer' : 'default' }}
            onClick={() => onToggle(key)}
          >
            <circle cx={x} cy={y} r={24} fill="rgba(0,0,0,0)" />
            <circle cx={x} cy={y} r={17} fill={fill} stroke={stroke} strokeWidth={1.2} />
            {isRoot && (
              <circle cx={x} cy={y} r={5} fill={dotFill} style={{ pointerEvents: 'none' }} />
            )}
          </g>
        );
      })}
    </svg>
  );
}
