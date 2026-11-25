const CACHE = 'dacky-mobile-shell-v9';
const SHELL = [
  './', './index.html', './styles.css', './manifest.webmanifest', './src/catalog.js', './src/mobile-source-catalog.js', './src/engine.js',
  './src/store.js', './src/ui.js', './src/main.js', './src/source-adapter.js', './src/approved-source-data.js',
  './assets/crest.svg', './assets/city-panorama.jpg', './assets/heroes-atlas.svg', './assets/portraits/jiang-zia.webp', './assets/portraits/na-tra.webp', './assets/buildings/tuvithanh.webp'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('dacky-mobile-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(request, { ignoreVary: true });
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response.ok) cache.put(request, response.clone());
      return response;
    } catch {
      if (request.mode === 'navigate') {
        return await cache.match(new URL('./index.html', self.location.href).href) || Response.error();
      }
      return Response.error();
    }
  })());
});
