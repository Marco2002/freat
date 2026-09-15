import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  ALL_CHORDS,
  ascendingKeys,
  chordKeysIn,
  keysOf,
  positionById,
  slotKeysIn,
} from "../lib/data";
import { playChord, playTick } from "../lib/audio";
import {
  MODIFIER_INTERVAL,
  isMiss,
  PANIC_SECONDS,
  RUN_LIVES,
  clockColor,
  drillMs,
  initialRun,
  remainingMs,
  runReducer,
} from "../lib/game";
import type { RunState } from "../lib/game";
import { hiddenDegrees, modifierId } from "../lib/modifiers";
import type { Modifier } from "../lib/modifiers";
import { Fretboard } from "../components/Fretboard";
import { Hearts } from "../components/Hearts";
import { ChordRank } from "../components/ChordRank";
import { ModifierCard } from "../components/ModifierCard";
import { useIsMobile } from "../hooks/useIsMobile";
import { useInvertSetting } from "../hooks/useInvertSetting";

/** How long a cleared drill is held before the next one deals itself. */
const SUCCESS_MS = 800;

interface ArpeggioGameProps {
  positionId: number;
  chordIndices: number[];
  onQuit: () => void;
  onPlayAgain: () => void;
  onMenu: () => void;
}

export function ArpeggioGame({
  positionId,
  chordIndices,
  onQuit,
  onPlayAgain,
  onMenu,
}: ArpeggioGameProps) {
  const [run, dispatch] = useReducer(
    runReducer,
    { positionId, chordIndices },
    ({ positionId: p, chordIndices: c }) => initialRun(p, c, Date.now()),
  );
  const [now, setNow] = useState(() => Date.now());
  // The last whole second a tick was sounded for, so the 100ms clock does not
  // fire ten blips a second.
  const tickedAt = useRef<number | null>(null);
  const [invert, setInvert] = useInvertSetting();
  const isMobile = useIsMobile();

  // A run starts on one position; taking a position modifier widens the pool it
  // draws from, and the neck slides between them as it does in practice.
  const place = run.place;
  const position = positionById(place.id);
  // The roster holds triads and sevenths alike, so this is simply a lookup.
  const chord = ALL_CHORDS[run.chordIdx];

  const hidden = hiddenDegrees(run);
  // With notes taken off the neck, every fret in the window is in play.
  const activeKeys = useMemo(
    () => (hidden.length ? slotKeysIn(place.frets) : keysOf(place.notes)),
    [place, hidden],
  );
  const targetKeys = useMemo(
    () => chordKeysIn(place.notes, chord),
    [place, chord],
  );

  // The note In Order is waiting for: the lowest of the arpeggio not yet down.
  const nextKey = useMemo(
    () => ascendingKeys(place.notes, targetKeys).find((k) => !run.selected.has(k)),
    [place, targetKeys, run.selected],
  );

  const live = run.stage === "running" && run.phase === "playing";

  // The clock only ticks on a live drill, so the success beat and the modifier
  // pause do not eat into the next one.
  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [live]);

  const leftMs = remainingMs(run, now);

  useEffect(() => {
    if (!live || leftMs > 0) return;
    dispatch({ type: "expired" });
  }, [live, leftMs]);

  // Solved when every target note is tapped and nothing else is.
  useEffect(() => {
    if (!live) return;
    if (run.selected.size !== targetKeys.size) return;
    for (const k of targetKeys) if (!run.selected.has(k)) return;
    dispatch({ type: "solved" });
    playChord(
      position.notes
        .filter((n) => chord.tones.includes(n.degree))
        .map(({ s, f }) => ({ string: s, fret: f })),
    );
  }, [live, run.selected, targetKeys]); // eslint-disable-line react-hooks/exhaustive-deps

  // A cleared drill rolls on by itself. A missed one waits for the player: the
  // arpeggio they were after stays on the neck until they say go.
  useEffect(() => {
    if (run.phase !== "success" || run.stage !== "running") return;
    const t = setTimeout(
      () => dispatch({ type: "advance", at: Date.now() }),
      SUCCESS_MS,
    );
    return () => clearTimeout(t);
  }, [run.phase, run.stage]);

  const missed = run.stage === "running" && isMiss(run.phase);
  // A rule was broken, as opposed to the clock simply running out.
  const mistake = run.phase === "wrong" || run.phase === "disorder";

  const secondsLeft = Math.ceil(leftMs / 1000);
  const fraction = leftMs / drillMs(run);
  // Exactly PANIC_SECONDS warnings, one a second, the last a second before the
  // drill expires. Bounded below by 1 so the moment of running out is the
  // silence after the third flash, not a fourth.
  const warning =
    live && secondsLeft <= PANIC_SECONDS && secondsLeft >= 1
      ? secondsLeft
      : null;

  // One blip per warning, climbing in pitch as it runs down. Sounding it off
  // the same value the flash is keyed on is what keeps the two in step.
  useEffect(() => {
    if (warning === null) {
      tickedAt.current = null;
      return;
    }
    if (tickedAt.current === warning) return;
    tickedAt.current = warning;
    playTick(1 - (warning - 1) / PANIC_SECONDS);
  }, [warning]);

  if (run.stage === "over") {
    return (
      <div className="h-full w-full max-w-[560px] mx-auto px-6 flex flex-col items-center justify-center gap-8 text-center max-sm:px-4">
        <div className="flex flex-col items-center gap-2">
          <span className="font-mono text-[10.5px] font-medium tracking-[0.16em] uppercase text-muted-light">
            Run over
          </span>
          <span className="font-serif italic font-normal text-[clamp(80px,18vw,130px)] leading-[0.85] tracking-[-0.03em] text-ink tabular-nums">
            {run.score}
          </span>
          <span className="font-mono text-[13px] font-medium tracking-[0.04em] text-muted">
            {run.score === 1 ? "arpeggio" : "arpeggios"} cleared
          </span>
        </div>

        <div className="flex flex-col items-stretch gap-3">
          <button
            className="bg-ink text-sand border-none font-mono text-xs font-medium tracking-[0.14em] uppercase py-4 px-11 rounded-full cursor-pointer transition-opacity duration-150 hover:opacity-80"
            onClick={onPlayAgain}
          >
            Play again →
          </button>
          <button
            className="bg-transparent text-ink border-[1.5px] border-ink/40 font-mono text-xs font-medium tracking-[0.14em] uppercase py-[14px] px-11 rounded-full cursor-pointer transition-all duration-150 hover:border-ink/65"
            onClick={onMenu}
          >
            Back to menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full max-w-[880px] mx-auto flex flex-col items-center gap-7 overflow-hidden px-8 pt-14 pb-12 max-sm:px-0 max-sm:pt-6 max-sm:pb-4 max-sm:gap-4">
      <div className="w-full max-w-[720px] flex flex-col gap-3 max-sm:px-4 max-sm:max-w-full">
        <div className="flex items-center justify-between gap-4">
          <button
            className="shrink-0 bg-transparent border border-ink/35 text-muted font-mono text-[10.5px] font-medium tracking-[0.12em] uppercase py-2 px-[14px] rounded-full cursor-pointer transition-all duration-150 hover:border-ink/55 hover:text-ink"
            onClick={onQuit}
          >
            ← quit
          </button>
          <Hearts lives={run.lives} total={RUN_LIVES} />
          <button
            className="shrink-0 bg-transparent border border-ink/35 text-muted font-mono text-[10.5px] font-medium tracking-[0.12em] uppercase py-2 px-[14px] rounded-full cursor-pointer transition-all duration-150 hover:border-ink/55 hover:text-ink"
            onClick={() => setInvert((v) => !v)}
            title="Flip string order"
          >
            {invert ? "high E" : "low E"}
          </button>
        </div>

        {/* Clock — a bar that drains and ripens from green through amber to
            red, so its colour warns before its length has to be read. */}
        <div
          className="h-1.5 w-full rounded-full bg-ink/12 overflow-hidden"
          role="timer"
          aria-label={`${secondsLeft} seconds left`}
        >
          <div
            className="h-full rounded-full origin-left"
            style={{
              transform: `scaleX(${fraction})`,
              background: clockColor(fraction),
              transition: "transform 100ms linear, background 300ms linear",
            }}
          />
        </div>
      </div>

      <div className="text-center w-full flex flex-col items-center justify-center gap-4 min-h-[220px] max-sm:min-h-0 max-sm:px-4 max-sm:gap-2">
        <div
          className={`font-serif italic font-normal text-[clamp(110px,16vw,180px)] max-sm:text-[clamp(72px,22vw,110px)] leading-[0.85] tracking-[-0.03em] w-full transition-[color,transform] duration-[250ms] ease-in-out ${
            run.phase === "success"
              ? "text-green scale-[1.04]"
              : run.phase === "playing"
                ? "text-ink"
                : "text-wrong"
          }`}
        >
          <ChordRank rank={chord.rank} />
        </div>
        <div
          className={`font-mono text-sm font-medium tracking-[0.04em] h-[18px] transition-[opacity,transform] duration-[250ms] ease-in-out ${
            run.phase === "playing"
              ? "opacity-0 -translate-y-1"
              : "opacity-100 translate-y-0"
          } ${run.phase === "success" ? "text-green" : "text-wrong"}`}
        >
          {run.phase === "timeout" ? (
            "out of time"
          ) : run.phase === "wrong" ? (
            "not in the arpeggio"
          ) : run.phase === "disorder" ? (
            "out of order — lowest first"
          ) : (
            chord.quality
          )}
        </div>
      </div>

      {/* A broken rule, not merely a miss: the screen flashes with the wiggle. */}
      {mistake && (
        <div className="panic-flash fixed inset-0 z-10" aria-hidden="true" />
      )}

      <div className="w-full flex justify-center max-sm:order-[10]">
        <Fretboard
          frets={place.frets}
          activeKeys={activeKeys}
          selected={run.selected}
          targetKeys={targetKeys}
          phase={
            run.phase === "success"
              ? "success"
              : missed
                ? "reveal"
                : "playing"
          }
          invert={invert}
          hiddenDegrees={hidden}
          wrongKey={run.wrongKey}
          onToggle={(key) =>
            dispatch({
              type: "toggle",
              key,
              isTarget: targetKeys.has(key),
              isNext: key === nextKey,
            })
          }
          compact={isMobile}
        />
      </div>

      <div
        className={`w-full max-w-[720px] font-mono text-xs text-muted grid items-center max-sm:order-[9] max-sm:mt-auto max-sm:px-4 max-sm:max-w-full ${
          missed
            ? "grid-cols-[1fr_auto_1fr] gap-3"
            : "grid-cols-2 sm:grid-cols-[1fr_auto_1fr] gap-4"
        }`}
      >
        <div
          className={`flex items-baseline gap-2.5 sm:order-none sm:justify-self-start ${
            missed ? "order-1" : "order-2"
          }`}
        >
          <span className="uppercase tracking-[0.14em] text-[10.5px] text-muted-light">
            score
          </span>
          <span className="text-lg font-semibold text-ink tabular-nums">
            {String(run.score).padStart(2, "0")}
          </span>
        </div>
        <div
          className={`flex justify-center sm:order-none sm:col-span-1 tracking-[0.02em] text-center ${
            missed ? "order-2" : "col-span-2 order-1"
          }`}
        >
          {missed ? (
            <button
              className="bg-ink text-sand border border-ink font-mono text-[11px] font-medium tracking-[0.12em] uppercase py-2 px-[14px] rounded-full cursor-pointer transition-opacity duration-150 hover:opacity-80"
              onClick={() => dispatch({ type: "advance", at: Date.now() })}
              autoFocus
            >
              {run.lives > 0 ? "continue →" : "run over →"}
            </button>
          ) : (
            <span>
              tap every note of the&nbsp;
              <strong className="text-ink font-semibold">
                <ChordRank rank={chord.rank} />
              </strong>
              &nbsp;arpeggio
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-2.5 order-3 sm:order-none justify-self-end">
          <span className="uppercase tracking-[0.14em] text-[10.5px] text-muted-light">
            next pick
          </span>
          <span className="text-lg font-semibold text-ink tabular-nums">
            {MODIFIER_INTERVAL - (run.drills % MODIFIER_INTERVAL)}
          </span>
        </div>
      </div>

      {/* Warning vignette. Keyed on the second so each one is a fresh element
          playing the flash once — three flashes, not a loop that gets cut. */}
      {warning !== null && (
        <div
          key={warning}
          className="panic-flash fixed inset-0 z-10"
          aria-hidden="true"
        />
      )}

      {(run.stage === "modifier" || run.stage === "boss") && (
        <ChoicePause
          run={run}
          invert={invert}
          boss={run.stage === "boss"}
          onChoose={(modifier) =>
            dispatch({ type: "choose", modifier, at: Date.now() })
          }
        />
      )}
    </div>
  );
}

/** How long the taken card flies and spins before the run picks back up. */
const TAKE_MS = 850;

/**
 * A pause, of either kind: cards on the table, one of which must be taken.
 * There is no way past without choosing — the run is meant to get harder, and
 * the only say the player has is how.
 *
 * Boss pauses differ only in what is dealt: fewer cards, none of them a gift.
 */
function ChoicePause({
  run,
  invert,
  boss,
  onChoose,
}: {
  run: RunState;
  invert: boolean;
  boss: boolean;
  onChoose: (modifier: Modifier) => void;
}) {
  // Which card was taken, and how far it has to travel to reach the middle.
  // Measured on the tap rather than assumed, so it lands centred from whichever
  // slot it was dealt into — two across on a phone, three in a row otherwise.
  const [taken, setTaken] = useState<{
    id: string;
    flight: { dx: number; dy: number };
  } | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const take = (mod: Modifier, el: HTMLElement) => {
    if (taken) return; // one card only, however fast the tapping
    const r = el.getBoundingClientRect();
    setTaken({
      id: modifierId(mod),
      flight: {
        dx: window.innerWidth / 2 - (r.left + r.width / 2),
        dy: window.innerHeight / 2 - (r.top + r.height / 2),
      },
    });
    // Someone who has asked for less motion should not sit through the flight.
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    timer.current = setTimeout(() => onChoose(mod), still ? 120 : TAKE_MS);
  };

  const only = run.offers.length === 1;
  // On a phone the cards sit two to a row, so an odd count strands the last one
  // alone on the bottom row. That is the card that has to be centred — not just
  // the lone-card case, which is merely the smallest odd count.
  const oddOneOut = run.offers.length % 2 === 1;

  return (
    <div
      className={`fixed inset-0 z-20 flex items-center justify-center bg-sand/95 px-5 py-8 overflow-y-auto ${
        taken ? "modifier-taken" : ""
      }`}
    >
      <div className="flex flex-col items-center gap-7 text-center max-w-[620px] w-full my-auto">
        <div
          className={`flex flex-col items-center gap-1.5 transition-opacity duration-200 ${
            taken ? "opacity-0" : "opacity-100"
          }`}
        >
          <span
            className={`font-mono text-[10.5px] font-medium tracking-[0.16em] uppercase ${
              boss ? "text-wrong" : "text-muted-light"
            }`}
          >
            {boss
              ? `Boss · ${run.drills} drills in`
              : `${run.drills} drills · ${run.score} cleared`}
          </span>
          <span className="font-serif italic font-normal text-[clamp(34px,8vw,52px)] leading-[0.95] tracking-[-0.02em] text-ink">
            {boss ? (only ? "New rule" : "Pick your rule") : "Take one"}
          </span>
        </div>

        {/* Two to a row on a phone with the odd one centred beneath; a single
            row once there is width for it. */}
        <div className="modifier-table grid grid-cols-2 gap-3 sm:flex sm:flex-row sm:justify-center sm:gap-4 w-full">
          {run.offers.map((mod, i) => {
            const id = modifierId(mod);
            return (
              <ModifierCard
                key={id}
                modifier={mod}
                invert={invert}
                hiddenDegrees={hiddenDegrees(run)}
                index={i}
                centered={i === run.offers.length - 1 && oddOneOut}
                state={
                  !taken ? "idle" : taken.id === id ? "chosen" : "dismissed"
                }
                flight={taken?.id === id ? taken.flight : undefined}
                onChoose={(el) => take(mod, el)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
