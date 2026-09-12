import { ShapePreview } from './ShapePreview';
import type { Position } from '../lib/data';

interface PositionCardProps {
  position: Position;
  selected: boolean;
  invert: boolean;
  onClick: () => void;
}

/**
 * One pickable position, shape and all. Shared by the practice picker (where
 * any number can be on) and the game picker (where exactly one can), so the two
 * screens cannot drift apart visually.
 */
export function PositionCard({
  position,
  selected,
  invert,
  onClick,
}: PositionCardProps) {
  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      className={`relative border-2 rounded-[14px] p-3 pb-4 cursor-pointer transition-colors duration-150 text-left flex flex-col gap-1.5 min-w-0 w-full ${
        selected
          ? 'border-amber bg-amber/15'
          : 'border-ink/35 bg-transparent hover:border-ink/60 hover:bg-ink/[0.03]'
      }`}
    >
      {/* Filled tick when in, an empty checkbox when out — the latter reads as
          "tap me", not as "unavailable". */}
      <span
        className={`absolute top-2.5 right-2.5 w-[18px] h-[18px] rounded-full flex items-center justify-center transition-colors duration-150 ${
          selected
            ? 'bg-amber border-[1.5px] border-amber'
            : 'bg-transparent border-[1.5px] border-ink/35'
        }`}
      >
        {selected && (
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
            <path
              d="M2 5.2 L4.1 7.3 L8 3"
              stroke="var(--color-sand)"
              strokeWidth="1.8"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <div className="font-serif italic font-normal text-[26px] leading-none pr-6 text-ink">
        Position {position.number}
      </div>
      <ShapePreview
        frets={position.frets}
        notes={position.notes}
        invert={invert}
      />
    </button>
  );
}
