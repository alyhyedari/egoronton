/* Exact project-supplied address and pair are in the HTML. No wallet access. */
(() => {
  'use strict';
  const dock = document.querySelector('#token-dock');
  const hero = document.querySelector('.hero');
  const address = document.querySelector('#dock-address');
  const copy = document.querySelector('#dock-copy');
  const feedback = document.querySelector('#dock-feedback');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;
  let movement;
  let feedbackTimer;
  let initialized = false;
  const motionAllowed = () => !reduced.matches && !document.body.classList.contains('motion-off') && !document.hidden;

  function update() {
    frame = 0;
    const wasTop = dock.classList.contains('is-top');
    // After the hero passes the viewport, pin to the top. Hysteresis avoids jitter.
    const heroBottom = hero.getBoundingClientRect().bottom;
    const atTop = wasTop ? heroBottom < 32 : heroBottom <= 0;
    if (atTop !== wasTop) {
      const before = dock.getBoundingClientRect();
      if (movement) movement.cancel();
      dock.classList.toggle('is-top', atTop);
      const after = dock.getBoundingClientRect();
      if (initialized && motionAllowed() && dock.animate) {
        movement = dock.animate([
          {transform:`translate(-50%, ${before.top - after.top}px)`},
          {transform:'translate(-50%, 0px)'}
        ], {duration:540, easing:'cubic-bezier(.22,1,.36,1)'});
      }
    }
    const space = Math.ceil(dock.offsetHeight + 32) + 'px';
    if (document.documentElement.style.getPropertyValue('--dock-space') !== space) {
      document.documentElement.style.setProperty('--dock-space', space);
    }
    initialized = true;
  }
  function queue() { if (!frame) frame = requestAnimationFrame(update); }
  addEventListener('scroll', queue, {passive:true});
  addEventListener('resize', queue, {passive:true});
  addEventListener('pageshow', queue);
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(queue);
    observer.observe(hero);
    observer.observe(dock);
  }
  function stopMotion() { if (!motionAllowed() && movement) movement.cancel(); }
  reduced.addEventListener('change', stopMotion);
  document.addEventListener('visibilitychange', stopMotion);
  new MutationObserver(stopMotion).observe(document.body, {attributes:true, attributeFilter:['class']});

  function announce(text) {
    clearTimeout(feedbackTimer);
    feedback.textContent = text;
    feedbackTimer = setTimeout(() => { feedback.textContent = ''; }, 3500);
  }
  copy.disabled = false;
  copy.addEventListener('click', async () => {
    const value = address.textContent.trim();
    let copied = false;
    try {
      await navigator.clipboard.writeText(value);
      copied = true;
    } catch (_) {
      // Also support local previews and older browsers where Clipboard API is unavailable.
      const input = document.createElement('textarea');
      input.value = value;
      input.readOnly = true;
      input.style.cssText = 'position:fixed;left:0;top:0;opacity:0;font-size:16px;pointer-events:none';
      document.body.append(input);
      input.select();
      try { copied = document.execCommand('copy'); } catch (_) {}
      input.remove();
      copy.focus({preventScroll:true});
    }
    if (copied) announce('Contract address copied');
    else {
      const range = document.createRange();
      range.selectNodeContents(address);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      announce('Address selected — use your device’s Copy command');
    }
  });
  update();
})();
