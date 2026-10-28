/* EGOR / soft paper ripples. Mouse-only, bounded, and asleep when idle.
   Native scrolling never emits a trail; no touch handlers or scroll rails. */
(() => {
  'use strict';
  const body = document.body;
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  const fine = matchMedia('(hover:hover) and (pointer:fine)');
  const protectedSelector = 'a,button,input,textarea,select,summary,[role="button"],[contenteditable],code,pre,img,svg,dialog,.character,.idle-shell,.art-card,.marquee,.token-dock,.contract-bar,[data-water-static],h1,h2,h3,p,li,water-word,.water-widget';
  const canvas = document.createElement('canvas');
  canvas.className = 'egor-wake';
  canvas.setAttribute('aria-hidden','true');
  canvas.hidden = true;
  const ctx = canvas.getContext('2d',{alpha:true});
  if (!ctx) return;
  body.append(canvas);
  let width=0, height=0, raf=0, lastPaint=0, lastEmit=-Infinity;
  let waves=[], pointer=null, masks=[], dirty=true, selected=false, printing=false;
  let scrollUntil=0;
  const allowed=()=>fine.matches && !reduced.matches && !body.classList.contains('motion-off') &&
    !body.classList.contains('page-hidden') && !document.hidden && !printing && !selected &&
    !document.documentElement.classList.contains('booting') && !body.classList.contains('entering') &&
    !document.querySelector('dialog[open]') && (!window.visualViewport || visualViewport.scale<=1.01);

  function stop() {
    cancelAnimationFrame(raf);raf=0;waves=[];pointer=null;
    ctx.clearRect(0,0,width,height);canvas.hidden=true;
    canvas.dataset.state='sleeping';
  }
  function resize() {
    stop();width=innerWidth;height=innerHeight;
    // No full-size bitmap on touch devices or with reduced motion enabled.
    const ratio=Math.min(devicePixelRatio||1,1.25,Math.sqrt(1200000/(width*height)));
    const enabled=fine.matches && !reduced.matches;
    canvas.width=enabled?Math.floor(width*ratio):1;
    canvas.height=enabled?Math.floor(height*ratio):1;
    ctx.setTransform(ratio,0,0,ratio,0,0);
    dirty=true;
  }
  function measure() {
    masks=[];
    for(const el of document.querySelectorAll(protectedSelector)) {
      if(el.parentElement?.closest(protectedSelector)) continue;
      for(const r of el.getClientRects()) {
        if(r.width && r.height && r.bottom>0 && r.top<height)
          masks.push({x:r.left-8,y:r.top-8,w:r.width+16,h:r.height+16});
      }
    }
    dirty=false;
  }
  function draw(w,now) {
    const t=(now-w.born)/900;
    const ease=1-(1-t)**3;
    const fade=Math.sin(Math.PI*t)*(1-t);
    ctx.save();ctx.translate(w.x,w.y);ctx.rotate(w.angle);
    ctx.lineWidth=.85;ctx.lineCap='round';
    // Round, incomplete ripples with a gentle outward drift, not sharp chevrons.
    for(let i=0;i<2;i++) {
      const radius=9+ease*29+i*9;
      ctx.beginPath();
      ctx.ellipse(-ease*7,0,radius,radius*.68,0,.32*Math.PI,1.68*Math.PI);
      ctx.strokeStyle='#f4fffa';ctx.globalAlpha=fade*(i?.13:.24);ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(-ease*7+1,1,radius,radius*.68,0,.38*Math.PI,1.62*Math.PI);
      ctx.strokeStyle='#287e8c';ctx.globalAlpha=fade*(i?.035:.065);ctx.stroke();
    }
    ctx.restore();
  }
  function frame(now) {
    raf=0;
    if(!allowed()){stop();return;}
    // 30fps is enough for this quiet decoration, including high-refresh screens.
    if(now-lastPaint<32){raf=requestAnimationFrame(frame);return;}
    lastPaint=now;
    waves=waves.filter(w=>now-w.born<900);
    if(!waves.length){stop();return;}
    if(dirty) measure();
    ctx.clearRect(0,0,width,height);
    for(const wave of waves) draw(wave,now);
    for(const r of masks) ctx.clearRect(r.x,r.y,r.w,r.h);
    // Leave both page edges clean, including overlay-scrollbar hit areas.
    ctx.clearRect(0,0,40,height);ctx.clearRect(width-40,0,40,height);
    raf=requestAnimationFrame(frame);
  }
  addEventListener('pointermove',event=>{
    const now=performance.now(), x=event.clientX, y=event.clientY;
    if(event.pointerType!=='mouse' || event.buttons || !allowed() || now<scrollUntil ||
      x<48 || x>document.documentElement.clientWidth-48 || y<16 || y>height-16 ||
      event.target.closest(protectedSelector)) {pointer=null;return;}
    if(dirty) measure();
    if(masks.some(r=>x>=r.x && x<=r.x+r.w && y>=r.y && y<=r.y+r.h)){pointer=null;return;}
    if(pointer && now-pointer.time<180) {
      const dx=x-pointer.x, dy=y-pointer.y, distance=Math.hypot(dx,dy);
      if(distance<24) return;
      if(distance<160 && now-lastEmit>=100) {
        waves.push({x,y,angle:Math.atan2(dy,dx),born:now});
        if(waves.length>8) waves.shift();
        lastEmit=now;canvas.hidden=false;canvas.dataset.state='running';
        if(!raf) raf=requestAnimationFrame(frame);
      }
    }
    pointer={x,y,time:now};
  },{passive:true});
  document.addEventListener('pointerleave',()=>{pointer=null;},{passive:true});
  addEventListener('pointerdown',stop,{passive:true});
  // Clear immediately on scrolling (including nested scrollers), never emit.
  const scrolling=()=>{scrollUntil=performance.now()+180;dirty=true;stop();};
  addEventListener('scroll',scrolling,{passive:true,capture:true});
  addEventListener('wheel',scrolling,{passive:true});
  document.addEventListener('selectionchange',()=>{
    selected=!!getSelection()?.toString();if(selected) stop();
  });
  document.addEventListener('visibilitychange',stop);
  addEventListener('pagehide',stop);
  addEventListener('beforeprint',()=>{printing=true;stop();});
  addEventListener('afterprint',()=>{printing=false;});
  addEventListener('resize',resize,{passive:true});
  window.visualViewport?.addEventListener('resize',resize,{passive:true});
  reduced.addEventListener('change',resize);
  fine.addEventListener('change',resize);
  new MutationObserver(()=>{dirty=true;if(!allowed()) stop();}).observe(body,{attributes:true,attributeFilter:['class']});
  for(const dialog of document.querySelectorAll('dialog'))
    new MutationObserver(()=>{dirty=true;stop();}).observe(dialog,{attributes:true,attributeFilter:['open']});
  const invalidate=()=>{dirty=true;};
  if(window.ResizeObserver) new ResizeObserver(invalidate).observe(body);
  document.fonts?.ready.then(invalidate);
  document.fonts?.addEventListener('loadingdone',invalidate);
  document.addEventListener('toggle',invalidate,true);
  document.addEventListener('load',invalidate,true);
  resize();
})();
