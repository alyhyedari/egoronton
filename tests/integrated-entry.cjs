const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/app/browser/node_modules/playwright-core');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.BASE_URL||'http://127.0.0.1:18854';assert(['127.0.0.1','localhost'].includes(new URL(base).hostname));
const out=path.resolve(__dirname,'../qa/integrated');const results=[];
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{for(const width of [320,375,1440]){
 const c=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'}),errors=[],failed=[],blocked=new Set();
 await c.route('**/*',r=>{if(new URL(r.request().url()).origin===base)return r.continue();blocked.add(r.request().url());return r.abort();});
 const p=await c.newPage();p.setDefaultNavigationTimeout(120000);p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)failed.push([r.url(),r.status()]);});
 await p.goto(base);await p.waitForSelector('#entry-door');await p.waitForTimeout(1700);
 assert.equal(await p.locator('#neighborhood-entry').evaluate(e=>e.nextElementSibling.id),'idea-workshop');
 assert.equal(await p.locator('#entry-door').getAttribute('href'),'/play/');
 assert(await p.locator('.hero').count());
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await p.locator('#neighborhood-entry').screenshot({path:`${out}/entry-${width}-paper.png`});
 await p.locator('.theme-switch').click();assert.equal(await p.locator('html').getAttribute('data-theme'),'night');
 await p.locator('#neighborhood-entry').screenshot({path:`${out}/entry-${width}-night.png`});
 // Modified and middle clicks are not captured by the entrance handler.
 assert(await p.locator('#entry-door').evaluate(e=>[ {ctrlKey:true},{metaKey:true},{shiftKey:true},{altKey:true},{button:1} ].every(o=>{const event=new MouseEvent('click',{bubbles:true,cancelable:true,button:0,...o});e.addEventListener('click',ev=>ev.preventDefault(),{once:true});let preserved;const check=ev=>{preserved=!ev.defaultPrevented;};e.addEventListener('click',check,{capture:true,once:true});e.dispatchEvent(event);return preserved&&!e.dataset.state;})));
 await p.locator('#entry-door').focus();await p.keyboard.press('Enter');
 await p.waitForFunction(()=>document.querySelector('#entry-door')?.dataset.state==='knocking');
 await p.waitForFunction(()=>document.querySelector('#entry-door')?.dataset.state==='opening');
 await p.waitForURL(base+'/play/');await p.waitForFunction(()=>document.querySelector('#enter')&&!document.querySelector('#enter').disabled,null,{timeout:90000});
 assert.equal(await p.locator('html').getAttribute('data-theme'),'night');
 await p.uncheck('#learn-with-egor');await p.click('#enter');
 // Arrival uses active-page elapsed time; allow for software WebGL initialization.
 await p.locator('#settings-open').waitFor({state:'visible',timeout:120000});
 await p.click('#settings-open');await p.check('#control-reduced');
 assert.equal(await p.evaluate(()=>localStorage.getItem('egor-motion')),'off');
 const home=await c.newPage();home.setDefaultNavigationTimeout(120000);await home.goto(base);await home.waitForFunction(()=>document.body.classList.contains('motion-off'));
 await home.click('#motion-toggle');await p.waitForFunction(()=>!document.querySelector('#control-reduced').checked);
 await home.click('#motion-toggle');await p.waitForFunction(()=>document.querySelector('#control-reduced').checked);
 await home.locator('#entry-door').click();await home.waitForURL(base+'/play/');
 await p.click('[data-theme-toggle]');await p.goto(base);assert.equal(await p.locator('html').getAttribute('data-theme'),'paper');
 await p.emulateMedia({reducedMotion:'reduce'});await p.waitForFunction(()=>document.body.classList.contains('motion-off'));
 assert.equal(await p.locator('.entry-door-leaf').evaluate(e=>getComputedStyle(e).animationName),'none');
 await p.locator('#entry-door').click();await p.waitForURL(base+'/play/');
 await p.waitForFunction(()=>document.querySelector('#enter')&&!document.querySelector('#enter').disabled,null,{timeout:90000});
 assert(await p.locator('#reduced').isChecked());assert(await p.locator('#reduced').isDisabled());
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
 results.push({width,status:'PASS',checks:['section placement','no horizontal overflow','paper/night screenshots','keyboard knock/open/navigation','modified click leaves door idle','theme home-game-home','motion game-home and cross-tab','paused link navigation','OS reduced motion'],pageErrors:errors,failedLocalHTTP:failed,blockedExternalRequests:[...blocked]});console.log('PASS integrated',width);await c.close();
 }
}finally{await browser.close();fs.writeFileSync(out+'/entry-results.json',JSON.stringify(results,null,2)+'\n');}
})().catch(e=>{console.error(e);process.exitCode=1});
