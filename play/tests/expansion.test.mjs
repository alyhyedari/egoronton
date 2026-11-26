import test from 'node:test';
import assert from 'node:assert/strict';
import {createWalker,stepWalker,deployParachute,WALK_TUNING} from '../movement.mjs';
import {RIDES,normalizeRiding,ridePace} from '../riding-state.mjs';
import {createCar,stepCar,collides,exitPoint} from '../vehicle-physics.mjs';
import {createCombat,fireCombat,tickCombat,spreadFor,shotOffsets,equipCombat,WEAPONS,reloadCombat} from '../adventure-state.mjs';
import {TRAILS,startTrail,stepTrail,normalizeTrails} from '../trails-state.mjs';
import {normalizeSave,parseImport} from '../session.mjs';

test('air strafing retains forward momentum and stays below the global speed limit',()=>{
 const s=createWalker();stepWalker(s,{z:-1,run:true,jumpPressed:true},.1);const forward=s.vz;
 for(let i=0;i<8;i++)stepWalker(s,{x:1},1/120);
 assert.ok(s.vx>0);assert.equal(s.vz,forward);assert.ok(Math.hypot(s.vx,s.vz)<=WALK_TUNING.max);
});
test('a third press buffers a landing hop without granting a third air jump',()=>{
 const s=createWalker();Object.assign(s,{y:.009,vy:-1,grounded:false,jumps:2,coyote:0});
 stepWalker(s,{jumpPressed:true,z:-1},1/120);assert.ok(s.grounded);stepWalker(s,{z:-1},1/60);assert.equal(s.grounded,false);assert.equal(s.jumps,1);
});
test('canopy steering moves toward heading and flaring reduces descent and forward speed',()=>{
 function glide(brake){const s=createWalker();Object.assign(s,{grounded:false,y:40,vy:-20,coyote:0});deployParachute(s);for(let i=0;i<180;i++)stepWalker(s,{forwardZ:-1,brake},1/60);return s;}
 const normal=glide(false),flare=glide(true);assert.ok(normal.z<-10);assert.ok(flare.y>normal.y+2);assert.ok(Math.abs(flare.vz)<Math.abs(normal.vz));assert.ok(flare.vy>=-1.1);
});
test('all ride profiles brake without reversing and cannot tunnel through a thin wall',()=>{
 for(const model of Object.values(RIDES)){const c=createCar();c.x=0;c.z=0;const walls=[{x:0,z:-10,w:5,d:.02}];for(let i=0;i<300;i++)stepCar(c,{throttle:1},1/30,walls,undefined,model);assert.ok(c.z>-10);assert.equal(collides(c,walls,undefined,model),false);c.speed=model.maxSpeed;for(let i=0;i<800;i++){stepCar(c,{brake:true},1/120,[],undefined,model);assert.ok(c.speed>=0);}assert.equal(c.speed,0);}
});
test('bicycle, horse and motorcycle retain distinct speed profiles across frame rates',()=>{
 for(const model of Object.values(RIDES)){function travel(hz){const c=createCar();for(let i=0;i<hz*3;i++)stepCar(c,{throttle:1,steer:.15},1/hz,[],undefined,model);return c;}const a=travel(30),b=travel(120);assert.ok(Math.hypot(a.x-b.x,a.z-b.z)<.05);assert.ok(a.speed<=model.maxSpeed);}
 assert.ok(RIDES.motorcycle.maxSpeed>RIDES.bicycle.maxSpeed*2);
});
test('ride stamina drains while sprinting and recovers during a rest',()=>{
 for(const kind of ['horse','bicycle']){let s=1;for(let i=0;i<100;i++)s=ridePace(kind,s,true,.1,true).stamina;assert.ok(s<.5);const low=s;for(let i=0;i<100;i++)s=ridePace(kind,s,false,.1,false).stamina;assert.ok(s>low);}
 assert.equal(ridePace('motorcycle',1,true,.1,true).stamina,1);
});
test('dismount chooses a clear side and refuses a fully blocked exit',()=>{const c=createCar();assert.equal(exitPoint(c,()=>false),null);const exit=exitPoint(c,(x)=>x>c.x);assert.ok(exit.x>c.x);});
test('legacy saves gain equipment slots without changing their old ammunition',()=>{
 const s=normalizeSave({adventure:{ammo:[7,2],reserve:[12,5]},riding:{vehicles:{find:42}}});assert.deepEqual(s.adventure.ammo,[7,2,30,12]);assert.equal(s.adventure.reserve[0],12);assert.equal(s.riding.vehicles.length,6);assert.equal(s.riding.active,null);
 const n=normalizeSave({...s,riding:{...s.riding,active:'town-horse'},trails:{found:['town','town','invented'],records:{horse:123},finishes:1}});assert.deepEqual(parseImport(JSON.stringify(n)),n);assert.deepEqual(n.trails.found,['town']);
});
test('movement and jumping worsen accuracy while a stationary crouched burst settles',()=>{
 const s=createCombat(),still=spreadFor(s),moving=spreadFor(s,{speed:6}),air=spreadFor(s,{speed:6,grounded:false});assert.ok(moving>still);assert.ok(air>moving);fireCombat(s);assert.ok(spreadFor(s,{speed:6,crouch:true,aim:true})<spreadFor(s,{speed:6}));for(let i=0;i<20;i++)tickCombat(s,.1);assert.equal(s.burst,0);assert.ok(s.recoilPitch<.01);
});
test('four weapons have bounded deterministic spread and shotgun uses eight separate pellets',()=>{
 for(let i=0;i<4;i++){const s=createCombat({weapon:i});assert.ok(fireCombat(s));const offsets=shotOffsets(s,{speed:3});assert.deepEqual(offsets,shotOffsets(s,{speed:3}));assert.equal(offsets.length,WEAPONS[i].pellets);assert.ok(offsets.every(o=>Math.hypot(o.x,o.y)<=spreadFor(s,{speed:3})));}
 assert.equal(WEAPONS[1].pellets,8);assert.equal(WEAPONS[3].automatic,false);
});
test('reload cannot move ammunition to another weapon and weapon selection is validated',()=>{
 const s=createCombat();fireCombat(s);assert.ok(reloadCombat(s));assert.equal(equipCombat(s,2),false);for(let i=0;i<30;i++)tickCombat(s,.1);assert.equal(s.ammo[0],24);assert.equal(s.reserve[0],95);assert.ok(equipCombat(s,3));assert.equal(equipCombat(s,9),false);
});
test('trail gates enforce order, ride class and ground proximity; result state is normalized',()=>{
 const trail=TRAILS.find(t=>t.id==='horse'),s=startTrail('horse'),[x,z]=trail.points[0];assert.equal(stepTrail(s,{x,z},'car',.1),false);assert.equal(stepTrail(s,{x,z,altitude:10},'horse',.1),false);assert.equal(s.index,0);
 for(const [x,z] of trail.points)assert.ok(stepTrail(s,{x,z,altitude:0},'horse',.1));assert.ok(s.complete);assert.equal(stepTrail(s,{x,z},'horse',.1),false);assert.equal(startTrail('missing'),null);
 assert.deepEqual(normalizeTrails({records:{horse:NaN,car:-3},found:['town','town']}),{records:{},found:['town'],finishes:0});
});
