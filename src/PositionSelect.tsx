import { useState } from "react";
import { POSITIONS, CHORDS, type PositionNote } from "./data";

interface ShapePreviewProps {
  frets: readonly number[];
  notes: PositionNote[];
  invert: boolean;
}

function ShapePreview({ frets, notes, invert }: ShapePreviewProps) {
  const W = 76,
    H = 52;
  const padL = 10,
    padR = 10,
    padT = 8,
    padB = 8;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const numStrings = 6;
  const stringGap = innerH / (numStrings - 1);
  const numFrets = frets.length;
  const fretGap = numFrets > 1 ? innerW / (numFrets - 1) : innerW;

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      style={{ display: "block" }}
    >
      {Array.from({ length: numStrings }, (_, s) => (
        <line
          key={`s${s}`}
          x1={padL}
          y1={padT + s * stringGap}
          x2={padL + innerW}
          y2={padT + s * stringGap}
          stroke="rgba(41,38,27,0.18)"
          strokeWidth={0.75}
        />
      ))}
      {Array.from({ length: numFrets }, (_, f) => (
        <line
          key={`f${f}`}
          x1={padL + f * fretGap}
          y1={padT}
          x2={padL + f * fretGap}
          y2={padT + innerH}
          stroke="rgba(41,38,27,0.1)"
          strokeWidth={0.75}
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

interface PositionSelectProps {
  selected: number[];
  onToggle: (id: number) => void;
  selectedChordIndices: number[];
  onToggleChord: (idx: number) => void;
  onBack: () => void;
  onStart: () => void;
}

export function PositionSelect({
  selected,
  onToggle,
  selectedChordIndices,
  onToggleChord,
  onBack,
  onStart,
}: PositionSelectProps) {
  const [invert] = useState(() => {
    try {
      const stored = localStorage.getItem("arp-invert");
      return stored === null ? true : stored === "1";
    } catch {
      return true;
    }
  });

  return (
    <div className="select-page">
      <div className="select-header">
        <button className="back-btn" onClick={onBack}>
          ← back
        </button>
        <span className="select-title">Practice setup</span>
      </div>

      <div className="select-section">
        <div className="select-section-label">Chords</div>
        <div className="select-pill-row">
          {CHORDS.map((c, i) => (
            <button
              key={i}
              className={`theory-pill${selectedChordIndices.includes(i) ? " active" : ""}`}
              onClick={() => onToggleChord(i)}
            >
              {c.rank}
            </button>
          ))}
        </div>
      </div>

      <div className="select-section select-section-shapes">
        <div className="select-section-label">Positions</div>
        <div className="position-grid">
          {POSITIONS.map((pos) => {
            const isSelected = selected.includes(pos.id);
            return (
              <button
                key={pos.id}
                className={`position-card${isSelected ? " selected" : ""}`}
                onClick={() => onToggle(pos.id)}
              >
                <div className="position-card-label">{pos.label}</div>
                <ShapePreview
                  frets={pos.frets}
                  notes={pos.notes}
                  invert={invert}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="select-footer">
        <button
          className="primary-btn"
          onClick={onStart}
          disabled={selected.length === 0 || selectedChordIndices.length === 0}
        >
          Start practice
        </button>
      </div>
    </div>
  );
}
