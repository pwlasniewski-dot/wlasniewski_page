// Service Worker — Właśniewski Foto PWA
// Strategia:
//  - HTML: network-first, fallback do cache, ostateczny fallback /offline
//  - Assets statyczne (CSS/JS/images): stale-while-revalidate
//  - API + admin: zawsze network-only (żadnego cachowania danych użytkowników)
//  - SKIP cachowania: panele admin/płatności/payu

const VERSION = 'v1.0.0';
const STATIC_CACHE = `wlasniewski-static-${VERSION}`;
const RUNTIME_CACHE = `wlasniewski-runtime-${VERSION}`;
const OFFLINE_URL = '/offline';

const PRECACHE = [
    '/',
    '/offline',
    '/site.webmanifest',
    '/favicon-192.png',
    '/favicon-512.png',
];

// Ścieżki, których NIGDY nie cachujemy (dane użytkowników, płatności, admin)
const NO_CACHE_PATHS = [
    '/api/',
    '/admin/',
    '/strefa-klienta',
    '/checkout',
    '/payment',
    '/payu',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) =>
            cache.addAll(PRECACHE).catch(() => null)
        ).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((k) => k !== STATIC_CACHE && k !== RUNTIME_CACHE && k.startsWith('wlasniewski-'))
                    .map((k) => caches.delete(k))
            )
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Tylko GET
    if (request.method !== 'GET') return;

    const url = new URL(request.url);

    // Tylko same-origin
    if (url.origin !== self.location.origin) return;

    // Skip dla API/admin/płatności
    if (NO_CACHE_PATHS.some((p) => url.pathname.startsWith(p))) return;

    // HTML — network-first
    if (request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const copy = response.clone();
                    caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy)).catch(() => null);
                    return response;
                })
                .catch(() =>
                    caches.match(request).then((cached) => cached || caches.match(OFFLINE_URL))
                )
        );
        return;
    }

    // Statyczne assets: _next/static, /images, fonts — stale-while-revalidate
    if (
        url.pathname.startsWith('/_next/static/') ||
        url.pathname.startsWith('/images/') ||
        url.pathname.startsWith('/fonts/') ||
        /\.(?:css|js|png|jpg|jpeg|gif|webp|svg|woff2?|ttf|ico)$/.test(url.pathname)
    ) {
        event.respondWith(
            caches.match(request).then((cached) => {
                const fetchPromise = fetch(request)
                    .then((response) => {
                        if (response && response.status === 200) {
                            const copy = response.clone();
                            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy)).catch(() => null);
                        }
                        return response;
                    })
                    .catch(() => cached);
                return cached || fetchPromise;
            })
        );
    }
});

// Push (przyszłościowo — powiadomienia o nowych rezerwacjach)
self.addEventListener('push', (event) => {
    if (!event.data) return;
    let data = {};
    try { data = event.data.json(); } catch { data = { title: 'Właśniewski Foto', body: event.data.text() }; }
    const title = data.title || 'Właśniewski Foto';
    const options = {
        body: data.body || '',
        icon: '/favicon-192.png',
        badge: '/favicon-192.png',
        data: { url: data.url || '/' },
        vibrate: [100, 50, 100],
    };
    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const url = event.notification.data?.url || '/';
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((wins) => {
            for (const w of wins) {
                if (w.url.includes(url) && 'focus' in w) return w.focus();
            }
            return clients.openWindow(url);
        })
    );
});
