/* Shared header directory. Existing page navigation remains available without JS. */
(() => {
  const groups = [
    ['Play & create', [['/play/', '3D neighborhood'], ['/survival-delivery/', 'Survival + Delivery'], ['/guaranteed-moon/', 'The Guaranteed Moon'], ['index.html#light-room', 'EGOR’s room'], ['index.html#idea-workshop', 'Idea workshop'], ['index.html#sticker-desk', 'Sticker desk'], ['index.html#play', 'Drawing board'], ['portrait-studio.html', 'Portrait studio'], ['index.html#portrait', 'Portrait gallery']]],
    ['Explore the world', [['index.html#world', 'EGOR’s story & sticker worlds'], ['index.html#redo', 'REDO room'], ['egor-zhgun.html', 'Artist & attribution'], ['index.html#roadmap', 'Interactive roadmap'], ['roadmap-notes.html', 'Roadmap notes & sources']]],
    ['Project & community', [['index.html#token', 'Token details'], ['index.html#market', 'Market overview'], ['market.html', 'Market report'], ['trading-desk.html', 'Trading Desk — synthetic demo'], ['index.html#how', 'Getting started'], ['index.html#faq', 'Questions & answers'], ['index.html#evidence', 'Release evidence'], ['index.html#community', 'Community & social links']]]
  ];
  const header = document.querySelector('header');
  if (!header) return;
  const menu = document.createElement('details');
  menu.className = 'site-directory';
  const summary = document.createElement('summary');
  summary.textContent = 'Explore the world ＋';
  menu.append(summary);
  const panel = document.createElement('nav');
  panel.className = 'site-directory-panel';
  panel.setAttribute('aria-label', 'All site sections');
  for (const [title, links] of groups) {
    const group = document.createElement('div');
    const heading = document.createElement('h2');
    heading.textContent = title;
    group.append(heading);
    for (const [href, label] of links) {
      const link = document.createElement('a');
      link.href = href;
      link.textContent = label;
      group.append(link);
    }
    panel.append(group);
  }
  menu.append(panel);
  const previous = header.querySelector('.world-explore');
  if (previous) previous.replaceWith(menu);
  else header.append(menu);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.open) {
      menu.open = false;
      summary.focus();
    }
  });
  document.addEventListener('click', event => {
    if (!menu.contains(event.target)) menu.open = false;
  });
  panel.addEventListener('click', event => {
    if (event.target.closest('a')) menu.open = false;
  });
})();
