// Original, locally synthesized score. No remote tracks or audio downloads.
export function scoreFor({driving=false,speed=0,forest=false,danger=false,horror=false,parachute=false,weather='clear',chain=0}={}){
 if(danger)return {name:'Against the erasure',bpm:126,energy:.95,dark:true};
 if(horror)return {name:'The archive beneath',bpm:68,energy:.42,dark:true};
 if(parachute)return {name:'A sky worth keeping',bpm:84,energy:.45,dark:false};
 if(driving)return {name:'Horizons in motion',bpm:96+Math.min(20,Math.abs(speed)),energy:.5+Math.min(.3,Math.abs(speed)/50),dark:false};
 if(chain>2)return {name:'Threadrunner',bpm:114,energy:.78,dark:false};
 return {name:weather==='snow'?'Snow remembers':weather==='rain'?'Letters in rain':forest?'Among the leaves':'The unfinished tomorrow',bpm:forest?76:86,energy:forest?.28:.4,dark:false};
}
export function setupSoundtrack({enabled=true,volume=.22,onStatus=()=>{}}={}){
 let context,master,compressor,noise,reverb,send,tempo=86,energy=.3,next=0,step=0,timer=null,playing=false,state={},muted=!enabled,level=volume;
 const midi=n=>440*2**((n-69)/12);
 function voice(freq,time,duration,gain,type='sine',slide){const o=context.createOscillator(),g=context.createGain();o.type=type;o.frequency.setValueAtTime(freq,time);if(slide)o.frequency.exponentialRampToValueAtTime(slide,time+duration);g.gain.setValueAtTime(.0001,time);g.gain.exponentialRampToValueAtTime(Math.max(.0002,gain),time+.008);g.gain.exponentialRampToValueAtTime(.0001,time+duration);o.connect(g);g.connect(compressor);g.connect(send);o.start(time);o.stop(time+duration+.03);o.onended=()=>{o.disconnect();g.disconnect();};}
 function hat(time,gain){const s=context.createBufferSource(),g=context.createGain(),filter=context.createBiquadFilter();s.buffer=noise;filter.type='highpass';filter.frequency.value=6500;g.gain.setValueAtTime(gain,time);g.gain.exponentialRampToValueAtTime(.0001,time+.055);s.connect(filter);filter.connect(g);g.connect(compressor);s.start(time);s.stop(time+.07);s.onended=()=>{s.disconnect();filter.disconnect();g.disconnect();};}
 function schedule(){if(!context||!playing||muted||context.state!=='running')return;const score=scoreFor(state);if(next<context.currentTime)next=context.currentTime+.04;while(next<context.currentTime+.16){const beat=step%16,bar=Math.floor(step/16)%8,root=[50,46,53,48,50,46,55,48][bar],e=energy+=(score.energy-energy)*.08;tempo+=(score.bpm-tempo)*.035;
   if(beat%4===0)voice(120,next,.19,.28*e,'sine',42);
   if(beat%4===2){hat(next,.055*e);voice(175,next,.09,.025*e,'triangle');}
   if(beat%2===0||e>.6)hat(next,.018*e);
   if(beat%4===0)voice(midi(root-12),next,.44,.09,'triangle');
   const melody=score.dark?[0,7,12,13,7,0,3,7]:[12,19,15,14,12,7,10,19];if(beat%2===0)voice(midi(root+melody[beat/2]),next,.5,.027,'triangle');
   if(e>.65&&[0,3,6,8,11,14].includes(beat))voice(midi(root+(beat%3===0?0:7)),next,.18,.035,'sawtooth');
   if(beat===0){for(const n of [0,3,7,14])voice(midi(root+n),next,3.8,.009,'sine');voice(midi(root-24),next,2.3,.065*e,'sine');}
   if(e>.75&&beat===14){voice(88,next,.4,.09,'triangle',34);hat(next,.075);}
   if(beat===0)for(const n of [0,7,12])voice(midi(root+n),next,1.5,.012,'sine');
   next+=60/tempo/4;step++;
  }onStatus(score.name,Math.round(score.bpm));}
 async function start(){playing=true;if(muted)return;try{if(!context){context=new (window.AudioContext||window.webkitAudioContext)();master=context.createGain();master.gain.value=level;master.connect(context.destination);compressor=context.createDynamicsCompressor();compressor.threshold.value=-20;compressor.ratio.value=5;compressor.connect(master);reverb=context.createConvolver();const impulse=context.createBuffer(2,context.sampleRate*2.6,context.sampleRate);for(let c=0;c<2;c++){const d=impulse.getChannelData(c);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,3)*.23;}reverb.buffer=impulse;send=context.createGain();send.gain.value=.22;send.connect(reverb);reverb.connect(compressor);noise=context.createBuffer(1,context.sampleRate*.1,context.sampleRate);const data=noise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;timer=setInterval(schedule,35);}await context.resume();next=context.currentTime+.04;schedule();}catch{onStatus('Audio unavailable',0);}}
 function update(nextState){state=nextState;if(master)master.gain.setTargetAtTime(playing&&!muted?level:0,context.currentTime,.15);}
 return {start,update,pause(value){playing=!value;if(master)master.gain.setTargetAtTime(!value&&!muted?level:0,context.currentTime,.08);if(!value&&context)context.resume().catch(()=>{});},configure(on,value){muted=!on;level=Math.max(0,Math.min(.6,value));if(on)start();else if(master)master.gain.setTargetAtTime(0,context.currentTime,.08);},destroy(){clearInterval(timer);context?.close().catch(()=>{});}};
}
