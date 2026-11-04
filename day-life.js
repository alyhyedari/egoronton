/* Local story director: visible-time clock, interruptible scenes, no network. */
(()=>{'use strict';
window.EgorDay=class {
 constructor(root,motion,say){
 this.root=root;this.motion=motion;this.say=say;this.clock=0;this.last=0;this.index=-1;this.cooldown=0;this.reactions=0;this.phase=-1;
 this.scenes=[
 ['movie','Movie night',72,36,'A film, a little peace. What could possibly go wrong?','Wait. The tiny villain was the accountant all along!','That ending deserves a sequel.'],
 ['draw','At the drawing desk',38,32,'One idea. One pencil. Let us make something strange.','No, that line needs more personality. There.','A little imperfect. Completely mine.'],
 ['exercise','Stretch break',57,24,'My legs have requested a meeting.','One. Two. That absolutely counts as exercise.','Excellent. I have earned a sit-down.'],
 ['work','Off to work',8,42,'I have to go to work. Please do not redecorate while I am out.','At the studio. Turning little ideas into a very big day.','Home again! Did you miss me, or just my furniture?'],
 ['read','A good book',30,30,'Just one chapter. A famously unreliable promise.','This page has a better plot than my entire morning.','I will keep that thought for tomorrow.'],
 ['coffee','Coffee ritual',72,25,'A small cup. A very serious ceremony.','Too hot. Patience is apparently part of the recipe.','Now the world makes a little more sense.'],
 ['game','One more round',65,28,'A quick game. I have everything under control.','That was not a defeat. That was research.','Rematch later. I am leaving with dignity.'],
 ['sleep','Daydream break',45,26,'Do not mind me. I am charging my imagination.','Somewhere in my dream, the furniture stays put.','I have an idea. First, where is my pencil?']
 ];
 const panel=document.createElement('div');panel.className='day-panel';panel.innerHTML='<span class="day-caption">A little life, unfolding</span><span class="day-progress" aria-hidden="true"><i></i></span><button type="button">Suggest another activity</button>';root.querySelector('.home-stage').after(panel);this.fill=panel.querySelector('i');panel.querySelector('button').onclick=()=>{if(root.roomLife?.paused||motion.active)return;this.stop();this.cooldown=0;this.start();};
 this.prop=document.createElementNS('http://www.w3.org/2000/svg','g');this.prop.classList.add('day-held');this.prop.setAttribute('aria-hidden','true');motion.upper.append(this.prop);
 this.caption=panel.querySelector('.day-caption');
 this.art={
 coffee:'<path d="M0 0h34v28q-17 17-34 0Z" fill="#f4dcac"/><path d="M34 5q22-2 16 17-5 9-16 5"/><path d="M7-12q-6-8 0-16m14 16q-6-8 0-16" opacity=".4"/>',
 read:'<path d="M0 0q-22-12-45-5v58q23-7 45 5 22-12 45-5V-5Q22-12 0 0Z" fill="#aec5c3"/><path d="M0 0v58m-34-44 23 3m-23 9 23 3m22-12 23-3m-23 15 23-3"/>',
 draw:'<path d="m-10 8 30-53 6 4-30 53Z" fill="#e0b878"/>',
 game:'<path d="M-33-12h66q14 0 18 34t-26 0h-50q-30 34-26 0t18-34Z" fill="#8ca7b8"/><path d="M-30 0v17m-8-8h16"/><circle cx="28" cy="4" r="3"/><circle cx="36" cy="12" r="3"/>',
 movie:'<path d="M-9-20h18v43H-9Z" fill="#8ca7b8"/><circle cy="-8" r="2"/>',
 work:'<rect x="-32" y="0" width="64" height="48" rx="5" fill="#bd9873"/><path d="M-13 0v-12h26V0M-32 18h64"/>'};
 this.artwork=document.createElement('div');this.artwork.className='day-sketch';this.artwork.setAttribute('aria-hidden','true');this.artwork.innerHTML='<svg viewBox="0 0 120 100" fill="none" stroke="#183044" stroke-width="2" stroke-linecap="round"><path fill="#fff5dd" d="M8 5h104v82H8Z"/><path class="sketch-line" d="M44 35q-12-25 11-23 18 3 8 21l-5 4 2 22-17 1-2-23Zm2 25-4 23m15-23 8 23M43 40 28 57m32-17 17 16"/><path d="m16 87-5 10m95-10 5 10"/></svg>';root.querySelector('.home-stage').append(this.artwork);
 this.resize=new ResizeObserver(()=>{if(this.active)motion.measure();});this.resize.observe(root.querySelector('.home-stage'));
 root.addEventListener('room-mess',()=>this.interrupt());root.addEventListener('room-reset',()=>{this.stop();this.cooldown=3;this.reactions=0;});
 root.querySelectorAll('[data-home]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.home!=='pause'){this.stop();this.cooldown=3;}}));
 }
 setRunning(value){cancelAnimationFrame(this.raf);this.last=0;if(!value)return;const frame=t=>{const dt=this.last?Math.min(.05,(t-this.last)/1000):0;this.last=t;this.update(dt);this.raf=requestAnimationFrame(frame);};this.raf=requestAnimationFrame(frame);}
 start(){if(!this.bag?.length){this.bag=this.scenes.map((_,i)=>i);for(let i=this.bag.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[this.bag[i],this.bag[j]]=[this.bag[j],this.bag[i]];}if(this.bag[this.bag.length-1]===this.index)this.bag.reverse();}this.index=this.bag.pop();this.scene=this.scenes[this.index];this.clock=0;this.phase=-1;this.active=true;this.root.dataset.story=this.scene[0];this.root.querySelector('.home-activity').textContent=this.scene[1];this.motion.measure();this.root.classList.add('is-choreographing','has-story');this.prop.innerHTML=this.art[this.scene[0]]||'';this.caption.textContent=this.scene[1];this.fromX=this.motion.x;this.arrival=Math.max(2.4,Math.min(4.5,Math.abs(this.motion.targetX(this.scene[2])-this.fromX)/45));}
 stop(){this.active=false;this.root.classList.remove('has-story','story-away');delete this.root.dataset.story;delete this.root.dataset.storyPhase;this.prop.textContent='';this.fill.style.width='0%';this.caption.textContent='A little life, unfolding';this.artwork.style.removeProperty('--ink');if(!this.motion.active){this.root.classList.remove('is-choreographing');this.motion.x=0;this.motion.actor.style.removeProperty('translate');this.motion.shadow.style.removeProperty('translate');}}
 reactionContext(){const id=this.active?this.scene[0]:this.interrupted;this.interrupted=null;return {movie:'I was just getting to the good part. ',draw:'There goes my train of thought. ',exercise:'Let me catch my breath. ',work:'I leave for one minute… ',read:'Let me save my page. ',coffee:'Careful. That is hot. ',game:'I had one life left. ',sleep:'I was almost onto something. '}[id]||'';}
 interrupt(){if(!this.active)return;this.interrupted=this.scene[0];this.stop();this.cooldown=14;this.reactions++;}
 update(dt){if(this.motion.active)return;if(!this.active){this.cooldown-=dt;if(this.cooldown<=0)this.start();else return;}
 const [id,label,target,hold,intro,during,end]=this.scene;this.clock+=dt;const t=this.clock,a=this.arrival,total=hold+a+6;
 const p=t<a?0:t<a+2?1:t<a+hold-2?2:t<a+hold?3:4;
 if(p!==this.phase){this.phase=p;this.root.dataset.storyPhase=['approach','settle','doing','finish','return'][p];if(p===0)this.say(intro);if(p===2)this.say(during);if(p===3)this.say(end);}
 const reduced=this.motion.reduced.matches;this.root.classList.toggle('story-away',id==='work'&&p===2);this.fill.style.width=Math.min(100,t/total*100)+'%';
 const ease=v=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v);};
 const x=this.motion.targetX(target);this.motion.x=reduced?0:p===0?this.fromX+(x-this.fromX)*ease(t/a):p===4?x*(1-ease((t-a-hold)/6)):x;this.motion.elapsed=t*1000;
 const local=Math.max(0,t-a-2),envelope=p===1?ease((t-a)/2):p===2?1:p===3?1-ease((t-a-hold+2)/2):0;
 // Quiet holds between gestures: not a perpetual, mechanical sine wave.
 const beat=local%8,sip=ease((beat-2)/1.4)*(1-ease((beat-4.4)/1.6));
 let crouch=0,hand=null,hx=253,hy=390;
 if(envelope){
 if(id==='coffee'){hx=253-56*sip;hy=330-233*sip;}
 if(id==='read'){hx=260;hy=305+Math.sin(local*.55)*3;}
 if(id==='draw'){hx=300+(beat<3?Math.sin(local*3.2)*12:0);hy=310+(beat<3?Math.cos(local*2.6)*9:0);}
 if(id==='game'){hx=265;hy=325+(beat<4?Math.sin(local*5)*3:0);}
 if(id==='movie'){hx=260;hy=350;}
 if(id==='work'){hx=270;hy=420;}
 if(id==='exercise')crouch=(beat<5?35*(1-Math.cos(beat/5*Math.PI*2)):0)*envelope;
 if(id==='sleep')crouch=(17+Math.sin(local*.6)*2)*envelope;
 hx=253+(hx-253)*envelope;hy=390+(hy-390)*envelope;
 hand={x:this.motion.baseX+this.motion.x+hx*this.motion.scale,y:this.motion.baseY+(hy+crouch)*this.motion.scale};
 }
 this.motion.pose(reduced?0:crouch,!reduced&&(p===0||p===4),reduced?null:hand);
 this.prop.style.opacity=String(p===1||p===2||p===3?1:0);
 this.prop.setAttribute('transform',`translate(${reduced?253:hx} ${reduced?390:hy}) rotate(${id==='coffee'&&!reduced?-sip*17:0})`);
 this.artwork.style.left=((this.motion.baseX+x+300*this.motion.scale)/this.motion.w*100)+'%';
 this.artwork.style.top=((this.motion.baseY+300*this.motion.scale)/this.motion.h*100)+'%';
 this.artwork.style.setProperty('--ink',String(1-Math.min(1,local/(hold-6))));
 if(t>=total){this.stop();this.cooldown=5;}

 }
};
})();
