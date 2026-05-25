import { useState, useMemo, useEffect } from 'react';
import { CHORDS, POSITIONS, keyOf } from '../lib/data';
import { playChord } from '../lib/audio';
import { Fretboard } from '../components/Fretboard';
import type { Phase } from '../components/Fretboard';
import { useIsMobile } from '../hooks/useIsMobile';
import { useInvertSetting } from '../hooks/useInvertSetting';

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
  const [invert, setInvert] = useInvertSetting();
  const isMobile = useIsMobile();

  const chord = CHORDS[chordIdx];
  const currentPosition = POSITIONS.find(p => p.id === currentPositionId)!;

  const targetKeys = useMemo(
    () => new Set(currentPosition.notes.filter((n) => chord.tones.includes(n.degree)).map(keyOf)),
    [currentPositionId, chordIdx], // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
    if (phase !== 'playing') return;
    if (selected.size !== targetKeys.size) return;
    for (const k of targetKeys) if (!selected.has(k)) return;
    setPhase('success');
    setStreak((s) => s + 1);
    playChord(currentPosition.notes.filter((n) => targetKeys.has(keyOf(n))).map(({ s, f }) => ({ string: s, fret: f })));
  }, [selected, phase, targetKeys]); // eslint-disable-line react-hooks/exhaustive-deps

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
    <div
      className="h-full w-full max-w-[880px] mx-auto flex flex-col items-center gap-7 overflow-hidden px-8 pt-14 pb-12 max-sm:px-0 max-sm:pt-6 max-sm:gap-4"
      style={isMobile ? { paddingBottom: 'env(safe-area-inset-bottom, 12px)' } : undefined}
    >
      <div className="w-full max-w-[720px] flex items-center justify-between gap-4 max-sm:px-4 max-sm:max-w-full">
        <button
          className="shrink-0 bg-transparent border border-ink/15 text-muted font-mono text-[10.5px] font-medium tracking-[0.12em] uppercase py-2 px-[14px] rounded-full cursor-pointer transition-all duration-150 hover:border-ink/35 hover:text-ink"
          onClick={onBack}
        >
          ← back
        </button>
        <div className="font-mono text-[11px] font-medium tracking-[0.16em] uppercase text-muted-dark">
          Major scale <span className="mx-2 opacity-50">·</span> C <span className="mx-2 opacity-50">·</span> {currentPosition.label}
        </div>
        <button
          className="inline-flex items-center gap-2 bg-transparent border border-ink/15 text-muted font-mono text-[10.5px] font-medium tracking-[0.12em] uppercase py-[7px] pl-[10px] pr-3 rounded-full cursor-pointer transition-all duration-150 hover:border-ink/35 hover:text-ink"
          onClick={() => setInvert(v => !v)}
          title="Flip string order"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" className="shrink-0 opacity-70">
            <path d="M3 2 L3 10 M3 2 L1.5 3.5 M3 2 L4.5 3.5" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9 10 L9 2 M9 10 L7.5 8.5 M9 10 L10.5 8.5" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>{invert ? 'high E up' : 'low E up'}</span>
        </button>
      </div>

      <div className="text-center w-full flex flex-col items-center justify-center gap-4 min-h-[220px] max-sm:min-h-0 max-sm:px-4 max-sm:gap-2">
        <div className={`font-serif italic font-normal text-[clamp(110px,16vw,180px)] max-sm:text-[clamp(72px,22vw,110px)] leading-[0.85] tracking-[-0.03em] text-ink w-full transition-[color,transform] duration-[250ms] ease-in-out ${phase === 'success' ? 'text-green scale-[1.04]' : ''}`}>
          {chord.rank}
        </div>
        <div className={`font-mono text-sm font-medium tracking-[0.04em] text-green h-[18px] transition-[opacity,transform] duration-[250ms] ease-in-out ${phase === 'success' ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'}`}>
          {chord.quality} <span className="opacity-45 mx-1">—</span> {chord.degrees.join('  ')}
        </div>
      </div>

      <div className="w-full flex justify-center max-sm:order-[10]">
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

      <div
        className="w-full max-w-[720px] font-mono text-xs text-muted grid gap-4 grid-cols-2 sm:grid-cols-[1fr_auto_1fr] items-center max-sm:order-[9] max-sm:mt-auto max-sm:px-4 max-sm:max-w-full"
      >
        <div className="flex items-baseline gap-2.5 order-2 sm:order-none sm:justify-self-start">
          <span className="uppercase tracking-[0.14em] text-[10.5px] text-muted-light">streak</span>
          <span className="text-lg font-semibold text-ink tabular-nums">{String(streak).padStart(2, '0')}</span>
        </div>
        <div className="col-span-2 sm:col-span-1 text-center order-1 sm:order-none tracking-[0.02em]">
          tap every note of the&nbsp;<strong className="text-ink font-semibold">{chord.rank}</strong>&nbsp;arpeggio
        </div>
        <button
          className="order-3 sm:order-none justify-self-end bg-transparent border border-ink/15 text-muted font-mono text-[11px] font-medium tracking-[0.12em] uppercase py-2 px-[14px] rounded-full cursor-pointer transition-all duration-150 enabled:hover:border-ink/35 enabled:hover:text-ink disabled:opacity-40 disabled:cursor-default"
          onClick={skip}
          disabled={phase !== 'playing'}
        >
          skip
        </button>
      </div>
    </div>
  );
}
