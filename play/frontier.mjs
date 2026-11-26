// Original procedural scenery. The northern district is kept separate from town progression.
import {roadDistance} from './terrain.mjs';
export function buildFrontier({pc,app,shape,mat,obstacles}){
 const staticEntities=[];const make=shape;shape=(...args)=>{const e=make(...args);staticEntities.push(e);return e;};
 const teal=mat('#285b66'),stone=mat('#c4c4ad'),dark=mat('#183b42'),glass=mat('#4e91a0'),leaf=mat('#376c59'),gold=mat('#f7c87a',.5);
 const box=(x,y,z,w,h,d,m)=>shape('box',x,y,z,w,h,d,m);
 box(0,-.25,-93,80,.5,72,mat('#839d82'));box(0,.025,-88,6,.06,64,stone);
 box(0,.04,-66,34,.08,17,stone);
 // A walk-through ground floor, with the tower raised over its lobby.
 for(const x of [-10,10]){box(x,20,-73,2,40,9,teal);obstacles.push({x,z:-73,w:1.4,d:4.9});}
 box(0,24,-74,20,32,9,glass);box(0,40.4,-74,24,.8,12,dark);
 for(let y=9;y<40;y+=3)box(0,y,-69.42,20,.17,.15,stone);
 for(const x of [-6,-2,2,6])box(x,24,-69.4,.16,32,.16,teal);
 box(0,7,-73,20,.3,9,teal);box(0,1,-67,4,2,1,teal);obstacles.push({x:0,z:-67,w:2.25,d:.75});
 function sign(text,x,y,z,w){const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle='#183b42';ctx.fillRect(0,0,1024,128);ctx.fillStyle='#e7edcf';ctx.textAlign='center';ctx.font='600 52px sans-serif';ctx.fillText(text,512,82);const texture=new pc.Texture(app.graphicsDevice);texture.setSource(canvas);const m=mat('#ffffff');m.emissiveMap=texture;m.emissive=new pc.Color(.5,.5,.5);m.diffuseMap=texture;m.update();box(x,y,z,w,w/8,.08,m);}
 sign('TON BLOCKCHAIN TOWER',0,6,-68.4,18);sign('PUBLIC ARCHIVE / 01',0,1.5,-66.4,3.8);
 sign('NORTH / THE REMEMBERING WOODS',0,3,-88,7);
 for(const x of [-4,4])box(x,1.5,-88,.15,3,.15,dark);
 // The TON-inspired open triangle is geometry, not a remote logo asset.
 for(const [x,angle] of [[-2,-29],[2,29]]){const e=box(x,35,-69,.2,8,.25,gold);e.setEulerAngles(0,0,angle);}
 box(0,38.4,-69,7.6,.2,.25,gold);box(0,34.9,-69,.17,7.2,.25,gold);
 box(-6,.05,-103,12,.06,3,stone);box(-12,.4,-103,2,.8,1.4,dark);box(-12,1.1,-103,.9,.65,.5,gold);
 shape('cylinder',-12,2.9,-103,.06,3.2,.06,dark);box(-12,4.25,-103,2,.06,.06,dark);
 for(let i=0;i<40;i++){const z=-83-(i*7.7%41),x=(i%2?1:-1)*(9+(i*17.3%24));if(Math.hypot(x+12,z+103)<4||roadDistance(x,z)<7)continue;const h=3+(i%4)*.6;shape('cylinder',x,h*.35,z,.3,h*.7,.3,dark);shape('sphere',x,h*.75,z,3.1,h*.85,3.1,leaf);obstacles.push({x,z,w:.5,d:.5});}
 for(let i=0;i<10;i++){const x=i<7?3.8:-4-(i-7)*3,z=i<7?-82-i*3.5:-103;box(x,.5,z,.12,1,.12,dark);shape('sphere',x,1.1,z,.22,.3,.22,gold);}
 const group=app.batcher.addGroup('northern-district',false,48);for(const e of staticEntities)e.render.batchGroupId=group.id;app.batcher.generate([group.id]);
 const walkers=[];
 for(let i=0;i<4;i++){const root=new pc.Entity('archive-resident-'+i);app.root.addChild(root);shape('capsule',0,.9,0,.5,1.1,.5,i%2?teal:stone,root);shape('sphere',0,1.65,0,.48,.48,.48,gold,root);walkers.push({root,phase:i*Math.PI*.5});}
 return {update(time){for(const w of walkers){const a=time*.12+w.phase;w.root.setPosition(Math.sin(a)*7,0,-61+Math.cos(a)*3);w.root.setEulerAngles(0,-a*180/Math.PI,0);}}};
}
