// Public navigation only. No tokens, Telegram SDK, account data or management API.
export function linksFor(config){
 if(config?.version!==1||!/^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(config.username||''))throw Error('Invalid bot configuration');
 if(config.portalCode&&!/^[A-Za-z0-9_-]{1,62}$/.test(config.portalCode))throw Error('Invalid portal code');
 const base='https://t.me/'+config.username;
 return {bot:base+'?start=website',manage:base+'?start=panel',portal:config.portalCode?base+'?start=p_'+config.portalCode:'https://t.me/egorverseportal'};
}
if(typeof document!=='undefined'){
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),3500);
 fetch('/bot-config.json',{signal:controller.signal,cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Configuration unavailable');return r.json();}).then(c=>{
  const links=linksFor(c);for(const a of document.querySelectorAll('[data-egor-link]')){const url=links[a.dataset.egorLink];if(url)a.href=url;}
 }).catch(()=>{/* Hand-authored links remain usable if configuration cannot load. */}).finally(()=>clearTimeout(timeout));
}
