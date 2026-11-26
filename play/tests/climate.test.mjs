import {garageObstacles} from '../garage-layout.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeWeather,stepWeather,chooseWeather,WEATHER_TYPES} from '../weather-state.mjs';
import {normalizeSave,parseImport,advanceJourney} from '../session.mjs';
import {normalizeDrive} from '../drive-session.mjs';
import {groundHeight,ROADS,WORLD_BOUNDS} from '../terrain.mjs';
import {createCar,stepCar} from '../vehicle-physics.mjs';
test('weather continuation survives export/import without changing the next front',()=>{
 const a=normalizeWeather();stepWeather(a,88);const b=parseImport(JSON.stringify(normalizeSave({weather:a}))).weather;
 stepWeather(a,600);stepWeather(b,600);assert.deepEqual(a,b);assert.ok(WEATHER_TYPES.includes(a.type));
});
test('manual weather holds, transitions gradually and accumulation dries',()=>{
 const s=normalizeWeather({mode:'snow'});stepWeather(s,60);assert.equal(s.type,'snow');assert.ok(s.snow>.3);assert.equal(s.blend,1);
 s.mode='rain';stepWeather(s,.1);assert.equal(s.previous,'snow');assert.ok(s.blend<.1);stepWeather(s,100);assert.ok(s.wet>.8);
 s.mode='clear';stepWeather(s,600);assert.equal(s.wet,0);assert.equal(s.snow,0);
});
test('invalid weather data stays finite and paused time does not advance',()=>{
 const s=normalizeWeather({type:'bad',seed:NaN,remaining:-100,clock:Infinity});const before=structuredClone(s);stepWeather(s,NaN);stepWeather(s,0);assert.deepEqual(s,before);chooseWeather(s,'bogus');assert.deepEqual(s,before);
});
test('new region, camera, cabin, damage and weather round-trip together',()=>{
 const s=normalizeSave({position:{x:-140,z:-330,y:24.2,yaw:57,pitch:-14},weather:{type:'hail',clock:610},drive:{driving:true,car:{x:120,z:-355,yaw:1.2,distance:900},completedLaps:3,checkpoint:2,survival:{health:72,vehicleDamage:18}},journey:{stage:7}});
 assert.deepEqual(parseImport(JSON.stringify(s)),s);assert.equal(s.position.z,-330);assert.equal(s.drive.driving,true);assert.equal(s.drive.car.speed,0);assert.equal(s.drive.completedLaps,3);assert.equal(s.journey.ink,175);
 assert.equal(normalizeDrive({driving:true,survival:{health:0}}).driving,false);
});
test('second chapter rewards stay ordered across old chapter completion',()=>{
 let s=normalizeSave({journey:{stage:4}});assert.equal(advanceJourney(s,6).journey.stage,4);
 for(let i=4;i<8;i++)s=advanceJourney(s,i);assert.equal(s.journey.stage,8);assert.equal(s.journey.ink,200);assert.equal(advanceJourney(s,7).journey.ink,200);
});
test('northbound car exits the garage corridor beyond the old perimeter',()=>{
 const obstacles=garageObstacles();
 const car=createCar();for(let i=0;i<60*12;i++)stepCar(car,{throttle:1},1/60,obstacles);
 assert.ok(car.z<-140,JSON.stringify(car));assert.equal(car.hit,false);
});
test('every road centerline remains inside shared bounds with traversable grades',()=>{
 for(const road of ROADS)for(let n=1;n<road.length;n++){const [ax,az]=road[n-1],[bx,bz]=road[n],len=Math.hypot(bx-ax,bz-az);let prior=groundHeight(ax,az);
  for(let d=1;d<=Math.ceil(len);d++){const t=Math.min(1,d/len),x=ax+(bx-ax)*t,z=az+(bz-az)*t,y=groundHeight(x,z);assert.ok(x>WORLD_BOUNDS.minX+3&&x<WORLD_BOUNDS.maxX-3&&z>WORLD_BOUNDS.minZ+3);assert.ok(Math.abs(y-prior)<.8);prior=y;}}
});
