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
  const regionStops = {capital:['kef','reykjavik','depart'], golden:['golden','selfoss'], south:['southvik'], glacier:['klaustur','jokulsarlon'], west:['borgarnes','snaefellsnes']};
  const regionNames = {all:'全部地區',capital:'首都・機場・藍湖',golden:'黃金圈・Selfoss',south:'南岸・Vík',glacier:'冰川湖・Klaustur',west:'西部・斯奈山半島'};
  let region = 'all';
  function updateRegion() {
    document.querySelectorAll('[data-region]').forEach(node => {
      const active = node.dataset.region === region;
      node.classList.toggle('active', active);
      node.setAttribute('aria-pressed', String(active));
    });
    document.getElementById('dining-region-status').textContent = `目前地區：${regionNames[region]}。灰色為本次未收錄的北部與東部。`;
  }
  function filterDining() {
    const [search, stop, type, origin] = controls.map(control => control.value);
    const query = normalize(search.trim());
    let count = 0;
    entries.forEach(entry => {
      const stopId = entry.closest('.dining-stop').dataset.stop;
      entry.hidden = !normalize(entry.textContent).includes(query) || (region !== 'all' && !regionStops[region].includes(stopId)) || (stop !== 'all' && stopId !== stop) || (type !== 'all' && entry.dataset.kind !== type) || (origin !== 'all' && entry.dataset.origin !== origin);
      if (!entry.hidden) count++;
    });
    stops.forEach(section => { section.hidden = ![...section.querySelectorAll('.dining-entry')].some(entry => !entry.hidden); });
    document.getElementById('dining-count').textContent = `顯示 ${count} / ${entries.length} 筆`;
    document.getElementById('dining-empty').hidden = count !== 0;
  }
  document.querySelectorAll('[data-region]').forEach(node => {
    const select = () => {
      region = node.dataset.region;
      // A new map region starts a fresh search so previous filters cannot hide its guides.
      controls.forEach(control => { control.value = control.type === 'search' ? '' : 'all'; });
      updateRegion();
      filterDining();
      document.getElementById('dining-count').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',block:'center'});
    };
    node.addEventListener('click', select);
    if (node.tagName.toLowerCase() === 'path') node.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select(); }
    });
  });
  controls.forEach(control => control.addEventListener(control.type === 'search' ? 'input' : 'change', () => {
    if (control === controls[1]) {
      region = Object.keys(regionStops).find(key => regionStops[key].includes(control.value)) || 'all';
      updateRegion();
    }
    filterDining();
  }));
  filterPacking();
  filterDining();
})();
