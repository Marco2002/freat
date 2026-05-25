import { useState, useEffect } from 'react';

export function useInvertSetting(): [boolean, (v: boolean | ((prev: boolean) => boolean)) => void] {
  const [invert, setInvertState] = useState(() => {
    try {
      const stored = localStorage.getItem('arp-invert');
      return stored === null ? true : stored === '1';
    } catch { return true; }
  });

  const setInvert = (v: boolean | ((prev: boolean) => boolean)) => {
    setInvertState(prev => {
      const next = typeof v === 'function' ? v(prev) : v;
      try { localStorage.setItem('arp-invert', next ? '1' : '0'); } catch { /* noop */ }
      return next;
    });
  };

  return [invert, setInvert];
}
