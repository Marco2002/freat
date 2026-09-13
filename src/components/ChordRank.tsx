import { splitRank } from '../lib/data';

interface ChordRankProps {
  rank: string;
  /** Extra classes for the extension, e.g. to soften it at large sizes. */
  suffixClassName?: string;
}

/**
 * A chord's rank with its extension picked out in red — `V` stays ink, the `7`
 * does not. At a glance the colour says how many notes you are looking for.
 */
export function ChordRank({ rank, suffixClassName = '' }: ChordRankProps) {
  const { stem, suffix } = splitRank(rank);
  return (
    <>
      {stem}
      {suffix && (
        <span className={`text-seventh ${suffixClassName}`}>{suffix}</span>
      )}
    </>
  );
}
