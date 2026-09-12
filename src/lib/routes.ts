// Every screen has a URL, so a refresh — or a shared link, or the browser's
// back button — lands the player back where they were.

/** The two halves of the menu carousel. Every route belongs to one of them. */
export type Mode = "arpeggio" | "note-finder";

export type Screen =
  | "menu"
  | "positions"
  | "drill"
  | "theory"
  | "game-setup"
  | "game";

/**
 * A screen, and which mode it belongs to. Carrying the mode on every route is
 * what lets the menu reopen on the half the player just came back from, rather
 * than always snapping to the arpeggio side.
 */
export interface Route {
  screen: Screen;
  mode: Mode;
}

const ROUTES: readonly (Route & { path: string })[] = [
  { path: "/", screen: "menu", mode: "arpeggio" },
  { path: "/arpeggio/positions", screen: "positions", mode: "arpeggio" },
  { path: "/arpeggio/drill", screen: "drill", mode: "arpeggio" },
  { path: "/arpeggio/theory", screen: "theory", mode: "arpeggio" },
  { path: "/arpeggio/game/setup", screen: "game-setup", mode: "arpeggio" },
  { path: "/arpeggio/game", screen: "game", mode: "arpeggio" },
  { path: "/note-finder", screen: "menu", mode: "note-finder" },
  { path: "/note-finder/drill", screen: "drill", mode: "note-finder" },
  { path: "/note-finder/theory", screen: "theory", mode: "note-finder" },
];

export const HOME: Route = { screen: "menu", mode: "arpeggio" };

/** The menu, opened on the half this route belongs to. */
export const menuOf = (mode: Mode): Route => ({ screen: "menu", mode });

const base = import.meta.env.BASE_URL.replace(/\/$/, "");

export function routeToPath({ screen, mode }: Route): string {
  const match = ROUTES.find((r) => r.screen === screen && r.mode === mode);
  return base + (match?.path ?? "/");
}

/** Anything unrecognised falls back to the menu rather than a blank screen. */
export function pathToRoute(pathname: string): Route {
  const path = pathname.slice(base.length).replace(/\/+$/, "") || "/";
  const match = ROUTES.find((r) => r.path === path);
  return match ? { screen: match.screen, mode: match.mode } : HOME;
}
