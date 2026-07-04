/*
 * service-worker.js — hand-rolled Service Worker for the Accessible Campus Navigator.
 *
 * WHY A HAND-ROLLED SW (instead of vite-plugin-pwa / Workbox)?
 *   The task brief explicitly asked for a discrete, heavily-commented
 *   service-worker.js file. Keeping it hand-rolled makes every caching and
 *   accessibility-adjacent decision (offline availability of the app shell,
 *   opaque-response handling for the Tailwind CDN, etc.) visible for review.
 *
 * STRATEGY
 *   1. install  — precache the "app shell": the static URLs whose names are
 *                 known at author time. We do NOT precache Vite's hashed
 *                 JS/CSS bundles (their names are unknown until build time);
 *                 they get cached on first fetch instead (runtime caching).
 *   2. activate — delete any cache that isn't the current version, then claim
 *                 all open clients so the new SW takes effect immediately.
 *   3. fetch    — cache-first for same-origin GETs (instant loads, offline OK),
 *                 stale-while-revalidate for the Tailwind CDN (cross-origin,
 *                 opaque responses are safe to cache but not to read), and
 *                 straight network pass-through for everything else.
 *
 * ACCESSIBILITY ANGLE
 *   A user with a mobility impairment may be slow to interact with the page; an
 *   unreliable network must not blank out the UI they are mid-task on. By
 *   caching the app shell + routes view, the app stays usable offline so a
 *   dropped connection never strands a user mid-navigation.
 */

const CACHE = 'acn-v1'

// App shell — URLs whose paths are stable across builds.
// Note: `/index.html` is the Vite entry; in dev it is served as-is, in the
// build it is emitted to dist/index.html. Either way the path is `/`.
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icon-192.svg',
  '/icon-512.svg',
]

// Tailwind Play CDN. Cached cross-origin so the UI stays styled offline.
const TAILWIND_CDN = 'https://cdn.tailwindcss.com'

// ────────────────────────────────────────────────────────────────────────────
// install: precache the app shell, then activate as soon as possible.
// We call skipWaiting() so a refreshed SW controls the page immediately
// instead of waiting for all tabs to close.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  )
})

// ────────────────────────────────────────────────────────────────────────────
// activate: clean up old caches and claim existing clients.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  )
})

// ────────────────────────────────────────────────────────────────────────────
// fetch: route requests by origin + method.
self.addEventListener('fetch', (event) => {
  const { request } = event

  // Only intercept GET. POST/PUT/DELETE etc. always go to network.
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Tailwind CDN: stale-while-revalidate. Cross-origin responses are "opaque"
  // (status 0, no body inspection) but are still valid to put in the cache and
  // to serve back. We revalidate in the background.
  if (url.origin === new URL(TAILWIND_CDN).origin) {
    event.respondWith(staleWhileRevalidate(request))
    return
  }

  // Same-origin: cache-first with runtime population. This catches Vite's
  // hashed bundles (/assets/index-<hash>.js) on first load and serves them
  // from cache thereafter — including offline.
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request))
    return
  }

  // Anything else: pass through to the network (don't cache, don't intercept).
  // Falling through here means the browser handles the request normally.
})

// ────────────────────────────────────────────────────────────────────────────
// Cache strategies

async function cacheFirst(request) {
  const cache = await caches.open(CACHE)
  const cached = await cache.match(request)
  if (cached) return cached
  try {
    const response = await fetch(request)
    // Only cache successful, basic/cors responses (avoid caching errors / opaque
    // same-origin oddities).
    if (response.ok && response.type === 'basic') {
      cache.put(request, response.clone())
    }
    return response
  } catch (err) {
    // Offline and not cached: return a minimal fallback so the app shell never
    // shows a raw browser error. The React app will still render the cached
    // index.html for navigations; this fallback only fires for sub-resource
    // misses.
    return new Response('Offline and resource not cached.', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain' },
    })
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE)
  const cached = await cache.match(request)
  const network = fetch(request)
    .then((response) => {
      // Opaque responses (type: 'opaque') have status 0; cache them anyway.
      if (response.ok || response.type === 'opaque') {
        cache.put(request, response.clone())
      }
      return response
    })
    .catch(() => cached) // network failed — fall back to cache (may be undefined)
  return cached || network
}
