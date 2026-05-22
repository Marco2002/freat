import { useState, useMemo, useEffect } from 'react';
import { CHORDS, POSITIONS, keyOf } from './data';
import { playChord } from './audio';
import { Fretboard } from './Fretboard';
import type { Phase } from './Fretboard';

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

function pickNextChord(prevIdx: number, available: number[]): number {
  if (available.length === 1) return available[0];
  let next: number;
  do { next = available[Math.floor(Math.random() * available.length)]; }
  while (next === prevIdx);
  return next;
}

function pickPosition(ids: number[]): number {
  return ids[Math.floor(Math.random() * ids.length)];
}

interface ArpeggioDrillProps {
  selectedPositionIds: number[];
  selectedChordIndices: number[];
  onBack: () => void;
}

export function ArpeggioDrill({ selectedPositionIds, selectedChordIndices, onBack }: ArpeggioDrillProps) {
  const [chordIdx, setChordIdx] = useState(() =>
    selectedChordIndices[Math.floor(Math.random() * selectedChordIndices.length)]
  );
  const [currentPositionId, setCurrentPositionId] = useState(() => pickPosition(selectedPositionIds));
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [phase, setPhase] = useState<Phase>('playing');
  const [streak, setStreak] = useState(0);
  const isMobile = useIsMobile();

  const [invert, setInvert] = useState(() => {
    try {
      const stored = localStorage.getItem('arp-invert');
      return stored === null ? true : stored === '1';
    } catch { return true; }
  });

  useEffect(() => {
    try { localStorage.setItem('arp-invert', invert ? '1' : '0'); } catch { /* noop */ }
  }, [invert]);

  const chord = CHORDS[chordIdx];
  const currentPosition = POSITIONS.find(p => p.id === currentPositionId)!;

  const targetKeys = useMemo(
    () => new Set(currentPosition.notes.filter((n) => chord.tones.includes(n.degree)).map(keyOf)),
    [currentPositionId, chordIdx], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Detect when the player has tapped exactly the right notes
  useEffect(() => {
    if (phase !== 'playing') return;
    if (selected.size !== targetKeys.size) return;
    for (const k of targetKeys) if (!selected.has(k)) return;
    setPhase('success');
    setStreak((s) => s + 1);
    playChord(currentPosition.notes.filter((n) => targetKeys.has(keyOf(n))).map(({ s, f }) => ({ string: s, fret: f })));
  }, [selected, phase, targetKeys]); // eslint-disable-line react-hooks/exhaustive-deps

  // Advance to next chord + pick new position after the success flash
  useEffect(() => {
    if (phase !== 'success') return;
    const t = setTimeout(() => {
      setChordIdx((idx) => pickNextChord(idx, selectedChordIndices));
      setCurrentPositionId(pickPosition(selectedPositionIds));
      setSelected(new Set());
      setPhase('playing');
    }, 1000);
    return () => clearTimeout(t);
  }, [phase, selectedPositionIds, selectedChordIndices]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (key: string) => {
    if (phase !== 'playing') return;
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const skip = () => {
    if (phase !== 'playing') return;
    setStreak(0);
    setChordIdx((idx) => pickNextChord(idx, selectedChordIndices));
    setCurrentPositionId(pickPosition(selectedPositionIds));
    setSelected(new Set());
  };

  return (
    <div className="drill">
      <div className="top-row">
        <button className="back-btn" onClick={onBack}>← back</button>
        <div className="drill-eyebrow">
          Major scale <span className="dot">·</span> C <span className="dot">·</span> {currentPosition.label}
        </div>
        <button className="flip-btn" onClick={() => setInvert((v) => !v)} title="Flip string order">
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <path d="M3 2 L3 10 M3 2 L1.5 3.5 M3 2 L4.5 3.5" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9 10 L9 2 M9 10 L7.5 8.5 M9 10 L10.5 8.5" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>{invert ? 'high E up' : 'low E up'}</span>
        </button>
      </div>

      <div className="prompt">
        <div className={`rank${phase === 'success' ? ' rank-success' : ''}`}>
          {chord.rank}
        </div>
        <div className={`sub${phase === 'success' ? ' sub-visible' : ''}`}>
          {chord.quality} <span className="sub-sep">—</span> {chord.degrees.join('  ')}
        </div>
      </div>

      <div className="board-wrap">
        <Fretboard
          frets={currentPosition.frets}
          positionNotes={currentPosition.notes}
          selected={selected}
          targetKeys={targetKeys}
          phase={phase}
          invert={invert}
          onToggle={toggle}
          compact={isMobile}
        />
      </div>

      <div className="meta-row">
        <div className="meta-left">
          <span className="meta-label">streak</span>
          <span className="meta-value">{String(streak).padStart(2, '0')}</span>
        </div>
        <div className="meta-center">
          tap every note of the&nbsp;<strong>{chord.rank}</strong>&nbsp;arpeggio
        </div>
        <button className="skip-btn" onClick={skip} disabled={phase !== 'playing'}>
          skip
        </button>
      </div>
    </div>
  );
}
