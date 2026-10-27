/* EGOR / fluid ink — bounded spring bodies, swept pointer forces and local
   collision impulses. Event-driven RAF sleeps once the ink settles.
   Buttons, links, artwork, EGOR names and contract surfaces are immutable. */
(() => {
  'use strict';
  if (!window.IntersectionObserver || !window.Intl?.Segmenter) return;
  const fine = matchMedia('(hover:hover) and (pointer:fine)');
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  const body = document.body;
  const immune = 'a,button,input,textarea,select,summary,[role="button"],[contenteditable],code,pre,svg,img,dialog,.intro,.token-dock,.contract-bar,.toast,.character,.idle-shell,.art-card,.marquee,[data-water-static]';
  const widgetSelector = '.speech,.scribble,.hero-sticker,.asterisk,.art-label,.wall-caption,.guide-bubble,.curious-host>span,.curious-host>small,.farewell-lockup>span,.host-aside,.corner,.status-mark,.step-index';
  const segmenter = new Intl.Segmenter('en', {granularity:'grapheme'});
  const groups = [], visible = new Set();
  let started = false, enabled = false, raf = 0, dirty = true, previous = 0;
  let particles = [], barriers = [], lastInput = 0, selection = false;
  let point = null, stroke = null;
  const clamp = (x,a,b) => Math.max(a,Math.min(b,x));
  const permitted = () => fine.matches && !reduced.matches && !body.classList.contains('motion-off') && !document.hidden;
  const hasName = text => /egor|EQAO_tYpLbPq/i.test(text);

  function particle(el,kind='ink') {
    return {el,kind,x:0,y:0,vx:0,vy:0,bx:0,by:0,w:0,h:0,limit:kind==='ink'?25:kind==='skin'?8:14};
  }
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const group = groups.find(g => g.host === entry.target);
      if (!group) continue;
      if (entry.isIntersecting) visible.add(group);
      else {visible.delete(group);group.items.forEach(resetParticle);}
    }
    dirty = true;
  }, {rootMargin:'40px'});

  function makeGroup(host, items, words=[]) {
    const group = {host,items,words};
    groups.push(group);observer.observe(host);
  }

  function splitText(node) {
    const fragment = document.createDocumentFragment(), words = [], items = [];
    for (const token of node.data.split(/(\s+)/u)) {
      if (!token || /^\s+$/u.test(token)) {fragment.append(token);continue;}
      const word = document.createElement('water-word');
      const source = document.createElement('water-source');
      source.textContent = token;
      word.append(source);
      fragment.append(word);
      // Keep the whole name-bearing token fixed, including $ and punctuation.
      if (hasName(token)) {word.dataset.waterStatic='';continue;}
      const ink = document.createElement('water-ink');
      ink.setAttribute('aria-hidden','true');
      const letters = [];
      for (const part of segmenter.segment(token)) {
        const el = document.createElement('water-glyph');
        el.textContent = part.segment;ink.append(el);
        letters.push({el,start:part.index,end:part.index+part.segment.length});
        items.push(particle(el));
      }
      word.append(ink);words.push({word,source,letters});
    }
    node.replaceWith(fragment);
    return {words,items};
  }

  function start() {
    if (started) return;
    started = true;
    // Move only independent decoration; never a parent containing protected ink.
    for (const host of document.querySelectorAll(widgetSelector)) {
      if (host.closest(immune) || host.querySelector(immune) || hasName(host.textContent)) continue;
      host.classList.add('water-widget');
      makeGroup(host,[particle(host,'widget')]);
    }
    for (const host of document.querySelectorAll('.token-card')) {
      const skin = document.createElement('div');
      skin.className='water-skin';skin.setAttribute('aria-hidden','true');
      skin.style.setProperty('--water-fill',getComputedStyle(host).backgroundColor);
      host.prepend(skin);host.classList.add('water-card');
      makeGroup(skin,[particle(skin,'skin')]);
    }
    // Walk only editorial text. No changes to interactive or live-updating DOM.
    const nodes = [];
    for (const root of document.querySelectorAll('main,footer')) {
      const walker = document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{
        acceptNode(node) {
          const parent=node.parentElement;
          return node.data.trim() && !parent.closest(`${immune},.water-widget,.water-skin,script,style,noscript`)
            ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      });
      while (walker.nextNode()) nodes.push(walker.currentNode);
    }
    const byHost = new Map();
    for (const node of nodes) {
      const host=node.parentElement;
      const result=splitText(node);
      if (!byHost.has(host)) byHost.set(host,{words:[],items:[]});
      const group=byHost.get(host);group.words.push(...result.words);group.items.push(...result.items);
    }
    for (const [host,g] of byHost) if (g.items.length) makeGroup(host,g.items,g.words);
    new ResizeObserver(invalidate).observe(body);
    document.fonts?.addEventListener('loadingdone',invalidate);
    document.addEventListener('toggle',invalidate,true);
  }

  function resetParticle(p) {
    p.x=p.y=p.vx=p.vy=0;
    if(p.kind==='ink') p.el.style.transform='';
    else {p.el.style.removeProperty('--water-x');p.el.style.removeProperty('--water-y');}
  }
  function stop() {
    cancelAnimationFrame(raf);raf=0;previous=0;point=stroke=null;
    for (const group of groups) group.items.forEach(resetParticle);
    dirty=true;
  }
  function invalidate() {stop();}
  function sync() {
    enabled=permitted();
    if(enabled) start();
    body.classList.toggle('water-live',enabled);
    if(!enabled) stop();
  }

  function measure() {
    particles=[];barriers=[];
    // Rebase from the stationary layout after visibility/layout changes.
    for (const group of visible) group.items.forEach(resetParticle);
    // Geometry is cached between layout changes, never read per physics step.
    for (const group of visible) {
      if (!group.host.getClientRects().length) continue;
      for (const {word,source,letters} of group.words) {
        const text=source.firstChild, range=document.createRange();
        const wr=word.getBoundingClientRect();
        for (const letter of letters) {
          range.setStart(text,letter.start);range.setEnd(text,letter.end);
          const r=range.getBoundingClientRect();
          letter.el.style.left=`${r.left-wr.left}px`;
          letter.el.style.width=`${r.width}px`;
        }
        word.classList.add('water-ready');
      }
      for (const p of group.items) {
        const r=p.el.getBoundingClientRect();
        if (!r.width || !r.height || r.bottom<0 || r.top>innerHeight) continue;
        p.bx=r.left+r.width/2;p.by=r.top+r.height/2;
        p.w=r.width;p.h=r.height;
        particles.push(p);
      }
    }
    for (const el of [...document.querySelectorAll('a,button,summary,code,.character,.idle-shell,[data-water-static]')]) {
      const r=el.getBoundingClientRect();
      if(r.width && r.height && r.bottom>0 && r.top<innerHeight) barriers.push(r);
    }
    dirty=false;
  }

  function wake() {if(!raf && enabled && !selection) raf=requestAnimationFrame(frame);}
  function onPointer(event) {
    if(!enabled || event.pointerType!=='mouse' || selection || event.buttons || body.classList.contains('entering') || document.documentElement.classList.contains('booting')) return;
    if(document.querySelector('dialog[open]')) {stop();return;}
    const now=performance.now();
    const next={x:event.clientX,y:event.clientY};
    if(point && now-lastInput<100) {
      // Aggregate the complete segment between rendered frames, not just the
      // last browser event: fast passes through small letters still count.
      stroke={a:stroke?.a || point,b:next};
    } else stroke={a:next,b:next};
    point=next;lastInput=now;wake();
  }

  function push(p,path,dt) {
    const ax=path.a.x,ay=path.a.y,dx=path.b.x-ax,dy=path.b.y-ay;
    const length2=dx*dx+dy*dy;
    const x=p.bx+p.x,y=p.by+p.y;
    const t=length2?clamp(((x-ax)*dx+(y-ay)*dy)/length2,0,1):0;
    const cx=ax+dx*t,cy=ay+dy*t;
    // Distance from the swept cursor to the body, not merely its centre.
    let nx=x-cx,ny=y-cy;
    const reach=p.kind==='skin'?70:62;
    const edgeX=Math.max(0,Math.abs(nx)-p.w*.38);
    const edgeY=Math.max(0,Math.abs(ny)-p.h*.32);
    const distance=Math.hypot(edgeX,edgeY);
    if(distance>=reach) return;
    let n=Math.hypot(nx,ny);
    if(n<.01){nx=dy||1;ny=-dx||-1;n=Math.hypot(nx,ny);}
    nx/=n;ny/=n;
    const falloff=(1-distance/reach)**2;
    const speed=Math.min(1,Math.sqrt(length2)/40);
    const force=(p.kind==='skin'?400:1550)*falloff*(.6+speed);
    // A little tangential wake makes ink flow around, rather than jump away.
    const flow=Math.sqrt(length2)||1;
    p.vx+=(nx*force+dx/flow*force*.22)*dt;
    p.vy+=(ny*force+dy/flow*force*.22)*dt;
  }

  function collisions(active) {
    const cells=new Map(),cell=48;
    for(const p of active) {
      if(p.kind==='skin') continue;
      const x=p.bx+p.x,y=p.by+p.y;
      const gx=Math.floor(x/cell),gy=Math.floor(y/cell);
      const radius=Math.min(18,Math.min(p.w,p.h)*.42);
      for(let ix=gx-1;ix<=gx+1;ix++) for(let iy=gy-1;iy<=gy+1;iy++) {
        for(const q of cells.get(`${ix},${iy}`)||[]) {
          const dx=x-q.bx-q.x,dy=y-q.by-q.y;
          const base=Math.hypot(p.bx-q.bx,p.by-q.by);
          // Never "correct" native kerning or pre-existing layout overlaps.
          const min=Math.min(radius+Math.min(18,Math.min(q.w,q.h)*.42),base*.92);
          const distance=Math.hypot(dx,dy);
          if(distance>=min || distance<.001) continue;
          const nx=dx/distance,ny=dy/distance;
          const overlap=(min-distance)*.24;
          p.x+=nx*overlap;p.y+=ny*overlap;q.x-=nx*overlap;q.y-=ny*overlap;
          const approaching=(p.vx-q.vx)*nx+(p.vy-q.vy)*ny;
          if(approaching<0){const impulse=-approaching*.38;p.vx+=nx*impulse;p.vy+=ny*impulse;q.vx-=nx*impulse;q.vy-=ny*impulse;}
        }
      }
      const key=`${gx},${gy}`;
      if(!cells.has(key)) cells.set(key,[]);
      cells.get(key).push(p);
    }
  }

  function constrain(p) {
    const magnitude=Math.hypot(p.x,p.y);
    if(magnitude>p.limit) {p.x*=p.limit/magnitude;p.y*=p.limit/magnitude;p.vx*=.65;p.vy*=.65;}
    // Ink may flow around protected surfaces but cannot push those surfaces.
    if(p.kind!=='ink') return;
    const halfW=Math.min(p.w*.4,12),halfH=Math.min(p.h*.25,12);
    for(const r of barriers) {
      // Native overlaps (e.g. oversized hero lettering behind the character)
      // are intentional. Only block new intrusions caused by this effect.
      if(p.bx>r.left-halfW && p.bx<r.right+halfW && p.by>r.top-halfH && p.by<r.bottom+halfH) continue;
      const x=p.bx+p.x,y=p.by+p.y;
      if(x<=r.left-halfW || x>=r.right+halfW || y<=r.top-halfH || y>=r.bottom+halfH) continue;
      const edges=[{d:x-r.left+halfW,x:r.left-halfW-p.bx},{d:r.right+halfW-x,x:r.right+halfW-p.bx},{d:y-r.top+halfH,y:r.top-halfH-p.by},{d:r.bottom+halfH-y,y:r.bottom+halfH-p.by}];
      const edge=edges.reduce((a,b)=>a.d<b.d?a:b);
      if('x' in edge){p.x=edge.x;p.vx*= -.15;}else{p.y=edge.y;p.vy*= -.15;}
    }
    // Keep displaced ink inside the viewport without creating scrollbars.
    p.x=clamp(p.x,Math.min(0,2+p.w/2-p.bx),Math.max(0,innerWidth-2-p.w/2-p.bx));
  }

  function frame(now) {
    raf=0;
    if(!enabled || selection) return;
    if(dirty) measure();
    const dt=Math.min((now-(previous||now-16.67))/1000,.032);previous=now;
    const path=stroke;stroke=null;
    const nearby=path ? particles.filter(p => p.bx+p.w/2>Math.min(path.a.x,path.b.x)-100 && p.bx-p.w/2<Math.max(path.a.x,path.b.x)+100 && p.by+p.h/2>Math.min(path.a.y,path.b.y)-100 && p.by-p.h/2<Math.max(path.a.y,path.b.y)+100) : [];
    if(path) for(const p of nearby) push(p,path,Math.min(dt,.02));
    const active=particles.filter(p => Math.abs(p.x)+Math.abs(p.y)+Math.abs(p.vx)+Math.abs(p.vy)>.012 || nearby.includes(p));
    const steps=Math.max(1,Math.ceil(dt/.008)),h=dt/steps;
    for(let i=0;i<steps;i++) {
      for(const p of active) {
        const spring=p.kind==='skin'?145:120;
        p.vx+=(-spring*p.x-17*p.vx)*h;p.vy+=(-spring*p.y-17*p.vy)*h;
        p.x+=p.vx*h;p.y+=p.vy*h;
      }
      collisions(active);
      active.forEach(constrain);
    }
    let moving=false;
    for(const p of active) {
      if(Math.hypot(p.x,p.y)<.025 && Math.hypot(p.vx,p.vy)<.08) {resetParticle(p);continue;}
      moving=true;
      if(p.kind==='ink') p.el.style.transform=`translate(${p.x.toFixed(3)}px,${p.y.toFixed(3)}px) rotate(${clamp(p.vx*.018,-5,5).toFixed(2)}deg)`;
      else {p.el.style.setProperty('--water-x',`${p.x.toFixed(3)}px`);p.el.style.setProperty('--water-y',`${p.y.toFixed(3)}px`);}
    }
    // A hard idle ceiling guarantees sleep even with a pathological overlap.
    if(moving && now-lastInput<2200) wake();
    else {stop();body.dataset.waterState='sleeping';}
    if(raf) body.dataset.waterState='flowing';
  }

  document.addEventListener('pointermove',onPointer,{passive:true});
  document.addEventListener('pointerdown',()=>{selection=true;body.classList.add('water-selecting');stop();},{passive:true});
  document.addEventListener('pointerup',()=>{selection=false;if(!getSelection()?.toString())body.classList.remove('water-selecting');},{passive:true});
  document.addEventListener('selectionchange',()=>{if(!getSelection()?.toString() && !selection)body.classList.remove('water-selecting');});
  document.addEventListener('pointercancel',()=>{selection=false;body.classList.remove('water-selecting');stop();});
  document.documentElement.addEventListener('pointerleave',()=>{point=stroke=null;});
  addEventListener('blur',()=>{selection=false;body.classList.remove('water-selecting');stop();});
  addEventListener('scroll',invalidate,{passive:true});
  addEventListener('resize',invalidate,{passive:true});
  document.addEventListener('visibilitychange',sync);
  fine.addEventListener('change',sync);reduced.addEventListener('change',sync);
  new MutationObserver(sync).observe(body,{attributes:true,attributeFilter:['class']});
  document.addEventListener('transitionend',event=>{if(event.target.classList.contains('reveal')) invalidate();});
  (document.fonts?.ready || Promise.resolve()).then(sync);
})();
