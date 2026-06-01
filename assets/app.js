const {trip, fallbackImage} = window.ICELAND_DATA;
const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value='') => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
const typeClass = (type, title='') => type === '交通' ? 'transport' : /餐|超市|採買/.test(`${type}${title}`) ? 'food' : '';
const fallbackAttr = fallbackImage ? ` onerror="this.onerror=null;this.src='${fallbackImage}'"` : '';
const formatTwd = value => `NT$${Number(value || 0).toLocaleString('zh-TW', {maximumFractionDigits: 0})}`;
$('#stats').innerHTML = [
  ['天數', `${trip.summary.dayCount} 天`],
  ['航班', `${trip.summary.flightCount} 段`],
  ['住宿', `${trip.summary.hotelCount} 筆`],
  ['每人經費', trip.summary.personalExpenseTotal]
].map(([label,value]) => `<article class="stat"><strong>${value}</strong><span>${label}</span></article>`).join('');

function barChart(items, options={}) {
  const rows = items.filter(item => Number(item.amount || 0) > 0);
  const width = 560;
  const rowHeight = 48;
  const top = 18;
  const labelWidth = 96;
  const amountWidth = 104;
  const chartWidth = width - labelWidth - amountWidth - 26;
  const height = Math.max(120, top * 2 + rows.length * rowHeight);
  const max = Math.max(...rows.map(item => Number(item.amount || 0)), 1);
  const bars = rows.map((item, index) => {
    const y = top + index * rowHeight;
    const barWidth = Math.max(4, Math.round(Number(item.amount || 0) / max * chartWidth));
    const pct = trip.expenses.total ? `${Math.round(Number(item.amount || 0) / trip.expenses.total * 100)}%` : '';
    return `<g><text x="0" y="${y + 22}" font-size="13">${escapeHtml(item.category)}</text><line class="expense-grid-line" x1="${labelWidth}" y1="${y + 16}" x2="${labelWidth + chartWidth}" y2="${y + 16}"></line><rect class="expense-bar ${options.personal ? 'personal' : ''}" x="${labelWidth}" y="${y + 5}" width="${barWidth}" height="22"></rect><text class="muted" x="${labelWidth + barWidth + 8}" y="${y + 21}">${formatTwd(item.amount)}${options.percent ? ` · ${pct}` : ''}</text></g>`;
  }).join('');
  return `<svg class="expense-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(options.label || '支出圖表')}">${bars}</svg>`;
}

function renderExpenses() {
  const expenses = trip.expenses || {};
  const summary = $('#expenseSummary');
  if (!summary || !expenses.categories) return;
  summary.innerHTML = [
    ['已建檔總支出', expenses.totalDisplay],
    ['每人估算', expenses.personalTotalDisplay],
    ['已付款/人', expenses.paidPersonalTotalDisplay]
  ].map(([label,value]) => `<article class="expense-kpi"><strong>${value}</strong><span>${label}</span></article>`).join('');
  $('#categoryChart').innerHTML = barChart(expenses.categories, {percent: true, label: '支出分類'});
  $('#personalChart').innerHTML = barChart(expenses.personalBreakdown, {personal: true, label: '個人經費估算'});
  $('#expenseTable').innerHTML = `<thead><tr><th>類別</th><th>金額</th><th>來源</th><th>備註</th></tr></thead><tbody>${expenses.categories.map(item => `<tr><td>${escapeHtml(item.category)}</td><td>${formatTwd(item.amount)}</td><td>${escapeHtml(item.source || '')}</td><td>${escapeHtml(item.note || '')}</td></tr>`).join('')}</tbody>`;
  $('#expenseSource').textContent = `資料來源：${(expenses.sources || []).join('、')}。租車 ISK 暫以 1 ISK = NT$${expenses.iskToTwd} 換算。`;
}
renderExpenses();

const routeCities = [...new Set(trip.days.map(day => day.city).filter(Boolean))];
$('#route').innerHTML = routeCities.map(city => `<span>${city}</span>`).join('');

$('#dayFilters').innerHTML = ['全部', ...trip.days.map(day => day.day)].map((value, index) => {
  const day = trip.days.find(item => item.day === value);
  const label = value === '全部' ? '全部日期' : `${day.date}`;
  const sub = value === '全部' ? 'All Days' : day.day;
  return `<button class="${index === 0 ? 'active' : ''}" data-filter="${value}"><strong>${label}</strong><small>${sub}</small></button>`;
}).join('');

function renderTimeline(filter='全部') {
  $('#timelineList').innerHTML = trip.days.map(day => {
    if (filter !== '全部' && day.day !== filter) return '';
    const items = day.items;
    if (!items.length) return '';
    return `<article class="day"><div class="day__label"><strong>${day.day}</strong><span>${day.date}</span><small>${day.city || ''}</small></div><div class="day__items">${items.map(item => `<section class="event"><img class="event__image" src="${item.imageUrl || fallbackImage}" alt="${item.行程 || '行程照片'}" loading="lazy"${fallbackAttr}><time>${item.displayTime || ''}</time><span class="pill ${typeClass(item.性質,item.行程)}">${item.性質 || ''}</span><div><h3>${item.行程 || ''}</h3><p>${item.說明 || ''}</p>${item.冬季狀況 ? `<p><strong>冬季：</strong>${item.冬季狀況}</p>` : ''}</div>${item['Google Map位置'] ? `<a class="map" href="${item['Google Map位置']}" target="_blank" rel="noreferrer">Map</a>` : ''}</section>`).join('')}</div></article>`;
  }).join('');
}
renderTimeline();
document.querySelectorAll('#dayFilters button').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('#dayFilters button').forEach(item => item.classList.remove('active'));
  button.classList.add('active');
  renderTimeline(button.dataset.filter);
}));

const tabLinks = document.querySelectorAll('.topbar a[data-tab]');
const tabPanels = document.querySelectorAll('.tab-panel');
function showTab(id, updateHash=true) {
  const target = document.getElementById(id) || document.getElementById('timeline');
  tabPanels.forEach(panel => panel.classList.toggle('active', panel === target));
  tabLinks.forEach(link => link.classList.toggle('active', link.dataset.tab === target.id));
  if (updateHash) history.replaceState(null, '', `#${target.id}`);
  target.scrollIntoView({behavior: 'smooth', block: 'start'});
}
tabLinks.forEach(link => link.addEventListener('click', (event) => {
  event.preventDefault();
  showTab(link.dataset.tab);
}));
if (location.hash) {
  const requestedTab = location.hash.slice(1);
  if (document.getElementById(requestedTab)?.classList.contains('tab-panel')) {
    showTab(requestedTab, false);
  }
}

$('#stayGrid').innerHTML = trip.hotels.map(hotel => `<article class="stay"><img class="stay__image" src="${hotel.imageUrl || fallbackImage}" alt="${hotel.飯店名稱 || '住宿照片'}" loading="lazy"${fallbackAttr}><div class="stay__body"><h3>${hotel.飯店名稱}</h3><p>${hotel.城市}｜${hotel.入住日期顯示} ${hotel.入住時間顯示} - ${hotel.退房日期顯示} ${hotel.退房時間顯示}</p><div class="meta"><span>${hotel.房型 || '房型未填'}</span><span>${hotel.訂房平台 || '平台未填'}</span><span>${hotel.金額顯示}</span><span>停車 ${hotel.停車位顯示}</span><span>早餐 ${hotel.早餐顯示}</span></div><p>${hotel.額外說明 || ''}</p>${hotel['Google Map位置'] ? `<a class="map" href="${hotel['Google Map位置']}" target="_blank" rel="noreferrer">Google Map</a>` : ''}</div></article>`).join('');

$('#notes').innerHTML = `<h2>行前重點</h2>${trip.notes.map(note => `<article><h3>${note.項目}</h3><p>${note.備註內容 || ''}</p></article>`).join('')}`;

$('#flightList').innerHTML = trip.flights.map(flight => `<article class="flight"><div><span class="pill transport">${flight.航空公司}</span><h3>${flight.班機號碼}</h3></div><div class="airport"><span>${flight.出發機場}</span><b>→</b><span>${flight.抵達機場}</span></div><div><strong>${flight.搭乘日期顯示} ${flight.起飛時間顯示}</strong><br><small>抵達 ${flight.抵達日期顯示} ${flight.降落時間顯示}｜行李 ${flight.行李重量 || ''}</small></div></article>`).join('');

function renderAttractions() {
  const filter = $('#spotFilter');
  const grid = $('#spotGrid');
  const reader = $('#spotReader');
  if (!filter || !grid || !reader) return;
  const regions = ['全部', ...trip.attractions.reduce((values, item) => {
    const region = item.city || '未分類';
    if (!values.includes(region)) values.push(region);
    return values;
  }, [])];
  let visible = trip.attractions;
  filter.innerHTML = regions.map((region, index) => `<button class="spot-button${index === 0 ? ' active' : ''}" data-region="${escapeHtml(region)}">${escapeHtml(region)}</button>`).join('');

  function openArticle(item, activeIndex) {
    if (!item) {
      reader.innerHTML = '';
      return;
    }
    const image = item.imageUrl || fallbackImage;
    const mapLink = item.map ? `<a class="map" href="${item.map}" target="_blank" rel="noreferrer">Google Map</a>` : '';
    const pageLink = item.pageUrl ? `<a class="map" href="${item.pageUrl}">開啟景點分頁</a>` : '';
    reader.innerHTML = `<figure class="spot-photo"><img loading="lazy" src="${image}" alt="${escapeHtml(item.title)}景點照片"${fallbackAttr}></figure><header class="reading-head"><p class="eyebrow">${escapeHtml(item.city || 'Iceland')}</p><h3>${escapeHtml(item.title)}</h3><span>${escapeHtml(item.day || '')} · ${escapeHtml(item.date || '')}</span></header><div class="markdown">${item.fullHtml || `<p>${escapeHtml(item.description || '')}</p>`}${item.winter ? `<h2>冬季提醒</h2><p>${escapeHtml(item.winter)}</p>` : ''}</div><div class="reader-actions">${pageLink}${mapLink}</div>`;
    grid.querySelectorAll('.spot-card').forEach((card, index) => card.classList.toggle('active', index === activeIndex));
  }

  function showAttractions(region) {
    visible = region === '全部' ? trip.attractions : trip.attractions.filter(item => (item.city || '未分類') === region);
    grid.innerHTML = visible.map((item, index) => `<button class="spot-card${index === 0 ? ' active' : ''}" data-index="${index}"><img loading="lazy" src="${item.imageUrl || fallbackImage}" alt="${escapeHtml(item.title)}縮圖"${fallbackAttr}><span>${escapeHtml(item.city || 'Iceland')}</span><strong>${escapeHtml(item.title)}</strong><em>閱讀完整介紹</em></button>`).join('');
    openArticle(visible[0], 0);
  }

  filter.addEventListener('click', event => {
    if (!event.target.matches('.spot-button')) return;
    filter.querySelectorAll('.spot-button').forEach(button => button.classList.toggle('active', button === event.target));
    showAttractions(event.target.dataset.region);
  });
  grid.addEventListener('click', event => {
    const button = event.target.closest('.spot-card');
    if (!button) return;
    openArticle(visible[Number(button.dataset.index)], Number(button.dataset.index));
  });
  showAttractions('全部');
}
renderAttractions();

$('#winterGrid').innerHTML = trip.winter.map(item => `<article class="winter"><h3>${item.行程}</h3><p>${item.注意事項}</p></article>`).join('');
