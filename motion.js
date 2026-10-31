/* No dependencies, trackers, wallet access, or perpetual JS animation loop. */
(() => {
  'use strict';
  const root = document.documentElement;
  const body = document.body;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const $ = selector => document.querySelector(selector);
  const intro = $('#intro');
  let finished = false;
  let paused = reduced.matches;
  try { paused ||= localStorage.getItem('egor-motion') === 'off'; } catch (_) {}
  const motionAllowed = () => !paused && !reduced.matches;

  function finishIntro() {
    if (finished) return;
    finished = true;
    clearTimeout(window.egorBootTimeout);
    root.classList.remove('booting');
    intro.classList.add('leaving');
    intro.setAttribute('aria-hidden', 'true');
    intro.inert = true;
    if (intro.contains(document.activeElement)) $('.brand').focus({preventScroll:true});
    if (motionAllowed()) {
      body.classList.add('entering');
      setTimeout(() => body.classList.remove('entering'), 1600);
    }
    setTimeout(() => intro.remove(), 800);
    try { sessionStorage.setItem('egor-visited', '1'); } catch (_) {}
  }
  $('#intro-skip').addEventListener('click', finishIntro);
  intro.addEventListener('keydown', event => {if(event.key === 'Escape') finishIntro();});
  // Navigation is immediately usable by keyboard; the intro never traps focus.
  document.addEventListener('focusin', event => {
    if (!finished && !intro.contains(event.target)) finishIntro();
  });
  if (!root.classList.contains('booting')) finishIntro();
  else {
    let completed = 0, failed = 0;
    const images = ['assets/body.webp', 'assets/arm.webp', 'assets/portrait.webp', 'assets/paper.webp'];
    const tasks = images.map(src => new Promise(resolve => {
      const image = new Image();
      image.onload = () => resolve(true);
      image.onerror = () => resolve(false);
      image.src = src;
    }));
    tasks.push(document.fonts ? document.fonts.ready.then(() =>
      [...document.fonts].every(font => font.status !== 'error')) : Promise.resolve(true));
    const detail = $('#intro-detail');
    const checks = tasks.map(task => task.catch(() => false).then(ok => {
      if (finished) return;
      completed++;
      if (!ok) failed++;
      const percent = Math.round(completed / tasks.length * 100);
      $('#intro-meter').style.transform = `scaleX(${percent / 100})`;
      $('#intro-count').textContent = `${percent}%`;
      $('#intro-progress').setAttribute('aria-valuenow', String(percent));
      detail.textContent = failed ? 'Some artwork is unavailable · you can still explore' :
        completed === tasks.length ? 'Ready. Make yourself at home.' : `${completed} of ${tasks.length} essentials checked`;
    }));
    // Completion of essential-resource checks, not simulated byte progress.
    // Lazy animation data is intentionally not downloaded by this loader.
    let deadline;
    Promise.race([Promise.all(checks), new Promise(resolve => {
      deadline = setTimeout(() => {
        detail.textContent = 'Still loading · continuing without waiting';
        resolve();
      }, 2200);
    })]).then(() => {
      clearTimeout(deadline);
      setTimeout(finishIntro, 260);
    });
  }

  const motionButton = $('#motion-toggle');
  function setMotion() {
    body.classList.toggle('motion-off', paused || reduced.matches);
    motionButton.setAttribute('aria-pressed', String(paused || reduced.matches));
    motionButton.querySelector('.motion-label').textContent = paused || reduced.matches ? 'Motion paused' : 'Pause motion';
    motionButton.firstElementChild.textContent = paused || reduced.matches ? '▷' : 'Ⅱ';
    if (!motionAllowed()) {body.classList.remove('entering');finishIntro();}
  }
  motionButton.addEventListener('click', () => {
    if (reduced.matches) return;
    paused = !paused;
    try { localStorage.setItem('egor-motion', paused ? 'off' : 'on'); } catch (_) {}
    setMotion();
  });
  reduced.addEventListener('change', () => {paused = reduced.matches;setMotion();});
  setMotion();
  document.addEventListener('visibilitychange', () => body.classList.toggle('page-hidden', document.hidden));

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    }, {threshold: .06});
    document.querySelectorAll('.steps .reveal').forEach((element, index) => {
      element.style.setProperty('--reveal-delay', `${index * 80}ms`);
    });
    document.querySelectorAll('.reveal').forEach(element => revealObserver.observe(element));
    root.classList.add('js');
    const loopObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        entry.target.querySelectorAll('.wave-arm,.marquee-track').forEach(element => {
          element.style.animationPlayState = entry.isIntersecting ? '' : 'paused';
        });
      });
    });
    loopObserver.observe($('.hero'));
    loopObserver.observe($('.marquee'));
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        document.querySelectorAll('.nav-links a[href^="#"]').forEach(link => {
          if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, {rootMargin: '-15% 0px -55% 0px'});
    document.querySelectorAll('main section[id]').forEach(section => sectionObserver.observe(section));
  }

  let scheduled = false;
  const progress = $('.scroll-progress');
  function updateProgress() {
    const range = root.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${range > 0 ? Math.min(1, Math.max(0, scrollY / range)) : 0})`;
    scheduled = false;
  }
  function queueProgress() {
    if (!scheduled) {scheduled = true;requestAnimationFrame(updateProgress);}
  }
  addEventListener('scroll', queueProgress, {passive:true});
  addEventListener('resize', queueProgress, {passive:true});
  if ('ResizeObserver' in window) new ResizeObserver(queueProgress).observe(body);
  updateProgress();

  // Close the mobile menu when leaving its breakpoint or clicking elsewhere.
  matchMedia('(max-width:760px)').addEventListener('change', () => {
    $('.menu-toggle').setAttribute('aria-expanded', 'false');$('#nav-links').classList.remove('open');
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.nav')) {
      $('.menu-toggle').setAttribute('aria-expanded', 'false');$('#nav-links').classList.remove('open');
    }
  });
})();
