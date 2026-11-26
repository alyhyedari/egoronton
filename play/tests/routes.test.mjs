import test from 'node:test';
import assert from 'node:assert/strict';
import {Vec3,Color} from '../vendor/playcanvas.mjs';
import {buildLandscape,ROADS} from '../terrain.mjs';
import {buildFrontier} from '../frontier.mjs';
import {buildNeighborhood} from '../neighborhood.mjs';
import {buildUnfinishedStreet} from '../chapter.mjs';
import {garageObstacles} from '../garage-layout.mjs';
import {createCar,stepCar,collides} from '../vehicle-physics.mjs';
import {RIDES,STABLES} from '../riding-state.mjs';
import {GLIDE_STATIONS} from '../glide-stations.mjs';
import {TRAILS} from '../trails-state.mjs';
// Run actual scenery builders without a GPU to test their physical obstacles.
class Entity{constructor(){this.children=[];}addChild(e){this.children.push(e);}addComponent(){this.render={};}setPosition(){}setLocalPosition(){}setLocalScale(){}setEulerAngles(){}setLocalEulerAngles(){}lookAt(){}destroy(){} }
class Mesh{setPositions(){}setNormals(){}setIndices(){}update(){} }
const pc={Vec3,Color,Entity,Mesh,MeshInstance:class{},Texture:class{setSource(){}},calculateNormals:()=>[],PRIMITIVE_TRIANGLES:4};
test('actual world scenery leaves the full north exit and country-road centerlines open',()=>{
 const oldDocument=globalThis.document;globalThis.document={createElement:()=>({getContext:()=>new Proxy({},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)})})};
 try{
  const app={root:new Entity(),graphicsDevice:{},batcher:{addGroup:()=>({id:1}),generate(){}}},obstacles=[];
  const mat=()=>({diffuse:new Color(),emissive:new Color(),update(){}});
  const shape=(type,x,y,z,sx,sy,sz,m,parent=app.root)=>{const e=new Entity();e.render={material:m};parent.addChild(e);return e;};
  const args={pc,app,shape,mat,obstacles};buildUnfinishedStreet(args);buildNeighborhood(args);buildLandscape(args);buildFrontier(args);obstacles.push(...garageObstacles());
  for(const v of STABLES){assert.equal(collides({...createCar(),x:v.x,z:v.z},obstacles,undefined,RIDES[v.kind]),false,`Ride spawn obstructed: ${v.id}`);obstacles.push({x:v.x,z:v.z,w:RIDES[v.kind].halfWidth,d:RIDES[v.kind].halfLength});}
  for(const v of GLIDE_STATIONS)assert.equal(obstacles.some(o=>Math.abs(v.x-o.x)<o.w+.28&&Math.abs(v.z-o.z)<o.d+.28),false,'Blocked sky lift');
  for(const trail of TRAILS)for(const [x,z] of trail.points)assert.equal(collides({...createCar(),x,z},obstacles,undefined,RIDES[trail.mode]),false,`Blocked checkpoint ${trail.id}: ${x}, ${z}`);
  const car=createCar();for(let i=0;i<720;i++)stepCar(car,{throttle:1},1/60,obstacles);assert.ok(car.z<-140,`car stopped at ${car.x}, ${car.z}`);assert.equal(car.hit,false);
  for(const path of ROADS)for(let n=1;n<path.length;n++){const [ax,az]=path[n-1],[bx,bz]=path[n],length=Math.hypot(bx-ax,bz-az),yaw=Math.atan2(ax-bx,az-bz);for(let d=0;d<length;d+=2){const t=d/length,c={...createCar(),x:ax+(bx-ax)*t,z:az+(bz-az)*t,yaw};assert.equal(collides(c,obstacles),false,`Blocked road at ${c.x}, ${c.z}`);}}
 }finally{globalThis.document=oldDocument;}
});
