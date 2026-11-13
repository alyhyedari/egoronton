import {containModalFocus} from './modal-focus.mjs';
const KEY='egor-survival-controls-v1', LESSON='egor-survival-coach-v1';
export const defaults={hand:'right',size:112,lift:90,sensitivity:1,reduced:false,keys:{forward:'KeyW',back:'KeyS',left:'KeyA',right:'KeyD',run:'ShiftLeft',interact:'KeyE',notebook:'KeyJ'}};
const labels={forward:'Forward',back:'Back',left:'Move left',right:'Move right',run:'Run',interact:'Interact',notebook:'Notebook'};
export function normalize(raw={}){
 const n={...defaults,keys:{...defaults.keys}};
 if(!raw||typeof raw!=='object')return n;
 if(raw.hand==='left')n.hand='left';
 for(const [k,min,max] of [['size',88,136],['lift',70,140],['sensitivity',.4,2]])if(Number.isFinite(raw[k]))n[k]=Math.max(min,Math.min(max,raw[k]));
 n.reduced=raw.reduced===true;
 const codes=Object.values(raw.keys||{});
 if(codes.length===7&&new Set(codes).size===7&&codes.every(validCode)&&Object.keys(labels).every(k=>codes.includes(raw.keys[k])))n.keys={...raw.keys};
 return n;
}
function validCode(code){return typeof code==='string'&&(/^(Key[A-Z]|Digit[0-9]|ShiftLeft|ShiftRight)$/.test(code));}
export function setupExperience({pause,isPaused,focusWorld}){
 const $=id=>document.getElementById(id);let settings;
 try{settings=normalize(JSON.parse(localStorage.getItem(KEY)||'null'));}catch{settings=normalize();}
 const systemMotion=matchMedia('(prefers-reduced-motion: reduce)');
 function readMotion(){try{const saved=localStorage.getItem('egor-survival-motion-v1');if(saved==='off'||saved==='on')settings.reduced=saved==='off';else settings.reduced=normalize(JSON.parse(localStorage.getItem(KEY)||'null')).reduced;}catch{}}
 readMotion();
 let active=false,index=0,total=0,wasPaused=false,capture=null,completed=false;
 try{completed=localStorage.getItem(LESSON)==='complete';}catch{}
 const dialog=$('control-settings');containModalFocus(dialog);
 const name=code=>code.replace('Key','').replace('Digit','').replace('ShiftLeft','Left Shift').replace('ShiftRight','Right Shift');
 const key=action=>name(settings.keys[action]);
 const lessons=[
  ['A few steps together',()=>`I am EGOR. No rush. Press ${key('forward')} or move the joystick. Walk two meters to continue.`,'move',2],
  ['Look around',()=>`Drag the scenery to turn the camera. On mobile, use the free side of the screen. Left and right arrows also turn the camera.`,'look',35],
  ['A little faster',()=>`Hold ${key('run')} while moving, or turn on Run on mobile. Run two meters. Release the key or turn Run off to walk again.`,'run',2],
  ['A small act, a real change',()=>`Approach a short courtyard lamp. Use the highlighted interaction button or press ${key('interact')}. If all lamps are done, try an activity north of the square.`,'interact',1],
  ['Your neighborhood notebook',()=>`Open Notebook or press ${key('notebook')}. Find places, keepsakes and projects. Choosing a destination shows directions; you still walk there yourself.`,'notebook',1],
  ['Rest is part of the game',()=>`Close the notebook, then press Pause or Escape. Use the same control to resume. Progress stays in this browser, not your Telegram account.`,'pause',1]
 ];
 function persist(motionChanged=false){try{localStorage.setItem(KEY,JSON.stringify(settings));if(motionChanged)localStorage.setItem('egor-survival-motion-v1',settings.reduced?'off':'on');$('control-status').textContent='Saved in this browser.';}catch{$('control-status').textContent='Storage unavailable. Settings apply to this visit only.';}}
 function apply(){
  document.body.dataset.hand=settings.hand;
  document.documentElement.style.setProperty('--stick-size',settings.size+'px');
  document.documentElement.style.setProperty('--control-lift',settings.lift+'px');
  const reduced=settings.reduced||systemMotion.matches;
  $('sensitivity').value=settings.sensitivity;$('reduced').checked=reduced;
  $('handedness').value=settings.hand;$('control-size').value=settings.size;$('control-height').value=settings.lift;$('control-sensitivity').value=settings.sensitivity;$('control-reduced').checked=reduced;
  $('reduced').disabled=$('control-reduced').disabled=systemMotion.matches;
  for(const [id,k] of [['control-size','size'],['control-height','lift'],['control-sensitivity','sensitivity']])$(id+'-value').textContent=settings[k];
  $('key-bindings').replaceChildren(...Object.keys(labels).map(action=>{const b=document.createElement('button');b.type='button';b.dataset.bind=action;b.textContent=`${labels[action]} · ${key(action)}`;return b;}));
  $('journal-button').textContent=`Notebook · ${key('notebook')}`;
  $('guide-keys').textContent=`${key('forward')}${key('left')}${key('back')}${key('right')} — MOVE · DRAG — LOOK · ${key('interact')} — INTERACT`;
  $('world').setAttribute('aria-label',`Neighborhood. ${key('forward')} forward, ${key('back')} back, ${key('left')} left, ${key('right')} right; drag to look; ${key('interact')} interact; ${key('notebook')} notebook; Escape pause.`);
  render();
 }
 function render(){
  $('coach').hidden=!active;
  if(!active)return;
  const done=index===lessons.length,step=lessons[index];
  $('coach-count').textContent=done?'Ready to explore':`EGOR / Step ${index+1} of ${lessons.length}`;
  $('coach-title').textContent=done?'The neighborhood is waiting for you.':step[0];
  $('coach-text').textContent=done?'Well done! Change the neighborhood with small acts. Choose Learn with EGOR whenever you want to practice again.':step[1]();
  $('coach-meter').max=done?1:step[3];$('coach-meter').value=done?1:total;
  $('coach-skip-step').hidden=done;$('coach-dismiss').textContent=done?'Let us explore':'Continue without lessons';
  $('coach').dataset.step=done?'done':step[2];
 }
 function advance(skipped=false){total=0;index++;if(index===lessons.length&&!skipped){try{localStorage.setItem(LESSON,'complete');}catch{}}render();}
 let skippedAny=false;
 function signal(type,value=1){if(!active||index>=lessons.length||lessons[index][2]!==type)return;total+=value;if(total>=lessons[index][3])advance(skippedAny);else $('coach-meter').value=total;}
 function start(){active=true;index=0;total=0;skippedAny=false;render();focusWorld();}
 $('coach-skip-step').onclick=()=>{skippedAny=true;advance(true);focusWorld();};
 $('coach-dismiss').onclick=()=>{active=false;render();focusWorld();};
 $('coach-start').onclick=start;
 function close(){capture=null;dialog.close();pause(wasPaused);focusWorld();}
 $('settings-open').onclick=()=>{wasPaused=isPaused();pause(true);capture=null;$('control-status').textContent='Changes apply immediately. Escape is always reserved for pausing.';dialog.showModal();$('settings-close').focus();};
 $('settings-close').onclick=close;dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
 for(const [id,k] of [['handedness','hand'],['control-size','size'],['control-height','lift'],['control-sensitivity','sensitivity'],['control-reduced','reduced']])$(id).addEventListener('input',e=>{settings[k]=k==='hand'?e.target.value:k==='reduced'?e.target.checked:Number(e.target.value);apply();persist(k==='reduced');});
 for(const [id,k] of [['sensitivity','sensitivity'],['reduced','reduced']])$(id).addEventListener('input',e=>{settings[k]=k==='reduced'?e.target.checked:Number(e.target.value);apply();persist(k==='reduced');});
 $('key-bindings').onclick=e=>{const b=e.target.closest('[data-bind]');if(!b)return;capture=b.dataset.bind;$('control-status').textContent=`Press a letter, number or Shift for ${labels[capture]}. Escape cancels.`;};
 dialog.addEventListener('keydown',e=>{
  if(!capture)return;
  if(e.key==='Tab')return;
  e.preventDefault();e.stopPropagation();
  if(e.key==='Escape'){capture=null;$('control-status').textContent='Key change cancelled.';return;}
  if(!validCode(e.code)||e.ctrlKey||e.altKey||e.metaKey){$('control-status').textContent='Choose a letter, number or Shift. Arrows, Space and Escape are reserved.';return;}
  if(Object.entries(settings.keys).some(([action,code])=>action!==capture&&code===e.code)){$('control-status').textContent='That key is already in use. Choose another key.';return;}
  const action=capture;settings.keys[action]=e.code;capture=null;apply();persist();dialog.querySelector(`[data-bind="${action}"]`).focus();
 });
 $('controls-reset').onclick=()=>{settings=normalize();capture=null;apply();persist(true);};
 systemMotion.addEventListener('change',apply);
 window.addEventListener('storage',event=>{if(event.key===null||event.key==='egor-survival-motion-v1'||event.key===KEY){readMotion();apply();}});
 apply();
 return {settings:()=>settings,key,signal,blocked:()=>dialog.open,start:()=>{if($('learn-with-egor').checked)start();},init:()=>{$('learn-with-egor').checked=!completed;}};
}
