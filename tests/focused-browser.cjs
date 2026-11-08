const {chromium}=require(process.env.PLAYWRIGHT_MODULE || '/app/browser/node_modules/playwright-core');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const out=path.resolve(__dirname,'../qa/focused');fs.mkdirSync(out,{recursive:true});
const base=process.env.BASE_URL||'http://127.0.0.1:18854';
assert(['127.0.0.1','localhost'].includes(new URL(base).hostname));
const localOnly=r=>new URL(r.request().url()).origin===base?r.continue():r.abort();
const results=[];const ok=name=>{results.push({name,status:'PASS'});console.log('PASS',name)};
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
 const p=await b.newPage({viewport:{width:1280,height:800},deviceScaleFactor:.5,reducedMotion:'reduce'});await p.context().route('**/*',localOnly);p.setDefaultTimeout(90000);
 const errors=[],bad=[];p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)bad.push(r.url())});
 async function ready(){await p.goto(base+'/play/');await p.waitForFunction(()=>!document.querySelector('#enter').disabled);}
 async function enter(){await p.click('#enter');await p.waitForSelector('#hud');await p.evaluate(async()=>{const pc=await import('./vendor/playcanvas.mjs');window.app=pc.Application.getApplication();window.player=app.root.findByName('temporary-blue-traveler');});}
 async function step(name){await p.waitForFunction(n=>document.querySelector('#coach').dataset.step===n,name);}
 async function hold(key,until){await p.keyboard.down(key);try{await until();}finally{await p.keyboard.up(key);}}
 async function focus(){assert.equal(await p.evaluate(()=>document.activeElement.id),'world');}
 await ready();await enter();await step('move');
 await hold('w',()=>step('look'));await hold('ArrowRight',()=>step('run'));await p.keyboard.down('Shift');await hold('w',()=>step('interact'));await p.keyboard.up('Shift');
 // Keep the interaction fixture outside the planter collider (z extends to 1.55).
 await p.evaluate(()=>new Promise(resolve=>{player.setPosition(-5,0,1.8);app.once('update',()=>requestAnimationFrame(resolve));}));await p.keyboard.press('e');await step('notebook');await p.keyboard.press('j');await step('pause');await p.keyboard.press('Escape');await p.keyboard.press('Escape');await step('done');
 assert.equal(await p.evaluate(()=>localStorage.getItem('egor-coach-v1')),'complete');await p.screenshot({path:out+'/tutorial-complete.png'});await p.click('#coach-dismiss');await p.keyboard.press('Escape');ok('Tutorial: all six signals, completion persisted (interaction position-assisted)');
 await p.click('#settings-open');assert.equal(await p.evaluate(()=>document.activeElement.id),'settings-close');
 await p.keyboard.press('Shift+Tab');assert.equal(await p.evaluate(()=>document.activeElement.id),'controls-reset');await p.keyboard.press('Tab');assert.equal(await p.evaluate(()=>document.activeElement.id),'settings-close');
 await p.click('[data-bind="forward"]');await p.keyboard.press('s');assert.match(await p.locator('#control-status').innerText(),/already in use/);await p.keyboard.press('Space');assert.match(await p.locator('#control-status').innerText(),/reserved/);await p.keyboard.press('Escape');assert(await p.locator('#control-settings').evaluate(e=>e.open));
 await p.click('[data-bind="forward"]');await p.keyboard.press('i');assert.match(await p.locator('[data-bind="forward"]').innerText(),/I/);
 await p.selectOption('#handedness','left');
 await p.locator('#control-size').fill('128');await p.locator('#control-height').fill('120');await p.locator('#control-sensitivity').fill('1.4');
 await p.screenshot({path:out+'/settings.png'});await p.keyboard.press('Escape');await focus();assert.equal(await p.evaluate(()=>document.body.classList.contains('paused')),false);
 // Test remapping in open space, independently of the position-assisted interaction.
 await p.evaluate(()=>new Promise(resolve=>{player.setPosition(0,0,5);app.once('update',()=>requestAnimationFrame(resolve));}));
 let pos=await p.evaluate(()=>player.getPosition().clone());await hold('w',()=>p.waitForTimeout(400));assert.deepEqual(await p.evaluate(()=>player.getPosition().clone()),pos);
 await p.evaluate(()=>{window.inputTrace=[];for(const type of ['keydown','keyup'])window.addEventListener(type,e=>inputTrace.push({type,code:e.code,target:e.target.id,prevented:e.defaultPrevented}));});
 try{await hold('i',()=>p.waitForFunction(pos=>Math.hypot(player.getPosition().x-pos.x,player.getPosition().z-pos.z)>.2,pos,{timeout:15000}));}catch(error){console.log('MOVE_DIAGNOSTIC',await p.evaluate(pos=>({before:pos,after:player.getPosition().clone(),inputTrace,body:document.body.className,focus:document.activeElement.id,dialogs:[...document.querySelectorAll('dialog[open]')].map(e=>e.id),controls:localStorage.getItem('egor-controls-v1')}),pos));throw error;}ok('Key remapping: conflicts, reserved keys, cancel, new/old bindings; modal focus and pause restore');
 const controls=await p.evaluate(()=>JSON.parse(localStorage.getItem('egor-controls-v1')));assert.equal(controls.size,128);assert.equal(controls.lift,120);assert.equal(controls.sensitivity,1.4);
 await ready();assert.equal(await p.locator('#learn-with-egor').isChecked(),false);await enter();assert.equal(await p.locator('#coach').isVisible(),false);assert.equal(await p.evaluate(()=>document.body.dataset.hand),'left');await p.click('#settings-open');assert.match(await p.locator('[data-bind="forward"]').innerText(),/I/);await p.click('#controls-reset');await p.click('#settings-close');await focus();ok('Settings and tutorial survive reload; controls reset');
 await p.click('#garage-open');assert(await p.locator('#garage-paint').isDisabled());assert.equal(await p.evaluate(()=>document.activeElement.id),'garage-close');await p.keyboard.press('Shift+Tab');assert.equal(await p.evaluate(()=>document.activeElement.id),'garage-reset');await p.keyboard.press('Tab');assert.equal(await p.evaluate(()=>document.activeElement.id),'garage-close');await p.selectOption('#garage-language','en');await p.click('#garage-visit');await focus();
 await p.click('#garage-open');assert(await p.locator('#garage-paint').isEnabled());await p.selectOption('#garage-paint','cherry');await p.selectOption('#garage-height','raised');await p.selectOption('#garage-camera','wide');await p.screenshot({path:out+'/garage-desktop.png'});await p.keyboard.press('Escape');await focus();
 await p.click('#car-action');assert(await p.evaluate(()=>document.body.classList.contains('driving')));await hold('w',()=>p.waitForFunction(()=>Number(document.querySelector('#drive-speed').textContent)>8));
 await p.keyboard.press('e');assert(await p.evaluate(()=>document.body.classList.contains('driving')));await p.keyboard.press('Escape');pos=await p.evaluate(()=>player.getPosition().clone());await p.waitForTimeout(500);assert.deepEqual(await p.evaluate(()=>player.getPosition().clone()),pos);await p.keyboard.press('Escape');
 await hold('Space',()=>p.waitForFunction(()=>document.querySelector('#drive-speed').textContent==='0'));await p.screenshot({path:out+'/driving-desktop.png'});await p.keyboard.press('e');assert.equal(await p.evaluate(()=>document.body.classList.contains('driving')),false);
 await p.click('#garage-open');p.once('dialog',d=>d.dismiss());await p.click('#garage-reset');assert(await p.locator('#garage-dialog').evaluate(e=>e.open));p.once('dialog',d=>d.accept());await p.click('#garage-reset');await focus();assert(Math.abs(await p.evaluate(()=>player.getPosition().x)-53.7)<1e-4);ok('Garage: bay customization, language, driving, speed exit guard, pause, brake, safe exit and recovery confirmation');
 await ready();await enter();await p.click('#garage-open');assert.equal(await p.locator('#garage-language').inputValue(),'en');assert.equal(await p.locator('#garage-paint').inputValue(),'cherry');assert.equal(await p.locator('#garage-height').inputValue(),'raised');assert.equal(await p.locator('#garage-camera').inputValue(),'wide');await p.keyboard.press('Escape');ok('Garage configuration persists across reload');
 await p.click('#coach-start');for(let i=0;i<6;i++)await p.click('#coach-skip-step');await step('done');await p.click('#coach-dismiss');
 assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);ok('No page errors or failed HTTP resources in desktop focused run');await p.close();
 for(const [width,height] of [[320,568],[375,812],[812,375]]){
  const c=await b.newContext({viewport:{width,height},deviceScaleFactor:.5,hasTouch:true,isMobile:true,reducedMotion:'reduce'});await c.route('**/*',localOnly);const t=await c.newPage();t.setDefaultTimeout(90000);await t.goto(base+'/play/');await t.waitForFunction(()=>!document.querySelector('#enter').disabled);await t.click('#enter');
  for(let i=0;i<6;i++)await t.click('#coach-skip-step');assert.equal(await t.evaluate(()=>localStorage.getItem('egor-coach-v1')),null);await t.click('#coach-dismiss');
  await t.click('#settings-open');assert(await t.locator('#control-settings').evaluate(e=>e.scrollWidth<=e.clientWidth+1));await t.screenshot({path:out+`/settings-${width}.png`});await t.click('#settings-close');
  await t.click('#garage-open');await t.click('#garage-visit');await t.click('#garage-open');assert(await t.locator('#garage-paint').isEnabled());assert(await t.locator('#garage-dialog').evaluate(e=>e.scrollWidth<=e.clientWidth+1));await t.screenshot({path:out+`/garage-${width}.png`});await t.click('#garage-close');await t.click('#car-action');
  const r=await t.locator('#stick').boundingBox();await t.mouse.move(r.x+r.width/2,r.y+8);await t.mouse.down();await t.waitForFunction(()=>Number(document.querySelector('#drive-speed').textContent)>5);await t.mouse.up();await t.locator('#car-brake').focus();await t.keyboard.press('Enter');await t.waitForFunction(()=>document.querySelector('#drive-speed').textContent==='0');await t.screenshot({path:out+`/driving-${width}.png`});await t.click('#car-action');assert.equal(await t.evaluate(()=>document.body.classList.contains('driving')),false);
  ok(`${width}x${height}: skip does not complete tutorial; settings/garage overflow; joystick driving and keyboard brake (emulated)`);await c.close();
 }
 }finally{await b.close();fs.writeFileSync(out+'/results.json',JSON.stringify(results,null,2));}
})().catch(e=>{console.error(e);process.exitCode=1});
