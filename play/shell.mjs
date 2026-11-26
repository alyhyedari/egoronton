import {MODES,parseImport} from './session.mjs';
export function setupShell({store,pause,resume,isStarted,settings,savePosition,freezeSave}){
 const $=id=>document.getElementById(id),menu=$('pause-menu');
 const requested=new URLSearchParams(location.search).get('mode');if(Object.hasOwn(MODES,requested))store.patch({profile:{...store.state.profile,mode:requested}});
 function render(s,status){for(const b of document.querySelectorAll('[data-mode]'))b.setAttribute('aria-pressed',String(b.dataset.mode===s.profile.mode));$('session-mode').textContent=MODES[s.profile.mode].title;$('local-status').textContent=status;$('menu-save-status').textContent=status;$('quality').value=s.profile.quality;}
 store.subscribe(render);
 for(const b of document.querySelectorAll('[data-mode]'))b.onclick=()=>store.patch({profile:{...store.state.profile,mode:b.dataset.mode}});
 $('quality').onchange=e=>{store.patch({profile:{...store.state.profile,quality:e.target.value}});settings(e.target.value);};settings(store.state.profile.quality);
 function close(){menu.close();resume();}
 $('menu-open').onclick=()=>{if(!isStarted())return;pause();savePosition();menu.showModal();$('menu-resume').focus();};$('menu-resume').onclick=close;menu.addEventListener('cancel',e=>{e.preventDefault();close();});
 $('export-save').onclick=async()=>{savePosition();await store.flush();const blob=new Blob([JSON.stringify(store.state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='egorverse-save.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 $('import-save').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>1000000)throw Error('Choose a save smaller than 1 MB.');const next=parseImport(await file.text());if(!confirm('Replace this device’s progress with the selected save?'))return;freezeSave();await store.replace(next);location.reload();}catch(error){$('menu-save-status').textContent=error.message;}finally{e.target.value='';}};
 $('capture-mouse').onclick=async()=>{close();try{await $('world').requestPointerLock();}catch{$('caption').textContent='Mouse capture unavailable. Drag the view to look.';}};
 $('garage-open')&&$('toolbar').append($('garage-open'));
 for(const id of ['connect','car-action','quest-action'])$('context-actions').append($(id));
 $('guide').append($('toolbar'));
 return {blocked:()=>menu.open};
}
