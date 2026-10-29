/* A small, local interaction. No uploads, wallet calls, tracking, or animation loop. */
(() => {
  'use strict';
  const room = document.querySelector('#utya');
  if (!room) return;
  const moods = {
    hello: ['Oh, hi there.', 'No grand entrance. Just a little wave.', 'Utya smiling and waving hello'],
    laugh: ['That kind of laugh.', 'The one you can’t explain in a message.', 'Utya laughing with tears of joy'],
    love: ['Sending a little love.', 'No occasion required.', 'Utya blowing a heart-shaped kiss'],
    yes: ['You got this.', 'A very small duck. A very big thumbs-up.', 'Utya giving an oversized thumbs-up'],
    cool: ['Unreasonably cool.', 'Same duck. Different energy.', 'Utya wearing black sunglasses'],
    rainbow: ['A lot to process.', 'Some days need every color at once.', 'A pink Utya spilling a rainbow']
  };
  const buttons = [...room.querySelectorAll('[data-utya]')];
  const image = room.querySelector('#utya-image');
  const photo = room.querySelector('.utya-photo');
  const feedback = room.querySelector('#utya-feedback');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let request = 0;
  let current = 'hello';
  photo.addEventListener('animationend', () => photo.classList.remove('changing'));
  buttons.forEach((button, index) => button.addEventListener('click', async () => {
    const key = button.dataset.utya;
    const ticket = ++request;
    feedback.textContent = '';
    if (key === current) return;
    const next = new Image();
    try {
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Image timeout')), 8000);
        next.onload = () => { clearTimeout(timer); resolve(); };
        next.onerror = () => { clearTimeout(timer); reject(new Error('Image unavailable')); };
        next.src = `assets/utya/${key}.webp`;
      });
      if (ticket !== request) return;
      image.src = next.src;
      image.alt = moods[key][2];
      room.querySelector('#utya-caption').textContent = moods[key][0];
      room.querySelector('#utya-note').textContent = moods[key][1];
      room.querySelector('#utya-number').textContent = `0${index + 1} / 06`;
      buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      current = key;
      photo.classList.remove('changing');
      if (!reduced.matches && !document.body.classList.contains('motion-off') && !document.hidden) {
        // One small CSS transition on deliberate input, never an autoplay carousel.
        void photo.offsetWidth;
        photo.classList.add('changing');
      }
    } catch (_) {
      if (ticket === request) feedback.textContent = 'That mood couldn’t load. Your current postcard is still here. Try again.';
    }
  }));
  room.querySelector('.utya-moods').hidden = false;
  room.querySelector('#utya-instruction').hidden = false;

  const discovered = new Set();
  const secrets = [...room.querySelectorAll('.utya-secret')];
  const counter = room.querySelector('#utya-discovery');
  counter.hidden = false;
  secrets.forEach(note => note.addEventListener('toggle', () => {
    if (!note.open || discovered.has(note)) return;
    discovered.add(note);
    counter.textContent = discovered.size === secrets.length
      ? '6 of 6 discovered. Every feeling has a place here. So do you.'
      : `${discovered.size} of 6 little notes discovered.`;
  }));

  // Decorations only animate near the viewport. Native details work without JS.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      entries.forEach(entry => room.classList.toggle('is-in-view', entry.isIntersecting));
    }, {threshold: 0}).observe(room);
  }

  // Casual copy deterrence, not DRM. Keep contract copying, forms, links,
  // keyboard shortcuts, browser menus, and the local studio usable.
  const copyAllowed = node => node instanceof Element && node.closest(
    'input,textarea,[contenteditable="true"],#contract-display,#dialog-contract,#dock-address,.studio'
  );
  document.addEventListener('copy', event => {
    const selection = window.getSelection();
    const node = selection?.anchorNode;
    const anchor = node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
    if (copyAllowed(event.target) || copyAllowed(anchor)) return;
    event.preventDefault();
  });
  document.addEventListener('contextmenu', event => {
    if (event.target instanceof Element && event.target.matches('img') && !event.target.closest('a,.studio')) event.preventDefault();
  });
  document.addEventListener('dragstart', event => {
    if (event.target instanceof Element && event.target.matches('img') && !event.target.closest('.studio')) event.preventDefault();
  });
})();
