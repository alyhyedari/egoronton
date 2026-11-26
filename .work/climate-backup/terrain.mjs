export const WORLD_BOUNDS=Object.freeze({minX:-118,maxX:178,minZ:-244,maxZ:24});
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
// Rounded hills with a flat, seamless approach from the original town.
export function groundHeight(x,z){
 const north=smooth((-z-118)/32),east=smooth((x-108)/35);
 const hill=(cx,cz,h,r)=>h*Math.exp(-((x-cx)**2+(z-cz)**2)/(r*r));
 return north*(hill(-48,-189,19,46)+hill(76,-184,14,56)+hill(4,-237,14,62))+east*hill(154,-98,10,44);
}
export const ROADS=Object.freeze([
 [[56,8],[56,-42],[96,-42],[96,-91],[62,-130],[76,-177],[16,-221],[-43,-194],[-64,-151],[-28,-118],[0,-110]],
 [[56,8],[56,0],[30,0],[0,0],[0,-56],[-15,-62],[-15,-83],[0,-93],[0,-110]],
 [[96,-42],[140,-69],[151,-111],[124,-141],[76,-177]]
]);
export function roadDistance(x,z){let best=Infinity;for(const path of ROADS)for(let i=1;i<path.length;i++){const [ax,az]=path[i-1],[bx,bz]=path[i],dx=bx-ax,dz=bz-az,t=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz)));best=Math.min(best,Math.hypot(x-ax-t*dx,z-az-t*dz));}return best;}
export function surfaceAt(x,z){return roadDistance(x,z)<5.5||x>44&&x<106&&z>-54&&z<18?1:.72;}
export function buildLandscape({pc,app,mat,shape,obstacles}){
 function mesh(name,positions,indices,material){const mesh=new pc.Mesh(app.graphicsDevice);mesh.setPositions(positions);mesh.setNormals(pc.calculateNormals(positions,indices));mesh.setIndices(indices);mesh.update(pc.PRIMITIVE_TRIANGLES);const e=new pc.Entity(name);e.addComponent('render',{meshInstances:[new pc.MeshInstance(mesh,material)],castShadows:false,receiveShadows:true});app.root.addChild(e);return e;}
 const positions=[],indices=[],cols=76,rows=68;
 for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){const x=-122+i*4,z=-248+j*4;positions.push(x,groundHeight(x,z)-.07,z);}
 for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const a=j*(cols+1)+i,b=a+cols+1;indices.push(a,b,a+1,a+1,b,b+1);}
 const meadow=mat('#90ae7d');mesh('rolling-meadows',positions,indices,meadow);
 const road=mat('#afa987');
 for(const [n,path] of ROADS.entries()){
  const p=[],idx=[];let count=0;
  for(let k=1;k<path.length;k++){const [ax,az]=path[k-1],[bx,bz]=path[k],dx=bx-ax,dz=bz-az,len=Math.hypot(dx,dz),steps=Math.ceil(len/2),nx=-dz/len,nz=dx/len;
   for(let j=0;j<=steps;j++){const t=j/steps,x=ax+dx*t,z=az+dz*t;for(const side of [-1,1]){const xx=x+nx*side*4.5,zz=z+nz*side*4.5;p.push(xx,groundHeight(xx,zz)+.065,zz);}if(j){const a=count*2;idx.push(a-2,a,a-1,a-1,a,a+1);}count++;}
  }mesh('country-road-'+n,p,idx,road);
 }
 const bark=mat('#5a7261'),leaves=[mat('#629269'),mat('#739a70'),mat('#497f68')],cream=mat('#e5d7af'),stone=mat('#98a29b');
 // Broad, overlapping foliage and soft rock silhouettes, deliberately away from roads.
 for(let i=0;i<90;i++){const x=-108+(i*43.371%270),z=-82-(i*19.831%150);if(z>-127&&x<112||roadDistance(x,z)<8)continue;const y=groundHeight(x,z),h=3+(i%4)*.6;shape('cylinder',x,y+h*.42,z,.4,h*.84,.4,bark);for(let k=0;k<3;k++)shape('sphere',x+(k-1)*.8,y+h+k*.35,z+(k%2)*.6,3,3.1,2.8,leaves[i%3]);obstacles.push({x,z,w:.55,d:.55});}
 for(let i=0;i<25;i++){const x=-105+(i*53.9%265),z=-132-(i*29.3%100);if(roadDistance(x,z)<8)continue;shape('sphere',x,groundHeight(x,z)+.5,z,3+(i%3),1.5,2.5,stone);obstacles.push({x,z,w:1.6,d:1.3});}
 // New destinations are reachable by both car and foot.
 for(const [x,z] of [[16,-221],[-43,-194],[151,-111]]){const y=groundHeight(x,z);shape('cylinder',x,y+.08,z,12,.16,12,cream);for(const dx of [-3,3])shape('cylinder',x+dx,y+1.6,z,.16,3.2,.16,bark);shape('box',x,y+3.25,z,8,.2,5,cream);shape('box',x,y+.6,z+1.5,3,.2,.7,bark);}
 for(let i=0;i<14;i++){const x=-100+i*22,z=-267-Math.sin(i)*12;shape('sphere',x,4,z,40,28+(i%3)*8,35,mat('#8ea9a0'));}
 return {height:groundHeight};
}
