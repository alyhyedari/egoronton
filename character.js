'use strict';
(() => {
  const group = document.querySelector('.mood-buttons');
  const image = document.getElementById('mood-image');
  const caption = document.getElementById('mood-caption');
  if (!group || !image || !caption) return;
  const poses = {
    seated: ['FIG 01 / OFF DUTY', 'Egor sitting on a little stool, taking a well-earned break'],
    confident: ['FIG 02 / ON BRAND', 'Egor standing with crossed arms and smart glasses'],
    guide: ['FIG 03 / GOOD COMPANY', 'Egor offering a friendly line-arm gesture']
  };
  let request = 0;
  group.hidden = false;
  group.addEventListener('click', async event => {
    const button = event.target.closest('[data-mood]');
    if (!button || !poses[button.dataset.mood]) return;
    const mood = button.dataset.mood;
    const ticket = ++request;
    const next = new Image();
    next.src = `assets/egor-${mood}.webp`;
    try { await next.decode(); } catch (_) { return; }
    if (ticket !== request) return;
    image.src = next.src;
    image.alt = poses[mood][1];
    caption.textContent = poses[mood][0];
    group.querySelectorAll('button').forEach(item => {
      item.setAttribute('aria-pressed', String(item === button));
    });
  });
})();
