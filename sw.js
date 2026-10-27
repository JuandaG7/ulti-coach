// Service worker: la app abre al instante y funciona sin internet.
// - Cada versión guarda una copia COMPLETA de la app (todos los archivos juntos), así nunca se
//   mezclan archivos viejos con nuevos. La app se sirve desde esa copia sin esperar a la red.
// - Al publicar cambios hay que subir CACHE: el iPhone descarga la versión nueva por detrás
//   y la usa en la siguiente apertura (la página se recarga sola una vez).
// - Librerías y modelo de pose (CDN): caché aparte que sobrevive entre versiones, porque pesan.
const CACHE = "ulti-coach-v29";
const CDN_CACHE = "ulti-coach-cdn";
const SHELL = [
  "./", "./index.html", "./style.css", "./app.js", "./store.js", "./scoring.js", "./ui.js",
  "./pose.js", "./metrics.js", "./plan.js", "./forehand.js", "./clips.js", "./manifest.json",
  "./icons/mark.svg", "./icons/logo.svg", "./icons/apple-touch-icon.png", "./icons/icon-192.png", "./icons/icon-512.png",
  "./data/tests.js", "./data/muscles.js", "./data/joints.js", "./data/exercises.js", "./data/safety.js",
  "./data/checkin.js", "./data/snapshot.js", "./data/return.js", "./data/protocols.js", "./data/body-map.js", "./data/demo.js",
  "./views/home.js", "./views/body.js", "./views/tests.js", "./views/video.js", "./views/sheet.js",
  "./views/test-sheet.js", "./views/profile.js", "./views/blindaje.js", "./views/exercise-sheet.js",
  "./views/share.js", "./views/checkin.js", "./views/jump-video.js", "./views/backup.js", "./views/send.js", "./views/team.js", "./views/forehand-guide.js", "./views/plan.js", "./views/angle-meter.js",
];

self.addEventListener("install", (e) => {
  // "reload" salta la caché HTTP: la copia de esta versión se arma con archivos frescos del servidor.
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: "reload" })))));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      // Solo borra versiones viejas de Ulti Coach: otras apps del mismo dominio (juandag7.github.io,
      // por ejemplo Narra) guardan aquí su propia copia sin conexión y no hay que tocarla.
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("ulti-coach") && k !== CACHE && k !== CDN_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || !req.url.startsWith("http")) return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    e.respondWith(fromShell(req));
  } else {
    e.respondWith(cdnFirst(req));
  }
});

async function fromShell(req) {
  const cache = await caches.open(CACHE);
  // Navegación (abrir la app): siempre la página de esta versión.
  const hit = req.mode === "navigate" ? await cache.match("./") : await cache.match(req, { ignoreSearch: true });
  return hit ?? fetch(req);
}

async function cdnFirst(req) {
  const cache = await caches.open(CDN_CACHE);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) cache.put(req, res.clone());
  return res;
}
