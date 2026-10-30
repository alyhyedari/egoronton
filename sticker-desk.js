/* Self-hosted Lottie, fetched only after Play. No autoplay or automatic resume. */
(() => {
  'use strict';
  const desk = document.querySelector('#sticker-desk');
  if (!desk) return;
  const stage = desk.querySelector('.sticker-stage');
  const canvas = desk.querySelector('.sticker-canvas');
  const preview = desk.querySelector('#sticker-preview');
  const title = desk.querySelector('#sticker-title');
  const count = desk.querySelector('#sticker-count');
  const download = desk.querySelector('#sticker-original');
  const play = desk.querySelector('#sticker-play');
  const reset = desk.querySelector('#sticker-reset');
  const status = desk.querySelector('#sticker-status');
  const options = [...desk.querySelectorAll('.sticker-option')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let selected = options[0], animation = null, playerPromise = null;
  let request = 0, controller = null, state = 'still', inView = true, printing = false;
  const blocked = () => reduced.matches || document.body.classList.contains('motion-off');
  const allowed = () => !blocked() && !document.hidden && inView && !printing;

  function update(message) {
    play.disabled = blocked();
    play.textContent = state === 'loading' ? 'Cancel loading' : state === 'playing' ? 'Pause' : state === 'paused' ? 'Resume' : state === 'ended' ? 'Replay once' : 'Play once';
    play.setAttribute('aria-label', `${play.textContent}: ${title.textContent}`);
    if (message) status.textContent = message;
    desk.dataset.state = state;
  }
  function clear() {
    request++;
    if (controller) controller.abort();
    controller = null;
    if (animation) animation.destroy();
    animation = null;
    canvas.replaceChildren();
    stage.classList.remove('has-animation');
    state = 'still';
  }
  function still(message) { clear(); update(message); }
  function pause(message) {
    if (state === 'loading') { still(message); return; }
    if (state !== 'playing') return;
    animation.pause(); state = 'paused'; update(message);
  }
  function loadPlayer() {
    if (window.lottie) return Promise.resolve(window.lottie);
    if (!playerPromise) {
      playerPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        const timer = setTimeout(() => fail(), 12000);
        function fail() { clearTimeout(timer); script.remove(); reject(new Error('Player unavailable')); }
        script.src = 'assets/vendor/lottie_canvas-5.13.0.min.js';
        script.onload = () => { clearTimeout(timer); window.lottie ? resolve(window.lottie) : fail(); };
        script.onerror = fail;
        document.head.append(script);
      }).catch(error => { playerPromise = null; throw error; });
    }
    return playerPromise;
  }
  async function start() {
    if (!allowed()) return;
    if (state === 'loading') { still('Loading cancelled. Static preview restored.'); return; }
    if (state === 'playing') { pause('Paused. Resume when you’re ready.'); return; }
    if (animation) {
      state === 'ended' ? animation.goToAndPlay(0, true) : animation.play();
      state = 'playing'; update('Playing once. You can pause at any time.'); return;
    }
    const token = ++request;
    const abort = new AbortController(); controller = abort;
    state = 'loading'; update('Loading this sticker only…');
    const timeout = setTimeout(() => {
      if (token === request) still('Loading took too long. The preview is safe; try Play once again.');
    }, 15000);
    try {
      const [player, data] = await Promise.all([
        loadPlayer(),
        fetch(`assets/stickers/data/${selected.dataset.sticker}.json`, {signal: abort.signal})
          .then(response => { if (!response.ok) throw new Error('Sticker unavailable'); return response.json(); })
      ]);
      if (token !== request || !allowed()) return;
      const item = player.loadAnimation({
        container: canvas, renderer: 'canvas', loop: false, autoplay: false,
        animationData: data, rendererSettings: {dpr: Math.min(devicePixelRatio || 1, 2), clearCanvas: true}
      });
      animation = item;
      await new Promise((resolve, reject) => {
        if (item.isLoaded) resolve();
        else item.addEventListener('DOMLoaded', resolve);
        item.addEventListener('data_failed', () => reject(new Error('Animation unavailable')));
        item.addEventListener('error', () => reject(new Error('Animation unavailable')));
        abort.signal.addEventListener('abort', () => reject(new Error('Cancelled')), {once:true});
      });
      if (token !== request || !allowed()) return;
      item.addEventListener('complete', () => {
        if (animation !== item) return;
        state = 'ended'; update('Finished. Replay once, or choose another feeling.');
      });
      item.addEventListener('error', () => {
        if (animation === item) still('Playback unavailable. Showing the static preview instead.');
      });
      stage.classList.add('has-animation');
      state = 'playing'; item.goToAndPlay(0, true);
      update('Playing once. You can pause at any time.');
    } catch (_) {
      if (token === request) still('Playback unavailable. Your static preview is still here. Try again when ready.');
    } finally { clearTimeout(timeout); }
  }
  canvas.setAttribute('aria-label', preview.alt);
  options.forEach(option => {
    option.disabled = false;
    option.addEventListener('click', () => {
      if (option === selected) return;
      clear(); selected = option;
      options.forEach(button => button.setAttribute('aria-pressed', String(button === option)));
      const image = option.querySelector('img');
      preview.src = image.getAttribute('src'); preview.alt = image.alt;
      canvas.setAttribute('aria-label', image.alt);
      title.textContent = option.dataset.title;
      count.textContent = `${String(options.indexOf(option) + 1).padStart(2, '0')} / 18`;
      download.href = `assets/stickers/originals/${option.dataset.source}`;
      update(blocked() ? 'Motion is off. Browse the stills at your own pace.' : 'Selected. Press Play once to bring this feeling to life.');
    });
  });
  play.addEventListener('click', start);
  reset.addEventListener('click', () => still(blocked() ? 'Motion is off. Static preview shown.' : 'Static preview restored. Nothing plays automatically.'));
  function preferences() {
    if (blocked()) still(reduced.matches ? 'Reduce Motion is on. Enjoy the static collection.' : 'Site motion is paused. Turn it on using the hero’s motion control to play.');
    else update('Ready when you are. Nothing plays automatically.');
  }
  reduced.addEventListener('change', preferences);
  new MutationObserver(() => {
    // Other site effects also change body classes. Ignore unrelated changes.
    if (play.disabled !== blocked()) preferences();
  }).observe(document.body, {attributes:true, attributeFilter:['class']});
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause('Paused while you were away. Press Resume when ready.'); });
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
    inView = entries[0].isIntersecting;
    if (!inView) pause('Paused outside the view. Playback never resumes automatically.');
  }, {threshold:0}).observe(stage);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') pause('Paused. Resume when you’re ready.');
  });
  addEventListener('beforeprint', () => { printing = true; pause('Paused for printing.'); });
  addEventListener('afterprint', () => { printing = false; });
  addEventListener('pagehide', () => still('Static preview restored.'));
  if ('ResizeObserver' in window) new ResizeObserver(() => animation?.resize()).observe(stage);
  desk.querySelector('.sticker-controls').hidden = false;
  preferences();
})();
