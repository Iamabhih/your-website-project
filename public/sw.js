// Service Worker for Ideal Smoke Supply PWA
const CACHE_NAME = 'ideal-smoke-supply-v2';
const RUNTIME_CACHE = 'runtime-cache-v2';
const IMAGE_CACHE = 'image-cache-v2';

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/shop',
  '/offline.html',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Pre-caching core assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== CACHE_NAME &&
                   cacheName !== RUNTIME_CACHE &&
                   cacheName !== IMAGE_CACHE;
          })
          .map((cacheName) => {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Handle API calls - network first, cache fallback
  if (url.pathname.includes('/functions/') || url.pathname.includes('supabase')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone and cache successful responses
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
    return;
  }

  // Handle images - cache first, network fallback
  if (request.destination === 'image') {
    event.respondWith(
      caches.open(IMAGE_CACHE).then((cache) => {
        return cache.match(request).then((response) => {
          return response || fetch(request).then((networkResponse) => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });
        });
      }).catch(() => {
        // Return placeholder image if offline
        return new Response('<svg>...</svg>', {
          headers: { 'Content-Type': 'image/svg+xml' }
        });
      })
    );
    return;
  }

  // Handle navigation - for SPA, always return index.html (app shell)
  // React Router will handle client-side routing
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch('/')
        .then((response) => {
          // Cache the app shell
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put('/', responseClone);
          });
          return response;
        })
        .catch(() => {
          // Offline - try to serve cached app shell, then offline page
          return caches.match('/').then((response) => {
            return response || caches.match('/offline.html');
          });
        })
    );
    return;
  }

  // Default: cache first, network fallback
  event.respondWith(
    caches.match(request).then((response) => {
      return response || fetch(request).then((networkResponse) => {
        // Cache the new resource
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return networkResponse;
      });
    })
  );
});

// Background sync for offline orders
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Background sync:', event.tag);

  if (event.tag === 'sync-orders') {
    event.waitUntil(
      // Sync offline orders when connection restored
      syncOfflineOrders()
    );
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push notification received');

  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Ideal Smoke Supply';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: data.url || '/',
    actions: data.actions || [
      { action: 'open', title: 'Open' },
      { action: 'close', title: 'Close' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification clicked');

  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data || '/')
    );
  }
});

// Helper function to sync offline orders
async function syncOfflineOrders() {
  // Implementation for syncing offline orders
  // This would queue orders made while offline and send them when online
  console.log('[ServiceWorker] Syncing offline orders...');
}

// Message handler for communication with main thread
self.addEventListener('message', (event) => {
  console.log('[ServiceWorker] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});
