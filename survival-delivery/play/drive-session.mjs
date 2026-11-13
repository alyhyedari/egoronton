// Renderer-independent driving/survival session. Recovery never receives mission data.
import {BAY,createCar,stepCar,collides,exitPoint} from './vehicle-physics.mjs';
import {createSurvivalState,applyImpact,tickSurvival,respawnSurvivor,CRASH_TUNING} from './crash-state.mjs';
export const ROUTE=Object.freeze([
 Object.freeze({x:56,z:-42,yaw:-Math.PI/2}),Object.freeze({x:96,z:-42,yaw:Math.PI}),
 Object.freeze({x:96,z:6,yaw:Math.PI/2}),Object.freeze({x:56,z:6,yaw:0})
]);
export function createDriveSession(){return {car:createCar(),survival:createSurvivalState(),driving:false,checkpoint:0,routeDistance:0,completedLaps:0,recoveryAnchor:null};}
export const incapacitated=s=>s.survival.player!=='alive'&&s.survival.player!=='grounded';
export const movementScale=s=>s.survival.health<35?.65:s.survival.health<70?.85:1;
export const recoveryReady=s=>!s.survival.airborne&&(s.survival.player==='dead'?s.survival.deadFor>=CRASH_TUNING.deathDelay:!incapacitated(s)&&Math.abs(s.car.speed)<=.25);
export function stepDriveSession(s,input,dt,{obstacles=[],clearWalk=()=>true,active=true}={}){
 const events=[];
 if(!active||!Number.isFinite(dt)||dt<=0)return events;
 const elapsed=Math.min(dt,.1),wasLocked=incapacitated(s);
 tickSurvival(s.survival,elapsed,{clearWalk});
 if(wasLocked&&!incapacitated(s))events.push({type:'standing'});
 if(!s.driving||incapacitated(s))return events;
 const before=s.car.distance;
 if(s.survival.vehicleDisabled){s.car.speed=0;return events;}
 if(s.survival.hitPause>0)return events;
 stepCar(s.car,input,elapsed*(s.survival.slowdown>0?.55:1),obstacles);
 s.routeDistance+=s.car.distance-before;
 if(s.car.hit){
  const {hitDirection:d,hitSpeed:speed,hitNormal:normal}=s.car;
  const impact=applyImpact(s.survival,{relativeVelocity:{x:d.x*speed,y:0,z:d.z*speed},normal,driving:true,direction:d,position:{x:s.car.x,y:1,z:s.car.z}});
  if(impact.accepted){
   events.push({type:'impact',...impact});
   if(impact.ejected||impact.dead){
    s.driving=false;s.car.speed=0;
    if(!impact.ejected){const p=exitPoint(s.car,clearWalk)||{x:s.car.x,z:s.car.z};s.survival.position={...p,y:0};}
   }
  }
 }
 // A crash cannot also award a checkpoint in the same frame.
 if(!s.car.hit&&Math.hypot(s.car.x-ROUTE[s.checkpoint].x,s.car.z-ROUTE[s.checkpoint].z)<5){
  s.recoveryAnchor={...ROUTE[s.checkpoint]};s.checkpoint++;
  events.push({type:'checkpoint'});
  if(s.checkpoint===ROUTE.length){s.checkpoint=0;if(s.routeDistance>130){s.completedLaps++;events.push({type:'lap'});}s.routeDistance=0;}
 }
 return events;
}
export function recoverDriveSession(s,{obstacles=[],clearWalk=()=>true}={}){
 if(!recoveryReady(s))return null;
 // Revalidate both the car footprint and the pedestrian exit, even at a known checkpoint.
 const candidates=[s.recoveryAnchor,{...BAY,yaw:0}].filter(Boolean);
 for(const anchor of candidates){
  const car={...createCar(),...anchor,distance:s.car.distance};
  if(collides(car,obstacles))continue;
  const point=exitPoint(car,clearWalk);if(!point)continue;
  Object.assign(s.car,car);s.driving=false;
  const position=respawnSurvivor(s.survival,{...point,y:0});
  return position;
 }
 return null; // No unsafe teleport if scenery has changed.
}
