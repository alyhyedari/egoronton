/* REDO — an on-demand, local-only interactive room. No autoplay, tracking or uploads. */
(() => {
  'use strict';
  const room = document.querySelector('#redo');
  if (!room) return;
  const $ = selector => room.querySelector(selector);
  const cards = [...room.querySelectorAll('.redo-signal')];
  const stage = $('#redo-stage'), canvas = $('.redo-canvas'), preview = $('#redo-preview');
  const play = $('#redo-play'), status = $('#redo-status'), inspect = $('#redo-inspect');
  const frame = $('#redo-frame'), timeline = $('.redo-timeline'), frequency = $('#redo-frequency');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let index = 6, state = 'still', animation = null, request = 0, controller = null;
  let inView = true, printing = false, paper = false, cardRequest = 0, saving = false;
  const blocked = () => reduced.matches || document.body.classList.contains('motion-off');
  const present = () => !document.hidden && !printing && inView;
  const pad = value => String(value).padStart(2, '0');
  function update(message) {
    room.dataset.state = state;
    play.disabled = blocked();
    play.textContent = ({loading:'Cancel loading', playing:'Pause', paused:'Resume', ended:'Replay once', inspecting:'Play from frame'})[state] || 'Play once ↗';
    play.setAttribute('aria-label', `${play.textContent}: ${cards[index].dataset.title}`);
    inspect.setAttribute('aria-expanded', String(!timeline.hidden));
    $('#redo-mode').textContent = ({loading:'LOADING / LOCAL FILE', playing:'ON AIR / PLAYING ONCE', paused:'PAUSED / YOUR PACE', ended:'TRANSMISSION COMPLETE', inspecting:'FRAME LAB / YOUR PACE'})[state] || 'STILL / YOUR PACE';
    if (message) status.textContent = message;
  }
  function clear() {
    request++;
    controller?.abort(); controller = null;
    animation?.destroy(); animation = null;
    canvas.replaceChildren(); canvas.hidden = true;
    stage.classList.remove('has-animation');
    timeline.hidden = true;
    state = 'still';
  }
  function still(message = 'Static preview restored. Nothing plays automatically.') { clear(); update(message); }
  function pause(message = 'Paused. Resume when you’re ready.') {
    if (state === 'loading') { still(message); return; }
    if (state !== 'playing') return;
    animation.pause(); state = 'paused'; update(message);
  }
  function showFrame(value) {
    if (!animation) return;
    const n = Math.max(0, Math.min(Number(frame.max), Number(value) || 0));
    animation.goToAndStop(n, true);
    frame.value = n;
    $('#redo-frame-label').textContent = `${pad(n + 1)} / ${pad(Number(frame.max) + 1)}`;
    frame.setAttribute('aria-valuetext', `Frame ${n + 1} of ${Number(frame.max) + 1}`);
  }
  function openFrames() {
    animation.pause(); timeline.hidden = false;
    state = 'inspecting';
    showFrame(Math.floor(animation.currentFrame));
    update('Frame controls open. Drag the slider or use the arrow keys. Frames advance only when you choose.');
  }
  function run() {
    if (blocked() || !present()) return;
    document.dispatchEvent(new CustomEvent('egor-sticker-play', {detail:'redo'}));
    const replay = state === 'ended';
    state = 'playing'; timeline.hidden = true;
    replay ? animation.goToAndPlay(0, true) : animation.play();
    update('Playing once. Pause at any time. Escape also pauses.');
  }
  async function load(mode) {
    if (!present() || (mode === 'play' && blocked())) return;
    const token = ++request;
    const abort = new AbortController(); controller = abort;
    state = 'loading'; update('Loading only this animation from the site…');
    const timeout = setTimeout(() => {
      if (request === token) still('Loading took too long. The static preview is still available. Try again when ready.');
    }, 15000);
    try {
      const [player, data] = await Promise.all([
        window.egorLoadLottie(),
        fetch(`assets/redo/data/${cards[index].dataset.redo}.json`, {signal:abort.signal})
          .then(response => { if (!response.ok) throw new Error('File unavailable'); return response.json(); })
      ]);
      if (token !== request) return;
      if (!present() || (mode === 'play' && blocked())) { still(); return; }
      canvas.hidden = false;
      const item = player.loadAnimation({
        container:canvas, renderer:'canvas', loop:false, autoplay:false, animationData:data,
        rendererSettings:{dpr:Math.min(devicePixelRatio || 1, 2), clearCanvas:true}
      });
      animation = item;
      await new Promise((resolve, reject) => {
        if (item.isLoaded) resolve();
        else item.addEventListener('DOMLoaded', resolve);
        item.addEventListener('data_failed', () => reject(new Error('Data unavailable')));
        item.addEventListener('error', () => reject(new Error('Rendering unavailable')));
        abort.signal.addEventListener('abort', () => reject(new Error('Cancelled')), {once:true});
      });
      if (token !== request) return;
      if (!present() || (mode === 'play' && blocked())) { still(); return; }
      frame.max = Math.max(0, Math.ceil(item.totalFrames) - 1);
      item.addEventListener('complete', () => {
        if (animation !== item) return;
        state = 'ended'; update('Transmission complete. Replay once, explore the frames, or tune another channel.');
      });
      item.addEventListener('error', () => {
        if (animation === item) still('Playback unavailable. The static preview is still available. Try again when ready.');
      });
      stage.classList.add('has-animation');
      item.goToAndStop(0, true);
      if (mode === 'inspect') openFrames(); else run();
    } catch (_) {
      if (token === request) still('Playback unavailable. The static preview is still available. Try again when ready.');
    } finally { clearTimeout(timeout); }
  }
  play.addEventListener('click', () => {
    if (state === 'loading') return still('Loading cancelled. Static preview restored.');
    if (state === 'playing') return pause();
    if (animation) run(); else load('play');
  });
  inspect.setAttribute('aria-controls', 'redo-timeline');
  inspect.addEventListener('click', () => {
    if (state === 'loading') return still('Loading cancelled. Try Explore frames again when ready.');
    if (animation) openFrames(); else load('inspect');
  });
  frame.addEventListener('input', () => {
    if (!animation) return;
    state = 'inspecting'; showFrame(frame.value); update();
  });
  $('#redo-still').addEventListener('click', () => still());
  function select(next, announce = true) {
    clear(); index = (next + cards.length) % cards.length;
    const card = cards[index], image = card.querySelector('img');
    cards.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
    preview.src = image.getAttribute('src'); preview.alt = image.alt;
    canvas.setAttribute('aria-label', image.alt);
    $('#redo-title').textContent = card.dataset.title;
    $('#redo-category').textContent = `${card.dataset.category.toUpperCase()} / EDITORIAL LABEL`;
    $('#redo-reading').textContent = card.dataset.reading;
    $('#redo-original').href = `assets/redo/originals/${card.dataset.source}`;
    $('#redo-original').setAttribute('aria-label', `Download original TGS: ${card.dataset.title}`);
    $('#redo-channel').textContent = `CH ${pad(index + 1)} / ${cards.length}`;
    $('#redo-position').textContent = `${pad(index + 1)} / ${cards.length}`;
    frequency.value = index;
    frequency.setAttribute('aria-valuetext', `Channel ${index + 1} of ${cards.length}: ${card.dataset.title}`);
    update(announce ? `Channel ${index + 1}: ${card.dataset.title}. ${blocked() ? 'Motion is off. Explore still frames at your pace.' : 'Press Play once, or explore the frames.'}` : 'Nothing plays until you press Play once.');
    queueCard();
  }
  cards.forEach((card, i) => {
    card.disabled = false;
    card.addEventListener('click', () => select(i));
  });
  $('#redo-prev').addEventListener('click', () => select(index - 1));
  $('#redo-next').addEventListener('click', () => select(index + 1));
  frequency.addEventListener('input', () => select(Number(frequency.value)));
  function preferences() {
    if (blocked()) still('Motion is off. Browse stills or explore individual frames manually.');
    else update('Ready when you are. Nothing resumes automatically.');
  }
  reduced.addEventListener('change', preferences);
  new MutationObserver(() => { if (play.disabled !== blocked()) preferences(); })
    .observe(document.body, {attributes:true, attributeFilter:['class']});
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause('Paused while you were away. Nothing resumes automatically.'); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') pause(); });
  document.addEventListener('egor-sticker-play', event => { if (event.detail !== 'redo') pause('Paused while another sticker plays.'); });
  addEventListener('beforeprint', () => { printing = true; pause('Paused for printing.'); });
  addEventListener('afterprint', () => { printing = false; });
  addEventListener('pagehide', () => still());
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
    inView = entries[0].isIntersecting;
    if (!inView) pause('Paused outside the view. Nothing resumes automatically.');
  }).observe(stage);
  if ('ResizeObserver' in window) new ResizeObserver(() => animation?.resize()).observe(stage);

  // Signal-card compositor: only local images and Canvas 2D. Text never leaves this page.
  const cardCanvas = $('#redo-card-preview'), message = $('#redo-message'), save = $('#redo-save');
  const saveStatus = $('#redo-save-status');
  const imageCache = new Map();
  function localImage(src) {
    if (!imageCache.has(src)) imageCache.set(src, new Promise((resolve, reject) => {
      const image = new Image();
      const timer = setTimeout(() => reject(new Error('Image timeout')), 10000);
      image.onload = () => { clearTimeout(timer); resolve(image); };
      image.onerror = () => { clearTimeout(timer); reject(new Error('Image unavailable')); };
      image.src = src;
    }).catch(error => { imageCache.delete(src); throw error; }));
    return imageCache.get(src);
  }
  function wrapText(ctx, text, maxWidth) {
    const lines = []; let line = '';
    // Break overlong words too, without splitting emoji / combining character sequences.
    const segments = typeof Intl.Segmenter === 'function' ? [...new Intl.Segmenter(undefined, {granularity:'grapheme'}).segment(text)].map(s => s.segment) : Array.from(text);
    for (const char of segments) {
      if (ctx.measureText(line + char).width > maxWidth && line) { lines.push(line.trim()); line = char; }
      else line += char;
    }
    if (line.trim()) lines.push(line.trim());
    return lines;
  }
  async function drawCard(target, selected, text, light) {
    const source = selected.querySelector('img').getAttribute('src');
    const image = await localImage(source);
    await Promise.race([document.fonts.ready, new Promise(resolve => setTimeout(resolve, 2500))]);
    target.width = 1600; target.height = 1000;
    const c = target.getContext('2d');
    if (!c) throw new Error('Canvas unavailable');
    const bg = light ? '#f5f0dc' : '#101e25', ink = light ? '#101e25' : '#f5f0dc';
    const accent = light ? '#315f30' : '#baf16c', soft = light ? '#4e655b' : '#b4c9cb';
    c.fillStyle = bg; c.fillRect(0, 0, 1600, 1000);
    c.strokeStyle = light ? '#d1d3bc' : '#294149'; c.lineWidth = 1;
    for (let x = 44; x < 1600; x += 44) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 1000); c.stroke(); }
    for (let y = 44; y < 1000; y += 44) { c.beginPath(); c.moveTo(0, y); c.lineTo(1600, y); c.stroke(); }
    c.fillStyle = bg; c.fillRect(64, 45, 1472, 105); c.fillRect(64, 835, 1472, 120);
    c.fillStyle = ink; c.font = '66px Anton, sans-serif'; c.fillText('REDO', 78, 112);
    c.fillStyle = soft; c.font = '16px monospace'; c.fillText('THE FREQUENCY ROOM / EGOR WORLD', 252, 97);
    c.textAlign = 'right'; c.fillText(`SIGNAL ${pad(cards.indexOf(selected) + 1)} / 10`, 1520, 97); c.textAlign = 'left';
    c.strokeStyle = accent; c.lineWidth = 2; c.beginPath(); c.moveTo(78, 148); c.lineTo(1520, 148); c.stroke();
    c.save(); c.translate(1150, 490); c.rotate(-.12);
    c.strokeStyle = light ? '#809c72' : '#4d7667';
    [240, 285, 330].forEach((r, i) => { c.setLineDash(i === 1 ? [5, 12] : []); c.beginPath(); c.ellipse(0, 0, r, r * .92, i * .4, 0, Math.PI * 2); c.stroke(); });
    c.setLineDash([]); c.rotate(.05); c.drawImage(image, -300, -300, 600, 600); c.restore();
    c.fillStyle = accent; c.font = '18px monospace'; c.fillText('A SMALL SIGNAL. YOUR OWN WORDS.', 80, 255);
    c.fillStyle = ink;
    const clean = text.trim() || 'More room to be yourself.';
    let size = 70, lines;
    do { c.font = `700 ${size}px "DM Sans", Arial, sans-serif`; lines = wrapText(c, clean, 690); if (lines.length <= 4) break; size -= 2; } while (size > 36);
    const rtl = /^[^A-Za-z\u0590-\u08ff]*[\u0590-\u08ff]/u.test(clean);
    c.direction = rtl ? 'rtl' : 'ltr'; c.textAlign = rtl ? 'right' : 'left';
    lines.forEach((line, i) => c.fillText(line, rtl ? 770 : 80, 380 + i * size * 1.26));
    c.direction = 'ltr'; c.textAlign = 'left';
    c.fillStyle = accent; c.font = '25px "DM Sans", sans-serif'; c.fillText(selected.dataset.title.toUpperCase(), 80, 760);
    c.strokeStyle = accent; c.beginPath(); c.moveTo(78, 835); c.lineTo(1520, 835); c.stroke();
    c.fillStyle = soft; c.font = '17px "DM Sans", Arial, sans-serif';
    c.fillText('Independent community composition · supplied sticker artwork · not an official endorsement', 80, 890);
    c.font = '14px "DM Sans", Arial, sans-serif';
    c.fillText('Resistance Dog listing: tlgrm.eu/stickers/ResistanceDog · file authorship / sharing rights unverified', 80, 924);
    return target;
  }
  let cardTimer;
  function queueCard() {
    const token = ++cardRequest;
    clearTimeout(cardTimer);
    cardTimer = setTimeout(async () => {
      try {
        const buffer = document.createElement('canvas');
        await drawCard(buffer, cards[index], message.value.slice(0, 48), paper);
        if (token !== cardRequest) return;
        cardCanvas.width = buffer.width; cardCanvas.height = buffer.height;
        cardCanvas.getContext('2d').drawImage(buffer, 0, 0);
        cardCanvas.setAttribute('aria-label', `Signal card: ${message.value.trim() || 'More room to be yourself.'}. Sticker: ${cards[index].dataset.title}. ${paper ? 'Paper' : 'Night'} palette.`);
        if (!saving) saveStatus.textContent = 'Live preview · 1600 × 1000 PNG · made only in your browser';
      } catch (_) { if (token === cardRequest && !saving) saveStatus.textContent = 'Preview unavailable. Try selecting a different sticker.'; }
    }, 140);
  }
  message.addEventListener('input', queueCard);
  $('#redo-palette').addEventListener('click', () => {
    paper = !paper;
    $('#redo-palette').setAttribute('aria-pressed', String(paper));
    queueCard();
  });
  save.addEventListener('click', async () => {
    if (saving) return;
    saving = true; save.disabled = true; saveStatus.textContent = 'Composing your signal card…';
    const selected = cards[index], text = message.value.slice(0, 48), light = paper;
    try {
      const output = await drawCard(document.createElement('canvas'), selected, text, light);
      const blob = await new Promise((resolve, reject) => output.toBlob(value => value ? resolve(value) : reject(new Error('Export unavailable')), 'image/png'));
      const url = URL.createObjectURL(blob), link = document.createElement('a');
      link.href = url; link.download = `EGOR-REDO-${selected.dataset.redo}-${light ? 'paper' : 'night'}.png`;
      document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      saveStatus.textContent = 'PNG prepared; download requested. Confirm artwork sharing permissions before publishing.';
    } catch (_) { saveStatus.textContent = 'Export unavailable. Your message is still available. Try again when ready.'; }
    finally { saving = false; save.disabled = false; }
  });
  ['.redo-player-tools', '.redo-navigation', '.redo-dial', '.redo-make'].forEach(selector => { $(selector).hidden = false; });
  select(index, false); preferences();
})();
