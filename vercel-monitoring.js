/* Optional Vercel monitoring. No SDK, wallet access, or custom events.
   Enable Web Analytics and Speed Insights in the Vercel project, then redeploy.
   These first-party endpoints are served by Vercel, not by the local server. */
(() => {
  'use strict';
  const local = /^(localhost|127(?:\.\d+){3}|\[::1\])$/.test(location.hostname);
  if (location.protocol !== 'https:' || local || navigator.doNotTrack === '1' || navigator.globalPrivacyControl === true) return;

  window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
  window.si = window.si || function () { (window.siq = window.siq || []).push(arguments); };

  // Do not include query strings or fragments in monitored page URLs.
  function cleanEvent(event) {
    if (!event.url) return event;
    try {
      const url = new URL(event.url, location.origin);
      url.search = '';
      url.hash = '';
      return { ...event, url: url.href };
    } catch (_) { return null; }
  }
  window.va('beforeSend', cleanEvent);
  window.si('beforeSend', cleanEvent);

  for (const src of ['/_vercel/insights/script.js', '/_vercel/speed-insights/script.js']) {
    if (document.querySelector(`script[src="${src}"]`)) continue;
    const script = document.createElement('script');
    script.src = src;
    // Dynamic scripts load independently; monitoring must never block the page.
    script.async = true;
    script.referrerPolicy = 'origin';
    script.dataset.autoTrack = 'true';
    document.head.appendChild(script);
  }
})();
