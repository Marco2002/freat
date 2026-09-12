import { initialPlacement, nextPlacement } from "./data";
import type { Placement } from "./data";
import { applyModifier, drillSeconds, rollOffers } from "./modifiers";
import type { Modifier } from "./modifiers";

// A run: the arpeggio drill played for keeps. Lives, a clock on every drill,
// and a loadout that starts small — modifiers grow it, and tighten the clock,
// every so many drills.

export const RUN_LIVES = 3;
/** How many chords a run opens with. */
export const RUN_CHORDS = 3;
/** Drills between modifier choices. */
export const MODIFIER_INTERVAL = 10;
/** Cards laid out at each pause. */
export const MODIFIER_CHOICES = 3;

/**
 * Warning flashes before a drill expires: one a second, the last landing one
 * second before time is up. Doubles as the window where the screen flashes and
 * the countdown blips, so the two always agree.
 */
export const PANIC_SECONDS = 3;

/** Fraction of the clock left where the bar turns fully red. */
export const DANGER_FRACTION = 0.25;

export type DrillPhase = "playing" | "success" | "timeout";
export type RunStage = "running" | "modifier" | "over";

export interface RunState {
  /** Positions the run draws from — modifiers add to this. */
  positions: number[];
  /** Chord indices the run draws from. */
  roster: number[];
  /** Rank of the Rush modifier, which sets the clock. */
  rushRank: number;
  /** Where the neck is sitting. */
  place: Placement;
  chordIdx: number;
  /** Note keys the player has tapped for the current drill. */
  selected: Set<string>;
  phase: DrillPhase;
  stage: RunStage;
  lives: number;
  /** Drills cleared — the run's score. */
  score: number;
  /** Drills finished, cleared or not. Modifier cadence counts these. */
  drills: number;
  deadlineAt: number;
  /** The cards on the table during a modifier pause. */
  offers: Modifier[];
  /** Modifiers taken, in order — the run's history. */
  taken: Modifier[];
}

export type RunAction =
  | { type: "toggle"; key: string }
  | { type: "solved" }
  | { type: "expired" }
  | { type: "advance"; at: number }
  | { type: "choose"; modifier: Modifier; at: number };

function pickNextChord(prev: number, roster: number[]): number {
  if (roster.length === 1) return roster[0];
  let next: number;
  do {
    next = roster[Math.floor(Math.random() * roster.length)];
  } while (next === prev);
  return next;
}

/** The clock a drill gets, at the run's current Rush rank. */
export const drillMs = (state: RunState): number =>
  drillSeconds(state.rushRank) * 1000;

export function initialRun(
  positionId: number,
  roster: number[],
  at: number,
): RunState {
  return {
    positions: [positionId],
    roster,
    rushRank: 0,
    place: initialPlacement(positionId),
    chordIdx: roster[Math.floor(Math.random() * roster.length)],
    selected: new Set(),
    phase: "playing",
    stage: "running",
    lives: RUN_LIVES,
    score: 0,
    drills: 0,
    deadlineAt: at + drillSeconds(0) * 1000,
    offers: [],
    taken: [],
  };
}

/** The next drill, with a fresh clock — shared by advancing and resuming. */
function nextDrill(state: RunState, at: number): RunState {
  return {
    ...state,
    stage: "running",
    phase: "playing",
    selected: new Set(),
    offers: [],
    chordIdx: pickNextChord(state.chordIdx, state.roster),
    place: nextPlacement(state.place, state.positions),
    deadlineAt: at + drillSeconds(state.rushRank) * 1000,
  };
}

/**
 * Every rule of a run in one place, as a reducer.
 *
 * Scoring and losing a life have to be decided from the state being replaced,
 * not from a value read during render — a timer firing twice, or an effect
 * re-run, must not cost two hearts. Each case guards on the phase it is allowed
 * to leave, so a repeat dispatch is a no-op rather than a double penalty.
 */
export function runReducer(state: RunState, action: RunAction): RunState {
  switch (action.type) {
    case "toggle": {
      if (state.phase !== "playing" || state.stage !== "running") return state;
      const selected = new Set(state.selected);
      if (selected.has(action.key)) selected.delete(action.key);
      else selected.add(action.key);
      return { ...state, selected };
    }

    case "solved":
      if (state.phase !== "playing" || state.stage !== "running") return state;
      return { ...state, phase: "success", score: state.score + 1 };

    case "expired":
      if (state.phase !== "playing" || state.stage !== "running") return state;
      return { ...state, phase: "timeout", lives: state.lives - 1 };

    case "advance": {
      // Only a settled drill advances, so a stray dispatch cannot skip one.
      if (state.phase === "playing") return state;
      const drills = state.drills + 1;
      if (state.lives <= 0) return { ...state, drills, stage: "over" };

      // A modifier is owed every so many drills. A run that has somehow taken
      // everything on offer plays straight on rather than pausing on an empty
      // table.
      if (drills % MODIFIER_INTERVAL === 0) {
        const offers = rollOffers(state, MODIFIER_CHOICES);
        if (offers.length > 0) {
          return { ...state, drills, stage: "modifier", offers };
        }
      }
      return { ...nextDrill(state, action.at), drills };
    }

    case "choose": {
      if (state.stage !== "modifier") return state;
      // The clock only starts once the player is looking at a drill again, so
      // reading the cards costs nothing.
      return {
        ...nextDrill(
          { ...state, ...applyModifier(state, action.modifier) },
          action.at,
        ),
        taken: [...state.taken, action.modifier],
      };
    }
  }
}

// The bar's colour ramp, as [fraction remaining, colour] stops. Green while
// there is room, amber by halfway, red for the last quarter — so the colour
// says how much time is left before the length has to be read.
const RAMP: readonly [number, [number, number, number]][] = [
  [1, [74, 156, 127]], // --color-green-light
  [0.5, [224, 164, 88]], // --color-amber
  [DANGER_FRACTION, [185, 64, 64]], // --color-wrong
  [0, [185, 64, 64]],
];

const mix = (
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): string =>
  `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(", ")})`;

/** The clock bar's colour at a given fraction of time remaining. */
export function clockColor(fraction: number): string {
  const f = Math.min(1, Math.max(0, fraction));
  for (let i = 0; i < RAMP.length - 1; i++) {
    const [hi, hiColor] = RAMP[i];
    const [lo, loColor] = RAMP[i + 1];
    if (f <= hi && f >= lo) {
      // Guard the degenerate span so the last stop cannot divide by zero.
      const t = hi === lo ? 0 : (hi - f) / (hi - lo);
      return mix(hiColor, loColor, t);
    }
  }
  return mix(RAMP[0][1], RAMP[0][1], 0);
}

/**
 * Milliseconds left on the current drill.
 *
 * Clamped at both ends, which matters because `now` is sampled on a tick: a
 * drill that has just started — or has just come back from a modifier pause
 * minutes later — is read against a stale sample, and without the upper clamp
 * would briefly show more than a full drill's time.
 */
export const remainingMs = (state: RunState, now: number): number =>
  Math.min(drillMs(state), Math.max(0, state.deadlineAt - now));
