self.addEventListener('install', (event) => {
  console.log('Único OS Service Worker: Instalado');
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  console.log('Único OS Service Worker: Activo');
  event.waitUntil(self.clients.claim());
});

// Escuchar notificaciones (Base para futuro Push remoto)
self.addEventListener('push', (event) => {
  const data = event.data.json();
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png'
  });
});