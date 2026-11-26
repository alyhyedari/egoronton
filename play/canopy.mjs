export function setupCanopy({pc,camera,shape,mat}){
 const root=new pc.Entity('gliding-rig');camera.addChild(root);const rope=mat('#d1c9a4'),fabric=mat('#648f98');
 for(const side of [-1,1]){shape('box',side*.33,-.33,-.3,.09,.13,.07,fabric,root);const line=shape('box',side*.65,.8,-.48,.012,2.5,.012,rope,root);line.setLocalEulerAngles(0,0,-side*15);}
 const cap=shape('sphere',0,2.2,-.4,4,.35,2,fabric,root);root.findComponents('render').forEach(r=>r.castShadows=false);
 const hint=document.createElement('div');hint.id='canopy-hint';hint.hidden=true;document.body.append(hint);
 return {update(walker,on,fa){root.enabled=on&&walker.parachute;hint.hidden=!root.enabled;if(root.enabled){cap.setLocalScale(4*walker.canopy,.35,2*walker.canopy);hint.textContent=fa?'هدایت WASD / ترمز فرود Space یا نشستن':'Steer WASD / flare with Space or Crouch';}}};
}
