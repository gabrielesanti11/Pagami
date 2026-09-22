const CACHE_NAME = "pagami-v1";

const ASSETS = [
  "./",
  "./index.html",
  "./pagheicon-192.png",
  "./pagheicon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );

  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Il manifest deve essere SEMPRE aggiornato dalla rete
  if (req.url.includes("manifest.webmanifest")) {
    event.respondWith(
      fetch(req, { cache: "no-store" })
    );
    return;
  }

  // HTML: network-first
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put("./index.html", copy);
          });
          return res;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // Altri asset: cache-first
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
