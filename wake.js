/* EGOR / paper wake. Small, fading boat wakes; native scrolling stays native.
   No WebGL, blur, scroll interception, third-party code or idle render loop. */
(() => {
  'use strict';
  const body = document.body;
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  const coarse = matchMedia('(pointer:coarse)');
  const interactive = 'a,button,input,textarea,select,summary,[role="button"],[contenteditable],code,pre,.token-dock,.contract-bar';
  const protectedSelector = `${interactive},img,svg,.character,.idle-shell,.art-card,.marquee,[data-water-static]`;
  const canvas = document.createElement('canvas');
  canvas.className = 'egor-wake';
  canvas.setAttribute('aria-hidden','true');
  canvas.hidden = true;
  const ctx = canvas.getContext('2d',{alpha:true});
  if (!ctx) return;
  body.append(canvas);
  let width=0, height=0, ratio=1, raf=0, lastPaint=0, lastEmit=-Infinity;
  let waves=[], pointer=null, touch=null, selected=false, printing=false;
  let lastScroll=scrollY, scrollIntent=-Infinity, lastRail=-Infinity, railPhase=0;
  let geometryDirty=true, measured=-Infinity, subjects=[], masks=[];
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const allowed=()=>!reduced.matches && !body.classList.contains('motion-off') &&
    !document.hidden && !printing && !selected &&
    !document.documentElement.classList.contains('booting') &&
    !body.classList.contains('entering') && !document.querySelector('dialog[open]') &&
    (!window.visualViewport || visualViewport.scale<=1.01);

  function stop() {
    cancelAnimationFrame(raf);raf=0;waves=[];pointer=touch=null;
    lastScroll=scrollY;scrollIntent=-Infinity;
    ctx.clearRect(0,0,width,height);canvas.hidden=true;
    canvas.dataset.state='sleeping';
  }
  function resize() {
    stop();width=innerWidth;height=innerHeight;
    // Bound the bitmap even on high-DPR phones/tablets. No full-resolution GPU effects.
    ratio=Math.min(devicePixelRatio||1,coarse.matches?1.25:1.5,Math.sqrt(1800000/(width*height)));
    canvas.width=Math.ceil(width*ratio);canvas.height=Math.ceil(height*ratio);
    ctx.setTransform(ratio,0,0,ratio,0,0);
    geometryDirty=true;
  }
  function collect() {
    subjects=[...document.querySelectorAll(protectedSelector)].filter(el=>
      !el.parentElement?.closest(protectedSelector));
    // Preserve names even on touch devices where water.js does not split text.
    for(const root of document.querySelectorAll('main,footer')) {
      const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{
        acceptNode(node) {
          return /egor/i.test(node.data) && !node.parentElement.closest(`${protectedSelector},water-ink,script,style`)
            ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      });
      while(walker.nextNode()) {
        const node=walker.currentNode;
        for(const match of node.data.matchAll(/\$?egor/ig)) {
          const range=document.createRange();
          range.setStart(node,match.index);range.setEnd(node,match.index+match[0].length);
          subjects.push(range);
        }
      }
    }
    geometryDirty=false;
  }
  function measure(now) {
    if(geometryDirty) collect();
    masks=[];
    // Layout reads are batched, not performed for each ripple or on every touch event.
    for(const subject of subjects) for(const r of subject.getClientRects()) {
      if(r.width && r.height && r.bottom>-220 && r.top<height+220)
        masks.push({x:r.left-5,y:r.top+scrollY-5,w:r.width+10,h:r.height+10});
    }
    measured=now;
  }
  function emit(x,y,angle,strength,rail=false,now=performance.now()) {
    if(!allowed()) return;
    waves.push({x,y,angle,strength,rail,born:now,life:rail?1250:1050});
    if(waves.length>(coarse.matches?32:44)) waves.shift();
    canvas.hidden=false;canvas.dataset.state='running';
    if(!raf) raf=requestAnimationFrame(frame);
  }
  function trace(x,y,now) {
    if(pointer && now-pointer.time<140) {
      const dx=x-pointer.x,dy=y-pointer.y,distance=Math.hypot(dx,dy);
      if(distance>9 && distance<200 && now-lastEmit>48) {
        emit(x,y,Math.atan2(dy,dx),clamp(distance/45,.35,1),false,now);
        lastEmit=now;pointer={x,y,time:now};return;
      }
      if(distance<=9) return;
    }
    pointer={x,y,time:now};
  }
  function draw(w,now) {
    const t=(now-w.born)/w.life,fade=Math.min(1,t*9)*(1-t)**1.5;
    // Ease out into broad, fine chevrons: a boat wake, not a cursor halo.
    const spread=(w.rail?19:9)+(w.rail?67:37)*t;
    const tail=(w.rail?29:18)+(w.rail?68:48)*t;
    ctx.save();ctx.translate(w.x,w.y);ctx.rotate(w.angle);
    ctx.translate(-t*20,0);ctx.lineCap='round';ctx.lineJoin='round';
    for(let layer=0;layer<2;layer++) {
      const back=layer*10;
      ctx.beginPath();ctx.moveTo(-tail-back,-spread);
      ctx.bezierCurveTo(-tail*.55-back,-spread*.76,-back-2,-spread*.16,-back,0);
      ctx.bezierCurveTo(-back-2,spread*.16,-tail*.55-back,spread*.76,-tail-back,spread);
      ctx.globalAlpha=fade*(.45+w.strength*.2)*(layer? .55:1);
      ctx.strokeStyle='#f5fff7';ctx.lineWidth=1.6;ctx.stroke();
      ctx.translate(-1.8,0);
      ctx.globalAlpha=fade*.15*(layer?.55:1);
      ctx.strokeStyle='#287e8c';ctx.lineWidth=.8;ctx.stroke();
      ctx.translate(1.8,0);
    }
    ctx.restore();
  }
  function frame(now) {
    raf=0;
    if(!allowed()){stop();return;}
    // 30fps cap on touch; 60fps ceiling on desktop, including high-refresh screens.
    if(now-lastPaint<(coarse.matches?32:16)){raf=requestAnimationFrame(frame);return;}
    lastPaint=now;
    waves=waves.filter(w=>now-w.born<w.life);
    if(!waves.length){stop();return;}
    if(geometryDirty || now-measured>100) measure(now);
    ctx.clearRect(0,0,width,height);
    for(const wave of waves) draw(wave,now);
    // All protected artwork, controls, names and addresses remain visually untouched.
    for(const r of masks) ctx.clearRect(r.x,r.y-scrollY,r.w,r.h);
    raf=requestAnimationFrame(frame);
  }

  addEventListener('pointermove',event=>{
    if(event.pointerType!=='mouse' || event.buttons || !allowed()) {pointer=null;return;}
    if(event.target.closest(interactive)){pointer=null;return;}
    trace(event.clientX,event.clientY,performance.now());
  },{passive:true});
  document.addEventListener('pointerleave',()=>{pointer=null;},{passive:true});
  // Passive touch events continue after pointercancel during native scroll on mobile.
  addEventListener('touchstart',event=>{
    if(event.touches.length!==1 || !allowed() || event.target.closest(interactive)){stop();return;}
    const t=event.touches[0];
    touch={x:t.clientX,y:t.clientY};pointer={...touch,time:performance.now()};
  },{passive:true});
  addEventListener('touchmove',event=>{
    if(!touch || event.touches.length!==1 || !allowed()){stop();return;}
    const t=event.touches[0],now=performance.now();
    if(Math.hypot(t.clientX-touch.x,t.clientY-touch.y)<10) return;
    scrollIntent=now;
    trace(t.clientX,t.clientY,now);
  },{passive:true});
  addEventListener('touchend',()=>{touch=null;pointer=null;},{passive:true});
  addEventListener('touchcancel',()=>{touch=null;pointer=null;},{passive:true});
  addEventListener('wheel',event=>{
    if(!event.ctrlKey && allowed()) scrollIntent=performance.now();
  },{passive:true});
  addEventListener('keydown',event=>{
    if(['ArrowDown','ArrowUp','PageDown','PageUp',' '].includes(event.key) && !event.target.closest(interactive) && allowed())
      scrollIntent=performance.now();
  });
  addEventListener('scroll',()=>{
    const delta=scrollY-lastScroll;lastScroll=scrollY;
    const now=performance.now();
    if(!allowed() || now-scrollIntent>1800 || Math.abs(delta)<1 || Math.abs(delta)>height*.65 || now-lastRail<85) return;
    lastRail=now;railPhase+=.72;
    const y=height*(delta>0?.58:.42)+Math.sin(railPhase)*22;
    const strength=clamp(Math.abs(delta)/45,.3,1),angle=delta>0?-Math.PI/2:Math.PI/2;
    // Soft wakes down both margins make momentum scrolling feel watery without
    // shifting reading text. A fingertip adds its own small wake while dragging.
    emit(12,y,angle,strength,true,now);
    emit(width-12,y+Math.sin(railPhase)*18,angle,strength,true,now);
  },{passive:true});

  document.addEventListener('selectionchange',()=>{
    selected=!!getSelection()?.toString();if(selected) stop();
  });
  document.addEventListener('visibilitychange',stop);
  addEventListener('pagehide',stop);
  addEventListener('beforeprint',()=>{printing=true;stop();});
  addEventListener('afterprint',()=>{printing=false;});
  addEventListener('resize',resize,{passive:true});
  window.visualViewport?.addEventListener('resize',resize,{passive:true});
  reduced.addEventListener('change',stop);
  coarse.addEventListener('change',resize);
  new MutationObserver(()=>{if(!allowed()) stop();}).observe(body,{attributes:true,attributeFilter:['class']});
  for(const dialog of document.querySelectorAll('dialog'))
    new MutationObserver(stop).observe(dialog,{attributes:true,attributeFilter:['open']});
  const dirty=()=>{geometryDirty=true;};
  if(window.ResizeObserver) new ResizeObserver(dirty).observe(body);
  document.fonts?.ready.then(dirty);
  document.fonts?.addEventListener('loadingdone',dirty);
  document.addEventListener('toggle',dirty,true);
  resize();
})();
