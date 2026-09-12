import { useCallback, useEffect, useState } from 'react';
import { pathToRoute, routeToPath } from '../lib/routes';
import type { Route } from '../lib/routes';

/**
 * The current screen, kept in the URL. Navigating pushes a history entry so the
 * device back button and back gesture work; `replace` is for changes that are
 * not really a new screen — flipping the menu carousel, say — which should not
 * stack up entries to back out of one at a time.
 */
export function useRoute(): [Route, (to: Route, replace?: boolean) => void] {
  const [route, setRoute] = useState<Route>(() =>
    pathToRoute(window.location.pathname),
  );

  useEffect(() => {
    const onPop = () => setRoute(pathToRoute(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = useCallback((to: Route, replace = false) => {
    const path = routeToPath(to);
    if (path !== window.location.pathname) {
      if (replace) window.history.replaceState(null, '', path);
      else window.history.pushState(null, '', path);
    }
    setRoute(to);
  }, []);

  return [route, navigate];
}
