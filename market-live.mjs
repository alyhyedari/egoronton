/* Opt-in public API reads. No keys, wallets, cookies or persistent quote cache. */
export const TOKEN = 'EQAO_tYpLbPq-GOXegYTYtFaQ0tMkxLBxzYF8cUCGGWAj_aA';
export const RAW_TOKEN = '0:0efed6292db3eaf863977a061362d15a434b4c9312c1c73605f1c5021865808f';
const MINUTE = 60000, STALE = 5 * MINUTE;
const number = value => {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  if (typeof value === 'string' && !/^\d+(?:\.\d+)?(?:e[+-]?\d+)?$/i.test(value)) return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
};
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
function percentage(value) {
  // TonAPI returns percentage strings, including the Unicode minus sign.
  if (typeof value !== 'string' || !/^[+−-]?\d+(?:\.\d+)?%$/.test(value)) return null;
  const n = Number(value.replace('−','-').slice(0,-1));
  return Number.isFinite(n) && n >= -100 ? n : null;
}
export function parseRates(body) {
  if (!record(body?.rates) || !Object.hasOwn(body.rates,TOKEN)) throw new Error('identity');
  const rate = body.rates[TOKEN];
  if (!record(rate)) throw new Error('schema');
  const price = number(rate.prices?.USD);
  const result = {price:price > 0 ? price : null,
    change24:percentage(rate.diff_24h?.USD),change7:percentage(rate.diff_7d?.USD),change30:percentage(rate.diff_30d?.USD)};
  if (Object.values(result).every(v => v === null)) throw new Error('schema');
  return result;
}
export function parseTon(body) {
  if (!record(body?.metadata) || body.metadata.address !== RAW_TOKEN || ![9,'9'].includes(body.metadata.decimals)) throw new Error('identity');
  let supply = null;
  if (typeof body.total_supply === 'string' && /^\d{1,80}$/.test(body.total_supply)) {
    const raw = BigInt(body.total_supply), unit = 1000000000n;
    const fraction = (raw % unit).toString().padStart(9,'0').replace(/0+$/,'');
    supply = (raw / unit).toLocaleString('en-US') + (fraction ? '.' + fraction : '');
  }
  const result = {holders:Number.isSafeInteger(body.holders_count) && body.holders_count >= 0 ? body.holders_count : null,supply,mintable:typeof body.mintable === 'boolean' ? (body.mintable ? 'Yes' : 'No') : null};
  if (Object.values(result).every(v => v === null)) throw new Error('schema');
  return result;
}
const sources = [
 {id:'rates', name:'TonAPI rates', url:`https://tonapi.io/v2/rates?tokens=${TOKEN}&currencies=USD`, parse:parseRates},
 {id:'ton', name:'TonAPI', url:`https://tonapi.io/v2/jettons/${TOKEN}`, parse:parseTon}
];
export function initMarket(panel) {
 const $ = s => panel.querySelector(s);
 const refresh = $('#market-refresh'), auto = $('#market-auto'), stop = $('#market-stop'), status = $('#market-status');
 const reports = sources.map(s => ({...s,card:$(`#quote-${s.id}`),data:null,received:0,next:0,error:'',busy:false}));
 let activated = false, busy = false, inView = false, stopped = false, cycle = 0, poll = 0, ticker = 0;
 const controllers = new Set();
 const utc = ms => new Date(ms).toISOString().replace('T',' ').replace(/\.\d{3}Z$/,' UTC');
 const fmt = (key,value) => {
   if (value === null) return 'Unavailable';
   if (key === 'price') return '$' + (value < .00000001 ? value.toExponential(4) : value.toLocaleString('en-US',{maximumSignificantDigits:7}));
   if (key.startsWith('change')) return (value > 0 ? '+' : value < 0 ? '−' : '') + Math.abs(value).toLocaleString('en-US',{maximumFractionDigits:2}) + '%';
   return typeof value === 'number' ? value.toLocaleString('en-US') : value;
 };
 function render() {
   const now = Date.now();
   for (const r of reports) {
     const old = r.received && now - r.received >= STALE;
     r.card.dataset.state = r.busy ? 'loading' : r.error ? 'error' : old ? 'stale' : r.data ? 'ready' : 'idle';
     r.card.querySelector('.source-state').textContent = r.busy ? 'Requesting' : r.error ? (r.data ? 'Saved in this visit' : 'Unavailable') : old ? 'Receipt > 5 min old' : r.data ? 'Response received' : 'Not loaded';
     if (r.data) for (const [key,value] of Object.entries(r.data)) r.card.querySelector(`[data-field="${key}"]`).textContent = fmt(key,value);
     r.card.querySelector('.quote-receipt').textContent = r.received ? `Received ${utc(r.received)} on this device. Observation time unknown.${old ? ' Receipt is over 5 minutes old.' : ''}` : 'No report received this visit.';
     r.card.querySelector('.quote-message').textContent = r.error || (r.data ? (Object.values(r.data).some(v=>v===null) ? 'Incomplete report: missing or invalid fields are unavailable. ' : '') + (r.id === 'ton' ? 'Token address and decimals checked. Address count is not people or distribution. Saved snapshot below is unchanged.' : 'Token key checked. TonAPI’s informational estimate, not an executable quote or a verified live trade.') : 'Not requested. Use Load TonAPI reports above.');
   }
   refresh.disabled = busy || (activated && reports.every(r => r.next > now));
   refresh.textContent = busy ? 'Requesting reports…' : refresh.disabled ? 'Please wait before refreshing' : activated ? 'Refresh TonAPI reports' : 'Load TonAPI reports';
 }
 function schedule() {
   clearTimeout(poll);
   if (!activated || stopped || busy || !auto.checked || !inView || document.hidden) return;
   const next = Math.max(Date.now() + 1000, Math.min(...reports.map(r => r.next)));
   poll = setTimeout(() => load(false), next - Date.now());
 }
 function cancel(message, permanent = false) {
   cycle++;
   controllers.forEach(c => c.abort());controllers.clear();
   reports.forEach(r => {if(r.busy) r.error = 'Request cancelled. No new report received.';r.busy=false;});
   busy = false;clearTimeout(poll);
   if (permanent) {stopped=true;auto.checked=false;auto.disabled=true;stop.hidden=true;}
   status.textContent=message;render();
 }
 function startTicker() {
   if (!ticker && !document.hidden && inView) ticker=setInterval(()=>{render();schedule();},15000);
 }
 async function load(manual) {
   if (busy || document.hidden || (!manual && (!inView || stopped || !auto.checked))) return;
   const eligible=reports.filter(r => Date.now() >= r.next);
   if (!eligible.length) {render();schedule();return;}
   activated=true;stopped=false;busy=true;auto.disabled=false;stop.hidden=false;
   const run=++cycle;startTicker();clearTimeout(poll);
   status.textContent='Requesting TonAPI rates and token metadata. Each endpoint can succeed or fail separately.';
   await Promise.all(eligible.map(async r => {
     const controller=new AbortController();controllers.add(controller);r.busy=true;r.error='';r.next=Date.now()+MINUTE;render();
     let timedOut=false;
     const timeout=setTimeout(()=>{timedOut=true;controller.abort();},12000);
     try {
       const response=await fetch(r.url,{signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer',cache:'no-store',headers:{Accept:'application/json'}});
       if(run!==cycle)return;
       if (response.status===429) {
         const retry=response.headers.get('Retry-After');
         const delay=retry && /^\d+$/.test(retry) ? Number(retry)*1000 : retry ? Date.parse(retry)-Date.now() : 0;
         r.next=Date.now()+Math.min(86400000,Math.max(STALE,Number.isFinite(delay)?delay:0));
         throw new Error('rate');
       }
       if (!response.ok) throw new Error('http');
       const data=r.parse(await response.json());
       if(run!==cycle)return;
       r.data=data;r.received=Date.now();r.error='';
     } catch(e) {
       if(run!==cycle)return;
       const messages={rate:'Rate limited. This endpoint is paused for at least 5 minutes; the other endpoint remains separate.',identity:'Unexpected token identity or decimals. Response rejected; no new values used.',schema:'No usable report values. Response rejected.',http:'TonAPI returned an unsuccessful HTTP response. No new report received.'};
       r.error=timedOut?'Request timed out after 12 seconds. No new report received.':messages[e.message] || 'Request failed or could not be read (network, browser policy or invalid JSON). No new report received.';
       if(r.data)r.error+=' Previous response remains visible, with its original receipt time.';
     } finally {clearTimeout(timeout);controllers.delete(controller);if(run===cycle){r.busy=false;render();}}
   }));
   if(run!==cycle)return;
   busy=false;
   const good=eligible.filter(r=>!r.error).length;
   if (reports.some(r=>r.error)) {auto.checked=false;auto.disabled=true;}
   status.textContent=`${good} of ${eligible.length} requested TonAPI endpoints returned a usable report.${reports.some(r=>r.error)?' Check each report’s status. No fallback provider.':''} ${auto.checked?'Automatic refresh is enabled only while this section is in view.':'Automatic refresh is off.'}`;
   render();schedule();
 }
 refresh.addEventListener('click',()=>load(true));
 auto.addEventListener('change',()=>{status.textContent=auto.checked?'Automatic refresh enabled. Requests run only while this section and tab are visible.':'Automatic refresh off. Use the refresh button when ready.';schedule();});
 stop.addEventListener('click',()=>{cancel('Requests stopped. Existing values are previous responses, not a live feed.',true);(refresh.disabled ? status : refresh).focus();});
 function visibilityChanged() {
   if(document.hidden || !inView){clearTimeout(poll);clearInterval(ticker);ticker=0;if(busy)cancel('Requests paused because this section or tab is out of view.');}
   else {render();if(activated){startTicker();schedule();}}
 }
 if ('IntersectionObserver' in window) new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;visibilityChanged();},{threshold:0}).observe($('#reports'));
 else inView=true;
 document.addEventListener('visibilitychange',visibilityChanged);
 addEventListener('pagehide',()=>cancel('Requests stopped on leaving this page.',true));
 $('#market-controls').hidden=false;render();
}
