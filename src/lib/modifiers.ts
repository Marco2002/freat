import { CHORDS, NON_PENTATONIC_DEGREES, POSITIONS } from "./data";
import type { Degree } from "./data";

/**
 * A rule change the run imposes rather than offers. Bosses are not chosen — the
 * player is shown what is about to happen and plays on.
 */
export type BossKind = "strict" | "pentatonic" | "root";

export const BOSS_KINDS: readonly BossKind[] = [
  "strict",
  "pentatonic",
  "root",
];

/**
 * Rules that cannot both be in force. Pentatonic Only and Root Only both thin
 * out the neck, and the harsher one would simply swallow the other.
 */
const BOSS_CONFLICTS: Record<BossKind, readonly BossKind[]> = {
  strict: [],
  pentatonic: ["root"],
  root: ["pentatonic"],
};

/** Rules `boss` cannot sit alongside. */
export const conflictsWith = (boss: BossKind): readonly BossKind[] =>
  BOSS_CONFLICTS[boss];

/**
 * What a run picks up along the way. Each one makes the run harder: less time,
 * more ground to cover, or a harsher rule.
 */
export type Modifier =
  | { kind: "rush"; rank: number }
  | { kind: "position"; positionId: number }
  | { kind: "chord"; chordIdx: number }
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
  roster: number[];
  rushRank: number;
  bosses: BossKind[];
}

/** Is this rule in force? */
export const hasBoss = (loadout: RunLoadout, boss: BossKind): boolean =>
  loadout.bosses.includes(boss);

/** Bosses that could still be imposed: not already in force, and not ruled out
 *  by one that is. */
export const availableBosses = (loadout: RunLoadout): BossKind[] =>
  BOSS_KINDS.filter(
    (b) =>
      !loadout.bosses.includes(b) &&
      !BOSS_CONFLICTS[b].some((other) => loadout.bosses.includes(other)),
  );

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
  return pool;
}

/** Up to `count` distinct offers, drawn at random from what is available. */
export function rollOffers(loadout: RunLoadout, count: number): Modifier[] {
  const pool = availableModifiers(loadout);
  const picked: Modifier[] = [];
  while (picked.length < count && pool.length > 0) {
    picked.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return picked;
}

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
    case "boss":
      return loadout.bosses.includes(mod.boss)
        ? loadout
        : { ...loadout, bosses: [...loadout.bosses, mod.boss] };
  }
}

/** What each rule takes off the neck. */
export const BOSS_HIDES: Record<BossKind, readonly Degree[]> = {
  strict: [],
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
export const BOSS_INFO: Record<
  BossKind,
  { name: string; detail: string; blurb: string }
> = {
  strict: {
    name: "No Mistakes",
    detail: "A wrong note costs a life and ends the drill",
    blurb: "Every note has to be in the arpeggio.",
  },
  pentatonic: {
    name: "Pentatonic Only",
    detail: "Only the major pentatonic is marked — 4 and 7 go dark",
    blurb:
      "The 4th and 7th are still on the neck, and still yours to tap. You just have to know where they are.",
  },
  root: {
    name: "Root Only",
    detail: "Only the root is marked — every other degree goes dark",
    blurb:
      "One note to navigate from. The rest of the shape is still under your fingers, unmarked.",
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
    case "boss": {
      const { name, detail } = BOSS_INFO[mod.boss];
      return { name, detail };
    }
  }
}

/** Stable identity for a modifier, for React keys and comparisons. */
export const modifierId = (mod: Modifier): string =>
  mod.kind === "rush"
    ? `rush-${mod.rank}`
    : mod.kind === "position"
      ? `position-${mod.positionId}`
      : mod.kind === "chord"
        ? `chord-${mod.chordIdx}`
        : `boss-${mod.boss}`;
