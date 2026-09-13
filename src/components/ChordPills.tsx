import { ALL_CHORDS, CHORDS } from '../lib/data';
import { ChordRank } from './ChordRank';

interface ChordPillsProps {
  selected: number[];
  onToggle: (idx: number) => void;
  /** Which chords to offer, as ALL_CHORDS indices. Defaults to the triads. */
  indices?: number[];
  /** When set, no more than this many can be on at once. */
  max?: number;
}

export function ChordPills({
  selected,
  onToggle,
  indices,
  max,
}: ChordPillsProps) {
  const full = max !== undefined && selected.length >= max;
  const shown = indices ?? CHORDS.map((_, i) => i);

  return (
    <div className="flex gap-2 flex-wrap">
      {shown.map((i) => {
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
            <ChordRank rank={ALL_CHORDS[i].rank} />
          </button>
        );
      })}
    </div>
  );
}
