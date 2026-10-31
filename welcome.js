/* Progressive enhancement: the paper scene is complete without JavaScript.
   No timers, animation loops, persistence, network requests or sound. */
(() => {
  'use strict';
  const room = document.getElementById('window-room');
  const button = document.getElementById('sky-toggle');
  const status = document.getElementById('sky-status');
  const description = document.getElementById('window-desc');
  if (!room || !button || !status || !description) return;

  button.addEventListener('click', () => {
    const bright = room.classList.toggle('is-bright');
    // A toggle keeps its accessible name; pressed state conveys the setting.
    button.setAttribute('aria-pressed', String(bright));
    status.textContent = bright
      ? 'A little sunshine through the window'
      : 'A quiet sky and a little room to breathe';
    description.textContent = 'EGOR sits on a small stool beside a hand-drawn window. ' + (bright
      ? 'Outside is a bright blue sky; warm sunlight falls across the floor.'
      : 'Outside is a soft blue sky.');
  });
  button.hidden = false;
})();
