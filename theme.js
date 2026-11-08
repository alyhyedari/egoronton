/* Read before styles paint; a blocked storage area must never stop boot. */
(() => {
  const key = 'egor-world-theme';
  const root = document.documentElement;
  let theme = 'paper';
  try { theme = localStorage.getItem(key) === 'night' ? 'night' : 'paper'; } catch {}
  function apply(value) {
    theme = value === 'night' ? 'night' : 'paper';
    root.dataset.theme = theme;
    document.querySelectorAll('[data-theme-toggle]').forEach(button => {
      button.setAttribute('aria-pressed', String(theme === 'night'));
      button.textContent = theme === 'night' ? 'Blue night · On' : 'Blue night · Off';
    });
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === 'night' ? '#101f35' : '#f5f0e5';
  }
  apply(theme);
  document.addEventListener('DOMContentLoaded', () => {
    apply(theme);
    document.querySelectorAll('[data-theme-toggle]').forEach(button => {
      button.addEventListener('click', () => {
        apply(theme === 'night' ? 'paper' : 'night');
        let message = '';
        try { localStorage.setItem(key, theme); }
        catch { message = 'Storage unavailable. Theme applies to this visit only.'; }
        const status = document.querySelector('#theme-status');
        if (status) status.textContent = message;
      });
    });
  }, {once:true});
  window.addEventListener('storage', event => {
    if (event.key === key || event.key === null) apply(event.newValue);
  });
})();
