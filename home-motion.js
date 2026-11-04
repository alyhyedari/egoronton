/* Local, deterministic character choreography. No network or tracking. */
(()=>{'use strict';
const NS='http://www.w3.org/2000/svg',lerp=(a,b,t)=>a+(b-a)*t,ease=t=>t*t*(3-2*t);
window.EgorChoreography=class{
 constructor(root,{place,say,finish}){
  this.root=root;this.stage=root.querySelector('.home-stage');this.actor=root.querySelector('.home-egor');this.img=this.actor.querySelector('img');this.place=place;this.say=say;this.finish=finish;this.queue=[];this.active=false;this.elapsed=0;this.last=0;this.x=0;this.running=false;this.reduced=matchMedia('(prefers-reduced-motion: reduce)');
  this.rig=document.createElementNS(NS,'svg');this.rig.setAttribute('viewBox','0 0 400 1000');this.rig.setAttribute('aria-hidden','true');this.rig.classList.add('home-rig');
  this.rig.innerHTML=`<defs><clipPath id="egor-head"><rect x="130" y="0" width="115" height="135"/></clipPath><mask id="egor-face-mask"><rect width="400" height="1000" fill="white"/><ellipse cx="185" cy="66" rx="16" ry="25" fill="black"/></mask></defs><g class="rig-legs" fill="none" stroke="#112025" stroke-width="8" stroke-linecap="round"><path/><path/></g><g class="rig-feet" fill="none" stroke="#112025" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"><path d="M190 949 Q156 960 159 972 Q170 976 196 954"/><path d="M224 949 Q250 954 253 973 Q238 973 222 953"/></g><g class="rig-upper"><image href="assets/living/idle.webp" width="400" height="1000" clip-path="url(#egor-head)" mask="url(#egor-face-mask)"/><path d="M187 126L187 137" fill="none" stroke="#112025" stroke-width="8"/><path d="M162 140 Q185 132 213 139 L219 374 Q198 375 175 385 Z" fill="none" stroke="#112025" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><g class="rig-face" fill="none" stroke="#112025" stroke-width="4" stroke-linecap="round"><path class="face-eyes" d="M176 51v7 M194 50v7"/><path class="face-mouth" d="M175 73 Q185 84 195 72"/><path class="face-brows" d="M170 43l10 4 M190 47l10-5"/></g><g fill="none" stroke="#112025" stroke-width="8" stroke-linecap="round"><path class="rig-arm-back"/><path class="rig-arm-front"/></g></g>`;
  this.actor.append(this.rig);this.upper=this.rig.querySelector('.rig-upper');this.legs=[...this.rig.querySelectorAll('.rig-legs path')];this.arms=[this.rig.querySelector('.rig-arm-back'),this.rig.querySelector('.rig-arm-front')];this.feet=[...this.rig.querySelectorAll('.rig-feet path')];this.shadow=root.querySelector('.home-shadow');
  this.resize=new ResizeObserver(()=>{if(this.active){this.measure();if(['approach','carry'].includes(this.phase)){this.from=this.x;this.to=this.targetX(this.phase==='approach'?this.item.x:this.item.homeX);this.elapsed=0;}}});this.resize.observe(this.stage);
  this.frame=this.frame.bind(this);
 }
 expression(mood){this.rig.querySelector('.face-mouth').setAttribute('d',mood==='furious'?'M175 80 Q185 68 195 79':mood==='annoyed'?'M175 77L195 74':'M175 73 Q185 84 195 72');if(!this.active){this.measure();this.pose(0,false,null);}}
 start(items){if(this.active||!items.length)return;if(this.reduced.matches){for(const item of items)this.place(item.button,item.homeX,item.homeY);this.finish();return;}this.queue=items;this.active=true;this.root.classList.add('is-choreographing');this.next();if(this.running)this.request();}
 next(){this.item=this.queue.shift();if(!this.item){this.cancel(true);this.finish();return;}
  this.button=this.item.button;this.button.disabled=true;this.button.classList.add('is-selected');this.phase='notice';this.elapsed=0;this.duration=650;this.say(`Oh. My ${this.item.label.toLowerCase()}. Let me get that.`);this.measure();}
 measure(){const r=this.stage.getBoundingClientRect(),a=this.actor.getBoundingClientRect();this.w=r.width;this.h=r.height;this.scale=a.width/400;this.baseX=a.left-r.left-this.x;this.baseY=a.top-r.top;}
 targetX(x){return Math.max(-this.baseX+8,Math.min(this.w-this.baseX-400*this.scale-8,x*this.w/100-this.baseX-260*this.scale));}
 phaseTo(name,duration,to=this.x){this.phase=name;this.elapsed=0;this.duration=duration;this.from=this.x;this.to=to;}
 request(){if(!this.raf)this.raf=requestAnimationFrame(this.frame);}
 setRunning(value){this.running=value;this.last=0;if(value&&this.active)this.request();else if(this.raf){cancelAnimationFrame(this.raf);this.raf=0;}}
 cancel(preserve=false){if(this.raf)cancelAnimationFrame(this.raf);this.raf=0;for(const b of this.root.querySelectorAll('.home-object')){b.disabled=false;b.classList.remove('is-selected','is-carried');}this.active=false;this.queue=[];if(preserve){this.pose(0,false,null);return;}this.x=0;this.actor.style.removeProperty('translate');this.shadow.style.removeProperty('translate');this.root.classList.remove('is-choreographing');}
 pose(crouch,walk,hand){const delta=this.x-(this.previousPoseX??this.x);if(walk&&Math.abs(delta)>.03){this.facing=delta>0?1:-1;}this.previousPoseX=this.x;const face=this.rig.querySelector('.rig-face');face.setAttribute('transform',`translate(${(this.facing||1)*6} 0)`);this.actor.dataset.facing=this.facing===-1?'left':'right';const s=this.scale,phase=this.elapsed/160,stride=walk?Math.sin(phase)*22:0,bob=walk?Math.abs(Math.sin(phase))*5:0,cy=crouch-bob;
  this.upper.setAttribute('transform',`translate(0 ${cy})`);
  const liftL=walk?Math.max(0,Math.cos(phase))*13:0,liftR=walk?Math.max(0,-Math.cos(phase))*13:0;
  this.feet[0].setAttribute('transform',`translate(${stride} ${-liftL})`);this.feet[1].setAttribute('transform',`translate(${-stride} ${-liftR})`);
  this.legs[0].setAttribute('d',`M175 ${382+cy} Q${168-stride-crouch*.32} ${675+cy*.4} ${181+stride} ${952-liftL}`);
  this.legs[1].setAttribute('d',`M218 ${374+cy} Q${224+stride+crouch*.28} ${680+cy*.4} ${224-stride} ${952-liftR}`);
  const hx=hand?(hand.x-this.baseX-this.x)/s:253+stride,hy=hand?(hand.y-this.baseY)/s-cy:390;
  this.arms[0].setAttribute('d',`M164 140 Q${144-stride} 272 ${148-stride} 410`);
  this.arms[1].setAttribute('d',`M214 140 Q${Math.max(230,hx+22)} ${lerp(140,hy,.55)} ${hx} ${hy}`);
  this.actor.style.translate=`${this.x}px 0`;this.shadow.style.translate=`${this.x}px 0`;
 }
 hand(){return {x:this.baseX+this.x+260*this.scale,y:this.baseY+470*this.scale};}
 frame(t){this.raf=0;if(!this.running||!this.active)return;const dt=this.last?Math.min(50,t-this.last):0;this.last=t;this.elapsed+=dt;
  const p=Math.min(1,this.elapsed/this.duration),u=ease(p),reduced=this.reduced.matches;let crouch=0,hand=null,walk=false;
  if(this.phase==='notice'){this.pose(0,false,null);}
  if(['approach','carry','home'].includes(this.phase)){this.x=lerp(this.from,this.to,u);walk=!reduced&&p>.02&&p<.98;}
  if(this.item){const {x,y,homeX,homeY}=this.item,source={x:x*this.w/100,y:y*this.h/100},dest={x:homeX*this.w/100,y:homeY*this.h/100},hold=this.hand();
   if(this.phase==='reach'){crouch=Math.max(0,(source.y-this.baseY)/this.scale-470)*u;hand={x:lerp(this.baseX+this.x+253*this.scale,source.x,u),y:lerp(this.baseY+390*this.scale,source.y,u)};}
   if(this.phase==='lift'){crouch=Math.max(0,(source.y-this.baseY)/this.scale-470)*(1-u);hand={x:lerp(source.x,hold.x,u),y:lerp(source.y,hold.y,u)};this.place(this.button,hand.x/this.w*100,hand.y/this.h*100,true);}
   if(this.phase==='carry'){hand=hold;this.place(this.button,hand.x/this.w*100,hand.y/this.h*100,true);}
   if(this.phase==='lower'){crouch=Math.max(0,(dest.y-this.baseY)/this.scale-470)*u;hand={x:lerp(hold.x,dest.x,u),y:lerp(hold.y,dest.y,u)};this.place(this.button,hand.x/this.w*100,hand.y/this.h*100,true);}
   if(this.phase==='release'){crouch=Math.max(0,(dest.y-this.baseY)/this.scale-470)*(1-u);hand={x:lerp(dest.x,hold.x,u),y:lerp(dest.y,hold.y,u)};}
  }
  this.pose(crouch,walk,hand);
  if(p===1){switch(this.phase){
   case 'notice':this.phaseTo('approach',reduced?200:Math.max(750,Math.abs(this.targetX(this.item.x)-this.x)*7),this.targetX(this.item.x));break;
   case 'approach':this.phaseTo('reach',650);this.say('Found it. Carefully…');break;
   case 'reach':this.button.classList.add('is-carried');this.phaseTo('lift',600);break;
   case 'lift':this.phaseTo('carry',reduced?250:Math.max(1000,Math.abs(this.targetX(this.item.homeX)-this.x)*9),this.targetX(this.item.homeX));this.say(`Taking my ${this.item.label.toLowerCase()} back.`);break;
   case 'carry':this.phaseTo('lower',750);break;
   case 'lower':this.place(this.button,this.item.homeX,this.item.homeY);this.button.classList.remove('is-carried');this.phaseTo('release',550);this.say('Right here. Just how I like it.');break;
   case 'release':this.button.disabled=false;this.button.classList.remove('is-selected');this.next();break;
   case 'home':this.cancel();this.finish();return;
  }}this.request();
 }
};
})();
