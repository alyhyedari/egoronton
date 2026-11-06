import { TOKEN } from './market-live.mjs';
export const POOL = 'EQCPXfpc_WZg2zLocLIN0-YyJuSwe6V8GPsPcElX23j1CHYF';
const TON = 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c';
const endpoint = `https://api.geckoterminal.com/api/v2/networks/ton/pools/${POOL}`;
const positive = v => (typeof v === 'string' && /^\d+(\.\d+)?(e[+-]?\d+)?$/i.test(v) || typeof v === 'number') && Number.isFinite(Number(v)) && Number(v) > 0;
export function checkPool(body) {
 const p = body?.data;
 if (p?.attributes?.address !== POOL || p?.relationships?.base_token?.data?.id !== `ton_${TOKEN}` || p?.relationships?.quote_token?.data?.id !== `ton_${TON}` || p?.relationships?.dex?.data?.id !== 'dedust-v2') throw Error('Pool identity mismatch');
}
export function parseTrades(body) {
 if (!Array.isArray(body?.data)) throw Error('Invalid trade response');
 const seen = new Set(); let rejected = 0;
 const rows = [];
 for (const item of body.data) {
  const a = item?.attributes;
  const buy = a?.to_token_address === TOKEN && a?.from_token_address === TON;
  const sell = a?.from_token_address === TOKEN && a?.to_token_address === TON;
  const amount = buy ? a.to_token_amount : a?.from_token_amount;
  const price = buy ? a.price_to_in_usd : a?.price_from_in_usd;
  const ton = buy ? a?.from_token_amount : a?.to_token_amount;
  const time = Date.parse(a?.block_timestamp);
  if (item?.type !== 'trade' || typeof item.id !== 'string' || !(buy || sell) || a.kind !== (buy ? 'buy' : 'sell') || !/^[a-f0-9]{64}$/i.test(a.tx_hash) || !positive(amount) || !Number.isFinite(time) || time > Date.now()+60000 || a.is_anomalous === true) { rejected++; continue; }
  if (seen.has(item.id)) continue;
  seen.add(item.id);
  rows.push({time,side:buy?'Buy':'Sell',amount:Number(amount),ton:positive(ton)?Number(ton):null,price:positive(price)?Number(price):null,usd:positive(a.volume_in_usd)?Number(a.volume_in_usd):null,hash:a.tx_hash});
 }
 return {rows:rows.sort((a,b)=>b.time-a.time).slice(0,100),rejected};
}
const panel = typeof document !== 'undefined' && document.querySelector('#trade-feed');
if (panel) {
 const status = panel.querySelector('[role=status]'), tbody = panel.querySelector('tbody'), refresh = panel.querySelector('[data-refresh]'), auto = panel.querySelector('[data-auto]'), filter = panel.querySelector('select');
 let page = 1, pageSize = 10, pending = null;
 const pager = document.createElement('nav');
 pager.className = 'trade-pagination';
 pager.setAttribute('aria-label', 'Trade pages');
 pager.innerHTML = '<div class="trade-page-summary" role="status" aria-live="polite"></div><label class="trade-page-size">Rows per page <select aria-label="Trades per page"><option>10</option><option>25</option><option>50</option></select></label><div class="trade-page-buttons"><button type="button" data-step="first" aria-label="First trade page">«</button><button type="button" data-step="prev" aria-label="Previous trade page">‹ Previous</button><span class="trade-page-numbers"></span><button type="button" data-step="next" aria-label="Next trade page">Next ›</button><button type="button" data-step="last" aria-label="Last trade page">»</button></div><button type="button" class="trade-new" hidden>Updated results available — show latest</button><p>Pages cover this returned sample only — not a complete trading history.</p>';
 panel.append(pager);
 const summary = pager.querySelector('.trade-page-summary'), numbers = pager.querySelector('.trade-page-numbers'), latest = pager.querySelector('.trade-new');
 const filtered = () => rows.filter(r => filter.value === 'All' || r.side === filter.value);
 const pages = () => Math.max(1, Math.ceil(filtered().length / pageSize));
 function acceptPending() { if(pending) { rows=pending.rows; rejected=pending.rejected; received=pending.received; pending=null; } }
 function navigate(target) { page=Math.max(1,Math.min(pages(),target));if(page===1)acceptPending();render();panel.querySelector('.trade-scroll').scrollTop=0; }
 pager.addEventListener('click', e => {
  const button=e.target.closest('button');if(!button || button.disabled)return;
  if(button===latest){page=1;acceptPending();navigate(1);return;}
  const step=button.dataset.step;
  if(button.dataset.page)navigate(Number(button.dataset.page));
  else if(step)navigate(step==='first'?1:step==='last'?pages():page+(step==='next'?1:-1));
 });
 pager.querySelector('select').addEventListener('change',e=>{pageSize=Number(e.target.value);navigate(1);});
 let rows = [], received = 0, next = 0, busy = false, controller, visible = false, error = '', rejected = 0;
 const fmt = n => n === null ? 'Unavailable' : n.toLocaleString('en-US',{maximumSignificantDigits:7});
 function render() {
  refresh.disabled = busy || Date.now() < next;
  status.textContent = busy ? 'Requesting GeckoTerminal reports…' : `${error ? error+' ' : ''}${received ? `Last received ${new Date(received).toISOString()}. ${Date.now()-received>300000?'STALE response. ':''}${rows.length} trades in returned sample; ${rejected} invalid or anomalous entries excluded.` : 'Not loaded. No synthetic trades are used.'}`;
  const matches=filtered();page=Math.min(page,pages());
  const start=(page-1)*pageSize;
  summary.textContent=matches.length?`${start+1}–${Math.min(start+pageSize,matches.length)} of ${matches.length} trades · Page ${page} of ${pages()}`:'0 trades · No pages';
  latest.hidden=!pending;
  for(const button of pager.querySelectorAll('[data-step]'))button.disabled=button.dataset.step==='first'||button.dataset.step==='prev'?page===1:page===pages();
  // Keep numbered controls stable across timer ticks so keyboard focus is not lost.
  const signature=`${page}/${pages()}`;
  if(numbers.dataset.signature!==signature){
   const focused=numbers.contains(document.activeElement)?document.activeElement.dataset.page:null;
   numbers.replaceChildren();numbers.dataset.signature=signature;
   for(let n=1;n<=pages();n++){
    const b=document.createElement('button');b.type='button';b.dataset.page=String(n);b.textContent=String(n);b.setAttribute('aria-label',`Trade page ${n}`);if(n===page)b.setAttribute('aria-current','page');numbers.append(b);
   }
   if(focused)numbers.querySelector(`[data-page="${Math.min(Number(focused),pages())}"]`)?.focus({preventScroll:true});
  }
  tbody.replaceChildren();
  for (const r of matches.slice(start,start+pageSize)) {
   const tr = document.createElement('tr');
   tr.className = r.side === 'Buy' ? 'trade-buy' : 'trade-sell';
   for (const text of [new Date(r.time).toISOString().replace('T',' ').replace('.000Z',' UTC'),r.side,fmt(r.amount),fmt(r.ton),fmt(r.price),fmt(r.usd)]) { const td=document.createElement('td'); td.textContent=text;tr.append(td); }
   const td=document.createElement('td'), a=document.createElement('a'); a.href=`https://tonviewer.com/transaction/${r.hash}`;a.textContent='View transaction ↗';a.target='_blank';a.rel='noopener noreferrer';td.append(a);tr.append(td);tbody.append(tr);
  }
  if (!tbody.children.length) { const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=7;td.textContent=received?'No matching trades in the returned sample.':'No trades loaded.';tr.append(td);tbody.append(tr); }
 }
 async function load() {
  if (busy || Date.now()<next || document.hidden) return;
  busy=true;next=Date.now()+60000;error='';controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),15000);render();
  async function request(url) {
   const r=await fetch(url,{signal:controller.signal,credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer'});
   if(r.status===429){next=Date.now()+300000;throw Error('Rate limited; paused for five minutes.');}
   if(!r.ok)throw Error('Provider unavailable.');return r.json();
  }
  try { checkPool(await request(endpoint));const result=parseTrades(await request(endpoint+'/trades'));if(result.rejected && !result.rows.length)throw Error('No valid trade records; response rejected.');if(page>1){pending={...result,received:Date.now()};}else{rows=result.rows;rejected=result.rejected;received=Date.now();pending=null;} }
  catch(e){error=(e.name==='AbortError'?'Request cancelled or timed out.':e.message)+' Previous results, if any, are not live.';}
  finally{clearTimeout(timeout);busy=false;render();}
 }
 refresh.addEventListener('click',load);filter.addEventListener('change',()=>navigate(1));
 auto.addEventListener('change',()=>{if(auto.checked&&visible)load();});
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible&&auto.checked)load();}).observe(panel);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)controller?.abort();else if(auto.checked)load();});
 setInterval(()=>{if(!document.hidden){render();if(visible&&auto.checked)load();}},10000);
 render();
 load();
}
