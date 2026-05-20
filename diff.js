/* Two-stage diff: stable key matches trip pairs, content hash detects edits.
   Used by LBVA + SDVA compare mode. Not needed by FHC or NCTD.

   Depends on: processor-global getFingerprint(row, idx) (returns the stable key
   passenger||trip_type||date), and processor-global getAllRows(sheets).

   Output structure of diffSheets():
     {
       newKeys:      Set<string>  — keys present in new but not old
       modifiedKeys: Set<string>  — keys in both, content changed (excluding cancel transitions)
       removed:      Array<{ key, row, idx }>  — present in old, absent from new
       nowCanceled:  Array<{ key, row, idx }>  — scheduled in old, canceled in new
       changeMap:    Map<key, Array<labelString>>  — which fields changed per modifiedKey
     } */

const DIFF_FIELDS = [
  { col: 'Appointment Time',           label: 'Appt' },
  { col: 'Earliest Departure Time',    label: 'EDT' },
  { col: 'Estimated Pickup Time',      label: 'Est PU' },
  { col: 'Pickup Address',             label: 'Pickup' },
  { col: 'Dropoff Address',            label: 'Dropoff' },
  { col: 'VA Notes',                   label: 'Notes' },
  { col: 'Mobility',                   label: 'Mobility' },
  { col: 'Estimated Distance (miles)', label: 'Distance' },
  { col: 'Status',                     label: 'Status' },
  { col: 'Phone Number',               label: 'Phone' }
];

function getContentHash(row, idx) {
  return DIFF_FIELDS.map(f => {
    const i = idx[f.col];
    return String(i !== undefined && row[i] != null ? row[i] : '').trim();
  }).join('||');
}

function describeChanges(oldRow, newRow, idx) {
  const changed = [];
  for (const f of DIFF_FIELDS) {
    const i = idx[f.col];
    if (i === undefined) continue;
    const o = String(oldRow[i] == null ? '' : oldRow[i]).trim();
    const n = String(newRow[i] == null ? '' : newRow[i]).trim();
    if (o !== n) changed.push(f.label);
  }
  return changed;
}

/* Cancel detection: Status="Canceled" OR Appointment Time="N/A". */
function isCanceledRow(row, idx) {
  const status = idx['Status'] !== undefined ? row[idx['Status']] : null;
  const appt = idx['Appointment Time'] !== undefined ? row[idx['Appointment Time']] : null;
  if (status && String(status).toLowerCase() === 'canceled') return true;
  if (appt && String(appt).trim().toUpperCase() === 'N/A') return true;
  return false;
}

function indexByStableKey(sheets) {
  const { headerRow, allRows } = getAllRows(sheets);
  if (!headerRow) return { byKey: new Map(), idx: {} };
  const idx = {};
  headerRow.forEach((h, i) => { if (h) idx[h] = i; });
  const byKey = new Map();
  for (const row of allRows) {
    if (!row || row.every(v => v === null)) continue;
    const key = getFingerprint(row, idx);
    if (!key) continue;
    byKey.set(key, { row, content: getContentHash(row, idx) });
  }
  return { byKey, idx };
}

/* Extract the date suffix from a stable key. Stable keys are
   "Passenger||TripType||Date" — return the date part, or ''. */
function _keyDate(key) {
  const parts = String(key).split('||');
  return parts.length >= 3 ? parts[2] : '';
}

function diffSheets(oldSheets, newSheets) {
  const oldD = indexByStableKey(oldSheets);
  const newD = indexByStableKey(newSheets);

  // Scope filter: build the set of dates present in the NEWER file.
  // OLDER trips with dates outside this set are out-of-scope (likely
  // the OLDER file was downloaded with a wider export window). They
  // are reported separately so they don't trigger a "Removed" warning.
  const newerDates = new Set();
  for (const key of newD.byKey.keys()) {
    const d = _keyDate(key);
    if (d) newerDates.add(d);
  }

  const newKeys = new Set();
  const modifiedKeys = new Set();
  const removed = [];
  const outOfScope = [];
  const nowCanceled = [];
  const changeMap = new Map();

  for (const [key, { row, content }] of newD.byKey) {
    const oldEntry = oldD.byKey.get(key);
    if (!oldEntry) {
      newKeys.add(key);
    } else if (oldEntry.content !== content) {
      const oldCx = isCanceledRow(oldEntry.row, oldD.idx);
      const newCx = isCanceledRow(row, newD.idx);
      if (newCx && !oldCx) {
        nowCanceled.push({ key, row, idx: newD.idx });
      } else {
        modifiedKeys.add(key);
        changeMap.set(key, describeChanges(oldEntry.row, row, newD.idx));
      }
    }
  }

  for (const [key, entry] of oldD.byKey) {
    if (newD.byKey.has(key)) continue;
    const d = _keyDate(key);
    // Only treat as genuinely "removed" when the trip's date exists in the
    // newer file's date range. Otherwise it's a different scope, not a removal.
    if (newerDates.size > 0 && d && !newerDates.has(d)) {
      outOfScope.push({ key, row: entry.row, idx: oldD.idx, date: d });
    } else {
      removed.push({ key, row: entry.row, idx: oldD.idx });
    }
  }

  // Collect set of out-of-scope dates for breakdown display
  const outOfScopeDates = new Set(outOfScope.map(e => e.date).filter(Boolean));

  return { newKeys, modifiedKeys, removed, outOfScope, outOfScopeDates, nowCanceled, changeMap };
}
