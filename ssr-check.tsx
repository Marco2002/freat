import { renderToStaticMarkup } from "react-dom/server";
import { Fretboard } from "./src/components/Fretboard";
import { POSITIONS, initialPlacement, keysOf, placePosition, positionById } from "./src/lib/data";
import type { Placement } from "./src/lib/data";

const FRET_W = 124, GUTTER_L = 44, WINDOW_FRETS = 6;

let failures = 0;
const check = (label: string, actual: unknown, expected: unknown) => {
  const ok = actual === expected;
  if (!ok) failures++;
  if (!ok) console.log(`  FAIL ${label}: ${actual} (expected ${expected})`);
  return ok;
};

const windowStartOf = (p: Placement) =>
  (p.frets[0] + p.frets[p.frets.length - 1] + 1) / 2 - WINDOW_FRETS / 2;

const step = (from: Placement, id: number) => placePosition(positionById(id), from.frets[0]);

// 1. Every pair of ring-adjacent positions, in both directions, from every
//    starting octave — the slide must always be a short one.
console.log("ring-adjacent steps (both directions):");
const ring = POSITIONS.map((p) => p.number);
for (let lap = -2; lap <= 2; lap++) {
  for (let i = 0; i < ring.length; i++) {
    const nextId = ring[(i + 1) % ring.length];
    let here = initialPlacement(ring[i]);
    here = { ...here, frets: here.frets.map((f) => f + lap * 12), notes: here.notes };
    const up = step(here, nextId);
    const back = step(up, ring[i]);
    const upMove = windowStartOf(up) - windowStartOf(here);
    const backMove = windowStartOf(back) - windowStartOf(up);
    const ok =
      check(`lap ${lap}: ${ring[i]} → ${nextId} is short`, Math.abs(upMove) <= 3, true) &&
      check(`lap ${lap}: ${nextId} → ${ring[i]} is short`, Math.abs(backMove) <= 3, true);
    if (ok) console.log(`  ok   lap ${lap}: ${ring[i]} → ${nextId} (${upMove}) → ${ring[i]} (${backMove})`);
  }
}

// 2. No pair of positions, adjacent or not, ever slides more than half the neck.
console.log("\nevery pair:");
let worst = 0;
for (const a of ring) {
  for (const b of ring) {
    const from = initialPlacement(a);
    const move = Math.abs(windowStartOf(step(from, b)) - windowStartOf(from));
    worst = Math.max(worst, move);
  }
}
check(`worst slide of any pair is at most 6 frets (${worst})`, worst <= 6, true);
if (worst <= 6) console.log(`  ok   worst slide of any pair: ${worst} frets`);

// 3. Walking the ring forward forever keeps climbing by short steps, and the
//    fretboard keeps rendering the active shape at each one.
console.log("\n40 rounds of forward rotation:");
let place = initialPlacement(1);
let prev = windowStartOf(place);
let minMove = Infinity, maxMove = 0;
for (let n = 0; n < 40; n++) {
  place = step(place, (place.id % 5) + 1);
  const move = windowStartOf(place) - prev;
  minMove = Math.min(minMove, move);
  maxMove = Math.max(maxMove, move);
  prev = windowStartOf(place);

  const html = renderToStaticMarkup(
    <Fretboard
      frets={place.frets}
      activeKeys={keysOf(place.notes)}
      selected={new Set()}
      targetKeys={new Set()}
      phase="playing"
      invert={false}
      onToggle={() => {}}
    />,
  );
  const tx = Number(html.match(/translateX\((-?[\d.]+)px\)/)?.[1]);
  const hitRects = (html.match(/fill="rgba\(0,0,0,0\)"/g) ?? []).length;
  check(`round ${n}: camera translateX`, tx, GUTTER_L - windowStartOf(place) * FRET_W);
  check(`round ${n}: every active note is rendered`, hitRects, place.notes.length);
}
check(`every step climbs (min ${minMove})`, minMove > 0, true);
check(`no step is long (max ${maxMove})`, maxMove <= 3, true);
console.log(`  ok   40 rounds, every step a climb of ${minMove}–${maxMove} frets`);
console.log(`  ok   ended at frets ${place.frets[0]}-${place.frets[place.frets.length - 1]}`);

console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
if (failures) process.exit(1);
