const CACHE_NAME = "dispatch-v1";

// Assets to pre-cache on install
const PRE_CACHE_URLS = ["/", "/offline"];

// Install: pre-cache shell
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then((cache) => cache.addAll(PRE_CACHE_URLS).catch(() => { }))
            .then(() => self.skipWaiting())
    );
});

// Activate: clean up old caches
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(
                    keys
                        .filter((key) => key !== CACHE_NAME)
                        .map((key) => caches.delete(key))
                )
            )
            .then(() => self.clients.claim())
    );
});

// Fetch: network-first for API/auth, stale-while-revalidate for static assets
self.addEventListener("fetch", (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET and non-same-origin requests
    if (request.method !== "GET" || url.origin !== self.location.origin) {
        return;
    }

    // Network-only for API routes and auth
    if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) {
        return;
    }

    // Network-first for navigation (HTML pages)
    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                    }
                    return response;
                })
                .catch(() =>
                    caches
                        .match(request)
                        .then((cached) => cached || caches.match("/offline"))
                )
        );
        return;
    }

    // Stale-while-revalidate for static assets (_next/static, icons, etc.)
    if (
        url.pathname.startsWith("/_next/static/") ||
        url.pathname.match(/\.(png|svg|ico|woff2?|css|js)$/)
    ) {
        event.respondWith(
            caches.open(CACHE_NAME).then((cache) =>
                cache.match(request).then((cached) => {
                    const fetchPromise = fetch(request).then((response) => {
                        if (response.ok) cache.put(request, response.clone());
                        return response;
                    });
                    return cached || fetchPromise;
                })
            )
        );
    }
});
