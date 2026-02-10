const CACHE_NAME = 'mvrio-night-v1';
const AUDIO_CACHE_NAME = 'mvrio-night-audio-v1';

const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Check if this is an audio request
  const isAudioRequest = /\.(mp3|wav|ogg|m4a)$/i.test(url.pathname) || 
                         event.request.url.includes('/audio/') ||
                         event.request.destination === 'audio';

  if (isAudioRequest) {
    // For audio requests, try cache first (for offline support), then network
    event.respondWith(
      caches.open(AUDIO_CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            // Return cached audio if available
            return cachedResponse;
          }
          
          // Otherwise fetch from network (but don't cache automatically)
          return fetch(event.request).then((networkResponse) => {
            // Don't auto-cache audio - only explicit caching via offlineAudioCache.ts
            return networkResponse;
          }).catch(() => {
            // If offline and not cached, fail gracefully
            return new Response('Audio not available offline', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
        });
      })
    );
    return;
  }

  // For non-audio requests, use standard caching strategy
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).then((response) => {
          // Don't cache if not a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Keep both app shell cache and audio cache
          if (cacheName !== CACHE_NAME && cacheName !== AUDIO_CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
