/* Pure indicator functions. No network access. */
'use strict';
window.DeskIndicators = (() => {
 const ema=(values,n)=>values.reduce((out,v,i)=>(out.push(i?v*2/(n+1)+out[i-1]*(1-2/(n+1)):v),out),[]);
 const sma=(values,n)=>{let sum=0;return values.map((v,i)=>{sum+=v;if(i>=n)sum-=values[i-n];return i>=n-1?sum/n:null;});};
 const rsi=(values,n=14)=>{let gain=0,loss=0;return values.map((v,i)=>{if(!i)return null;const d=v-values[i-1],g=Math.max(d,0),l=Math.max(-d,0);if(i<=n){gain+=g/n;loss+=l/n;}else{gain=(gain*(n-1)+g)/n;loss=(loss*(n-1)+l)/n;}return i<n?null:loss===0?(gain===0?50:100):100-100/(1+gain/loss);});};
 const macd=values=>{const fast=ema(values,12),slow=ema(values,26),line=fast.map((v,i)=>v-slow[i]),signal=ema(line,9);return {line,signal,hist:line.map((v,i)=>v-signal[i])};};
 return {ema,sma,rsi,macd};
})();
