/* A small, bounded pendulum simulation. No libraries, network, or autoplay audio. */
(() => {
  'use strict';
  const room = document.getElementById('light-room');
  if (!room) return;
  const $ = id => document.getElementById(`light-${id}`);
  const stage = $('stage'), svg = $('drawing'), bulb = $('bulb'), cord = $('cord');
  const nudge = $('nudge'), reel = $('reel'), pause = $('pause'), sound = $('sound');
  const status = $('status'), reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const ns = 'http://www.w3.org/2000/svg';
  const make = (tag, attributes) => {
    const node = document.createElementNS(ns, tag);
    Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
    return node;
  };
  const shadows = make('g', {'aria-hidden':'true'});
  svg.insertBefore(shadows, svg.firstChild);
  const pool = make('ellipse', {fill:'url(#light-pool)', opacity:'.55'});
  const defs = make('defs', {});
  const gradient = make('radialGradient', {id:'light-pool'});
  gradient.append(make('stop', {'stop-color':'#fff3ba','stop-opacity':'.8'}), make('stop', {offset:'1','stop-color':'#fff3ba','stop-opacity':'0'}));
  defs.append(gradient); svg.prepend(defs); shadows.append(pool);
  const toys = [...room.querySelectorAll('[data-toy]')].map((node, i) => {
    const shadow = make('ellipse', {fill:'#091b20',opacity:'.13'});
    shadows.append(shadow);
    return {node, shadow, i, x:0, y:0, vx:0, vy:0, rotation:0, spin:0, homeX:0, homeY:0, r:[26,29,23][i], hit:0};
  });
  let width = 0, height = 0, length = 0, targetLength = 0, lengthVelocity = 0;
  let angle = -.12, velocity = 0, extended = false, lit = true, localPause = false;
  let visible = true, frame = 0, previousTime = 0, accumulator = 0, restFrames = 0;
  let drag = null, suppressClick = false, scrollBase = 0, lastScroll = scrollY, scrollAmount = 0;
  let audio = null, master = null, audioOn = false, musicTimer = 0, noteIndex = 0;
  let lastImpact = 0, alternate = 1;
  const blocked = () => localPause || reduced.matches || document.body.classList.contains('motion-off');
  const active = () => visible && !document.hidden && !blocked();
  const limit = () => Math.asin(clamp((width / 2 - 49) / (length + 63), .08, .8));
  function point() {
    return {x:width / 2 + Math.sin(angle) * length, y:10 + Math.cos(angle) * length};
  }
  function lightPoint() {
    return {x:width / 2 + Math.sin(angle) * (length + 60), y:10 + Math.cos(angle) * (length + 60)};
  }
  function updateTarget() {
    targetLength = clamp(height - (extended ? 124 : 174) + scrollAmount, 65, height - 119);
  }
  function resize() {
    const box = stage.getBoundingClientRect();
    if (box.width <= 0 || box.height <= 0) return;
    if (drag) release(null, true);
    width = box.width; height = box.height; scrollBase = box.top + scrollY;
    velocity = 0;
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    $('anchor').setAttribute('transform', `translate(${width / 2} 0)`);
    $('floor').setAttribute('d', `M18 ${height - 30}H${width - 18}`);
    scrollAmount = clamp((scrollY - scrollBase + 150) * .15, -12, 45);
    updateTarget(); length = targetLength; lengthVelocity = 0;
    angle = clamp(angle, -limit(), limit());
    toys.forEach(t => {
      t.homeX = width * [.23,.77,.5][t.i];
      t.homeY = height - [78,78,54][t.i];
      t.x = t.homeX; t.y = t.homeY; t.vx = t.vy = t.spin = t.rotation = 0;
    });
    render(); wake();
  }
  function render() {
    const p = point(), light = lightPoint();
    bulb.style.transform = `translate3d(${(p.x - 40).toFixed(2)}px,${(p.y - 18.75).toFixed(2)}px,0) rotate(${-angle}rad)`;
    // A taut cord with just a little inertial bow, not an elastic rubber band.
    const bow = clamp(velocity * 7, -9, 9);
    cord.setAttribute('d', `M${width/2} 6 Q${width/2 + (p.x-width/2)*.48 + bow} ${p.y*.49} ${p.x} ${p.y}`);
    room.style.setProperty('--light-x', `${light.x.toFixed(1)}px`);
    room.style.setProperty('--light-y', `${light.y.toFixed(1)}px`);
    pool.setAttribute('cx', light.x); pool.setAttribute('cy', height - 33);
    pool.setAttribute('rx', clamp(170 - (height-light.y)*.3, 75, 155)); pool.setAttribute('ry', '24');
    pool.setAttribute('opacity', lit ? '.6' : '0');
    toys.forEach(t => {
      t.node.setAttribute('transform', `translate(${t.x.toFixed(2)} ${t.y.toFixed(2)}) rotate(${t.rotation.toFixed(2)})`);
      const elevation = Math.max(0, height - 30 - t.y - t.r);
      const shadowX = t.x + clamp((t.x - light.x) * .18, -28, 28);
      t.shadow.setAttribute('cx', shadowX); t.shadow.setAttribute('cy', height - 29);
      t.shadow.setAttribute('rx', t.r * (1 + elevation / 100)); t.shadow.setAttribute('ry', Math.max(2, 5-elevation*.02));
      t.shadow.setAttribute('opacity', lit ? clamp(.2 - elevation*.002, .04, .2) : '.05');
    });
  }
  function impact(power, index) {
    if (power < 25 || performance.now() - lastImpact < 100) return;
    lastImpact = performance.now();
    tone([392,493.88,587.33][index], clamp(power / 450, .05, .2), .28);
  }
  function step(dt) {
    if (!drag) {
      lengthVelocity += ((targetLength - length) * 42 - lengthVelocity * 11) * dt;
      length += lengthVelocity * dt;
      // Variable-length pendulum: gravity, drag and conservation of angular momentum.
      velocity += (-980 / Math.max(length, 65) * Math.sin(angle) - .48 * velocity - 2 * lengthVelocity / length * velocity) * dt;
      angle += velocity * dt;
      const max = limit();
      if (Math.abs(angle) > max) { angle = clamp(angle, -max, max); velocity *= -.32; }
    }
    const p = lightPoint();
    const lampVX = Math.cos(angle) * (length + 60) * velocity + Math.sin(angle) * lengthVelocity;
    const lampVY = -Math.sin(angle) * (length + 60) * velocity + Math.cos(angle) * lengthVelocity;
    toys.forEach(t => {
      t.vx += ((t.homeX-t.x)*17 - t.vx*3.3) * dt;
      t.vy += ((t.homeY-t.y)*22 - t.vy*3.8) * dt;
      t.spin += (-t.rotation*24-t.spin*4) * dt;
      t.x += t.vx*dt; t.y += t.vy*dt; t.rotation += t.spin*dt;
      const dx = t.x-p.x, dy = t.y-p.y, distance = Math.hypot(dx,dy), contact = t.r+18;
      if (distance < contact) {
        const nx = distance > .01 ? dx/distance : 1, ny = distance > .01 ? dy/distance : 0;
        const penetration = contact-distance;
        t.x += nx*penetration*.8; t.y += ny*penetration*.8;
        const closing = (lampVX-t.vx)*nx + (lampVY-t.vy)*ny;
        if (closing > 0) {
          const force = Math.min(400, closing*1.3);
          t.vx += nx*force; t.vy += ny*force; t.spin += nx*force*1.7;
          if (!drag) velocity -= (nx*Math.cos(angle)-ny*Math.sin(angle))*force/(length+60)*.22;
          impact(closing,t.i);
        }
      }
      if (t.x < t.r+8 || t.x > width-t.r-8) { t.x=clamp(t.x,t.r+8,width-t.r-8); t.vx *= -.5; }
      if (t.y > height-30-t.r) { t.y=height-30-t.r; t.vy=-Math.abs(t.vy)*.45; }
    });
    // Doodle-to-doodle contacts transfer momentum too.
    for (let i=0;i<toys.length;i++) for (let j=i+1;j<toys.length;j++) {
      const a=toys[i], b=toys[j], dx=b.x-a.x, dy=b.y-a.y, d=Math.hypot(dx,dy), r=a.r+b.r;
      if (d < r && d > .01) {
        const nx=dx/d, ny=dy/d, overlap=(r-d)*.5;
        a.x-=nx*overlap; a.y-=ny*overlap; b.x+=nx*overlap; b.y+=ny*overlap;
        const relative=(a.vx-b.vx)*nx+(a.vy-b.vy)*ny;
        if(relative>0) { const impulse=relative*.7; a.vx-=nx*impulse;a.vy-=ny*impulse;b.vx+=nx*impulse;b.vy+=ny*impulse; }
      }
    }
  }
  function tick(time) {
    frame = 0;
    if (!active()) return;
    const elapsed = previousTime ? Math.min((time-previousTime)/1000,.05) : 1/60;
    previousTime = time; accumulator += elapsed;
    while (accumulator >= 1/120) { step(1/120); accumulator -= 1/120; }
    render();
    const moving = Math.abs(angle)>.0008 || Math.abs(velocity)>.002 || Math.abs(length-targetLength)>.1 || toys.some(t => Math.abs(t.vx)+Math.abs(t.vy)+Math.abs(t.spin)>.4);
    restFrames = moving || drag ? 0 : restFrames+1;
    if (restFrames < 24) frame=requestAnimationFrame(tick);
    else { previousTime=0; room.dataset.sleeping='true'; }
  }
  function wake() {
    if (!active() || frame) return;
    room.dataset.sleeping='false'; previousTime=0; accumulator=0; restFrames=0;
    frame=requestAnimationFrame(tick);
  }
  function stop() {
    cancelAnimationFrame(frame); frame=0; previousTime=0;
    if (drag) release(null, true);
  }
  function sync() {
    const locked=blocked();
    nudge.disabled=reel.disabled=locked;
    pause.disabled=reduced.matches || document.body.classList.contains('motion-off');
    pause.setAttribute('aria-pressed', String(locked)); pause.textContent=locked?'Paused':'Pause';
    room.dataset.paused=String(locked);
    $('help').textContent=locked?'A QUIET LIGHT · TAP TO SWITCH':'DRAG THE LIGHT · BUMP A DOODLE';
    if (active()) wake(); else stop();
    syncAudio();
  }
  function nudgeLamp(direction=alternate) {
    if (blocked()) return;
    velocity=clamp(velocity + direction*.95,-1.8,1.8); alternate=-direction;
    wake();
  }
  function toggleLight() {
    lit=!lit; room.dataset.lit=String(lit); bulb.setAttribute('aria-pressed',String(lit));
    status.textContent=lit?'A little light goes a long way.':'Lights out. The play stays.';
    tone(lit?660:330,.09,.12); render();
  }
  bulb.addEventListener('click', event => { if (suppressClick && event.detail) {suppressClick=false;return;} toggleLight(); });
  bulb.addEventListener('pointerdown', event => {
    if (event.button!==0 || blocked() || drag) return;
    suppressClick=false;
    const box=stage.getBoundingClientRect(), p=point();
    drag={id:event.pointerId, box, startX:event.clientX, startY:event.clientY, offsetX:event.clientX-box.left-p.x, offsetY:event.clientY-box.top-p.y, last:performance.now(), moved:false};
    bulb.setPointerCapture(event.pointerId); room.dataset.dragging='true';
    velocity=lengthVelocity=0; wake();
  });
  bulb.addEventListener('pointermove', event => {
    if (!drag || drag.id!==event.pointerId) return;
    const now=performance.now(), dt=Math.max(.008,(now-drag.last)/1000);
    const box = stage.getBoundingClientRect();
    const x=event.clientX-box.left-drag.offsetX-width/2;
    const y=event.clientY-box.top-drag.offsetY-10;
    const oldAngle=angle, oldLength=length;
    length=clamp(Math.hypot(x,y),65,height-119);
    angle=clamp(Math.atan2(x,Math.max(20,y)),-limit(),limit());
    velocity=clamp((angle-oldAngle)/dt,-2,2); lengthVelocity=clamp((length-oldLength)/dt,-160,160);
    drag.last=now;
    drag.moved ||= Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY)>5;
    render(); wake();
  });
  function release(event, cancelled=false) {
    if (!drag || (event && event.pointerId!==drag.id)) return;
    const current=drag; drag=null; delete room.dataset.dragging;
    suppressClick=current.moved || cancelled;
    if (cancelled || performance.now()-current.last>100) velocity=lengthVelocity=0;
    if (bulb.hasPointerCapture(current.id)) bulb.releasePointerCapture(current.id);
    wake();
  }
  bulb.addEventListener('pointerup', event=>release(event));
  bulb.addEventListener('pointercancel', event=>release(event,true));
  bulb.addEventListener('lostpointercapture', event=>release(event,true));
  bulb.addEventListener('keydown', event=>{
    if(event.key==='Escape' && drag) {release(null,true);return;}
    if(blocked())return;
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) {
      event.preventDefault();
      if(event.key==='ArrowLeft'||event.key==='ArrowRight') nudgeLamp(event.key==='ArrowLeft'?-1:1);
      else {extended=event.key==='ArrowDown';syncReel();updateTarget();wake();}
    }
  });
  nudge.addEventListener('click',()=>nudgeLamp());
  function syncReel() {
    reel.textContent=extended?'Cord ↑':'Cord ↓';
    reel.setAttribute('aria-label',extended?'Shorten the cord':'Lengthen the cord');
  }
  reel.addEventListener('click',()=>{
    extended=!extended;updateTarget();syncReel();wake();
  });
  pause.addEventListener('click',()=>{localPause=!localPause;sync();status.textContent=localPause?'Take your time. The light can wait.':'Ready when you are.';});
  addEventListener('scroll',()=>{
    const delta=clamp(scrollY-lastScroll,-60,60);lastScroll=scrollY;
    if(!active() || drag)return;
    scrollAmount=clamp((scrollY-scrollBase+150)*.15,-12,45);updateTarget();
    velocity=clamp(velocity+delta*.0015,-1.4,1.4);wake();
  },{passive:true});
  // Sparse, original pentatonic tones. AudioContext exists only after explicit opt-in.
  function tone(frequency, volume=.1, duration=1.6) {
    if(!audioOn || !audio || audio.state!=='running' || !active())return;
    const osc=audio.createOscillator(), gain=audio.createGain(), now=audio.currentTime;
    osc.type='sine';osc.frequency.setValueAtTime(frequency,now);
    gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(volume,now+.015);
    gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
    osc.connect(gain);gain.connect(master);osc.start(now);osc.stop(now+duration+.04);
    osc.onended=()=>{osc.disconnect();gain.disconnect();};
  }
  function syncAudio() {
    clearTimeout(musicTimer);musicTimer=0;
    if(!audio)return;
    if(!audioOn || !active()) {audio.suspend().catch(()=>{});return;}
    audio.resume().then(()=>{
      if(!audioOn || !active())return;
      const play=()=>{
        if(!audioOn || !active())return;
        const notes=[261.63,392,440,329.63,293.66,392,329.63,523.25];
        tone(notes[noteIndex++%notes.length],.075,2.4);
        musicTimer=setTimeout(play,2400);
      };
      clearTimeout(musicTimer);play();
    }).catch(()=>{audioOn=false;sound.setAttribute('aria-pressed','false');sound.textContent='Sound off';status.textContent='Audio unavailable. The light still works.';});
  }
  sound.addEventListener('click',()=>{
    try {
      if(!audio) {const Context=window.AudioContext||window.webkitAudioContext;audio=new Context();master=audio.createGain();master.gain.value=.22;master.connect(audio.destination);}
      audioOn=!audioOn;sound.setAttribute('aria-pressed',String(audioOn));sound.textContent=audioOn?'Sound on':'Sound off';
      status.textContent=audioOn?'Soft notes + tiny collision chimes. Sound stays in this scene.':'Sound off. A little peace and quiet.';
      syncAudio();
    } catch (_) {status.textContent='Audio unavailable. The light still works.';}
  });
  if('IntersectionObserver' in window) new IntersectionObserver(entries=>{
    visible=entries[0].isIntersecting;sync();
  },{threshold:0}).observe(stage);
  new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['class']});
  document.addEventListener('visibilitychange',sync);
  reduced.addEventListener('change',sync);
  addEventListener('pagehide',()=>{stop();clearTimeout(musicTimer);if(audio)audio.suspend().catch(()=>{});});
  addEventListener('pageshow',sync);
  room.dataset.ready='true';
  [bulb,nudge,reel,pause,sound].forEach(button=>button.disabled=false);
  if(!(window.AudioContext||window.webkitAudioContext)) {sound.disabled=true;sound.textContent='No audio';}
  resize();sync();
  if('ResizeObserver' in window) new ResizeObserver(resize).observe(stage);
  else addEventListener('resize',resize,{passive:true});
})();
