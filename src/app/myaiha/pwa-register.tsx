'use client';

import { useEffect } from 'react';

/**
 * Registers the MyAIHA-only service worker (scope `/myaiha/`). Rendered only by
 * the `/myaiha` layout so the rest of the site stays a normal website.
 */
export function PwaRegister() {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    const register = () => {
      void navigator.serviceWorker
        .register('/myaiha/sw.js', { scope: '/myaiha/' })
        .catch(() => undefined);
    };

    if (document.readyState === 'complete') {
      register();
      return;
    }
    window.addEventListener('load', register, { once: true });
    return () => window.removeEventListener('load', register);
  }, []);

  return null;
}
