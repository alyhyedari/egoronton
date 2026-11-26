import {WORLD_BOUNDS} from './terrain.mjs';
export const RIDES=Object.freeze({
 bicycle:{name:'Thread bicycle',fa:'دوچرخه ترد',halfWidth:.38,halfLength:1,wheelbase:1.35,maxSpeed:11,reverseSpeed:1.5,accel:2.8,braking:9,steering:.65,eye:1.55,color:'#e3bb69'},
 motorcycle:{name:'Bluebird motorcycle',fa:'موتور بلوبرد',halfWidth:.48,halfLength:1.2,wheelbase:1.6,maxSpeed:26,reverseSpeed:2,accel:7,braking:16,steering:.48,eye:1.45,color:'#4ca7ae'},
 horse:{name:'Willow',fa:'اسب ویلو',halfWidth:.5,halfLength:1.35,wheelbase:1.4,maxSpeed:12,reverseSpeed:1.5,accel:3.5,braking:8,steering:.8,eye:2.2,color:'#a87954'}
});
export const STABLES=Object.freeze([
 {id:'town-bike',kind:'bicycle',x:44,z:12},{id:'town-moto',kind:'motorcycle',x:44,z:7},{id:'town-horse',kind:'horse',x:44,z:-7},
 {id:'ridge-bike',kind:'bicycle',x:24,z:-210},{id:'lodge-horse',kind:'horse',x:-220,z:-615},{id:'station-moto',kind:'motorcycle',x:109,z:-350}
]);
const finite=(v,a,b,f)=>Number.isFinite(v)?Math.max(a,Math.min(b,v)):f;
export function normalizeRiding(raw={}){
 const r=raw&&typeof raw==='object'?raw:{};
 return {active:STABLES.some(v=>v.id===r.active)?r.active:null,vehicles:STABLES.map(v=>{const saved=(Array.isArray(r.vehicles)?r.vehicles:[]).find(q=>q?.id===v.id);return {id:v.id,x:finite(saved?.x,WORLD_BOUNDS.minX+3,WORLD_BOUNDS.maxX-3,v.x),z:finite(saved?.z,WORLD_BOUNDS.minZ+3,WORLD_BOUNDS.maxZ-3,v.z),yaw:finite(saved?.yaw,-Math.PI,Math.PI,0),stamina:finite(saved?.stamina,0,1,1)};})};
}
export function ridePace(kind,stamina,boost,dt,moving){
 if(kind==='motorcycle')return {stamina:1,scale:boost?1:.72};
 const drain=boost&&moving&&stamina>.06;
 return {stamina:Math.max(0,Math.min(1,stamina+(drain?-.06:.04)*Math.min(.1,Math.max(0,dt)))),scale:drain?1:kind==='horse'?.46:.62};
}
