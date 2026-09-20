const CACHE_NAME = "project-hub-v11";

const APP_SHELL = [
    "./",
    "./index.html",
    "./style.css",
    "./pwa.css",
    "./script.js",
    "./debug.js",
    "./refresh.js",
    "./pages/pages.css",
    "./pages/auth/login.html",
    "./pages/auth/login.css",
    "./pages/auth/login.js",
    "./pages/auth/register.html",
    "./pages/auth/register.css",
    "./pages/auth/register.js",
    "./pages/profile/profile.html",
    "./pages/profile/profile.css",
    "./pages/notes/notes.html",
    "./pages/notes/notes.css",
    "./pages/notes/notes.js",
    "./pages/tasks/tasks.html",
    "./pages/tasks/tasks.css",
    "./pages/tasks/tasks.js",
    "./pages/games/games.html",
    "./pages/games/games.css",
    "./pages/games/games.js",
    "./pages/places/places.html",
    "./pages/places/places.css",
    "./pages/places/places.js",
    "./manifest.webmanifest",
    "./icons/icon-192.png",
    "./icons/icon-512.png"
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    const request = event.request;
    const url = new URL(request.url);

    // Only handle GET requests belonging to the Project Hub frontend.
    if (request.method !== "GET" || url.origin !== self.location.origin) {
        return;
    }

    // HTML/navigation: prefer the network so deployed updates appear quickly.
    if (request.mode === "navigate" || request.destination === "document") {
        event.respondWith(
            fetch(request).catch(() => caches.match(request).then((cached) => cached || caches.match("./index.html")))
        );
        return;
    }

    // Static assets: cache first, then update the cache from the network.
    event.respondWith(
        caches.match(request).then((cached) => {
            const network = fetch(request)
                .then((response) => {
                    if (response.ok) {
                        const copy = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                    }
                    return response;
                })
                .catch(() => cached);

            return cached || network;
        })
    );
});
