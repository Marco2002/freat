import { CHORDS, PENTATONIC_DEGREES, POSITIONS } from "./src/lib/data";
import {
  BOSS_INTERVAL,
  BOSS_KINDS,
  availableBosses,
  pruneBosses,
  requires,
  MAX_RUSH,
  hasBoss,
  hiddenDegrees,
  isBossPause,
  RUSH_SECONDS,
  applyModifier,
  availableModifiers,
  drillSeconds,
  modifierId,
  modifierInfo,
  rollOffers,
} from "./src/lib/modifiers";
import type { BossKind, Modifier, RunLoadout } from "./src/lib/modifiers";
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

/** The most rules a single run can end up holding, given their conflicts. */
const MAX_BOSSES = (() => {
  let loadout: RunLoadout = { positions: [], roster: [], rushRank: 0, bosses: [] };
  for (;;) {
    const next = availableBosses(loadout)[0];
    if (!next) return loadout.bosses.length;
    loadout = { ...loadout, bosses: [...loadout.bosses, next] };
  }
})();
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
    if (s.stage !== "running") s = runReducer(s, { type: "choose", modifier: s.offers[0], at: T0 });
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
    if (s.stage !== "running") s = runReducer(s, { type: "choose", modifier: s.offers[0], at: T0 });
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
    if (s.stage === "modifier" || s.stage === "boss") {
      check(`  pause at drill ${s.drills} (${s.stage}) has cards`, s.offers.length > 0);
      s = runReducer(s, { type: "choose", modifier: s.offers[0], at: T0 + i * 40000 });
    }
  }
  check(`took ${s.taken.length} modifiers without stalling`, s.stage === "running");
  check("never took the same one twice",
    new Set(s.taken.map(modifierId)).size === s.taken.length);
  check(`clock bottomed out at ${drillMs(s) / 1000}s`, drillMs(s) === 5000);
}

console.log("\nevery 4th pause is a boss, not a choice:");
{
  check("pauses 1-3 are ordinary", [0, 1, 2].every((n) => !isBossPause(n)));
  check("pause 4 is a boss", isBossPause(3));
  check("pauses 5-7 are ordinary", [4, 5, 6].every((n) => !isBossPause(n)));
  check("pause 8 is a boss", isBossPause(7));

  // Walk a real run and record what each pause turns out to be.
  let s = fresh();
  const kinds: string[] = [];
  for (let i = 0; i < 130; i++) {
    s = settle(s, true, T0 + i * 40000);
    if (s.stage !== "running") {
      kinds.push(s.stage === "boss" ? "BOSS" : "pick");
      check(`  pause ${kinds.length} (${s.stage}) has something on the table`, s.offers.length > 0);
      if (s.stage === "boss") {
        check(`  …and it is a single boss card`,
          s.offers.length === 1 && s.offers[0].kind === "boss");
      } else {
        check(`  …and no boss is mixed into a choice`,
          !s.offers.some((m) => m.kind === "boss"));
      }
      s = runReducer(s, { type: "choose", modifier: s.offers[0], at: T0 + i * 40000 });
    }
  }
  // Every 4th pause, and only those, is a boss — for as long as bosses remain.
  const bossPauses = kinds.flatMap((k, i) => (k === "BOSS" ? [i + 1] : []));
  check(`the run went ${kinds.join(", ")}`,
    bossPauses.every((n) => n % BOSS_INTERVAL === 0));
  check(`bosses landed on pauses ${bossPauses.join(", ")}`,
    bossPauses.length === Math.min(MAX_BOSSES, Math.floor(kinds.length / BOSS_INTERVAL)));
  check("no boss is imposed twice", new Set(s.bosses).size === s.bosses.length);
  check(`the run fills up on rules (${s.bosses.join(", ")})`,
    s.bosses.length === MAX_BOSSES);
  check("once no rule can still be imposed, a 4th pause falls back to a choice",
    kinds.length > MAX_BOSSES * BOSS_INTERVAL
      ? kinds.slice(MAX_BOSSES * BOSS_INTERVAL).every((k) => k === "pick")
      : true);
}

console.log("\nNo Mistakes: a wrong note costs a life and ends the drill:");
{
  const clean = fresh();
  check("without the boss, a wrong note is just a tap",
    runReducer(clean, { type: "toggle", key: "9-9", isTarget: false }).lives === 3);
  check("…and can be tapped off again",
    runReducer(runReducer(clean, { type: "toggle", key: "9-9", isTarget: false }),
      { type: "toggle", key: "9-9", isTarget: false }).selected.size === 0);

  const strict: RunState = { ...clean, bosses: ["strict"] };
  const hit = runReducer(strict, { type: "toggle", key: "9-9", isTarget: false });
  check("with the boss, it costs a life", hit.lives === 2);
  check("…the drill ends", hit.phase === "wrong");
  check("…and the wrong note is left showing", hit.selected.has("9-9"));
  check("…scoring nothing", hit.score === 0);

  check("a right note is still just a tap",
    runReducer(strict, { type: "toggle", key: "2-9", isTarget: true }).phase === "playing");
  check("…and clearing the drill still scores",
    runReducer(strict, { type: "solved" }).score === 1);

  check("a second wrong tap cannot cost another life",
    runReducer(hit, { type: "toggle", key: "8-8", isTarget: false }).lives === 2);
  const moved = runReducer(hit, { type: "advance", at: T0 + 1000 });
  check("the run moves to the next arpeggio", moved.phase === "playing" && moved.selected.size === 0);
  check("…with a fresh clock", remainingMs(moved, T0 + 1000) === drillMs(moved));

  // Three wrong notes end a run just as three timeouts do.
  let s: RunState = { ...fresh(), bosses: ["strict"] };
  for (let i = 0; i < 3; i++) {
    s = runReducer(s, { type: "toggle", key: "9-9", isTarget: false });
    s = runReducer(s, { type: "advance", at: T0 + i * 1000 });
  }
  check("three wrong notes end the run", s.stage === "over" && s.lives === 0);
}

console.log("\nPentatonic Only: 4 and 7 go dark but stay in play:");
{
  const clean = fresh();
  check("without the boss, nothing is hidden", hiddenDegrees(clean).length === 0);

  const pent: RunState = { ...clean, bosses: ["pentatonic"] };
  const hidden = hiddenDegrees(pent);
  check(`it hides exactly the 4th and 7th (${hidden.join(", ")})`,
    hidden.length === 2 && hidden.includes(4) && hidden.includes(7));
  check("the five pentatonic degrees stay marked",
    PENTATONIC_DEGREES.every((d) => !hidden.includes(d)));
  check("hidden and shown together are the whole scale",
    new Set([...PENTATONIC_DEGREES, ...hidden]).size === 7);

  // Hiding is display only — the notes are still there to be tapped, and a
  // hidden note is still a legitimate part of an arpeggio.
  check("a hidden note is still a normal tap",
    runReducer(pent, { type: "toggle", key: "3-10", isTarget: true }).selected.has("3-10"));
  check("…and still scores when the drill is cleared",
    runReducer(pent, { type: "solved" }).score === 1);
  check("nothing about the clock changes", drillMs(pent) === drillMs(clean));
  check("the roster and positions are untouched",
    pent.roster.join() === clean.roster.join() &&
      pent.positions.join() === clean.positions.join());

  // Chords built on the hidden degrees are exactly where the difficulty lands.
  const usesHidden = CHORDS.filter((c) => c.tones.some((t) => hidden.includes(t)));
  check(`${usesHidden.length} of the 7 chords reach a hidden degree (${usesHidden.map((c) => c.rank).join(", ")})`,
    usesHidden.length > 0);

  // Both rules at once is a valid run, not a conflict.
  const both: RunState = { ...clean, bosses: ["strict", "pentatonic"] };
  check("it stacks with No Mistakes", hiddenDegrees(both).length === 2 && hasBoss(both, "strict"));
  const slip = runReducer(both, { type: "toggle", key: "9-9", isTarget: false });
  check("…and a wrong tap on a dark note still costs a life", slip.lives === 2 && slip.phase === "wrong");
}

console.log("\nRoot Only, the step up from Pentatonic Only:");
{
  const clean = fresh();
  const rootOnly: RunState = { ...clean, bosses: ["root"] };
  const hidden = hiddenDegrees(rootOnly);
  check(`it hides all six non-root degrees (${hidden.join(", ")})`,
    hidden.length === 6 && !hidden.includes(1));
  check("the root stays marked", !hidden.includes(1));
  check("it is harsher than Pentatonic Only",
    hidden.length > hiddenDegrees({ ...clean, bosses: ["pentatonic"] }).length);
  check("nothing else about the run changes",
    drillMs(rootOnly) === drillMs(clean) && rootOnly.roster.join() === clean.roster.join());
  check("a dark note is still a normal tap",
    runReducer(rootOnly, { type: "toggle", key: "3-10", isTarget: true }).selected.has("3-10"));

  // Root Only is the step up: it cannot land until Pentatonic Only has.
  check("on a fresh run, Root Only is not on the table",
    !availableBosses(clean).includes("root"));
  check("Pentatonic Only is, from the start",
    availableBosses(clean).includes("pentatonic"));
  check("once Pentatonic Only is in force, Root Only unlocks",
    availableBosses({ ...clean, bosses: ["pentatonic"] }).includes("root"));
  check("No Mistakes needs nothing first",
    availableBosses(clean).includes("strict") && requires("strict").length === 0);
  check("Root Only names its prerequisite",
    requires("root").includes("pentatonic"));
  check("Pentatonic Only has none", requires("pentatonic").length === 0);
  check("the two stack — Root Only simply hides more",
    hiddenDegrees({ ...clean, bosses: ["pentatonic", "root"] }).length === 6);

  // Switching off a prerequisite in practice cannot leave an orphan behind.
  check("dropping Pentatonic Only drops Root Only with it",
    pruneBosses(["strict", "root"]).join() === "strict");
  check("…and leaves a valid set alone",
    pruneBosses(["strict", "pentatonic", "root"]).length === 3);

  // No run can ever reach Root Only the wrong way round.
  let outOfOrder = 0;
  for (let run = 0; run < 300; run++) {
    let s = fresh();
    const order: string[] = [];
    for (let i = 0; i < 130; i++) {
      s = settle(s, true, T0 + i * 40000);
      if (s.stage === "boss") order.push(modifierId(s.offers[0]));
      if (s.stage !== "running") s = runReducer(s, { type: "choose", modifier: s.offers[0], at: T0 });
    }
    const pent = order.indexOf("boss-pentatonic");
    const root = order.indexOf("boss-root");
    if (root !== -1 && (pent === -1 || pent > root)) outOfOrder++;
  }
  check(`300 full runs, Root Only never arrives first (${outOfOrder})`, outOfOrder === 0);
}

console.log("\nprevews follow the rules: a hidden degree is not drawn:");
{
  const pos = POSITIONS[0];
  const shown = (bosses: BossKind[]) => {
    const hidden = hiddenDegrees({ positions: [], roster: [], rushRank: 0, bosses });
    return pos.notes.filter((n) => !hidden.includes(n.degree)).length;
  };
  const all = shown([]);
  const pent = shown(["pentatonic"]);
  const root = shown(["root"]);
  check(`no rule: all ${all} notes drawn`, all === pos.notes.length);
  check(`Pentatonic Only: ${pent} of ${all}`, pent < all && pent > root);
  check(`Root Only: ${root} of ${all}, and every one a root`,
    root > 0 && pos.notes.filter((n) => n.degree === 1).length === root);
  check("No Mistakes changes nothing about what is drawn", shown(["strict"]) === all);
}

console.log("\nbosses take their turn:");
{
  check(`there are ${BOSS_KINDS.length} bosses`, BOSS_KINDS.length === 3);
  check(`a run can end up holding all ${MAX_BOSSES}`, MAX_BOSSES === 3);
  const seen = new Set<string>();
  // Bosses land every 4th pause, so a run needs MAX_BOSSES * 4 pauses — and ten
  // drills per pause — before the last of them is in force.
  const drillsToFill = MAX_BOSSES * BOSS_INTERVAL * 10;
  for (let run = 0; run < 200; run++) {
    let s = fresh();
    for (let i = 0; i < drillsToFill; i++) {
      s = settle(s, true, T0 + i * 40000);
      if (s.stage !== "running") {
        if (s.stage === "boss") seen.add(modifierId(s.offers[0]));
        s = runReducer(s, { type: "choose", modifier: s.offers[0], at: T0 });
      }
    }
    check(`  run ${run}: fills up on rules (${s.bosses.join(", ")})`, s.bosses.length === MAX_BOSSES);
    if (run > 1) break; // three sample runs is plenty to print
  }
  // Across many runs every boss must be reachable, exclusive ones included —
  // otherwise one would be dead content.
  for (let run = 0; run < 300; run++) {
    let s = fresh();
    for (let i = 0; i < 90; i++) {
      s = settle(s, true, T0 + i * 40000);
      if (s.stage === "boss") seen.add(modifierId(s.offers[0]));
      if (s.stage !== "running") s = runReducer(s, { type: "choose", modifier: s.offers[0], at: T0 });
    }
  }
  check(`every boss is reachable (${[...seen].sort().join(", ")})`, seen.size === BOSS_KINDS.length);
}

console.log(fail === 0 ? "\nALL CHECKS PASSED" : `\n${fail} CHECK(S) FAILED`);
if (fail) process.exit(1);
