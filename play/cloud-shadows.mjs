import {groundHeight} from './terrain.mjs';
// Soft projected shadows follow the same terrain as wheels and feet.
// A small local grid avoids a large shadow map on mobile GPUs.
export function createCloudShadows({pc,app,mat}){
 const material=mat('#182b35');material.useLighting=false;material.emissive.set(.08,.13,.16);material.opacityVertexColor=true;material.opacityVertexColorChannel='a';material.blendType=pc.BLEND_NORMAL;material.depthWrite=false;material.cull=pc.CULLFACE_NONE;material.update();
 const shadows=[];const segments=24,rings=5;
 for(let n=0;n<7;n++){const mesh=new pc.Mesh(app.graphicsDevice),positions=new Float32Array((rings+1)*segments*3),colors=[],indices=[];
  for(let r=0;r<=rings;r++)for(let i=0;i<segments;i++){colors.push(1,1,1,(1-r/rings)**2*.33);if(r<rings){const a=r*segments+i,b=r*segments+(i+1)%segments;indices.push(a,b,a+segments,b,b+segments,a+segments);}}
  mesh.setPositions(positions);mesh.setColors(colors);mesh.setIndices(indices);mesh.update(pc.PRIMITIVE_TRIANGLES);const entity=new pc.Entity('cloud-ground-shadow');entity.addComponent('render',{meshInstances:[new pc.MeshInstance(mesh,material)],castShadows:false,receiveShadows:false});app.root.addChild(entity);shadows.push({mesh,positions,entity});
 }
 let elapsed=1;
 return {update(dt,clouds,cloud,daylight){elapsed+=dt;if(elapsed<.15)return;elapsed=0;material.opacity=(.35+cloud*.65)*Math.min(1,daylight*2);material.update();shadows.forEach((s,n)=>{const p=clouds[n].getPosition();let k=0;for(let r=0;r<=rings;r++)for(let i=0;i<segments;i++){const a=i/segments*Math.PI*2,x=p.x+Math.cos(a)*r/rings*32,z=p.z+Math.sin(a)*r/rings*20;s.positions[k++]=x;s.positions[k++]=groundHeight(x,z)+.12;s.positions[k++]=z;}s.mesh.setPositions(s.positions);s.mesh.update(pc.PRIMITIVE_TRIANGLES);});}};
}
