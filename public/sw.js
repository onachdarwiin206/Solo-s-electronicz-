const CACHE_NAME = "solos-electronics-v1";
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

// Fetch Event - Network First with Cache Fallback
self.addEventListener("fetch", (e) => {
  // Let browser handle Supabase, DevSockets, external telemetry or dynamic POST/PUT requests directly
  if (
    e.request.url.includes("supabase.co") || 
    e.request.url.includes("chrome-extension") ||
    e.request.url.includes("/api/") ||
    e.request.method !== "GET"
  ) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        // Only cache valid local static GET requests
        if (res.status === 200 && e.request.url.startsWith(self.location.origin)) {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, resClone);
          });
        }
        return res;
      })
      .catch(() => {
        // Fallback to cache on network failures
        return caches.match(e.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If HTML request failed, serve the main document
          if (e.request.headers.get("accept")?.includes("text/html")) {
            return caches.match("/");
          }
        });
      })
  );
});
