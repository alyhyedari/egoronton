/* Keep room dialogue outside the illustration, with a user-paced archive. */
(() => {
  function mount() {
    const root = document.querySelector('.egor-home');
    const stage = root?.querySelector('.home-stage');
    const bubble = root?.querySelector('.home-bubble');
    if (!stage || !bubble || root.querySelector('.room-reading')) return;
    const panel = document.createElement('section');
    panel.className = 'room-reading';
    panel.setAttribute('aria-label', 'Room messages');
    panel.innerHTML = '<h3>EGOR’s messages</h3><p>Read at your own pace. Messages stay in the history while this page is open.</p><details><summary>Open message history</summary><ol></ol></details><div class="room-reading-controls" aria-label="Room object controls"></div>';
    stage.after(panel);
    // Preserve the original node and all existing script references.
    panel.querySelector('details').before(bubble);
    bubble.removeAttribute('aria-live');
    const list = panel.querySelector('ol');
    let last = '';
    function record() {
      const text = bubble.textContent.trim();
      if (!text || text === last) return;
      last = text;
      const item = document.createElement('li');
      item.textContent = text;
      list.append(item);
    }
    new MutationObserver(record).observe(bubble, {childList:true, subtree:true, characterData:true});
    record();
    const controls = panel.querySelector('.room-reading-controls');
    function buttons() {
      for (const [selector, label] of [['.room-tv','Change TV channel'],['.room-radio','Toggle radio (visual only)'],['.room-mirror','Touch mirror']]) {
        const target = root.querySelector(selector);
        if (!target || controls.querySelector(`[data-target="${selector}"]`)) continue;
        const button = document.createElement('button');
        button.type = 'button'; button.textContent = label; button.dataset.target = selector;
        button.addEventListener('click', () => target.click());
        controls.append(button);
      }
    }
    buttons();
    new MutationObserver(buttons).observe(stage, {childList:true});
  }
  mount();
  new MutationObserver(mount).observe(document.body, {childList:true, subtree:true});
})();
