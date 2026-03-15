const CACHE = 'aws-quiz-v11';
const ASSETS = [
  './index.html',
  './category.html',
  './quiz.html',
  './settings.html',
  './css/styles.css',
  './js/state.js',
  './js/home.js',
  './js/category.js',
  './js/quiz.js',
  './js/settings.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    // ignoreSearch: true so quiz.html?category=X matches cached quiz.html
    caches.match(e.request, { ignoreSearch: true }).then(r => {
      if (r) return r;
      return fetch(e.request).catch(() =>
        new Response('<h2>You are offline. Please open the app once with internet to cache it.</h2>',
          { status: 503, headers: { 'Content-Type': 'text/html' } }
        )
      );
    })
  );
});
