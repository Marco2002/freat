import { useState, useMemo, useEffect } from "react";
import {
  CHORDS,
  chordKeysIn,
  initialPlacement,
  keysOf,
  slotKeysIn,
  nextPlacement,
  positionById,
} from "../lib/data";
import type { Placement } from "../lib/data";
import { playChord } from "../lib/audio";
import { Fretboard } from "../components/Fretboard";
import type { Phase } from "../components/Fretboard";
import { hiddenDegrees } from "../lib/modifiers";
import type { BossKind } from "../lib/modifiers";
import { useIsMobile } from "../hooks/useIsMobile";
import { useInvertSetting } from "../hooks/useInvertSetting";

function pickNextChord(prevIdx: number, available: number[]): number {
  if (available.length === 1) return available[0];
  let next: number;
  do {
    next = available[Math.floor(Math.random() * available.length)];
  } while (next === prevIdx);
  return next;
}

interface ArpeggioDrillProps {
  selectedPositionIds: number[];
  selectedChordIndices: number[];
  /** Boss rules switched on for this practice session. */
  bosses: BossKind[];
  onBack: () => void;
}

/** How long a cleared drill is held before the next one deals itself. */
const SUCCESS_MS = 800;

/** Why a drill stopped, when it did not go right. */
type Miss = "wrong" | "skipped";

export function ArpeggioDrill({
  selectedPositionIds,
  selectedChordIndices,
  bosses,
  onBack,
}: ArpeggioDrillProps) {
  const [chordIdx, setChordIdx] = useState(
    () =>
      selectedChordIndices[
        Math.floor(Math.random() * selectedChordIndices.length)
      ],
  );
  const [place, setPlace] = useState<Placement>(() =>
    initialPlacement(
      selectedPositionIds[
        Math.floor(Math.random() * selectedPositionIds.length)
      ],
    ),
  );
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [phase, setPhase] = useState<Phase>("playing");
  // Set alongside the reveal, so the banner can say what went wrong and only a
  // real mistake gets the flash.
  const [miss, setMiss] = useState<Miss | null>(null);
  const [streak, setStreak] = useState(0);
  const [invert, setInvert] = useInvertSetting();
  const isMobile = useIsMobile();

  const chord = CHORDS[chordIdx];
  // The shape as it is really fingered, whatever octave it is drawn in. Audio
  // reads from here, so a note sounds at its own pitch however far the board has
  // rotated.
  const position = positionById(place.id);

  // Practice has no loadout of its own — the switched-on rules stand in for one.
  const hidden = useMemo(
    () => hiddenDegrees({ positions: [], roster: [], rushRank: 0, bosses }),
    [bosses],
  );

  const activeKeys = useMemo(
    () => (hidden.length ? slotKeysIn(place.frets) : keysOf(place.notes)),
    [place, hidden],
  );

  const targetKeys = useMemo(
    () => chordKeysIn(place.notes, chord),
    [place, chord],
  );


  useEffect(() => {
    if (phase !== "playing") return;
    if (selected.size !== targetKeys.size) return;
    for (const k of targetKeys) if (!selected.has(k)) return;
    setPhase("success");
    setStreak((s) => s + 1);
    playChord(
      position.notes
        .filter((n) => chord.tones.includes(n.degree))
        .map(({ s, f }) => ({ string: s, fret: f })),
    );
  }, [selected, phase, targetKeys]); // eslint-disable-line react-hooks/exhaustive-deps

  const nextDrill = () => {
    setChordIdx((idx) => pickNextChord(idx, selectedChordIndices));
    setPlace((p) => nextPlacement(p, selectedPositionIds));
    setSelected(new Set());
    setMiss(null);
    setPhase("playing");
  };

  // A cleared drill rolls on by itself; a missed one waits, so the answer can
  // be read off the neck before it disappears.
  useEffect(() => {
    if (phase !== "success") return;
    const t = setTimeout(nextDrill, SUCCESS_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, selectedPositionIds, selectedChordIndices]);

  const toggle = (key: string) => {
    if (phase !== "playing") return;
    // No Mistakes, switched on in practice setup: a note outside the arpeggio
    // ends the drill. There are no lives here, so the streak is the cost.
    if (!targetKeys.has(key) && bosses.includes("strict")) {
      setPhase("reveal");
      setMiss("wrong");
      setStreak(0);
      setSelected((prev) => new Set(prev).add(key));
      return;
    }
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  // Skipping shows the answer too — the point of giving up on one is to see it.
  const skip = () => {
    if (phase !== "playing") return;
    setStreak(0);
    setPhase("reveal");
    setMiss("skipped");
  };

  return (
    <div className="h-full w-full max-w-[880px] mx-auto flex flex-col items-center gap-7 overflow-hidden px-8 pt-14 pb-12 max-sm:px-0 max-sm:pt-6 max-sm:pb-4 max-sm:gap-4">
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

      <div className="text-center w-full flex flex-col items-center justify-center gap-4 min-h-[220px] max-sm:min-h-0 max-sm:px-4 max-sm:gap-2">
        <div
          className={`font-serif italic font-normal text-[clamp(110px,16vw,180px)] max-sm:text-[clamp(72px,22vw,110px)] leading-[0.85] tracking-[-0.03em] w-full transition-[color,transform] duration-[250ms] ease-in-out ${
            phase === "success"
              ? "text-green scale-[1.04]"
              : miss === "wrong"
                ? "text-wrong"
                : phase === "reveal"
                  ? "text-muted-dark"
                  : "text-ink"
          }`}
        >
          {chord.rank}
        </div>
        <div
          className={`font-mono text-sm font-medium tracking-[0.04em] h-[18px] transition-[opacity,transform] duration-[250ms] ease-in-out ${
            phase === "playing"
              ? "opacity-0 -translate-y-1"
              : "opacity-100 translate-y-0"
          } ${
            miss === "wrong"
              ? "text-wrong"
              : miss === "skipped"
                ? "text-muted"
                : "text-green"
          }`}
        >
          {miss === "wrong" ? (
            "not in the arpeggio"
          ) : miss === "skipped" ? (
            "here it is"
          ) : (
            <>
              {chord.quality} <span className="opacity-45 mx-1">—</span>{" "}
              {chord.degrees.join("  ")}
            </>
          )}
        </div>
      </div>

      {/* A mistake, not merely a miss: the screen flashes with the wiggle. */}
      {miss === "wrong" && (
        <div className="panic-flash fixed inset-0 z-10" aria-hidden="true" />
      )}

      <div className="w-full flex justify-center max-sm:order-[10]">
        <Fretboard
          frets={place.frets}
          activeKeys={activeKeys}
          selected={selected}
          targetKeys={targetKeys}
          phase={phase}
          invert={invert}
          hiddenDegrees={hidden}
          onToggle={toggle}
          compact={isMobile}
        />
      </div>

      <div
        className={`w-full max-w-[720px] font-mono text-xs text-muted grid items-center max-sm:order-[9] max-sm:mt-auto max-sm:px-4 max-sm:max-w-full ${
          phase === "reveal"
            ? "grid-cols-[1fr_auto_1fr] gap-3"
            : "grid-cols-2 sm:grid-cols-[1fr_auto_1fr] gap-4"
        }`}
      >
        <div
          className={`flex items-baseline gap-2.5 sm:order-none sm:justify-self-start ${
            phase === "reveal" ? "order-1" : "order-2"
          }`}
        >
          <span className="uppercase tracking-[0.14em] text-[10.5px] text-muted-light">
            streak
          </span>
          <span className="text-lg font-semibold text-ink tabular-nums">
            {String(streak).padStart(2, "0")}
          </span>
        </div>
        <div
          className={`flex justify-center sm:order-none sm:col-span-1 tracking-[0.02em] text-center ${
            phase === "reveal" ? "order-2" : "col-span-2 order-1"
          }`}
        >
          {phase === "reveal" ? (
            <button
              className="bg-ink text-sand border border-ink font-mono text-[11px] font-medium tracking-[0.12em] uppercase py-2 px-[14px] rounded-full cursor-pointer transition-opacity duration-150 hover:opacity-80"
              onClick={nextDrill}
              autoFocus
            >
              continue →
            </button>
          ) : (
            <span>
              tap every note of the&nbsp;
              <strong className="text-ink font-semibold">{chord.rank}</strong>
              &nbsp;arpeggio
            </span>
          )}
        </div>
        <button
          className="order-3 sm:order-none justify-self-end bg-transparent border border-ink/35 text-muted font-mono text-[11px] font-medium tracking-[0.12em] uppercase py-2 px-[14px] rounded-full cursor-pointer transition-all duration-150 enabled:hover:border-ink/55 enabled:hover:text-ink disabled:opacity-40 disabled:cursor-default"
          onClick={skip}
          disabled={phase !== "playing"}
        >
          skip
        </button>
      </div>
    </div>
  );
}
