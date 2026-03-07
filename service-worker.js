// ===============================
// FORÇAR O SW NOVO A ASSUMIR O CONTROLE
// ===============================
self.addEventListener('install', (event) => {
  self.skipWaiting(); // força ativação imediata

  const CACHE_NAME = 'gerenciador-de-clientes-v23';
  const urlsToCache = [
      '/',
      '/index.html',
      '/css/estilo.css',
      '/img/icon192.png',
      '/img/icon512.png',
      '/img/iconpadrao1024.png',
      '/javascript/script.js'
  ];

  event.waitUntil(
      caches.open(CACHE_NAME)
        .then(cache => {
            console.log('Service Worker: fazendo cache dos arquivos');
            return cache.addAll(urlsToCache);
        })
  );
});

// ===============================
// ATIVAÇÃO — REMOVE CACHE ANTIGO E ASSUME CONTROLE
// ===============================
self.addEventListener('activate', (event) => {
  event.waitUntil(
      caches.keys().then((cacheNames) => {
          return Promise.all(
              cacheNames.map((cache) => {
                  if (cache !== 'gerenciador-de-clientes-v3') {
                      console.log('Service Worker: removendo cache antigo:', cache);
                      return caches.delete(cache);
                  }
              })
          );
      })
  );

  clients.claim(); // assume controle imediato das abas abertas
});

// ===============================
// FETCH — ENTREGA DO CACHE + ONLINE
// ===============================
self.addEventListener('fetch', (event) => {

  // 🔥 NÃO INTERCEPTAR PEDIDOS DO FIREBASE CLOUD MESSAGING
  if (event.request.url.includes("fcm.googleapis.com")) {
      return fetch(event.request); // deixa passar direto
  }

  event.respondWith(
      caches.match(event.request)
          .then((response) => {
              if (response) {
                  return response; // retorna do cache
              }
              console.log('Service Worker: buscando online:', event.request.url);
              return fetch(event.request);
          })
          .catch(() => caches.match('/index.html'))
  );
});