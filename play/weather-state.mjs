export const WEATHER_TYPES=['clear','cloudy','rain','thunder','snow','hail','tornado','rainbow'];
export const WEATHER_NAMES={clear:'Clear skies',cloudy:'Cloud drift',rain:'Rain',thunder:'Thunderstorm',snow:'Snowfall',hail:'Hail',tornado:'Distant tornado',rainbow:'After the rain'};
const clamp=(v,a,b,f)=>Number.isFinite(v)?Math.max(a,Math.min(b,v)):f;
export function normalizeWeather(raw={}){
 const r=raw&&typeof raw==='object'?raw:{};
 return {type:WEATHER_TYPES.includes(r.type)?r.type:'clear',previous:WEATHER_TYPES.includes(r.previous)?r.previous:'clear',mode:WEATHER_TYPES.includes(r.mode)?r.mode:'auto',seed:Math.floor(clamp(r.seed,1,4294967295,73193)),remaining:clamp(r.remaining,0,360,90),clock:clamp(r.clock,0,1200,400),blend:clamp(r.blend,0,1,1),wet:clamp(r.wet,0,1,0),snow:clamp(r.snow,0,1,0),elapsed:clamp(r.elapsed,0,1e10,0)};
}
function random(s){s.seed=(Math.imul(1664525,s.seed)+1013904223)>>>0;return s.seed/4294967296;}
const fronts={clear:['cloudy','cloudy','snow'],cloudy:['rain','snow','clear'],rain:['thunder','rainbow','hail'],thunder:['hail','rainbow','tornado'],hail:['rainbow','cloudy'],snow:['cloudy','clear'],tornado:['rain','rainbow'],rainbow:['clear','clear','cloudy']};
export function chooseWeather(s,type){if(!WEATHER_TYPES.includes(type))return;s.previous=s.type;s.type=type;s.blend=0;s.remaining=100+random(s)*100;}
export function stepWeather(s,dt){
 if(!Number.isFinite(dt)||dt<=0)return s;let left=Math.min(dt,3600);
 while(left>0){const h=Math.min(left,.25);left-=h;s.clock=(s.clock+h)%1200;s.elapsed+=h;s.blend=Math.min(1,s.blend+h/12);
  if(s.mode==='auto'){s.remaining-=h;if(s.remaining<=0){const choices=fronts[s.type];chooseWeather(s,choices[Math.floor(random(s)*choices.length)]);}}
  else if(s.type!==s.mode)chooseWeather(s,s.mode);
  const wet=['rain','thunder','hail','tornado'].includes(s.type),snow=s.type==='snow';
  s.wet=Math.max(0,Math.min(1,s.wet+h*(wet?.009:-.002)));s.snow=Math.max(0,Math.min(1,s.snow+h*(snow?.006:-.0015)));
 }return s;
}
export function weatherProfile(type){return {cloud:({clear:.08,cloudy:.55,rain:.78,thunder:.95,snow:.67,hail:.9,tornado:.98,rainbow:.28})[type]??0,fall:['rain','thunder','snow','hail','tornado'].includes(type),wind:type==='tornado'?1:type==='thunder'?.65:type==='snow'?.15:.25};}
