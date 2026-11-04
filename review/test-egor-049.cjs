const {chromium} = require('/app/browser/node_modules/playwright-core');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base='http://127.0.0.1:8049/';
const fixture=id=>JSON.parse(fs.readFileSync(`/mnt/data/egor-ton-only-research/${id==='ton'?'token':id}.json`));
const results=[];
(async()=>{
 const {parseRates,parseTon,TOKEN,RAW_TOKEN}=await import('./egor-world-0.4.9/market-live.mjs');
 const rate=v=>({rates:{[TOKEN]:v}});
 assert.deepEqual(parseRates(fixture('rates')),{price:0.00004478070581399451,change24:-0.64,change7:-28.67,change30:-29.52});
 for(const x of [null,{},[],{rates:[]},{rates:{wrong:{prices:{USD:1}}}}])assert.throws(()=>parseRates(x),/identity/);
 for(const x of [null,[],{}, {prices:{USD:0}},{prices:{USD:-1}}, {prices:{USD:true}}, {prices:{USD:'Infinity'}}])assert.throws(()=>parseRates(rate(x)),/schema/);
 for(const x of ['',null,true,[],{},'NaN','1.1oops','-2',' 2',Infinity])assert.equal(parseRates(rate({prices:{USD:x},diff_24h:{USD:'0%'}})).price,null);
 for(const x of [null,0,true,'','10','-101%','−100.01%','Infinity%','2%%'])assert.equal(parseRates(rate({prices:{USD:1},diff_24h:{USD:x}})).change24,null);
 for(const [x,y] of [['−100%',-100],['+2.5%',2.5],['0%',0],['-2%',-2]])assert.equal(parseRates(rate({diff_24h:{USD:x}})).change24,y);
 assert.equal(parseRates(rate({prices:{USD:'1e-8'}})).price,1e-8);
 const token=fixture('ton');assert.deepEqual(parseTon(token),{holders:297,supply:'1,000,000,000',mintable:'No'});
 for(const decimals of [8,'09',null,true])assert.throws(()=>parseTon({...token,metadata:{...token.metadata,decimals}}),/identity/);
 assert.throws(()=>parseTon({...token,metadata:{...token.metadata,address:TOKEN}}),/identity/);
 assert.equal(parseTon({...token,total_supply:'1000000000000000001'}).supply,'1,000,000,000.000000001');
 assert.deepEqual(parseTon({metadata:{address:RAW_TOKEN,decimals:9},holders_count:0,total_supply:'0',mintable:true}),{holders:0,supply:'0',mintable:'Yes'});
 for(const x of [-1,1.5,'297',null,Number.MAX_SAFE_INTEGER+1])assert.equal(parseTon({...token,holders_count:x}).holders,null);
 assert.throws(()=>parseTon({metadata:token.metadata}),/schema/);
 results.push({scenario:'strict parsers: identity, decimals, Unicode percentages, invalid fields, integer supply',pass:true});
 const browser=await chromium.launch({executablePath:'/opt/playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell',headless:true,args:['--no-sandbox']});
 async function setup(width=375,js=true){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce',serviceWorkers:'block',javaScriptEnabled:js});
  const page=await context.newPage(), errors=[], missing=[], calls=[], external=[],options=[];
  const modes={rates:'ok',ton:'ok'},pending=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()===404&&r.url().startsWith(base))missing.push(r.url());});
  await context.route('**/*',async route=>{
   const url=route.request().url();
   const id=url.startsWith('https://tonapi.io/v2/rates?')?'rates':url.startsWith('https://tonapi.io/v2/jettons/')?'ton':null;
   if(id){
    calls.push(id);assert.equal(route.request().headers()['referer'],undefined);assert.equal(route.request().headers()['cookie'],undefined);
    const mode=modes[id];
    if(mode==='pending'){pending.push({route,id});return;}
    if(mode==='network')return route.abort();
    if(mode==='429')return route.fulfill({status:429,headers:{'Retry-After':'600'},body:''});
    if(mode==='http')return route.fulfill({status:503,body:''});
    if(mode==='json')return route.fulfill({contentType:'application/json',body:'{broken'});
    let body=fixture(id);
    if(mode==='identity'){if(id==='rates')body.rates={wrong:body.rates[TOKEN]};else body.metadata.address='wrong';}
    if(mode==='schema')body=id==='rates'?rate({}):{metadata:body.metadata};
    if(mode==='partial'&&id==='rates')body.rates[TOKEN].prices.USD=null;
    return route.fulfill({contentType:'application/json',body:JSON.stringify(body)});
   }
   if(!url.startsWith(base)){external.push(url);return route.abort();}
   return route.continue();
  });
  await page.addInitScript(()=>{window.__fetchOptions=[];const original=window.fetch;window.fetch=(url,options)=>{if(String(url).startsWith('https://tonapi.io/'))window.__fetchOptions.push({credentials:options.credentials,cache:options.cache,referrerPolicy:options.referrerPolicy});return original(url,options);};});
  await page.goto(base+'market.html',{waitUntil:'networkidle'});
  if(js)await page.waitForFunction(()=>!document.querySelector('#market-controls').hidden);
  await page.locator('#market-controls').isVisible().then(async visible=>{if(visible)await page.locator('#market-controls').scrollIntoViewIfNeeded();});
  return {page,context,calls,external,modes,pending,errors,missing};
 }
 async function settled(t){await t.page.waitForFunction(()=>/of \d requested TonAPI endpoints/.test(document.querySelector('#market-status').textContent));}
 async function load(t){await t.page.locator('#market-refresh').click();await settled(t);}
 async function clean(t){assert.deepEqual(t.errors,[]);assert.deepEqual(t.missing,[]);assert.deepEqual(t.external,[]);await t.context.close();}
 for(const width of [320,375,768,1440]){
  const t=await setup(width),{page}=t;
  assert.equal(t.calls.length,0);assert.equal(t.external.length,0);
  await page.locator('#market-refresh').focus();await page.keyboard.press('Enter');await settled(t);
  assert.match(await page.locator('#market-status').innerText(),/2 of 2/);assert.equal(t.calls.length,2);
  assert.equal(await page.locator('#quote-rates [data-field="change24"]').innerText(),'−0.64%');
  assert.equal(await page.locator('#quote-ton [data-field="supply"]').innerText(),'1,000,000,000');
  assert.equal(await page.locator('.holder-count').innerText(),'297');
  assert.match(await page.locator('#quote-rates .quote-receipt').innerText(),/Observation time unknown/);
  assert.equal(await page.locator('iframe').count(),0);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.equal(await page.locator('.market-art').evaluate(e=>getComputedStyle(e).animationName),'none');
  assert.deepEqual(await page.evaluate(()=>window.__fetchOptions),Array(2).fill({credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer'}));
  await page.locator('.holder-notes summary').focus();await page.keyboard.press('Enter');
  assert.equal(await page.locator('.holder-notes').getAttribute('open'),'');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.screenshot({path:`/mnt/data/EGOR-049-market-${width}.png`,fullPage:true});
  await page.reload({waitUntil:'networkidle'});assert.equal(t.calls.length,2);
  assert.equal(await page.locator('#quote-rates [data-field="price"]').innerText(),'—');
  assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0);
  results.push({width,pass:true,checks:['no requests before consent','TonAPI only','keyboard loading and disclosure','no overflow','reduced motion','no persisted reports','no JS errors or local 404']});await clean(t);
 }
 {
  const t=await setup();await t.page.clock.install();await load(t);
  const receipt=await t.page.locator('#quote-rates .quote-receipt').innerText();
  await t.page.locator('#market-auto').check();t.modes.rates='identity';t.modes.ton='json';
  await t.page.clock.fastForward(65000);await t.page.waitForFunction(()=>document.querySelector('#market-status').textContent.startsWith('0 of 2'));
  assert.match(await t.page.locator('#quote-rates .quote-message').innerText(),/identity.*rejected/);
  assert.equal(await t.page.locator('#quote-rates .quote-receipt').innerText(),receipt);
  assert.match(await t.page.locator('#quote-ton .quote-message').innerText(),/Previous response remains visible/);
  assert.equal(await t.page.locator('#market-auto').isChecked(),false);assert.equal(await t.page.locator('#market-auto').isDisabled(),true);
  await t.page.clock.fastForward(300000);assert.equal(t.calls.length,4);
  assert.match(await t.page.locator('#quote-rates .quote-receipt').innerText(),/over 5 minutes/);
  results.push({scenario:'failed automatic refresh preserves receipt; auto disabled; stale age visible',pass:true});await clean(t);
 }
 {
  const t=await setup();await t.page.clock.install();t.modes.rates='429';await load(t);
  assert.match(await t.page.locator('#market-status').innerText(),/1 of 2/);
  await t.page.clock.fastForward(65000);await load(t);assert.equal(t.calls.filter(x=>x==='rates').length,1);assert.equal(t.calls.length,3);
  await t.page.clock.fastForward(540000);await load(t);assert.equal(t.calls.filter(x=>x==='rates').length,2);
  results.push({scenario:'429 honors 600-second Retry-After; token endpoint independent',pass:true});await clean(t);
 }
 for(const mode of ['network','http','schema','partial']){
  const t=await setup();t.modes.rates=mode;await load(t);
  const expected=mode==='partial'?'2 of 2':'1 of 2';assert.match(await t.page.locator('#market-status').innerText(),new RegExp(expected));
  if(mode==='partial'){assert.equal(await t.page.locator('#quote-rates [data-field="price"]').innerText(),'Unavailable');assert.match(await t.page.locator('#quote-rates .quote-message').innerText(),/Incomplete report/);}
  else assert.equal(await t.page.locator('#quote-rates [data-field="price"]').innerText(),'—');
  results.push({scenario:mode,pass:true});await clean(t);
 }
 {
  const t=await setup();await t.page.clock.install();t.modes.rates='pending';
  await t.page.locator('#market-refresh').click();await t.page.waitForFunction(()=>document.querySelector('#quote-ton').dataset.state==='ready');
  await t.page.clock.fastForward(13000);await settled(t);
  assert.match(await t.page.locator('#quote-rates .quote-message').innerText(),/timed out/);
  assert.match(await t.page.locator('#market-status').innerText(),/1 of 2/);
  results.push({scenario:'12-second timeout and partial success',pass:true});await clean(t);
 }
 {
  const t=await setup();await t.page.clock.install();Object.keys(t.modes).forEach(k=>t.modes[k]='pending');
  await t.page.locator('#market-refresh').click();await t.page.waitForTimeout(100);
  await t.page.locator('#market-stop').click();assert.match(await t.page.locator('#market-status').innerText(),/Requests stopped/);
  assert.equal(await t.page.evaluate(()=>document.activeElement.id),'market-status');
  assert.equal(await t.page.locator('#market-auto').isChecked(),false);
  for(const {route,id} of t.pending)await route.fulfill({contentType:'application/json',body:JSON.stringify(fixture(id))}).catch(()=>{});
  await t.page.waitForTimeout(100);assert.equal(await t.page.locator('#quote-rates [data-field="price"]').innerText(),'—');
  results.push({scenario:'stop cancels pending requests; focus retained; late responses ignored',pass:true});await clean(t);
 }
 {
  const t=await setup();await t.page.clock.install();await load(t);
  await t.page.locator('#market-auto').check();await t.page.clock.fastForward(65000);
  await t.page.waitForFunction(()=>window.__fetchOptions.length===4);await settled(t);assert.equal(t.calls.length,4);
  await t.page.locator('#method').scrollIntoViewIfNeeded();await t.page.waitForTimeout(150);await t.page.clock.fastForward(120000);assert.equal(t.calls.length,4);
  await t.page.locator('#market-controls').scrollIntoViewIfNeeded();await t.page.waitForTimeout(150);await t.page.clock.fastForward(2000);
  await t.page.waitForFunction(()=>window.__fetchOptions.length===6);await settled(t);assert.equal(t.calls.length,6);
  // Emulate the browser's visibility state and dispatch its native event.
  await t.page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
  await t.page.clock.fastForward(120000);assert.equal(t.calls.length,6);
  await t.page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});await t.page.clock.fastForward(2000);
  await t.page.waitForFunction(()=>window.__fetchOptions.length===8);await settled(t);
  await t.page.locator('#market-stop').click();await t.page.clock.fastForward(120000);assert.equal(t.calls.length,8);
  results.push({scenario:'auto refresh pauses offscreen/hidden, resumes visible, stops explicitly',pass:true});await clean(t);
 }
 {
  const t=await setup(320,false);
  assert.equal(await t.page.locator('#market-controls').isVisible(),false);
  assert.equal(await t.page.locator('.holder-count').innerText(),'297');assert.equal(t.calls.length,0);
  assert.equal(await t.page.locator('a[href^="https://tonviewer.com/"]').count(),1);
  results.push({scenario:'no-JavaScript snapshot and source links',pass:true});await clean(t);
 }
 {
  const t=await setup();await t.page.goto(base,{waitUntil:'networkidle'});
  assert.equal(await t.page.locator('a[href="market.html"]').count()>0,true);
  assert.equal(await t.page.locator('#market-refresh').count(),0);assert.equal(t.calls.length,0);
  results.push({scenario:'homepage links to standalone page without API reads',pass:true});await clean(t);
 }
 await browser.close();fs.writeFileSync('/mnt/data/EGOR-049-test-results.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
})().catch(e=>{console.error(e);process.exit(1)});
