import type { PositionNote } from '../lib/data';

interface ShapePreviewProps {
  frets: readonly number[];
  notes: PositionNote[];
  invert: boolean;
}

export function ShapePreview({ frets, notes, invert }: ShapePreviewProps) {
  const W = 76, H = 52;
  const padL = 10, padR = 10, padT = 8, padB = 8;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const numStrings = 6;
  const stringGap = innerH / (numStrings - 1);
  const numFrets = frets.length;
  const fretGap = numFrets > 1 ? innerW / (numFrets - 1) : innerW;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      {Array.from({ length: numStrings }, (_, s) => (
        <line key={`s${s}`}
          x1={padL} y1={padT + s * stringGap}
          x2={padL + innerW} y2={padT + s * stringGap}
          stroke="rgba(41,38,27,0.18)" strokeWidth={0.75}
        />
      ))}
      {Array.from({ length: numFrets }, (_, f) => (
        <line key={`f${f}`}
          x1={padL + f * fretGap} y1={padT}
          x2={padL + f * fretGap} y2={padT + innerH}
          stroke="rgba(41,38,27,0.1)" strokeWidth={0.75}
        />
      ))}
      {notes.map((n, i) => {
        const cx = padL + (n.f - frets[0]) * fretGap;
        const stringRow = invert ? 5 - n.s : n.s;
        const cy = padT + stringRow * stringGap;
        return <circle key={i} cx={cx} cy={cy} r={3} fill="#e0a458" />;
      })}
    </svg>
  );
}
