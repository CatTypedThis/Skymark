const CACHE_NAME = "sky-beacon-shell-v3";
const APP_SHELL = [
  "/",
  "/offline",
  "/icons/icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
  "/icons/maskable-icon-512.png",
  "/images/camera-backdrop.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).catch(() => caches.match("/offline")));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const url = new URL(event.request.url);
        const cacheableShellAsset = APP_SHELL.includes(url.pathname);

        if (response.ok && cacheableShellAsset) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }

        return response;
      })
      .catch(() => caches.match(event.request)),
  );
});
