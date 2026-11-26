import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeSave,mergeLegacy,advanceJourney,parseImport,MODES} from '../session.mjs';
import {createDriveSession,stepDriveSession,normalizeDrive,recoverDriveSession} from '../drive-session.mjs';
import {createCar,stepCar,collides} from '../vehicle-physics.mjs';
import {normalizeDelivery,advanceDelivery,PICKUP,DROPOFF} from '../delivery.mjs';
import {createWalker,stepWalker,WALK_TUNING} from '../movement.mjs';
import {groundHeight,WORLD_BOUNDS} from '../terrain.mjs';
import {scoreFor} from '../soundtrack.mjs';
import {translate} from '../language.mjs';
import {nextResolution} from '../performance.mjs';

test('old play and survival saves merge without losing completed places or discoveries',()=>{
 const s=mergeLegacy({studio:3,cafe:1,light0:true,found:['ribbon','recipe']},{studio:1,cafe:3,light1:true,found:['seed','recipe'],delivery:{stage:'carrying'}});
 assert.equal(s.neighborhood.studio,3);assert.equal(s.neighborhood.cafe,3);assert.equal(s.neighborhood.light0,true);assert.equal(s.neighborhood.light1,true);
 assert.deepEqual(s.neighborhood.found,['ribbon','recipe','seed']);assert.equal(s.neighborhood.delivery.stage,'carrying');
});
test('malformed save values cannot become invalid game state',()=>{
 const s=normalizeSave({profile:{mode:'__proto__',quality:'ultra'},journey:{stage:Infinity,ink:99999},position:{x:NaN,z:-999},garage:{paint:'<script>',laps:-1},drive:{car:{x:Infinity,yaw:NaN},checkpoint:999}});
 assert.equal(s.profile.mode,'story');assert.equal(s.profile.quality,'auto');assert.equal(s.journey.ink,0);assert.equal(s.position.x,0);assert.equal(s.position.z,WORLD_BOUNDS.minZ+3);assert.equal(s.garage.paint,'azure');assert.equal(s.drive.checkpoint,3);
 assert.deepEqual(normalizeSave(s),s);assert.doesNotThrow(()=>normalizeSave(null));
});
test('story rewards are ordered and cannot be replayed',()=>{
 let s=normalizeSave();assert.equal(advanceJourney(s,2).journey.stage,0);
 for(let i=0;i<8;i++){s=advanceJourney(s,i);const replay=advanceJourney(s,i);assert.equal(replay.journey.ink,(i+1)*25);s=replay;}
 assert.equal(advanceJourney(s,8).journey.ink,200);
});
test('import validates version, type and size before replacing progress',()=>{
 assert.throws(()=>parseImport('{broken'));assert.throws(()=>parseImport('{}'));assert.throws(()=>parseImport(' '.repeat(1000001)));
 const saved=normalizeSave({journey:{stage:3},garage:{paint:'cherry'}});assert.deepEqual(parseImport(JSON.stringify(saved)),saved);
});
test('collision physics stay inside bounds and are stable across frame rates',()=>{
 function drive(hz){const c=createCar();for(let i=0;i<hz*2;i++)stepCar(c,{throttle:1,steer:0},1/hz);return c;}
 const a=drive(30),b=drive(120);assert.ok(Math.abs(a.z-b.z)<.02);assert.ok(Math.abs(a.speed-b.speed)<.02);
 const car=createCar();for(let i=0;i<1500;i++)stepCar(car,{throttle:1,steer:.1},1/60);assert.equal(collides(car,[]),false);
});
test('only survival mode applies crash damage; paused sessions do not move',()=>{
 for(const [mode,{damage}] of Object.entries(MODES)){const s=createDriveSession();s.driving=true;s.car.z=-50;s.car.speed=13;
  for(let i=0;i<60;i++)stepDriveSession(s,{throttle:1,steer:0},1/60,{damage,obstacles:[{x:56,z:-55,w:12,d:.4}]});
  assert.equal(s.survival.health<100,mode==='survival');
 }
 const s=createDriveSession();s.driving=true;const before=structuredClone(s);stepDriveSession(s,{throttle:1},1,{active:false});assert.deepEqual(s,before);
});
test('BHop chains accelerate, cap speed and reset after grounded rest',()=>{
 const s=createWalker();for(let i=0;i<900;i++)stepWalker(s,{x:0,z:-1,run:true,jump:true},1/60);
 assert.ok(s.chain>=5);assert.ok(Math.hypot(s.vx,s.vz)>11);assert.ok(Math.hypot(s.vx,s.vz)<=WALK_TUNING.max+.001);
 for(let i=0;i<180;i++)stepWalker(s,{x:0,z:0},1/60);assert.equal(s.chain,0);assert.equal(s.y,0);assert.ok(Math.hypot(s.vx,s.vz)<.01);
});
test('jumping is frame-rate stable and cannot pass through walls',()=>{
 function run(hz){const s=createWalker();for(let i=0;i<hz*8;i++)stepWalker(s,{x:0,z:-1,run:true,jump:true},1/hz);return s;}
 assert.ok(Math.abs(run(30).z-run(120).z)<.1);
 const s=createWalker();for(let i=0;i<300;i++)stepWalker(s,{x:0,z:-1,run:true,jump:true},1/60,{clear:(x,z)=>z>-5});assert.ok(s.z>=-5);assert.equal(s.chain,0);
});
test('rounded terrain is finite, continuous and walkable at the town boundary',()=>{
 assert.equal(groundHeight(0,0),0);assert.equal(groundHeight(56,8),0);assert.ok(groundHeight(16,-219)>10);
 for(let x=WORLD_BOUNDS.minX;x<WORLD_BOUNDS.maxX;x+=3)for(let z=WORLD_BOUNDS.minZ;z<WORLD_BOUNDS.maxZ;z+=3){const h=groundHeight(x,z);assert.ok(Number.isFinite(h));assert.ok(Math.abs(groundHeight(x+.1,z)-h)<.085);assert.ok(Math.abs(groundHeight(x,z+.1)-h)<.085);}
 const s=createWalker(0,-116,groundHeight);for(let i=0;i<900;i++)stepWalker(s,{x:0,z:-1,run:true},1/60,{height:groundHeight});assert.ok(s.z<-190);assert.equal(s.y,groundHeight(s.x,s.z));
});
test('vehicles can leave the former circuit boundary without invisible barriers',()=>{
 const car=createCar();for(let i=0;i<900;i++)stepCar(car,{throttle:1,steer:0},1/60);assert.ok(car.z<-130);assert.equal(car.hit,false);
});
test('score changes between exploring, driving and danger; language defaults stay English',()=>{
 assert.ok(scoreFor({driving:true,speed:13}).bpm>scoreFor({forest:true}).bpm);assert.ok(scoreFor({danger:true}).energy>scoreFor({}).energy);
 assert.equal(translate('Story','fa'),'داستانی');assert.equal(translate('Story','en'),'Story');assert.equal(normalizeSave().profile.language,'en');
});
test('adaptive quality responds to sustained load without oscillating or exceeding limits',()=>{
 assert.equal(nextResolution(1.5,22),1.3);assert.equal(nextResolution(.8,15),.8);assert.equal(nextResolution(1.5,60),1.5);assert.equal(nextResolution(1,42),1);assert.equal(nextResolution(1.1,NaN),1.1);
});
test('switching to free roam clears injuries and restores control',()=>{
 const s=createDriveSession();Object.assign(s.survival,{health:0,player:'dead',vehicleDamage:100,vehicleDisabled:true});stepDriveSession(s,{},1/60,{damage:false});assert.equal(s.survival.health,100);assert.equal(s.survival.vehicleDisabled,false);assert.equal(s.survival.player,'alive');
});
test('parked save restores route and damage without restoring speed or unsafe airborne state',()=>{
 const s=normalizeDrive({car:{x:96,z:-30,speed:99,distance:100},checkpoint:2,routeDistance:80,survival:{health:45,vehicleDamage:61,airborne:true}});
 assert.equal(s.car.speed,0);assert.equal(s.driving,false);assert.equal(s.car.x,96);assert.equal(s.checkpoint,2);assert.equal(s.survival.health,45);assert.equal(s.survival.airborne,false);
 const p=recoverDriveSession(s);assert.ok(p);assert.equal(s.checkpoint,2);assert.equal(s.routeDistance,80);assert.equal(s.survival.health,100);
});
test('delivery requires the actual pickup and dropoff positions; recovery cannot reset it',()=>{
 const s=normalizeDelivery();assert.equal(advanceDelivery(s,{x:0,z:0},{driving:false,locked:false}),false);
 assert.equal(advanceDelivery(s,PICKUP,{driving:false,locked:false}),true);assert.equal(s.stage,'carrying');
 const drive=createDriveSession();recoverDriveSession(drive);assert.equal(s.stage,'carrying');
 assert.equal(advanceDelivery(s,DROPOFF,{driving:false,locked:false}),true);assert.equal(s.stage,'delivered');
 assert.equal(advanceDelivery(s,PICKUP,{driving:false,locked:false}),true);assert.equal(s.stage,'complete');assert.equal(advanceDelivery(s,PICKUP,{driving:false,locked:false}),false);
});
