import { CHORDS, positionById } from '../lib/data';
import { RUSH_SECONDS, modifierInfo } from '../lib/modifiers';
import type { Modifier } from '../lib/modifiers';
import { ShapePreview } from './ShapePreview';

interface ModifierCardProps {
  modifier: Modifier;
  invert: boolean;
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
function Visual({ modifier, invert }: { modifier: Modifier; invert: boolean }) {
  if (modifier.kind === 'position') {
    // Pinned to the preview's own 76×52 ratio. Left to fill the card it would
    // render far taller than the other visuals and no two cards would match.
    return (
      <div className="w-[76px]">
        <ShapePreview
          frets={positionById(modifier.positionId).frets}
          notes={positionById(modifier.positionId).notes}
          invert={invert}
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
  index,
  centered = false,
  state = 'idle',
  flight,
  onChoose,
}: ModifierCardProps) {
  const { name, detail } = modifierInfo(modifier);

  return (
    <button
      onClick={(e) => onChoose(e.currentTarget)}
      disabled={state !== 'idle'}
      // One fixed ratio for every card, whatever it holds and however wide the
      // column it lands in — a deck of one shape.
      className={`modifier-card group relative block cursor-pointer aspect-[4/5] w-full sm:w-[180px] ${
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
          className={`card-face flex flex-col items-center justify-center gap-3 text-center border-2 bg-sand p-4 transition-colors duration-150 ${
            state === 'chosen'
              ? 'border-amber'
              : 'border-ink/20 group-hover:border-amber'
          }`}
        >
          {/* Fixed visual band, so a shape, a numeral and a bolt all occupy the
              same space and every card comes out the same size. */}
          <span className="w-full h-[52px] flex items-center justify-center shrink-0">
            <Visual modifier={modifier} invert={invert} />
          </span>
          <span className="flex flex-col gap-1 min-w-0">
            <span className="font-serif italic font-normal text-[22px] leading-none text-ink">
              {name}
            </span>
            <span className="font-mono text-[10.5px] leading-[1.5] tracking-[0.02em] text-muted">
              {detail}
            </span>
          </span>
        </span>
        <CardBack />
      </span>
    </button>
  );
}
