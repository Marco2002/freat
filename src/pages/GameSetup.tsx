import { POSITIONS } from "../lib/data";
import { PositionCard } from "../components/PositionCard";
import { ChordPills } from "../components/ChordPills";
import { useInvertSetting } from "../hooks/useInvertSetting";
import { RUN_CHORDS } from "../lib/game";

interface GameSetupProps {
  positionId: number | null;
  onPickPosition: (id: number) => void;
  chordIndices: number[];
  onToggleChord: (idx: number) => void;
  onBack: () => void;
  onStart: () => void;
}

/**
 * The opening hand of a run: one position, and the chords on it the run starts
 * with. Everything beyond that is meant to be earned through modifiers, so this
 * screen deliberately allows no more than the starting roster.
 */
export function GameSetup({
  positionId,
  onPickPosition,
  chordIndices,
  onToggleChord,
  onBack,
  onStart,
}: GameSetupProps) {
  const [invert] = useInvertSetting();
  const ready = positionId !== null && chordIndices.length === RUN_CHORDS;

  return (
    <div className="h-full max-w-[560px] mx-auto px-6 pt-12 pb-8 flex flex-col gap-5 overflow-hidden max-sm:px-4 max-sm:pt-8 max-sm:pb-5">
      <div className="flex items-center gap-5">
        <button
          className="shrink-0 bg-transparent border border-ink/35 text-muted font-mono text-[10.5px] font-medium tracking-[0.12em] uppercase py-2 px-[14px] rounded-full cursor-pointer transition-all duration-150 hover:border-ink/55 hover:text-ink"
          onClick={onBack}
        >
          ← back
        </button>
        <span className="font-mono text-[11px] font-medium tracking-[0.16em] uppercase text-muted-dark">
          New run
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-mono text-[10.5px] font-medium tracking-[0.14em] uppercase text-muted-light">
            Starting chords
          </span>
          <span className="font-mono text-[10.5px] font-medium tracking-[0.14em] text-muted-light tabular-nums">
            {chordIndices.length}/{RUN_CHORDS}
          </span>
        </div>
        <ChordPills
          selected={chordIndices}
          onToggle={onToggleChord}
          max={RUN_CHORDS}
        />
      </div>

      <div className="flex flex-col gap-2.5 flex-1 overflow-hidden">
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-mono text-[10.5px] font-medium tracking-[0.14em] uppercase text-muted-light">
            Starting position
          </span>
          <span className="font-mono text-[10.5px] font-medium tracking-[0.14em] text-muted-light">
            pick one
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2.5 flex-1 overflow-y-auto overflow-x-hidden min-w-0 content-start">
          {POSITIONS.map((pos) => (
            <PositionCard
              key={pos.number}
              position={pos}
              selected={positionId === pos.number}
              invert={invert}
              onClick={() => onPickPosition(pos.number)}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-center">
        <button
          className="bg-ink text-sand border-none font-mono text-xs font-medium tracking-[0.14em] uppercase py-4 px-11 rounded-full cursor-pointer transition-opacity duration-150 hover:opacity-80 disabled:opacity-30 disabled:cursor-default"
          onClick={onStart}
          disabled={!ready}
        >
          Start run
        </button>
      </div>
    </div>
  );
}
