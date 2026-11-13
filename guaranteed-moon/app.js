'use strict';
const M=window.Moon, key='guaranteed-moon-text-prototype-v1';
let state=M.initial(), busy=false;
const $=id=>document.getElementById(id);
const catalogs=window.MoonLocales;
let language='en', statusKey='';
const englishKeys=new Map(Object.entries(catalogs.en).map(([key,value])=>[value,key]));
function t(key,params={}) {
  const text=catalogs[language][key] ?? key;
  return text.replace(/\{(\w+)\}/g,(_,name)=>String(params[name] ?? `{${name}}`));
}
const staticText=[...document.querySelectorAll('[data-i18n]')].map(node=>({node,key:englishKeys.get(node.textContent)}));
const staticAria=[...document.querySelectorAll('[data-i18n-aria]')].map(node=>({node,key:englishKeys.get(node.getAttribute('aria-label'))}));
function setLanguage(next) {
  if(!Object.hasOwn(catalogs,next))return;
  // Presentation only: neither the decision log nor browser storage is touched.
  const openDetails=[...$('notebook').querySelectorAll('details')].map(d=>d.open);
  language=next;
  document.documentElement.lang=language;
  document.documentElement.dir=language==='fa'?'rtl':'ltr';
  $('language').value=language;
  staticText.forEach(({node,key})=>{node.textContent=t(key);});
  staticAria.forEach(({node,key})=>node.setAttribute('aria-label',t(key)));
  $('status').textContent=t(statusKey);
  render(false);
  $('notebook').querySelectorAll('details').forEach((d,i)=>{if(i<openDetails.length)d.open=openDetails[i];});
}
function el(tag,text,cls) {const e=document.createElement(tag); if(text)e.textContent=t(text);if(cls)e.className=cls;return e;}
function say(key) {statusKey=key;$('status').textContent=t(key);}
function button(text,action,disabled=false) {const b=el('button',text);b.disabled=disabled;b.addEventListener('click',()=>{if(busy)return;busy=true;try{action();}catch(e){say(e.message);}finally{busy=false;}});return b;}
function signed(n) {return n>0?`+${n}`:String(n);}
function atmosphere(stage) {
  const story=M.narrative(state);
  stage.append(el('p',story.atmosphere,'atmosphere'));
  if(story.memories.length) {
    const memory=el('div',null,'memories');
    story.memories.forEach(text=>memory.append(el('p',text)));
    stage.append(memory);
  }
}
function render(focus=true) {
  $('stats').textContent=t('جوهر: {ink} · اعتماد: {trust}/۶ · شاهد: {evidence}/۳ · زیرساخت: {works}/۳ · تصمیم: {choices}/۶',{ink:state.ink,trust:state.trust,evidence:state.evidence.length,works:state.works.length,choices:state.choices.length});
  const stage=$('story'); stage.replaceChildren();
  if(state.ending) {
    const end=M.endings.find(e=>e.id===state.ending);
    stage.append(el('h2',end.title),el('p',end.text));
    atmosphere(stage);
    stage.append(el('h3','شهر پس از انتخاب تو'));
    const list=el('ul');M.consequences(state).forEach(t=>list.append(el('li',t)));stage.append(list);
    stage.append(button('دیدن پایان دیگر از همین نقطه',()=>{state=M.rewind(state,6);render();}));
  } else if(state.choices.length===6) {
    stage.append(el('h2','M7 · دفترچهٔ باز، پنج راه'),el('p','این پایان‌ها رتبه‌بندی اخلاقی یا جایزه نیستند. انتخاب آخر چیزی از کارهای انجام‌شده را پاک نمی‌کند.'));
    atmosphere(stage);
    M.endings.forEach(e=>{const box=el('article');const available=M.allowed(state).includes(e.id);box.append(el('h3',e.title),el('p',e.need),button(available?'این پایان را انتخاب کن':'فعلاً در دسترس نیست',()=>{state=M.finish(state,e.id);render();},!available));stage.append(box);});
  } else {
    const scene=M.scenes[state.choices.length];stage.append(el('p',scene.place,'eyebrow'),el('h2',`${scene.id} · ${t(scene.title)}`),el('p',scene.text));
    atmosphere(stage);
    scene.choices.forEach(c=>{const box=el('article');box.append(el('p',t('{ink} جوهر · {trust} اعتماد',{ink:signed(c.ink),trust:signed(c.trust)}),'effect'),el('p',c.tradeoff),button(c.label,()=>{state=M.choose(state,scene.id,c.id);say('تصمیم ثبت شد. نتیجه در دفترچه باقی می‌ماند؛ ذخیرهٔ دائمی دستی است.');render();},state.ink+c.ink<0));stage.append(box);});
  }
  const last=M.lastDecision(state);
  if(last) {
    const receipt=el('aside',null,'decision-receipt');
    receipt.setAttribute('aria-label',t('پیامد آخرین تصمیم'));
    receipt.append(el('p','ردّ انتخاب قبلی','eyebrow'),el('p',last.label,'decision-label'),el('p',last.result,'decision-result'),el('p',t('تغییر ثبت‌شده: {ink} جوهر · {trust} اعتماد',{ink:signed(last.ink),trust:signed(last.trust)}),'effect'));
    stage.prepend(receipt);
  }
  const book=$('notebook');book.replaceChildren(el('h2','دفترچهٔ پیامدها'));
  if(!state.choices.length) book.append(el('p','هنوز چیزی ننوشته‌ای. هر انتخاب نتیجه‌ای دارد و فرصتی را کنار می‌گذارد.'));
  state.choices.forEach((id,i)=>{const c=M.scenes[i].choices.find(c=>c.id===id);const d=el('details');d.open=i===state.choices.length-1;d.append(el('summary',`${M.scenes[i].id} · ${t(c.label)}`),el('p',c.result));book.append(d);});
  if(state.choices.length>=5)book.append(el('p',state.exposure?'در این نقطه سپردهٔ تمرینی از دست رفته است؛ سرزنش یا تضمین بازیابی جای کمک را نمی‌گیرد.':'بدون سپرده هم می‌توانی شاهد باشی یا به دیگران کمک کنی.','notice'));
  $('undo').disabled=!state.choices.length;
  if(focus)stage.focus();
}
$('undo').onclick=()=>{state=M.rewind(state,state.ending?6:Math.max(0,state.choices.length-1));say('تصمیم و پیامدهای پس از نقطهٔ بازگشت حذف شدند.');render();};
$('save').onclick=()=>{try{localStorage.setItem(key,M.save(state));say('ذخیرهٔ دستی در این مرورگر ثبت شد.');}catch{say('مرورگر ذخیره را نپذیرفت؛ بازی در حافظه ادامه دارد.');}};
$('load').onclick=()=>{try{const raw=localStorage.getItem(key);if(raw===null){say('ذخیره‌ای برای این نمونه وجود ندارد.');return;}if(state.choices.length&&!confirm(t('پیشرفت فعلی با ذخیرهٔ دستی جایگزین شود؟')))return;const next=M.load(raw);state=next;render();say('ذخیره بارگذاری و همهٔ پیامدها از انتخاب‌ها بازسازی شد.');}catch{say('ذخیره قابل بارگذاری نیست؛ وضعیت فعلی تغییر نکرد.');}};
$('reset').onclick=()=>{if(confirm(t('از ابتدا شروع شود؟ ذخیرهٔ دستی باقی می‌ماند.'))){state=M.initial();say('مسیر تازه آغاز شد.');render();}};
$('delete').onclick=()=>{if(confirm(t('فقط ذخیرهٔ همین نمونه حذف شود؟')))try{localStorage.removeItem(key);say('ذخیره حذف شد؛ بازی فعلی در حافظه باقی است.');}catch{say('حذف ذخیره در این مرورگر ممکن نشد.');}};
$('language').addEventListener('change',event=>setLanguage(event.target.value));
setLanguage('en');