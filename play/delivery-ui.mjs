import {normalizeDelivery,deliveryTarget,deliveryAction,advanceDelivery,deliveryText,PICKUP,DROPOFF} from './delivery.mjs';

// Shares the neighborhood save; crash recovery never resets this state.
export function setupDelivery({pc,app,player,isDriving,isBlocked,getLang,saved,onSave,toast}){
 let state=normalizeDelivery(saved),last='';
 const hud=document.createElement('aside');hud.id='delivery-hud';hud.setAttribute('aria-label','Parcel delivery');
 hud.innerHTML='<p></p><button type="button" hidden></button>';
 document.body.append(hud);
 const note=document.createElement('p');note.id='delivery-journal';
 document.querySelector('#journal')?.append(note);
 function marker(name,x,z,color){
  const mat=new pc.StandardMaterial();mat.diffuse=new pc.Color(...color);mat.update();
  const e=new pc.Entity(name);e.addComponent('render',{type:'box',material:mat});e.setPosition(x,.45,z);e.setLocalScale(.65,.9,.65);app.root.addChild(e);return e;
 }
 const pickup=marker('Delivery parcel · garage',PICKUP.x,PICKUP.z,[.15,.5,.85]);
 const dropoff=marker('Delivery destination · north station',DROPOFF.x,DROPOFF.z,[.85,.65,.25]);
 const button=hud.querySelector('button'),line=hud.querySelector('p');
 const labels={en:{pickup:'Pick up parcel',dropoff:'Deliver parcel',return:'Confirm return'},fa:{pickup:'برداشتن بسته',dropoff:'تحویل بسته',return:'تأیید بازگشت'}};
 function context(){return {driving:isDriving(),locked:isBlocked()};}
 function refresh(){
  const lang=getLang()==='fa'?'fa':'en',p=player(),target=deliveryTarget(state),ctx=context();
  const action=deliveryAction(state,p,ctx),distance=target?Math.ceil(Math.hypot(p.x-target.x,p.z-target.z)):0;
  pickup.enabled=state.stage==='ready'||state.stage==='delivered';dropoff.enabled=state.stage==='carrying';
  hud.hidden=ctx.locked||ctx.driving||p.x<35;
  document.body.classList.toggle('delivery-area',!hud.hidden);
  const text=deliveryText(state,lang);if(note)note.textContent=text;
  const heading=lang==='fa'?({ready:'بسته کنار گاراژ',carrying:'ایستگاه شمالی',delivered:'بازگشت به گاراژ',complete:'مأموریت تمام شد'})[state.stage]:({ready:'Parcel · garage',carrying:'Parcel → north station',delivered:'Return → garage',complete:'Delivery complete'})[state.stage];
  const key=[lang,state.stage,distance,action].join('|');
  if(key!==last){last=key;line.textContent=target?`${heading} · ${distance} m`:heading;button.hidden=!action;button.textContent=action?labels[lang][{ready:'pickup',carrying:'dropoff',delivered:'return'}[state.stage]]:'';hud.dir=lang==='fa'?'rtl':'ltr';hud.setAttribute('aria-label',lang==='fa'?'تحویل بسته':'Parcel delivery');}
 }
 function interact(){
  if(!advanceDelivery(state,player(),context()))return false;
  refresh();toast(deliveryText(state,getLang()));onSave();return true;
 }
 button.addEventListener('click',interact);
 app.on('update',refresh);refresh();
 return {get state(){return normalizeDelivery(state);},refresh,interact};
}
