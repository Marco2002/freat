import {
  FRETS,
  POSITION_NOTES,
  ROOT_NOTE,
  STRING_LABELS,
  STRING_THICKNESS,
  keyOf,
} from './data';

const PAD_L = 60, PAD_R = 34, PAD_T = 40, PAD_B = 42;
const FRET_W = 124, FRET_W_COMPACT = 72, STRING_GAP = 48;
const BOARD_OVERHANG_V = 22;
const BOARD_OVERHANG_H = 22;
const INNER_H = 5 * STRING_GAP;
const BOARD_H = PAD_T + PAD_B + INNER_H;

const stringY = (s: number, invert: boolean): number =>
  PAD_T + (invert ? 5 - s : s) * STRING_GAP;

export type Phase = 'playing' | 'success';

interface FretboardProps {
  selected: Set<string>;
  targetKeys: Set<string>;
  phase: Phase;
  invert: boolean;
  onToggle: (key: string) => void;
  compact?: boolean;
}

const INLAY_FRETS = [5, 7];

export function Fretboard({ selected, targetKeys, phase, invert, onToggle, compact = false }: FretboardProps) {
  // In compact mode the board fills the full viewBox width edge-to-edge:
  // padL/padR shrink to just the overhang so the board rect starts at x=0.
  // Fret width also shrinks so the notes appear larger on small screens.
  const fretW = compact ? FRET_W_COMPACT : FRET_W;
  const innerW = FRETS.length * fretW;
  const padL = compact ? BOARD_OVERHANG_H : PAD_L;
  const padR = compact ? BOARD_OVERHANG_H : PAD_R;
  const viewBoxW = padL + padR + innerW;
  const boardRx = compact ? 0 : 8;

  const fretX = (fret: number) => padL + (fret - FRETS[0]) * fretW + fretW / 2;

  return (
    <svg
      viewBox={`0 0 ${viewBoxW} ${BOARD_H}`}
      width="100%"
      style={compact ? { display: 'block' } : { maxWidth: PAD_L + PAD_R + innerW, display: 'block' }}
    >
      <defs>
        <linearGradient id="grain" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a342d" stopOpacity="0.3" />
          <stop offset="50%" stopColor="#231f1b" stopOpacity="0" />
          <stop offset="100%" stopColor="#1a1714" stopOpacity="0.5" />
        </linearGradient>
      </defs>

      {/* board surface */}
      <rect x={padL - BOARD_OVERHANG_H} y={PAD_T - BOARD_OVERHANG_V} width={innerW + BOARD_OVERHANG_H * 2} height={INNER_H + BOARD_OVERHANG_V * 2} rx={boardRx} fill="#231f1b" />
      <rect x={padL - BOARD_OVERHANG_H} y={PAD_T - BOARD_OVERHANG_V} width={innerW + BOARD_OVERHANG_H * 2} height={INNER_H + BOARD_OVERHANG_V * 2} rx={boardRx} fill="url(#grain)" opacity={0.4} />

      {/* inlay dots */}
      {INLAY_FRETS.map((f) => (
        <circle key={`dot-${f}`} cx={fretX(f)} cy={PAD_T + INNER_H / 2} r={5.5} fill="#f0eee9" opacity={0.13} />
      ))}

      {/* fret wires */}
      {Array.from({ length: FRETS.length + 1 }, (_, i) => (
        <line
          key={i}
          x1={padL + i * fretW} y1={PAD_T - BOARD_OVERHANG_V}
          x2={padL + i * fretW} y2={PAD_T + INNER_H + BOARD_OVERHANG_V}
          stroke="#8a857d" strokeWidth={2.2} strokeLinecap="round"
        />
      ))}

      {/* strings */}
      {Array.from({ length: 6 }, (_, i) => (
        <line
          key={i}
          x1={padL - BOARD_OVERHANG_H} y1={stringY(i, invert)}
          x2={padL + innerW + BOARD_OVERHANG_H} y2={stringY(i, invert)}
          stroke="#d8d2c4" strokeWidth={STRING_THICKNESS[i]} opacity={0.85}
        />
      ))}

      {/* string labels — hidden in compact mode */}
      {!compact && STRING_LABELS.map((label, i) => (
        <text
          key={i}
          x={padL - 30} y={stringY(i, invert)}
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
