// Service Worker for Energy Drink App
// Version: 1.0.0
// Cache strategies and offline functionality

const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `energy-drink-cache-${CACHE_VERSION}`;

// Cache configurations
const CACHE_CONFIGS = {
  static: {
    name: 'static-assets',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    maxEntries: 100
  },
  images: {
    name: 'image-cache',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    maxEntries: 50
  },
  api: {
    name: 'api-cache',
    maxAge: 5 * 60 * 1000, // 5 minutes
    maxEntries: 30
  },
  pages: {
    name: 'page-cache',
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    maxEntries: 20
  }
};

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/favicon.ico',
  // Add critical CSS and JS files
  '/_next/static/css/app/layout.css',
  '/_next/static/js/app/layout.js'
];

// API endpoints that should be cached
const CACHEABLE_APIS = [
  '/api/flavors',
  '/api/ingredients',
  '/api/safety/limits',
  '/api/suppliers'
];

// Background sync queue for offline actions
const syncQueue = [];

// Cache management utilities
class CacheManager {
  constructor() {
    this.caches = new Map();
  }

  async openCache(config) {
    const cacheName = `${CACHE_NAME}-${config.name}`;
    const cache = await caches.open(cacheName);
    this.caches.set(config.name, cache);
    return cache;
  }

  async cacheFirst(request, config) {
    const cache = await this.getCache(config.name);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Check if cache is expired
      const cacheDate = new Date(cachedResponse.headers.get('sw-cache-date') || 0);
      if (Date.now() - cacheDate.getTime() > config.maxAge) {
        // Cache expired, remove it
        await cache.delete(request);
        return this.fetchAndCache(request, cache, config);
      }
      return cachedResponse;
    }

    return this.fetchAndCache(request, cache, config);
  }

  async networkFirst(request, config) {
    const cache = await this.getCache(config.name);
    
    try {
      const response = await fetch(request);
      if (response && response.status === 200) {
        await cache.put(request, this.addCacheHeaders(response, config.maxAge));
      }
      return response;
    } catch (error) {
      // Network failed, try cache
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      throw error;
    }
  }

  async staleWhileRevalidate(request, config) {
    const cache = await this.getCache(config.name);
    const cachedResponse = await cache.match(request);
    
    const fetchPromise = fetch(request).then(response => {
      if (response && response.status === 200) {
        cache.put(request, this.addCacheHeaders(response, config.maxAge));
      }
      return response;
    }).catch(() => null);

    // Return cached version immediately if available, otherwise wait for network
    return cachedResponse || fetchPromise;
  }

  async fetchAndCache(request, cache, config) {
    try {
      const response = await fetch(request);
      if (response && response.status === 200) {
        await cache.put(request, this.addCacheHeaders(response, config.maxAge));
      }
      return response;
    } catch (error) {
      // For failed requests, return offline page for navigation requests
      if (request.mode === 'navigate') {
        return caches.match('/offline');
      }
      throw error;
    }
  }

  addCacheHeaders(response, maxAge) {
    const headers = new Headers(response.headers);
    headers.set('sw-cache-date', new Date().toISOString());
    headers.set('sw-cache-max-age', maxAge.toString());
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }

  async getCache(name) {
    if (!this.caches.has(name)) {
      await this.openCache(CACHE_CONFIGS[name]);
    }
    return this.caches.get(name);
  }

  async cleanup() {
    for (const [name, config] of Object.entries(CACHE_CONFIGS)) {
      const cache = await this.getCache(name);
      const keys = await cache.keys();
      
      if (keys.length > config.maxEntries) {
        const toDelete = keys.slice(0, keys.length - config.maxEntries);
        await Promise.all(toDelete.map(key => cache.delete(key)));
      }
      
      // Clean expired entries
      const now = Date.now();
      for (const request of keys) {
        const response = await cache.match(request);
        if (response) {
          const cacheDate = new Date(response.headers.get('sw-cache-date') || 0);
          if (now - cacheDate.getTime() > config.maxAge) {
            await cache.delete(request);
          }
        }
      }
    }
  }

  async clearAll() {
    for (const [name, cache] of this.caches) {
      await cache.clear();
    }
  }
}

const cacheManager = new CacheManager();

// Event listeners
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(`${CACHE_NAME}-static`).then(cache => {
        return cache.addAll(STATIC_ASSETS);
      }),
      // Initialize other caches
      ...Object.keys(CACHE_CONFIGS).map(name => 
        cacheManager.openCache(CACHE_CONFIGS[name])
      ),
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => !name.startsWith(CACHE_NAME))
            .map(name => caches.delete(name))
        );
      }),
      // Clean up current cache
      cacheManager.cleanup(),
      // Take control of all clients
      self.clients.claim()
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) return;

  event.respondWith(handleRequest(request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Static assets (CSS, JS, fonts) - Cache First
    if (isStaticAsset(url.pathname)) {
      return cacheManager.cacheFirst(request, CACHE_CONFIGS.static);
    }
    
    // Images - Cache First with longer retention
    if (isImageRequest(url.pathname)) {
      return cacheManager.cacheFirst(request, CACHE_CONFIGS.images);
    }
    
    // API requests - Network First
    if (url.pathname.startsWith('/api/')) {
      if (isCacheableApi(url.pathname)) {
        return cacheManager.networkFirst(request, CACHE_CONFIGS.api);
      }
      // Don't cache sensitive API endpoints
      return fetch(request);
    }
    
    // Navigation requests - Stale While Revalidate
    if (request.mode === 'navigate') {
      return cacheManager.staleWhileRevalidate(request, CACHE_CONFIGS.pages);
    }
    
    // Default: Network First
    return cacheManager.networkFirst(request, CACHE_CONFIGS.api);
    
  } catch (error) {
    console.error('Service Worker fetch error:', error);
    
    // For navigation requests, return offline page
    if (request.mode === 'navigate') {
      const offlineResponse = await caches.match('/offline');
      if (offlineResponse) {
        return offlineResponse;
      }
    }
    
    // For other requests, try to return any cached version
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

function isStaticAsset(pathname) {
  return /\.(css|js|woff2?|ttf|eot)$/i.test(pathname) || 
         pathname.startsWith('/_next/static/');
}

function isImageRequest(pathname) {
  return /\.(png|jpg|jpeg|gif|webp|svg|ico)$/i.test(pathname) ||
         pathname.includes('/optimized/');
}

function isCacheableApi(pathname) {
  return CACHEABLE_APIS.some(api => pathname.startsWith(api));
}

// Background Sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(processSyncQueue());
  }
});

async function processSyncQueue() {
  const queuedActions = getStoredSyncQueue();
  
  for (const action of queuedActions) {
    try {
      await fetch(action.url, {
        method: action.method,
        headers: action.headers,
        body: action.body
      });
      removeFromSyncQueue(action.id);
    } catch (error) {
      console.error('Background sync failed for action:', action, error);
    }
  }
}

function getStoredSyncQueue() {
  // In a real implementation, this would use IndexedDB
  return syncQueue;
}

function removeFromSyncQueue(actionId) {
  const index = syncQueue.findIndex(action => action.id === actionId);
  if (index > -1) {
    syncQueue.splice(index, 1);
  }
}

// Push notification handler
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || 'New notification',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    data: data.data || {},
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Energy Drink App', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const data = event.notification.data || {};
  const url = data.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Message handler for cache management
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'CACHE_CLEAR':
      event.waitUntil(cacheManager.clearAll());
      break;
      
    case 'CACHE_CLEANUP':
      event.waitUntil(cacheManager.cleanup());
      break;
      
    case 'SYNC_QUEUE':
      if (payload.action) {
        syncQueue.push({
          id: Date.now().toString(),
          ...payload.action
        });
      }
      break;
      
    case 'FORCE_UPDATE':
      event.waitUntil(
        caches.keys().then(cacheNames => {
          return Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
          );
        })
      );
      break;
  }
});

// Cache analytics
self.addEventListener('fetch', (event) => {
  // Log cache hits/misses for analytics
  const start = Date.now();
  
  event.respondWith(
    handleRequest(event.request).then(response => {
      const duration = Date.now() - start;
      // Could send analytics to server here
      console.log(`Request to ${event.request.url} took ${duration}ms`);
      return response;
    })
  );
});

// Periodic cache cleanup
setInterval(() => {
  cacheManager.cleanup().catch(console.error);
}, 60 * 60 * 1000); // Every hour