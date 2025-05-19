self.addEventListener('install', event => {
    event.waitUntil(
        caches.open('gastos-v2').then(cache => {
            return cache.addAll([
                './',
                './index.html',
                './app.js',
                './style.css',
                './manifest.json',
                './icon-192.png',
                './icon-512.png',
                './img/logo.projeto.png',
                './img/Robo-correto.png',
                './img/Robo-erro.png',
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
