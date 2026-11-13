// Deterministic crash, damage, ejection and recovery rules; no browser or renderer dependency.
export const CRASH_TUNING=Object.freeze({low:1.2,medium:4,high:8,eject:11.5,cooldown:.45,deathDelay:2.2,knockout:1.8,vehicleDisable:100,gravity:18});
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const magnitude=v=>typeof v==='number'&&Number.isFinite(v)?Math.abs(v):v&&Number.isFinite(v.x)&&Number.isFinite(v.y)&&Number.isFinite(v.z)?Math.hypot(v.x,v.y,v.z):0;
export function createSurvivalState(options={}){return {health:100,vehicleDamage:0,vehicleDisabled:false,player:'alive',airborne:false,knockedOut:0,deadFor:0,cooldown:0,hitPause:0,slowdown:0,cameraShake:0,velocity:{x:0,y:0,z:0},position:{x:0,y:0,z:0},lastSeverity:'none',...options};}
export function classifyImpact({relativeVelocity=0,impulse=0,normal=null,mass=1200}={},tuning=CRASH_TUNING){
 let speed=magnitude(relativeVelocity);if(normal&&typeof relativeVelocity==='object'&&Number.isFinite(normal.x)&&Number.isFinite(normal.y)&&Number.isFinite(normal.z)){const n=magnitude(normal);if(n>0)speed=Math.abs((relativeVelocity.x*normal.x+relativeVelocity.y*normal.y+relativeVelocity.z*normal.z)/n);}
 const impulseSpeed=magnitude(impulse)/Math.max(1,Number.isFinite(mass)?mass:1200);const severity=Math.max(speed,impulseSpeed);
 return {severity,band:severity>=tuning.high?'high':severity>=tuning.medium?'medium':severity>=tuning.low?'low':'none',speed};
}
export function applyImpact(state,impact={},options={}){
 const tuning={...CRASH_TUNING,...options};if(state.player==='dead'||state.cooldown>0)return {accepted:false,band:'none',ejected:false};
 const result=classifyImpact(impact,tuning);if(result.band==='none')return {accepted:false,...result,ejected:false};
 state.cooldown=tuning.cooldown;state.lastSeverity=result.band;
 const damage=result.band==='high'?Math.min(65,18+result.severity*2.4):result.band==='medium'?Math.min(24,5+result.severity*2):Math.min(6,result.severity*2);
 state.health=clamp(state.health-damage,0,100);state.vehicleDamage=clamp(state.vehicleDamage+(result.band==='high'?Math.min(58,result.severity*3.2):result.band==='medium'?result.severity*2:result.severity),0,100);state.vehicleDisabled=state.vehicleDamage>=tuning.vehicleDisable;
 if(result.band==='high'){state.hitPause=.12;state.slowdown=.7;state.cameraShake=.4;}else if(result.band==='medium'){state.hitPause=.045;state.slowdown=.35;state.cameraShake=.16;}
 const driving=impact.driving===true||impact.riding===true;const ejected=driving&&result.speed>=tuning.eject&&result.band==='high';
 if(ejected){const dir=impact.direction||{x:0,z:-1};const len=Math.hypot(dir.x||0,dir.z||0)||1;const force=clamp(result.speed*.48,4,12);state.velocity={x:(dir.x||0)/len*force,y:Math.max(3,result.speed*.24),z:(dir.z||0)/len*force};state.airborne=true;state.player='airborne';state.position={...(impact.position||{x:0,y:0,z:0})};if(state.health<=0)state.player='dead';else state.knockedOut=result.speed>=16?tuning.knockout:.9;}
 if(state.health<=0)state.player='dead';if(state.player==='dead')state.deadFor=0;
 return {accepted:true,...result,damage,ejected,dead:state.player==='dead'};
}
export function tickSurvival(state,dt,options={}){
 if(!Number.isFinite(dt)||dt<=0)return {respawned:false};const tuning={...CRASH_TUNING,...options};const elapsed=Math.min(dt,.1);
 state.cooldown=Math.max(0,state.cooldown-elapsed);state.hitPause=Math.max(0,state.hitPause-elapsed);state.slowdown=Math.max(0,state.slowdown-elapsed);state.cameraShake=Math.max(0,state.cameraShake-elapsed);
 if(state.player==='dead')state.deadFor+=elapsed;
 if(state.airborne){
  // Small swept steps prevent the ejected traveler crossing thin scenery.
  let left=elapsed;const clear=options.clearWalk||(()=>true);
  while(left>1e-8&&state.airborne){const h=Math.min(left,1/120);left-=h;
   state.velocity.y-=tuning.gravity*h;
   const x=state.position.x+state.velocity.x*h,z=state.position.z+state.velocity.z*h;
   if(clear(x,state.position.z))state.position.x=x;else state.velocity.x=0;
   if(clear(state.position.x,z))state.position.z=z;else state.velocity.z=0;
   state.position.y+=state.velocity.y*h;
   if(state.position.y<=0){
    state.health=clamp(state.health-Math.max(0,-state.velocity.y-4)*2,0,100);
    state.position.y=0;state.airborne=false;state.velocity={x:0,y:0,z:0};
    if(state.health===0){if(state.player!=='dead')state.deadFor=0;state.player='dead';}
    else state.player=state.knockedOut>0?'knocked-out':'grounded';
   }
  }
 }else if(state.player==='knocked-out'){state.knockedOut=Math.max(0,state.knockedOut-elapsed);if(state.knockedOut===0)state.player='grounded';}
 else if(state.player==='grounded')state.player='alive';
 return {respawned:state.player==='dead'&&!state.airborne&&state.deadFor>=tuning.deathDelay};
}
export function respawnSurvivor(state,checkpoint=null,start={x:0,y:0,z:0}){const p=checkpoint&&Number.isFinite(checkpoint.x)&&Number.isFinite(checkpoint.z)?checkpoint:start;Object.assign(state,{health:100,vehicleDamage:0,vehicleDisabled:false,player:'alive',airborne:false,knockedOut:0,deadFor:0,cooldown:0,hitPause:0,slowdown:0,cameraShake:0,velocity:{x:0,y:0,z:0},position:{x:p.x,y:p.y||0,z:p.z},lastSeverity:'none'});return {...state.position};}
