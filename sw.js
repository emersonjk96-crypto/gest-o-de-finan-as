const CACHE = "painel-fin-v5";
const URLS = ["/gest-o-de-finan-as/", "/gest-o-de-finan-as/index.html"];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const url = e.request.url;
  // Ignora POST, chrome-extension e qualquer coisa não-http
  if (e.request.method !== "GET") return;
  if (!url.startsWith("http://") && !url.startsWith("https://")) return;

  // Navegação: sempre busca da rede (para pegar index.html atualizado)
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request)
        .then(r => {
          // Atualiza cache com versão nova
          if (r.ok) {
            const clone = r.clone();
            caches.open(CACHE).then(c => { try { c.put(e.request, clone); } catch(_) {} });
          }
          return r;
        })
        .catch(() => caches.match("/gest-o-de-finan-as/index.html"))
    );
    return;
  }

  // Apenas CDN estáticos — cache-first
  const isStatic = url.includes("cdnjs.cloudflare.com") || url.includes("gstatic.com");
  if (!isStatic) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(r => {
        if (r.ok) {
          const clone = r.clone();
          caches.open(CACHE).then(c => { try { c.put(e.request, clone); } catch(_) {} });
        }
        return r;
      });
    })
  );
});
