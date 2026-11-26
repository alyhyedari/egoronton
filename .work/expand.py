from pathlib import Path
p=Path('play')
def replace(name,old,new):
 f=p/name;s=f.read_text(encoding='utf-8');assert old in s,(name,old[:70]);f.write_text(s.replace(old,new),encoding='utf-8')
replace('vehicle-physics.mjs',"// Deterministic arcade vehicle model; no renderer or browser dependencies.","// Deterministic arcade vehicle model; no renderer or browser dependencies.\nimport {WORLD_BOUNDS,groundHeight,surfaceAt} from './terrain.mjs';")
replace('vehicle-physics.mjs',"Object.freeze({minX:44,maxX:106,minZ:-54,maxZ:18})","WORLD_BOUNDS")
replace('vehicle-physics.mjs',"speed=clamp(speed,-VEHICLE.reverseSpeed,VEHICLE.maxSpeed);", "const grip=surfaceAt(car.x,car.z),front=groundHeight(car.x-Math.sin(car.yaw),car.z-Math.cos(car.yaw)),back=groundHeight(car.x+Math.sin(car.yaw),car.z+Math.cos(car.yaw));if(Math.abs(speed)>.05)speed-=(front-back)*1.5*h;\n  speed=clamp(speed,-VEHICLE.reverseSpeed,VEHICLE.maxSpeed*grip);")
replace('drive-session.mjs',"import {BAY,createCar", "import {groundHeight} from './terrain.mjs';\nimport {BAY,createCar")
replace('drive-session.mjs',"clamp(c.x,44,106,BAY.x),z:clamp(c.z,-54,18,BAY.z)","clamp(c.x,-115,175,BAY.x),z:clamp(c.z,-241,21,BAY.z)")
replace('drive-session.mjs',"tickSurvival(s.survival,elapsed,{clearWalk});","tickSurvival(s.survival,elapsed,{clearWalk,groundHeight});")
replace('drive-session.mjs',"position:{x:s.car.x,y:1,z:s.car.z}","position:{x:s.car.x,y:groundHeight(s.car.x,s.car.z)+1,z:s.car.z}")
replace('drive-session.mjs',"respawnSurvivor(s.survival,{...point,y:0})","respawnSurvivor(s.survival,{...point,y:groundHeight(point.x,point.z)})")
f=p/'crash-state.mjs';s=f.read_text(encoding='utf-8');s=s.replace('if(state.position.y<=0)', 'if(state.position.y<=(options.groundHeight?.(state.position.x,state.position.z)||0))');s=s.replace('state.position.y=0;', 'state.position.y=options.groundHeight?.(state.position.x,state.position.z)||0;');f.write_text(s,encoding='utf-8')
replace('session.mjs',"look:p.look==='locked'?'locked':'drag',", "look:p.look==='locked'?'locked':'drag',language:p.language==='fa'?'fa':'en',music:p.music!==false,volume:finite(p.volume,0,.6,.22),")
replace('session.mjs',"x:finite(pos.x,-38,106,0),z:finite(pos.z,-127,18,11.5)","x:finite(pos.x,-115,175,0),z:finite(pos.z,-241,21,11.5)")
replace('garage.mjs',"import {setupCockpit}","import {groundHeight} from './terrain.mjs';\nimport {setupCockpit}")
f=p/'garage.mjs';s=f.read_text(encoding='utf-8');s=s.replace("for(const z of [-55,19])solid(75,z,64,.3,1.05,ink);",'// The circuit opens into the shared town and country roads.');s=s.replace("solid(107,-18,.3,74,1.05,ink);solid(43,-29,.3,52,1.05,ink);solid(43,12,.3,14,1.05,ink);",'');s=s.replace('if(driving)player.setPosition(car.x,0,car.z);','if(driving)player.setPosition(car.x,groundHeight(car.x,car.z),car.z);');s=s.replace('player.setPosition(point.x,0,point.z);','player.setPosition(point.x,groundHeight(point.x,point.z),point.z);');s=s.replace('root.setPosition(car.x,0,car.z);root.setEulerAngles(0,car.yaw*180/Math.PI,0);',"const sy=Math.sin(car.yaw),cy=Math.cos(car.yaw),pitch=Math.atan2(groundHeight(car.x-sy*1.5,car.z-cy*1.5)-groundHeight(car.x+sy*1.5,car.z+cy*1.5),3)*180/Math.PI,roll=Math.atan2(groundHeight(car.x+cy,car.z-sy)-groundHeight(car.x-cy,car.z+sy),2)*180/Math.PI;\n  root.setPosition(car.x,groundHeight(car.x,car.z),car.z);root.setEulerAngles(pitch,car.yaw*180/Math.PI,roll);")
s=s.replace('camera.setPosition(car.x-.48*c+.1*s,1.38+(config.height===\'raised\'?.22:0),car.z+.48*s+.1*c);',"const eye=root.getWorldTransform().transformPoint(new pc.Vec3(-.48,1.38+(config.height==='raised'?.22:0),.1));camera.setPosition(eye);")
s=s.replace('camera.setEulerAngles(Math.max(-35,Math.min(30,pitch)),','camera.setEulerAngles(root.getEulerAngles().x+Math.max(-35,Math.min(30,pitch)),')
s=s.replace('return {snapshot:','return {speed:()=>car.speed,danger:()=>session.survival.health<70,snapshot:')
s=s.replace('Closed test course','Open roads and country trails').replace('One car. A new stretch of road.','One car, a whole world')
f.write_text(s,encoding='utf-8')
f=p/'chapter.mjs';s=f.read_text(encoding='utf-8').replace("'#183744'","'#31535a'").replace("'#d6e0d6'","'#e5e2cb'").replace("'#328fa8'","'#6cb2b0'").replace("'#31556b'","'#9da995'").replace('e.enabled=false;fills.push(e);','e.enabled=true;fills.push(e);');f.write_text(s,encoding='utf-8')
f=p/'frontier.mjs';s=f.read_text(encoding='utf-8').replace("shape('cone',x,h*.75,z,2.5,h,2.5,leaf)","shape('sphere',x,h*.75,z,3.1,h*.85,3.1,leaf)");s='\n'.join(line for line in s.split('\n') if "for(let i=0;i<9;i++)shape('cone'" not in line);f.write_text(s,encoding='utf-8')
f=p/'world.mjs';s=f.read_text(encoding='utf-8');s=s.replace("import {setupAtlas}","import {createWalker,stepWalker} from './movement.mjs';\nimport {buildLandscape,groundHeight,WORLD_BOUNDS} from './terrain.mjs';\nimport {setupSoundtrack} from './soundtrack.mjs';\nimport {setupLanguage} from './language.mjs';\nimport {setupAtlas}")
s=s.replace("let pc,app;","let pc,app;let music;let contextLost=false;")
s=s.replace("app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW)","app.setCanvasFillMode(pc.FILLMODE_NONE)")
s=s.replace("new pc.Color(.38,.53,.65)","new pc.Color(.58,.76,.8)").replace('app.scene.fog.start=20;app.scene.fog.end=85','app.scene.fog.start=85;app.scene.fog.end=290').replace('farClip:100','farClip:350').replace('intensity:1.6','intensity:1.15')
s=s.replace('const frontier=buildFrontier',"buildLandscape({pc,app,shape,mat,obstacles});\nconst frontier=buildFrontier")
s=s.replace('paused=value;app.autoRender=!paused;', 'paused=value;music?.pause(paused);app.autoRender=!paused&&!contextLost;')
s=s.replace("$('enter').onclick=()=>{$('entry')", "$('enter').onclick=()=>{music.start();$('entry')")
s=s.replace('player.setPosition(pos.x,0,pos.z)', 'player.setPosition(pos.x,groundHeight(pos.x,pos.z),pos.z)')
s=s.replace('function clearInput(){keys.clear();', 'function clearInput(){keys.clear();jumpHeld=false;')
s=s.replace("window.addEventListener('resize',clearInput);",'')
a=s.index('function clearWalk(');b=s.index('\nexperience=',a)
s=s[:a]+"function clearWalk(x,z){return x>WORLD_BOUNDS.minX+1&&x<WORLD_BOUNDS.maxX-1&&z>WORLD_BOUNDS.minZ+1&&z<WORLD_BOUNDS.maxZ-1&&!obstacles.some(o=>Math.abs(x-o.x)<o.w&&Math.abs(z-o.z)<o.d);}"+s[b:]
a=s.index('let jumpY=0,');b=s.index("document.addEventListener('mousemove'",a)
s=s[:a]+"""let walker=createWalker(0,11.5,groundHeight),jumpHeld=false,jumpRequest=false;function jump(){jumpRequest=true;}
$('jump').onpointerdown=e=>{e.preventDefault();jumpHeld=true;jumpRequest=true;$('jump').setPointerCapture(e.pointerId);};
$('jump').onpointerup=$('jump').onpointercancel=$('jump').onlostpointercapture=()=>{jumpHeld=false;};
$('jump').onclick=e=>{if(e.detail===0)jump();};
music=setupSoundtrack({enabled:store.state.profile.music,volume:store.state.profile.volume,onStatus:(name,bpm)=>{$('music-track').textContent=name+(bpm?' / '+bpm+' BPM':'');}});
setupLanguage({store});
$('music-enabled').checked=store.state.profile.music;$('music-volume').value=store.state.profile.volume;
function musicSettings(){store.patch({profile:{...store.state.profile,music:$('music-enabled').checked,volume:Number($('music-volume').value)}});music.configure(store.state.profile.music,store.state.profile.volume);}
$('music-enabled').onchange=$('music-volume').oninput=musicSettings;
""".replace('\n+','\n')+s[b:]
s=s.replace('jumpSpeed-=10*dt;jumpY=Math.max(0,jumpY+jumpSpeed*dt);if(!jumpY)jumpSpeed=0;','')
a=s.index('const len=Math.max(1,Math.hypot(dx,dz)),speed=');b=s.index('\nnear=[',a)
s=s[:a]+"""if(Math.hypot(walker.x-p.x,walker.z-p.z)>1.5)walker=createWalker(p.x,p.z,groundHeight);
const r=yaw*Math.PI/180;stepWalker(walker,{x:dx*Math.cos(r)+dz*Math.sin(r),z:-dx*Math.sin(r)+dz*Math.cos(r),run:keys.has('Shift')||running,jump:keys.has('Space')||jumpHeld,jumpPressed:jumpRequest,scale:garage.movementScale()},dt,{clear:clearWalk,height:groundHeight});jumpRequest=false;
const distance=Math.hypot(walker.x-p.x,walker.z-p.z);experience.signal('move',distance);if(keys.has('Shift')||running)experience.signal('run',distance);player.setPosition(walker.x,walker.y,walker.z);$('hop-status').hidden=walker.chain<2;$('hop-status').textContent='BHOP '+walker.chain+' / '+Math.round(Math.hypot(walker.vx,walker.vz)*3.6)+' KM/H';
""".replace('\n+','\n')+s[b:]
s=s.replace('1.65+p.y+jumpY','1.65+p.y')
s=s.replace('app.scene.ambientLight.set(.52+count*.035,.63+count*.018,.71);',"app.scene.ambientLight.set(.62+count*.025,.7+count*.012,.67);music.update({driving:garage.isDriving(),speed:garage.speed(),forest:p.z<-82,danger:garage.danger(),chain:walker.chain});")
a=s.index("window.addEventListener('resize',()=>app.resizeCanvas())");b=s.index('\napp.autoRender=false;',a)
s=s[:a]+"""let resizeFrame=0;function resize(){cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>{if(contextLost)return;const w=Math.max(1,window.innerWidth),h=Math.max(1,window.innerHeight);app.resizeCanvas(w,h);app.renderNextFrame=true;});}
window.addEventListener('resize',resize);window.visualViewport?.addEventListener('resize',resize);window.addEventListener('orientationchange',()=>{clearInput();resize();});resize();
$('world').addEventListener('webglcontextlost',e=>{e.preventDefault();contextLost=true;savePosition();setPaused(true);$('recovery-panel').hidden=false;$('recovery-copy').textContent='Restoring the view';});
$('world').addEventListener('webglcontextrestored',()=>{contextLost=false;resize();app.renderNextFrame=true;$('recovery-copy').textContent='The view is ready';$('recovery-resume').hidden=false;});
$('recovery-resume').onclick=()=>{$('recovery-panel').hidden=true;setPaused(false);};$('recovery-reload').onclick=()=>{savePosition();location.reload();};
""".replace('\n+','\n')+s[b:]
f.write_text(s,encoding='utf-8')
