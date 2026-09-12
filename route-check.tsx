// Renders the app at each URL the way a cold refresh would, and checks the
// route table round-trips. Run: npx vite build --ssr route-check.tsx && node …
import { renderToStaticMarkup } from "react-dom/server";

let path = "/";
const store = new Map<string, string>();
Object.assign(globalThis, {
  window: {
    get location() { return { pathname: path }; },
    addEventListener() {}, removeEventListener() {},
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
    history: { pushState() {}, replaceState() {} },
  },
  localStorage: {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
  },
});
(globalThis as { matchMedia?: unknown }).matchMedia = globalThis.window.matchMedia;

const { default: App } = await import("./src/App");
const { pathToRoute, routeToPath, menuOf } = await import("./src/lib/routes");

let failures = 0;
const check = (label: string, ok: boolean, detail = "") => {
  if (!ok) failures++;
  console.log(`  ${ok ? "ok  " : "FAIL"} ${label}${detail && !ok ? ` — ${detail}` : ""}`);
};

const at = (p: string) => { path = p; return renderToStaticMarkup(<App />); };

console.log("each path renders its own screen, and only its own, on a cold load:");
// Each marker is copy or markup unique to one screen, so a path rendering the
// wrong page fails twice: its own marker is missing, and another path claims it.
const cases: [string, string][] = [
  ["/", 'style="transform:translateX(calc(0% + 0px))'],
  ["/note-finder", 'style="transform:translateX(calc(-50% + 0px))'],
  ["/arpeggio/positions", "Start practice"],
  ["/arpeggio/drill", "tap every note of the"],
  ["/arpeggio/theory", ">Chord<"],
  ["/note-finder/drill", "grid-cols-4"],
  ["/note-finder/theory", "Scale Degrees"],
  ["/arpeggio/game/setup", "Start run"],
];
const rendered = new Map(cases.map(([p]) => [p, at(p)]));
for (const [p, marker] of cases) {
  check(`${p} renders its own screen`, rendered.get(p)!.includes(marker));
  const strays = cases
    .filter(([other]) => other !== p && rendered.get(other)!.includes(marker))
    .map(([other]) => other);
  check(`…and no other path renders it`, strays.length === 0, `also at ${strays}`);
}

console.log("\nunknown paths fall back to the menu, not a blank screen:");
check("/nonsense → menu", at("/nonsense").includes(cases[0][1]));

console.log("\nevery route round-trips through its path:");
for (const [p] of cases) {
  const rt = pathToRoute(p);
  check(`${p} → ${rt.screen}/${rt.mode} → ${routeToPath(rt)}`, routeToPath(rt) === p);
}
check("trailing slash tolerated", routeToPath(pathToRoute("/note-finder/")) === "/note-finder");

console.log("\nback from a note-finder screen opens the menu on the note-finder half:");
for (const p of ["/note-finder/drill", "/note-finder/theory"]) {
  const { mode } = pathToRoute(p);
  check(`${p} → back → ${routeToPath(menuOf(mode))}`, routeToPath(menuOf(mode)) === "/note-finder");
}
for (const p of ["/arpeggio/positions", "/arpeggio/theory"]) {
  const { mode } = pathToRoute(p);
  check(`${p} → back → ${routeToPath(menuOf(mode))}`, routeToPath(menuOf(mode)) === "/");
}

// The menu must actually open on the note-finder side, not merely route there.
const menu = at("/note-finder");
check("menu at /note-finder shows the note-finder background", menu.includes("--color-slate"));
check("menu at / shows the arpeggio background", at("/").includes("--color-sand"));
check("menu at /note-finder is slid to the second title", menu.includes("-50%"));

console.log("\nboss rules on the practice setup screen:");
check("practice setup offers the rules row", at("/arpeggio/positions").includes("Rules"));
check("…with every boss named",
  ["No Mistakes", "Pentatonic Only", "Root Only"].every((n) =>
    at("/arpeggio/positions").includes(n)));
check("…and its effect spelled out",
  at("/arpeggio/positions").includes("A wrong note costs a life and ends the drill"));
check("the game setup screen does not — a run imposes its own",
  !at("/arpeggio/game/setup").includes("No Mistakes"));

console.log("\nthe game routes:");
check("/arpeggio/game/setup asks for one position", at("/arpeggio/game/setup").includes("pick one"));
check("…and exactly 3 chords", at("/arpeggio/game/setup").includes("0/3"));
// A run has no hand on a cold load, so the URL must not strand the player.
check("/arpeggio/game with no hand falls back to setup", at("/arpeggio/game").includes("Start run"));
check("the menu offers a game", at("/").includes("Play →"));
check("…only on the arpeggio side", !at("/note-finder").includes("Play →"));

console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
if (failures) process.exit(1);
