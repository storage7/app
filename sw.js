const CACHE_NAME = 'stream-app-ui-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/app.js'
];

self.addEventListener('install', event => {
    event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE)));
});

self.addEventListener('fetch', event => {
    const requestUrl = new URL(event.request.url);

    // If the request is going to Abyss.to API, NEVER cache it (fetch real-time)
    if (requestUrl.hostname === 'api.abyss.to') {
        event.respondWith(fetch(event.request));
        return;
    }

    // Otherwise, serve static UI files from cache first, fallback to network
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});
