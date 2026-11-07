import { discoveries, commissions, normalize, missing } from './progression.mjs';
// Original, locally generated neighborhood. No external art assets.
export function buildNeighborhood({shape,mat,obstacles,pc,app}) {
 const blue=mat('#368fa6'),ink=mat('#193c51'),cream=mat('#eee1bf'),gold=mat('#efc47c',.2),leaf=mat('#609d87');
 const box=(x,y,z,w,h,d,m=cream)=>shape('box',x,y,z,w,h,d,m);
 const wall=(x,z,w,d,h=3.5)=>{box(x,h/2,z,w,h,d,blue);obstacles.push({x,z,w:w/2+.3,d:d/2+.3});};
 box(0,-.3,-10,84,.5,104,cream);
 box(0,.015,-28,6,.03,35,ink);box(0,.02,-24,65,.04,4,ink);
 function pavilion(x,z){box(x,.04,z,12,.08,10);wall(x,z-5,12,.2);wall(x-6,z,.2,10);wall(x+6,z,.2,10);for(const dx of [-4,4])wall(x+dx,z+5,4,.2);box(x,3.5,z+5,4,.25,.3,ink);for(const dx of [-4,0,4])box(x+dx,3.6,z, .1,.15,10,ink);}
 pavilion(-23,-25);pavilion(23,-25);pavilion(-23,-43);
 function table(x,z){box(x,.85,z,2,.15,1.3);for(const dx of [-.8,.8])box(x+dx,.4,z,.12,.8,.8,ink);}
 table(-23,-26);table(23,-26);table(20,-23);table(26,-23);
 // Courtyard garden, a sculpture and a fully walkable gallery.
 const plants=[];for(let i=0;i<6;i++){const x=18+(i%3)*3,z=-40-Math.floor(i/3)*3;box(x,.25,z,2,.5,2,ink);const p=shape('sphere',x,.8,z,1.4,1.4,1.4,leaf);p.enabled=false;plants.push(p);}
 const artwork=[];for(let i=0;i<3;i++){box(-27+i*4,1.9,-47.8,2.7,2.5,.12,ink);const e=box(-27+i*4,1.9,-47.65,2.4,2.2,.05,i%2?gold:cream);artwork.push(e);for(let j=0;j<4;j++){const s=box(-27+i*4+(j-1.5)*.4,1.8,-47.55,.12,1.3,.05,blue);s.setEulerAngles(0,0,j*19-25);}}
 const sculpture=[];for(let i=0;i<7;i++){const e=box(0, .4+i*.45,-35,2-i*.18,.35,2-i*.18,i%2?gold:blue);e.setEulerAngles(0,i*17,0);sculpture.push(e);}
 const cup=shape('cylinder',23,1.12,-26,.35,.4,.35,gold);cup.enabled=false;
 const canvas=box(-23,1.6,-26,2,1.3,.1,cream);
 for(let i=0;i<16;i++){const x=i%2?-35:35,z=14-Math.floor(i/2)*8;shape('cylinder',x,1,z,.25,2,.25,ink);shape('sphere',x,2.8,z,2.5,3,2.5,leaf);}
 const activities=[
 {id:'studio',x:-23,z:-24,name:'Open-air atelier',steps:['Choose a blue ground','Add the golden line','Sign your study'],finish:'Your first colour study is now hanging in the atelier.',apply(n){canvas.render.material=n===1?blue:n===2?gold:leaf;}},
 {id:'cafe',x:23,z:-24,name:'The quiet cafe',steps:['Prepare a cup','Brew the coffee','Leave a cup for a guest'],finish:'A warm welcome. A small table, no longer empty.',apply(n){cup.enabled=n>0;cup.setLocalScale(.35,.2+n*.07,.35);}},
 {id:'garden',x:21,z:-38,name:'The paper garden',steps:['Plant the seeds','Water the garden','Let the leaves unfold'],finish:'The courtyard has found its green.',apply(n){plants.forEach((p,i)=>{p.enabled=i<n*2;p.setLocalScale(.7+n*.23,.5+n*.35,.7+n*.23);});}},
 {id:'gallery',x:-23,z:-45,name:'Gallery of small beginnings',steps:['Study the original geometric triptych'],finish:'Three original procedural studies: rhythm, light and a blue line. No third-party artworks.',apply(){}},
 {id:'sculpture',x:0,z:-32,name:'The turning pencil',steps:['Turn the sculpture','Find another silhouette','Balance the composition'],finish:'One sculpture. A different shape from every side.',apply(n){sculpture.forEach((e,i)=>e.setEulerAngles(0,i*17+n*35,0));}}
 ];
 const label=(text,x,z)=>{const c=document.createElement('canvas');c.width=768;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#eee1bf';ctx.fillRect(0,0,768,128);ctx.fillStyle='#193c51';ctx.font='bold 38px sans-serif';ctx.textAlign='center';ctx.fillText(text,384,80);const t=new pc.Texture(app.graphicsDevice);t.setSource(c);const m=mat('#ffffff');m.diffuseMap=t;m.update();box(x,3.1,z,5,.83,.06,m);};
 label('ATELIER',-23,-19.8);label('CAFE',23,-19.8);label('GALLERY',-23,-37.8);label('PAPER GARDEN',21,-44.6);label('NORTH / PLACES TO BEGIN',0,-18);
 const tokens=discoveries.map((d,i)=>{const e=shape('box',d[2],.8,d[3],.55,.7,.12,gold);e.setEulerAngles(0,i*23,15);box(d[2],.12,d[3],1,.15,1,blue);return {id:'find-'+d[0],x:d[2],z:d[3],name:d[1],steps:['Keep this discovery'],finish:d[4],apply(n){e.enabled=!n;}};});
 const additions=new Map();
 for(const c of commissions){const parts=[];const b=(...args)=>{const e=box(...args);parts.push(e);return e;};
 if(c.id==='welcome')for(const x of [20,26])b(x,1,-23,.3,.4,.3,gold);
 if(c.id==='colour')for(let i=0;i<7;i++)b(-26+i,1.9,-29.8,.65,1.5+Math.sin(i)*.5,.12,i%2?gold:blue);
 if(c.id==='green')for(let i=0;i<8;i++)b(i%2?-4:4,.45,-20-Math.floor(i/2)*4,1,.9,1,leaf);
 if(c.id==='exhibition')for(let i=0;i<4;i++){b(-28+i*3,.4,-35,1,.8,1,ink);b(-28+i*3,1.3,-35,.8,1,.8,i%2?blue:gold).setEulerAngles(0,i*25,20);}
 if(c.id==='music')b(23,3.8,-25,10,.12,8,gold);
 if(c.id==='letter')for(let i=0;i<4;i++)b(17+i*3,2,-45,1.5,2,.15,gold);
 if(c.id==='light')for(let i=0;i<12;i++)b(Math.cos(i*Math.PI/6)*3,.3,-35+Math.sin(i*Math.PI/6)*3,.5,.3,.5,gold);
 if(c.id==='commons')for(let i=0;i<15;i++)b(-7+i,3+Math.sin(i/14*Math.PI),-51,.6,.8,.1,i%2?blue:gold);
 parts.forEach(e=>e.enabled=false);additions.set(c.id,parts);
 }
 const palettes={blue, sunset:gold, sage:leaf};
 return {activities:[...activities,...tokens],commissions,normalize,missing,
 setPalette(value){canvas.render.material=palettes[value]||blue;artwork.forEach(e=>e.render.material=palettes[value]||blue);},
 build(id){additions.get(id)?.forEach(e=>e.enabled=true);}};
}
