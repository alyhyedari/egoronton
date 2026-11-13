import {containModalFocus} from './modal-focus.mjs';
import {BAY,PAINTS,normalizeGarage,exitPoint} from './vehicle-physics.mjs';
import {ROUTE,createDriveSession,stepDriveSession,recoverDriveSession,incapacitated,movementScale,recoveryReady} from './drive-session.mjs';
const words={
 fa:{health:'سلامت',damage:'آسیب خودرو',injured:'آسیب دیده‌ای؛ با احتیاط حرکت کن.',airborne:'از خودرو پرتاب شدی؛ منتظر فرود بمان.',knocked:'بیهوش شده‌ای؛ کمی صبر کن.',dead:'جان باختی؛ پس از مکث می‌توانی بازیابی کنی.',disabled:'خودرو از کار افتاده است.',recover:'درمان و بازیابی خودرو',preserved:'ایستگاه، مسافت مسیر و پیشرفت مأموریت حفظ می‌شوند.',recovered:'بازیابی انجام شد؛ پیشرفتت حفظ شد.',wait:'برای بازیابی توقف کن و منتظر پایان بیهوشی بمان.',unsafe:'محل امنی برای بازیابی پیدا نشد.',garage:'گاراژ',title:'یک ماشین. یک مسیر تازه.',intro:'Azure 01 یک مدل هندسی مستقل با الهام از استایل لو‌رایدر است؛ نمونهٔ اولیه، نه بازسازی یک خودروی واقعی.',visit:'رفتن پیاده به گاراژ',close:'بازگشت به بازی',paint:'رنگ بدنه',azure:'آبی اقیانوسی',cherry:'گیلاسی',ivory:'کرم صدفی',height:'ارتفاع تعلیق',low:'پایین',raised:'بالا',camera:'دوربین رانندگی',chase:'تعقیبی',wide:'نمای باز',language:'زبان گاراژ / Garage language',scope:'فقط گاراژ و رابط رانندگی دوزبانه‌اند؛ بقیهٔ محله هنوز کامل ترجمه نشده است.',local:'تنظیمات و تعداد دورها فقط در همین مرورگر ذخیره می‌شوند.',failed:'ذخیره‌سازی در دسترس نیست؛ تغییرها فقط برای این بازدید می‌مانند.',away:'برای تغییر رنگ و ارتفاع، خودرو را در گاراژ پارک کن.',ready:'خودرو در جایگاه است؛ رنگ و ارتفاع را تغییر بده.',enter:'سوار شدن',exit:'پیاده شدن',slow:'برای پیاده‌شدن توقف کن',blocked:'کنار خودرو جای امنی نیست؛ کمی جابه‌جا شو.',brake:'ترمز',reset:'بازگرداندن خودرو به گاراژ',resetAsk:'خودرو به گاراژ برگردد؟ دور ناتمام از اول شروع می‌شود.',drive:'رانندگی',route:'ایستگاه',laps:'دور کامل',hint:'جلو: گاز · عقب: ترمز، سپس دنده‌عقب · چپ/راست: فرمان · Space یا دکمهٔ ترمز: توقف',touch:'جوی‌استیک: گاز و فرمان؛ برای ترمز دکمه را نگه دار.',course:'پیست بستهٔ آزمایشی · خروج از خودرو فقط در حالت توقف · عملکرد تعلیق فعلاً نمایشی است.',park:'گاراژ نزدیک میدان شرقی است. این دکمه شما را پیاده به کنار ماشین می‌برد.',hit:'برخورد؛ مسیر را اصلاح کن.',lap:'یک دور کامل شد!',speed:'کیلومتر/ساعت',home:'محله',walk:'به گاراژ رسیدی؛ کنار درِ ماشین بایست.'},
 en:{health:'Health',damage:'Vehicle damage',injured:'Injured. Move carefully.',airborne:'Ejected. Wait until you land.',knocked:'Knocked out. Give it a moment.',dead:'You died. Recovery becomes available after a short wait.',disabled:'Vehicle disabled.',recover:'Heal and recover car',preserved:'Checkpoint, route distance and mission progress are kept.',recovered:'Recovered. Your progress is intact.',wait:'Stop and wait until you regain consciousness to recover.',unsafe:'No safe recovery location is available.',garage:'Garage',title:'One car. A new stretch of road.',intro:'Azure 01 is an original procedural model inspired by lowrider styling; a prototype, not a replica of a real car.',visit:'Visit garage on foot',close:'Back to the world',paint:'Body paint',azure:'Ocean blue',cherry:'Cherry',ivory:'Pearl cream',height:'Suspension height',low:'Low',raised:'Raised',camera:'Driving camera',chase:'Chase',wide:'Wide view',language:'Garage language / زبان گاراژ',scope:'Only the garage and driving UI are bilingual. The rest of the neighborhood is not fully translated yet.',local:'Settings and completed laps save only in this browser.',failed:'Storage unavailable; changes last for this visit only.',away:'Park the car in its garage bay to change paint or ride height.',ready:'Car in the bay. Choose a paint and ride height.',enter:'Get in',exit:'Get out',slow:'Stop before getting out',blocked:'No safe space beside the car. Move a little first.',brake:'Brake',reset:'Return car to garage',resetAsk:'Return the car to the garage? The unfinished lap will restart.',drive:'DRIVING',route:'Checkpoint',laps:'Completed laps',hint:'Forward: throttle · Back: brake, then reverse · Left/right: steer · Space or Brake button: stop',touch:'Stick: throttle and steering; hold Brake to stop.',course:'Closed test course · Stop before exiting · Suspension changes are visual only for now.',park:'The garage is east of the square. This button takes you there on foot.',hit:'Contact. Adjust your line.',lap:'Lap complete!',speed:'km/h',home:'Neighborhood',walk:'At the garage. Stand beside the car door.'}
};
export function setupGarage({pc,app,shape,mat,obstacles,player,camera,clearWalk,pause,isPaused,focusWorld,resetInput,caption,isStarted}){
 const $=id=>document.getElementById(id),KEY='egor-survival-garage-v1';let config;try{config=normalizeGarage(JSON.parse(localStorage.getItem(KEY)));}catch{config=normalizeGarage();}
 const session=createDriveSession();let car=session.car,driving=false,braking=false,wasPaused=false,storageOK=true;
 const locked=()=>incapacitated(session);
 const t=k=>words[config.language][k];
 const ink=mat('#173647'),cream=mat('#eadbb7'),chrome=mat('#b9cfd0'),rubber=mat('#15252d'),glass=mat('#244451'),road=mat('#536064'),gold=mat('#f3c57b',.2),red=mat('#e85f58',.2),paint=mat(PAINTS[config.paint]);
 chrome.shininess=80;chrome.specular=new pc.Color(.8,.8,.8);chrome.update();paint.shininess=65;paint.specular=new pc.Color(.3,.4,.4);paint.update();
 const box=(x,y,z,w,h,d,m=cream,parent=app.root)=>shape('box',x,y,z,w,h,d,m,parent);
 const solid=(x,z,w,d,h,m)=>{box(x,h/2,z,w,h,d,m);obstacles.push({x,z,w:w/2+.25,d:d/2+.25});};
 // A walkable link to the existing town and an enclosed east-side test loop.
 box(72,-.35,-18,72,.6,78,cream);box(40,.015,0,30,.08,7,road);
 box(56,.02,-16,14,.08,66,road);box(96,.02,-18,14,.08,66,road);box(76,.025,-42,48,.08,14,road);box(76,.025,6,48,.08,14,road);
 for(let i=0;i<12;i++){for(const x of [56,96])box(x,.075,9-i*5,.16,.02,2,cream);}
 for(let i=0;i<8;i++)for(const z of [-42,6])box(58+i*5,.08,z,2,.02,.16,cream);
 for(const z of [-55,19])solid(75,z,64,.3,1.05,ink);
 solid(107,-18,.3,74,1.05,ink);solid(43,-29,.3,52,1.05,ink);solid(43,12,.3,14,1.05,ink);
 // Central planted island is deliberately solid, not a drive-through decoration.
 solid(76,-18,23,25,.5,ink);box(76,.28,-18,22.5,.1,24.5,mat('#839a7e'));
 for(const x of [69,83])for(const z of [-25,-11]){shape('cylinder',x,1.5,z,.3,3,.3,ink);shape('sphere',x,3.7,z,3.5,4.4,3.5,mat('#598b7c'));}
 for(const x of [47,104])for(const z of [-48,-25,-2]){solid(x,z,.22,.22,4.8,ink);box(x,4.85,z,1.4,.15,.5,gold);}
 // Open-front garage: exposed rafters keep the chase-camera sightline usable.
 box(56,.08,10,12,.12,12,mat('#96aaa6'));solid(50,10,.25,12,4,ink);solid(62,10,.25,12,4,ink);solid(56,16,12,.25,4,ink);
 for(const z of [5,10,15])box(56,4.1,z,12,.25,.2,ink);
 box(56,3.6,4,12,.8,.2,paint);box(56,4.35,14,12,.18,4,cream);
 box(60.8,1,12,1.4,2,4,paint);box(60.8,2.05,12,1.6,.15,4.2,chrome);
 for(const z of [10.5,11.2,11.9,12.6,13.3])box(60,1.4,z,.04,.08,.45,chrome);
 for(const x of [52,60])box(x,.17,8,.12,.04,7,gold);
 function sign(text,x,y,z,w=7){const c=document.createElement('canvas');c.width=1024;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#173647';ctx.fillRect(0,0,1024,128);ctx.fillStyle='#eadbb7';ctx.font='bold 58px sans-serif';ctx.textAlign='center';ctx.fillText(text,512,84);const texture=new pc.Texture(app.graphicsDevice);texture.setSource(c);const material=mat('#ffffff');material.diffuseMap=texture;material.update();box(x,y,z,w,w/8,.04,material);}
 sign('AZURE / 01 — MOTOR WORKS',56,3.6,3.87,10);sign('EAST / GARAGE →',36,2.5,3,6);
 const root=new pc.Entity('azure-01');app.root.addChild(root);const body=new pc.Entity('azure-01-body');root.addChild(body);
 // Long hood, short cabin, chrome beltline and cream hardtop.
 box(0,.64,0,2.14,.43,4.9,paint,body);box(0,.88,-1.42,2.08,.18,1.85,paint,body);box(0,.88,1.72,2.08,.18,1.25,paint,body);
 box(0,1.16,.12,1.78,.65,1.9,glass,body);box(0,1.52,.22,1.9,.12,1.8,cream,body);
 for(const side of [-1,1]){
  box(side*.91,1.2,.22,.055,.65,.07,chrome,body);box(side*.9,1.2,-.76,.06,.65,.07,chrome,body);box(side*.9,1.2,1.05,.06,.65,.07,chrome,body);
  box(side*1.085,.74,0,.045,.055,4.4,chrome,body);box(side*1.09,.54,.2,.04,.04,4.2,cream,body);
  box(side*1.08,.92,.55,.06,.05,.25,chrome,body);box(side*1.16,1.04,-.75,.24,.14,.18,chrome,body);
  box(side*1.085,.7,.96,.02,.37,.025,ink,body);
 }
 for(const z of [-2.5,2.5])box(0,.53,z,2.25,.18,.16,chrome,body);
 box(0,.76,-2.46,1.15,.24,.04,ink,body);for(let i=0;i<11;i++)box(-.5+i*.1,.76,-2.49,.025,.21,.02,chrome,body);
 for(const side of [-1,1])for(const dx of [0,.24]){const light=shape('cylinder',side*(.65+dx),.78,-2.49,.2,.045,.2,gold,body);light.setLocalEulerAngles(90,0,0);}
 for(const x of [-.8,.8])box(x,.77,2.47,.4,.15,.04,red,body);
 box(0,.5,2.6,.5,.16,.025,ink,body);box(0,.98,-1.6,.035,.015,1.4,chrome,body);
 const wheels=[];for(const x of [-1.07,1.07])for(const z of [-1.55,1.55]){
  const pivot=new pc.Entity();root.addChild(pivot);pivot.setLocalPosition(x,.42,z);const spin=new pc.Entity();pivot.addChild(spin);
  for(const [radius,width,m] of [[.82,.28,rubber],[.64,.29,cream],[.47,.31,chrome],[.32,.32,ink]]){const e=shape('cylinder',0,0,0,radius,width,radius,m,spin);e.setLocalEulerAngles(0,0,90);}
  for(let i=0;i<10;i++){const spoke=box(Math.sign(x)*.17,0,0,.025,.39,.025,chrome,spin);spoke.setLocalEulerAngles(i*18,0,0);}
  const hub=shape('sphere',Math.sign(x)*.18,0,0,.1,.1,.1,chrome,spin);wheels.push({pivot,spin,front:z<0});
 }
 const route=ROUTE;
 const markers=route.map((p,i)=>{const e=shape('cylinder',p.x,.12,p.z,5,.035,5,gold);for(const dx of [-4,4]){shape('cone',p.x+dx,.45,p.z,.5,.8,.5,gold);}sign(String(i+1).padStart(2,'0'),p.x+4,1.4,p.z,.7);return e;});
 const section=document.createElement('section');section.id='garage-ui';section.innerHTML=`<button id="garage-open" aria-haspopup="dialog"></button><div id="drive-hud" hidden><p id="drive-label"></p><strong><bdi id="drive-speed">0</bdi> <small id="drive-unit"></small></strong><p id="drive-route"></p></div><button id="car-action" hidden></button><button id="car-brake" hidden></button><dialog id="garage-dialog" aria-labelledby="garage-title"><div class="garage-top"><span class="garage-kicker">AZURE / 01 · LOCAL MOTOR WORKS</span><button id="garage-close"></button></div><h2 id="garage-title"></h2><p id="garage-intro"></p><p id="garage-availability" role="status"></p><div class="garage-options"><label><span id="garage-paint-label"></span><select id="garage-paint"></select></label><label><span id="garage-height-label"></span><select id="garage-height"></select></label><label><span id="garage-camera-label"></span><select id="garage-camera"></select></label><label><span id="garage-language-label"></span><select id="garage-language"><option value="fa">فارسی</option><option value="en">English</option></select></label></div><p id="garage-hint"></p><p id="garage-touch"></p><p id="garage-course"></p><div class="garage-actions"><button id="garage-visit"></button><button id="garage-reset"></button></div><p id="garage-park"></p><p id="garage-save" role="status"></p><p id="garage-scope" class="garage-fine"></p></dialog>`;document.body.append(section);
 const injury=document.createElement('aside');injury.id='injury-hud';injury.hidden=true;injury.innerHTML='<p id="injury-meters"></p><p id="injury-status" role="status"></p><button id="crash-recover"></button><small id="recovery-note"></small>';section.append(injury);
 const dialog=$('garage-dialog');containModalFocus(dialog);
 const atBay=()=>Math.hypot(car.x-BAY.x,car.z-BAY.z)<3&&Math.abs(car.speed)<.25;
 const nearby=()=>{const p=player.getPosition();return Math.hypot(p.x-car.x,p.z-car.z)<3.8;};
 function persist(){try{localStorage.setItem(KEY,JSON.stringify(config));storageOK=true;}catch{storageOK=false;}$('garage-save').textContent=t(storageOK?'local':'failed');}
 function option(id,values){const select=$(id);select.replaceChildren(...values.map(v=>{const o=document.createElement('option');o.value=v;o.textContent=t(v);return o;}));}
 function render(){
  section.lang=config.language;section.dir=config.language==='fa'?'rtl':'ltr';
  for(const [id,key] of Object.entries({'garage-open':'garage','garage-close':'close','garage-title':'title','garage-intro':'intro','garage-paint-label':'paint','garage-height-label':'height','garage-camera-label':'camera','garage-language-label':'language','garage-hint':'hint','garage-touch':'touch','garage-course':'course','garage-visit':'visit','garage-reset':'reset','garage-park':'park','garage-scope':'scope','drive-label':'drive','drive-unit':'speed','car-brake':'brake'}))$(id).textContent=t(key);
  option('garage-paint',Object.keys(PAINTS));option('garage-height',['low','raised']);option('garage-camera',['chase','wide']);
  for(const key of ['paint','height','camera','language'])$('garage-'+key).value=config[key];
  const editable=atBay()&&(driving||nearby());$('garage-paint').disabled=$('garage-height').disabled=!editable;$('garage-availability').textContent=t(editable?'ready':'away');$('garage-save').textContent=t(storageOK?'local':'failed');$('garage-visit').hidden=driving;$('garage-visit').disabled=$('garage-reset').disabled=locked();renderInjury();
 }
 function apply(){paint.diffuse=new pc.Color().fromString(PAINTS[config.paint]);paint.update();body.setLocalPosition(0,config.height==='raised'?.22:0,0);}
 function close(){dialog.close();pause(wasPaused);focusWorld();}
 $('garage-open').onclick=()=>{if(!isStarted())return;wasPaused=isPaused();pause(true);render();dialog.showModal();$('garage-close').focus();};
 $('garage-close').onclick=close;dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
 for(const key of ['paint','height','camera','language'])$('garage-'+key).onchange=e=>{if(['paint','height'].includes(key)&&!(atBay()&&(driving||nearby())))return;config=normalizeGarage({...config,[key]:e.target.value});apply();persist();render();};
 $('garage-visit').onclick=()=>{if(driving||locked())return;player.setPosition(BAY.x-2.3,0,BAY.z);resetInput();close();caption(t('walk'));};
 function recover(){Object.assign(session,createDriveSession());car=session.car;driving=false;braking=false;player.setPosition(BAY.x-2.3,0,BAY.z);resetInput();syncMode();}
 $('garage-reset').onclick=()=>{if(locked()||!confirm(t('resetAsk')))return;recover();close();};
 function renderInjury(){
  const s=session.survival,damaged=s.health<100||s.vehicleDamage>0;
  injury.hidden=!isStarted()||!damaged;
  $('injury-meters').textContent=`${t('health')} ${Math.ceil(s.health)}/100 · ${t('damage')} ${Math.round(s.vehicleDamage)}%`;
  const key=s.player==='dead'?'dead':s.airborne?'airborne':s.player==='knocked-out'?'knocked':s.vehicleDisabled?'disabled':'injured';
  const message=t(key);if($('injury-status').textContent!==message)$('injury-status').textContent=message;
  $('crash-recover').textContent=t('recover');$('crash-recover').disabled=isPaused()||!recoveryReady(session);
  $('recovery-note').textContent=t(recoveryReady(session)?'preserved':'wait');
  injury.dataset.state=s.player;
 }
 $('crash-recover').onclick=()=>{
  if(!isStarted()||isPaused())return;
  const point=recoverDriveSession(session,{obstacles,clearWalk});if(!point){caption(t('unsafe'));return;}
  driving=session.driving;player.setPosition(point.x,point.y,point.z);resetInput();syncMode();renderInjury();focusWorld();caption(t('recovered'));
 };
 function syncMode(){document.body.classList.toggle('driving',driving);$('drive-hud').hidden=!driving;$('car-brake').hidden=!driving;}
 function interact(){
  if(!isStarted()||isPaused())return false;
  if(locked())return true;
  if(driving){if(Math.abs(car.speed)>.25){caption(t('slow'));return true;}const point=exitPoint(car,clearWalk);if(!point){caption(t('blocked'));return true;}driving=false;car.speed=0;player.setPosition(point.x,0,point.z);resetInput();syncMode();focusWorld();return true;}
  if(!nearby())return false;if(session.survival.vehicleDisabled){caption(t('disabled'));return true;}driving=true;car.speed=0;resetInput();syncMode();focusWorld();caption(t('hint'));return true;
 }
 $('car-action').onclick=interact;
 let brakePointer=null;const brake=$('car-brake');brake.onpointerdown=e=>{if(isPaused())return;e.preventDefault();brakePointer=e.pointerId;braking=true;brake.setPointerCapture(e.pointerId);};brake.onpointerup=brake.onpointercancel=brake.onlostpointercapture=e=>{if(e.pointerId===brakePointer){braking=false;brakePointer=null;}};
 // Native keyboard click provides a full stop; pointer hold remains continuous.
 brake.onclick=e=>{if(e.detail===0&&!isPaused()){car.speed=0;focusWorld();}};
 function clearInput(){braking=false;brakePointer=null;}
 function update(dt,input){
  $('garage-open').hidden=!isStarted();const active=isStarted()&&!isPaused();
  session.driving=driving;
  const wasLocked=locked();
  const events=stepDriveSession(session,{...input,brake:input.brake||braking},dt,{obstacles,clearWalk,active});
  driving=session.driving;
  if(driving)player.setPosition(car.x,0,car.z);
  else if(wasLocked||locked()||events.some(e=>e.type==='impact'&&(e.ejected||e.dead))){const p=session.survival.position;player.setPosition(p.x,p.y,p.z);}
  for(const event of events){
   if(event.type==='impact'){caption(t('hit'));if(event.ejected||event.dead)resetInput();}
   if(event.type==='standing')resetInput();
   if(event.type==='lap'){config.laps++;persist();caption(t('lap'));}
  }
  syncMode();document.body.classList.toggle('incapacitated',locked());renderInjury();
  if(locked())$('connect').hidden=true;
  $('car-action').hidden=!active||locked()||(!driving&&!nearby());$('car-action').textContent=t(driving?'exit':'enter');$('car-action').setAttribute('aria-disabled',String(driving&&Math.abs(car.speed)>.25||!driving&&session.survival.vehicleDisabled));
  root.setPosition(car.x,0,car.z);root.setEulerAngles(0,car.yaw*180/Math.PI,0);
  for(const w of wheels){w.pivot.setLocalEulerAngles(0,w.front?-car.steer*180/Math.PI:0,0);w.spin.setLocalEulerAngles(car.distance/.41*180/Math.PI,0,0);}
  markers.forEach((m,i)=>{m.render.material=i===session.checkpoint?gold:cream;});
  $('drive-speed').textContent=String(Math.round(Math.abs(car.speed)*3.6));$('drive-route').textContent=`${t('route')} ${session.checkpoint+1}/4 · ${t('laps')} ${config.laps}`;
 }
 function updateCamera(){if(!driving)return;const d=config.camera==='wide'?8:6,s=Math.sin(car.yaw),c=Math.cos(car.yaw);let distance=d;for(let n=.5;n<=d;n+=.25){const x=car.x+s*n,z=car.z+c*n;if(obstacles.some(o=>Math.abs(x-o.x)<o.w+.2&&Math.abs(z-o.z)<o.d+.2)){distance=Math.max(2,n-.5);break;}}camera.setPosition(car.x+s*distance,config.camera==='wide'?5:3.2,car.z+c*distance);camera.lookAt(car.x-s*2,.8,car.z-c*2);}
 render();apply();syncMode();return {update,updateCamera,interact,clearInput,isDriving:()=>driving,incapacitated:locked,movementScale:()=>movementScale(session),blocked:()=>dialog.open,home:()=>{if(locked())return false;if(driving){driving=false;session.driving=false;car.speed=0;clearInput();syncMode();}return true;}};
}
