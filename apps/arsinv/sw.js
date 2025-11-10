/**
 * Service Worker for ARS Inventory System v2.0
 * Provides offline support and caching
 */

const CACHE_NAME = 'ars-inventory-v2.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/config.js',
  '/app.js',
  '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[Service Worker] Installed successfully');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('[Service Worker] Activated successfully');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }

        return fetch(event.request).then(response => {
          // Don't cache if not a successful response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Cache the fetched response for future use
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(() => {
        // Fallback for offline
        console.log('[Service Worker] Fetch failed; returning offline page instead.');
        // You could return a custom offline page here
      })
  );
});

// Background sync event (for future implementation)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-inventory') {
    console.log('[Service Worker] Background sync triggered');
    event.waitUntil(syncInventoryData());
  }
});

// Helper function for background sync
function syncInventoryData() {
  // Implementation for syncing queued data when coming back online
  return Promise.resolve();
}
