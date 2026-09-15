import { CHORDS, POSITIONS } from '../lib/data';
import { BOSS_KINDS, MAX_RUSH } from '../lib/modifiers';
import type { Modifier } from '../lib/modifiers';
import { ModifierCard } from '../components/ModifierCard';
import { useInvertSetting } from '../hooks/useInvertSetting';

interface CollectionPageProps {
  onBack: () => void;
}

/**
 * Every card a run can deal, laid out by family. Nothing here is unlocked or
 * earned — it is a reference, so the player can learn what a card does before
 * a run asks them to take it in four seconds.
 */
const GROUPS: readonly { label: string; blurb: string; mods: Modifier[] }[] = [
  {
    label: 'Chords',
    blurb: 'Adds a triad to the run. The staple gift.',
    mods: CHORDS.map((_, i) => ({ kind: 'chord', chordIdx: i })),
  },
  {
    label: 'Sevenths',
    blurb: 'Upgrades a triad you already hold into its seventh.',
    mods: CHORDS.map((_, i) => ({ kind: 'seventh', chordIdx: i })),
  },
  {
    label: 'Positions',
    blurb: 'Opens another stretch of neck for the run to travel to.',
    mods: POSITIONS.map((p) => ({ kind: 'position', positionId: p.number })),
  },
  {
    label: 'Rush',
    blurb: 'Buys difficulty: every drill gets a shorter clock.',
    // Rank 0 is the starting clock, so the cards on offer begin at 1.
    mods: Array.from({ length: MAX_RUSH }, (_, i) => ({
      kind: 'rush',
      rank: i + 1,
    })),
  },
  {
    label: 'Bosses',
    blurb: 'Imposed, not chosen. Each one thins what the neck will accept.',
    mods: BOSS_KINDS.map((boss) => ({ kind: 'boss', boss })),
  },
];

export function CollectionPage({ onBack }: CollectionPageProps) {
  const [invert] = useInvertSetting();

  return (
    <div className="h-full w-full max-w-[980px] mx-auto flex flex-col gap-6 overflow-hidden px-8 pt-14 pb-8 max-sm:px-0 max-sm:pt-6 max-sm:pb-4 max-sm:gap-4">
      <div className="w-full flex items-center justify-between gap-4 max-sm:px-4">
        <button
          className="shrink-0 bg-transparent border border-ink/35 text-muted font-mono text-[10.5px] font-medium tracking-[0.12em] uppercase py-2 px-[14px] rounded-full cursor-pointer transition-all duration-150 hover:border-ink/55 hover:text-ink"
          onClick={onBack}
        >
          ← back
        </button>
        <span className="font-serif italic font-normal text-[28px] leading-none tracking-[-0.02em] text-ink">
          Collection
        </span>
      </div>

      {/* The only scroller on the screen, so the header stays put while the
          deck moves under it. */}
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-9 pb-8 max-sm:px-4">
        {GROUPS.map((group) => (
          <section key={group.label} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <h2 className="font-mono text-[10.5px] font-medium tracking-[0.16em] uppercase text-muted-light m-0">
                {group.label}
              </h2>
              <p className="font-mono text-[11px] leading-[1.5] text-muted m-0">
                {group.blurb}
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {group.mods.map((mod, i) => (
                <ModifierCard
                  key={i}
                  modifier={mod}
                  invert={invert}
                  index={i}
                  showcase
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
