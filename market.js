/* Local bootstrap; figures come exclusively from TonAPI while visible. */
(() => {
  'use strict';
  const panel = document.querySelector('.market-panel');
  if (!panel || !panel.querySelector('#market-controls')) return;
  import('./market-live.mjs?v=0.4.11').then(module => module.initMarket(panel)).catch(() => {
    document.getElementById('market-status').textContent = 'Market controls could not load. Use the TonAPI links; the saved snapshot is still available.';
  });
})();
