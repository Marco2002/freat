import { useState, useEffect } from 'react';
import { CHROMATIC_NOTES, CHORDS, NOTE_LABELS, getScaleNote } from '../lib/data';
import { playNoteByIndex } from '../lib/audio';

type Phase = 'playing' | 'success' | 'wrong';

function pickRandom(max: number, exclude?: number): number {
  if (max === 1) return 0;
  let next: number;
  do {
    next = Math.floor(Math.random() * max);
  } while (next === exclude);
  return next;
}

interface NoteFinderDrillProps {
  onBack: () => void;
}

export function NoteFinderDrill({ onBack }: NoteFinderDrillProps) {
  const [keyIdx, setKeyIdx] = useState(() => Math.floor(Math.random() * 12));
  const [degreeIdx, setDegreeIdx] = useState(() => Math.floor(Math.random() * 7));
  const [selectedNote, setSelectedNote] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>('playing');
  const [streak, setStreak] = useState(0);

  const correctNote = getScaleNote(keyIdx, degreeIdx);
  const correctNoteIdx = CHROMATIC_NOTES.indexOf(correctNote);
  const chord = CHORDS[degreeIdx];

  useEffect(() => {
    if (phase === 'success') {
      const t = setTimeout(() => {
        setKeyIdx(prev => pickRandom(12, prev));
        setDegreeIdx(prev => pickRandom(7, prev));
        setSelectedNote(null);
        setPhase('playing');
      }, 1000);
      return () => clearTimeout(t);
    }
    if (phase === 'wrong') {
      const t = setTimeout(() => {
        setSelectedNote(null);
        setPhase('playing');
      }, 400);
      return () => clearTimeout(t);
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleNotePress(noteIdx: number) {
    if (phase !== 'playing') return;
    setSelectedNote(noteIdx);
    if (noteIdx === correctNoteIdx) {
      playNoteByIndex(noteIdx);
      setStreak(s => s + 1);
      setPhase('success');
    } else {
      setStreak(0);
      setPhase('wrong');
    }
  }

  function handleSkip() {
    if (phase !== 'playing') return;
    setStreak(0);
    setKeyIdx(prev => pickRandom(12, prev));
    setDegreeIdx(prev => pickRandom(7, prev));
    setSelectedNote(null);
  }

  return (
    <div
      className="h-full w-full max-w-[600px] mx-auto flex flex-col gap-6 overflow-hidden px-8 pt-14 max-sm:px-4 max-sm:pt-6 max-sm:gap-4"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 48px)' }}
    >
      {/* Top row */}
      <div className="w-full flex items-center justify-between gap-4">
        <button
          className="shrink-0 bg-transparent border border-ink/15 text-muted font-mono text-[10.5px] font-medium tracking-[0.12em] uppercase py-2 px-[14px] rounded-full cursor-pointer transition-all duration-150 hover:border-ink/35 hover:text-ink"
          onClick={onBack}
        >
          ← back
        </button>
        <div className="font-mono text-[11px] font-medium tracking-[0.16em] uppercase text-muted-dark">
          Note Finder <span className="mx-2 opacity-50">·</span> Major scale
        </div>
        <div className="shrink-0 w-[70px]" />
      </div>

      {/* Prompt */}
      <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center">
        <div
          className={`font-serif italic font-normal leading-[0.85] tracking-[-0.03em] text-ink w-full transition-[color,transform] duration-[250ms] ease-in-out ${phase === 'success' ? 'text-green scale-[1.04]' : ''}`}
          style={{ fontSize: 'clamp(90px, 18vw, 150px)' }}
        >
          {chord.rank.toUpperCase()}
        </div>
        <div className="font-mono text-sm font-medium tracking-[0.12em] uppercase text-muted-dark">
          in{' '}
          <span className="text-amber font-bold not-italic">
            {NOTE_LABELS[keyIdx].name}
            {NOTE_LABELS[keyIdx].alt && `/${NOTE_LABELS[keyIdx].alt}`}
          </span>
        </div>
        <div
          className={`font-mono text-sm font-medium text-green h-[18px] transition-[opacity,transform] duration-[250ms] ease-in-out ${phase === 'success' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}`}
        >
          {correctNote} <span className="opacity-45 mx-1">—</span> {chord.quality}
        </div>
      </div>

      {/* 12 note buttons */}
      <div className={`grid grid-cols-4 gap-2 w-full ${phase !== 'playing' ? 'pointer-events-none' : ''}`}>
        {CHROMATIC_NOTES.map((note, idx) => {
          const isCorrect = phase === 'success' && idx === correctNoteIdx;
          const isWrong = phase === 'wrong' && idx === selectedNote;
          const label = NOTE_LABELS[idx];
          return (
            <button
              key={note}
              onClick={() => handleNotePress(idx)}
              className={[
                'border-[1.5px] rounded-xl py-3 flex flex-col items-center cursor-pointer transition-all duration-[120ms]',
                isCorrect
                  ? 'bg-green border-green text-sand'
                  : isWrong
                  ? 'bg-wrong border-wrong text-sand'
                  : 'border-ink/[0.13] text-ink hover:border-ink/30 hover:bg-ink/[0.04]',
              ].join(' ')}
            >
              <span className="font-serif italic text-[22px] leading-none">{label.name}</span>
              {label.alt && (
                <span className="font-mono text-[9px] font-medium tracking-[0.06em] opacity-55 mt-0.5 not-italic">
                  {label.alt}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Meta row */}
      <div className="w-full grid grid-cols-[1fr_auto] items-center">
        <div className="flex items-baseline gap-2.5">
          <span className="font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-light">
            streak
          </span>
          <span className="text-lg font-semibold text-ink tabular-nums">
            {String(streak).padStart(2, '0')}
          </span>
        </div>
        <button
          className="bg-transparent border border-ink/15 text-muted font-mono text-[11px] font-medium tracking-[0.12em] uppercase py-2 px-[14px] rounded-full cursor-pointer transition-all duration-150 enabled:hover:border-ink/35 enabled:hover:text-ink disabled:opacity-40 disabled:cursor-default"
          onClick={handleSkip}
          disabled={phase !== 'playing'}
        >
          skip
        </button>
      </div>
    </div>
  );
}
