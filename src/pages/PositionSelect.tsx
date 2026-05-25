import { POSITIONS, CHORDS } from '../lib/data';
import { ShapePreview } from '../components/ShapePreview';
import { useInvertSetting } from '../hooks/useInvertSetting';

interface PositionSelectProps {
  selected: number[];
  onToggle: (id: number) => void;
  selectedChordIndices: number[];
  onToggleChord: (idx: number) => void;
  onBack: () => void;
  onStart: () => void;
}

export function PositionSelect({
  selected,
  onToggle,
  selectedChordIndices,
  onToggleChord,
  onBack,
  onStart,
}: PositionSelectProps) {
  const [invert] = useInvertSetting();

  return (
    <div
      className="h-full max-w-[560px] mx-auto px-6 pt-12 flex flex-col gap-5 overflow-hidden max-sm:px-4 max-sm:pt-8"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 32px)' }}
    >
      <div className="flex items-center gap-5">
        <button
          className="shrink-0 bg-transparent border border-ink/15 text-muted font-mono text-[10.5px] font-medium tracking-[0.12em] uppercase py-2 px-[14px] rounded-full cursor-pointer transition-all duration-150 hover:border-ink/35 hover:text-ink"
          onClick={onBack}
        >
          ← back
        </button>
        <span className="font-mono text-[11px] font-medium tracking-[0.16em] uppercase text-muted-dark">
          Practice setup
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="font-mono text-[10.5px] font-medium tracking-[0.14em] uppercase text-muted-light">
          Chords
        </div>
        <div className="flex gap-2 flex-wrap">
          {CHORDS.map((c, i) => (
            <button
              key={i}
              onClick={() => onToggleChord(i)}
              className={`font-mono text-[11px] font-medium tracking-[0.1em] py-[7px] px-[14px] rounded-full cursor-pointer border-[1.5px] transition-all duration-[120ms] ${
                selectedChordIndices.includes(i)
                  ? 'bg-ink border-ink text-sand'
                  : 'bg-transparent border-ink/13 text-muted hover:border-ink/30 hover:text-ink'
              }`}
            >
              {c.rank}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2.5 flex-1 overflow-hidden">
        <div className="font-mono text-[10.5px] font-medium tracking-[0.14em] uppercase text-muted-light">
          Positions
        </div>
        <div className="grid grid-cols-2 gap-2.5 flex-1 overflow-y-auto overflow-x-hidden min-w-0 content-start">
          {POSITIONS.map((pos) => {
            const isSelected = selected.includes(pos.id);
            return (
              <button
                key={pos.id}
                onClick={() => onToggle(pos.id)}
                className={`border-[1.5px] rounded-[14px] p-3 pb-4 cursor-pointer transition-colors duration-150 bg-transparent text-left flex flex-col gap-1.5 min-w-0 w-full ${
                  isSelected
                    ? 'border-amber bg-amber/[0.07]'
                    : 'border-ink/13 hover:border-ink/30'
                }`}
              >
                <div className="font-serif italic font-normal text-[26px] leading-none text-ink">
                  {pos.label}
                </div>
                <ShapePreview frets={pos.frets} notes={pos.notes} invert={invert} />
              </button>
            );
          })}
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
