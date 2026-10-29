/* Local, deliberate interaction. No autoplay, storage, uploads or wallet calls. */
(() => {
  'use strict';
  const room = document.querySelector('#resistance');
  if (!room) return;
  const voices = {
    hello: ['Start with a hello.', 'You don’t need a louder voice to deserve a place in the conversation.', 'Hooded Resistance Dog raising a hand beneath the word Hey'],
    laugh: ['Keep your sense of humor.', 'A small laugh can make a very serious world feel a little less heavy.', 'A masked Resistance Dog laughing beneath Ha ha'],
    no: ['No is a complete sentence.', 'Disagreement belongs here too. Make room for a different point of view.', 'Resistance Dog in a dark hat, with No written across the face'],
    heart: ['Care without disguise.', 'Being yourself includes the soft parts. Kindness is not a surrender.', 'A hooded Resistance Dog holding a white heart outlined in pink'],
    peace: ['Different views. Open hands.', 'Freedom to speak. Patience to listen. Respect for the person on the other side.', 'A white-gloved hand making a peace sign in a red circle'],
    signal: ['Keep the conversation open.', 'A thought becomes a connection when someone else gets to hear it.', 'A hooded Resistance Dog looking toward a glowing paper-plane signal']
  };
  const buttons = [...room.querySelectorAll('[data-resistance]')];
  const image = room.querySelector('#resistance-image');
  const art = room.querySelector('.resistance-art');
  const feedback = room.querySelector('#resistance-feedback');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let current = 'hello';
  let request = 0;
  art.addEventListener('animationend', () => art.classList.remove('changing'));
  buttons.forEach((button, index) => button.addEventListener('click', async () => {
    const key = button.dataset.resistance;
    if (!Object.prototype.hasOwnProperty.call(voices, key)) return;
    const ticket = ++request;
    feedback.textContent = '';
    if (key === current) return;
    const next = new Image();
    try {
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Image timeout')), 8000);
        next.onload = () => { clearTimeout(timer); resolve(); };
        next.onerror = () => { clearTimeout(timer); reject(new Error('Image unavailable')); };
        next.src = `assets/resistance/${key}.webp`;
      });
      if (ticket !== request) return;
      image.src = next.src;
      image.alt = voices[key][2];
      room.querySelector('#resistance-caption').textContent = voices[key][0];
      room.querySelector('#resistance-note').textContent = voices[key][1];
      room.querySelector('#resistance-number').textContent = `0${index + 1} / 06`;
      buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      current = key;
      art.classList.remove('changing');
      if (!reduced.matches && !document.body.classList.contains('motion-off') && !document.hidden) {
        void art.offsetWidth;
        art.classList.add('changing');
      }
    } catch (_) {
      if (ticket === request) feedback.textContent = 'That sticker couldn’t load. Your current card is still here. Please try again.';
    }
  }));
  room.querySelector('.resistance-choices').hidden = false;
  room.querySelector('#resistance-hint').hidden = false;
})();
