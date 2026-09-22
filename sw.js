const CACHE_NAME = "project-hub-v31";

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
    "./pages/notifications/notifications.html",
    "./pages/notifications/notifications.css",
    "./pages/notifications/notifications.js",
    "./pages/games/games.html",
    "./pages/games/games.css",
    "./pages/games/games.js",
    "./pages/places/places.html",
    "./pages/places/places.css",
    "./pages/places/places.js",
    "./manifest.webmanifest",
    "./assets/apple-touch-icon.png",
    "./icons/icon-192.png",
    "./icons/icon-512.png",
    "./notifications.js"
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


// Web Push: the backend can call this once VAPID push delivery is enabled.
self.addEventListener("push", (event) => {
    let data = {};
    try { data = event.data ? event.data.json() : {}; } catch (_) {}
    const title = data.title || "Project Hub";
    const options = {
        body: data.body || "Új emlékeztetőd van.",
        icon: data.icon || "./icons/icon-192.png",
        badge: data.badge || "./icons/icon-192.png",
        tag: data.tag || "project-hub-reminder",
        data: { url: data.url || "./pages/tasks/tasks.html" }
    };
    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const url = event.notification.data?.url || "./pages/tasks/tasks.html";
    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
            for (const client of list) {
                if ("focus" in client) {
                    client.navigate(url);
                    return client.focus();
                }
            }
            return clients.openWindow(url);
        })
    );
});
