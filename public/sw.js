const CACHE_NAME = "solos-electronics-v2";
const ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.svg",
  "/icon.png"
];

// Install Event
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Pre-caching Core App Shell Assets...");
      // Wrap in try-catch to prevent a single missing asset from breaking installation
      return Promise.allSettled(
        ASSETS.map(asset => {
          return cache.add(asset).catch(err => {
            console.warn(`[Service Worker] Failed to cache asset: ${asset}`, err);
          });
        })
      );
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[Service Worker] Removing Stale Cache Key:", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Stale-While-Revalidate caching strategy for ultra-fast load speed
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // Let browser handle Supabase, DevSockets, external telemetry, API endpoints or dynamic POST/PUT requests directly
  if (
    url.hostname.includes("supabase.co") || 
    url.href.includes("chrome-extension") ||
    url.pathname.includes("/api/") ||
    e.request.method !== "GET"
  ) {
    return;
  }

  // Optimize local origin assets and general static media for near-instant loads
  e.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(e.request).then((cachedResponse) => {
        // Fetch from network in background to refresh cache (Stale-While-Revalidate)
        const fetchPromise = fetch(e.request)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              cache.put(e.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch((err) => {
            console.debug("[Service Worker] Offline fallback or background fetch warning:", err);
          });

        // Serve cached resource instantly, falling back to background fetch if not yet cached
        return cachedResponse || fetchPromise.catch(() => {
          // Serve absolute home page if HTML request fails offline
          if (e.request.mode === 'navigate' || e.request.headers.get("accept")?.includes("text/html")) {
            return caches.match("/");
          }
        });
      });
    })
  );
});
