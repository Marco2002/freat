import { CHORDS } from '../lib/data';

interface ChordPillsProps {
  selected: number[];
  onToggle: (idx: number) => void;
  /** When set, no more than this many can be on at once. */
  max?: number;
}

export function ChordPills({ selected, onToggle, max }: ChordPillsProps) {
  const full = max !== undefined && selected.length >= max;

  return (
    <div className="flex gap-2 flex-wrap">
      {CHORDS.map((c, i) => {
        const isOn = selected.includes(i);
        // At the cap the remaining chords really are unavailable until one is
        // dropped, so they say so rather than failing silently on a tap.
        const locked = full && !isOn;
        return (
          <button
            key={i}
            onClick={() => onToggle(i)}
            disabled={locked}
            aria-pressed={isOn}
            className={`font-mono text-[11px] font-medium tracking-[0.1em] py-[7px] px-[14px] rounded-full border-[1.5px] transition-all duration-[120ms] ${
              isOn
                ? 'bg-ink border-ink text-sand cursor-pointer'
                : locked
                  ? 'bg-transparent border-ink/15 text-ink/25 cursor-default'
                  : 'bg-transparent border-ink/35 text-muted hover:border-ink/55 hover:text-ink cursor-pointer'
            }`}
          >
            {c.rank}
          </button>
        );
      })}
    </div>
  );
}
