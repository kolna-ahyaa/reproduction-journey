// ============================================
// Service Worker - رحلة التكاثر
// ============================================

const CACHE_NAME = 'reproduction-v1';

// الملفات الأساسية التي تُخزَّن أوفلاين
const CACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// ============================================
// 1) حدث Install - تخزين الملفات
// ============================================
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ============================================
// 2) حدث Activate - حذف الكاش القديم
// ============================================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => {
        return Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        );
      })
      .then(() => self.clients.claim())
  );
});

// ============================================
// 3) حدث Fetch - استراتيجية الجلب
// ============================================
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // طلبات API دائماً أونلاين
  if (url.pathname.startsWith('/api/') || 
      url.pathname.startsWith('/.netlify/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // للطلبات GET فقط
  if (event.request.method !== 'GET') return;

  // استراتيجية: Cache First ثم Network
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        // لا تخزّن إلا الاستجابات الناجحة
        if (!response || response.status !== 200 ||
            response.type === 'opaque') {
          return response;
        }

        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });

        return response;
      });
    }).catch(() => {
      // عند فشل الاتصال، أرجع index.html
      return caches.match('/index.html');
    })
  );
});

// ============================================
// 4) رسائل من الصفحة الرئيسية
// ============================================
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('✅ Service Worker جاهز');
