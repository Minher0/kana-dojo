// ─── KANA DOJO · Service worker ───────────────────────────────────────────────
// Stratégie : coquille pré-cachée à l'installation, navigations en
// réseau-d'abord (l'app reste fraîche), statiques en cache-d'abord.
// Version : KD-SFX-1 (bump à chaque déploiement pour forcer la mise à jour).

const CACHE = "kana-dojo-KD-SFX-1";
const CORE = [
  "/",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-192.png",
  "/icons/maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // allSettled : une icône manquante ne doit jamais bloquer l'install
      await Promise.allSettled(
        CORE.map(async (url) => {
          const res = await fetch(url, { cache: "no-cache" });
          if (res.ok) await cache.put(url, res);
        })
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // Le service worker lui-même n'est jamais intercepté
  if (url.pathname === "/sw.js") return;

  // Navigations : réseau d'abord, cache de repli (hors-ligne)
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(req, { cache: "no-cache" });
          const cache = await caches.open(CACHE);
          cache.put("/", res.clone());
          return res;
        } catch {
          const cached = (await caches.match("/")) || (await caches.match(req));
          return (
            cached ||
            new Response("Hors connexion", {
              status: 503,
              headers: { "Content-Type": "text/plain; charset=utf-8" },
            })
          );
        }
      })()
    );
    return;
  }

  // Statiques : cache d'abord, puis réseau (et on garde pour la prochaine fois)
  if (
    url.pathname.startsWith("/_next/static") ||
    url.pathname.startsWith("/icons/") ||
    CORE.includes(url.pathname)
  ) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(req);
        if (cached) return cached;
        try {
          const res = await fetch(req);
          if (res.ok) {
            const cache = await caches.open(CACHE);
            cache.put(req, res.clone());
          }
          return res;
        } catch {
          return new Response("", { status: 504 });
        }
      })()
    );
  }
});
