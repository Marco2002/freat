import { useCallback, useEffect, useState } from 'react';
import { pathToRoute, routeToPath } from '../lib/routes';
import type { Screen } from '../lib/routes';

/**
 * The current screen, kept in the URL. Navigating pushes a history entry so the
 * device back button and back gesture work; `replace` is for arrivals that are
 * not really a new screen — a cold load redirected somewhere else, say — which
 * should not stack up entries to back out of one at a time.
 */
export function useRoute(): [Screen, (to: Screen, replace?: boolean) => void] {
  const [screen, setScreen] = useState<Screen>(() =>
    pathToRoute(window.location.pathname),
  );

  useEffect(() => {
    const onPop = () => setScreen(pathToRoute(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = useCallback((to: Screen, replace = false) => {
    const path = routeToPath(to);
    if (path !== window.location.pathname) {
      if (replace) window.history.replaceState(null, '', path);
      else window.history.pushState(null, '', path);
    }
    setScreen(to);
  }, []);

  return [screen, navigate];
}
