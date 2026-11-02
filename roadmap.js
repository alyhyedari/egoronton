/* Progressive enhancement; bounded, user-triggered travel, no autoplay chapters. */
(() => {
  'use strict';
  const room = document.getElementById('roadmap');
  if (!room) return;
  const $ = selector => room.querySelector(selector);
  const chapters = [...room.querySelectorAll('.rm-chapter')];
  const stops = [...room.querySelectorAll('.rm-stop')];
  const route = $('#rm-route'), traveler = $('#rm-traveler');
  const pause = $('.rm-pause'), prev = $('.rm-prev'), next = $('.rm-next');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const total = route.getTotalLength();
  // Match the actual curve to the five authored station coordinates.
  const points = [[95,420],[230,245],[380,360],[500,190],[620,90]];
  const distances = points.map(([x,y]) => {
    let best = 0, error = Infinity;
    for (let i = 0; i <= 2000; i++) {
      const d = total * i / 2000, p = route.getPointAtLength(d);
      const e = (p.x-x)**2 + (p.y-y)**2;
      if (e < error) { error = e; best = d; }
    }
    return best;
  });
  let selected = 0, current = 0, target = 0, frame = 0;
  let localPause = false, visible = false;
  const blocked = () => localPause || reduced.matches || document.body.classList.contains('motion-off');
  const active = () => visible && !document.hidden && !blocked();
  function place(distance) {
    current = distance;
    const p = route.getPointAtLength(distance);
    traveler.style.transform = `translate(${p.x.toFixed(2)}px,${p.y.toFixed(2)}px)`;
  }
  function cancel() { cancelAnimationFrame(frame); frame = 0; }
  function travel() {
    cancel();
    if (!active()) { if (blocked()) place(target); return; }
    const from = current, start = performance.now();
    if (Math.abs(target-from) < .1) return;
    function tick(now) {
      frame = 0;
      if (!active()) return;
      const t = Math.min(1, (now-start)/1000);
      place(from + (target-from) * (t*t*(3-2*t)));
      if (t < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
  }
  function sync() {
    room.dataset.animating = String(active());
    pause.setAttribute('aria-pressed', String(blocked()));
    pause.textContent = reduced.matches ? 'Reduced motion' : document.body.classList.contains('motion-off') ? 'Motion paused globally' : localPause ? 'Resume motion' : 'Pause motion';
    pause.disabled = reduced.matches || document.body.classList.contains('motion-off');
    if (!active()) { cancel(); if (blocked()) place(target); }
    else if (!frame) travel();
  }
  function select(index) {
    if (index < 0 || index >= chapters.length) return;
    selected = index;
    chapters.forEach((chapter,i) => { chapter.hidden = i !== selected; });
    stops.forEach((stop,i) => stop.setAttribute('aria-pressed', String(i === selected)));
    prev.disabled = selected === 0; next.disabled = selected === chapters.length-1;
    // Do not strand keyboard focus on a newly disabled arrow button.
    if (document.activeElement === prev && prev.disabled) next.focus({preventScroll:true});
    if (document.activeElement === next && next.disabled) prev.focus({preventScroll:true});
    $('.rm-page-count').textContent = `${String(selected+1).padStart(2,'0')} / 05`;
    $('.rm-position').textContent = `Chapter ${selected+1} of 5 · ${chapters[selected].querySelector('h3').textContent}`;
    target = distances[selected];
    travel();
  }
  stops.forEach((stop,i) => {
    stop.addEventListener('click', () => select(i));
    stop.addEventListener('keydown', event => {
      let index;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') index = (i+1)%stops.length;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') index = (i+stops.length-1)%stops.length;
      if (event.key === 'Home') index = 0;
      if (event.key === 'End') index = stops.length-1;
      if (index === undefined) return;
      event.preventDefault(); stops[index].focus({preventScroll:true}); select(index);
    });
  });
  prev.addEventListener('click', () => select(selected-1));
  next.addEventListener('click', () => select(selected+1));
  pause.addEventListener('click', () => { localPause = !localPause; sync(); });
  reduced.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  new MutationObserver(sync).observe(document.body, {attributes:true, attributeFilter:['class']});
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }, {threshold:0}).observe($('.rm-map'));
  } else visible = true;
  room.classList.add('rm-ready');
  $('.rm-stops').hidden = $('.rm-controls').hidden = pause.hidden = false;
  select(0); sync();
})();
