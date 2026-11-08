(() => {
  'use strict';
  const door = document.getElementById('entry-door');
  const status = document.getElementById('entry-door-status');
  if (!door || !status) return;
  const idleText = status.textContent;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const motionPaused = () => reduced.matches || document.body.classList.contains('motion-off');
  let busy = false;
  let openingTimer, navigationTimer;
  function reset() {
    clearTimeout(openingTimer);
    clearTimeout(navigationTimer);
    busy = false;
    delete door.dataset.state;
    door.removeAttribute('aria-busy');
    status.textContent = idleText;
  }
  function enter() {
    clearTimeout(openingTimer);
    clearTimeout(navigationTimer);
    window.location.assign(door.href);
  }
  door.addEventListener('click', event => {
    // Preserve native new-tab / download / no-JS link behaviour.
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (busy) { event.preventDefault(); return; }
    if (motionPaused()) return;
    event.preventDefault();
    busy = true;
    door.setAttribute('aria-busy', 'true');
    door.dataset.state = 'knocking';
    status.textContent = 'Knock, knock…';
    openingTimer = setTimeout(() => {
      door.dataset.state = 'opening';
      status.textContent = 'Welcome in. The door is opening…';
    }, 460);
    // Bounded navigation still works if animation events are cancelled.
    navigationTimer = setTimeout(enter, 1460);
  });
  function syncMotion() { if (busy && motionPaused()) enter(); }
  reduced.addEventListener('change', syncMotion);
  new MutationObserver(syncMotion).observe(document.body, {attributes:true, attributeFilter:['class']});
  window.addEventListener('pagehide', reset);
  window.addEventListener('pageshow', reset);
})();
