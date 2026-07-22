/* Service worker «Хранителей Числовых Врат»: полный офлайн (GDD §17).
   index.html — network-first: при наличии сети всегда свежая версия игры,
   без сети — из кэша. Предкэшированные ассеты — cache-first.
   Всё прочее (src/*, dist/* при локальной разработке) SW НЕ кэширует —
   иначе он «замораживает» файлы, которых нет в проде, и правки не видны. */
const CACHE = "gates-v3";
const ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];
// имена ассетов, которые обслуживаем из кэша (index.html идёт отдельной веткой ниже)
const CACHEABLE = ["manifest.webmanifest", "icon-192.png", "icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  const isGame = e.request.mode === "navigate" || url.pathname.endsWith("/index.html");
  if (isGame) {
    // network-first: свежая игра при сети, кэш — в офлайне
    e.respondWith(
      fetch(e.request).then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put("./index.html", copy));
        }
        return res;
      }).catch(() => caches.match("./index.html"))
    );
    return;
  }
  // из кэша — только явно предкэшированные ассеты; остальное браузер берёт из сети сам
  if (!CACHEABLE.some(n => url.pathname.endsWith(n))) return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit => {
      if (hit) return hit;
      return fetch(e.request).then(res => {
        if (res.ok && url.origin === location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      });
    })
  );
});
