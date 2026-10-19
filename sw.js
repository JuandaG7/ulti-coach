// Service worker: permite instalar la app y que abra sin internet.
// - Archivos propios: primero red (para ver cambios), si no hay red usa caché.
// - Librerías y modelo (CDN): primero caché, porque pesan y no cambian.
const CACHE = "ulti-coach-v6";
const SHELL = [
  "./", "./index.html", "./style.css", "./app.js", "./store.js", "./scoring.js", "./ui.js",
  "./pose.js", "./metrics.js", "./manifest.json",
  "./data/tests.js", "./data/muscles.js", "./data/joints.js", "./data/body-map.js", "./data/demo.js",
  "./views/home.js", "./views/body.js", "./views/tests.js", "./views/video.js",
  "./views/sheet.js", "./views/test-sheet.js", "./views/profile.js", "./views/blindaje.js",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || !e.request.url.startsWith("http")) return;
  const sameOrigin = new URL(e.request.url).origin === location.origin;
  e.respondWith(sameOrigin ? networkFirst(e.request) : cacheFirst(e.request));
});

async function networkFirst(req) {
  try {
    const res = await fetch(req);
    const cache = await caches.open(CACHE);
    cache.put(req, res.clone());
    return res;
  } catch {
    return (await caches.match(req)) ?? Response.error();
  }
}

async function cacheFirst(req) {
  const hit = await caches.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) (await caches.open(CACHE)).put(req, res.clone());
  return res;
}
