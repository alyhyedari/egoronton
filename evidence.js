/* Optional enhancement; the complete record list is static HTML. */
(() => {
  'use strict';
  const button = document.getElementById('evidence-copy');
  const status = document.getElementById('evidence-status');
  if (!button || !status || !navigator.clipboard?.writeText) return;
  button.hidden = false;
  button.addEventListener('click', async () => {
    const lines = [...document.querySelectorAll('.evidence-records li')].map(row =>
      `${row.querySelector('time').textContent} — ${row.querySelector('a').href}`);
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      status.textContent = 'Nine dated record links copied. Transfer comments do not prove a reward rate or recipient identity.';
    } catch (_) {
      status.textContent = 'Clipboard unavailable. Use the individual transaction links above.';
    }
  });
})();
