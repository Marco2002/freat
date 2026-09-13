import {
  CHORDS,
  NON_PENTATONIC_DEGREES,
  POSITIONS,
  SEVENTH_CHORDS,
  seventhIndexOf,
} from "./data";
import type { Degree } from "./data";

/**
 * A rule change the run imposes rather than offers. Bosses are not chosen — the
 * player is shown what is about to happen and plays on.
 */
export type BossKind = "strict" | "ordered" | "pentatonic" | "root";

// Ordered so a rule always follows the one it is built on — the practice
// screen deals its chips in this order, and a new one slides out of its parent.
export const BOSS_KINDS: readonly BossKind[] = [
  "strict",
  "ordered",
  "pentatonic",
  "root",
];

/**
 * Rules that have to be in force before another can land. Root Only is the step
 * up from Pentatonic Only — the neck thins to five degrees, then to one — so it
 * only ever arrives after it.
 */
const BOSS_REQUIRES: Record<BossKind, readonly BossKind[]> = {
  strict: [],
  // Playing in order is only a rule worth having once a stray note already
  // costs something.
  ordered: ["strict"],
  pentatonic: [],
  root: ["pentatonic"],
};

/** Rules built directly on `boss`. */
export const dependentsOf = (boss: BossKind): readonly BossKind[] =>
  BOSS_KINDS.filter((b) => BOSS_REQUIRES[b].includes(boss));

/** What has to be in force first. */
export const requires = (boss: BossKind): readonly BossKind[] =>
  BOSS_REQUIRES[boss];

/** Can this rule land yet? */
export const isUnlocked = (loadout: RunLoadout, boss: BossKind): boolean =>
  BOSS_REQUIRES[boss].every((r) => loadout.bosses.includes(r));

/**
 * Drops any rule left without its prerequisite — switching one off in practice
 * has to take whatever was built on top of it too.
 */
export function pruneBosses(bosses: readonly BossKind[]): BossKind[] {
  let kept = [...bosses];
  for (;;) {
    const next = kept.filter((b) =>
      BOSS_REQUIRES[b].every((r) => kept.includes(r)),
    );
    if (next.length === kept.length) return next;
    kept = next;
  }
}

/**
 * What a run picks up along the way. Each one makes the run harder: less time,
 * more ground to cover, or a harsher rule.
 */
export type Modifier =
  | { kind: "rush"; rank: number }
  | { kind: "position"; positionId: number }
  | { kind: "chord"; chordIdx: number }
  /** Upgrades a chord already in the roster to its diatonic seventh. */
  | { kind: "seventh"; chordIdx: number }
  | { kind: "boss"; boss: BossKind };

/** Pauses between bosses: three ordinary picks, then one imposed. */
export const BOSS_INTERVAL = 4;

/** Seconds a drill gets at each rank of Rush. Rank 0 is an unhurried run. */
export const RUSH_SECONDS = [30, 20, 10, 5] as const;
export const MAX_RUSH = RUSH_SECONDS.length - 1;

export const drillSeconds = (rushRank: number): number =>
  RUSH_SECONDS[Math.min(Math.max(rushRank, 0), MAX_RUSH)];

/** The part of a run a modifier can change. */
export interface RunLoadout {
  positions: number[];
  /** Chords the run draws from, as indices into ALL_CHORDS — triads and
   *  sevenths together, since a seventh is its own chord to drill. */
  roster: number[];
  rushRank: number;
  bosses: BossKind[];
}

/** Is this rule in force? */
export const hasBoss = (loadout: RunLoadout, boss: BossKind): boolean =>
  loadout.bosses.includes(boss);

/** Bosses that could still be imposed: not already in force, and unlocked. */
export const availableBosses = (loadout: RunLoadout): BossKind[] =>
  BOSS_KINDS.filter((b) => !loadout.bosses.includes(b) && isUnlocked(loadout, b));

/**
 * Whether the pause after `picksSoFar` modifiers is a boss. Every fourth one,
 * so a run gets three choices of its own before the next rule lands on it.
 */
export const isBossPause = (picksSoFar: number): boolean =>
  (picksSoFar + 1) % BOSS_INTERVAL === 0;

/**
 * Everything that could be offered right now. Rush drops out once it is maxed,
 * and a position or chord already in the run is never offered again — so the
 * pool shrinks as a run grows, and an offer is always something new.
 */
export function availableModifiers({
  positions,
  roster,
  rushRank,
}: RunLoadout): Modifier[] {
  const pool: Modifier[] = [];
  if (rushRank < MAX_RUSH) pool.push({ kind: "rush", rank: rushRank + 1 });
  for (const p of POSITIONS) {
    if (!positions.includes(p.number))
      pool.push({ kind: "position", positionId: p.number });
  }
  for (let i = 0; i < CHORDS.length; i++) {
    if (!roster.includes(i)) pool.push({ kind: "chord", chordIdx: i });
  }
  // A seventh joins the roster beside its triad rather than replacing it, but
  // it is only on the table once that triad is in the run.
  for (let i = 0; i < CHORDS.length; i++) {
    if (roster.includes(i) && !roster.includes(seventhIndexOf(i)))
      pool.push({ kind: "seventh", chordIdx: i });
  }
  return pool;
}

const drawFrom = <T,>(pool: T[], count: number): T[] => {
  const picked: T[] = [];
  while (picked.length < count && pool.length > 0) {
    picked.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return picked;
};

/** Up to `count` distinct offers, drawn at random from what is available. */
export const rollOffers = (loadout: RunLoadout, count: number): Modifier[] =>
  drawFrom(availableModifiers(loadout), count);

/**
 * Up to `count` distinct boss rules. A run near the end of the list may have
 * only one left to give, in which case there is nothing to choose between.
 */
export const rollBosses = (loadout: RunLoadout, count: number): Modifier[] =>
  drawFrom(availableBosses(loadout), count).map((boss) => ({
    kind: "boss" as const,
    boss,
  }));

/** The loadout with `mod` taken. */
export function applyModifier(
  loadout: RunLoadout,
  mod: Modifier,
): RunLoadout {
  switch (mod.kind) {
    case "rush":
      return { ...loadout, rushRank: Math.min(mod.rank, MAX_RUSH) };
    case "position":
      return loadout.positions.includes(mod.positionId)
        ? loadout
        : { ...loadout, positions: [...loadout.positions, mod.positionId] };
    case "chord":
      return loadout.roster.includes(mod.chordIdx)
        ? loadout
        : { ...loadout, roster: [...loadout.roster, mod.chordIdx] };
    case "seventh": {
      // Guarded both ways: never twice, and never for a chord not in the run.
      const seventh = seventhIndexOf(mod.chordIdx);
      return loadout.roster.includes(seventh) ||
        !loadout.roster.includes(mod.chordIdx)
        ? loadout
        : { ...loadout, roster: [...loadout.roster, seventh] };
    }
    case "boss":
      return loadout.bosses.includes(mod.boss)
        ? loadout
        : { ...loadout, bosses: [...loadout.bosses, mod.boss] };
  }
}

/** What each rule takes off the neck. */
export const BOSS_HIDES: Record<BossKind, readonly Degree[]> = {
  strict: [],
  ordered: [],
  pentatonic: NON_PENTATONIC_DEGREES,
  // Everything but the root.
  root: [2, 3, 4, 5, 6, 7],
};

const EMPTY_DEGREES: readonly Degree[] = [];

/**
 * Degrees the fretboard should leave unmarked, given the rules in force. They
 * stay tappable — the dot is all that goes.
 */
export function hiddenDegrees(loadout: RunLoadout): readonly Degree[] {
  const hidden = new Set<Degree>();
  for (const boss of loadout.bosses)
    for (const d of BOSS_HIDES[boss]) hidden.add(d);
  return hidden.size === 0 ? EMPTY_DEGREES : [...hidden];
}

/** Card copy for each boss. */
export const BOSS_INFO: Record<BossKind, { name: string; detail: string }> = {
  strict: {
    name: "No Mistakes",
    detail: "A wrong note costs a life and ends the drill",
  },
  pentatonic: {
    name: "Pentatonic Only",
    detail: "Only the major pentatonic is marked — 4 and 7 go dark",
  },
  ordered: {
    name: "In Order",
    detail: "Notes must be tapped lowest pitch first",
  },
  root: {
    name: "Root Only",
    detail: "Only the root is marked — every other degree goes dark",
  },
};

const ROMAN = ["I", "II", "III"];

/** Card copy: a name, and the technical detail under it. */
export function modifierInfo(mod: Modifier): { name: string; detail: string } {
  switch (mod.kind) {
    case "rush":
      return {
        name: `Rush ${ROMAN[mod.rank - 1] ?? mod.rank}`,
        detail: `Drill time ${RUSH_SECONDS[mod.rank - 1]}s → ${RUSH_SECONDS[mod.rank]}s`,
      };
    case "position":
      return {
        name: `Position ${mod.positionId}`,
        detail: "Adds this position to the run",
      };
    case "chord": {
      const c = CHORDS[mod.chordIdx];
      return {
        name: `${c.rank} chord`,
        detail: `Adds the ${c.rank} ${c.quality} — ${c.degrees.join(" ")}`,
      };
    }
    case "seventh": {
      const seventh = SEVENTH_CHORDS[mod.chordIdx];
      return {
        name: seventh.rank,
        detail: `Adds the ${seventh.rank} beside the ${CHORDS[mod.chordIdx].rank} — ${seventh.quality}, ${seventh.degrees.join(" ")}`,
      };
    }
    case "boss": {
      const { name, detail } = BOSS_INFO[mod.boss];
      return { name, detail };
    }
  }
}

/** Why a tap was refused, or `null` if it stands. */
export type TapFault = "note" | "order" | null;

/**
 * The rules' verdict on a tap, shared by the run and by practice so the two can
 * never drift.
 *
 * `isNext` means this is the note actually due — the lowest of the arpeggio not
 * yet down. In Order wants the sequence exactly: climbing is not enough, and
 * jumping ahead to a higher note fails the same way as going back.
 */
export function judgeTap(
  loadout: RunLoadout,
  tap: { isTarget: boolean; isNext: boolean },
): TapFault {
  if (!tap.isTarget && hasBoss(loadout, "strict")) return "note";
  if (hasBoss(loadout, "ordered") && !tap.isNext) return "order";
  return null;
}

/** Stable identity for a modifier, for React keys and comparisons. */
export const modifierId = (mod: Modifier): string =>
  mod.kind === "rush"
    ? `rush-${mod.rank}`
    : mod.kind === "position"
      ? `position-${mod.positionId}`
      : mod.kind === "chord"
        ? `chord-${mod.chordIdx}`
        : mod.kind === "seventh"
          ? `seventh-${mod.chordIdx}`
          : `boss-${mod.boss}`;
