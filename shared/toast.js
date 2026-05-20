/* Toast notifications — top-right ephemeral messages.
   Depends on: shared/styles.css (.toast-container, .toast, .toast-* classes).
   Usage: toast('Saved', 'success'); toast('Error: ...', 'error'); toast('Heads up', 'warning'); */

const TOAST_SVG = {
  success: '<svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>',
  error:   '<svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>',
  warning: '<svg viewBox="0 0 24 24" fill="none" stroke="#f5a623" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  info:    '<svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
};

function _toastContainer() {
  let c = document.getElementById('toastContainer');
  if (!c) {
    c = document.createElement('div');
    c.id = 'toastContainer';
    c.className = 'toast-container';
    document.body.appendChild(c);
  }
  return c;
}

/* Show a toast. type: 'success' | 'error' | 'warning' | 'info' (default 'info').
   timeoutMs: explicit dismiss delay; if omitted, defaults are: error 6s, warning 5s, others 3.5s.
   Pass 0 to require manual close. */
function toast(msg, type, timeoutMs) {
  type = type || 'info';
  const c = _toastContainer();
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  const icon = document.createElement('span');
  icon.className = 'toast-icon';
  icon.innerHTML = TOAST_SVG[type] || TOAST_SVG.info;
  const m = document.createElement('span');
  m.className = 'toast-msg';
  m.textContent = msg;
  const btn = document.createElement('button');
  btn.className = 'toast-close';
  btn.setAttribute('aria-label', 'Close');
  btn.textContent = '×';
  const close = () => { t.classList.add('fade-out'); setTimeout(() => t.remove(), 200); };
  btn.onclick = close;
  t.appendChild(icon); t.appendChild(m); t.appendChild(btn);
  c.appendChild(t);
  const dt = timeoutMs != null
    ? timeoutMs
    : (type === 'error' ? 6000 : type === 'warning' ? 5000 : 3500);
  if (dt > 0) setTimeout(close, dt);
  return t;
}
