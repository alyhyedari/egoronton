const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/app/browser/node_modules/playwright-core');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.BASE_URL||'http://127.0.0.1:18853';assert(['127.0.0.1','localhost'].includes(new URL(base).hostname));
const out=path.resolve(__dirname,'../qa/startup');fs.mkdirSync(out,{recursive:true});const results=[];
const pass=name=>{results.push({name,status:'PASS'});console.log('PASS',name)};
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 async function context(){const c=await b.newContext({viewport:{width:375,height:812},deviceScaleFactor:1,reducedMotion:'reduce'});await c.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():r.abort());return c;}
 async function ready(p){await p.waitForFunction(()=>document.querySelector('#enter') && !document.querySelector('#enter').disabled,null,{timeout:90000});}
 async function enter(p){await ready(p);await p.uncheck('#learn-with-egor');await p.click('#enter');await p.waitForSelector('#settings-open');}
 async function theme(p,value){await p.waitForFunction(v=>document.documentElement.dataset.theme===v,value);}
 try{
  {
   const c=await context(),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
   await p.goto(base);await p.evaluate(()=>localStorage.setItem('egor-world-theme','night'));
   await p.goto(base+'/play/');await enter(p);await p.click('#garage-open');assert.equal(await p.locator('#garage-language').inputValue(),'en');await p.selectOption('#garage-language','fa');await p.click('#garage-close');
   await p.click('#settings-open');await theme(p,'night');assert.equal(await p.locator('[data-theme-toggle]').getAttribute('aria-pressed'),'true');await p.screenshot({path:out+'/night-settings-375.png'});
   await p.reload();await enter(p);await p.click('#garage-open');assert.equal(await p.locator('#garage-language').inputValue(),'fa');await p.screenshot({path:out+'/saved-persian-garage-375.png'});await p.click('#garage-close');
   await p.click('#settings-open');await p.click('[data-theme-toggle]');await theme(p,'paper');await p.screenshot({path:out+'/paper-settings-375.png'});
   const other=await c.newPage();await other.goto(base);await other.evaluate(()=>localStorage.setItem('egor-world-theme','night'));await theme(p,'night');await other.evaluate(()=>localStorage.removeItem('egor-world-theme'));await theme(p,'paper');await other.evaluate(()=>localStorage.setItem('egor-world-theme','night'));await theme(p,'night');await other.evaluate(()=>localStorage.clear());await theme(p,'paper');
   assert.deepEqual(errors,[]);pass('English default; saved Persian preserved; game theme persists; cross-tab set/remove/clear');await c.close();
  }
  {
   const c=await context();await c.addInitScript(()=>{Storage.prototype.getItem=Storage.prototype.setItem=()=>{throw new DOMException('blocked','SecurityError')};});const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
   await p.goto(base+'/play/');await enter(p);await p.click('#settings-open');await p.click('[data-theme-toggle]');await theme(p,'night');assert.match(await p.locator('#theme-status').innerText(),/Storage unavailable/);assert.deepEqual(errors,[]);pass('Blocked browser storage: game starts and theme toggles with warning');await c.close();
  }
  for(const mode of ['module','webgl','init']){
   const c=await context(),p=await c.newPage();let fail=true;
   if(mode==='module')await c.route('**/play/world.mjs',r=>fail?r.abort('failed'):r.continue());
   if(mode==='webgl')await c.addInitScript(()=>{if(!sessionStorage.getItem('retry-allowed')){const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/.test(type)?null:original.call(this,type,...args)};}});
   if(mode==='init')await c.route('**/play/world.mjs',async r=>{if(!fail)return r.continue();const response=await r.fetch();let body=await response.text();assert(body.includes('function init(){'));body=body.replace('function init(){','function init(){ throw new Error("QA injected init failure");');body=body.replace('app.destroy();','app.destroy();window.qaDestroyed=true;');await r.fulfill({response,body});});
   await p.goto(base+'/play/');await p.waitForSelector('#load-actions:not([hidden])');assert(await p.locator('#enter').isDisabled());assert.equal(await p.locator('#load').getAttribute('role'),'alert');assert.equal(await p.locator('#load-actions a').getAttribute('href'),'/');
   const message=await p.locator('#load').innerText();assert.match(message,mode==='module'?/could not load/:mode==='webgl'?/WebGL-capable/:/could not start/);if(mode==='init')assert.equal(await p.evaluate(()=>window.qaDestroyed),true);
   await p.screenshot({path:out+`/failure-${mode}-375.png`});fail=false;await p.evaluate(()=>{sessionStorage.setItem('retry-allowed','1');window.qaBeforeReload=true});await p.click('#load-retry');await p.waitForLoadState('domcontentloaded');await ready(p);assert.equal(await p.evaluate(()=>window.qaBeforeReload),undefined);assert.equal(await p.locator('#load-actions').isVisible(),false);await enter(p);pass(`${mode} failure: accessible error, disabled entry, return link, full reload retry succeeds${mode==='init'?' and app destroyed':''}`);await c.close();
  }
 }finally{await b.close();fs.writeFileSync(out+'/results.json',JSON.stringify(results,null,2)+'\n');}
})().catch(e=>{console.error(e);process.exitCode=1});
