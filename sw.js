// À incrémenter avec chaque livraison affectant les fichiers précachés.
const VERSION = '0.2.0';
const ROOT = new URL('./', self.location.href);
const PREFIX = `code-secret:${ROOT.pathname}:`;
const CACHE = `${PREFIX}${VERSION}`;
const SHELL = [
  './index.html', './src/styles.css?v=0.2.0', './dist/app.js?v=0.2.0',
  './src/pwa.js?v=0.2.0', './manifest.webmanifest', './assets/icon.svg',
  './assets/icon-192.png', './assets/icon-512.png', './assets/icon-maskable-512.png',
  './assets/apple-touch-icon.png', './assets/qr-code-secret.png',
].map((path) => new URL(path, ROOT).href);

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL.map((url) => new Request(url, { cache: 'reload' })))));
  // Pas de skipWaiting : une nouvelle version n'interrompt pas une partie ouverte.
});
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name.startsWith(PREFIX) && name !== CACHE).map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== ROOT.origin || url.searchParams.get('test') === '1') return;
  const home = request.mode === 'navigate' && (url.pathname === ROOT.pathname || url.pathname === `${ROOT.pathname}index.html`);
  const key = home ? new URL('./index.html', ROOT).href : url.href;
  if (!home && !SHELL.includes(key)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    return (await cache.match(key)) || fetch(request);
  })());
});
