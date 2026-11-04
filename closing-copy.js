/* Casual copy prevention only; public HTML remains accessible. */
(() => {
  'use strict';
  const regions = [...document.querySelectorAll('#community, footer.footer')];
  const inside = node => node && regions.some(region => region.contains(node));
  function protectedSelection() {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return false;
    for (let i = 0; i < selection.rangeCount; i++) {
      const range = selection.getRangeAt(i);
      if (regions.some(region => range.intersectsNode(region))) return true;
    }
    return false;
  }
  document.addEventListener('copy', event => {
    if (inside(event.target) || protectedSelection()) event.preventDefault();
  });
  regions.forEach(region => {
    ['contextmenu', 'dragstart', 'selectstart'].forEach(type => {
      region.addEventListener(type, event => event.preventDefault());
    });
  });
})();
