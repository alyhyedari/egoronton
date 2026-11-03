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
  // The four authored cubic segments of #rm-route. Build a tiny arc-length
  // table with arithmetic, not 10,005 synchronous SVG geometry queries.
  // Keep these controls in sync with the path in index.html (covered by QA).
  const curves = [
    [[95,420],[85,345],[125,245],[230,245]],
    [[230,245],[335,245],[280,360],[380,360]],
    [[380,360],[480,360],[418,190],[500,190]],
    [[500,190],[582,190],[547,90],[620,90]]
  ];
  const samples = [{x:95, y:420, d:0}], distances = [0];
  for (const curve of curves) {
    for (let i = 1; i <= 100; i++) {
      const t = i / 100, u = 1 - t;
      const x = u*u*u*curve[0][0] + 3*u*u*t*curve[1][0] + 3*u*t*t*curve[2][0] + t*t*t*curve[3][0];
      const y = u*u*u*curve[0][1] + 3*u*u*t*curve[1][1] + 3*u*t*t*curve[2][1] + t*t*t*curve[3][1];
      const previous = samples[samples.length - 1];
      samples.push({x, y, d:previous.d + Math.hypot(x-previous.x, y-previous.y)});
    }
    distances.push(samples[samples.length - 1].d);
  }
  function pointAt(distance) {
    let low = 0, high = samples.length - 1;
    while (high - low > 1) {
      const mid = (low + high) >> 1;
      if (samples[mid].d < distance) low = mid; else high = mid;
    }
    const a = samples[low], b = samples[high];
    const t = Math.max(0, Math.min(1, (distance-a.d)/(b.d-a.d)));
    return {x:a.x+(b.x-a.x)*t, y:a.y+(b.y-a.y)*t};
  }
  let selected = 0, current = 0, target = 0, frame = 0;
  let localPause = false, visible = false;
  const blocked = () => localPause || reduced.matches || document.body.classList.contains('motion-off');
  const active = () => visible && !document.hidden && !blocked();
  function place(distance) {
    current = distance;
    const p = pointAt(distance);
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
    new IntersectionObserver(entries => { visible = entries[entries.length - 1].isIntersecting; sync(); }, {threshold:0}).observe($('.rm-map'));
  } else visible = true;
  room.classList.add('rm-ready');
  $('.rm-stops').hidden = $('.rm-controls').hidden = pause.hidden = false;
  select(0); sync();
})();
