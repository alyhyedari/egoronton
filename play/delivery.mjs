// A single, persisted delivery loop. No rendering, storage or clock dependency.
export const PICKUP=Object.freeze({x:53,z:8});
export const DROPOFF=Object.freeze({x:60,z:-42});
export function normalizeDelivery(raw){return {stage:['carrying','delivered','complete'].includes(raw?.stage)?raw.stage:'ready'};}
export function deliveryTarget(state){return state.stage==='complete'?null:state.stage==='carrying'?DROPOFF:PICKUP;}
export function deliveryAction(state,position,{active=true,driving=false,locked=false}={}){
 if(!active||driving||locked||state.stage==='complete')return null;
 const target=deliveryTarget(state);
 if(!Number.isFinite(position?.x)||!Number.isFinite(position?.z)||Math.hypot(position.x-target.x,position.z-target.z)>2.5)return null;
 return {ready:'Pick up the station parcel',carrying:'Deliver the parcel',delivered:'Confirm return at the garage'}[state.stage];
}
export function advanceDelivery(state,position,options){
 if(!deliveryAction(state,position,options))return false;
 state.stage={ready:'carrying',carrying:'delivered',delivered:'complete'}[state.stage];return true;
}
export function deliveryText(state,language='en'){const text={en:{
 ready:'North station delivery · Pick up the parcel beside the garage (east of the square). Use Garage → Visit garage on foot, then select the parcel action button.',
 carrying:'Take the parcel to the north station. Drive north on the west lane to checkpoint 1, stop, get out and approach the gold parcel on the east shoulder.',
 delivered:'Parcel delivered. Return to the blue parcel beside the garage and confirm your return.',
 complete:'Delivery complete. The station received its parcel and your return is recorded.'
 },fa:{
 ready:'تحویل به ایستگاه شمالی · بستهٔ آبی کنار گاراژ در شرق میدان را بردار. از گاراژ ← رفتن پیاده به گاراژ استفاده کن، سپس دکمهٔ برداشتن بسته را بزن.',
 carrying:'بسته را به ایستگاه شمالی ببر. از مسیر غربی به سمت شمال و ایستگاه ۱ بران؛ توقف کن، پیاده شو و به بستهٔ طلایی در حاشیهٔ شرقی جاده نزدیک شو.',
 delivered:'بسته تحویل شد. به بستهٔ آبی کنار گاراژ برگرد و بازگشتت را تأیید کن.',
 complete:'مأموریت تمام شد. ایستگاه بسته را دریافت کرد و بازگشتت ثبت شد.'
 }};return text[language==='fa'?'fa':'en'][state.stage];}
