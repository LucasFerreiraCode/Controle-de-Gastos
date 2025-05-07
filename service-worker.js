self.addEventListener('install', event => {
    event.waitUntil(
        caches.open('gastos-v1').then(cache => {
            return cache.addAll([
                './',
                './index.html',
                './app.js',
                './manifest.json',
                './icon-192.png',
                './icon-512.png',
                'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css',
                'https://cdn.jsdelivr.net/npm/chart.js'
            ]);
        })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});
