// Full navigation retries the entire module graph, avoiding half-initialized games.
const load = document.getElementById('load');
const actions = document.getElementById('load-actions');
const retry = document.getElementById('load-retry');
retry.addEventListener('click', () => {
  retry.disabled = true;
  load.textContent = 'Trying again…';
  location.reload();
});
try {
  await import('./world.mjs');
} catch (error) {
  load.textContent = error.message.startsWith('This doorway') || error.message.startsWith('The neighborhood')
    ? error.message : 'The neighborhood could not load. Please try again or return to EGOR World.';
  actions.hidden = false;
  document.getElementById('enter').disabled = true;
  load.setAttribute('role', 'alert');
  console.error('Neighborhood startup failed:', error);
}
