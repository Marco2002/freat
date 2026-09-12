import { CHORDS, positionById } from '../lib/data';
import type { Degree } from '../lib/data';
import { BOSS_HIDES, RUSH_SECONDS, modifierInfo } from '../lib/modifiers';
import type { Modifier } from '../lib/modifiers';
import { ShapePreview } from './ShapePreview';

interface ModifierCardProps {
  modifier: Modifier;
  invert: boolean;
  /** Degrees the rules already in force take off the neck. */
  hiddenDegrees?: readonly Degree[];
  /** Staggers the entrance so the cards land one after another. */
  index: number;
  /** Odd card out on mobile: spans both columns but keeps one column's width. */
  centered?: boolean;
  /** Where this card stands once a pick has been made. */
  state?: 'idle' | 'chosen' | 'dismissed';
  /** Pixels from this card to the middle of the screen, measured on the tap. */
  flight?: { dx: number; dy: number };
  onChoose: (el: HTMLElement) => void;
}

/** The icon at the top of a card — what the modifier does, at a glance. */
function Visual({
  modifier,
  invert,
  hiddenDegrees,
}: {
  modifier: Modifier;
  invert: boolean;
  hiddenDegrees?: readonly Degree[];
}) {
  if (modifier.kind === 'position') {
    // Pinned to the preview's own 76×52 ratio. Left to fill the card it would
    // render far taller than the other visuals and no two cards would match.
    return (
      <div className="w-[76px]">
        <ShapePreview
          frets={positionById(modifier.positionId).frets}
          notes={positionById(modifier.positionId).notes}
          invert={invert}
          hiddenDegrees={hiddenDegrees}
        />
      </div>
    );
  }

  if (modifier.kind === 'chord') {
    return (
      <div className="flex items-center justify-center">
        <span className="font-serif italic font-normal text-[44px] leading-none text-amber">
          {CHORDS[modifier.chordIdx].rank}
        </span>
      </div>
    );
  }

  if (modifier.kind === 'boss') {
    // A rule that thins the neck shows the seven degrees, with the ones it
    // takes away drawn as empty rings.
    const hides = BOSS_HIDES[modifier.boss];
    if (hides.length > 0) {
      return (
        <span className="flex items-center gap-[5px]">
          {([1, 2, 3, 4, 5, 6, 7] as const).map((d) => {
            const lit = !hides.includes(d);
            return (
              <span
                key={d}
                className={`font-mono text-[12px] font-semibold w-[17px] h-[17px] rounded-full flex items-center justify-center ${
                  lit ? 'bg-amber text-ink' : 'text-sand/25 border border-sand/20'
                }`}
              >
                {lit ? d : ''}
              </span>
            );
          })}
        </span>
      );
    }

    // No Mistakes: a skull.
    return (
      <svg width="42" height="42" viewBox="0 0 42 42" aria-hidden="true">
        <path
          d="M21 4 C12 4 6 10.5 6 19 C6 24 8.5 27 11 28.8 L11 33 C11 35.2 12.8 37 15 37 L27 37 C29.2 37 31 35.2 31 33 L31 28.8 C33.5 27 36 24 36 19 C36 10.5 30 4 21 4 Z"
          fill="var(--color-wrong)"
        />
        <circle cx="15.2" cy="19.5" r="3.6" fill="var(--color-ink)" />
        <circle cx="26.8" cy="19.5" r="3.6" fill="var(--color-ink)" />
        <path
          d="M21 25.5 L19 29.5 L23 29.5 Z"
          fill="var(--color-ink)"
        />
        <path
          d="M17 33 L17 37 M21 33 L21 37 M25 33 L25 37"
          stroke="var(--color-ink)"
          strokeWidth="1.6"
        />
      </svg>
    );
  }

  // Rush: a bolt, with the clock it leaves you spelled out beside it.
  return (
    <div className="flex items-center justify-center gap-2">
      <svg width="26" height="34" viewBox="0 0 26 34" aria-hidden="true">
        <path
          d="M15.5 2 L5 19 h6.5 L9.5 32 L21 14 h-6.8 Z"
          fill="var(--color-wrong)"
          stroke="var(--color-wrong)"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
      <span className="font-mono text-[22px] font-semibold text-wrong tabular-nums">
        {RUSH_SECONDS[modifier.rank]}s
      </span>
    </div>
  );
}

/** The app's mark, used as the pattern on the back of every card. */
function CardBack() {
  return (
    <span className="card-face card-back bg-ink flex items-center justify-center overflow-hidden">
      <svg
        viewBox="0 0 200 220"
        className="w-[58%] h-auto"
        aria-hidden="true"
        opacity={0.17}
      >
        <path
          fill="var(--color-sand)"
          d="M 86,0 L 86,52 C 62,52 38,68 38,86 C 36,106 52,118 62,122 C 52,126 28,146 28,170 C 28,198 64,222 100,218 C 136,222 172,198 172,170 C 172,146 148,126 138,122 C 148,118 164,106 162,86 C 162,68 138,52 114,52 L 114,0 Z"
        />
        {/* The sound hole is cut back to the card, not filled over. */}
        <circle cx="100" cy="148" r="22" fill="var(--color-ink)" />
      </svg>
    </span>
  );
}

export function ModifierCard({
  modifier,
  invert,
  hiddenDegrees,
  index,
  centered = false,
  state = 'idle',
  flight,
  onChoose,
}: ModifierCardProps) {
  const { name, detail } = modifierInfo(modifier);
  // A boss is imposed, not offered: dark card, no hover, nothing to click.
  const isBoss = modifier.kind === 'boss';

  return (
    <button
      onClick={(e) => onChoose(e.currentTarget)}
      disabled={state !== 'idle' || isBoss}
      // One fixed ratio for every card, whatever it holds and however wide the
      // column it lands in — a deck of one shape.
      className={`modifier-card group relative block aspect-[4/5] w-full sm:w-[180px] ${
        isBoss ? 'cursor-default' : 'cursor-pointer'
      } ${
        centered ? 'max-sm:col-span-2 max-sm:w-[calc(50%-6px)] max-sm:mx-auto' : ''
      } ${state === 'chosen' ? 'card-chosen' : ''} ${
        state === 'dismissed' ? 'card-dismissed' : ''
      }`}
      style={{
        ["--card-delay" as string]: `${index * 90}ms`,
        ["--dx" as string]: `${flight?.dx ?? 0}px`,
        ["--dy" as string]: `${flight?.dy ?? 0}px`,
      }}
    >
      {/* The turning part. The flight lives on the button outside it. */}
      <span className="card-spinner">
        <span
          className={`card-face flex flex-col items-center justify-center gap-3 text-center border-2 p-4 transition-colors duration-150 ${
            isBoss
              ? 'bg-ink border-wrong'
              : state === 'chosen'
                ? 'bg-sand border-amber'
                : 'bg-sand border-ink/20 group-hover:border-amber'
          }`}
        >
          {/* Fixed visual band, so a shape, a numeral and a bolt all occupy the
              same space and every card comes out the same size. */}
          <span className="w-full h-[52px] flex items-center justify-center shrink-0">
            <Visual
              modifier={modifier}
              invert={invert}
              hiddenDegrees={hiddenDegrees}
            />
          </span>
          <span className="flex flex-col gap-1 min-w-0">
            <span
              className={`font-serif italic font-normal text-[22px] leading-none ${
                isBoss ? 'text-sand' : 'text-ink'
              }`}
            >
              {name}
            </span>
            <span
              className={`font-mono text-[10.5px] leading-[1.5] tracking-[0.02em] ${
                isBoss ? 'text-sand/70' : 'text-muted'
              }`}
            >
              {detail}
            </span>
          </span>
        </span>
        <CardBack />
      </span>
    </button>
  );
}
