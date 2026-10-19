(() => {
  const rows = [...document.querySelectorAll('.packing-row')];
  const key = 'iceland-2027-packing-v1';
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch (_) {}
  if (typeof saved !== 'object' || Array.isArray(saved)) saved = {};
  const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase();
  const packingSearch = document.getElementById('packing-search');
  const packingFilter = document.getElementById('packing-filter');
  function filterPacking() {
    let visible = 0;
    const query = normalize(packingSearch.value.trim());
    const mode = packingFilter.value;
    rows.forEach(row => {
      const ready = row.querySelector('input').checked;
      row.hidden = !normalize(row.textContent).includes(query) || (mode === 'top' && Number(row.dataset.mentions) < 4) || (mode === 'pending' && ready) || (mode === 'ready' && !ready);
      if (!row.hidden) visible++;
    });
    const ready = rows.filter(row => row.querySelector('input').checked).length;
    document.getElementById('packing-progress').textContent = `已準備 ${ready} / ${rows.length} 項 · 目前顯示 ${visible} 項`;
    document.getElementById('packing-empty').hidden = visible !== 0;
  }
  rows.forEach(row => {
    const box = row.querySelector('input');
    box.checked = saved[box.dataset.packId] === true;
    box.addEventListener('change', () => {
      saved[box.dataset.packId] = box.checked;
      try { localStorage.setItem(key, JSON.stringify(saved)); }
      catch (_) { document.getElementById('packing-storage').textContent = '瀏覽器無法儲存進度，本次勾選只保留到頁面關閉。'; }
      filterPacking();
    });
  });
  packingSearch.addEventListener('input', filterPacking);
  packingFilter.addEventListener('change', filterPacking);
  const entries = [...document.querySelectorAll('.dining-entry')];
  const stops = [...document.querySelectorAll('.dining-stop')];
  const controls = ['search','stop','type','origin'].map(name => document.getElementById(`dining-${name}`));
  function filterDining() {
    const [search, stop, type, origin] = controls.map(control => control.value);
    const query = normalize(search.trim());
    let count = 0;
    entries.forEach(entry => {
      entry.hidden = !normalize(entry.textContent).includes(query) || (stop !== 'all' && entry.closest('.dining-stop').dataset.stop !== stop) || (type !== 'all' && entry.dataset.kind !== type) || (origin !== 'all' && entry.dataset.origin !== origin);
      if (!entry.hidden) count++;
    });
    stops.forEach(section => { section.hidden = ![...section.querySelectorAll('.dining-entry')].some(entry => !entry.hidden); });
    document.getElementById('dining-count').textContent = `顯示 ${count} / ${entries.length} 筆`;
    document.getElementById('dining-empty').hidden = count !== 0;
  }
  controls.forEach(control => control.addEventListener(control.type === 'search' ? 'input' : 'change', filterDining));
  filterPacking();
  filterDining();
})();
