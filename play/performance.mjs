// Hysteresis prevents resolution changes oscillating around a single slow frame.
export function nextResolution(scale,fps,max=1.5){if(!Number.isFinite(fps)||fps<=0)return scale;if(fps<28)return Math.max(Math.min(.8,max),Math.round((scale-.2)*10)/10);if(fps>54)return Math.min(max,Math.round((scale+.1)*10)/10);return scale;}
export function setupPerformance({app,profile,resize,output}){
 let last=0,elapsed=0,frames=0,cooldown=0;
 return {tick(now,active){if(!active){last=0;return;}if(!last){last=now;return;}const dt=(now-last)/1000;last=now;if(dt>1)return;elapsed+=dt;frames++;cooldown+=dt;if(elapsed<3)return;
  const fps=frames/elapsed,scale=app.graphicsDevice.maxPixelRatio;output.textContent=Math.round(fps)+' FPS / '+scale.toFixed(1)+'x render scale';
  if(profile().quality==='auto'&&cooldown>=8){const next=nextResolution(scale,fps,Math.min(devicePixelRatio,1.5));if(Math.abs(next-scale)>.05){app.graphicsDevice.maxPixelRatio=next;resize();}cooldown=0;}
  elapsed=0;frames=0;
 }};
}
