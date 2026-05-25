import { useState } from 'react';
import { CHROMATIC_NOTES, CHORDS, NOTE_LABELS, getScaleNote } from '../lib/data';

interface NoteFinderTheoryProps {
  onBack: () => void;
}

export function NoteFinderTheory({ onBack }: NoteFinderTheoryProps) {
  const [keyIdx, setKeyIdx] = useState(0); // 0 = C

  return (
    <div
      className="h-full w-full max-w-[800px] mx-auto flex flex-col gap-6 overflow-hidden px-8 pt-14 max-sm:px-4 max-sm:pt-6"
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
          Scale Degrees <span className="mx-2 opacity-50">·</span> Major scale
        </div>
        <div className="shrink-0 w-[70px]" />
      </div>

      {/* Key selector */}
      <div className="flex flex-col gap-2">
        <span className="font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-light">
          Key
        </span>
        <div className="flex flex-nowrap gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {CHROMATIC_NOTES.map((note, idx) => {
            const label = NOTE_LABELS[idx];
            return (
              <button
                key={note}
                onClick={() => setKeyIdx(idx)}
                className={[
                  'shrink-0 font-mono text-[11px] font-medium tracking-[0.1em] py-[7px] px-[14px] rounded-full border-[1.5px] cursor-pointer transition-all duration-150',
                  idx === keyIdx
                    ? 'bg-ink border-ink text-sand'
                    : 'bg-transparent border-ink/[0.13] text-muted hover:border-ink/30 hover:text-ink',
                ].join(' ')}
              >
                {label.alt ? `${label.name}/${label.alt}` : label.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Scale grid */}
      <div className="flex-1 overflow-x-auto overflow-y-auto">
        <div className="grid grid-cols-[repeat(7,minmax(0,1fr))] gap-3 min-w-[420px]">
          {CHORDS.map((chord, degreeIdx) => {
            const note = getScaleNote(keyIdx, degreeIdx);
            const qualityShort = chord.quality.slice(0, 3);
            const isRoot = degreeIdx === 0;
            return (
              <div
                key={chord.rank}
                className="border border-ink/[0.1] rounded-2xl p-4 flex flex-col items-center gap-2 text-center"
              >
                <span className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-light">
                  {qualityShort}
                </span>
                <span
                  className={[
                    'font-serif italic font-normal leading-none',
                    isRoot ? 'text-amber' : 'text-ink',
                  ].join(' ')}
                  style={{ fontSize: isRoot ? '28px' : '24px' }}
                >
                  {chord.rank}
                </span>
                <span className="font-mono font-semibold text-lg text-ink leading-none">
                  {note}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
