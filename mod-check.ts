import { CHORDS, POSITIONS } from "./src/lib/data";
import {
  MAX_RUSH,
  RUSH_SECONDS,
  applyModifier,
  availableModifiers,
  drillSeconds,
  modifierId,
  modifierInfo,
  rollOffers,
} from "./src/lib/modifiers";
import type { Modifier, RunLoadout } from "./src/lib/modifiers";
import {
  MODIFIER_CHOICES,
  MODIFIER_INTERVAL,
  drillMs,
  initialRun,
  remainingMs,
  runReducer,
} from "./src/lib/game";
import type { RunState } from "./src/lib/game";

let fail = 0;
const check = (label: string, ok: boolean) => {
  if (!ok) fail++;
  console.log(`  ${ok ? "ok  " : "FAIL"} ${label}`);
};

const T0 = 1_000_000;
const fresh = () => initialRun(3, [0, 3, 4], T0);
const settle = (s: RunState, clear: boolean, at: number) =>
  runReducer(runReducer(s, { type: clear ? "solved" : "expired" }), { type: "advance", at });

console.log("Rush shortens the clock, rank by rank:");
{
  check(`rank 0 is ${RUSH_SECONDS[0]}s`, drillSeconds(0) === 30);
  check("rank 1 → 20s", drillSeconds(1) === 20);
  check("rank 2 → 10s", drillSeconds(2) === 10);
  check("rank 3 → 5s", drillSeconds(3) === 5);
  check("ranks past the last stay at 5s", drillSeconds(9) === 5);
  check("a negative rank cannot lengthen the clock", drillSeconds(-1) === 30);
  check(`the ladder only ever shortens`,
    RUSH_SECONDS.every((v, i) => i === 0 || v < RUSH_SECONDS[i - 1]));

  // The card must name the step it actually makes.
  for (let r = 1; r <= MAX_RUSH; r++) {
    const { name, detail } = modifierInfo({ kind: "rush", rank: r });
    const ok = detail === `Drill time ${RUSH_SECONDS[r - 1]}s → ${RUSH_SECONDS[r]}s`;
    check(`${name}: "${detail}"`, ok);
  }
}

console.log("\ntaking a modifier changes the run:");
{
  const base: RunLoadout = { positions: [3], roster: [0, 1, 2], rushRank: 0 };
  check("rush raises the rank", applyModifier(base, { kind: "rush", rank: 1 }).rushRank === 1);
  check("rush cannot exceed the last rank",
    applyModifier(base, { kind: "rush", rank: 99 }).rushRank === MAX_RUSH);
  const withPos = applyModifier(base, { kind: "position", positionId: 5 });
  check("a position joins the pool", withPos.positions.join() === "3,5");
  const withChord = applyModifier(base, { kind: "chord", chordIdx: 6 });
  check("a chord joins the roster", withChord.roster.join() === "0,1,2,6");
  check("taking one leaves the others alone",
    withPos.roster.join() === "0,1,2" && withPos.rushRank === 0);
  check("a duplicate cannot be added twice",
    applyModifier(withPos, { kind: "position", positionId: 5 }).positions.length === 2);
}

console.log("\noffers are always something new:");
{
  const loadout: RunLoadout = { positions: [3], roster: [0, 1, 2], rushRank: 0 };
  const pool = availableModifiers(loadout);
  check(`pool is rush + 4 positions + 4 chords = ${pool.length}`, pool.length === 1 + 4 + 4);
  check("never offers a position already in the run",
    !pool.some((m) => m.kind === "position" && m.positionId === 3));
  check("never offers a chord already in the roster",
    !pool.some((m) => m.kind === "chord" && [0, 1, 2].includes(m.chordIdx)));

  const maxed = availableModifiers({ ...loadout, rushRank: MAX_RUSH });
  check("maxed Rush drops out of the pool", !maxed.some((m) => m.kind === "rush"));

  // Over many rolls: always the right count, never a duplicate on the table.
  let dupes = 0, wrongCount = 0;
  for (let i = 0; i < 5000; i++) {
    const offers = rollOffers(loadout, MODIFIER_CHOICES);
    if (offers.length !== MODIFIER_CHOICES) wrongCount++;
    if (new Set(offers.map(modifierId)).size !== offers.length) dupes++;
  }
  check(`5000 rolls always offer ${MODIFIER_CHOICES}`, wrongCount === 0);
  check("no roll ever shows the same card twice", dupes === 0);

  // Everything in the pool is reachable.
  const seen = new Set<string>();
  for (let i = 0; i < 5000; i++) rollOffers(loadout, MODIFIER_CHOICES).forEach((m) => seen.add(modifierId(m)));
  check(`every one of the ${pool.length} is offered eventually (${seen.size})`, seen.size === pool.length);

  // A nearly-exhausted run offers what is left, not a padded or empty table.
  const almost: RunLoadout = {
    positions: POSITIONS.map((p) => p.number),
    roster: CHORDS.map((_, i) => i).filter((i) => i !== 4),
    rushRank: MAX_RUSH,
  };
  check("a run with one card left offers just that one",
    rollOffers(almost, MODIFIER_CHOICES).length === 1);
  const exhausted: RunLoadout = { ...almost, roster: CHORDS.map((_, i) => i) };
  check("a fully-loaded run offers nothing", rollOffers(exhausted, MODIFIER_CHOICES).length === 0);
}

console.log("\nthe pause, in a real run:");
{
  let s = fresh();
  for (let i = 0; i < MODIFIER_INTERVAL; i++) s = settle(s, true, T0 + i * 40000);
  check("pauses with cards on the table", s.stage === "modifier" && s.offers.length === MODIFIER_CHOICES);
  check("the clock is not running behind it",
    runReducer(s, { type: "expired" }).lives === s.lives);

  const rush: Modifier = { kind: "rush", rank: 1 };
  const after = runReducer({ ...s, offers: [rush] }, { type: "choose", modifier: rush, at: T0 + 999 });
  check("choosing resumes the run", after.stage === "running" && after.phase === "playing");
  check("…with the shorter clock the card promised",
    remainingMs(after, T0 + 999) === 20_000 && drillMs(after) === 20_000);
  check("…the table is cleared", after.offers.length === 0);
  check("…and the modifier is recorded", after.taken.length === 1 && modifierId(after.taken[0]) === "rush-1");
  check("choosing twice cannot double-apply",
    runReducer(after, { type: "choose", modifier: rush, at: T0 }).taken.length === 1);
  check("a card that was not offered still needs a pause to take",
    runReducer(fresh(), { type: "choose", modifier: rush, at: T0 }).rushRank === 0);
}

console.log("\na position modifier really widens the neck:");
{
  let s = fresh();
  for (let i = 0; i < MODIFIER_INTERVAL; i++) s = settle(s, true, T0 + i * 40000);
  const add: Modifier = { kind: "position", positionId: 1 };
  s = runReducer({ ...s, offers: [add] }, { type: "choose", modifier: add, at: T0 });
  check("the run now holds two positions", s.positions.join() === "3,1");
  const seen = new Set<number>();
  for (let i = 0; i < 400; i++) {
    s = settle(s, true, T0 + i * 40000);
    if (s.stage === "modifier") s = runReducer(s, { type: "choose", modifier: s.offers[0], at: T0 });
    seen.add(s.place.id);
  }
  check(`drills land on more than one position (${[...seen].sort().join(", ")})`, seen.size > 1);
  check("and only on positions the run holds",
    [...seen].every((id) => s.positions.includes(id)));
}

console.log("\na chord modifier really widens the roster:");
{
  let s = fresh();
  for (let i = 0; i < MODIFIER_INTERVAL; i++) s = settle(s, true, T0 + i * 40000);
  const add: Modifier = { kind: "chord", chordIdx: 6 };
  s = runReducer({ ...s, offers: [add] }, { type: "choose", modifier: add, at: T0 });
  const seen = new Set<number>();
  for (let i = 0; i < 400; i++) {
    s = settle(s, true, T0 + i * 40000);
    if (s.stage === "modifier") s = runReducer(s, { type: "choose", modifier: s.offers[0], at: T0 });
    seen.add(s.chordIdx);
  }
  check(`the new chord is drilled (${[...seen].sort().join(", ")})`, seen.has(6));
  check("and only chords the run holds", [...seen].every((i) => s.roster.includes(i)));
}

console.log("\na long run keeps working as the pool empties:");
{
  let s = fresh();
  for (let i = 0; i < 300; i++) {
    s = settle(s, true, T0 + i * 40000);
    if (s.stage === "modifier") {
      check(`  pause at drill ${s.drills} has cards`, s.offers.length > 0);
      s = runReducer(s, { type: "choose", modifier: s.offers[0], at: T0 + i * 40000 });
    }
  }
  check(`took ${s.taken.length} modifiers without stalling`, s.stage === "running");
  check("never took the same one twice",
    new Set(s.taken.map(modifierId)).size === s.taken.length);
  check(`clock bottomed out at ${drillMs(s) / 1000}s`, drillMs(s) === 5000);
}

console.log(fail === 0 ? "\nALL CHECKS PASSED" : `\n${fail} CHECK(S) FAILED`);
if (fail) process.exit(1);
