// Keep sequential keyboard navigation inside an open modal, including reverse Tab.
export function containModalFocus(dialog){
 dialog.addEventListener('keydown',event=>{
  if(event.key!=='Tab'||!dialog.open)return;
  const controls=[...dialog.querySelectorAll('button,input,select,textarea,a[href],[tabindex]')]
   .filter(el=>el.tabIndex>=0&&!el.matches(':disabled')&&el.getClientRects().length>0&&getComputedStyle(el).visibility!=='hidden');
  if(!controls.length){event.preventDefault();return;}
  const first=controls[0],last=controls.at(-1),active=document.activeElement;
  if(!controls.includes(active)||(event.shiftKey?active===first:active===last)){
   event.preventDefault();(event.shiftKey?last:first).focus();
  }
 });
}
