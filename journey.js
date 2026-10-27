/* EGOR / widget theatre. Original art at rest, articulated marker rig in transit.
 * Scroll is input, never controlled. One finite, damped rAF loop; cached layout.
 * All route coordinates are document-space, so feet and props share real edges.
 */
(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const slots = ['.hero .character', '#mood-image', '.token-host img', '.guide-disc img', '.curious-host img', '.farewell-lockup img'].map($);
  if (slots.some(s => !s) || !slots[0].querySelector('svg')) return;
  const body = document.body, reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const NS = 'http://www.w3.org/2000/svg';
  const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
  const mix = (a, b, t) => a + (b - a) * t;
  const ease = t => t * t * (3 - 2 * t);
  const range = (t, a, b) => ease(clamp((t - a) / (b - a)));
  const point = (x, y) => ({x, y});
  const lerp = (a, b, t) => point(mix(a.x, b.x, t), mix(a.y, b.y, t));
  function svg(tag, attrs = {}, parent) {
    const el = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    if (parent) parent.append(el);
    return el;
  }
  const shell = document.createElement('div');
  shell.className = 'journey-viewport'; shell.setAttribute('aria-hidden', 'true'); shell.inert = true;
  const stage = svg('svg', {class:'journey-scenery', 'aria-hidden':'true'}, shell);
  const actor = document.createElement('div'); actor.className = 'journey-actor'; shell.append(actor);
  const layers = slots.map((slot, i) => {
    const layer = i ? new Image() : slot.querySelector('svg').cloneNode(true);
    if (i) { layer.src = slot.src; layer.alt = ''; layer.decoding = 'async'; }
    layer.classList.add('journey-pose'); layer.style.opacity = '0'; actor.append(layer); return layer;
  });
  const rig = svg('svg', {viewBox:'0 0 200 360', class:'journey-rig', 'aria-hidden':'true'}, actor);
  const shadow = svg('ellipse', {cx:100, cy:353, rx:29, ry:4, fill:'#071215', opacity:'.16'}, rig);
  const figure = svg('g', {fill:'none', stroke:'#071215', 'stroke-width':4.7, 'stroke-linecap':'round', 'stroke-linejoin':'round'}, rig);
  const limbs = {};
  // Far limbs first, original face last. No redraw or distortion of face/hair.
  ['legBack','armBack','torso','legFront','armFront'].forEach(k => { limbs[k] = svg('path', {}, figure); });
  const head = svg('image', {href:'assets/journey-head.webp', x:76, y:0, width:49, height:46}, figure);
  const effects = svg('svg', {class:'journey-effects', 'aria-hidden':'true'}, shell);
  const impact = svg('g', {fill:'none', stroke:'currentColor', 'stroke-width':2, 'stroke-linecap':'round'}, effects);
  [-1,1].forEach(sign => svg('path', {d:`M ${sign*16} -2 l ${sign*9} -5 M ${sign*22} 5 l ${sign*11} 1`}, impact));
  const note = document.createElement('div'); note.className = 'journey-note'; shell.append(note);
  body.append(shell); slots.forEach(s => s.classList.add('journey-slot'));
  let ready = false, active = false, frame = 0, lastTime = 0, dirty = true, playhead = scrollY, home = -2;
  let layout, scenes = [], props = [], lastScene = -1, policy = '', moodRequest = 0;
  const allowed = () => ready && !reduced.matches && !body.classList.contains('motion-off') && !document.documentElement.classList.contains('booting');
  function setHome(index) {
    if (home === index) return;
    slots.forEach((s, i) => s.classList.toggle('journey-home', i === index)); home = index;
  }
  function rect(el) {
    const r = el.getBoundingClientRect();
    return {left:r.left, right:r.right, top:r.top + scrollY, bottom:r.bottom + scrollY, width:r.width, height:r.height, cx:r.left+r.width/2, cy:r.top+scrollY+r.height/2};
  }
  function ladder(x, top, bottom) {
    const g = svg('g', {class:'journey-ladder'}, stage);
    const count = Math.max(2, Math.ceil((bottom-top) / (layout.small ? 18 : 23)));
    const rung = (bottom-top) / count, half = layout.small ? 14 : 18;
    let d = `M ${x-half} ${top-9} L ${x-half+1} ${bottom+5} M ${x+half} ${top-7} L ${x+half-1} ${bottom+5}`;
    for (let j=0; j<=count; j++) { const y=top+j*rung; d += ` M ${x-half} ${y} L ${x+half} ${y+((j%2)*1.5)}`; }
    svg('path', {d}, g);
    // Little tape tabs attach the drawing to the actual widget edges.
    [top,bottom].forEach(y => svg('path', {d:`M ${x-half-7} ${y-4} l 13 4 M ${x+half-6} ${y-4} l 13 4`, class:'journey-tape'}, g));
    props.push({el:g}); return {x, top, bottom, rung};
  }
  function door(p, side) {
    const el = document.createElement('div'); el.className = `journey-door journey-door-${side}`;
    el.innerHTML = '<span class="journey-doorway"></span><span class="journey-door-leaf"><i></i><b>e</b></span><span class="journey-threshold"></span>';
    shell.append(el);
    const size = layout.cruise * .63;
    const prop = {el, p, size, door:true}; props.push(prop); return prop;
  }
  function ledge(a, b) {
    const g = svg('g', {class:'journey-ledge'}, stage);
    svg('path', {d:`M ${a.x} ${a.y+2} Q ${(a.x+b.x)/2} ${a.y+4} ${b.x} ${b.y+2}`}, g);
    props.push({el:g});
  }
  function segment(until, mode, a, b, extra = {}) { return {until, mode, a, b, ...extra}; }
  function measure() {
    // Measure only after CSS has stabilized. Scroll frames perform no layout reads.
    const width = document.documentElement.clientWidth;
    const small = width < 761, cruise = Math.min(small ? 110 : 150, innerHeight*.23);
    const rs = slots.map(rect);
    const anchors = rs.map(r => r.cy-innerHeight*.55);
    for (let i=1; i<anchors.length; i++) anchors[i] = Math.max(anchors[i], anchors[i-1]+1);
    const sizes = slots.map(s => Math.min(s.offsetWidth, s.offsetHeight));
    layout = {width, small, cruise, rs, anchors, sizes};
    props.forEach(p => p.el.remove()); props = [];
    const footer=rect($('.hero-foot')), art=rect($('.art-card')), meta=rect($('.world-meta'));
    const grid=rect($('.token-grid')), chain=rect($('.token-card.chain')), guide=rect($('.guide-disc'));
    const steps=[...document.querySelectorAll('.step')].map(rect), faq=rect($('.faq-layout'));
    const edge = x => clamp(x, 24, width-24);
    const feet = rs.map((r,i) => point(r.cx, r.cy + Math.min(slots[i].offsetWidth, slots[i].offsetHeight)/2));
    const scene = (parts, properties, label) => ({parts, properties, label});
    let begin = props.length;
    // 01: the hero's footer becomes a ladder into the little paper mood board.
    let x=edge(art.right+14), top=footer.top, bottom=Math.max(top+80,art.top+42);
    const l0=ladder(x,top,bottom), a0=point(x,top), b0=point(x,bottom);
    scenes[0]=scene([
      segment(.15,'depart',feet[0],a0,{jump:35}),
      segment(.72,'climb',a0,b0,{ladder:l0}),
      segment(.80,'perch',b0,b0),
      segment(1,'arrive',b0,feet[1],{jump:45})
    ],props.slice(begin),'taking the scenic route');
    begin=props.length;
    // 02: walk the metadata rail, gather momentum, leap to the token host.
    const a1=point(edge(meta.right-(small?100:230)),meta.top-8), b1=point(edge(meta.right-25),meta.top-8);
    ledge(a1,b1);
    scenes[1]=scene([
      segment(.29,'depart',feet[1],a1,{jump:45}),
      segment(.55,'walk',a1,b1),
      segment(.64,'crouch',b1,b1),
      segment(1,'arrive',b1,feet[2],{jump:small?85:125})
    ],props.slice(begin),'a small leap of character');
    begin=props.length;
    // 03: descend the token card, open its door, emerge beside the guide.
    x=edge(grid.right-5); top=grid.top+3; bottom=chain.bottom-18;
    const l2=ladder(x,top,bottom), a2=point(x,top), b2=point(x,bottom);
    const entry=point(edge(chain.right-57),bottom);
    const exit=point(edge(guide.right-21),guide.bottom-10);
    const entryDoor=door(entry,'in'), exitDoor=door(exit,'out');
    scenes[2]=scene([
      segment(.13,'depart',feet[2],a2,{jump:32}),
      segment(.49,'climb',a2,b2,{ladder:l2}),
      segment(.57,'walk',b2,point(entry.x+25,entry.y)),
      segment(.65,'open',point(entry.x+25,entry.y),point(entry.x+25,entry.y)),
      segment(.73,'enter',point(entry.x+25,entry.y),entry),
      segment(.77,'tunnel',entry,exit),
      segment(.85,'exit',exit,point(exit.x-25,exit.y)),
      segment(1,'arrive',point(exit.x-25,exit.y),feet[3],{jump:26})
    ],props.slice(begin),'knock knock. oh, hi.');
    scenes[2].entryDoor=entryDoor; scenes[2].exitDoor=exitDoor;
    begin=props.length;
    // 04: the actual step-card borders are stepping stones, not a floating lane.
    const stones=[steps[0],steps[1],steps[3]].map(r=>point(edge(r.right-26),r.top));
    stones.forEach(p=>ledge(point(p.x-25,p.y),point(p.x+17,p.y)));
    scenes[3]=scene([
      segment(.22,'depart',feet[3],stones[0],{jump:40}),
      segment(.29,'perch',stones[0],stones[0]),
      segment(.48,'jump',stones[0],stones[1],{jump:small?65:95}),
      segment(.55,'perch',stones[1],stones[1]),
      segment(.75,'jump',stones[1],stones[2],{jump:small?75:110}),
      segment(.82,'crouch',stones[2],stones[2]),
      segment(1,'arrive',stones[2],feet[4],{jump:60})
    ],props.slice(begin),'one step. then another.');
    begin=props.length;
    // 05: FAQ height is live, including expanded answers; the ladder grows with it.
    x=edge(faq.right+10); top=rs[4].cy+cruise*.3;
    bottom=Math.max(top+70,Math.min(faq.bottom,rs[5].cy-cruise*.6));
    const l4=ladder(x,top,bottom), a4=point(x,top), b4=point(x,bottom);
    scenes[4]=scene([
      segment(.20,'depart',feet[4],a4,{jump:30}),
      segment(.70,'climb',a4,b4,{ladder:l4}),
      segment(.79,'crouch',b4,b4),
      segment(1,'arrive',b4,feet[5],{jump:90})
    ],props.slice(begin),'made it. time for a sit.');
    lastScene=-1; dirty=false;
  }
  // Analytic two-bone IK keeps elbows/knees articulated without a physics library.
  function bone(path, root, end, upper, lower, bend, shoe = false) {
    let dx=end.x-root.x,dy=end.y-root.y,dist=Math.hypot(dx,dy);
    const d=clamp(dist,.01,upper+lower-.01), ux=dx/(dist||1),uy=dy/(dist||1);
    const along=(upper*upper-lower*lower+d*d)/(2*d);
    const off=Math.sqrt(Math.max(0,upper*upper-along*along))*bend;
    const knee=point(root.x+ux*along-uy*off,root.y+uy*along+ux*off);
    let line=`M ${root.x.toFixed(2)} ${root.y.toFixed(2)} Q ${(knee.x+1).toFixed(2)} ${(knee.y-1).toFixed(2)} ${knee.x.toFixed(2)} ${knee.y.toFixed(2)} L ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
    if(shoe) line+=` q ${bend*8} -3 ${bend*12} 1 q ${-bend*3} 5 ${-bend*12} 2`;
    path.setAttribute('d',line);
  }
  function drawRig(mode, t, s, dir, travel, jumpHeight) {
    let bob=0, crouch=0, lean=0;
    const gait=travel/35, wave=Math.sin(gait*Math.PI*2);
    let lf=point(87,345),rf=point(112,345),lh=point(72,159),rh=point(132,159);
    if (mode==='walk' || mode==='enter' || mode==='exit') {
      bob=-Math.abs(wave)*3; lean=dir*3;
      lf=point(87+wave*26,345-Math.max(0,Math.cos(gait*Math.PI*2))*17);
      rf=point(112-wave*26,345-Math.max(0,-Math.cos(gait*Math.PI*2))*17);
      lh.x-=wave*22; rh.x+=wave*22;
    } else if(mode==='climb') {
      // Feet lock on one rung through stance, then lift to the next. Hands alternate.
      const l=s.ladder, footY=mix(s.a.y,s.b.y,t), scale=360/layout.cruise;
      const rungOffset=phase => {
        const cycle=(footY-l.top)/l.rung+phase, whole=Math.floor(cycle), frac=cycle-whole;
        const step=range(frac,.48,1);
        return ((whole-phase+step)*l.rung-(footY-l.top))*scale;
      };
      const v0=rungOffset(0),v1=rungOffset(.5);
      lf=point(78,337+v0); rf=point(122,337+v1);
      lh=point(65,82+v1*.7); rh=point(137,82+v0*.7);
      bob=9; crouch=13; lean=wave*.8;
    } else if(['jump','depart','arrive'].includes(mode)) {
      const air=Math.sin(Math.PI*t);
      crouch=12*(1-air); lean=dir*air*7;
      lf=point(85-dir*air*27,345-air*29); rf=point(114+dir*air*31,345-air*16);
      lh=point(65-dir*air*17,155-air*71); rh=point(134+dir*air*20,155-air*58);
    } else if(mode==='crouch' || mode==='perch') {
      crouch=(mode==='crouch'?18:9)*Math.sin(Math.PI*t);
      lh=point(65,162+crouch);rh=point(134,161+crouch);
    } else if(mode==='open') {
      rh=point(148,130); lean=5* Math.sin(Math.PI*t);
    }
    const hip=point(100,176+crouch+bob), shoulder=point(100+lean,59+bob+crouch*.6);
    const L=point(hip.x-13,hip.y),R=point(hip.x+13,hip.y);
    bone(limbs.legBack,R,rf,87,88,-1,true); bone(limbs.legFront,L,lf,87,88,1,true);
    bone(limbs.armBack,point(shoulder.x+12,shoulder.y),rh,57,56,-1);
    bone(limbs.armFront,point(shoulder.x-13,shoulder.y),lh,57,56,1);
    limbs.torso.setAttribute('d',`M ${shoulder.x} ${shoulder.y-16} L ${shoulder.x} ${shoulder.y} M ${shoulder.x-13} ${shoulder.y} Q ${shoulder.x} ${shoulder.y-3} ${shoulder.x+12} ${shoulder.y} L ${R.x} ${R.y} Q 100 ${hip.y-4} ${L.x} ${L.y} Z`);
    head.setAttribute('transform',`translate(${lean} ${bob+crouch*.6}) rotate(${lean*.3} 100 44)`);
    shadow.setAttribute('rx',String(29-jumpHeight*15)); shadow.style.opacity=String(.16-jumpHeight*.1);
  }
  function showProps(sceneIndex, t) {
    if (lastScene!==sceneIndex) {
      props.forEach(p=>p.el.style.display='none');
      if(sceneIndex>=0) scenes[sceneIndex].properties.forEach(p=>p.el.style.display='');
      lastScene=sceneIndex;
    }
    stage.style.transform=`translate3d(0,${-scrollY}px,0)`;
    if(sceneIndex<0)return;
    const sc=scenes[sceneIndex];
    sc.properties.filter(p=>p.door).forEach(p=>{
      p.el.style.width=`${p.size*.63}px`;p.el.style.height=`${p.size}px`;
      p.el.style.transform=`translate3d(${p.p.x-p.size*.315}px,${p.p.y-scrollY-p.size}px,0)`;
    });
    if(sceneIndex===2){
      const opening=range(t,.57,.65)*(1-range(t,.73,.78));
      const exiting=range(t,.73,.77)*(1-range(t,.85,.93));
      sc.entryDoor.el.style.setProperty('--open',`${-opening*108}deg`);
      sc.exitDoor.el.style.setProperty('--open',`${-exiting*108}deg`);
    }
    const visibility=range(t,0,.07)*(1-range(t,.93,1));
    sc.properties.forEach(p=>p.el.style.opacity=String(visibility));
  }
  function render(now) {
    frame=0;
    const enabled=allowed();
    if(enabled!==active){
      active=enabled;body.classList.toggle('journey-active',active);dirty=true;playhead=scrollY;lastTime=0;
    }
    if(!active || document.hidden){
      actor.style.display='none';shell.style.display='none';lastTime=0;return;
    }
    shell.style.display='';
    if(dirty)measure();
    const dt=lastTime?Math.min((now-lastTime)/1000,.05):1/60;lastTime=now;
    const gap=scrollY-playhead;
    // A page jump is a cut, not a frantic sprint through five off-screen scenes.
    if(Math.abs(gap)>innerHeight*1.8)playhead=scrollY;
    else playhead+=gap*(1-Math.exp(-dt/.145));
    if(Math.abs(scrollY-playhead)<.12)playhead=scrollY;
    const anchors=layout.anchors;
    let index=0;
    while(index<anchors.length-1 && playhead>=anchors[index+1])index++;
    const next=Math.min(index+1,slots.length-1);
    const raw=clamp((playhead-anchors[index])/Math.max(1,anchors[next]-anchors[index]));
    if(index===next || raw<=.10 || raw>=.90){
      setHome(raw>=.90?next:index);actor.style.display='none';showProps(-1,0);note.style.opacity='0';impact.style.opacity='0';
      actor.dataset.state='rest';
    }else{
      setHome(-1);
      const t=(raw-.10)/.80, sc=scenes[index];
      let start=0, seg=sc.parts[sc.parts.length-1];
      for(const s of sc.parts){seg=s;if(t<=s.until)break;start=s.until;}
      const u=clamp((t-start)/(seg.until-start)), e=ease(u);
      const isJump=['depart','arrive','jump'].includes(seg.mode);
      // Linear climb = planted feet; ease the starts/ends of all other actions.
      let p=lerp(seg.a,seg.b,seg.mode==='climb'?u:e);
      const arc=isJump?Math.sin(Math.PI*u):0;
      p.y-=arc*(seg.jump||0);
      const startSize=layout.sizes[index];
      const endSize=layout.sizes[next];
      let size=layout.cruise,oldAlpha=0,newAlpha=0;
      if(seg.mode==='depart'){size=mix(startSize,size,e);oldAlpha=1-range(u,.08,.72);}
      if(seg.mode==='arrive'){size=mix(size,endSize,e);newAlpha=range(u,.30,.95);}
      const rigAlpha=1-oldAlpha-newAlpha;
      let opacity=1;
      if(seg.mode==='enter')opacity=1-range(u,.28,1);
      if(seg.mode==='tunnel')opacity=0;
      if(seg.mode==='exit')opacity=range(u,0,.72);
      const direction=Math.sign(seg.b.x-seg.a.x)||1;
      const distance=Math.hypot(seg.b.x-seg.a.x,seg.b.y-seg.a.y);
      drawRig(seg.mode,u,seg,direction,distance*(seg.mode==='climb'?u:e),arc);
      layers.forEach((layer,i)=>{
        layer.style.opacity=String(i===index?oldAlpha:i===next?newAlpha:0);
        layer.style.transform=`rotate(${i===1?-6:0}deg)`;
      });
      rig.style.opacity=String(rigAlpha);
      actor.style.display='block';actor.style.opacity=String(opacity);
      actor.style.transform=`translate3d(${(p.x-size/2).toFixed(3)}px,${(p.y-scrollY-size).toFixed(3)}px,0) scale(${size/640})`;
      actor.dataset.from=String(index);actor.dataset.to=String(next);actor.dataset.state=seg.mode;
      actor.dataset.progress=t.toFixed(5);
      showProps(index,t);
      const squash=(seg.mode==='perch'||seg.mode==='crouch')?Math.sin(Math.PI*u)*.025:0;
      rig.style.transform=`scale(${1+squash},${1-squash})`;
      impact.setAttribute('transform',`translate(${p.x} ${p.y-scrollY})`);
      impact.style.opacity=String(isJump?range(u,.80,.90)*(1-range(u,.90,1)):0);
      shell.classList.toggle('journey-on-dark',index===3);
      note.textContent=sc.label;
      // Captions appear only in quiet moments, never on top of the token controls.
      const quiet=['perch','crouch'].includes(seg.mode) && !layout.small;
      note.style.opacity=quiet?String(Math.sin(Math.PI*u)):'0';
      note.style.transform=`translate3d(${clamp(p.x-170,16,layout.width-210)}px,${p.y-scrollY-42}px,0) rotate(-4deg)`;
    }
    if(playhead!==scrollY)queue();else lastTime=0;
  }
  function queue(){if(!frame)frame=requestAnimationFrame(render);}
  function invalidate(){dirty=true;queue();}
  addEventListener('scroll',queue,{passive:true});
  addEventListener('resize',invalidate,{passive:true});
  addEventListener('pageshow',invalidate);
  document.addEventListener('visibilitychange',()=>{lastTime=0;queue();});
  document.addEventListener('toggle',invalidate,true);
  reduced.addEventListener('change',invalidate);
  window.visualViewport?.addEventListener('resize',invalidate,{passive:true});
  new MutationObserver(()=>{
    const value=`${body.classList.contains('motion-off')}/${document.documentElement.classList.contains('booting')}`;
    if(value!==policy){policy=value;invalidate();}
  }).observe(body,{attributes:true,attributeFilter:['class']});
  new MutationObserver(invalidate).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  if('ResizeObserver' in window){
    const observer=new ResizeObserver(invalidate);
    [$('main'),...slots,$('.token-grid'),$('.faq-layout')].forEach(el=>observer.observe(el));
  }
  new MutationObserver(()=>{
    const ticket=++moodRequest, image=new Image();image.src=slots[1].src;
    image.decode().then(()=>{if(ticket===moodRequest){layers[1].src=image.src;invalidate();}}).catch(()=>{});
  }).observe(slots[1],{attributes:true,attributeFilter:['src']});
  const headAsset=new Image();headAsset.src='assets/journey-head.webp';
  const originals=[...slots[0].querySelectorAll('image')].map(el=>{const image=new Image();image.src=el.getAttribute('href');return image.decode();});
  Promise.all([...layers.slice(1).map(im=>im.decode()),headAsset.decode(),...originals])
    .then(()=>document.fonts?.ready).then(()=>{ready=true;invalidate();})
    .catch(()=>{shell.remove();}); // Leave all six originals visible if any rig asset fails.
})();
