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
   Logic: first try ", XX 12345" state-abbrev pattern; fallback to checking the LAST
   5-digit sequence in the address (ZIPs are conventionally at the end). Using "last"
   instead of "first" prevents false positives when the street number is 5 digits
   (e.g. "11633 Sorrento Valley Rd San Diego 92121" — 11633 isn't the ZIP, 92121 is).
   CA ZIP range: 90000-96199. Returns null when CA or undeterminable. */
function isOutOfState(addr) {
  if (!addr) return null;
  const s = String(addr);
  const stMatch = s.match(/,\s*([A-Z]{2})\b[^,]*?\b\d{5}\b/);
  if (stMatch) return stMatch[1] !== 'CA' ? stMatch[1] : null;
  const zipMatches = [...s.matchAll(/\b(\d{5})\b/g)];
  if (zipMatches.length === 0) return null;
  const lastZip = parseInt(zipMatches[zipMatches.length - 1][1]);
  if (lastZip >= 90000 && lastZip <= 96199) return null;
  return 'non-CA';
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

/* Trigger a browser download. Hard-coded to a plain anchor.download with the
   given filename — no File System Access API / native save-as dialog. Saves
   straight to the browser's default download location. */
async function triggerDownload(blob, suggestedName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = suggestedName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* HTML-escape user-supplied strings before insertion into innerHTML.
   Exposed for preview.js + any processor that builds HTML strings. */
function _esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
}
