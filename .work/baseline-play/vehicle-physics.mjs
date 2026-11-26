// Deterministic arcade vehicle model; no renderer or browser dependencies.
export const VEHICLE = Object.freeze({halfWidth:1.16, halfLength:2.55, wheelbase:3.1, maxSpeed:13, reverseSpeed:4});
export const BAY = Object.freeze({x:56,z:8});
export const DRIVE_BOUNDS = Object.freeze({minX:44,maxX:106,minZ:-54,maxZ:18});
export const PAINTS = Object.freeze({azure:'#208ba9',cherry:'#963e55',ivory:'#eadbb7'});
export function normalizeGarage(raw) {
 const o=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
 return {version:1,paint:Object.hasOwn(PAINTS,o.paint)?o.paint:'azure',height:['low','raised'].includes(o.height)?o.height:'low',camera:o.camera==='wide'?'wide':'chase',language:o.language==='fa'?'fa':'en',laps:Number.isFinite(o.laps)?Math.max(0,Math.min(1000000,Math.floor(o.laps))):0};
}
export function createCar(){return {x:BAY.x,z:BAY.z,yaw:0,speed:0,steer:0,distance:0,hit:false};}
export function footprint(car){
 const s=Math.sin(car.yaw),c=Math.cos(car.yaw),w=VEHICLE.halfWidth,l=VEHICLE.halfLength;
 return [[-w,-l],[w,-l],[w,l],[-w,l]].map(([x,z])=>({x:car.x+x*c+z*s,z:car.z-x*s+z*c}));
}
export function collides(car,obstacles,bounds=DRIVE_BOUNDS){
 const corners=footprint(car);
 if(corners.some(p=>p.x<bounds.minX||p.x>bounds.maxX||p.z<bounds.minZ||p.z>bounds.maxZ))return true;
 const s=Math.sin(car.yaw),c=Math.cos(car.yaw);
 return obstacles.some(o=>{
  const dx=o.x-car.x,dz=o.z-car.z;
  // SAT for an oriented car rectangle against axis-aligned scenery.
  return Math.abs(dx)<o.w+Math.abs(c)*VEHICLE.halfWidth+Math.abs(s)*VEHICLE.halfLength &&
   Math.abs(dz)<o.d+Math.abs(s)*VEHICLE.halfWidth+Math.abs(c)*VEHICLE.halfLength &&
   Math.abs(dx*c-dz*s)<VEHICLE.halfWidth+o.w*Math.abs(c)+o.d*Math.abs(s) &&
   Math.abs(dx*s+dz*c)<VEHICLE.halfLength+o.w*Math.abs(s)+o.d*Math.abs(c);
 });
}
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function stepCar(car,input,dt,obstacles=[],bounds=DRIVE_BOUNDS){
 if(!Number.isFinite(dt)||dt<=0)return car;
 let left=Math.min(dt,.1);car.hit=false;
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
  if(collides(next,obstacles,bounds)){car.speed=0;car.hit=true;continue;}
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
