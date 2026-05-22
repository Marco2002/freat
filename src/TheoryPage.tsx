import { useState, useMemo, useEffect } from 'react';
import { POSITIONS, CHORDS, keyOf } from './data';
import { Fretboard } from './Fretboard';

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 640px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
}

interface TheoryPageProps {
  onBack: () => void;
}

export function TheoryPage({ onBack }: TheoryPageProps) {
  const [positionId, setPositionId] = useState(1);
  const [chordIdx, setChordIdx] = useState(0);
  const [invert, setInvert] = useState(() => {
    try { return localStorage.getItem('arp-invert') === '1'; } catch { return false; }
  });
  const isMobile = useIsMobile();

  const position = POSITIONS.find(p => p.id === positionId)!;
  const chord = CHORDS[chordIdx];

  const highlightedKeys = useMemo(
    () => new Set(position.notes.filter(n => chord.tones.includes(n.degree)).map(keyOf)),
    [positionId, chordIdx], // eslint-disable-line react-hooks/exhaustive-deps
  );

  return (
    <div className="theory-page">
      <div className="top-row">
        <button className="back-btn" onClick={onBack}>← back</button>
        <div className="drill-eyebrow">
          Theory <span className="dot">·</span> Major scale <span className="dot">·</span> C
        </div>
        <button className="flip-btn" onClick={() => setInvert(v => !v)} title="Flip string order">
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <path d="M3 2 L3 10 M3 2 L1.5 3.5 M3 2 L4.5 3.5" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9 10 L9 2 M9 10 L7.5 8.5 M9 10 L10.5 8.5" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>{invert ? 'high E up' : 'low E up'}</span>
        </button>
      </div>

      <div className="theory-selectors">
        <span className="theory-selector-label">Position</span>
        <div className="theory-pill-row">
          {POSITIONS.map(p => (
            <button
              key={p.id}
              className={`theory-pill${positionId === p.id ? ' active' : ''}`}
              onClick={() => setPositionId(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="theory-selectors">
        <span className="theory-selector-label">Chord</span>
        <div className="theory-pill-row">
          {CHORDS.map((c, i) => (
            <button
              key={i}
              className={`theory-pill${chordIdx === i ? ' active' : ''}`}
              onClick={() => setChordIdx(i)}
            >
              {c.rank}
            </button>
          ))}
        </div>
      </div>

      <div className="theory-chord-info">
        <span className="theory-chord-rank">{chord.rank}</span>
        <span className="theory-chord-meta">{chord.quality} <span className="sub-sep">—</span> {chord.degrees.join('  ')}</span>
      </div>

      <div className="board-wrap">
        <Fretboard
          frets={position.frets}
          positionNotes={position.notes}
          selected={highlightedKeys}
          targetKeys={new Set()}
          phase="playing"
          invert={invert}
          onToggle={() => {}}
          compact={isMobile}
        />
      </div>
    </div>
  );
}
