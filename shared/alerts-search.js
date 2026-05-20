/* Filter alerts panel entries by passenger name (case-insensitive).
   Wired in HTML via: <input class="alert-search" oninput="filterAlerts(this.value)" />
   Iterates #alertContent .alert-section, hiding items whose textContent
   doesn't include the query. Sections with zero visible items are hidden too. */

function filterAlerts(q) {
  const lower = String(q || '').toLowerCase().trim();
  document.querySelectorAll('#alertContent .alert-section').forEach(section => {
    let visible = 0;
    section.querySelectorAll('.alert-item').forEach(item => {
      const show = !lower || item.textContent.toLowerCase().includes(lower);
      item.style.display = show ? '' : 'none';
      if (show) visible++;
    });
    section.style.display = visible === 0 ? 'none' : '';
  });
}
