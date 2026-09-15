// Every screen has a URL, so a refresh — or a shared link, or the browser's
// back button — lands the player back where they were.

export type Screen =
  | "menu"
  | "positions"
  | "drill"
  | "theory"
  | "collection"
  | "game-setup"
  | "game";

const ROUTES: readonly { path: string; screen: Screen }[] = [
  { path: "/", screen: "menu" },
  { path: "/arpeggio/positions", screen: "positions" },
  { path: "/arpeggio/drill", screen: "drill" },
  { path: "/arpeggio/theory", screen: "theory" },
  { path: "/arpeggio/collection", screen: "collection" },
  { path: "/arpeggio/game/setup", screen: "game-setup" },
  { path: "/arpeggio/game", screen: "game" },
];

export const HOME: Screen = "menu";

const base = import.meta.env.BASE_URL.replace(/\/$/, "");

export function routeToPath(screen: Screen): string {
  const match = ROUTES.find((r) => r.screen === screen);
  return base + (match?.path ?? "/");
}

/** Anything unrecognised falls back to the menu rather than a blank screen. */
export function pathToRoute(pathname: string): Screen {
  const path = pathname.slice(base.length).replace(/\/+$/, "") || "/";
  return ROUTES.find((r) => r.path === path)?.screen ?? HOME;
}
