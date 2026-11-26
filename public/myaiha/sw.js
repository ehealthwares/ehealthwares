/* MyAIHA-only service worker — scope: /myaiha/.
 *
 * Network-only: it deliberately does not cache responses (so deploys are never
 * stale). The presence of a fetch handler is what makes the scoped manifest
 * installable as a PWA.
 */
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {
  /* handled by the network */
});
