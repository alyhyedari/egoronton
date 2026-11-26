export const WALK_TUNING=Object.freeze({walk:3.5,run:6.2,max:15,gravity:15,jump:5.2,hopGain:.85,grace:.12,buffer:.16,airAccel:8});
export function createWalker(x=0,z=0,height=()=>0){return {x,z,y:height(x,z),vx:0,vz:0,vy:0,grounded:true,chain:0,groundTime:0,queue:0,jumps:0,parachute:false,coyote:.12,canopy:0};}
export function deployParachute(s){if(s.grounded)return false;s.parachute=!s.parachute;if(s.parachute){s.vy=Math.max(-2.2,s.vy);s.chain=0;}return true;}
const approach=(a,b,k,h)=>a+(b-a)*(1-Math.exp(-k*h));
export function stepWalker(s,input,dt,{clear=()=>true,height=()=>0}={}){
 if(!Number.isFinite(dt)||dt<=0)return s;
 if(input.jumpPressed){s.queue=WALK_TUNING.buffer;if(!s.grounded&&(s.coyote||0)<=0&&s.jumps<2&&!s.parachute){s.vy=WALK_TUNING.jump;s.jumps=2;s.queue=0;}}
 let left=Math.min(dt,.1);
 while(left>1e-8){const h=Math.min(left,1/120);left-=h;
  s.coyote=s.grounded?WALK_TUNING.grace:Math.max(0,(s.coyote||0)-h);
  const ix=Number.isFinite(input.x)?input.x:0,iz=Number.isFinite(input.z)?input.z:0,len=Math.hypot(ix,iz),moving=len>.05,dx=moving?ix/Math.max(1,len):0,dz=moving?iz/Math.max(1,len):0;
  const base=(input.crouch?2:input.run?WALK_TUNING.run:WALK_TUNING.walk)*(input.scale||1);
  if(s.grounded){s.groundTime+=h;if(s.groundTime>WALK_TUNING.grace)s.chain=0;}
  if((s.grounded||s.coyote>0)&&(input.jump||s.queue>0)&&!input.crouch){
   s.chain=moving?Math.min(12,s.groundTime<=WALK_TUNING.grace?s.chain+1:1):0;
   const speed=Math.hypot(s.vx,s.vz),boost=Math.min(WALK_TUNING.max,Math.max(base,speed)+(s.chain>1?WALK_TUNING.hopGain:0));
   if(moving){const turn=speed>.1?.2:1,ux=speed>.1?s.vx/speed:dx,uz=speed>.1?s.vz/speed:dz,nx=ux*(1-turn)+dx*turn,nz=uz*(1-turn)+dz*turn,n=Math.hypot(nx,nz)||1;s.vx=nx/n*boost;s.vz=nz/n*boost;}
   s.vy=WALK_TUNING.jump;s.jumps=1;s.grounded=false;s.queue=0;s.coyote=0;s.groundTime=0;
  }
  s.queue=Math.max(0,s.queue-h);s.canopy=approach(s.canopy||0,s.parachute?1:0,5,h);
  if(s.parachute){const brake=input.brake||input.crouch,fx=input.forwardX||0,fz=input.forwardZ||0,tx=moving?dx*(brake?3:9):fx*(brake?3:7),tz=moving?dz*(brake?3:9):fz*(brake?3:7);s.vx=approach(s.vx,tx,brake?2.5:1.7,h);s.vz=approach(s.vz,tz,brake?2.5:1.7,h);s.vy=Math.max(brake?-1.1:-2.2,s.vy-3*h);}
  else if(s.grounded){s.vx=approach(s.vx,dx*base,13,h);s.vz=approach(s.vz,dz*base,13,h);}
  else if(moving){const projected=s.vx*dx+s.vz*dz,add=Math.max(0,Math.min(base-projected,WALK_TUNING.airAccel*h));s.vx+=dx*add;s.vz+=dz*add;}
  const speed=Math.hypot(s.vx,s.vz);if(speed>WALK_TUNING.max){s.vx*=WALK_TUNING.max/speed;s.vz*=WALK_TUNING.max/speed;}
  const old=height(s.x,s.z),x=s.x+s.vx*h,z=s.z+s.vz*h;
  if(clear(x,s.z)&&(!s.grounded||Math.abs(height(x,s.z)-old)<=Math.abs(s.vx*h)*.85+.03))s.x=x;else{s.vx=0;s.chain=0;}
  if(clear(s.x,z)&&(!s.grounded||Math.abs(height(s.x,z)-height(s.x,s.z))<=Math.abs(s.vz*h)*.85+.03))s.z=z;else{s.vz=0;s.chain=0;}
  const floor=height(s.x,s.z);
  if(!s.grounded){if(!s.parachute)s.vy-=WALK_TUNING.gravity*h;s.y+=s.vy*h;if(s.y<=floor&&s.vy<=0){s.y=floor;s.vy=0;s.grounded=true;s.jumps=0;s.parachute=false;s.groundTime=0;}}
  else if(s.y-floor>.3){s.grounded=false;s.jumps=1;}else s.y=floor;
 }
 return s;
}
