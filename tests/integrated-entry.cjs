const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/app/browser/node_modules/playwright-core');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.BASE_URL||'http://127.0.0.1:18854';assert(['127.0.0.1','localhost'].includes(new URL(base).hostname));
const out=path.resolve(__dirname,'../qa/integrated');const results=[];
const widths=(process.env.QA_WIDTHS||'320,375,1440').split(',').map(Number);
const resultsFile=process.env.QA_RESULTS_FILE||'entry-results.json';
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{for(const width of widths){
 console.log('START integrated',width);
 const c=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'}),errors=[],failed=[],blocked=new Set();
 await c.route('**/*',r=>{if(new URL(r.request().url()).origin===base)return r.continue();blocked.add(r.request().url());return r.abort();});
 const p=await c.newPage();p.setDefaultNavigationTimeout(120000);p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)failed.push([r.url(),r.status()]);});
 await p.goto(base);await p.waitForSelector('#entry-door');await p.waitForTimeout(1700);
 assert.equal(await p.locator('#neighborhood-entry').evaluate(e=>e.nextElementSibling.id),'idea-workshop');
 assert.equal(await p.locator('#entry-door').getAttribute('href'),'/play/');
 assert.equal(await p.locator('#neighborhood-entry').getAttribute('lang'),'en');
 assert.equal(await p.locator('#neighborhood-entry').getAttribute('dir'),'ltr');
 assert.equal(await p.locator('#entry-door').getAttribute('aria-label'),'Knock and enter EGOR World');
 assert.equal(await p.locator('#entry-door-status').textContent(),'Knock to enter ↑');
 assert(!/[\u0600-\u06ff]/u.test(await p.locator('#neighborhood-entry').evaluate(e=>e.outerHTML)));
 assert(await p.locator('.hero').count());
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await p.locator('#neighborhood-entry').evaluate(e=>e.scrollIntoView({behavior:'instant',block:'center'}));
 if(process.env.QA_SKIP_SCREENSHOTS!=='1') await p.screenshot({path:`${out}/entry-${width}-paper.png`,animations:'disabled',timeout:120000});
 await p.locator('.theme-switch').click();assert.equal(await p.locator('html').getAttribute('data-theme'),'night');
 if(process.env.QA_SKIP_SCREENSHOTS!=='1') await p.screenshot({path:`${out}/entry-${width}-night.png`,animations:'disabled',timeout:120000});
 // Modified and middle clicks are not captured by the entrance handler.
 assert(await p.locator('#entry-door').evaluate(e=>[ {ctrlKey:true},{metaKey:true},{shiftKey:true},{altKey:true},{button:1} ].every(o=>{const event=new MouseEvent('click',{bubbles:true,cancelable:true,button:0,...o});e.addEventListener('click',ev=>ev.preventDefault(),{once:true});let preserved;const check=ev=>{preserved=!ev.defaultPrevented;};e.addEventListener('click',check,{capture:true,once:true});e.dispatchEvent(event);return preserved&&!e.dataset.state;})));
 await p.evaluate(()=>{window.__doorMessages=[];new MutationObserver(()=>{sessionStorage.setItem('qa-door-messages',JSON.stringify(window.__doorMessages.concat(document.querySelector('#entry-door-status').textContent)));window.__doorMessages.push(document.querySelector('#entry-door-status').textContent);}).observe(document.querySelector('#entry-door-status'),{childList:true,subtree:true,characterData:true});});
 await p.locator('#entry-door').focus();await p.keyboard.press('Enter');
 await p.waitForURL(base+'/play/');
 const messages=await p.evaluate(()=>JSON.parse(sessionStorage.getItem('qa-door-messages')||'[]'));
 assert(messages.includes('Knock, knock…'));assert(messages.includes('Welcome in. The door is opening…'));
 console.log('Doorway navigation and English messages PASS',width);
 await p.waitForFunction(()=>document.querySelector('#enter')&&!document.querySelector('#enter').disabled,null,{timeout:90000});
 assert.equal(await p.locator('html').getAttribute('data-theme'),'night');
 await p.uncheck('#learn-with-egor');await p.click('#enter');
 // Arrival uses active-page elapsed time; allow for software WebGL initialization.
 await p.locator('#settings-open').waitFor({state:'visible',timeout:120000});
 console.log('Game settings reached',width);
 await p.click('#settings-open');await p.check('#control-reduced');
 assert.equal(await p.evaluate(()=>localStorage.getItem('egor-motion')),'off');
 const home=await c.newPage();home.setDefaultNavigationTimeout(120000);await home.goto(base);await home.waitForFunction(()=>document.body.classList.contains('motion-off'));
 await home.click('#motion-toggle');await p.waitForFunction(()=>!document.querySelector('#control-reduced').checked);
 await home.click('#motion-toggle');await p.waitForFunction(()=>document.querySelector('#control-reduced').checked);
 console.log('Cross-tab motion checks PASS',width);
 await home.locator('#entry-door').click();await home.waitForURL(base+'/play/');
 await home.close();
 await p.click('[data-theme-toggle]');await p.goto(base);assert.equal(await p.locator('html').getAttribute('data-theme'),'paper');
 await p.emulateMedia({reducedMotion:'reduce'});await p.waitForFunction(()=>document.body.classList.contains('motion-off'));
 assert.equal(await p.locator('.entry-door-leaf').evaluate(e=>getComputedStyle(e).animationName),'none');
 await p.locator('#entry-door').click();await p.waitForURL(base+'/play/');
 await p.waitForFunction(()=>document.querySelector('#enter')&&!document.querySelector('#enter').disabled,null,{timeout:90000});
 assert(await p.locator('#reduced').isChecked());assert(await p.locator('#reduced').isDisabled());
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
 results.push({width,status:'PASS',screenshotsCaptured:process.env.QA_SKIP_SCREENSHOTS!=='1',checks:['English-only doorway copy, accessibility label and dynamic messages','section placement','no horizontal overflow','paper/night themes','keyboard knock/open/navigation','modified click leaves door idle','theme home-game-home','motion game-home and cross-tab','paused link navigation','OS reduced motion'],pageErrors:errors,failedLocalHTTP:failed,blockedExternalRequests:[...blocked]});console.log('PASS integrated',width);await c.close();
 }
}finally{await browser.close();fs.writeFileSync(path.join(out,resultsFile),JSON.stringify(results,null,2)+'\n');}
})().catch(e=>{console.error(e);process.exitCode=1});
