/* One self-hosted player download shared by both sticker rooms. */
(() => {
  let pending;
  window.egorLoadLottie = () => {
    if (window.lottie) return Promise.resolve(window.lottie);
    if (!pending) pending = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const timer = setTimeout(fail, 12000);
      function fail() { clearTimeout(timer); script.remove(); reject(new Error('Player unavailable')); }
      script.src = 'assets/vendor/lottie_canvas-5.13.0.min.js';
      script.onload = () => { clearTimeout(timer); window.lottie ? resolve(window.lottie) : fail(); };
      script.onerror = fail;
      document.head.append(script);
    }).catch(error => { pending = null; throw error; });
    return pending;
  };
})();
