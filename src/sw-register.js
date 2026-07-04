/*
 * sw-register.js — registers the hand-rolled service worker.
 *
 * WHY GATED ON import.meta.env.PROD?
 *   Vite's dev server uses HTTP + on-the-fly transforms and HMR. A caching
 *   service worker in dev would freeze stale modules into the cache and break
 *   hot reload. So we only register the SW in production builds. To test the
 *   SW locally run: `npm run build && npm run preview`.
 *
 * WHY window.addEventListener('load', ...)?
 *   Registering on `load` (instead of immediately) lets the browser finish
 *   painting the page first — better perceived performance, especially on
 *   slow networks or low-power devices (which overlap heavily with the
 *   mobility-impaired users on entry-level phones we are designing for).
 */
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js', { scope: '/' })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.warn('Service worker registration failed:', err)
      })
  })
}
