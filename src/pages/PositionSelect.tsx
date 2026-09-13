import { CHORDS, POSITIONS, isSeventhIndex, seventhIndexOf } from "../lib/data";

const SEVENTH_INDICES = CHORDS.map((_, i) => seventhIndexOf(i));
import { PositionCard } from "../components/PositionCard";
import { ChordPills } from "../components/ChordPills";
import { BossPills } from "../components/BossPills";
import { Section } from "../components/Section";
import { useInvertSetting } from "../hooks/useInvertSetting";
import { hiddenDegrees } from "../lib/modifiers";
import type { BossKind } from "../lib/modifiers";

interface PositionSelectProps {
  selected: number[];
  onToggle: (id: number) => void;
  selectedChordIndices: number[];
  onToggleChord: (idx: number) => void;
  bosses: BossKind[];
  onToggleBoss: (boss: BossKind) => void;
  onBack: () => void;
  onStart: () => void;
}

export function PositionSelect({
  selected,
  onToggle,
  selectedChordIndices,
  onToggleChord,
  bosses,
  onToggleBoss,
  onBack,
  onStart,
}: PositionSelectProps) {
  const [invert] = useInvertSetting();
  const seventhCount = selectedChordIndices.filter(isSeventhIndex).length;
  // The previews show what the switched-on rules will actually leave on the
  // neck, so the picker and the drill never disagree.
  const hidden = hiddenDegrees({
    positions: [],
    roster: [],
    rushRank: 0,
    bosses,
  });

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
          Practice setup
        </span>
      </div>

      <Section title="Chords">
        <ChordPills selected={selectedChordIndices} onToggle={onToggleChord} />
      </Section>

      {/* Their own chords, switched on independently of the triads. */}
      <Section
        title="7th chords"
        collapsible
        summary={seventhCount ? `${seventhCount} on` : undefined}
      >
        <ChordPills
          selected={selectedChordIndices}
          onToggle={onToggleChord}
          indices={SEVENTH_INDICES}
        />
      </Section>

      <Section
        title="Modifiers"
        collapsible
        summary={bosses.length ? `${bosses.length} on` : undefined}
      >
        <BossPills selected={bosses} onToggle={onToggleBoss} />
      </Section>

      <div className="flex flex-col gap-2.5 flex-1 overflow-hidden">
        <div className="font-mono text-[10.5px] font-medium tracking-[0.14em] uppercase text-muted-light">
          Positions
        </div>
        <div className="grid grid-cols-2 gap-2.5 flex-1 overflow-y-auto overflow-x-hidden min-w-0 content-start">
          {POSITIONS.map((pos) => (
            <PositionCard
              key={pos.number}
              position={pos}
              selected={selected.includes(pos.number)}
              invert={invert}
              hiddenDegrees={hidden}
              onClick={() => onToggle(pos.number)}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-center">
        <button
          className="bg-ink text-sand border-none font-mono text-xs font-medium tracking-[0.14em] uppercase py-4 px-11 rounded-full cursor-pointer transition-opacity duration-150 hover:opacity-80 disabled:opacity-30 disabled:cursor-default"
          onClick={onStart}
          disabled={selected.length === 0 || selectedChordIndices.length === 0}
        >
          Start practice
        </button>
      </div>
    </div>
  );
}
