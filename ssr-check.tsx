import { renderToStaticMarkup } from "react-dom/server";
import { Fretboard } from "./src/components/Fretboard";
import {
  CHORDS,
  NON_PENTATONIC_DEGREES,
  POSITIONS,
  chordKeysIn,
  initialPlacement,
  keyOf,
  keysOf,
  placePosition,
  positionById,
  slotKeysIn,
} from "./src/lib/data";
import type { Degree } from "./src/lib/data";
import type { Placement } from "./src/lib/data";

const FRET_W = 124, GUTTER_L = 44, WINDOW_FRETS = 6;

let failures = 0;
const check = (label: string, actual: unknown, expected: unknown) => {
  const ok = actual === expected;
  if (!ok) failures++;
  console.log(ok ? `  ok   ${label}` : `  FAIL ${label}: ${actual} (expected ${expected})`);
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

console.log("\nthe review beat shows the answer on the neck:");
{
  const place = initialPlacement(3);
  const chord = CHORDS[3]; // IV — reaches the 4th, a degree Pentatonic Only hides
  const targets = chordKeysIn(place.notes, chord);
  const wrongKey = place.notes.map(keyOf).find((k) => !targets.has(k))!;

  const render = (phase: "playing" | "success" | "reveal", selected: Set<string>, hide?: readonly Degree[]) =>
    renderToStaticMarkup(
      <Fretboard
        frets={place.frets}
        activeKeys={keysOf(place.notes)}
        selected={selected}
        targetKeys={targets}
        phase={phase}
        invert={false}
        hiddenDegrees={hide}
        onToggle={() => {}}
      />,
    );

  const GREEN = 'fill="#4a9c7f"', RED = 'fill="#b94040"';
  const count = (html: string, needle: string) => html.split(needle).length - 1;

  const playing = render("playing", new Set([wrongKey]));
  check("while playing, the answer is not given away", count(playing, GREEN) === 0, true);

  const reveal = render("reveal", new Set([wrongKey]));
  check(`the reveal lights all ${targets.size} answer notes`, count(reveal, GREEN) === targets.size, true);
  check("…and the note that was hit, in red", count(reveal, RED) === 1, true);
  check("…which wiggles", reveal.includes("note-wrong"), true);
  check("…without the cleared-drill pop", !reveal.includes("note-success"), true);

  const cleared = render("success", targets);
  check("a cleared drill still pops", cleared.includes("note-success"), true);
  check("…and marks nothing wrong", !cleared.includes("note-wrong"), true);

  // The answer must survive Pentatonic Only, or a hidden target could never be
  // reviewed — which is exactly when the player most needs to see it.
  const hidden: readonly Degree[] = NON_PENTATONIC_DEGREES;
  const dark = render("playing", new Set(), hidden);
  check("Pentatonic Only hides notes with opacity, not removal",
    count(dark, 'opacity="0"') > 0 &&
      count(dark, 'class="note"') >= count(playing, 'class="note"'), true);

  const revealDark = render("reveal", new Set([wrongKey]), hidden);
  check("the reveal still shows every answer note, hidden degrees included",
    count(revealDark, GREEN) === targets.size, true);
  const hiddenTargets = place.notes.filter(
    (n) => targets.has(keyOf(n)) && hidden.includes(n.degree),
  );
  check(`(this chord has ${hiddenTargets.length} answer notes that were dark)`, hiddenTargets.length > 0, true);
}

console.log("\nunder a hiding rule, every fret in the window is in play:");
{
  const place = initialPlacement(3);
  const chord = CHORDS[3];
  const targets = chordKeysIn(place.notes, chord);
  const STRINGS = 6;
  const windowSlots = STRINGS * place.frets.length;

  const render = (hide: readonly Degree[] | undefined, active: Set<string>) =>
    renderToStaticMarkup(
      <Fretboard
        frets={place.frets}
        activeKeys={active}
        selected={new Set()}
        targetKeys={targets}
        phase="playing"
        invert={false}
        hiddenDegrees={hide}
        onToggle={() => {}}
      />,
    );

  // The hit rect is what makes a slot tappable, so counting them counts what
  // the player can actually press.
  const hits = (html: string) => html.split('fill="rgba(0,0,0,0)"').length - 1;
  const scaleKeys = keysOf(place.notes);
  const slotKeys = slotKeysIn(place.frets);

  check(`the window holds ${windowSlots} slots, ${scaleKeys.size} of them scale notes`,
    slotKeys.size === windowSlots && scaleKeys.size < windowSlots, true);

  const plain = render(undefined, scaleKeys);
  check(`with no rule, only the ${scaleKeys.size} scale notes are tappable`,
    hits(plain) === scaleKeys.size, true);

  for (const [label, hide] of [
    ["Pentatonic Only", NON_PENTATONIC_DEGREES],
    ["Root Only", [2, 3, 4, 5, 6, 7] as const],
  ] as const) {
    const html = render(hide, slotKeys);
    check(`${label}: all ${windowSlots} frets in the window are tappable`,
      hits(html) === windowSlots, true);

    // The confusion only works if a blank slot and a hidden scale note look
    // identical — both invisible, neither distinguishable from the other.
    const shown = place.notes.filter((n) => !hide.includes(n.degree)).length;
    const marked = html.split('opacity="1"').length - 1;
    check(`${label}: ${marked} of ${windowSlots} tappable slots are marked`,
      marked === shown, true);
    check(`${label}: nothing off the neck leaks in`,
      hits(html) === slotKeys.size, true);
  }

  // A blank slot is not a scale note, so it can never be part of an answer.
  const blanks = [...slotKeys].filter((k) => !scaleKeys.has(k));
  check(`${blanks.length} slots are not scale notes at all`, blanks.length > 0, true);
  check("…and none of them is ever an answer note",
    blanks.every((k) => !targets.has(k)), true);
}

console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
if (failures) process.exit(1);
