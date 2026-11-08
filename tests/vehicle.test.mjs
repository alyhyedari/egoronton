import test from 'node:test';
import assert from 'node:assert/strict';
import {createCar,stepCar,collides,footprint,exitPoint,normalizeGarage,VEHICLE,DRIVE_BOUNDS} from '../play/vehicle-physics.mjs';
import {normalize} from '../play/experience.mjs';
const simulate=(car,input,n=120,obs=[])=>{for(let i=0;i<n;i++)stepCar(car,input,1/120,obs);return car;};
test('controls sanitize values and reject duplicate/reserved bindings',()=>{
 assert.equal(normalize({size:999,sensitivity:-1,hand:'left'}).size,136);
 assert.equal(normalize({sensitivity:-1}).sensitivity,.4);
 const keys=normalize().keys;keys.forward='KeyQ';assert.equal(normalize({keys}).keys.forward,'KeyQ');
 keys.back='KeyQ';assert.equal(normalize({keys}).keys.forward,'KeyW');
 keys.back='Escape';assert.equal(normalize({keys}).keys.back,'KeyS');
 assert.deepEqual(normalize(null),normalize());
});
test('garage sanitizes persisted data',()=>{
 assert.deepEqual(normalizeGarage(null),{version:1,paint:'azure',height:'low',camera:'chase',language:'en',laps:0});
 assert.equal(normalizeGarage({paint:'__proto__',laps:Infinity}).paint,'azure');
 assert.equal(normalizeGarage({language:'fa'}).language,'fa');
 assert.equal(normalizeGarage({language:'en'}).language,'en');
 assert.equal(normalizeGarage({language:'invalid'}).language,'en');
 assert.equal(normalizeGarage({laps:4.9}).laps,4);
});
test('throttle, reverse, braking, coasting and speed caps',()=>{
 const c=simulate(createCar(),{throttle:1});assert(c.z<8&&c.speed>0&&c.speed<=VEHICLE.maxSpeed);
 const speed=c.speed;simulate(c,{});assert(c.speed<speed);
 simulate(c,{brake:true});assert.equal(c.speed,0);
 simulate(c,{throttle:-1});assert(c.speed<0&&c.speed>=-VEHICLE.reverseSpeed);
});
test('steering affects heading and opposite pedal brakes before reversing',()=>{
 const c=simulate(createCar(),{throttle:1,steer:1},60);assert(c.yaw<0&&c.x>56);
 const before=c.speed;stepCar(c,{throttle:-1},.01);assert(c.speed>0&&c.speed<before);
});
test('collision and course bounds block the full footprint',()=>{
 const wall=[{x:56,z:0,w:8,d:.5}],c=simulate(createCar(),{throttle:1},900,wall);
 assert(c.hit);assert.equal(c.speed,0);assert(!collides(c,wall));assert(footprint(c).every(p=>p.z>=.5));
 const d=simulate(createCar(),{throttle:1},3000);assert(d.hit);assert(footprint(d).every(p=>p.z>=DRIVE_BOUNDS.minZ));
});
test('invalid or very large time steps are bounded',()=>{
 const c=createCar();stepCar(c,{throttle:1},NaN);assert.deepEqual(c,createCar());
 const a=createCar(),b=createCar();stepCar(a,{throttle:1},999);stepCar(b,{throttle:1},.1);assert.deepEqual(a,b);
});
test('safe exit falls back to the other side or refuses',()=>{
 const c=createCar();assert.equal(exitPoint(c,()=>false),null);
 assert.deepEqual(exitPoint(c,x=>x>56),{x:58,z:8});
});
