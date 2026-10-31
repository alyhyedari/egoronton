/* Asset-only cache: documents and application code always use the network/HTTP cache. */
'use strict';
const BASE = new URL('./', self.location.href);
const CACHE = 'egor-assets-sha256-v1-' + encodeURIComponent(BASE.pathname);
const META = 'egor-asset-manifest-v1-' + encodeURIComponent(BASE.pathname);
const MANIFEST = new URL('asset-manifest.json', BASE).href;
let manifest = null, checking = null;
const pending = new Map();
function valid(data) {
  return data && data.schema === 1 && data.assets && typeof data.assets === 'object' && !Array.isArray(data.assets) &&
    Object.entries(data.assets).every(([path, hash]) =>
      path.startsWith('assets/') && !path.includes('..') && /^[a-f0-9]{64}$/.test(hash));
}
async function loadManifest(refresh = false) {
  if (checking) return checking;
  if (manifest && !refresh) return manifest;
  checking = (async () => {
    // Stored metadata is only a fallback if the network is unavailable.
    if (!manifest) {
      try {
        const saved = await (await caches.open(META)).match(MANIFEST);
        const data = saved && await saved.json();
        if (valid(data)) manifest = data;
      } catch (_) {}
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1800);
    try {
      const response = await fetch(MANIFEST, {cache:'no-cache', signal:controller.signal});
      if (!response.ok) throw new Error('Manifest unavailable');
      const data = await response.clone().json();
      if (!valid(data)) throw new Error('Invalid manifest');
      manifest = data;
      try { await (await caches.open(META)).put(MANIFEST, response); } catch (_) {}
    } catch (_) {} finally { clearTimeout(timer); }
    return manifest;
  })().finally(() => { checking = null; });
  return checking;
}
function keyFor(path, hash) {
  const key = new URL(path, BASE);
  key.searchParams.set('egor-sha256', hash);
  return key.href;
}
async function cachedAsset(request, warm = false) {
  const data = await loadManifest();
  const url = new URL(request.url), path = url.pathname.slice(BASE.pathname.length);
  const hash = data && data.assets[path];
  if (!hash) return fetch(request);
  const key = keyFor(path, hash);
  if (pending.has(key)) return (await pending.get(key)).clone();
  const task = (async () => {
    let cache;
    try {
      cache = await caches.open(CACHE);
      const hit = await cache.match(key);
      if (hit) return hit;
    } catch (_) {}
    // Reuse the first visit's HTTP cache. A changed asset is revalidated if needed.
    let response = await fetch(request, warm ? {cache:'force-cache'} : {});
    async function matches(response) {
      if (!response.ok || response.status === 206) return false;
      const digest = await crypto.subtle.digest('SHA-256', await response.clone().arrayBuffer());
      return [...new Uint8Array(digest)].map(n => n.toString(16).padStart(2,'0')).join('') === hash;
    }
    let verified = await matches(response);
    if (response.ok && !verified) {
      response = await fetch(request, {cache:'reload'});
      verified = await matches(response);
    }
    if (cache && verified) {
      try { await cache.put(key, response.clone()); } catch (_) {}
    }
    return response;
  })();
  pending.set(key, task);
  try { return (await task).clone(); } finally { pending.delete(key); }
}
async function prune() {
  if (!manifest) return;
  try {
    const cache = await caches.open(CACHE);
    const keep = new Set(Object.entries(manifest.assets).map(([p,h]) => keyFor(p,h)));
    await Promise.all((await cache.keys()).filter(r => !keep.has(r.url)).map(r => cache.delete(r)));
  } catch (_) {}
}
self.addEventListener('install', event => {
  event.waitUntil(loadManifest(true).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(loadManifest().then(prune).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== BASE.origin || !url.pathname.startsWith(BASE.pathname)) return;
  if (request.mode === 'navigate') {
    // Fetch the HTML and tiny manifest in parallel. Refresh revisions before its assets run.
    const ready = loadManifest(true);
    event.respondWith(Promise.all([fetch(request), ready]).then(([response]) => response));
    event.waitUntil(ready.then(prune));
  } else if (url.pathname.startsWith(BASE.pathname + 'assets/') && !url.search && !request.headers.has('range')) {
    event.respondWith(cachedAsset(request).catch(() => fetch(request)));
  }
});
self.addEventListener('message', event => {
  if (!event.data || event.data.type !== 'WARM_USED_ASSETS' || !Array.isArray(event.data.urls)) return;
  // Only resources already used by this page; no bulk precache or user photos.
  const urls = [...new Set(event.data.urls)].slice(0, 120).filter(value => {
    try {
      const url = new URL(value);
      return url.origin === BASE.origin && url.pathname.startsWith(BASE.pathname + 'assets/') && !url.search;
    } catch (_) { return false; }
  });
  event.waitUntil(Promise.allSettled(urls.map(url => cachedAsset(new Request(url), true))));
});
