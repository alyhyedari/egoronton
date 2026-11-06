// Original procedural scenery. No character replicas or third-party art.
export function buildUnfinishedStreet({pc,app,shape,mat,obstacles}) {
  // Retire the earlier generic town while retaining its camera and sunlight.
  for (const e of [...app.root.children]) if(e.render)e.destroy();
  obstacles.length=0;
  const ink=mat('#183744'),paper=mat('#d6e0d6'),blue=mat('#328fa8'),warm=mat('#f5cb7e',.3),night=mat('#31556b');
  const box=(x,y,z,w,h,d,m=paper)=>shape('box',x,y,z,w,h,d,m);
  function solid(x,y,z,w,h,d,m){const e=box(x,y,z,w,h,d,m);obstacles.push({x,z,w:w/2+.3,d:d/2+.3});return e;}
  function line(a,b,m=ink,width=.035){const v=new pc.Vec3(...a),t=new pc.Vec3(...b),mid=v.clone().add(t).mulScalar(.5),e=box(mid.x,mid.y,mid.z,width,width,v.distance(t),m);e.lookAt(t);return e;}
  function frame(x,z,w,h,d){for(const dx of [-w/2,w/2])for(const dz of [-d/2,d/2])line([x+dx,0,z+dz],[x+dx,h,z+dz]);for(const y of [0,h]){line([x-w/2,y,z-d/2],[x+w/2,y,z-d/2]);line([x-w/2,y,z+d/2],[x+w/2,y,z+d/2]);line([x-w/2,y,z-d/2],[x-w/2,y,z+d/2]);line([x+w/2,y,z-d/2],[x+w/2,y,z+d/2]);}}
  function sign(text,x,y,z,w=3){const c=document.createElement('canvas');c.width=768;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#e5e6d5';ctx.fillRect(0,0,768,128);ctx.strokeStyle='#183744';ctx.lineWidth=7;ctx.strokeRect(8,8,752,112);ctx.fillStyle='#183744';ctx.font='bold 34px sans-serif';ctx.textAlign='center';ctx.fillText(text,384,77);const t=new pc.Texture(app.graphicsDevice,{mipmaps:true});t.setSource(c);const m=mat('#ffffff');m.diffuseMap=t;m.emissiveMap=t;m.emissive=new pc.Color(.3,.3,.3);m.update();box(x,y,z,w,w/6,.04,m);}
  box(0,-.25,0,44,.5,44,paper);box(0,.012,0,5,.025,34,night);
  // A furnished starting room with an open north wall: no invisible doorway collision.
  solid(-3,1.6,13.8,.18,3.2,6,blue);solid(3,1.6,13.8,.18,3.2,6,blue);solid(0,1.6,16.8,6,3.2,.18,night);
  box(0,.025,13.8,6,.05,6,paper);
  for(const x of [-2,2])solid(x,1.6,10.8,2,3.2,.16,blue);
  box(0,3.1,10.8,2,.25,.2,ink);box(0,.08,10.8,2,.08,.7,warm);
  solid(-1.9,.65,14.3,1.1,1.3,1,paper);box(-1.9,1.34,14.3,1.3,.08,1.2,ink);
  shape('cylinder',-1.9,1.55,14.3,.18,.4,.18,warm);shape('cone',-1.9,1.86,14.3,.6,.35,.6,warm);
  sign('THE UNFINISHED STREET',0,2.7,10.95,1.85);
  // A deliberate ink-outline skyline, with alternating built and unbuilt facades.
  const fills=[];
  for(let i=0;i<8;i++){const x=i%2?-10:10,z=7-Math.floor(i/2)*7,h=4+(i%3)*1.4;frame(x,z,5,h,4);if(i%3===0){solid(x,h/2,z,4.9,h,3.9,i%2?blue:paper);}else{const e=box(x,h/2,z,4.9,h,3.9,blue);e.enabled=false;fills.push(e);obstacles.push({x,z,w:2.8,d:2.3});}for(const dx of [-1.1,1.1])box(x+dx,2.4,z+2.05,.65,1,.07,warm);}
  for(let i=0;i<80;i++){const z=15-i*.36;box(Math.sin(i*.15)*.16,.095,z,.055,.035,.24,blue);}
  // Three distinct everyday objects become the chapter's interactions.
  solid(-5,.38,0,2.8,.76,2.5,ink);box(-5,.79,0,2.6,.08,2.3,night);
  const plant=[];for(let i=0;i<5;i++){const e=shape('sphere',-5+Math.sin(i*2)*.65,1.2+i*.18,Math.cos(i*2)*.5,.55,.8,.25,blue);e.enabled=false;plant.push(e);}
  sign('01 / A LITTLE CARE',-5,2.8,-.5);
  solid(4,1.5,-4,2.5,3,.3,night);box(4,1.8,-3.81,1.5,1.7,.07,ink);
  const window=box(4,1.8,-3.75,1.3,1.5,.05,warm);window.enabled=false;
  sign('02 / SOMEONE IS HOME',4,3.4,-3.8);
  solid(7,.65,3,2.7,.2,.75,paper);for(const x of [6,8])box(x,.3,3,.12,.6,.6,ink);
  box(7,1.1,3.4,2.7,.7,.12,blue);
  const cup=shape('cylinder',7,.92,3,.25,.3,.25,warm);cup.enabled=false;
  sign('03 / ROOM FOR ONE MORE',7,2.5,3.45);
  shape('sphere',-11,14,-28,4,4,.5,warm);
  const arch=[];for(let i=0;i<11;i++){const a=i/10*Math.PI,e=box(Math.cos(a)*3,Math.sin(a)*3,-12,.45,.6,.4,warm);e.enabled=false;arch.push(e);}
  sign('NOT EVERYTHING IS DRAWN YET',0,4.4,-12,5);
  return {activate(index){if(index===0)plant.forEach(e=>e.enabled=true);if(index===1)window.enabled=true;if(index===2)cup.enabled=true;},complete(){fills.forEach(e=>e.enabled=true);arch.forEach(e=>e.enabled=true);}};
}
