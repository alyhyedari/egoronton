export const DISTRICTS=Object.freeze([
 {id:'home',name:'Blue-thread Square',subtitle:'Your room · the unfinished street',x:0,z:12,map:[85,170]},
 {id:'cafe',name:'The quiet cafe',subtitle:'Coffee · craft · company',x:23,z:-21.3,map:[137,123]},
 {id:'tower',name:'TON Blockchain Tower',subtitle:'The public archive · chapter one',x:0,z:-63,map:[85,75]},
 {id:'forest',name:'The remembering woods',subtitle:'Northern trail · the old receiver',x:-10,z:-102,map:[62,22]},
 {id:'garage',name:'Eastside Motor Works',subtitle:'Azure 01 · driving circuit',x:53.7,z:8,map:[220,160]},
 {id:'cloudrest',name:'Cloudrest overlook',subtitle:'Highland road · a place above the town',x:16,z:-219,map:[100,8]},
 {id:'mosslight',name:'Mosslight picnic grove',subtitle:'Rounded hills · a quiet rest stop',x:-43,z:-192,map:[20,12]},
 {id:'windmill',name:'Windmill bend',subtitle:'East country road · open countryside',x:151,z:-109,map:[253,45]}
]);
export function setupAtlas({player,clearWalk,garage,delivery,pause,resume,reset,save,caption,isStarted}){
 const dialog=document.createElement('dialog');dialog.id='atlas';dialog.setAttribute('aria-labelledby','atlas-title');
 dialog.innerHTML=`<div class="garage-top"><div><p class="eyebrow">A WORLD STILL BEING DRAWN</p><h2 id="atlas-title">Find your own way.</h2></div><button id="atlas-close">Back</button></div><div class="atlas-layout"><svg viewBox="0 0 280 210" role="img" aria-label="Map: forest north, tower in the center, cafe east, home south and driving circuit to the southeast"><path d="M85 170V75L62 22M85 123H137M85 170H220V85H260V160H220" fill="none" stroke="#67968a" stroke-width="4" stroke-linejoin="round"/><path d="M5 45L28 13 48 45M16 49L39 17 62 49M126 26L151 2 180 26" fill="none" stroke="#496c5f" stroke-width="2"/>${DISTRICTS.map(d=>`<g><circle cx="${d.map[0]}" cy="${d.map[1]}" r="7" fill="#d8ef91"/><text x="${d.map[0]}" y="${d.map[1]+19}" text-anchor="middle" fill="#b8d0be" font-size="7">${d.id.toUpperCase()}</text></g>`).join('')}<circle id="atlas-you" r="4" fill="#f4b37a" stroke="#102b30" stroke-width="2"/></svg><div>${DISTRICTS.map(d=>`<button data-travel="${d.id}"><strong>${d.name}</strong><small>${d.subtitle}</small></button>`).join('')}</div></div><p id="atlas-status" role="status">Choose a stop to travel on foot. Or close the map and walk the whole way.</p>`;
 document.body.append(dialog);
 const button=document.createElement('button');button.id='atlas-open';button.textContent='Map';button.setAttribute('aria-haspopup','dialog');document.getElementById('toolbar').append(button);
 const close=()=>{dialog.close();resume();};document.getElementById('atlas-close').onclick=close;dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
 button.onclick=()=>{if(!isStarted())return;pause();const p=player.getPosition(),m=document.getElementById('atlas-you');m.setAttribute('cx',String(Math.min(260,Math.max(8,85+p.x*2.2))));m.setAttribute('cy',String(Math.min(195,Math.max(10,155+p.z*1.3))));dialog.showModal();document.getElementById('atlas-close').focus();};
 dialog.addEventListener('click',e=>{const b=e.target.closest('[data-travel]');if(!b)return;const d=DISTRICTS.find(x=>x.id===b.dataset.travel);if(garage.incapacitated()||garage.isDriving()){document.getElementById('atlas-status').textContent='Park and leave your vehicle before travelling on foot.';return;}if(delivery.state.stage==='carrying'){document.getElementById('atlas-status').textContent='Finish this delivery before using the town transport.';return;}if(!clearWalk(d.x,d.z)){document.getElementById('atlas-status').textContent='This stop is blocked. Please choose another.';return;}player.setPosition(d.x,0,d.z);reset();save();close();caption(d.name+'. Take a moment. Look around.');});
 return {blocked:()=>dialog.open};
}
