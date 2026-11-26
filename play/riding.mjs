import {RIDES,STABLES,normalizeRiding,ridePace} from './riding-state.mjs';
import {stepCar,collides,exitPoint} from './vehicle-physics.mjs';
import {groundHeight} from './terrain.mjs';
export function setupRiding({pc,app,shape,mat,player,camera,obstacles,store,active,carDriving,carObstacle,clearWalk,caption,resetInput}){
 const saved=normalizeRiding(store.state.riding),ink=mat('#263b3a'),saddle=mat('#473b33'),chrome=mat('#b5c9bd'),wheel=mat('#182b2b');
 let mounted=null,near=null,lookOrigin=0,time=0,brake=false,boost=false;
 const tr=(en,fa)=>store.state.profile.language==='fa'?fa:en;
 const items=STABLES.map((v,i)=>{
  const model=RIDES[v.kind],state={...saved.vehicles[i],speed:0,steer:0,distance:0},root=new pc.Entity(v.id);app.root.addChild(root);
  const body=mat(model.color),parts=[],wheels=[];
  const part=(type,x,y,z,a,b,c,m=body)=>shape(type,x,y,z,a,b,c,m,root);
  if(v.kind==='horse'){
   part('sphere',0,1.15,0,.8,.95,1.9);part('capsule',0,1.7,-.67,.44,1.15,.5);part('sphere',0,2.14,-.93,.38,.48,.73);part('sphere',0,1.64,-.44,.16,.9,.18,ink);
   for(const x of [-.16,.16])part('cone',x,2.49,-.86,.15,.38,.16);for(const x of [-.215,.215])part('sphere',x,2.2,-1.02,.045,.06,.06,ink);
   part('box',0,1.63,.18,.85,.15,.65,saddle);part('capsule',0,.95,1,.18,1,.18,ink).setLocalEulerAngles(30,0,0);
   for(const x of [-.27,.27])for(const z of [-.62,.62]){const pivot=new pc.Entity();root.addChild(pivot);pivot.setLocalPosition(x,1.05,z);shape('capsule',0,-.46,0,.15,.95,.16,body,pivot);shape('box',0,-.93,-.04,.18,.16,.26,ink,pivot);parts.push(pivot);}
   for(const x of [-.2,.2])part('box',x,1.89,-.25,.025,.025,1.1,saddle).setLocalEulerAngles(-17,0,0);
  }else{
   const motor=v.kind==='motorcycle',radius=motor?.39:.42;
   for(const z of [-.78,.78]){const pivot=new pc.Entity();root.addChild(pivot);pivot.setLocalPosition(0,radius,z);const tire=shape('cylinder',0,0,0,radius*2,motor?.2:.1,radius*2,wheel,pivot);tire.setLocalEulerAngles(0,0,90);const rim=shape('cylinder',0,0,0,radius*1.4,motor?.21:.11,radius*1.4,chrome,pivot);rim.setLocalEulerAngles(0,0,90);shape('box',0,0,0,motor?.22:.12,.04,radius*1.3,ink,pivot);wheels.push(pivot);}
   part('box',0,.7,0,.13,.16,1.3);part('box',0,.87,-.42,.08,.8,.08,chrome).setLocalEulerAngles(-20,0,0);
   part('box',0,1.23,-.65,.85,.065,.07,ink);part('box',0,1.04,.35,motor?.5:.26,.13,motor?.75:.35,saddle);
   part('box',0,.82,.26,.07,.45,.07,chrome);part('box',0,.58,.05,.65,.05,.17,ink);
   if(motor){part('sphere',0,1,-.12,.54,.45,.72);part('box',0,.57,0,.45,.45,.65,ink);part('sphere',0,1.12,-.91,.25,.25,.12,chrome);part('cylinder',.28,.48,.43,.12,.8,.12,chrome).setLocalEulerAngles(90,0,0);}
  }
  const solid={x:state.x,z:state.z,w:model.halfWidth,d:model.halfLength,ride:v.id};
  // Validate restored positions before introducing this ride into shared collision geometry.
  if(collides(state,obstacles,undefined,model)){state.x=v.x;state.z=v.z;state.yaw=0;}
  solid.x=state.x;solid.z=state.z;obstacles.push(solid);
  return {...v,model,state,root,parts,wheels,solid};
 });
 const hud=document.createElement('section');hud.id='ride-hud';hud.hidden=true;hud.innerHTML='<div id="ride-name"></div><strong id="ride-speed"></strong><progress id="ride-energy" max="1" aria-label="Stamina"></progress><p id="ride-hint"></p><div><button id="ride-boost" aria-pressed="false"></button><button id="ride-brake"></button><button id="ride-exit"></button></div>';document.body.append(hud);
 const prompt=document.createElement('button');prompt.id='ride-prompt';prompt.hidden=true;document.body.append(prompt);
 const $=id=>document.getElementById(id);
 function snapshot(){return normalizeRiding({active:mounted?.id,vehicles:items.map(v=>v.state)});}
 function persist(){store.patch({riding:snapshot()});}
 function dismount(){if(!mounted)return false;if(Math.abs(mounted.state.speed)>.7){caption(tr('Brake before dismounting','برای پیاده‌شدن ترمز کن'));return true;}const point=exitPoint(mounted.state,clearWalk);if(!point){caption(tr('Move to an open space to dismount','برای پیاده‌شدن به فضای باز برو'));return true;}player.setPosition(point.x,groundHeight(point.x,point.z),point.z);mounted=null;brake=boost=false;document.body.classList.remove('riding');hud.hidden=true;resetInput();document.getElementById('world').focus();persist();return true;}
 function interact(yaw=0){if(!active())return false;if(mounted)return dismount();if(!near||carDriving())return false;mounted=near;lookOrigin=yaw;mounted.state.speed=0;document.body.classList.add('riding');resetInput();document.getElementById('world').focus();persist();caption(tr('WASD to ride / Shift for pace / Space to brake / E to dismount','حرکت WASD / سرعت Shift / ترمز Space / پیاده‌شدن E'));return true;}
 prompt.onclick=()=>interact(lastYaw);$('ride-exit').onclick=dismount;$('ride-boost').onclick=()=>{boost=!boost;$('ride-boost').setAttribute('aria-pressed',String(boost));};
 $('ride-brake').onpointerdown=e=>{e.preventDefault();brake=true;e.currentTarget.setPointerCapture(e.pointerId);};for(const event of ['pointerup','pointercancel','lostpointercapture'])$('ride-brake').addEventListener(event,()=>brake=false);
 let lastYaw=0,restoreLook=!!saved.active;
 if(saved.active&&!carDriving()){mounted=items.find(v=>v.id===saved.active);document.body.classList.add('riding');}
 function pose(v,dt){const c=v.state,y=groundHeight(c.x,c.z),grade=(groundHeight(c.x-Math.sin(c.yaw),c.z-Math.cos(c.yaw))-groundHeight(c.x+Math.sin(c.yaw),c.z+Math.cos(c.yaw)))/2;
  v.root.setPosition(c.x,y,c.z);v.root.setEulerAngles(Math.atan(grade)*180/Math.PI,c.yaw*180/Math.PI,v.kind==='horse'?0:-c.steer*Math.min(12,Math.abs(c.speed)));
  v.wheels.forEach((w,i)=>{w.rotateLocal(c.speed*dt*140,0,0);});v.parts.forEach((p,i)=>p.setLocalEulerAngles(Math.sin(time*(Math.abs(c.speed)>.5?8:1)+i*Math.PI/2)*Math.min(28,Math.abs(c.speed)*3),0,0));
  v.solid.x=c.x;v.solid.z=c.z;const a=Math.abs(Math.cos(c.yaw)),b=Math.abs(Math.sin(c.yaw));v.solid.w=v.model.halfWidth*a+v.model.halfLength*b;v.solid.d=v.model.halfLength*a+v.model.halfWidth*b;
 }
 items.forEach(v=>pose(v,0));
 return {snapshot,interact,isRiding:()=>!!mounted,kind:()=>mounted?.kind||null,speed:()=>mounted?.state.speed||0,clearInput:()=>{brake=boost=false;},home:()=>{if(mounted){mounted.state.speed=0;dismount();}return !mounted;},
 update(dt,input,yaw){lastYaw=yaw;if(restoreLook){lookOrigin=yaw;restoreLook=false;}const on=active();hud.hidden=!on||!mounted;prompt.hidden=true;if(!on)return;time+=dt;
  if(mounted){const v=mounted,pace=ridePace(v.kind,v.state.stamina,input.run||boost,dt,Math.abs(v.state.speed)>1);v.state.stamina=pace.stamina;
   stepCar(v.state,{...input,brake:input.brake||brake},dt,[...obstacles.filter(o=>o!==v.solid),carObstacle()],undefined,{...v.model,maxSpeed:v.model.maxSpeed*pace.scale});pose(v,dt);player.setPosition(v.state.x,groundHeight(v.state.x,v.state.z),v.state.z);
   $('ride-name').textContent=tr(v.model.name,v.model.fa);$('ride-speed').textContent=Math.round(Math.abs(v.state.speed)*3.6)+' KM/H';$('ride-energy').hidden=v.kind==='motorcycle';$('ride-energy').value=v.state.stamina;$('ride-hint').textContent=tr('Shift / faster pace   Space / brake','Shift سرعت بیشتر   Space ترمز');$('ride-boost').textContent=tr('Faster pace','سرعت بیشتر');$('ride-brake').textContent=tr('Brake','ترمز');$('ride-exit').textContent=tr('Dismount E','پیاده‌شدن E');
  }else if(!carDriving()){const p=player.getPosition();near=items.find(v=>Math.hypot(p.x-v.state.x,p.z-v.state.z)<3.6&&Math.abs(p.y-groundHeight(v.state.x,v.state.z))<1);if(near){prompt.hidden=false;prompt.textContent=tr('Ride '+near.model.name+' / E','سوار '+near.model.fa+' / E');}}
 },updateCamera(yaw,pitch,reduced){if(!mounted)return;const v=mounted,c=v.state,look=Math.max(-85,Math.min(85,yaw-lookOrigin)),bob=reduced?0:Math.sin(time*8)*Math.min(.045,Math.abs(c.speed)*.004),s=Math.sin(c.yaw),co=Math.cos(c.yaw);camera.setPosition(c.x+s*.18,groundHeight(c.x,c.z)+v.model.eye+bob,c.z+co*.18);camera.camera.fov=72;camera.setEulerAngles(Math.max(-45,Math.min(45,pitch)),c.yaw*180/Math.PI+look,0);}};
}
