// Game-only copy restriction. Leave pointer/touch movement and focus intact.
for (const event of ['copy', 'cut', 'contextmenu', 'dragstart', 'selectstart']) {
  document.addEventListener(event, e => e.preventDefault(), { capture: true });
}
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && ['KeyC', 'KeyX', 'KeyA'].includes(e.code)) {
    e.preventDefault(); e.stopImmediatePropagation();
  }
}, { capture: true });
