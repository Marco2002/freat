import { CHORDS, POSITIONS } from "./data";

/**
 * What a run picks up along the way. Each one makes the run harder: less time,
 * or more ground to cover.
 */
export type Modifier =
  | { kind: "rush"; rank: number }
  | { kind: "position"; positionId: number }
  | { kind: "chord"; chordIdx: number };

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
}

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
  }
}

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
  }
}

/** Stable identity for a modifier, for React keys and comparisons. */
export const modifierId = (mod: Modifier): string =>
  mod.kind === "rush"
    ? `rush-${mod.rank}`
    : mod.kind === "position"
      ? `position-${mod.positionId}`
      : `chord-${mod.chordIdx}`;
