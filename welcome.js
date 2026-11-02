/* Static-first idea desk. Motion is finite, optional, and paused out of view. */
(() => {
  'use strict';
  const desk = document.getElementById('idea-workshop');
  if (!desk) return;
  const buttons = [...desk.querySelectorAll('[data-idea-choice]')];
  const drawings = [...desk.querySelectorAll('[data-idea-art]')];
  const replay = document.getElementById('idea-replay');
  const status = document.getElementById('idea-status');
  const description = document.getElementById('idea-art-desc');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const ideas = {
    voyage: {number:'01', text:'A little voyage. Every adventure starts somewhere.', art:'a paper boat'},
    grow: {number:'02', text:'Something growing. A little care, a little patience.', art:'a small plant'},
    orbit: {number:'03', text:'A tiny universe. There is room for another idea.', art:'a ringed planet'}
  };
  let visible = false;
  const blocked = () => reduced.matches || document.body.classList.contains('motion-off');
  function sync() {
    desk.dataset.active = String(visible && !document.hidden && !blocked());
    replay.disabled = blocked();
    if (blocked()) desk.classList.remove('is-drawing');
  }
  function draw() {
    desk.classList.remove('is-drawing');
    if (blocked()) return;
    // Restart only on explicit interaction, never on a scroll or timer.
    void desk.offsetWidth;
    desk.classList.add('is-drawing');
  }
  buttons.forEach(button => {
    button.disabled = false;
    button.addEventListener('click', () => {
      const key = button.dataset.ideaChoice;
      const idea = ideas[key];
      desk.dataset.idea = key;
      buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      drawings.forEach(item => item.toggleAttribute('hidden', item.dataset.ideaArt !== key));
      status.textContent = idea.text;
      document.getElementById('idea-number').textContent = `NO. ${idea.number}`;
      description.textContent = `EGOR stands beside a drawing of ${idea.art} on a cobalt-blue worktable.`;
      draw();
    });
  });
  replay.addEventListener('click', draw);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      // A capture, resize or fast scroll can queue more than one entry.
      // Apply the newest visibility state, not the first state in that batch.
      for (const entry of entries) visible = entry.isIntersecting;
      sync();
    }, {threshold:0}).observe(desk);
  } else visible = true;
  new MutationObserver(sync).observe(document.body, {attributes:true, attributeFilter:['class']});
  reduced.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  sync();
})();
