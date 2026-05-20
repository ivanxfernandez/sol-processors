/* Trip preview — collapsible read-only table of output rows.
   Depends on: shared/styles.css (.preview-wrap, .preview-tabs, etc.),
               shared/helpers.js (_esc),
               processor-global OUT_COLS array (for column index lookup).
   Usage:
     setPreviewSheets([{ label: 'Stretcher (7117)', rows: stretcherRows }, ...]);
     <button onclick="togglePreview()">Preview</button>
     <div id="previewWrap"></div>
   When user clicks the toggle button, the table renders into #previewWrap. */

const PREVIEW_COLS = [
  'Trip ID', 'Passenger', 'Mobility', 'Pickup Address', 'Dropoff Address',
  'Earliest Departure Time', 'Appointment Time'
];

const _previewState = { sheets: [], active: 0, limit: 50 };

function setPreviewSheets(sheets) {
  _previewState.sheets = sheets || [];
  _previewState.active = 0;
  _previewState.limit = 50;
  const wrap = document.getElementById('previewWrap');
  if (wrap) wrap.classList.remove('visible');
}

function renderPreview() {
  const wrap = document.getElementById('previewWrap');
  if (!wrap) return;
  const { sheets, active, limit } = _previewState;
  if (!sheets.length) { wrap.classList.remove('visible'); return; }
  const sheet = sheets[active];
  if (!sheet) return;
  // OUT_COLS is defined per-processor; resolve column positions against it.
  const colIdx = PREVIEW_COLS.map(c => OUT_COLS.indexOf(c));
  const shown = sheet.rows.slice(0, limit);
  const tabsHtml = sheets.length > 1
    ? '<div class="preview-tabs">' + sheets.map((s, i) =>
        '<button class="preview-tab' + (i === active ? ' active' : '') + '" onclick="setPreviewTab(' + i + ')">' +
        _esc(s.label) + ' (' + s.rows.length + ')</button>'
      ).join('') + '</div>'
    : '';
  const rowsHtml = shown.length
    ? shown.map(r => '<tr>' + colIdx.map(i => {
        const v = i >= 0 && r ? (r[i] == null ? '' : r[i]) : '';
        return '<td title="' + _esc(v) + '">' + _esc(v) + '</td>';
      }).join('') + '</tr>').join('')
    : '<tr><td colspan="' + PREVIEW_COLS.length + '" style="text-align:center;padding:24px;color:#888">No rows</td></tr>';
  const headHtml = '<tr>' + PREVIEW_COLS.map(c => '<th>' + c + '</th>').join('') + '</tr>';
  const more = sheet.rows.length > shown.length;
  const footerHtml = '<div class="preview-footer"><span>Showing ' + shown.length + ' of ' + sheet.rows.length + ' rows</span>' +
    (more
      ? '<button onclick="showAllPreview()">Show all</button>'
      : (sheet.rows.length > 50 ? '<button onclick="collapsePreview()">Collapse</button>' : '')
    ) + '</div>';
  wrap.innerHTML = tabsHtml + '<div class="preview-table-wrap"><table class="preview-table"><thead>' +
    headHtml + '</thead><tbody>' + rowsHtml + '</tbody></table></div>' + footerHtml;
}

function setPreviewTab(i) { _previewState.active = i; _previewState.limit = 50; renderPreview(); }
function showAllPreview()  { _previewState.limit = Infinity; renderPreview(); }
function collapsePreview() { _previewState.limit = 50; renderPreview(); }

function togglePreview() {
  const wrap = document.getElementById('previewWrap');
  if (!wrap) return;
  if (wrap.classList.contains('visible')) {
    wrap.classList.remove('visible');
  } else {
    renderPreview();
    wrap.classList.add('visible');
  }
}
