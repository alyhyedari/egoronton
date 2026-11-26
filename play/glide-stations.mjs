import {groundHeight} from './terrain.mjs';
import {deployParachute} from './movement.mjs';
export const GLIDE_STATIONS=[{x:28,z:-210},{x:-70,z:-452}];
export function setupGlideStations({shape,mat,player,walker,active,caption,store,resetInput}){
 const blue=mat('#76b7b8'),wood=mat('#827056'),rope=mat('#becbb0');let lift=null,near=null;
 for(const {x,z} of GLIDE_STATIONS){const y=groundHeight(x,z);shape('cylinder',x,y+.1,z,4,.2,4,wood);shape('box',x+1.5,y+17,z,.04,34,.04,rope);shape('sphere',x,y+36,z,7,9,7,blue);for(const dx of [-1,1])shape('box',x+dx,y+31.8,z,.03,3,.03,rope);shape('box',x,y+30.4,z,2.5,.3,2,wood);}
 const button=document.createElement('button');button.id='glide-launch';button.hidden=true;document.body.append(button);
 const tr=(en,fa)=>store.state.profile.language==='fa'?fa:en;
 function cancel(){if(!lift)return;lift=null;const w=walker();if(!w.grounded&&!w.parachute)deployParachute(w);}
 function interact(){if(!active())return false;if(lift){cancel();return true;}if(!near||!walker().grounded)return false;lift={...near,base:groundHeight(near.x,near.z),height:0};resetInput();caption(tr('Rising to the canopy / E to release early','بالارفتن تا چتر / رهاشدن زودتر با E'));return true;}
 button.onclick=interact;
 return {interact,lifting:()=>!!lift,cancel,update(dt){button.hidden=true;if(!active())return;const p=player.getPosition();near=GLIDE_STATIONS.find(q=>Math.hypot(p.x-q.x,p.z-q.z)<3);
  if(lift){lift.height=Math.min(30,lift.height+Math.min(.1,dt)*7);const w=walker();Object.assign(w,{x:lift.x,z:lift.z,y:lift.base+lift.height,vx:0,vz:0,vy:0,grounded:false,coyote:0,jumps:2});player.setPosition(w.x,w.y,w.z);if(lift.height>=30){cancel();caption(tr('Canopy open / steer toward the road and flare to land','چتر باز شد / به سمت جاده هدایت کن و برای فرود ترمز بگیر'));}}
  else if(near&&walker().grounded){button.hidden=false;button.textContent=tr('Sky lift / E','بالابر آسمان / E');}
 }};
}
