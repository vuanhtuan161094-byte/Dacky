const CACHE = 'dacky-mobile-shell-v29-art01-r3';
const SHELL = [
  './', './index.html', './styles.css', './manifest.webmanifest', './src/catalog.js', './src/mobile-source-catalog.js', './src/legacy-quest-catalog.js', './src/legacy-buzhou-catalog.js', './src/legacy-troop-time-catalog.js', './src/legacy-troop-requirement-catalog.js', './src/engine.js',
  './src/store.js', './src/ui.js', './src/main.js', './src/visual-art-catalog.js', './src/source-adapter.js', './src/approved-source-data.js', './src/legacy-city-garrison-catalog.js', './src/legacy-elfland-catalog.js',
  './src/simulated-world.js', './src/gameplay-p15.js', './src/quest-conditions-p16.js', './src/pve-campaign.js', './src/legacy-endgame-catalog.js', './src/legacy-pve-troops.js', './src/combat/army-artifacts.js', './src/combat/army-battle.js', './src/combat/battle-session-v10.js', './src/combat/command-v8.js', './src/combat/core.js', './src/combat/hero-progression.js', './src/combat/legacy-duel-facts.js', './src/combat/legacy-duel.js', './src/combat/legacy-progression-facts.js', './src/combat/product-v13.js', './src/combat/progression-v3.js', './src/combat/runtime-v7.js', './src/combat/source-rules.js', './src/combat/strategic-v6.js', './src/combat/tactics-v6.js',
  './assets/crest.svg', './assets/city-panorama.jpg', './assets/heroes-atlas.svg', './assets/portraits/jiang-zia.webp', './assets/portraits/na-tra.webp', './assets/buildings/tuvithanh.webp',
  './assets/mobile-source/assets/map-ng/thanh/map008.webp', './assets/mobile-source/assets/map-ng/thanh/map00401.webp', './assets/visual-art-manifest.json',
  './assets/mobile-source/flash/city/RES_BARBACK_IMAGE.png', './assets/mobile-source/flash/city/RES_LUMBERYARD_IMAGE.png', './assets/mobile-source/flash/city/RES_QUARRY_IMAGE.png', './assets/mobile-source/flash/city/RES_IRONSMITH_IMAGE.png', './assets/mobile-source/flash/city/RES_FSMARKET_IMAGE.png', './assets/mobile-source/flash/city/RES_SCHOOL_IMAGE.png', './assets/mobile-source/flash/city/RES_CALLHERO_IMAGE.png', './assets/mobile-source/flash/city/RES_GYMKHANA_IMAGE.png', './assets/mobile-source/flash/city/RES_HOSPITAL_IMAGE.png', './assets/mobile-source/flash/city/RES_WARFLAMESTAGE_IMAGE.png', './assets/mobile-source/flash/city/RES_CROPLAND_IMAGE.png', './assets/mobile-source/flash/city/RES_IRONOREFIELD_IMAGE.png', './assets/mobile-source/flash/city/RES_HONGLUTEMPLE_IMAGE.png', './assets/mobile-source/flash/city/RES_DAK_IMAGE.png', './assets/mobile-source/flash/city/RES_GOVERNMENT_IMAGE.png', './assets/mobile-source/flash/city/RES_HOUSE_IMAGE.png', './assets/mobile-source/flash/city/RES_HOSTEL_IMAGE.png', './assets/mobile-source/flash/city/RES_ARTISANWORKSHOP_IMAGE.png', './assets/mobile-source/flash/city/RES_SkirmisherBarrack_IMAGE.png', './assets/mobile-source/flash/city/RES_HORSESTALL_IMAGE.png'
];

self.addEventListener('install', event => {
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await cache.addAll(SHELL);
    const manifest=await cache.match('./assets/visual-art-manifest.json');
    const assets=(await manifest.json()).assets.map(asset=>'./'+asset.path);
    for(let i=0;i<assets.length;i+=24)await cache.addAll(assets.slice(i,i+24));
    await self.skipWaiting();
  })());
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
