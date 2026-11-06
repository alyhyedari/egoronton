// Original procedural scenery. No external illustration or character assets.
export function dressNeighborhood({pc,app,shape,mat,obstacles}) {
 const ink=mat('#243c58'), plaster=mat('#80b6c1'), pale=mat('#d0d7cb'), roof=mat('#355775'), terracotta=mat('#bb8470'), glow=mat('#ffcf87',.65), foliage=mat('#467f82');
 function block(x,y,z,w,h,d,m){return shape('box',x,y,z,w,h,d,m);}
 function label(text,x,y,z,w=2){
  const c=document.createElement('canvas');c.width=512;c.height=128;const g=c.getContext('2d');g.fillStyle='#20384f';g.fillRect(0,0,512,128);g.strokeStyle='#dbbf86';g.lineWidth=5;g.strokeRect(8,8,496,112);g.fillStyle='#f6e6bd';g.textAlign='center';g.font='600 40px Georgia';g.fillText(text,256,80);
  const t=new pc.Texture(app.graphicsDevice,{mipmaps:true});t.setSource(c);const m=mat('#ffffff');m.diffuseMap=t;m.emissiveMap=t;m.emissive.set(.3,.3,.3);m.update();block(x,y,z,w,w/4,.035,m);
 }
 function window(x,y,z){block(x,y,z, .92,1.35,.12,ink);block(x,y,z+.075,.72,1.15,.035,glow);block(x,y,z+.10,.045,1.18,.045,ink);block(x,y,z+.10,.75,.045,.045,ink);block(x,y-.73,z+.13,1.08,.12,.3,pale);}
 // Layered facades: each existing house becomes a small, distinct destination.
 for(const [i,o] of obstacles.entries()){
  const w=(o.w-.4)*2,d=(o.d-.4)*2,front=o.z+d/2;
  block(o.x,4.55,o.z,w,2.3,d,i%2?plaster:pale);
  block(o.x,5.75,o.z,w+.35,.18,d+.35,ink);
  const r=shape('cone',o.x,6.55,o.z,w+1,1.5,d+1,roof);r.setEulerAngles(0,45,0);
  block(o.x+w*.3,6.45,o.z-.4,.45,1.7,.55,ink);
  for(const s of [-1,1])window(o.x+s*w*.27,4.5,front+.08);
  for(let j=0;j<7;j++)block(o.x-w/2+(j+.5)*w/7,2.85,front+.45,w/7,.15,.95,j%2?glow:roof);
  label(['THE QUIET POST','BLUE HOUR CAFÉ','PAPER & THINGS','A LITTLE LIGHT'][i],o.x,3.28,front+.17,w*.85);
  // Window boxes and compact foliage, contained against the building footprint.
  for(const s of [-1,1]){block(o.x+s*w*.27,3.65,front+.22,1,.25,.35,terracotta);for(let j=0;j<3;j++)shape('sphere',o.x+s*w*.27+(j-1)*.25,3.9,front+.25,.35,.4,.35,foliage);}
 }
 // An enclosed distant town silhouette, rather than an empty edge of the map.
 for(let i=0;i<17;i++){
  const x=(i-8)*3.9,z=-24-(i%3)*2,h=5+(i*7%6);
  block(x,h/2,z,3.7,h,4,i%2?roof:plaster);block(x,h+.12,z,4,.24,4.2,ink);
  for(let j=0;j<2;j++)block(x+(j-.5)*1.4,h-1.5,z+2.03,.45,.85,.05,glow);
 }
 // Moon and quiet cloud bands: static also in reduced-motion mode.
 const moon=mat('#fff0c6',.8);shape('sphere',-14,18,-37,3.1,3.1,1,moon);
 const cloud=mat('#a6c0cf');for(let i=0;i<6;i++)shape('sphere',-25+i*11,13+(i%3)*2,-42,9,1.1,1,cloud);
 // Clock tower anchors the end of Window Lane, outside the walkable boundary.
 block(0,5,-23,3,10,3,pale);block(0,10,-23,3.5,.3,3.5,ink);shape('cone',0,11.1,-23,4,2,4,roof);
 label('BLUE HOUR',0,6.8,-21.45,2.6);
 const face=shape('cylinder',0,8.4,-21.4,1.65,.08,1.65,glow);face.setEulerAngles(90,0,0);block(0,8.65,-21.31,.065,.55,.05,ink);block(.2,8.4,-21.30,.45,.065,.05,ink);
 // A basin under the pencil monument. Collision prevents walking through it.
 shape('cylinder',0,.22,-10,3.1,.35,3.1,ink);shape('cylinder',0,.42,-10,2.8,.06,2.8,mat('#70c4ce',.18));obstacles.push({x:0,z:-10,w:1.65,d:1.65});
 // Paving joints give ground scale without filling the scene with loose particles.
 for(let i=0;i<28;i++)block(0,.062,14-i,4.8,.012,.025,mat('#b8bda9'));
 for(const x of [-2.55,2.55])block(x,.075,0,.12,.15,29,pale);
 // Framed lanterns lead the eye into the square.
 for(const z of [9,1,-7])for(const x of [-2.9,2.9]){
  shape('cylinder',x,1.55,z,.085,3.1,.085,ink);block(x,3.15,z,.42,.65,.42,ink);block(x,3.15,z+.22,.26,.45,.03,glow);block(x,3.55,z,.55,.1,.55,ink);
  obstacles.push({x,z,w:.24,d:.24});
 }
 // Seating gains backs; planted beds turn blank ground into garden pockets.
 for(const x of [-4,4])block(x,1,3.28,1.8,.55,.12,roof);
 for(const x of [-12,12])for(const z of [-1,3]){
  block(x,.25,z,2,.5,1.2,terracotta);obstacles.push({x,z,w:1.2,d:.8});
  for(let j=0;j<5;j++){shape('sphere',x-.7+j*.35,.7,z,.65,.75,.8,foliage);shape('sphere',x-.7+j*.35,1.05,z,.14,.18,.14,j%2?glow:pale);}
 }
}
