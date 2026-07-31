/* Composition Book service worker — offline-first app shell */
var CACHE = "compbook-v5";
var SHELL = [
  "./",
  "index.html",
  "manifest.json",
  "icon-192.png",
  "icon-512.png"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(SHELL);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE; })
            .map(function (k) { return caches.delete(k); })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then(function (cached) {
      if (cached) {
        // Refresh the cached copy in the background
        fetch(event.request).then(function (fresh) {
          if (fresh && fresh.status === 200) {
            caches.open(CACHE).then(function (cache) {
              cache.put(event.request, fresh);
            });
          }
        }).catch(function () {});
        return cached;
      }
      return fetch(event.request).then(function (response) {
        // Cache fonts and other successful same-origin/opaque GETs for offline use
        if (response && (response.status === 200 || response.type === "opaque")) {
          var copy = response.clone();
          caches.open(CACHE).then(function (cache) {
            cache.put(event.request, copy);
          });
        }
        return response;
      }).catch(function () {
        return caches.match("index.html");
      });
    })
  );
});
