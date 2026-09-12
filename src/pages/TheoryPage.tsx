import { useState, useMemo } from "react";
import {
  POSITIONS,
  CHORDS,
  initialPlacement,
  keyOf,
  keysOf,
  placePosition,
} from "../lib/data";
import type { Placement } from "../lib/data";
import { Fretboard } from "../components/Fretboard";
import { useIsMobile } from "../hooks/useIsMobile";
import { useInvertSetting } from "../hooks/useInvertSetting";

interface TheoryPageProps {
  onBack: () => void;
}

export function TheoryPage({ onBack }: TheoryPageProps) {
  // Which position, and where it is currently drawn. Picking a position moves
  // to whichever copy of it is nearest the neck already on screen, so stepping
  // 5 → 1 (or 1 → 5) slides to the neighbouring shape instead of the far end.
  const [place, setPlace] = useState<Placement>(() => initialPlacement(1));
  const [chordIdx, setChordIdx] = useState(0);
  const [invert, setInvert] = useInvertSetting();
  const isMobile = useIsMobile();

  const chord = CHORDS[chordIdx];

  const activeKeys = useMemo(() => keysOf(place.notes), [place]);

  const highlightedKeys = useMemo(
    () =>
      new Set(
        place.notes.filter((n) => chord.tones.includes(n.degree)).map(keyOf),
      ),
    [place, chord],
  );

  const pillClass = (active: boolean) =>
    `font-mono text-[11px] font-medium tracking-[0.1em] py-[7px] px-[14px] rounded-full cursor-pointer border-[1.5px] transition-all duration-[120ms] ${
      active
        ? "bg-ink border-ink text-sand"
        : "bg-transparent border-ink/35 text-muted hover:border-ink/55 hover:text-ink"
    }`;

  return (
    <div className="h-full w-full max-w-[880px] mx-auto flex flex-col gap-6 overflow-hidden px-8 pt-14 pb-12 max-sm:px-0 max-sm:pt-6 max-sm:pb-4 max-sm:gap-4">
      <div className="w-full max-w-[720px] flex items-center justify-between gap-4 max-sm:px-4 max-sm:max-w-full">
        <button
          className="shrink-0 bg-transparent border border-ink/35 text-muted font-mono text-[10.5px] font-medium tracking-[0.12em] uppercase py-2 px-[14px] rounded-full cursor-pointer transition-all duration-150 hover:border-ink/55 hover:text-ink"
          onClick={onBack}
        >
          ← back
        </button>
        <button
          className="inline-flex items-center gap-2 bg-transparent border border-ink/35 text-muted font-mono text-[10.5px] font-medium tracking-[0.12em] uppercase py-[7px] pl-[10px] pr-3 rounded-full cursor-pointer transition-all duration-150 hover:border-ink/55 hover:text-ink"
          onClick={() => setInvert((v) => !v)}
          title="Flip string order"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            aria-hidden="true"
            className="shrink-0 opacity-70"
          >
            <path
              d="M3 2 L3 10 M3 2 L1.5 3.5 M3 2 L4.5 3.5"
              stroke="currentColor"
              strokeWidth="1.2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M9 10 L9 2 M9 10 L7.5 8.5 M9 10 L10.5 8.5"
              stroke="currentColor"
              strokeWidth="1.2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>{invert ? "high E up" : "low E up"}</span>
        </button>
      </div>

      <div className="flex flex-col gap-2 max-sm:px-4">
        <div className="font-mono text-[10.5px] font-medium tracking-[0.14em] uppercase text-muted-light">
          Position
        </div>
        <div className="flex gap-2 flex-wrap max-sm:flex-nowrap max-sm:overflow-x-auto max-sm:[scrollbar-width:none] max-sm:[&::-webkit-scrollbar]:hidden">
          {POSITIONS.map((p) => (
            <button
              key={p.number}
              className={pillClass(place.id === p.number)}
              onClick={() => setPlace((prev) => placePosition(p, prev.frets[0]))}
            >
              {p.number}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 max-sm:px-4">
        <div className="font-mono text-[10.5px] font-medium tracking-[0.14em] uppercase text-muted-light">
          Chord
        </div>
        <div className="flex gap-2 flex-wrap max-sm:flex-nowrap max-sm:overflow-x-auto max-sm:[scrollbar-width:none] max-sm:[&::-webkit-scrollbar]:hidden">
          {CHORDS.map((c, i) => (
            <button
              key={i}
              className={pillClass(chordIdx === i)}
              onClick={() => setChordIdx(i)}
            >
              {c.rank}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-baseline gap-4 max-sm:px-4">
        <span className="font-serif italic font-normal text-[clamp(36px,6vw,56px)] leading-none tracking-[-0.02em] text-ink">
          {chord.rank}
        </span>
        <span className="font-mono text-[13px] font-medium tracking-[0.04em] text-muted">
          {chord.quality} <span className="opacity-45 mx-1">—</span>{" "}
          {chord.degrees.join("  ")}
        </span>
      </div>

      <div className="w-full flex justify-center">
        <Fretboard
          frets={place.frets}
          activeKeys={activeKeys}
          selected={highlightedKeys}
          targetKeys={new Set()}
          phase="playing"
          invert={invert}
          onToggle={() => {}}
          compact={isMobile}
        />
      </div>
    </div>
  );
}
