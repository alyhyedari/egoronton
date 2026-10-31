/* Progressive enhancement: caching never blocks the page or uploads editor data. */
(() => {
  'use strict';
  if (!('serviceWorker' in navigator) || !window.isSecureContext) return;
  const base = new URL('./', document.currentScript.src);
  async function start() {
    try {
      await navigator.serviceWorker.register(new URL('sw.js', base), {
        scope: base.pathname, updateViaCache: 'none'
      });
      const registration = await navigator.serviceWorker.ready;
      const worker = registration.active;
      if (!worker) return;
      // Populate only already-requested, same-origin assets from the HTTP cache.
      const urls = performance.getEntriesByType('resource').map(entry => entry.name)
        .filter(url => url.startsWith(new URL('assets/', base).href));
      worker.postMessage({type: 'WARM_USED_ASSETS', urls});
    } catch (_) { /* Private mode, unsupported hosting or storage failure: ordinary HTTP. */ }
  }
  function schedule() {
    if ('requestIdleCallback' in window) requestIdleCallback(start, {timeout: 1500});
    else setTimeout(start, 200);
  }
  if (document.readyState === 'complete') schedule();
  else addEventListener('load', schedule, {once: true});
})();
