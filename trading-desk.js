/* EGOR desk preview: no network calls, synthetic data only. */
'use strict';
(() => {
 const $ = s => document.querySelector(s), canvas = $('#chart'), ctx = canvas.getContext('2d');
 const status = $('#desk-status'), key = 'egor-desk-pro-v2';
 const prefIDs=['quote','chart-type','ema','ema-period','sma','sma-period','volume','oscillator','grid','up-color','down-color','ink','stroke'];
 try {const prefs=JSON.parse(localStorage.getItem(key+'-prefs')||'{}');for(const id of prefIDs){const el=$('#'+id),v=prefs[id];if(el.type==='checkbox'&&typeof v==='boolean')el.checked=v;else if(typeof v==='string'){if(el.tagName==='SELECT'){if([...el.options].some(o=>o.value===v))el.value=v;}else if(el.type==='color'&&/^#[a-f\d]{6}$/i.test(v))el.value=v;else if(el.type==='number'&&Number(v)>=2&&Number(v)<=200)el.value=v;}}}catch{}
 const quote=()=>$('#quote').value, slot=()=>quote()+'-'+interval;
 function savePrefs(){try{localStorage.setItem(key+'-prefs',JSON.stringify(Object.fromEntries(prefIDs.map(id=>{const e=$('#'+id);return [id,e.type==='checkbox'?e.checked:e.value];}))));}catch{announce('Preferences could not be saved. This session still works.');}}
 let sma=[],rsi=[],macd={};
 function indicators(){for(const id of ['ema-period','sma-period']){const e=$('#'+id);e.value=Math.max(2,Math.min(200,Math.round(Number(e.value)||20)));}const closes=data.map(d=>d.c);ema=DeskIndicators.ema(closes,+$('#ema-period').value);sma=DeskIndicators.sma(closes,+$('#sma-period').value);rsi=DeskIndicators.rsi(closes);macd=DeskIndicators.macd(closes);}
 function summary(){const last=data.at(-1),prev=data.at(-2);$('#pair-title').textContent=`EGOR / ${quote()} · DEMO`;$('#pair-help').textContent=`Synthetic ${quote()} per 1 EGOR · not a swap quote`;$('#last-price').textContent=fmt(last.c)+' '+quote();$('#last-change').textContent=((last.c/prev.c-1)*100).toFixed(2)+'%';$('#range-high').textContent=fmt(Math.max(...data.map(d=>d.h)));$('#range-low').textContent=fmt(Math.min(...data.map(d=>d.l)));}
 let seed = 3317;
 const random = () => ((seed = (Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 const base = []; function generate(){base.length=0;seed={GRAM:3317,USD:7319,USDT:11939,EUR:15401,GBP:18253}[quote()];let price={GRAM:.24,USD:.0024,USDT:.0023,EUR:.0021,GBP:.0018}[quote()];
 for(let i=0;i<720;i++) {const o=price; price=Math.max(.00001,o*(1+(random()-.47)*.047));base.push({t:Date.UTC(2026,0,1)+i*3600000,o,h:Math.max(o,price)*(1+random()*.022),l:Math.min(o,price)*(1-random()*.022),c:price,v:200+random()*3600});}}
 generate();
 let interval=1,data=[],ema=[],end=720,count=100,tool='pan',drawings=[],redo=[],saved={},gesture=null,hover=null,frame=0,W=0,H=0,geometry=null;
 let storageOK=true;
 try{saved=JSON.parse(localStorage.getItem(key)||'{}');if(!saved||typeof saved!=='object')saved={};}catch{saved={};storageOK=false;}
 const validPoint=p=>p&&Number.isFinite(p.t)&&Number.isFinite(p.p);
 const validDrawing=d=>d&&['trend','horizontal','box','free','fib'].includes(d.type)&&/^#[\da-f]{6}$/i.test(d.color)&&Array.isArray(d.points)&&d.points.length>0&&d.points.length<=1000&&d.points.every(validPoint);
 function announce(text){status.textContent=text;}
 function persist(){saved[slot()]=drawings;try{localStorage.setItem(key,JSON.stringify(saved));storageOK=true;}catch{storageOK=false;} announce(storageOK?'Drawing saved in this browser only.':'Browser storage unavailable or full. This session still works; changes may not survive reload.');updateHistory();}
 function updateHistory(){$('#undo').disabled=!drawings.length;$('#redo').disabled=!redo.length;$('#clear').disabled=!drawings.length;}
 function load(step){if(gesture)gesture=null;interval=step;data=[];for(let i=0;i<base.length;i+=step){const a=base.slice(i,i+step);data.push({t:a[0].t,o:a[0].o,h:Math.max(...a.map(x=>x.h)),l:Math.min(...a.map(x=>x.l)),c:a.at(-1).c,v:a.reduce((s,x)=>s+x.v,0)});}indicators();end=data.length;count=Math.min(100,data.length);drawings=Array.isArray(saved[slot()])?saved[slot()].filter(validDrawing).slice(-150):[];redo=[];hover=null;updateHistory();table();summary();schedule();}
 const fmt=n=>n.toFixed(6), date=t=>new Date(t).toISOString().slice(0,16).replace('T',' ');
 function table(){const body=$('#data-table');body.replaceChildren();for(const d of data.slice(-20)){const tr=document.createElement('tr');for(const value of [date(d.t),fmt(d.o),fmt(d.h),fmt(d.l),fmt(d.c),d.v.toFixed(2)]){const td=document.createElement('td');td.textContent=value;tr.append(td);}body.append(tr);}}
 function schedule(){if(!frame)frame=requestAnimationFrame(render);}
 function resize(){const r=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);W=r.width;H=r.height;canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);schedule();}
 const color=n=>getComputedStyle(document.body).getPropertyValue(n).trim();
 function render(){frame=0;if(!W||!data.length)return;const volume=$('#volume').checked,osc=$('#oscillator').value,left=12,right=W-(W<500?69:85),top=36,bottom=H-(volume?112:38)-(osc==='none'?0:115),start=Math.max(0,end-count),visible=data.slice(start,end),cw=(right-left)/count;
 let lo=Math.min(...visible.map(x=>x.l)),hi=Math.max(...visible.map(x=>x.h));if($('#ema').checked){lo=Math.min(lo,...ema.slice(start,end));hi=Math.max(hi,...ema.slice(start,end));}if($('#sma').checked){const values=sma.slice(start,end).filter(v=>v!==null);lo=Math.min(lo,...values);hi=Math.max(hi,...values);}const padding=(hi-lo)*.12||.00001;lo-=padding;hi+=padding;
 const y=p=>top+(hi-p)/(hi-lo)*(bottom-top),x=t=>left+((t-data[start].t)/(interval*3600000)+.5)*cw;
 geometry={left,right,top,bottom,start,cw,lo,hi,x,y};
 ctx.clearRect(0,0,W,H);ctx.fillStyle=color('--panel');ctx.fillRect(0,0,W,H);ctx.font='10px ui-monospace,monospace';ctx.textBaseline='middle';
 for(let i=0;i<=5;i++){const yy=top+i*(bottom-top)/5;ctx.strokeStyle=color('--grid');if($('#grid').checked){ctx.beginPath();ctx.moveTo(left,yy);ctx.lineTo(right,yy);ctx.stroke();}ctx.fillStyle=color('--muted');ctx.fillText(fmt(hi-i*(hi-lo)/5),right+7,yy);}
 const maxV=Math.max(...visible.map(d=>d.v),1);
 ctx.save();ctx.beginPath();ctx.rect(left,top-8,right-left,H-top-20);ctx.clip();
 if($('#chart-type').value==='line'){ctx.strokeStyle=color('--blue');ctx.lineWidth=2;ctx.beginPath();visible.forEach((d,i)=>i?ctx.lineTo(x(d.t),y(d.c)):ctx.moveTo(x(d.t),y(d.c)));ctx.stroke();}
 visible.forEach(d=>{const xx=x(d.t),up=d.c>=d.o;ctx.fillStyle=ctx.strokeStyle=$('#'+(up?'up-color':'down-color')).value;if($('#chart-type').value==='candles'){ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(xx,y(d.h));ctx.lineTo(xx,y(d.l));ctx.stroke();ctx.fillRect(xx-cw*.3,Math.min(y(d.o),y(d.c)),Math.max(1,cw*.6),Math.max(1,Math.abs(y(d.o)-y(d.c))));}if(volume){ctx.globalAlpha=.55;ctx.fillRect(xx-cw*.3,H-30-d.v/maxV*65,Math.max(1,cw*.6),d.v/maxV*65);ctx.globalAlpha=1;}});
 if($('#ema').checked){ctx.strokeStyle=color('--blue');ctx.lineWidth=1.5;ctx.beginPath();visible.forEach((d,i)=>i?ctx.lineTo(x(d.t),y(ema[start+i])):ctx.moveTo(x(d.t),y(ema[start+i])));ctx.stroke();}
 if($('#sma').checked){ctx.strokeStyle=color('--ink');ctx.lineWidth=1.5;ctx.beginPath();let begun=false;visible.forEach(d=>{const v=sma[data.indexOf(d)];if(v===null)return;if(begun)ctx.lineTo(x(d.t),y(v));else{ctx.moveTo(x(d.t),y(v));begun=true;}});ctx.stroke();}
 ctx.restore();
 if(osc!=='none'){
 const ot=bottom+25,ob=ot+75,series=osc==='rsi'?[rsi]:[macd.line,macd.signal,macd.hist],values=series.flatMap(a=>a.slice(start,end)).filter(v=>v!==null);let min=osc==='rsi'?0:Math.min(0,...values),max=osc==='rsi'?100:Math.max(0,...values);const oy=v=>ob-(v-min)/(max-min||1)*(ob-ot);
 ctx.fillStyle=color('--muted');ctx.fillText(osc==='rsi'?'RSI 14 · Wilder':'MACD 12 / 26 / 9',left,ot-10);
 for(const v of osc==='rsi'?[30,70]:[0]){ctx.strokeStyle=color('--grid');ctx.beginPath();ctx.moveTo(left,oy(v));ctx.lineTo(right,oy(v));ctx.stroke();ctx.fillStyle=color('--muted');ctx.fillText(String(v),right+7,oy(v));}
 series.forEach((a,k)=>{ctx.strokeStyle=k===1?color('--ink'):color('--blue');ctx.lineWidth=1.5;ctx.beginPath();let begun=false;visible.forEach((d,i)=>{const v=a[start+i];if(v===null)return;if(k===2){ctx.fillStyle=v>=0?$('#up-color').value:$('#down-color').value;ctx.fillRect(x(d.t)-cw*.3,Math.min(oy(0),oy(v)),Math.max(1,cw*.6),Math.max(1,Math.abs(oy(v)-oy(0))));}else if(begun)ctx.lineTo(x(d.t),oy(v));else{ctx.moveTo(x(d.t),oy(v));begun=true;}});if(k!==2)ctx.stroke();});
 }
 ctx.save();ctx.beginPath();ctx.rect(left,top-8,right-left,bottom-top+16);ctx.clip();
 for(const d of [...drawings,...(gesture?.drawing?[gesture.drawing]:[])]){const a=d.points[0],b=d.points.at(-1);ctx.strokeStyle=d.color;ctx.lineWidth=Math.max(1,Math.min(4,Number(d.width)||2));ctx.beginPath();if(d.type==='fib'){for(const ratio of [0,.236,.382,.5,.618,.786,1]){const yy=y(a.p+(b.p-a.p)*ratio);ctx.moveTo(x(a.t),yy);ctx.lineTo(x(b.t),yy);ctx.fillStyle=d.color;ctx.fillText(String(ratio),Math.min(x(a.t),x(b.t))+4,yy-7);}}else if(d.type==='horizontal'){ctx.moveTo(left,y(a.p));ctx.lineTo(right,y(a.p));}else if(d.type==='box'){const xx=x(a.t),yy=y(a.p),ww=x(b.t)-xx,hh=y(b.p)-yy;ctx.globalAlpha=.10;ctx.fillStyle=d.color;ctx.fillRect(xx,yy,ww,hh);ctx.globalAlpha=1;ctx.rect(xx,yy,ww,hh);}else{d.points.forEach((p,i)=>i?ctx.lineTo(x(p.t),y(p.p)):ctx.moveTo(x(p.t),y(p.p)));}ctx.stroke();}
 if(hover&&hover.x>=left&&hover.x<=right){ctx.strokeStyle=color('--muted');ctx.lineWidth=1;ctx.setLineDash([3,4]);ctx.beginPath();ctx.moveTo(hover.x,top);ctx.lineTo(hover.x,H-28);ctx.moveTo(left,hover.y);ctx.lineTo(right,hover.y);ctx.stroke();ctx.setLineDash([]);}ctx.restore();
 ctx.fillStyle=color('--muted');ctx.font='10px ui-monospace,monospace';const ticks=W<500?2:4;for(let i=0;i<ticks;i++){const index=start+Math.floor(i*(count-1)/ticks),d=data[index];ctx.fillText(date(d.t).slice(5),x(d.t),H-12);}
 ctx.fillStyle=color('--blue');ctx.fillText(W<500?`EGOR/${quote()} · SYNTHETIC DEMO`:`EGOR/${quote()} · SYNTHETIC DEMO · NOT LIVE MARKET DATA`,left+5,14);if(volume){ctx.fillStyle=color('--muted');ctx.fillText('DEMO VOLUME · EGOR',left+5,H-104);}
 const selected=hover?Math.max(start,Math.min(end-1,start+Math.floor((hover.x-left)/cw))):end-1,d=data[selected];$('#readout').textContent=`${date(d.t)}  O ${fmt(d.o)}  H ${fmt(d.h)}  L ${fmt(d.l)}  C ${fmt(d.c)} ${quote()}  V ${d.v.toFixed(2)} EGOR`;
 }
 function position(e){const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};}
 function point(p){const g=geometry;return{t:data[g.start].t+((p.x-g.left)/g.cw-.5)*interval*3600000,p:g.hi-(p.y-g.top)/(g.bottom-g.top)*(g.hi-g.lo)};}
 function clampView(){count=Math.max(Math.min(12,data.length),Math.min(data.length,Math.round(count)));end=Math.max(count,Math.min(data.length,Math.round(end)));}
 function zoom(factor){count*=factor;clampView();schedule();}
 canvas.addEventListener('pointerdown',e=>{if(e.button!==0||!geometry)return;const p=position(e),g=geometry;if(p.x<g.left||p.x>g.right||p.y<g.top||p.y>g.bottom)return;canvas.focus({preventScroll:true});canvas.setPointerCapture(e.pointerId);if(tool==='pan')gesture={x:p.x,end,cw:g.cw};else{if(drawings.length>=150){announce('Drawing limit reached (150). Clear or undo a drawing first.');return;}gesture={drawing:{type:tool,color:$('#ink').value,width:+$('#stroke').value,points:[point(p)]}};}schedule();});
 canvas.addEventListener('pointermove',e=>{const p=position(e);hover=p;if(gesture){if(gesture.drawing){const d=gesture.drawing,q=point(p);if(d.type==='free'){if(d.points.length<1000)d.points.push(q);}else if(d.type!=='horizontal')d.points[1]=q;}else{end=gesture.end-Math.round((p.x-gesture.x)/gesture.cw);clampView();}}schedule();});
 function finish(cancel=false){if(gesture?.drawing&&!cancel){const d=gesture.drawing;if(d.type==='horizontal'||d.points.length>1){drawings.push(d);redo=[];persist();}}gesture=null;schedule();}
 canvas.addEventListener('pointerup',()=>finish());canvas.addEventListener('pointercancel',()=>finish(true));canvas.addEventListener('lostpointercapture',()=>{if(gesture)finish(true);});canvas.addEventListener('pointerleave',()=>{if(!gesture){hover=null;schedule();}});
 canvas.addEventListener('wheel',e=>{if(document.activeElement!==canvas)return;e.preventDefault();zoom(e.deltaY>0?1.15:.87);},{passive:false});
 canvas.addEventListener('keydown',e=>{if(e.key==='Escape'){finish(true);return;}if(['ArrowLeft','ArrowRight','+','=','-'].includes(e.key)){e.preventDefault();if(e.key.startsWith('Arrow')){end+=e.key==='ArrowLeft'?-5:5;clampView();schedule();}else zoom(e.key==='-'?1.2:.8);}});
 document.querySelectorAll('[data-tool]').forEach(b=>b.addEventListener('click',()=>{finish(true);tool=b.dataset.tool;document.querySelectorAll('[data-tool]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));canvas.style.cursor=tool==='pan'?'grab':'crosshair';announce(tool==='horizontal'?'Click the chart to place a price level.':tool==='pan'?'Drag to pan. Arrow keys also pan the chart.':'Drag on the chart to draw. Escape cancels the current drawing.');}));
 document.querySelectorAll('[data-interval]').forEach(b=>b.addEventListener('click',()=>{load(Number(b.dataset.interval));document.querySelectorAll('[data-interval]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));announce('Demo interval changed. Drawings are stored separately for each interval.');}));
 $('#undo').onclick=()=>{if(drawings.length){redo.push(drawings.pop());persist();schedule();}};$('#redo').onclick=()=>{if(redo.length){drawings.push(redo.pop());persist();schedule();}};$('#clear').onclick=()=>{if(drawings.length&&confirm('Clear drawings for this demo interval?')){drawings=[];redo=[];persist();schedule();}};
 $('#zoom-in').onclick=()=>zoom(.8);$('#zoom-out').onclick=()=>zoom(1.2);$('#reset').onclick=()=>{count=Math.min(100,data.length);end=data.length;hover=null;schedule();};
 prefIDs.forEach(id=>$('#'+id).addEventListener('change',()=>{if(id==='quote'){finish(true);generate();load(interval);}else if(id.endsWith('-period'))indicators();savePrefs();schedule();}));
 $('#export-csv').onclick=()=>{const lines=['SYNTHETIC DEMO - NOT MARKET DATA',`EGOR/${quote()} - ${interval}h - OHLC in ${quote()} - volume in EGOR`,'UTC,Open,High,Low,Close,Volume',...data.map(d=>[date(d.t),d.o,d.h,d.l,d.c,d.v].join(','))];const url=URL.createObjectURL(new Blob([lines.join('\r\n')],{type:'text/csv'}));const a=document.createElement('a');a.href=url;a.download=`EGOR-${quote()}-${interval}h-SYNTHETIC.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);announce('Exported all demo candles for this interval, not market data.');};

 if(!document.fullscreenEnabled)$('#fullscreen').hidden=true;
 $('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('#workspace').requestFullscreen();}catch{announce('Full screen is not available in this browser.');}};
 document.addEventListener('fullscreenchange',()=>{$('#fullscreen').textContent=document.fullscreenElement?'Exit full screen':'Full screen';});
 $('#export').onclick=()=>{if(frame){cancelAnimationFrame(frame);frame=0;}render();canvas.toBlob(blob=>{if(!blob){announce('Image export is unavailable.');return;}const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='EGOR-desk-SYNTHETIC-DEMO.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);announce('Exported chart includes the synthetic-data label.');});};
 window.addEventListener('egor:theme',schedule);
 new ResizeObserver(resize).observe(canvas.parentElement);load(1);if(!storageOK)announce('Browser storage unavailable. Drawings may not survive reload.');
})();
