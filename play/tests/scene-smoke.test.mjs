import test from 'node:test';
import assert from 'node:assert/strict';
import * as pc from '../vendor/playcanvas.mjs';
import {setupRiding} from '../riding.mjs';
import {setupCanopy} from '../canopy.mjs';
import {setupGlideStations,GLIDE_STATIONS} from '../glide-stations.mjs';
import {createWalker} from '../movement.mjs';
import {groundHeight} from '../terrain.mjs';
import {normalizeSave} from '../session.mjs';
import {setupAdventure} from '../adventure.mjs';
// Actual engine transforms, with an inert DOM and no GPU: this tests scene wiring,
// not shader output, browser input dispatch or responsive layout.
function fixture(){
 const previous=globalThis.document,previousWindow=globalThis.window,nodes=new Map();
 class Element{constructor(){this.classList={add(){},remove(){},toggle(){}};this.dataset={};this.style={setProperty(){}};}set id(v){nodes.set(v,this);}set innerHTML(v){for(const [,id] of v.matchAll(/id="([^"]+)"/g))nodes.set(id,new Element());}append(){}addEventListener(){}setAttribute(){}setPointerCapture(){}focus(){} }
 globalThis.document={createElement:()=>new Element(),getElementById:id=>{if(!nodes.has(id))nodes.set(id,new Element());return nodes.get(id);},body:new Element(),addEventListener(){}};globalThis.window={addEventListener(){}};
 class Entity extends pc.Entity{addComponent(type,options){if(type==='light'){this.light={...options};return;}return super.addComponent(type,options);}}
 const app={root:new pc.Entity()},camera=new pc.Entity(),player=new pc.Entity();app.root.addChild(camera);app.root.addChild(player);camera.camera={fov:68};
 const shape=(type,x,y,z,sx,sy,sz,m,parent=app.root)=>{const e=new pc.Entity();e.render={material:m};e.setLocalPosition(x,y,z);e.setLocalScale(sx,sy,sz);parent.addChild(e);return e;};
 const store={state:normalizeSave(),patch(p){this.state=normalizeSave({...this.state,...p});}};
 return {pc:{...pc,Entity},app,camera,player,shape,mat:x=>x,store,restore:()=>{globalThis.document=previous;globalThis.window=previousWindow;}};
}
test('mounted scene entry, motion, first-person camera and safe exit use the same position',()=>{
 const f=fixture();try{const obstacles=[];f.player.setPosition(44,0,15);
  const rides=setupRiding({...f,obstacles,active:()=>true,carDriving:()=>false,carObstacle:()=>({x:56,z:8,w:1.16,d:2.55}),clearWalk:(x,z)=>!obstacles.some(o=>Math.abs(x-o.x)<o.w+.28&&Math.abs(z-o.z)<o.d+.28),caption(){},resetInput(){}});
  rides.update(.016,{},0);assert.ok(rides.interact(0));assert.equal(rides.kind(),'bicycle');for(let i=0;i<30;i++)rides.update(1/60,{throttle:1,steer:.5,grip:1},0);assert.ok(f.player.getPosition().z<12);
  rides.updateCamera(0,0,true);assert.ok(Math.abs(f.camera.getPosition().y-f.player.getPosition().y-1.55)<.001);
  for(let i=0;i<100;i++)rides.update(1/60,{brake:true},0);assert.ok(rides.interact());assert.equal(rides.isRiding(),false);assert.equal(f.store.state.riding.active,null);assert.ok(Math.abs(f.player.getPosition().x-44)>1);
 }finally{f.restore();}
});
test('combat scene switches four models and semi-auto requires another trigger press',()=>{
 const f=fixture();try{f.store.state.profile.music=false;f.camera.setPosition(0,1.65,0);
  const combat=setupAdventure({...f,active:()=>true,driving:()=>false,clearWalk:()=>true,pause(){},resume(){},caption(){},parachute(){},motion:()=>({speed:0,grounded:true}),reduced:()=>true});
  combat.equip(3);for(let i=0;i<4;i++)combat.update(.1);const trigger=document.getElementById('fire-action');const event={preventDefault(){},currentTarget:trigger,pointerId:1};trigger.onpointerdown(event);assert.equal(combat.snapshot().ammo[3],11);for(let i=0;i<10;i++)combat.update(.1);assert.equal(combat.snapshot().ammo[3],11);trigger.onpointerdown(event);assert.equal(combat.snapshot().ammo[3],10);
  combat.equip(2);for(let i=0;i<3;i++)combat.update(.1);trigger.onpointerdown(event);for(let i=0;i<5;i++)combat.update(.1);assert.ok(combat.snapshot().ammo[2]<29);
 }finally{f.restore();}
});
test('sky lift uses engine transforms and opens the canopy at a reachable altitude',()=>{
 const f=fixture();try{const q=GLIDE_STATIONS[0],w=createWalker(q.x,q.z,groundHeight);f.player.setPosition(w.x,w.y,w.z);
  const lift=setupGlideStations({...f,walker:()=>w,active:()=>true,caption(){},resetInput(){}}),canopy=setupCanopy(f);lift.update(.016);assert.ok(lift.interact());for(let i=0;i<300;i++)lift.update(1/60);assert.equal(lift.lifting(),false);assert.ok(w.parachute);assert.equal(w.y,groundHeight(q.x,q.z)+30);assert.equal(w.grounded,false);canopy.update(w,true,false);
  assert.equal(document.getElementById('canopy-hint').hidden,false);
 }finally{f.restore();}
});
