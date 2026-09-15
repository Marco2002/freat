interface HeartsProps {
  lives: number;
  total: number;
}

const HEART =
  'M9 15.2 C9 15.2 2.2 11.1 2.2 6.6 C2.2 4.3 4 2.8 5.9 2.8 C7.2 2.8 8.4 3.5 9 4.6 C9.6 3.5 10.8 2.8 12.1 2.8 C14 2.8 15.8 4.3 15.8 6.6 C15.8 11.1 9 15.2 9 15.2 Z';

// The same outline split down the middle — the two pieces a lost heart falls
// into. Each closes along the centre line, so together they tile the whole.
const HEART_LEFT =
  'M9 4.6 C8.4 3.5 7.2 2.8 5.9 2.8 C4 2.8 2.2 4.3 2.2 6.6 C2.2 11.1 9 15.2 9 15.2 Z';
const HEART_RIGHT =
  'M9 4.6 C9.6 3.5 10.8 2.8 12.1 2.8 C14 2.8 15.8 4.3 15.8 6.6 C15.8 11.1 9 15.2 9 15.2 Z';

export function Hearts({ lives, total }: HeartsProps) {
  return (
    <div
      className="flex gap-2 items-center"
      role="status"
      aria-label={`${lives} of ${total} lives left`}
    >
      {Array.from({ length: total }, (_, i) => (
        <svg key={i} width="24" height="24" viewBox="0 0 18 18" aria-hidden="true">
          {/* The empty outline is always there; a full heart covers it. */}
          <path
            d={HEART}
            fill="none"
            stroke="var(--color-wrong)"
            strokeWidth="1.4"
            strokeLinejoin="round"
            opacity={0.28}
          />
          {/* Keying on the state is what animates both directions: when a heart
              empties React swaps this subtree and the shards mount mid-break,
              and when one refills the full heart mounts and swells in. Nothing
              needs to track which heart moved — the key change is the event. */}
          {i < lives ? (
            <g key="full">
              <path
                className="heart-restore"
                d={HEART}
                fill="var(--color-wrong)"
                stroke="var(--color-wrong)"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
            </g>
          ) : (
            <g key="broken">
              <path
                className="heart-shard heart-shard-l"
                d={HEART_LEFT}
                fill="var(--color-wrong)"
                stroke="var(--color-wrong)"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
              <path
                className="heart-shard heart-shard-r"
                d={HEART_RIGHT}
                fill="var(--color-wrong)"
                stroke="var(--color-wrong)"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
            </g>
          )}
        </svg>
      ))}
    </div>
  );
}
