/* Local, deterministic character choreography. No network or tracking. */
(()=>{'use strict';
const NS='http://www.w3.org/2000/svg',lerp=(a,b,t)=>a+(b-a)*t,ease=t=>t*t*(3-2*t);
window.EgorChoreography=class{
 constructor(root,{place,say,finish}){
  this.root=root;this.stage=root.querySelector('.home-stage');this.actor=root.querySelector('.home-egor');this.img=this.actor.querySelector('img');this.place=place;this.say=say;this.finish=finish;this.queue=[];this.active=false;this.elapsed=0;this.last=0;this.x=0;this.running=false;this.reduced=matchMedia('(prefers-reduced-motion: reduce)');
  this.rig=document.createElementNS(NS,'svg');this.rig.setAttribute('viewBox','0 0 400 1000');this.rig.setAttribute('aria-hidden','true');this.rig.classList.add('home-rig');
  this.rig.innerHTML=`<defs><clipPath id="egor-torso"><path d="M130 0H245V126L217 133L213 369L177 384L174 139L155 128H130Z"/></clipPath><clipPath id="egor-foot-left"><rect x="140" y="944" width="63" height="50"/></clipPath><clipPath id="egor-foot-right"><rect x="203" y="944" width="67" height="50"/></clipPath></defs><g class="rig-legs" fill="none" stroke="#10272b" stroke-width="7" stroke-linecap="round"><path/><path/></g><g class="rig-feet"><image href="assets/living/idle.webp" width="400" height="1000" clip-path="url(#egor-foot-left)"/><image href="assets/living/idle.webp" width="400" height="1000" clip-path="url(#egor-foot-right)"/></g><g class="rig-upper"><image href="assets/living/idle.webp" width="400" height="1000" clip-path="url(#egor-torso)"/><g fill="none" stroke="#10272b" stroke-width="7" stroke-linecap="round"><path class="rig-arm-back"/><path class="rig-arm-front"/></g></g>`;
  this.actor.append(this.rig);this.upper=this.rig.querySelector('.rig-upper');this.legs=[...this.rig.querySelectorAll('.rig-legs path')];this.arms=[this.rig.querySelector('.rig-arm-back'),this.rig.querySelector('.rig-arm-front')];this.feet=[...this.rig.querySelectorAll('.rig-feet image')];this.shadow=root.querySelector('.home-shadow');
  this.resize=new ResizeObserver(()=>{if(this.active){this.measure();if(['approach','carry'].includes(this.phase)){this.from=this.x;this.to=this.targetX(this.phase==='approach'?this.item.x:this.item.homeX);this.elapsed=0;}}});this.resize.observe(this.stage);
  this.frame=this.frame.bind(this);
 }
 start(items){if(this.active||!items.length)return;if(this.reduced.matches){for(const item of items)this.place(item.button,item.homeX,item.homeY);this.finish();return;}this.queue=items;this.active=true;this.root.classList.add('is-choreographing');this.next();if(this.running)this.request();}
 next(){this.item=this.queue.shift();if(!this.item){this.phase='home';this.from=this.x;this.to=0;this.elapsed=0;this.duration=Math.max(650,Math.abs(this.x)*5);return;}
  this.button=this.item.button;this.button.disabled=true;this.button.classList.add('is-selected');this.phase='notice';this.elapsed=0;this.duration=650;this.say(`Oh. My ${this.item.label.toLowerCase()}. Let me get that.`);this.measure();}
 measure(){const r=this.stage.getBoundingClientRect(),a=this.actor.getBoundingClientRect();this.w=r.width;this.h=r.height;this.scale=a.width/400;this.baseX=a.left-r.left-this.x;this.baseY=a.top-r.top;}
 targetX(x){return Math.max(-this.baseX+8,Math.min(this.w-this.baseX-400*this.scale-8,x*this.w/100-this.baseX-260*this.scale));}
 phaseTo(name,duration,to=this.x){this.phase=name;this.elapsed=0;this.duration=duration;this.from=this.x;this.to=to;}
 request(){if(!this.raf)this.raf=requestAnimationFrame(this.frame);}
 setRunning(value){this.running=value;this.last=0;if(value&&this.active)this.request();else if(this.raf){cancelAnimationFrame(this.raf);this.raf=0;}}
 cancel(){if(this.raf)cancelAnimationFrame(this.raf);this.raf=0;for(const b of this.root.querySelectorAll('.home-object')){b.disabled=false;b.classList.remove('is-selected','is-carried');}this.active=false;this.queue=[];this.x=0;this.actor.style.removeProperty('translate');this.shadow.style.removeProperty('translate');this.root.classList.remove('is-choreographing');}
 pose(crouch,walk,hand){const s=this.scale,phase=this.elapsed/160,stride=walk?Math.sin(phase)*22:0,bob=walk?Math.abs(Math.sin(phase))*5:0,cy=crouch-bob;
  this.upper.setAttribute('transform',`translate(0 ${cy})`);
  const liftL=walk?Math.max(0,Math.cos(phase))*13:0,liftR=walk?Math.max(0,-Math.cos(phase))*13:0;
  this.feet[0].setAttribute('transform',`translate(${stride} ${-liftL})`);this.feet[1].setAttribute('transform',`translate(${-stride} ${-liftR})`);
  this.legs[0].setAttribute('d',`M177 ${380+cy} Q${168-stride-crouch*.32} ${675+cy*.4} ${181+stride} ${952-liftL}`);
  this.legs[1].setAttribute('d',`M213 ${369+cy} Q${224+stride+crouch*.28} ${680+cy*.4} ${224-stride} ${952-liftR}`);
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
