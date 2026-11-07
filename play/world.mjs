import { buildNeighborhood } from './neighborhood.mjs';
import { buildUnfinishedStreet } from './chapter.mjs';
const $=id=>document.getElementById(id);
let pc,app;
try {
 pc=await import('./vendor/playcanvas.mjs');
 app=new pc.Application($('world'),{graphicsDeviceOptions:{alpha:false,antialias:true,powerPreference:'low-power'}});
} catch(error) { $('load').textContent='This doorway needs a WebGL-capable browser. Please return to EGOR World or try another browser.'; console.error(error); }
if(app) {try{init();}catch(error){$('load').textContent='The neighborhood could not start. Please reload or return to the room.';console.error(error);}}
function init(){
app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);app.setCanvasResolution(pc.RESOLUTION_AUTO);app.graphicsDevice.maxPixelRatio=Math.min(devicePixelRatio,1.6);
app.scene.ambientLight=new pc.Color(.52,.63,.71);app.scene.fog.type='linear';app.scene.fog.color=new pc.Color(.38,.53,.65);app.scene.fog.start=20;app.scene.fog.end=85;
const colors={blue:'#168ca9',ink:'#15333d',ground:'#c4c6af',path:'#eadfbe',cream:'#eddfbb',dark:'#213c4b',leaf:'#558e84',gold:'#efc877'};
function mat(hex,emission=0){let m=new pc.StandardMaterial();m.diffuse=new pc.Color().fromString(hex);m.emissive=m.diffuse.clone().mulScalar(emission);m.shininess=0;m.update();return m;}
// Procedural paper grain, generated locally; no third-party artwork is used.
const paper=document.createElement('canvas');paper.width=paper.height=128;const ctx=paper.getContext('2d'),pixels=ctx.createImageData(128,128);let seed=37;for(let i=0;i<pixels.data.length;i+=4){seed=(seed*1664525+1013904223)>>>0;const tone=247+(seed%9);pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=tone;pixels.data[i+3]=255;}ctx.putImageData(pixels,0,0);const grain=new pc.Texture(app.graphicsDevice,{width:128,height:128,mipmaps:true});grain.setSource(paper);
const materials=Object.fromEntries(Object.entries(colors).map(([k,v])=>{const m=mat(v);m.diffuseMap=grain;m.diffuseMapTiling.set(3,3);m.update();return [k,m];}));
function shape(type,x,y,z,sx,sy,sz,material,parent=app.root){const e=new pc.Entity();e.addComponent('render',{type,material:typeof material==='string'?materials[material]:material,castShadows:true,receiveShadows:true});e.setLocalPosition(x,y,z);e.setLocalScale(sx,sy,sz);parent.addChild(e);return e;}
const camera=new pc.Entity();camera.addComponent('camera',{clearColor:new pc.Color(.38,.53,.65),fov:68,nearClip:.08,farClip:100});app.root.addChild(camera);
const sun=new pc.Entity();sun.addComponent('light',{type:'directional',color:new pc.Color(1,.88,.68),intensity:1.6,castShadows:true,shadowResolution:1024,shadowDistance:35,normalOffsetBias:.07});sun.setEulerAngles(48,-30,0);app.root.addChild(sun);
shape('box',0,-.4,0,44,.8,44,'ground');shape('box',0,.015,0,5,.08,35,'path');shape('box',0,.02,0,32,.08,4,'path');shape('cylinder',0,.08,0,9,.15,9,'path');
const obstacles=[];
function house(x,z,w,d,tone){shape('box',x,1.65,z,w,3.3,d,tone);shape('box',x,3.4,z,w+.4,.35,d+.4,'ink');shape('box',x,.9,z+d/2+.03,.8,1.8,.12,'ink');for(let side of [-1,1])shape('box',x+side*w*.29,1.9,z+d/2+.08,.65,.85,.12,mat('#edce8a',.35));obstacles.push({x,z,w:w/2+.4,d:d/2+.4});}
house(-8,-7,5,4,'cream');house(7,-8,4,5,'blue');house(-9,7,5,4,'blue');house(9,7,4,4,'cream');
// Home threshold: simple original geometry, no third-party character artwork.
for(const x of [-1.25,1.25])shape('box',x,1.9,15,.2,3.8,.35,'ink');shape('box',0,3.8,15,2.7,.2,.35,'ink');shape('box',0,.025,15,2.7,.05,1.2,'gold');
// A tall blue doorway, an open threshold rather than an opaque wall.
const door=shape('box',-1.95,1.8,15.7,1.5,3.5,.1,'blue');door.setEulerAngles(0,65,0);
// Ink seams and slightly irregular cornices make the village less factory-perfect.
for(const o of obstacles){for(const side of [-1,1]){shape('box',o.x+side*(o.w-.4),1.7,o.z+o.d-.38,.045,3.4,.06,'ink');}for(let j=0;j<3;j++)shape('box',o.x,2.9+j*.11,o.z+o.d-.34,(o.w-.4)*2+.15,.035,.08,'ink');}
// The thread starts at your feet and leads into the central courtyard.
for(let i=0;i<25;i++)shape('box',Math.sin(i*.32)*.14,.075,13-i*.4,.055,.025,.3,'blue');
// Original oversized paper-pencil sculpture: a landmark, not a character replica.
shape('cylinder',0,1.9,-10,.28,3.8,.28,'blue');shape('cone',0,4.1,-10,.28,.6,.28,'ink');shape('cylinder',0,.17,-10,2.4,.34,2.4,'cream');
for(let i=0;i<9;i++){const e=shape('box',-3+i*.75,3.7+Math.sin(i/8*Math.PI)*.5,-2,.3,.42,.035,i%2?'blue':'cream');e.setEulerAngles(0,0,(i%3-1)*8);}
for(const x of [-3,3])shape('cylinder',x,1.9,-2,.07,3.8,.07,'ink');
for(let i=0;i<32;i++){let a=i*2.399,r=16+(i%4)*1.5,x=Math.cos(a)*r,z=Math.sin(a)*r;shape('cylinder',x,.8,z,.22,1.6,.22,'dark');shape('sphere',x,2,z,1.8,2.5,1.8,'leaf');}
for(let i=0;i<55;i++){let x=Math.sin(i*7.3)*19,z=Math.cos(i*4.7)*19;if(Math.abs(x)<3||Math.abs(z)<3)continue;shape('sphere',x,.08,z,.12,.16,.12,i%3?'cream':'blue');}
// Benches and low planters.
for(const x of [-4,4]){shape('box',x,.65,3,1.8,.16,.6,'cream');for(const dx of [-.65,.65])shape('box',x+dx,.3,3,.12,.6,.45,'ink');}
const chapter=buildUnfinishedStreet({pc,app,shape,mat,obstacles});
const neighborhood=buildNeighborhood({pc,app,shape,mat,obstacles});
const saveKey='egor-neighborhood-0441';
let saved={};try{const raw=JSON.parse(localStorage.getItem(saveKey)||'{}');if(raw&&typeof raw==='object'&&!Array.isArray(raw))saved=raw;}catch{}
const activities=neighborhood.activities;
for(const a of activities){a.stage=Number.isFinite(saved[a.id])?Math.max(0,Math.min(a.steps.length,Math.floor(saved[a.id]))):0;}
const stages=()=>Object.fromEntries(activities.map(a=>[a.id,a.stage]));
const state=neighborhood.normalize(saved,stages());
// Discovery IDs are canonical; reconcile token visibility with the journal.
for(const a of activities){if(a.id.startsWith('find-'))a.stage=Number(state.found.includes(a.id.slice(5)));a.apply(a.stage);}
state.built.forEach(id=>neighborhood.build(id));neighborhood.setPalette(state.palette);
let homeSeen=saved.homeSeen===true,storageOK=true;
function saveProgress(){try{localStorage.setItem(saveKey,JSON.stringify({...stages(),...Object.fromEntries(spots.map((s,i)=>['light'+i,!!s.lit])),...state,homeSeen,version:1}));storageOK=true;}catch{storageOK=false;caption('Storage unavailable. Progress will last for this visit.');}}
const player=new pc.Entity('temporary-blue-traveler');app.root.addChild(player);player.setPosition(0,0,11.5);
shape('capsule',0,.72,0,.6,.95,.5,'blue',player);shape('sphere',0,1.38,0,.72,.65,.65,'blue',player);shape('sphere',-.14,1.43,-.29,.09,.07,.06,'ink',player);shape('sphere',.14,1.43,-.29,.09,.07,.06,'ink',player);const feet=[shape('box',-.17,.17,0,.23,.25,.45,'ink',player),shape('box',.17,.17,0,.23,.25,.45,'ink',player)];
// A first-person guest: keep the old traveler only as an invisible position anchor.
player.children.forEach(e=>e.enabled=false);
const spots=[{x:-5,z:0,name:'A little care',action:'Let it grow',line:'Not everything grows on its own.'},{x:4,z:-4,name:'Someone is home',action:'Leave a light on',line:'A light is a small way of saying: come in.'},{x:7,z:3,name:'Room for one more',action:'Set a second cup',line:'You do not have to fill the silence.'}];
for(const s of spots){shape('cylinder',s.x,.9,s.z,.15,1.8,.15,'ink');s.glow=mat('#8aa6ac',.1);s.lamp=shape('sphere',s.x,2,s.z,.48,.62,.48,s.glow);s.halo=shape('cylinder',s.x,.1,s.z,1.5,.06,1.5,'blue');}
const motes=Array.from({length:22},(_,i)=>({entity:shape('sphere',0,0,0,.045,.045,.045,mat('#f2d79a',.6)),phase:i*2.399}));
const ripples=[];
function ripple(s){const e=shape('cylinder',s.x,.12,s.z,1,.025,1,mat('#efc877',.3));ripples.push({e,age:0});}
let started=false,paused=false,done=false,count=0,time=0,last=null,keys=new Set(),near=null,captionTimer,context,sound=false;
$('reduced').checked=matchMedia('(prefers-reduced-motion: reduce)').matches;
function caption(text){$('caption').textContent=text;clearTimeout(captionTimer);captionTimer=setTimeout(()=>$('caption').textContent='',6500);}
function chime(){if(!sound)return;context??=new (window.AudioContext||window.webkitAudioContext)();context.resume();[0,4,7].forEach((n,i)=>{let o=context.createOscillator(),g=context.createGain(),t=context.currentTime+i*.12;o.type='sine';o.frequency.value=330*Math.pow(2,n/12);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.05,t+.03);g.gain.exponentialRampToValueAtTime(.001,t+1);o.connect(g);g.connect(context.destination);o.start(t);o.stop(t+1.1);});}
const threads=[];
function thread(a,b){const from=new pc.Vec3(a.x,.18,a.z),to=new pc.Vec3(b.x,.18,b.z),mid=from.clone().add(to).mulScalar(.5),e=shape('box',mid.x,mid.y,mid.z,.055,.055,from.distance(to),mat('#83e0ed',.7));e.lookAt(to);threads.push(e);}
function connect(){if(!started||paused||!near)return;if(near.steps){if(near.stage>=near.steps.length)return;near.stage++;near.apply(near.stage);if(near.id.startsWith('find-'))state.found.push(near.id.slice(5));neighborhood.setPalette(state.palette);caption(near.stage===near.steps.length?near.finish:`${near.name}: ${near.steps[near.stage]}. Press E when ready.`);saveProgress();chime();return;}if(near.lit)return;const s=near;s.lit=true;chapter.activate(spots.indexOf(s));count++;s.glow.diffuse=new pc.Color().fromString('#ffda82');s.glow.emissive=new pc.Color(.9,.58,.2);s.glow.update();ripple(s);s.halo.render.material=materials.gold;thread(last||{x:0,z:14},s);last=s;chime();caption(s.line);saveProgress();updateLights();}
function updateLights(){
 $('progress').setAttribute('aria-label',`${count} of 3 lights connected`);$('progress').textContent='● '.repeat(count)+'○ '.repeat(3-count);
 $('hint').textContent=`${count} of 3 lights connected. Explore north; J opens your notebook.`;
 if(count===3){chapter.complete();done=!homeSeen;$('objective').textContent=homeSeen?'A neighborhood to make your own.':'Bring the thread home.';$('hint').textContent=homeSeen?'Head north for five places, discoveries and projects.':'Return to the warm doorway where you began.';}
}
$('connect').onclick=connect;
// Hydration is deliberately side-effect free: no save, sounds, captions or unlock replay.
for(let i=0;i<spots.length;i++)if(saved['light'+i]===true){const s=spots[i];s.lit=true;count++;chapter.activate(i);s.glow.diffuse=new pc.Color().fromString('#ffda82');s.glow.emissive=new pc.Color(.9,.58,.2);s.glow.update();s.halo.render.material=materials.gold;thread(last||{x:0,z:14},s);last=s;}
if(count<3)homeSeen=false;else if(homeSeen)thread(last,{x:0,z:14});updateLights();
const journal=$('journal');let destination=null,journalWasPaused=false;
function renderJournal(){
 $('journal-summary').textContent=`${state.found.length}/9 discoveries · ${state.built.length}/8 projects · ${activities.filter(a=>!a.id.startsWith('find-')&&a.stage===a.steps.length).length}/5 places completed`;
 $('save-status').textContent=storageOK?'Saved on this browser only. Clearing browser data erases progress.':'Storage unavailable — progress lasts only for this visit.';
 $('journal-places').innerHTML=activities.map((a,i)=>`<button data-destination="${i}">${a.name}<small>${a.stage}/${a.steps.length} · ${a.stage===a.steps.length?'Complete':'Follow this place'}</small></button>`).join('');
 $('journal-projects').innerHTML=neighborhood.commissions.map(c=>{const needs=neighborhood.missing(c,state,stages()),built=state.built.includes(c.id);return `<article><h3>${c.title}</h3><p>${c.reward}</p><p>${built?'Completed':needs.length?needs.join(' · '):'Ready to build'}</p><button data-build="${c.id}" ${built||needs.length?'disabled':''}>${built?'Built':'Build project'}</button></article>`;}).join('');
 for(const button of journal.querySelectorAll('[data-palette]'))button.setAttribute('aria-pressed',String(button.dataset.palette===state.palette));
}
function closeJournal(){journal.close();setPaused(journalWasPaused);$('world').focus();}
journal.onclick=e=>{const button=e.target.closest('button');if(!button)return;
 if(button.dataset.build){const c=neighborhood.commissions.find(c=>c.id===button.dataset.build);if(!c||state.built.includes(c.id)||neighborhood.missing(c,state,stages()).length)return;state.built.push(c.id);neighborhood.build(c.id);saveProgress();renderJournal();$('journal-summary').focus();return;}
 if(button.dataset.palette){state.palette=button.dataset.palette;neighborhood.setPalette(state.palette);saveProgress();renderJournal();return;}
 if(button.dataset.destination!==undefined)destination=activities[Number(button.dataset.destination)];
 else if(button.id==='safe-home'){player.setPosition(0,0,11.5);yaw=pitch=0;destination=null;}
 else if(button.id!=='close-journal')return;
 closeJournal();
};
journal.addEventListener('cancel',e=>{e.preventDefault();closeJournal();});
function toggleJournal(){if(!started||!$('ending').hidden)return;if(journal.open){closeJournal();return;}journalWasPaused=paused;setPaused(true);renderJournal();journal.showModal();$('close-journal').focus();}
$('journal-button').onclick=toggleJournal;
function setPaused(value){if(!started||!$('ending').hidden)return;paused=value;clearInput();$('pause').textContent=paused?'Resume':'Pause';document.body.classList.toggle('paused',paused);if(paused){$('connect').hidden=true;caption('Take your time. The world can wait.');}}
$('pause').onclick=()=>setPaused(!paused);
let entrance=-1,yaw=0,pitch=0,ax=0,az=0,vx=0,vz=0,running=false;
function clearInput(){keys.clear();ax=az=vx=vz=0;stickPointer=null;lookPointer=null;$('thumb').style.transform='translate(-50%,-50%)';}
function finishEntrance(){entrance=-1;started=true;player.setPosition(0,0,11.5);$('arrival').hidden=true;$('skip').hidden=true;for(const id of ['hud','guide','pause','touch','look','reticle','run'])$(id).hidden=false;caption('Follow the ink. Leave something kind behind.');$('world').focus();}
$('skip').onclick=finishEntrance;
$('enter').onclick=()=>{$('entry').hidden=true;if($('reduced').checked){finishEntrance();return;}entrance=0;$('arrival').hidden=false;$('skip').hidden=false;};
$('stay').onclick=()=>{$('ending').close();$('ending').hidden=true;setPaused(false);$('world').focus();};
$('ending').addEventListener('cancel',e=>{e.preventDefault();$('stay').click();});
$('restart').onclick=()=>{if(!confirm('Erase saved progress and start again?'))return;try{localStorage.removeItem(saveKey);}catch{}location.reload();};
$('sound').onclick=()=>{sound=!sound;$('sound').textContent=sound?'Sound on':'Sound off';$('sound').setAttribute('aria-pressed',sound);if(sound)chime();};
$('copy').onclick=async()=>{try{await navigator.clipboard.writeText('Three windows. One thread. A little further into EGOR’s world.');$('copy-status').textContent='Memory copied.';}catch{$('copy-status').textContent='Three windows. One thread. A little further into EGOR’s world.';}};
const movement=['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','Shift'];
const controlKey=e=>({KeyW:'w',KeyA:'a',KeyS:'s',KeyD:'d',KeyE:'e',ShiftLeft:'Shift',ShiftRight:'Shift'}[e.code]||e.key);
window.addEventListener('keydown',e=>{if(!started||!$('ending').hidden)return;if(e.target?.matches?.('input,textarea,select,[contenteditable="true"]'))return;const k=controlKey(e);if(e.code==='KeyJ'&&!e.repeat){e.preventDefault();toggleJournal();return;}if(e.key==='Escape'){if(journal.open)return;if(!e.repeat)setPaused(!paused);return;}if(paused)return;if(movement.includes(k)){e.preventDefault();keys.add(k);}if((k==='e'||e.code==='Space')&&!e.repeat&& (k==='e'||!['BUTTON','INPUT','SUMMARY','A'].includes(document.activeElement.tagName))){e.preventDefault();connect();}});
window.addEventListener('keyup',e=>keys.delete(controlKey(e)));
window.addEventListener('blur',()=>{keys.clear();if(started)setPaused(true);});document.addEventListener('visibilitychange',()=>{if(document.hidden&&started)setPaused(true);});
let stickPointer=null,lookPointer=null,lx=0,ly=0;
const stick=$('stick');
function moveStick(e){const r=stick.getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,len=Math.hypot(dx,dy),radius=r.width*.34,scale=Math.min(1,radius/(len||1));ax=dx*scale/radius;az=dy*scale/radius;$('thumb').style.transform=`translate(calc(-50% + ${dx*scale}px),calc(-50% + ${dy*scale}px))`;}
stick.onpointerdown=e=>{if(paused||!started||stickPointer!==null)return;e.preventDefault();stickPointer=e.pointerId;stick.setPointerCapture(e.pointerId);moveStick(e);};
stick.onpointermove=e=>{if(e.pointerId===stickPointer)moveStick(e);};
stick.onpointerup=stick.onpointercancel=stick.onlostpointercapture=e=>{if(e.pointerId!==stickPointer)return;stickPointer=null;ax=az=0;$('thumb').style.transform='translate(-50%,-50%)';};
for(const area of [$('look'),$('world')]){area.onpointerdown=e=>{if(!started||paused||lookPointer!==null)return;lookPointer=e.pointerId;lx=e.clientX;ly=e.clientY;area.setPointerCapture(e.pointerId);};area.onpointermove=e=>{if(e.pointerId!==lookPointer||paused)return;const sensitivity=Number($('sensitivity').value)*.18;yaw-=(e.clientX-lx)*sensitivity;pitch=Math.max(-65,Math.min(65,pitch-(e.clientY-ly)*sensitivity));lx=e.clientX;ly=e.clientY;};area.onpointerup=area.onpointercancel=area.onlostpointercapture=e=>{if(e.pointerId===lookPointer)lookPointer=null;};}
$('run').onclick=()=>{running=!running;$('run').setAttribute('aria-pressed',String(running));};
window.addEventListener('resize',clearInput);
camera.setPosition(0,1.65,15.8);camera.setEulerAngles(0,0,0);
app.on('update',dt=>{dt=Math.min(dt,.04);time+=dt;const p=player.getPosition();if(started&&!paused){let dx=Number(keys.has('d'))-Number(keys.has('a'))+ax,dz=Number(keys.has('s')||keys.has('ArrowDown'))-Number(keys.has('w')||keys.has('ArrowUp'))+az;yaw+=(Number(keys.has('ArrowLeft'))-Number(keys.has('ArrowRight')))*dt*90;const len=Math.max(1,Math.hypot(dx,dz)),speed=(keys.has('Shift')||running?4.6:2.7),r=yaw*Math.PI/180,tx=(dx*Math.cos(r)+dz*Math.sin(r))/len*speed,tz=(-dx*Math.sin(r)+dz*Math.cos(r))/len*speed,blend=1-Math.exp(-dt*12);vx+=(tx-vx)*blend;vz+=(tz-vz)*blend;const clear=(x,z)=>Math.abs(x)<39&&z>-58&&z<19&&!obstacles.some(o=>Math.abs(x-o.x)<o.w&&Math.abs(z-o.z)<o.d);let x=p.x,z=p.z;if(clear(x+vx*dt,z))x+=vx*dt;else vx=0;if(clear(x,z+vz*dt))z+=vz*dt;else vz=0;player.setPosition(x,0,z);
near=[...spots.filter(s=>!s.lit),...activities.filter(a=>a.stage<a.steps.length)].sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z))[0];if(near&&Math.hypot(near.x-p.x,near.z-p.z)>2)near=null;$('connect').hidden=!near;if(near)$('connect').textContent=`${near.steps?near.steps[near.stage]:near.action} · E`;
$('place').textContent=near?near.name:Math.hypot(p.x,p.z-14)<3?'The way home':p.z<-3?'Window Lane':p.x<-3?'The little garden':'Blue-thread Square';
if(destination){const dx=destination.x-p.x,dz=destination.z-p.z,angle=(Math.atan2(-dx,-dz)*180/Math.PI-yaw+540)%360-180;$('place').textContent=`${destination.name} · ${Math.round(Math.hypot(dx,dz))} m · ${Math.abs(angle)<25?'Ahead':angle>0?'Turn left':'Turn right'}`;}else if(p.z<-18){$('place').textContent='The living neighborhood · J to choose a place';}
if(done&&Math.hypot(p.x,p.z-13)<2){done=false;homeSeen=true;saveProgress();thread(last,{x:0,z:14});setPaused(true);$('ending').hidden=false;$('ending').showModal();$('stay').focus();$('objective').textContent='A little more like home.';$('hint').textContent='Head north. Five places and eight linked projects await.';chime();}}
if(!paused){for(const m of motes){const a=m.phase+time*.08;m.entity.setPosition(Math.sin(a)*12,1.2+Math.sin(a*2+time*.3)*.7,Math.cos(m.phase+time*.05)*12);m.entity.enabled=!$('reduced').checked;}for(let i=ripples.length-1;i>=0;i--){const r=ripples[i];r.age+=dt;r.e.setLocalScale(1+r.age*3,.025,1+r.age*3);if(r.age>.65){r.e.destroy();ripples.splice(i,1);}}}
app.scene.ambientLight.set(.52+count*.035,.63+count*.018,.71);
if(entrance>=0&&!document.hidden){entrance+=dt;const t=Math.min(1,entrance/3.8),ease=t*t*(3-2*t);camera.setPosition(0,1.65,15.8-ease*4.3);$('arrival').style.opacity=String(1-t);if(t===1)finishEntrance();}else if(started){camera.setPosition(p.x,1.65,p.z);camera.setEulerAngles(pitch,yaw,0);}
});
window.addEventListener('resize',()=>app.resizeCanvas());$('world').addEventListener('webglcontextlost',e=>{e.preventDefault();setPaused(true);caption('The graphics context was lost. Reload to reopen the doorway.');});
app.start();$('enter').disabled=false;$('enter').textContent='Open the door →';$('load').textContent='A growing local neighborhood. Progress saves on this browser. J opens places.';
}
