/* Local bootstrap only; figures are fetched exclusively by the opt-in TonAPI module. */
(() => {
  'use strict';
  const panel = document.querySelector('.market-panel');
  if (!panel || !panel.querySelector('#market-controls')) return;
  import('./market-live.mjs?v=0.4.9').then(module => module.initMarket(panel)).catch(() => {
    document.getElementById('market-status').textContent = 'Market controls could not load. Use the TonAPI links; the saved snapshot is still available.';
  });
})();
