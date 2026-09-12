// The rules of a run, exercised directly against the reducer.
import {
  DANGER_FRACTION,
  drillMs,
  MODIFIER_INTERVAL,
  PANIC_SECONDS,
  RUN_LIVES,
  clockColor,
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
// A fresh run is unhurried until a Rush modifier is taken.
const DRILL_MS = 30_000;
const roster = [0, 3, 4];
const fresh = () => initialRun(3, roster, T0);

// Play a drill to its end: `clear` true to solve it, false to let time run out.
const settle = (s: RunState, clear: boolean, at: number): RunState => {
  const settled = runReducer(s, clear ? { type: "solved" } : { type: "expired" });
  return runReducer(settled, { type: "advance", at });
};

console.log("a fresh run:");
{
  const s = fresh();
  check(`starts with ${RUN_LIVES} lives`, s.lives === RUN_LIVES);
  check("starts with a score of 0", s.score === 0);
  check("opens on a chord from the roster", roster.includes(s.chordIdx));
  check(`gives ${DRILL_MS / 1000}s`, remainingMs(s, T0) === DRILL_MS);
  check("is running", s.stage === "running" && s.phase === "playing");
}

console.log("\nclearing a drill:");
{
  const s = runReducer(fresh(), { type: "solved" });
  check("scores", s.score === 1);
  check("costs no life", s.lives === RUN_LIVES);
  const next = runReducer(s, { type: "advance", at: T0 + 5000 });
  check("the next drill gets a full clock", remainingMs(next, T0 + 5000) === DRILL_MS);
  check("the tapped notes are cleared", next.selected.size === 0);
}

console.log("\nrunning out of time:");
{
  const s = runReducer(fresh(), { type: "expired" });
  check("costs a life", s.lives === RUN_LIVES - 1);
  check("scores nothing", s.score === 0);
  const next = runReducer(s, { type: "advance", at: T0 + 40000 });
  check("the drill moves on", next.phase === "playing");
  check("the run continues", next.stage === "running");
}

console.log("\nthe same event twice cannot double-charge:");
{
  let s = runReducer(fresh(), { type: "expired" });
  s = runReducer(s, { type: "expired" });
  check("two expiries cost one life", s.lives === RUN_LIVES - 1);
  let t = runReducer(fresh(), { type: "solved" });
  t = runReducer(t, { type: "solved" });
  check("two solves score one point", t.score === 1);
  const skipped = runReducer(fresh(), { type: "advance", at: T0 });
  check("advancing an unsettled drill does nothing", skipped === fresh() || skipped.drills === 0);
}

console.log("\nthree misses end the run:");
{
  let s = fresh();
  for (let i = 0; i < RUN_LIVES; i++) s = settle(s, false, T0 + i * 40000);
  check("the run is over", s.stage === "over");
  check("no lives left", s.lives === 0);
  check("the score is what was cleared", s.score === 0);
  const after = runReducer(s, { type: "toggle", key: "0-7" });
  check("a finished run ignores further taps", after.selected.size === 0);
}

console.log("\nscore counts only cleared drills:");
{
  let s = fresh();
  const pattern = [true, false, true, true, false];
  pattern.forEach((clear, i) => { s = settle(s, clear, T0 + i * 40000); });
  check(`3 cleared of 5 → score 3 (${s.score})`, s.score === 3);
  check(`2 missed → 1 life left (${s.lives})`, s.lives === RUN_LIVES - 2);
  check(`5 drills counted (${s.drills})`, s.drills === 5);
}

console.log(`\nevery ${MODIFIER_INTERVAL} drills pauses for a modifier:`);
{
  let s = fresh();
  const pauses: number[] = [];
  for (let i = 0; i < 30; i++) {
    s = settle(s, true, T0 + i * 40000);
    if (s.stage === "modifier") {
      pauses.push(s.drills);
      // Time passing behind a pause must not cost anything: the clock is
      // stopped, so an expiry arriving here is refused outright.
      const stale = runReducer(s, { type: "expired" });
      check(`  drill ${s.drills}: time cannot run out behind the pause`,
        stale.lives === s.lives && stale.stage === "modifier");
      // Taking a card is what resumes the run; there is no way past without one.
      s = runReducer(s, { type: "choose", modifier: s.offers[0], at: T0 + i * 40000 + 50000 });
      check(`  drill ${s.drills}: resuming gives a full clock`,
        remainingMs(s, T0 + i * 40000 + 50000) === drillMs(s));
    }
  }
  check(`pauses at ${pauses.join(", ")}`, JSON.stringify(pauses) === JSON.stringify([10, 20, 30]));
}

console.log("\nthe last life ending on a modifier drill: run over wins:");
{
  let s = fresh();
  for (let i = 0; i < 7; i++) s = settle(s, true, T0 + i * 40000);
  for (let i = 0; i < 3; i++) s = settle(s, false, T0 + (7 + i) * 40000);
  check(`10 drills in, out of lives → over, not modifier (${s.stage})`, s.stage === "over");
  check("score kept for the summary", s.score === 7);
}

console.log("\nthe clock is read against a ticking sample:");
{
  const s = fresh();
  check("a stale sample never shows more than a full drill",
    remainingMs(s, T0 - 60_000) === DRILL_MS);
  check("…so no false expiry right after a pause",
    remainingMs(s, T0 - 60_000) > 0);
  check("an overrun reads as zero, not negative",
    remainingMs(s, T0 + 60_000) === 0);
  check("mid-drill reads true", remainingMs(s, T0 + 10_000) === 20_000);
}

console.log("\nthe clock bar's colour ramp:");
{
  const rgb = (f: number) => clockColor(f).match(/\d+/g)!.map(Number);
  const [r0, g0] = rgb(1);
  check(`full clock is green (${clockColor(1)})`, g0 > r0);
  const [rh, gh, bh] = rgb(0.5);
  check(`halfway is amber (${clockColor(0.5)})`, rh > gh && gh > bh);
  check(`the last quarter is red (${clockColor(DANGER_FRACTION)})`,
    rgb(DANGER_FRACTION)[0] > 2 * rgb(DANGER_FRACTION)[1]);
  check("and stays red below it", clockColor(0.1) === clockColor(DANGER_FRACTION));

  // Ripening, not jumping. The raw channels are not monotonic (amber is a
  // brighter red than the danger red), so the property to hold is the hue
  // sweeping green → yellow → red without ever doubling back.
  const hue = (f: number) => {
    const [r, g, b] = rgb(f).map((v) => v / 255);
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    if (d === 0) return 0;
    const h =
      max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return ((h * 60) % 360 + 360) % 360;
  };
  const hues: number[] = [];
  for (let f = 1; f >= DANGER_FRACTION - 1e-9; f -= 0.01) hues.push(hue(f));
  check(`hue sweeps ${hues[0].toFixed(0)}° green → ${hues[hues.length - 1].toFixed(0)}° red`,
    hues.every((v, i) => i === 0 || v <= hues[i - 1] + 1e-9));
  check("…passing through yellow on the way",
    hues.some((v) => v > 40 && v < 70));
  check("out-of-range fractions are clamped, not NaN",
    clockColor(2) === clockColor(1) && clockColor(-1) === clockColor(0));
  check("no stop produces NaN", !/NaN/.test([0, 0.25, 0.5, 0.75, 1].map(clockColor).join()));
}

console.log(`\nexactly ${PANIC_SECONDS} warnings, evenly spaced, before time runs out:`);
{
  // Replays the component's rule at the same 100ms cadence its clock ticks at.
  const warningAt = (left: number) => {
    const secondsLeft = Math.ceil(left / 1000);
    return secondsLeft <= PANIC_SECONDS && secondsLeft >= 1 ? secondsLeft : null;
  };

  const fired: { second: number; msLeft: number }[] = [];
  let last: number | null = null;
  const s = fresh();
  for (let ms = 0; ms <= DRILL_MS; ms += 100) {
    const left = remainingMs(s, T0 + ms);
    const w = warningAt(left);
    if (w !== null && w !== last) fired.push({ second: w, msLeft: left });
    last = w;
  }

  check(`fires ${PANIC_SECONDS} times (${fired.length})`, fired.length === PANIC_SECONDS);
  check(`counts down ${fired.map((f) => f.second).join(", ")}`,
    JSON.stringify(fired.map((f) => f.second)) ===
      JSON.stringify([...Array(PANIC_SECONDS)].map((_, i) => PANIC_SECONDS - i)));

  const gaps = fired.slice(1).map((f, i) => fired[i].msLeft - f.msLeft);
  check(`evenly spaced 1s apart (${gaps.join(", ")}ms)`,
    gaps.every((g) => g === 1000));

  const lastFlash = fired[fired.length - 1].msLeft;
  check(`the last lands 1s before time is up (${lastFlash}ms left)`, lastFlash === 1000);
  check("nothing fires at the moment of expiry", warningAt(0) === null);
  check("nothing fires early in the drill", warningAt(DRILL_MS) === null);
  check(`the first lands at ${PANIC_SECONDS}s left`, fired[0].msLeft === PANIC_SECONDS * 1000);

  // Pitch climbs across the three, and stays inside the 0-1 range playTick expects.
  const urgencies = fired.map((f) => 1 - (f.second - 1) / PANIC_SECONDS);
  check(`urgency climbs ${urgencies.map((u) => u.toFixed(2)).join(" → ")}`,
    urgencies.every((u, i) => i === 0 || u > urgencies[i - 1]) &&
      urgencies.every((u) => u >= 0 && u <= 1));
}

console.log("\ntapping notes:");
{
  let s = fresh();
  s = runReducer(s, { type: "toggle", key: "2-9" });
  check("a tap selects", s.selected.has("2-9"));
  s = runReducer(s, { type: "toggle", key: "2-9" });
  check("tapping again deselects", !s.selected.has("2-9"));
  const settled = runReducer(runReducer(fresh(), { type: "solved" }), { type: "toggle", key: "2-9" });
  check("taps are ignored once the drill is settled", settled.selected.size === 0);
}

console.log(fail === 0 ? "\nALL CHECKS PASSED" : `\n${fail} CHECK(S) FAILED`);
if (fail) process.exit(1);
