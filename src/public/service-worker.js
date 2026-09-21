const CACHE_NAME = 'storymap-shell-v1';
const APP_SHELL = [
  '/',
  '/index.html',
  '/images/logo.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
    )),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match('/index.html'))),
  );
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const storyId = data.storyId || data.id;
  const title = data.title || 'Cerita baru di StoryMap';
  const options = {
    body: data.message || data.body || 'Ada cerita baru yang bisa Anda jelajahi.',
    icon: data.icon || '/images/logo.png',
    badge: data.badge || '/images/logo.png',
    data: { storyId },
    tag: storyId ? `story-${storyId}` : 'storymap-update',
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const storyId = event.notification.data && event.notification.data.storyId;
  const targetUrl = storyId ? `/#/stories/${storyId}` : '/#/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      const client = windowClients.find((item) => 'focus' in item);
      if (client) {
        client.navigate(targetUrl);
        return client.focus();
      }
      return clients.openWindow(targetUrl);
    }),
  );
});