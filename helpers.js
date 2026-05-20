/* Shared helpers for Sol Trip Processors. Pure functions, no DOM side effects.
   Load order: vendor/xlsx.full.min.js → shared/helpers.js → other shared modules → processor code. */

/* Strip parenthetical comments + collapse whitespace. Used on addresses and names. */
function cleanAddr(a) {
  return a ? String(a).replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim() : a;
}

/* Same shape as cleanAddr but kept as a named export for self-documenting call sites. */
function cleanName(name) {
  return name ? String(name).replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim() : name;
}

/* Detect non-California addresses. Returns state code (e.g. "NV"), "non-CA", or null.
   Logic: first try ", XX 12345" state-abbrev pattern; fallback to ZIP range check
   (CA: 90000-96199). Returns null when CA or undeterminable. */
function isOutOfState(addr) {
  if (!addr) return null;
  const s = String(addr);
  const stMatch = s.match(/,\s*([A-Z]{2})\b[^,]*?\b\d{5}\b/);
  if (stMatch) return stMatch[1] !== 'CA' ? stMatch[1] : null;
  const zipMatch = s.match(/\b(\d{5})\b/);
  if (zipMatch) {
    const z = parseInt(zipMatch[1]);
    if (z >= 90000 && z <= 96199) return null;
    return 'non-CA';
  }
  return null;
}

/* Parse a free-form time string into {h, m} 24-hour components.
   Accepts: "0930", "9:30AM", "9:30 AM", "9AM", "21:45". Returns null on failure. */
function to24h(str) {
  if (!str) return null;
  str = String(str).trim().toUpperCase().replace(/\s+/g, '');
  if (/^\d{4}$/.test(str)) {
    const h = parseInt(str.slice(0, 2)), m = parseInt(str.slice(2, 4));
    if (h <= 23 && m <= 59) return { h, m };
  }
  const ap = str.match(/^(\d{1,2})(?::(\d{2}))?([AP]M)$/);
  if (ap) {
    let h = parseInt(ap[1]), m = parseInt(ap[2] || '0');
    if (ap[3] === 'AM') { if (h === 12) h = 0; } else { if (h !== 12) h += 12; }
    if (h <= 23 && m <= 59) return { h, m };
  }
  const hm = str.match(/^(\d{1,2}):(\d{2})$/);
  if (hm) {
    const h = parseInt(hm[1]), m = parseInt(hm[2]);
    if (h <= 23 && m <= 59) return { h, m };
  }
  return null;
}

/* Trigger a browser download. Uses File System Access API where available
   (Chrome/Edge desktop) so the user gets a save-as dialog; falls back to
   anchor.download for Safari/Firefox. AbortError = user closed dialog → no-op. */
async function triggerDownload(blob, suggestedName) {
  if (window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName,
        types: [{
          description: 'Excel File',
          accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] }
        }]
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    } catch (e) { if (e.name === 'AbortError') return; }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = suggestedName;
  a.click();
  URL.revokeObjectURL(url);
}

/* HTML-escape user-supplied strings before insertion into innerHTML.
   Exposed for preview.js + any processor that builds HTML strings. */
function _esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
}
