/* Keyboard shortcuts: Esc resets the processor, Enter submits the primary button.
   Both shortcuts are disabled when focus is inside an input/textarea so they don't
   interfere with typing. Each processor must expose:
     - a #processBtn element (the primary action button)
     - a fullReset() global function (called on Esc) */

document.addEventListener('keydown', function (e) {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if (e.key === 'Escape') {
    if (typeof fullReset === 'function') fullReset();
  }
  if (e.key === 'Enter' && !e.shiftKey) {
    const btn = document.getElementById('processBtn');
    if (btn && !btn.disabled) { e.preventDefault(); btn.click(); }
  }
});
