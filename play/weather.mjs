import {createCloudShadows} from './cloud-shadows.mjs';
import {normalizeWeather,stepWeather,chooseWeather,weatherProfile,WEATHER_TYPES,WEATHER_NAMES} from './weather-state.mjs';
import {groundHeight} from './terrain.mjs';
export function setupWeather({pc,app,camera,sun,shape,mat,store,terrain,player,driving,reduced}){
 const state=normalizeWeather(store.state.weather),panel=document.createElement('section');panel.className='world-climate';
 panel.innerHTML='<h3>Living sky</h3><p>Weather flows through the world and saves with your journey</p><label>Weather<select id="weather-mode"><option value="auto">Dynamic weather</option>'+WEATHER_TYPES.map(t=>`<option value="${t}">${WEATHER_NAMES[t]}</option>`).join('')+'</select></label><p id="weather-report" role="status"></p>';
 document.getElementById('control-settings').append(panel);const select=panel.querySelector('select'),report=panel.querySelector('p[role]');select.value=state.mode;select.onchange=()=>{state.mode=select.value;if(state.mode!=='auto')chooseWeather(state,state.mode);store.patch({weather:{...state}});};
 const badge=document.createElement('span');badge.id='weather-badge';document.querySelector('.session-info').append(badge);
 const cloudmat=mat('#d1dcdb'),clouds=[];
 for(let i=0;i<14;i++){const e=shape('sphere',0,0,0,35+(i%3)*12,5+(i%4),15+(i%3)*5,cloudmat);e.render.castShadows=false;for(const [x,y,z,s] of [[-.3,.15,0,.7],[.28,.25,-.1,.65]]){const puff=shape('sphere',x,y,z,s,1.25,s,cloudmat,e);puff.render.castShadows=false;}clouds.push(e);}
 // One dynamic mesh for precipitation; no entity or material allocation per drop.
 const mesh=new pc.Mesh(app.graphicsDevice);mesh.setPositions(new Float32Array(180*9));mesh.setIndices(Array.from({length:540},(_,i)=>i));mesh.update(pc.PRIMITIVE_TRIANGLES);const pm=mat('#ccdfeb',.3);pm.cull=pc.CULLFACE_NONE;pm.useLighting=false;pm.update();
 const precipitation=new pc.Entity('local-weather-particles');precipitation.addComponent('render',{meshInstances:[new pc.MeshInstance(mesh,pm)],castShadows:false,receiveShadows:false});app.root.addChild(precipitation);
 const shadows=createCloudShadows({pc,app,mat});
 const max=180,positions=new Float32Array(max*9),indices=Array.from({length:max*3},(_,i)=>i);mesh.setIndices(indices);
 const funnelmat=mat('#6d8284'),funnel=[];for(let i=0;i<11;i++){const e=shape('sphere',0,0,0,1,1,1,funnelmat);e.render.castShadows=false;funnel.push(e);}
 const rainbow=new pc.Entity('after-rain-arch');app.root.addChild(rainbow);
 for(const [band,color] of ['#ee8d7d','#efb976','#eedc8b','#a8cd99','#84bace','#a49dc8'].entries()){
  const p=[],idx=[],radius=44+band*1.1;
  for(let j=0;j<=48;j++){const a=j/48*Math.PI;for(const r of [radius,radius+.8])p.push(Math.cos(a)*r,Math.sin(a)*r,0);if(j){const k=j*2;idx.push(k-2,k-1,k,k-1,k+1,k);}}
  const m=new pc.Mesh(app.graphicsDevice);m.setPositions(p);m.setIndices(idx);m.update(pc.PRIMITIVE_TRIANGLES);const material=mat(color,.25);material.cull=pc.CULLFACE_NONE;material.opacity=.5;material.blendType=pc.BLEND_NORMAL;material.depthWrite=false;material.update();const e=new pc.Entity();e.addComponent('render',{meshInstances:[new pc.MeshInstance(m,material)],castShadows:false});rainbow.addChild(e);
 }
 const boltMaterial=mat('#e4e8d3',1),bolts=[];for(let i=0;i<6;i++){const e=shape('box',0,0,0,.22,6,.22,boltMaterial);e.enabled=false;bolts.push(e);}
 let ui=-1,flashAge=0,lastStrike=-1,audio=null,rumble=null;
 function unlockAudio(){if(audio)return;try{audio=new (window.AudioContext||window.webkitAudioContext)();}catch{}}
 document.getElementById('enter').addEventListener('click',unlockAudio);
 function thunder(){if(!audio||!store.state.profile.music)return;audio.resume().catch(()=>{});const o=audio.createOscillator(),g=audio.createGain();o.type='triangle';o.frequency.setValueAtTime(48,audio.currentTime);o.frequency.exponentialRampToValueAtTime(23,audio.currentTime+1.8);g.gain.setValueAtTime(.0001,audio.currentTime);g.gain.linearRampToValueAtTime(store.state.profile.volume*.22,audio.currentTime+.15);g.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+2);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+2.1);rumble=g;o.onended=()=>{o.disconnect();g.disconnect();};}
 function update(dt,active){if(active)stepWeather(state,dt);else if(rumble&&audio)rumble.gain.setTargetAtTime(0,audio.currentTime,.1);
  const p=player(),profile=weatherProfile(state.type),old=weatherProfile(state.previous),cloud=old.cloud+(profile.cloud-old.cloud)*state.blend;
  const daylight=Math.max(.14,Math.sin((state.clock/1200-.25)*Math.PI*2)*.72+.3),warm=Math.max(0,1-Math.abs(daylight-.35)*5);
  const strike=Math.floor(state.elapsed/13);if(active&&state.type==='thunder'&&strike!==lastStrike){lastStrike=strike;flashAge=.4;thunder();}flashAge=Math.max(0,flashAge-dt);const flash=!reduced()&&flashAge>0?Math.sin(flashAge/.4*Math.PI)*.22:0;
  bolts.forEach((e,i)=>{e.enabled=flashAge>.18&&!reduced();if(e.enabled){e.setPosition(p.x+18+(i%2)*2,groundHeight(p.x,p.z)+40-i*5,p.z-65);e.setEulerAngles(0,0,i%2?23:-23);}});
  const sky=[(.35-cloud*.14)*daylight+warm*.12+flash,(.64-cloud*.28)*daylight+flash,(.73-cloud*.3)*daylight+flash];camera.camera.clearColor.set(...sky);app.scene.fog.color.set(...sky);app.scene.fog.start=40;app.scene.fog.end=310-cloud*160;
  app.scene.ambientLight.set(.2+daylight*.4,.23+daylight*.4,.28+daylight*.37);sun.light.intensity=(.15+daylight*1.2)*(1-cloud*.65)+flash;sun.setEulerAngles(20+state.clock/1200*150,-30,0);
  cloudmat.diffuse.set(.45+daylight*.4-cloud*.15,.5+daylight*.35-cloud*.15,.55+daylight*.3-cloud*.15);cloudmat.update();
  clouds.forEach((e,i)=>{e.setPosition(p.x+((i*67+state.elapsed*(.4+profile.wind)-p.x+165)%330+330)%330-165,42+(i%4)*6,p.z+((i*47-p.z+150)%300+300)%300-150);e.setLocalScale(35+(i%3)*12,3+cloud*9,15+(i%3)*5);});
  shadows.update(dt,clouds,cloud,daylight);
  if(terrain?.meadow){const snow=state.snow*.7,wet=state.wet*.12;terrain.meadow.diffuse.set(.56+snow*.4-wet,.68+snow*.28-wet,.49+snow*.48-wet);terrain.meadow.update();}
  if(terrain?.road){const snow=state.snow*.75,wet=state.wet*.2;terrain.road.diffuse.set(.68+snow*.27-wet,.66+snow*.29-wet,.53+snow*.4-wet);terrain.road.shininess=5+state.wet*80;terrain.road.specular.set(state.wet*.5,state.wet*.5,state.wet*.5);terrain.road.update();}
  precipitation.enabled=profile.fall;if(precipitation.enabled){const count=store.state.profile.quality==='low'||reduced()?70:max;const t=state.elapsed,snow=state.type==='snow',hail=state.type==='hail',speed=snow?1.7:hail?15:19,tail=snow||hail?.09:.65;
   for(let i=0;i<max;i++){const x=p.x+(i*13.37%32)-16+Math.sin(t*.5+i)*profile.wind,z=p.z+(i*7.91%32)-16,y=groundHeight(x,z)+((i*2.37-t*speed)%16+16)%16,w=snow?.07:hail?.05:.018,k=i*9;positions.set(i<count&&(!driving()||Math.hypot(x-p.x,z-p.z)>4)?[x-w,y,z,x+w,y,z,x+profile.wind*.2,y+tail,z+.02]:[0,-1000,0,0,-1000,0,0,-1000,0],k);}mesh.setPositions(positions);mesh.update(pc.PRIMITIVE_TRIANGLES);}
  const tx=215+Math.sin(state.elapsed*.03)*20,tz=-290;funnel.forEach((e,i)=>{e.enabled=state.type==='tornado';if(e.enabled){e.setPosition(tx+Math.sin(state.elapsed+i*.3)*i*.2,groundHeight(tx,tz)+i*3,tz);e.setLocalScale(1+i*1.15,4,1+i*1.15);e.setEulerAngles(0,state.elapsed*35+i*15,0);}});
  rainbow.enabled=state.type==='rainbow';rainbow.setPosition(p.x-10,groundHeight(p.x,p.z)+4,p.z-95);
  if(Math.floor(state.elapsed)!==ui){ui=Math.floor(state.elapsed);const mins=Math.floor(state.clock/1200*1440),clock=String(Math.floor(mins/60)).padStart(2,'0')+':'+String(mins%60).padStart(2,'0');badge.textContent=WEATHER_NAMES[state.type];report.textContent=WEATHER_NAMES[state.type]+' / '+clock;}
 }
 return {update,snapshot:()=>({...state}),storm:()=>['thunder','tornado'].includes(state.type),grip:()=>Math.max(.45,1-state.wet*.25-state.snow*.3-(state.type==='hail'?.15:0))};
}
