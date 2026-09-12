import { useId, useMemo, useState } from 'react';
import {
  OCTAVE_FRETS,
  STRING_LABELS,
  STRING_THICKNESS,
  keyOf,
  scaleNotesInRange,
  soundingFret,
} from '../lib/data';
import type { Degree } from '../lib/data';

/**
 * A place a finger can go: a scale note, or — once a rule has thinned the neck
 * — any other fret in the window, which carries no degree at all.
 */
type Slot = { s: number; f: number; degree: Degree | null };
import { playNote } from '../lib/audio';

const PAD_T = 40, PAD_B = 28;
const FRET_W = 124, FRET_W_COMPACT = 72, STRING_GAP = 48;
const BOARD_OVERHANG_V = 22;
const GUTTER_L = 44, GUTTER_R = 12; // string-label gutter, desktop only
const INNER_H = 5 * STRING_GAP;
const BOARD_H = PAD_T + PAD_B + INNER_H;

// How many frets the camera window shows. Positions span 4–5 frets, so this
// leaves half a fret to a full fret of neighbouring neck visible on each side.
const WINDOW_FRETS = 6, WINDOW_FRETS_COMPACT = 5;
// How much neck to build on either side of the active position. The camera only
// ever travels two or three frets between positions, so an octave of skirt keeps
// the window full of board and ghost notes no matter where it lands — including
// the octave-up laps the rotation climbs into.
const NECK_SKIRT_FRETS = OCTAVE_FRETS;

const GHOST_OPACITY = 0.12;

const stringY = (s: number, invert: boolean): number =>
  PAD_T + (invert ? 5 - s : s) * STRING_GAP;

// Steps around the ring are two or three frets; a mode change can be further.
// Longer travel needs more time or it reads as a blur, shorter travel feels
// sluggish on a fixed duration.
const slideDuration = (fretsMoved: number): number =>
  Math.min(900, Math.round(320 + 55 * fretsMoved));

/**
 * `reveal` is the beat after a failed drill: the arpeggio that was wanted is
 * shown, alongside whatever the player actually hit.
 */
export type Phase = 'playing' | 'success' | 'reveal';

interface FretboardProps {
  /** Fret range of the active position — this is what the camera frames. */
  frets: readonly number[];
  /** Keys inside the active position. Everything else renders as an inert ghost. */
  activeKeys: Set<string>;
  selected: Set<string>;
  targetKeys: Set<string>;
  phase: Phase;
  invert: boolean;
  /**
   * Degrees to leave unmarked. The notes are still there and still tappable —
   * only the dot is gone, so they have to be found rather than read.
   */
  hiddenDegrees?: readonly Degree[];
  onToggle: (key: string) => void;
  compact?: boolean;
}

export function Fretboard({
  frets,
  activeKeys,
  selected,
  targetKeys,
  phase,
  invert,
  hiddenDegrees,
  onToggle,
  compact = false,
}: FretboardProps) {
  // useId contains colons, which are awkward inside url(#…) references
  const uid = useId().replace(/:/g, '');
  const grainId = `grain${uid}`, windowId = `window${uid}`;

  const fretW = compact ? FRET_W_COMPACT : FRET_W;
  const windowFrets = compact ? WINDOW_FRETS_COMPACT : WINDOW_FRETS;
  const gutterL = compact ? 0 : GUTTER_L;
  const gutterR = compact ? 0 : GUTTER_R;
  const windowW = windowFrets * fretW;
  const viewBoxW = gutterL + windowW + gutterR;

  // Neck space: x is absolute in fret units and never changes with the active
  // position. neckX(f) is the left edge of fret f.
  const neckX = (f: number) => f * fretW;
  const fretCenterX = (f: number) => neckX(f) + fretW / 2;

  // The stretch of neck actually built, around wherever the camera is. The board
  // follows the position rather than the position living on a board of fixed
  // length — which is what lets the rotation wander up or down the neck forever
  // without ever reaching an end. Frets here may run past 24 or below the nut;
  // they are only ever coordinates, always far outside the window.
  const neckFirst = frets[0] - NECK_SKIRT_FRETS;
  const neckLast = frets[frets.length - 1] + NECK_SKIRT_FRETS;
  const neckLeft = neckX(neckFirst);
  const neckRight = neckX(neckLast + 1);

  // The scale repeats every octave, so the ghost layer is the same shape however
  // many laps up the neck it is drawn.
  const notes = useMemo(
    () => scaleNotesInRange(neckFirst, neckLast),
    [neckFirst, neckLast],
  );

  // With degrees hidden, the frets between them open up too. Otherwise an
  // unmarked spot could only ever be a hidden scale note, and counting frets
  // would give the shape away.
  const slots = useMemo<Slot[]>(() => {
    if (!hiddenDegrees?.length) return notes;
    const inScale = new Set(notes.map(keyOf));
    const blanks: Slot[] = [];
    for (let s = 0; s < STRING_LABELS.length; s++) {
      for (const f of frets) {
        if (!inScale.has(`${s}-${f}`)) blanks.push({ s, f, degree: null });
      }
    }
    return [...notes, ...blanks];
  }, [notes, hiddenDegrees, frets]);


  // Camera: centre the active position inside the window.
  const centerFret = (frets[0] + frets[frets.length - 1] + 1) / 2;
  const windowStart = centerFret - windowFrets / 2;

  // Derive the slide duration from how far the camera is about to travel.
  // Tracked in fret units so a mobile/desktop resize (which changes fretW)
  // repositions instantly instead of animating.
  const [cam, setCam] = useState({ start: windowStart, w: fretW, ms: 0 });
  if (cam.start !== windowStart || cam.w !== fretW) {
    const moved = cam.w === fretW ? Math.abs(windowStart - cam.start) : 0;
    setCam({ start: windowStart, w: fretW, ms: moved ? slideDuration(moved) : 0 });
  }

  const slide = {
    transform: `translateX(${gutterL - neckX(windowStart)}px)`,
    transition: `transform ${cam.ms}ms cubic-bezier(0.66, 0, 0.24, 1)`,
  };

  return (
    <svg
      viewBox={`0 0 ${viewBoxW} ${BOARD_H}`}
      width="100%"
      style={compact ? { display: 'block' } : { maxWidth: viewBoxW, display: 'block' }}
    >
      <defs>
        <linearGradient id={grainId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a342d" stopOpacity="0.3" />
          <stop offset="50%" stopColor="#231f1b" stopOpacity="0" />
          <stop offset="100%" stopColor="#1a1714" stopOpacity="0.5" />
        </linearGradient>
        <clipPath id={windowId}>
          <rect x={gutterL} y={0} width={windowW} height={BOARD_H} />
        </clipPath>
      </defs>

      <g clipPath={`url(#${windowId})`}>
        <g className="neck-slide" style={slide}>
          {/* board surface — one continuous strip the camera pans over */}
          <rect
            x={neckLeft} y={PAD_T - BOARD_OVERHANG_V}
            width={neckRight - neckLeft} height={INNER_H + BOARD_OVERHANG_V * 2}
            fill="#231f1b"
          />
          <rect
            x={neckLeft} y={PAD_T - BOARD_OVERHANG_V}
            width={neckRight - neckLeft} height={INNER_H + BOARD_OVERHANG_V * 2}
            fill={`url(#${grainId})`} opacity={0.4}
          />

          {/* fret wires */}
          {Array.from({ length: neckLast - neckFirst + 2 }, (_, i) => {
            const f = neckFirst + i;
            return (
              <line
                key={`wire-${f}`}
                x1={neckX(f)} y1={PAD_T - BOARD_OVERHANG_V}
                x2={neckX(f)} y2={PAD_T + INNER_H + BOARD_OVERHANG_V}
                stroke="#8a857d" strokeWidth={2.2} strokeLinecap="round"
              />
            );
          })}

          {/* strings — ride with the neck so they stay in sync with the notes */}
          {Array.from({ length: 6 }, (_, i) => (
            <line
              key={`str-${i}`}
              x1={neckLeft} y1={stringY(i, invert)}
              x2={neckRight} y2={stringY(i, invert)}
              stroke="#d8d2c4" strokeWidth={STRING_THICKNESS[i]} opacity={0.85}
            />
          ))}

          {/* notes — the entire scale is always mounted; position membership is
              a visual state, so notes slide in from where they really live */}
          {slots.map((n) => {
            const key = keyOf(n);
            const isActive = activeKeys.has(key);
            const isSelected = isActive && selected.has(key);
            // The notes that were wanted — lit on a clear, and again when the
            // answer is shown after a miss.
            const isAnswer =
              isActive &&
              (phase === 'success' || phase === 'reveal') &&
              targetKeys.has(key);
            // A note the player hit that was not in the arpeggio.
            const isWrong =
              isActive && phase === 'reveal' && isSelected && !targetKeys.has(key);
            const isRoot = n.degree === 1;
            // Hidden until it is touched: tapping one brings it back, so the
            // player can see what they picked — right or wrong.
            // A slot with no degree is never marked — it is not in the scale.
            const isHidden =
              (n.degree === null || !!hiddenDegrees?.includes(n.degree)) &&
              !isSelected &&
              !isAnswer &&
              !isWrong;
            const x = fretCenterX(n.f);
            const y = stringY(n.s, invert);

            const fill = isWrong
              ? '#b94040'
              : isAnswer
                ? '#4a9c7f'
                : isSelected
                  ? '#e0a458'
                  : '#f0eee9';
            const stroke = isWrong
              ? '#8f3030'
              : isAnswer
                ? '#3a7d63'
                : isSelected
                  ? '#b8853d'
                  : 'rgba(0,0,0,0.08)';
            const dotFill = isAnswer || isWrong ? '#ffffff' : '#29261b';
            const tappable = isActive && phase === 'playing';

            return (
              <g
                key={key}
                className={`note${
                  isAnswer && phase === 'success' ? ' note-success' : ''
                }${isWrong ? ' note-wrong' : ''}`}
                // opacity 0 still takes taps, which is the whole point here —
                // visibility:hidden or display:none would not.
                opacity={isHidden ? 0 : isActive ? 1 : GHOST_OPACITY}
                style={{
                  cursor: tappable ? 'pointer' : 'default',
                  pointerEvents: isActive ? 'auto' : 'none',
                  touchAction: 'manipulation',
                }}
                onPointerDown={(e) => {
                  if (!tappable) return;
                  e.preventDefault();
                  playNote(n.s, soundingFret(n.f, frets[0]));
                  onToggle(key);
                }}
              >
                {isActive && (
                  <rect
                    x={x - fretW / 2} y={y - STRING_GAP / 2}
                    width={fretW} height={STRING_GAP} fill="rgba(0,0,0,0)"
                  />
                )}
                <circle className="note-body" cx={x} cy={y} r={17} fill={fill} stroke={stroke} strokeWidth={1.2} />
                {isRoot && (
                  <circle className="note-root" cx={x} cy={y} r={5} fill={dotFill} style={{ pointerEvents: 'none' }} />
                )}
              </g>
            );
          })}
        </g>
      </g>

      {/* string labels sit outside the window and never move */}
      {!compact && STRING_LABELS.map((label, i) => (
        <text
          key={i}
          x={gutterL - 16} y={stringY(i, invert)}
          fill="#7d7a72" fontSize={11.5}
          textAnchor="middle" dominantBaseline="central"
          fontFamily="'JetBrains Mono', monospace"
          fontWeight={500} letterSpacing="0.04em"
        >
          {label}
        </text>
      ))}
    </svg>
  );
}
