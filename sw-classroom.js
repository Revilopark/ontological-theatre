// IAM Classroom Service Worker — silent background updates, offline support
const CACHE = 'iam-classroom-v1';
const CORE = [
  '/ontological-theatre/iam-classroom.html',
  '/ontological-theatre/iam-classroom.html?login=',
];

// Install: cache the shell immediately
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache =>
      cache.addAll(['/ontological-theatre/iam-classroom.html'])
    ).then(() => self.skipWaiting())
  );
});

// Activate: clean old caches silently
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch strategy: Network-first for the HTML (always get latest), cache fallback
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  
  // Only handle same-origin requests for our classroom page
  if (!url.pathname.includes('iam-classroom')) {
    return; // Let everything else pass through normally
  }
  
  e.respondWith(
    fetch(e.request.clone())
      .then(response => {
        // Got fresh version — update the cache silently
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Network failed — serve from cache (offline mode)
        return caches.match(e.request).then(cached => {
          if (cached) return cached;
          // Last resort: serve the base HTML for any classroom URL
          return caches.match('/ontological-theatre/iam-classroom.html');
        });
      })
  );
});

// Background sync: retry queued messages when back online
self.addEventListener('sync', e => {
  if (e.tag === 'iam-message-retry') {
    e.waitUntil(
      self.clients.matchAll().then(clients =>
        clients.forEach(c => c.postMessage({type: 'RETRY_QUEUED_MESSAGES'}))
      )
    );
  }
});

// Push: future notifications support
self.addEventListener('push', e => {
  if (!e.data) return;
  const data = e.data.json();
  e.waitUntil(
    self.registration.showNotification(data.title || 'IAM Classroom', {
      body: data.body,
      icon: '/ontological-theatre/icons/icon-192.png',
      badge: '/ontological-theatre/icons/icon-72.png',
      data: data
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow('/ontological-theatre/iam-classroom.html'));
});
