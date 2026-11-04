/* A local room toy: no sound, network, navigation traps or persistent prank data. */
(() => {
  'use strict';
  const root = document.querySelector('.egor-home');
  if (!root?.roomLife) return;
  const stage = root.querySelector('.home-stage');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const svg = (body, viewBox='0 0 120 80') => `<svg viewBox="${viewBox}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
  const tv = document.createElement('button');
  tv.type='button';tv.className='room-tv';tv.setAttribute('aria-label','Turn television on');tv.setAttribute('aria-pressed','false');
  tv.innerHTML=svg('<path d="m40 12 13 10 16-13M39 71h40"/><rect x="8" y="22" width="104" height="44" rx="6" fill="#456175"/><rect class="tv-screen" x="16" y="29" width="78" height="30" rx="3"/><path d="M102 35v4m0 9v4"/><g class="tv-show"><path d="m24 49 13-11 14 11 18-15 17 15"/><circle cx="78" cy="37" r="3"/></g>');
  const mirror = document.createElement('button');
  mirror.type='button';mirror.className='room-mirror';mirror.setAttribute('aria-label','Smudge the mirror');
  mirror.innerHTML=svg('<rect x="18" y="6" width="64" height="108" rx="30" fill="#c49b72"/><rect x="24" y="12" width="52" height="96" rx="24" fill="#cbdce0"/><path d="m34 60 30-30m-26 49 22-22" stroke="#f6f0dd"/><g class="mirror-dirt" stroke="#68776e" stroke-width="7"><path d="m32 50 31 17m-32-3 26 15m-19 4 23 10"/></g>','0 0 100 120');
  const radio=document.createElement('button');radio.type='button';radio.className='room-radio';radio.setAttribute('aria-label','Turn radio on');radio.setAttribute('aria-pressed','false');radio.innerHTML=svg('<path d="M22 24 78 5"/><rect x="8" y="25" width="104" height="48" rx="8" fill="#c49b72"/><circle cx="34" cy="49" r="16"/><path d="M24 40v18m10-23v28m10-23v18M65 37h32"/><circle cx="74" cy="56" r="6"/><circle cx="96" cy="56" r="6"/>');
  stage.append(tv,mirror,radio);
  const panel=document.createElement('div');panel.className='room-play';
  panel.innerHTML=`<div class="room-play-heading"><div><span class="room-kicker">A VERY PATIENT NEIGHBOUR. MOSTLY.</span><h3>His room. Your terrible ideas.</h3></div><span class="room-mood" role="status">Mood: peaceful</span></div><p>Touch the TV, radio or mirror. Move his things. Give him a moment: he puts things right his own way. Radio is visual only; no audio.</p><div class="room-play-actions"><button type="button" data-prank="channel">Change channel</button><button type="button" data-prank="knock">Knock on the screen</button><button type="button" data-prank="wipe">Clean mirror</button><button type="button" data-prank="peace">Tidy up &amp; make peace</button></div><div class="room-meter" aria-hidden="true"><span></span></div><label class="room-effects"><input type="checkbox" checked> Allow pretend screen cracks (no flashes or sound)</label><p class="room-play-note">Everything here is pretend. Escape dismisses screen effects and EGOR’s exit message. Scrolling always stays yours.</p>`;
  root.querySelector('.home-bottom').before(panel);
  const crack=document.createElement('div');crack.className='room-screen-crack';crack.hidden=true;crack.setAttribute('aria-hidden','true');
  crack.innerHTML=svg('<path d="M610 380 522 312 493 199 390 166 331 42M522 312 395 345 278 289 0 311M493 199 565 132 580 0M610 380 701 268 828 237 1000 71M701 268 690 141M610 380 762 431 818 562 1000 631M762 431 950 414M610 380 573 531 443 620 400 800M573 531 655 707 640 800M610 380 465 423 367 514 208 498 0 610M465 423 423 377M610 380l35-22 24 31-37 26-22-35Z"/>','0 0 1000 800');document.body.append(crack);
  const notice=document.createElement('aside');notice.className='room-exit-notice';notice.hidden=true;notice.setAttribute('aria-label','A message from EGOR');
  notice.innerHTML='<p role="status"></p><div><button type="button" data-exit="back">Back to EGOR</button><button type="button" data-exit="dismiss">Keep going</button></div>';document.body.append(notice);
  const repair=document.createElement('button');repair.type='button';repair.className='room-repair';repair.textContent='Dismiss pretend crack · Esc';repair.hidden=true;document.body.append(repair);
  let radioOn=false;
  function request(target,kind){target.dataset.personalTask=kind;root.dispatchEvent(new Event('room-personal-task'));}
  radio.addEventListener('click',()=>{if(!allowed())return;radioOn=!radioOn;radio.classList.toggle('is-on',radioOn);radio.setAttribute('aria-pressed',String(radioOn));radio.setAttribute('aria-label',radioOn?'Turn radio off':'Turn radio on');react(radioOn?'A radio station? Let me choose something softer.':'A little silence is good too.',radioOn?1:0);if(radioOn)request(radio,'radio');else delete radio.dataset.personalTask;});
  root.addEventListener('room-personal-finish',e=>{if(e.detail.kind==='tune'){on=true;channel=0;}if(e.detail.kind==='mirror')dirt=0;if(e.detail.kind==='radio'){radio.dataset.station='evening';radio.title='Evening station · quiet visual radio (no audio)';}trouble=Math.max(0,trouble-1);update();});
  let trouble=0,on=false,dirt=0,channel=0,knocks=0,asked=false,crackSeconds=0,previousBottom=Infinity;
  const mood=()=>trouble>=6?'furious':trouble>=3?'annoyed':'calm';
  function update(){root.dataset.mood=mood();root.classList.toggle('tv-on',on);root.dataset.dirt=String(dirt);root.dataset.channel=String(channel);tv.setAttribute('aria-pressed',String(on));tv.setAttribute('aria-label',on?'Turn television off':'Turn television on');mirror.setAttribute('aria-label',dirt>=3?'Mirror is dirty; use Clean mirror':'Smudge the mirror');panel.querySelector('.room-mood').textContent=`Mood: ${trouble>=6?'furious':trouble>=3?'suspicious':trouble?'watching you':'peaceful'}`;panel.querySelector('.room-meter span').style.width=`${trouble/8*100}%`;}
  function react(text,amount=0){trouble=Math.max(0,Math.min(8,trouble+amount));if(amount>0)asked=false;update();root.roomLife.react(text,mood());}
  function allowed(){return !root.roomLife.paused&&!root.dataset.restoring&&!root.roomLife.motion.active&&!document.hidden;}
  function hideCrack(){crack.hidden=true;repair.hidden=true;crackSeconds=0;}
  function reset(){stage.querySelectorAll('[data-personal-task]').forEach(el=>delete el.dataset.personalTask);radioOn=false;radio.classList.remove('is-on');radio.setAttribute('aria-pressed','false');radio.setAttribute('aria-label','Turn radio on');trouble=0;on=false;dirt=0;knocks=0;channel=0;asked=false;notice.hidden=true;hideCrack();update();root.roomLife.react('A clean room. A quiet TV. We can start over.');}
  tv.addEventListener('click',()=>{if(!allowed())return;on=!on;react(on?'I was enjoying the silence. Is that a mountain documentary?':'Thank you. Now I can hear my own thoughts.',on?1:-1);if(on)request(tv,'tune');else delete tv.dataset.personalTask;});
  mirror.addEventListener('click',()=>{if(!allowed())return;if(dirt===3){react('That is enough fingerprints. There is a clean button. Hint, hint.');return;}dirt++;react(dirt===1?'Was that a fingerprint on my mirror?':dirt===2?'I can see your decorating style. Unfortunately.':'My reflection has filed a complaint.',2);request(mirror,'mirror');});
  panel.addEventListener('click',e=>{const action=e.target.closest('[data-prank]')?.dataset.prank;if(!action||!allowed())return;
    if(action==='channel'){on=true;channel=(channel+1)%3;react(['Mountains. Finally, something calm.','The weather again? I have a window.','A whole channel about triangles. Fascinating.'][channel],1);request(tv,'tune');}
    if(action==='wipe'){request(mirror,'mirror');react('I will polish it myself. Carefully.');}
    if(action==='peace'){root.querySelector('[data-repair]')?.click();react('Give me a moment. I like to put things right myself.');}
    if(action==='knock'){knocks++;react(knocks===1?'Hello? That is the screen, not the door.':knocks===2?'One more knock and I am knocking back.':'You knocked. I knocked back. We should probably stop.',2);if(knocks>=3){knocks=0;if(panel.querySelector('input').checked&&!reduced.matches){crack.hidden=false;repair.hidden=false;crackSeconds=7;root.roomLife.react('That crack is pretend. My displeasure is not.',mood());}else root.roomLife.react('Consider the screen dramatically cracked. No effects needed.',mood());}}
  });
  root.addEventListener('room-mess',()=>react('You moved it. I noticed.',1));
  root.addEventListener('room-reset',reset);
  repair.addEventListener('click',hideCrack);
  panel.querySelector('input').addEventListener('change',hideCrack);
  reduced.addEventListener('change',()=>{if(reduced.matches)hideCrack();});
  notice.addEventListener('click',e=>{const action=e.target.closest('[data-exit]')?.dataset.exit;if(!action)return;notice.hidden=true;if(action==='back'){root.scrollIntoView({behavior:'auto',block:'start'});tv.focus({preventScroll:true});}});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){const focusIn=notice.contains(document.activeElement)||document.activeElement===repair;notice.hidden=true;hideCrack();if(focusIn)root.querySelector('[data-home=pause]').focus({preventScroll:true});}});
  window.addEventListener('scroll',()=>{const bottom=root.getBoundingClientRect().bottom;if(!asked&&trouble>=3&&allowed()&&bottom<innerHeight*.7&&previousBottom>=innerHeight*.7){asked=true;notice.querySelector('p').textContent='You made a mess of my room… and now you are escaping?';notice.hidden=false;}previousBottom=bottom;},{passive:true});
  setInterval(()=>{if(!crackSeconds||!allowed()||root.classList.contains('is-paused'))return;crackSeconds-=.5;if(crackSeconds<=0)hideCrack();},500);
  new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)hideCrack();}).observe(stage);
  update();
})();
