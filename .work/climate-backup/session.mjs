// Versioned local guest save. No account, wallet or online balance is implied.
import {normalizeGarage} from './vehicle-physics.mjs';
import {normalizeDrive} from './drive-session.mjs';
export const SAVE_KEY='egorverse-save-v1';
export const MODES=Object.freeze({story:{title:'Story',damage:false},roam:{title:'Free roam',damage:false},survival:{title:'Survival',damage:true}});
const object=x=>x&&typeof x==='object'&&!Array.isArray(x)?x:{};
const finite=(x,a,b,f)=>Number.isFinite(x)?Math.max(a,Math.min(b,x)):f;
export function normalizeSave(raw={}){
 const r=object(raw),p=object(r.profile),j=object(r.journey),n=object(r.neighborhood),g=object(r.garage),pos=object(r.position);
 const stage=Math.floor(finite(j.stage,0,4,0));
 const profile={mode:Object.hasOwn(MODES,p.mode)?p.mode:'story',quality:['auto','low','high'].includes(p.quality)?p.quality:'auto',look:p.look==='locked'?'locked':'drag',language:p.language==='fa'?'fa':'en',input:['auto','touch','keyboard'].includes(p.input)?p.input:'auto',music:p.music!==false,volume:finite(p.volume,0,.6,.22),accent:['blue','sunset','sage'].includes(p.accent)?p.accent:'blue'};
 const neighborhood={};
 for(const key of ['studio','cafe','garden','gallery','sculpture'])neighborhood[key]=Math.floor(finite(n[key],0,key==='gallery'?1:3,0));
 for(let i=0;i<3;i++)neighborhood['light'+i]=n['light'+i]===true;
 neighborhood.homeSeen=n.homeSeen===true;neighborhood.palette=['blue','sunset','sage'].includes(n.palette)?n.palette:'blue';
 for(const key of ['found','built'])neighborhood[key]=Array.isArray(n[key])?[...new Set(n[key].filter(v=>typeof v==='string'&&v.length<40))].slice(0,30):[];
 neighborhood.delivery={stage:['ready','carrying','delivered','complete'].includes(n.delivery?.stage)?n.delivery.stage:'ready'};
 return {version:1,profile,neighborhood,garage:normalizeGarage(g),drive:normalizeDrive(r.drive),journey:{stage,ink:stage*25,visited:Array.isArray(j.visited)?[...new Set(j.visited.filter(x=>['town','forest','tower','garage'].includes(x)))]:[]},position:{x:finite(pos.x,-115,175,0),z:finite(pos.z,-241,21,11.5),yaw:finite(pos.yaw,-36000,36000,0)},updated:finite(r.updated,0,1e15,0)};
}
export function mergeLegacy(main={},survival={}){
 const a=object(main),b=object(survival),n={...a,...b};
 for(const key of ['studio','cafe','garden','gallery','sculpture'])n[key]=Math.max(Number(a[key])||0,Number(b[key])||0);
 for(const key of ['light0','light1','light2','homeSeen'])n[key]=a[key]===true||b[key]===true;
 for(const key of ['found','built'])n[key]=[...new Set([...(Array.isArray(a[key])?a[key]:[]),...(Array.isArray(b[key])?b[key]:[])])];
 return normalizeSave({neighborhood:n});
}
export function advanceJourney(save,stage){
 const s=normalizeSave(save);if(stage!==s.journey.stage||stage>=4)return s;
 s.journey.stage++;s.journey.ink=s.journey.stage*25;return s;
}
export function parseImport(text){
 if(typeof text!=='string'||text.length>1000000)throw Error('Choose an EGORVERSE save smaller than 1 MB.');
 const r=JSON.parse(text);if(r?.version!==1||!r.profile||!r.neighborhood||!r.journey)throw Error('This is not an EGORVERSE save. Your current world is unchanged.');
 return normalizeSave(r);
}
export async function openSave(){
 let local=null;try{local=window.localStorage;}catch{}
 const read=key=>{try{return JSON.parse(local?.getItem(key)||'null');}catch{return null;}};
 let state=normalizeSave(read(SAVE_KEY)||mergeLegacy(read('egor-neighborhood-0441'),read('egor-survival-neighborhood-v1')));
 if(!read(SAVE_KEY))state.garage=read('egor-survival-garage-v1')||read('egor-garage-v1')||{};
 let db=null,status='Local save',pending=Promise.resolve();
 try{db=await new Promise((resolve,reject)=>{let expired=false;const req=indexedDB.open('egorverse',1);const fail=()=>{expired=true;clearTimeout(timer);reject(Error('Storage busy'));};const timer=setTimeout(fail,2000);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('saves'))req.result.createObjectStore('saves');};req.onerror=fail;req.onsuccess=()=>{clearTimeout(timer);if(expired){req.result.close();return;}resolve(req.result);};req.onblocked=fail;});
 const saved=await new Promise((resolve,reject)=>{const req=db.transaction('saves').objectStore('saves').get('guest');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
 if(saved?.version===1&&saved.updated>=state.updated)state=normalizeSave(saved);
 db.onversionchange=()=>{db.close();db=null;};
 }catch{status='Browser save';}
 const listeners=new Set();
 const notify=()=>listeners.forEach(fn=>fn(state,status));
 function persist(){
  state.updated=Date.now();const snapshot=structuredClone(state);let fallback=false;
  try{local?.setItem(SAVE_KEY,JSON.stringify(snapshot));fallback=!!local;}catch{}
  status=fallback?'Saved on this device':'Saving…';notify();
  pending=pending.catch(()=>{}).then(()=>new Promise(resolve=>{
   if(!db){status=fallback?'Saved on this device':'Session only · storage unavailable';notify();resolve();return;}
   const failed=()=>{status=fallback?'Saved on this device':'Session only · storage unavailable';notify();resolve();};
   try{const tx=db.transaction('saves','readwrite');tx.objectStore('saves').put(snapshot,'guest');
   tx.oncomplete=()=>{status='Saved on this device';notify();resolve();};
   tx.onerror=tx.onabort=failed;}catch{failed();}
  }));return pending;
 }
 return {get state(){return state;},get status(){return status;},subscribe(fn){listeners.add(fn);fn(state,status);return()=>listeners.delete(fn);},patch(patch){state=normalizeSave({...state,...patch});return persist();},replace(next){state=normalizeSave(next);return persist();},flush:persist};
}
