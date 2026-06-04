/* Sol Processors — Operations Console shell.
   Injects the persistent left rail + theme toggle into every processor page.
   Loaded once per page via <script src="shared/shell.js"></script>.
   Touches no processing logic; only adds chrome + theme state. */
(function () {
  'use strict';

  // ---- Theme: apply ASAP to avoid flash ----
  var THEME_KEY = 'sol-theme';
  var theme;
  try { theme = localStorage.getItem(THEME_KEY); } catch (e) {}
  if (theme !== 'light' && theme !== 'dark') {
    theme = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  }
  document.documentElement.setAttribute('data-theme', theme);

  var PROCS = [
    { id: 'sdva', name: 'San Diego VA',  code: '7114 · 7115 · 7115C',  href: 'SDVA_Processor.html' },
    { id: 'lbva', name: 'Long Beach VA', code: '7117 · 7118',          href: 'LBVA_Processor.html' },
    { id: 'fhc',  name: 'FHC',           code: '806',                  href: 'FHC_Processor.html'  },
    { id: 'nctd', name: 'NCTD',          code: '0118',                 href: 'NCTD_Processor.html' }
  ];

  function activeId() {
    var f = (location.pathname.split('/').pop() || '').toLowerCase();
    for (var i = 0; i < PROCS.length; i++) {
      if (f.indexOf(PROCS[i].id) === 0) return PROCS[i].id;
    }
    return 'lbva';
  }

  var SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.2M12 19.8V22M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2 12h2.2M19.8 12H22M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6"/></svg>';
  var MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.6 6.6 0 0 0 9.8 9.8z"/></svg>';
  var LOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';

  function setTheme(t) {
    theme = t;
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem(THEME_KEY, t); } catch (e) {}
    syncToggle();
  }

  var toggleEl;
  function syncToggle() {
    if (!toggleEl) return;
    var dark = theme === 'dark';
    toggleEl.innerHTML = (dark ? SUN : MOON) +
      '<span>' + (dark ? 'Light mode' : 'Dark mode') + '</span>';
    toggleEl.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  }

  function build() {
    if (document.querySelector('.ops-rail')) return;
    var act = activeId();

    var nav = '';
    for (var i = 0; i < PROCS.length; i++) {
      var p = PROCS[i];
      var on = p.id === act ? ' is-active' : '';
      nav +=
        '<a class="ops-nav' + on + '" href="' + p.href + '"' +
        (on ? ' aria-current="page"' : '') + '>' +
          '<span class="ops-nav-name">' + p.name + '</span>' +
          '<span class="ops-nav-code">' + p.code + '</span>' +
        '</a>';
    }

    var rail = document.createElement('aside');
    rail.className = 'ops-rail';
    rail.innerHTML =
      '<a class="ops-brand" href="' + PROCS[0].href + '">' +
        '<span class="ops-mark"><span class="ops-sun"></span></span>' +
        '<span class="ops-word"><b>Sol</b><span>Transportation</span></span>' +
      '</a>' +
      '<div class="ops-railcap">Trip Processors</div>' +
      '<nav class="ops-navlist">' + nav + '</nav>' +
      '<div class="ops-foot">' +
        '<button type="button" class="ops-theme"></button>' +
        '<div class="ops-local">' + LOCK + '<span>Runs locally — no data leaves this device</span></div>' +
      '</div>';

    document.body.insertBefore(rail, document.body.firstChild);

    toggleEl = rail.querySelector('.ops-theme');
    toggleEl.addEventListener('click', function () {
      setTheme(theme === 'dark' ? 'light' : 'dark');
    });
    syncToggle();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
