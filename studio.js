/* A local-only doodle desk. No upload, wallet, library, or idle render loop. */
(() => {
 'use strict';
 const section = document.querySelector('#play');
 const canvas = section?.querySelector('canvas');
 const ctx = canvas?.getContext('2d');
 if (!ctx) return;
 const $ = s => section.querySelector(s);
 const status = $('#studio-status');
 const colors = {blue:'#03afd5', paper:'#f4f0df', yellow:'#f6ee69'};
 const images = {};
 const prompts = ['Give EGOR a tiny planet to stand on.', 'Draw the least practical chair in the world.', 'Make a little crowd. Everyone belongs.', 'A blue Monday, but make it a good one.', 'Invent a hat with absolutely no purpose.', 'Give a very small idea a very big frame.', 'Build a constellation of little weird things.', 'Draw your mood using only three lines.', 'Make room for a friend.', 'What does a day off look like?'];
 let promptIndex = 0, tool = 'seated', background = 'blue';
 let history = [{type:'stamp', tool:'seated', x:.5, y:.54, size:.64, angle:0}];
 let redo = [], stroke = null, pointer = null, tap = null, frame = 0, resetTimer = 0, popTimer = 0;
 let keyboard = false, cursor = {x:.5,y:.5}, ready = false;
 const limit = 120;
 function announce(message) { status.textContent = message; }
 function queue() { if (!frame) frame = requestAnimationFrame(() => {frame=0;render(ctx,canvas.width,canvas.height);}); }
 function drawItem(c,item,w,h) {
  if(item.type==='line') {
   c.strokeStyle='#091b20';c.fillStyle='#091b20';c.lineWidth=w*.005;c.lineCap='round';c.lineJoin='round';
   if(item.points.length===1){const p=item.points[0];c.beginPath();c.arc(p.x*w,p.y*h,c.lineWidth/2,0,Math.PI*2);c.fill();return;}
   c.beginPath();item.points.forEach((p,i)=>i?c.lineTo(p.x*w,p.y*h):c.moveTo(p.x*w,p.y*h));c.stroke();return;
  }
  const size=item.size*w;
  c.save();c.translate(item.x*w,item.y*h);c.rotate(item.angle);
  if(item.tool==='star') {
   c.strokeStyle='#091b20';c.lineWidth=w*.006;c.lineCap='round';
   for(let i=0;i<4;i++){c.rotate(Math.PI/4);c.beginPath();c.moveTo(-size*.36,0);c.lineTo(size*.36,0);c.stroke();}
  } else if(images[item.tool]) c.drawImage(images[item.tool],-size/2,-size/2,size,size);
  c.restore();
 }
 function render(c,w,h,guide=true) {
  c.clearRect(0,0,w,h);c.fillStyle=colors[background];c.fillRect(0,0,w,h);
  history.forEach(item=>drawItem(c,item,w,h));
  if(stroke) drawItem(c,stroke,w,h);
  if(guide && keyboard && document.activeElement===canvas){
   c.save();c.strokeStyle='#091b20';c.lineWidth=2;c.setLineDash([4,4]);c.beginPath();c.arc(cursor.x*w,cursor.y*h,12,0,Math.PI*2);c.stroke();c.restore();
  }
 }
 function resize() {
  const r=canvas.getBoundingClientRect(), ratio=Math.min(devicePixelRatio||1,2,1400/Math.max(1,r.width));
  canvas.width=Math.max(1,Math.round(r.width*ratio));canvas.height=Math.max(1,Math.round(r.height*ratio));queue();
 }
 function controls() {
  $('#studio-undo').disabled=!history.length;$('#studio-redo').disabled=!redo.length;
  $('#studio-count').textContent=`${String(history.length).padStart(2,'0')} / ${limit} marks`;
 }
 function disarmReset(){clearTimeout(resetTimer);resetTimer=0;$('#studio-clear').textContent='Clear';}
 function add(item){
  if(history.length>=limit){announce('The page is full. Undo a mark, or save and start fresh.');return false;}
  history.push(item);redo=[];disarmReset();controls();queue();return true;
 }
 function pop(){
  const board=$('.studio-board');board.classList.remove('studio-pop');
  clearTimeout(popTimer);requestAnimationFrame(()=>board.classList.add('studio-pop'));
  popTimer=setTimeout(()=>board.classList.remove('studio-pop'),360);
 }
 function stamp(x,y){
  if(tool==='pen'){announce('Draw on the page with your finger or pointer. Choose a stamp to place one.');return;}
  if(!ready){announce('The little characters are still getting ready.');return;}
  if(!images[tool] && tool!=='star'){announce('This character could not load. Try another stamp.');return;}
  if(add({type:'stamp',tool,x,y,size:tool==='star'?.13:.38,angle:(Math.random()-.5)*.24})) {announce(tool==='star'?'A little spark.':'A little more character.');pop();}
 }
 function point(event){const r=canvas.getBoundingClientRect();return {x:Math.max(0,Math.min(1,(event.clientX-r.left)/r.width)),y:Math.max(0,Math.min(1,(event.clientY-r.top)/r.height))};}
 function finish(cancel=false){
  tap=null;
  if(pointer===null)return;
  const id=pointer;pointer=null;
  if(canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);
  const line=stroke;stroke=null;
  if(line&&!cancel)add(line);
  queue();
 }
 canvas.addEventListener('pointerdown',event=>{
  if(event.button!==0||pointer!==null||!ready)return;
  keyboard=false;cursor=point(event);
  if(tool!=='pen'){
   pointer=event.pointerId;tap={x:event.clientX,y:event.clientY};canvas.setPointerCapture(pointer);return;
  }
  event.preventDefault();canvas.focus({preventScroll:true});
  if(history.length>=limit){announce('The page is full. Save it, or undo a mark.');return;}
  pointer=event.pointerId;canvas.setPointerCapture(pointer);stroke={type:'line',points:[cursor]};queue();
 });
 canvas.addEventListener('pointermove',event=>{
  if(event.pointerId!==pointer)return;
  if(tap&&Math.hypot(event.clientX-tap.x,event.clientY-tap.y)>10)tap=null;
  if(!stroke)return;
  const p=point(event),last=stroke.points[stroke.points.length-1];
  if(Math.hypot(p.x-last.x,p.y-last.y)<.002)return;
  // Keep a long scribble bounded without dropping its endpoint.
  if(stroke.points.length>=1200)stroke.points=stroke.points.filter((_,i)=>i%2===0);
  stroke.points.push(p);queue();
 });
 canvas.addEventListener('pointerup',event=>{
  if(event.pointerId!==pointer)return;
  const place=!!tap;finish();
  if(place){canvas.focus({preventScroll:true});stamp(cursor.x,cursor.y);}
 });
 canvas.addEventListener('pointercancel',()=>finish(true));
 canvas.addEventListener('lostpointercapture',()=>finish(true));
 canvas.addEventListener('blur',()=>{finish();keyboard=false;queue();});
 canvas.addEventListener('keydown',event=>{
  if((event.ctrlKey||event.metaKey)&&!event.altKey&&['z','y'].includes(event.key.toLowerCase())){
   event.preventDefault();
   $(event.key.toLowerCase()==='y'||event.shiftKey?'#studio-redo':'#studio-undo').click();
   return;
  }
  const directions={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
  if(directions[event.key]){
   event.preventDefault();keyboard=true;const d=directions[event.key],step=event.shiftKey?.1:.025;
   cursor.x=Math.max(.05,Math.min(.95,cursor.x+d[0]*step));cursor.y=Math.max(.05,Math.min(.95,cursor.y+d[1]*step));queue();
  }else if(event.key==='Enter'||event.key===' '){event.preventDefault();stamp(cursor.x,cursor.y);}
 });
 section.querySelectorAll('[data-studio-tool]').forEach(button=>button.addEventListener('click',()=>{
  finish();tool=button.dataset.studioTool;canvas.dataset.drawing=String(tool==='pen');
  section.querySelectorAll('[data-studio-tool]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  announce(tool==='pen'?'Draw directly on the page. Scroll outside it.':'Tap the page to place a stamp, or use Place stamp.');
 }));
 section.querySelectorAll('[data-studio-bg]').forEach(button=>button.addEventListener('click',()=>{
  background=button.dataset.studioBg;
  section.querySelectorAll('[data-studio-bg]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  queue();announce(`${background[0].toUpperCase()+background.slice(1)} paper.`);
 }));
 $('#studio-place').addEventListener('click',()=>stamp(.25+Math.random()*.5,.25+Math.random()*.5));
 $('#studio-undo').addEventListener('click',()=>{finish();if(history.length)redo.push(history.pop());disarmReset();controls();queue();announce('One mark undone.');});
 $('#studio-redo').addEventListener('click',()=>{if(redo.length)history.push(redo.pop());disarmReset();controls();queue();announce('One mark restored.');});
 $('#studio-clear').addEventListener('click',()=>{
  if(!resetTimer){announce('Clear this page? Press Clear again to confirm. Save first to keep it.');$('#studio-clear').textContent='Clear again?';resetTimer=setTimeout(disarmReset,4000);return;}
  finish(true);history=[];redo=[];disarmReset();controls();queue();announce('A fresh page. A new little possibility.');
 });
 $('#studio-prompt').addEventListener('click',()=>{promptIndex=(promptIndex+1+Math.floor(Math.random()*(prompts.length-1)))%prompts.length;$('#studio-idea').textContent=prompts[promptIndex];});
 $('#studio-surprise').addEventListener('click',()=>{
  const choices=Object.keys(images);if(!ready||!choices.length)return;
  const item={type:'stamp',tool:choices[Math.floor(Math.random()*choices.length)],x:.2+Math.random()*.6,y:.28+Math.random()*.48,size:.28+Math.random()*.18,angle:(Math.random()-.5)*.6};
  if(add(item)){announce('An unexpected guest. Keep going.');pop();}
 });
 $('#studio-save').addEventListener('click',()=>{
  finish();const output=document.createElement('canvas');output.width=1600;output.height=1200;
  render(output.getContext('2d'),1600,1200,false);
  output.toBlob(blob=>{
   if(!blob){announce('Could not save this time. Please try again.');return;}
   const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='my-little-egor-world.png';document.body.append(a);a.click();a.remove();
   setTimeout(()=>URL.revokeObjectURL(url),60000);announce('PNG prepared. Check your downloads or your browser’s save options.');
  },'image/png');
 });
 const motion=$('#studio-motion'),mainMotion=document.querySelector('#motion-toggle');
 function syncMotion(){const paused=document.body.classList.contains('motion-off');motion.textContent=paused?'▷ Motion paused':'Ⅱ Pause page motion';motion.setAttribute('aria-pressed',String(paused));}
 motion.addEventListener('click',()=>mainMotion.click());new MutationObserver(syncMotion).observe(document.body,{attributes:true,attributeFilter:['class']});syncMotion();
 document.addEventListener('visibilitychange',()=>{if(document.hidden)finish(true);});
 if('ResizeObserver' in window)new ResizeObserver(resize).observe(canvas.parentElement);else addEventListener('resize',resize,{passive:true});
 controls();resize();
 // Lazy-load the extra poses; the rest of the site never waits for the studio.
 function load(){
  if(section.dataset.loading)return;section.dataset.loading='true';
  Promise.all(['seated','confident','guide','curious'].map(name=>new Promise(resolve=>{
   const img=new Image();
   // A stalled image must not lock the entire desk. Ignore late completions.
   let settled=false;
   const done=loaded=>{
    if(settled)return;settled=true;clearTimeout(timer);
    img.onload=img.onerror=null;
    if(loaded)images[name]=img;
    resolve();
   };
   const timer=setTimeout(()=>done(false),8000);
   img.onload=()=>done(true);img.onerror=()=>done(false);img.src=`assets/egor-${name}.webp`;
  }))).then(()=>{
   ready=true;section.classList.add('studio-ready');section.querySelectorAll('[data-studio-controls]').forEach(el=>el.hidden=false);
   section.querySelectorAll('[data-studio-tool]').forEach(b=>{if(!['star','pen'].includes(b.dataset.studioTool)&&!images[b.dataset.studioTool])b.disabled=true;});
   if(!images.seated){
    history=[];controls();$('[data-studio-tool="star"]').click();
   }
   $('#studio-surprise').disabled=!Object.keys(images).length;
   announce(Object.keys(images).length===4?'Your little world. Nothing is uploaded.':'Some characters could not load. You can still draw and use available stamps. Nothing is uploaded.');queue();
  });
 }
 if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){observer.disconnect();load();}},{rootMargin:'500px'});observer.observe(section);}else load();
})();
