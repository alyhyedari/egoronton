// Deterministic arcade vehicle model; no renderer or browser dependencies.
export const VEHICLE = Object.freeze({halfWidth:1.16, halfLength:2.55, wheelbase:3.1, maxSpeed:13, reverseSpeed:4});
export const BAY = Object.freeze({x:56,z:8});
export const DRIVE_BOUNDS = Object.freeze({minX:44,maxX:106,minZ:-54,maxZ:18});
export const PAINTS = Object.freeze({azure:'#208ba9',cherry:'#963e55',ivory:'#eadbb7'});
export function normalizeGarage(raw) {
 const o=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
 return {version:1,paint:Object.hasOwn(PAINTS,o.paint)?o.paint:'azure',height:['low','raised'].includes(o.height)?o.height:'low',camera:o.camera==='wide'?'wide':'chase',language:o.language==='fa'?'fa':'en',laps:Number.isFinite(o.laps)?Math.max(0,Math.min(1000000,Math.floor(o.laps))):0};
}
export function createCar(){return {x:BAY.x,z:BAY.z,yaw:0,speed:0,steer:0,distance:0,hit:false,hitSpeed:0,hitNormal:null,hitDirection:{x:0,z:-1}};}
export function footprint(car){
 const s=Math.sin(car.yaw),c=Math.cos(car.yaw),w=VEHICLE.halfWidth,l=VEHICLE.halfLength;
 return [[-w,-l],[w,-l],[w,l],[-w,l]].map(([x,z])=>({x:car.x+x*c+z*s,z:car.z-x*s+z*c}));
}
export function collisionContact(car,obstacles,bounds=DRIVE_BOUNDS){
 const corners=footprint(car);
 for(const p of corners){
  if(p.x<bounds.minX)return {x:1,z:0};if(p.x>bounds.maxX)return {x:-1,z:0};
  if(p.z<bounds.minZ)return {x:0,z:1};if(p.z>bounds.maxZ)return {x:0,z:-1};
 }
 const s=Math.sin(car.yaw),c=Math.cos(car.yaw);
 for(const o of obstacles){
  const dx=car.x-o.x,dz=car.z-o.z;
  // SAT contact normal: least penetration axis, pointing out of the scenery.
  const axes=[{x:1,z:0},{x:0,z:1},{x:c,z:-s},{x:s,z:c}];
  let depth=Infinity,normal=null,separate=false;
  for(const a of axes){
   const carRadius=Math.abs(a.x*c-a.z*s)*VEHICLE.halfWidth+Math.abs(a.x*s+a.z*c)*VEHICLE.halfLength;
   const projection=dx*a.x+dz*a.z,overlap=carRadius+o.w*Math.abs(a.x)+o.d*Math.abs(a.z)-Math.abs(projection);
   if(overlap<=0){separate=true;break;}
   if(overlap<depth){depth=overlap;const sign=Math.sign(projection)||1;normal={x:a.x*sign,z:a.z*sign};}
  }
  if(!separate)return normal;
 }
 return null;
}
export function collides(car,obstacles,bounds=DRIVE_BOUNDS){return collisionContact(car,obstacles,bounds)!==null;}
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function stepCar(car,input,dt,obstacles=[],bounds=DRIVE_BOUNDS){
 if(!Number.isFinite(dt)||dt<=0)return car;
 let left=Math.min(dt,.1);car.hit=false;car.hitSpeed=0;
 while(left>1e-8){const h=Math.min(left,1/120);left-=h;
  const throttle=clamp(Number(input.throttle)||0,-1,1),steer=clamp(Number(input.steer)||0,-1,1);
  car.steer+=(steer*.52-car.steer)*(1-Math.exp(-h*9));
  let speed=car.speed;
  // Opposite pedal first brakes to zero; reverse starts on subsequent steps.
  if(input.brake){speed=Math.sign(speed)*Math.max(0,Math.abs(speed)-h*15);}
  else if(throttle&&speed*throttle<0){speed=Math.sign(speed)*Math.max(0,Math.abs(speed)-h*10*Math.abs(throttle));}
  else if(throttle){speed+=throttle*h*(throttle>0?5:3);}
  else speed=Math.sign(speed)*Math.max(0,Math.abs(speed)-h*(.65+Math.abs(speed)*.12));
  speed=clamp(speed,-VEHICLE.reverseSpeed,VEHICLE.maxSpeed);
  const yaw=car.yaw-speed/VEHICLE.wheelbase*Math.tan(car.steer)*h;
  const next={...car,x:car.x-Math.sin(yaw)*speed*h,z:car.z-Math.cos(yaw)*speed*h,yaw};
  const contact=collisionContact(next,obstacles,bounds);
  if(contact){if(!car.hit){car.hitSpeed=Math.abs(speed);car.hitNormal={x:contact.x,y:0,z:contact.z};car.hitDirection={x:-Math.sin(yaw)*Math.sign(speed||1),z:-Math.cos(yaw)*Math.sign(speed||1)};}car.speed=0;car.hit=true;break;}
  car.distance+=Math.abs(speed*h);car.x=next.x;car.z=next.z;car.yaw=(yaw+Math.PI*3)%(Math.PI*2)-Math.PI;car.speed=speed;
 }
 return car;
}
export function exitPoint(car,clear){
 for(const [side,fore] of [[-2,0],[2,0],[-2,2],[2,2],[0,3.5]]){
  const x=car.x+side*Math.cos(car.yaw)+fore*Math.sin(car.yaw),z=car.z-side*Math.sin(car.yaw)+fore*Math.cos(car.yaw);
  if(clear(x,z))return {x,z};
 }
 return null;
}
