export function buildTacticalView({pc,camera,shape,mat}){
 const root=new pc.Entity('tactical-viewmodel');camera.addChild(root);
 const metal=mat('#263a3d'),steel=mat('#78928e'),wood=mat('#967253'),blue=mat('#4195a0'),skin=mat('#b99271'),flash=mat('#ffe9a1',3);
 const models=[0,1,2,3].map(i=>{const model=new pc.Entity('weapon-'+i);root.addChild(model);const body=i===3?.28:i===2?.42:.58,barrel=i===1?.42:i===3?.13:.3;
  const box=(x,y,z,a,b,c,m=metal)=>shape('box',x,y,z,a,b,c,m,model);
  box(.28,-.25,-.47,.12,.13,body);box(.28,-.225,-.47-body/2-barrel/2,.045,.045,barrel,steel);box(.28,-.35,-.35,.085,.2,.12,i===0?wood:metal).setLocalEulerAngles(-13,0,0);
  const magazine=box(.28,-.39,-.53,.075,i===3?.12:.23,.14,metal);if(i===0)magazine.setLocalEulerAngles(-12,0,0);
  box(.28,-.175,-.4,.025,.035,.035);box(.28,-.175,-.47-body/2,.025,.04,.03);
  if(i!==3){box(.28,-.27,-.15,.12,.14,.24,i===0?wood:metal);box(.28,-.27,-.66,.16,.15,.18,i===1?wood:i===2?blue:metal);}
  shape('capsule',.3,-.42,-.26,.11,.3,.12,skin,model).setLocalEulerAngles(-40,0,0);shape('capsule',.17,-.38,-.57,.11,.28,.12,skin,model).setLocalEulerAngles(60,0,-25);
  const muzzle=shape('sphere',.28,-.225,-.47-body/2-barrel,.12,.12,.2,flash,model);muzzle.enabled=false;
  model.findComponents('render').forEach(r=>{r.castShadows=false;r.receiveShadows=false;});return {model,muzzle,magazine};
 });
 return {root,update({index,shot,reloading,reloadTotal,aim,speed,time,reduced}){for(let i=0;i<models.length;i++){const m=models[i];m.model.enabled=i===index;m.muzzle.enabled=i===index&&shot>0;m.magazine.setLocalPosition(.28,-.39-(reloading?Math.sin((1-reloading/reloadTotal)*Math.PI)*.23:0),-.53);}
  const bob=reduced?0:Math.sin(time*9)*Math.min(.014,speed*.002);root.setLocalPosition(aim?-.12:0,bob-(reloading?.14:0),shot*.06);root.setLocalEulerAngles(reloading?-28:shot*5,0,reloading?15:0);
 }};
}
