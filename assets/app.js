const {trip, fallbackImage} = window.ICELAND_DATA;
const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value='') => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
const emphasizeNote = (value='') => {
  const escaped = escapeHtml(value);
  return escaped.replace(/(務必|必備|注意|確認|建議|避免|不要|提前|封路|結冰|取消|危險|保險|護照|駕照|防水|保暖|現金|充電|藥品|備用)/g, '<strong class="note-em">$1</strong>');
};
const typeClass = (type, title='') => type === '交通' ? 'transport' : /餐|超市|採買/.test(`${type}${title}`) ? 'food' : '';
const fallbackAttr = fallbackImage ? ` onerror="this.onerror=null;this.src='${fallbackImage}'"` : '';
const droneLevel = value => ['prohibited','schedule','restricted','permission','general'].includes(value) ? value : 'general';
const droneSource = drone => drone && drone.sourceUrl ? `<a href="${escapeHtml(drone.sourceUrl)}" target="_blank" rel="noreferrer">${escapeHtml(drone.sourceLabel || '官方規定')}</a>` : '';
const droneInline = drone => !drone ? '' : `<aside class="drone-inline drone-inline--${droneLevel(drone.level)}"><div class="drone-inline__head"><span>空拍限制</span><strong>${escapeHtml(drone.label || '請確認')}</strong></div><p>${escapeHtml(drone.summary || '')}</p>${droneSource(drone)}</aside>`;
const droneAlert = drone => !drone ? '' : `<aside class="drone-alert drone-alert--${droneLevel(drone.level)}"><div class="drone-alert__head"><span>空拍限制</span><strong>${escapeHtml(drone.label || '請確認')}</strong></div><p>${escapeHtml(drone.summary || '')}</p><small>查核日期 ${escapeHtml(drone.checked || '')}</small>${droneSource(drone)}</aside>`;
const droneMini = drone => !drone ? '' : `<span class="drone-mini drone-mini--${droneLevel(drone.level)}">空拍：${escapeHtml(drone.label || '請確認')}</span>`;
const formatTwd = value => `$${Number(value || 0).toLocaleString('zh-TW', {maximumFractionDigits: 0})}`;
const formatStatMoney = value => `$${Number(value || 0).toLocaleString('zh-TW', {maximumFractionDigits: 0})}`;
const expensePalette = ['#2d6f89', '#b95039', '#287d72', '#bc8330', '#6f5aa8', '#c05a7b', '#4f7f45', '#5c7180', '#9b6542'];
const participantCount = Number(trip.expenses.participantCount || 1);
const knownTotal = Number(trip.expenses.personalTotal || 0) * participantCount;
const paidTotal = Number(trip.expenses.paidPersonalTotal || 0) * participantCount;
const pendingPersonal = Number(trip.expenses.bookedUnpaidPersonalTotal || 0) + Number(trip.expenses.plannedUnpaidPersonalTotal || 0);
const pendingTotal = pendingPersonal * participantCount;
const dailyPersonal = trip.summary.dayCount ? Number(trip.expenses.personalTotal || 0) / Number(trip.summary.dayCount || 1) : 0;
const paidPercent = knownTotal ? `${(paidTotal / knownTotal * 100).toFixed(1)}% 已完成付款` : '尚未付款';
const droneMeta = trip.droneMeta || {};
const droneCounts = droneMeta.counts || {};
const droneStopCount = Number(droneCounts.prohibited || 0) + Number(droneCounts.schedule || 0);
document.querySelectorAll('[data-drone-overview]').forEach(node => {
  node.innerHTML = `<div class="drone-overview__head"><strong>空拍限制已逐點標註</strong><small>官方資料查核：${escapeHtml(droneMeta.checked || '')}</small></div><p>紅色代表休閒空拍禁止或你們排定時段禁飛；黃色為區域／時段管制；藍色須事前取得許可。所有地點仍須遵守目視飛行、最高 120 公尺、不得飛越群眾、禮讓載人航空器等一般規則。規定與臨時空域可能變更，起飛當日再查 <a href="${escapeHtml(droneMeta.mapUrl || '#')}" target="_blank" rel="noreferrer">Iceland Drone Map</a>。</p><div class="drone-legend"><span class="drone-chip drone-chip--prohibited">禁止／行程時段禁飛 ${droneStopCount}</span><span class="drone-chip drone-chip--restricted">區域／即時管制 ${Number(droneCounts.restricted || 0)}</span><span class="drone-chip drone-chip--permission">需事前同意 ${Number(droneCounts.permission || 0)}</span><span class="drone-chip drone-chip--general">一般規則 ${Number(droneCounts.general || 0)}</span></div>`;
});
$('#stats').innerHTML = [
  {label:'目前已知總支出', value:formatStatMoney(knownTotal), note:'含交通、住宿、門票及寄放'},
  {label:'已付款', value:formatStatMoney(paidTotal), note:paidPercent, tone:'paid'},
  {label:'待付款', value:formatStatMoney(pendingTotal), note:`每人約 ${formatStatMoney(pendingPersonal)}`, tone:'due'},
  {label:'每人目前費用', value:formatStatMoney(trip.expenses.personalTotal), note:`平均每日約 ${formatStatMoney(dailyPersonal)}`},
  {label:'已購門票', value:'0 項', note:'共 2 張入場票'},
  {label:'內容手冊', value:`${trip.summary.attractionCount} 景點`, note:''}
].map(item => `<article class="stat${item.tone ? ` stat--${item.tone}` : ''}"><span>${item.label}</span><strong>${item.value}</strong>${item.note ? `<small>${item.note}</small>` : ''}</article>`).join('');

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
    const color = expensePalette[index % expensePalette.length];
    return `<g><text x="0" y="${y + 22}" font-size="13">${escapeHtml(item.category)}</text><line class="expense-grid-line" x1="${labelWidth}" y1="${y + 16}" x2="${labelWidth + chartWidth}" y2="${y + 16}"></line><rect class="expense-bar ${options.personal ? 'personal' : ''}" x="${labelWidth}" y="${y + 5}" width="${barWidth}" height="22" fill="${color}"></rect><text class="muted" x="${labelWidth + barWidth + 8}" y="${y + 21}">${formatTwd(item.amount)}${options.percent ? ` · ${pct}` : ''}</text></g>`;
  }).join('');
  return `<svg class="expense-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(options.label || '支出圖表')}">${bars}</svg>`;
}

function pieSlice(cx, cy, radius, startAngle, endAngle) {
  const start = {
    x: cx + radius * Math.cos((startAngle - 90) * Math.PI / 180),
    y: cy + radius * Math.sin((startAngle - 90) * Math.PI / 180)
  };
  const end = {
    x: cx + radius * Math.cos((endAngle - 90) * Math.PI / 180),
    y: cy + radius * Math.sin((endAngle - 90) * Math.PI / 180)
  };
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)} Z`;
}

function pieChart(items) {
  const rows = items.filter(item => Number(item.amount || 0) > 0);
  const total = rows.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  if (!total) return '';
  let angle = 0;
  const slices = rows.map((item, index) => {
    const value = Number(item.amount || 0);
    const nextAngle = angle + value / total * 360;
    const path = pieSlice(120, 120, 92, angle, nextAngle);
    angle = nextAngle;
    return `<path d="${path}" fill="${expensePalette[index % expensePalette.length]}"></path>`;
  }).join('');
  const legend = rows.map((item, index) => {
    const percent = Math.round(Number(item.amount || 0) / total * 100);
    return `<li><span style="background:${expensePalette[index % expensePalette.length]}"></span><b>${escapeHtml(item.category)}</b><em>${percent}% · ${formatTwd(item.amount)}</em></li>`;
  }).join('');
  return `<div class="expense-pie-wrap"><svg class="expense-chart expense-pie" viewBox="0 0 240 240" role="img" aria-label="支出分類占比">${slices}<circle cx="120" cy="120" r="46" fill="#f8f8f3"></circle><text x="120" y="116" text-anchor="middle" font-size="18">${formatTwd(total)}</text><text class="muted" x="120" y="138" text-anchor="middle">分類合計</text></svg><ul class="expense-legend">${legend}</ul></div>`;
}

function renderExpenses() {
  const expenses = trip.expenses || {};
  const summary = $('#expenseSummary');
  if (!summary || !expenses.categories) return;
  summary.innerHTML = [
    ['目前已花費', '$0', 'liveExpenseTotal'],
    ['個人結算合計', expenses.personalTotalDisplay],
    ['已付款/人', expenses.paidPersonalTotalDisplay],
    ['已預訂未付款/人', expenses.bookedUnpaidPersonalTotalDisplay],
    ['未預訂未付款/人', expenses.plannedUnpaidPersonalTotalDisplay]
  ].map(([label,value,id]) => `<article class="expense-kpi"><strong${id ? ` id="${id}"` : ''}>${value}</strong><span${id ? ' id="liveExpenseCount"' : ''}>${label}</span></article>`).join('');
  $('#categoryChart').innerHTML = pieChart(expenses.categoryBreakdown || expenses.categories);
  $('#personalChart').innerHTML = barChart(expenses.personalBreakdown, {personal: true, label: '個人經費估算'});
  const statusGrid = $('#paymentStatusGrid');
  if (statusGrid) {
    statusGrid.innerHTML = (expenses.paymentGroups || []).map(group => `<article class="payment-card"><div class="payment-card__head"><span>${escapeHtml(group.label)}</span><strong>${escapeHtml(group.amountDisplay || formatTwd(group.amount))}</strong><small>每人 ${escapeHtml(group.personalAmountDisplay || formatTwd(group.personalAmount))}</small></div><ul>${(group.items || []).map(item => `<li><b>${escapeHtml(item.category)}</b><span>${escapeHtml(item.amountDisplay || formatTwd(item.amount))}</span><em>${escapeHtml(item.note || item.source || '')}</em></li>`).join('')}</ul></article>`).join('');
  }
  $('#expenseTable').innerHTML = `<thead><tr><th>類別</th><th>狀態</th><th>金額</th><th>來源</th><th>備註</th></tr></thead><tbody>${expenses.categories.map(item => `<tr><td>${escapeHtml(item.category)}</td><td><span class="status-chip">${escapeHtml(item.status || '')}</span></td><td>${formatTwd(item.amount)}</td><td>${escapeHtml(item.source || '')}</td><td>${escapeHtml(item.note || '')}</td></tr>`).join('')}</tbody>`;
  $('#expenseSource').textContent = `資料來源：${(expenses.sources || []).join('、')}。金額以 Notion 個人旅行支出結算欄位為準。`;
}
renderExpenses();

function liveExpenseRates(source={}) {
  return {
    EUR: Number(source.eurRate) || 35.2,
    USD: Number(source.usdRate) || 32,
    ISK: Number(source.iskRate) || 0.23,
    TWD: 1
  };
}

function liveExpenseAmount(expense, rates) {
  const amount = Number(expense && expense.amount || 0);
  const currency = expense && expense.currency || 'TWD';
  return amount * Number(rates[currency] || 1);
}

function renderLiveExpenseTotal(expenses, rates, sourceLabel) {
  const rows = Array.isArray(expenses) ? expenses : [];
  const total = rows.reduce((sum, expense) => sum + liveExpenseAmount(expense, rates), 0);
  const totalNode = $('#liveExpenseTotal');
  const countNode = $('#liveExpenseCount');
  if (totalNode) totalNode.textContent = formatTwd(total);
  if (countNode) countNode.textContent = `目前已花費 · ${rows.length} 筆 · ${sourceLabel}`;
}

function readLocalExpenseBook() {
  try {
    const raw = localStorage.getItem('iceland-expense-app-v1') || localStorage.getItem('iceland-expense-app-v0');
    const state = raw ? JSON.parse(raw) : {};
    return {
      expenses: Array.isArray(state.expenses) ? state.expenses : [],
      rates: liveExpenseRates(state)
    };
  } catch (error) {
    return {expenses: [], rates: liveExpenseRates()};
  }
}

function startLiveExpenseSync() {
  const localBook = readLocalExpenseBook();
  renderLiveExpenseTotal(localBook.expenses, localBook.rates, '本機帳本');
  const settings = window.TRIP_EXPENSE_FIREBASE || {};
  if (!settings.enabled || !settings.config || !window.firebase) return;
  try {
    if (!window.firebase.apps.length) window.firebase.initializeApp(settings.config);
    const database = window.firebase.firestore();
    database.settings({experimentalAutoDetectLongPolling: true});
    const tripCode = localStorage.getItem('iceland-expense-trip-code') || settings.tripCode;
    if (!tripCode) return;
    const root = database.collection('tripExpenseBooks').doc(String(tripCode).trim().toUpperCase());
    let rates = localBook.rates;
    let cloudExpenses = null;
    const update = () => {
      if (cloudExpenses) renderLiveExpenseTotal(cloudExpenses, rates, '雲端同步');
    };
    root.collection('settings').doc('main').onSnapshot(doc => {
      if (doc.exists) rates = liveExpenseRates(doc.data() || {});
      update();
    });
    root.collection('expenses').onSnapshot(snapshot => {
      cloudExpenses = snapshot.docs.map(doc => doc.data() || {});
      update();
    });
  } catch (error) {
    renderLiveExpenseTotal(localBook.expenses, localBook.rates, '本機帳本');
  }
}
startLiveExpenseSync();

const routeCities = [...new Set(trip.days.map(day => day.city).filter(Boolean))];
const route = $('#route');
if (route) route.innerHTML = routeCities.map(city => `<span>${city}</span>`).join('');

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
    return `<article class="day"><div class="day__label"><strong>${day.day}</strong><span>${day.date}</span><small>${day.city || ''}</small></div><div class="day__items">${items.map(item => `<section class="event"><img class="event__image" src="${item.imageUrl || fallbackImage}" alt="${item.行程 || '行程照片'}" loading="lazy"${fallbackAttr}><time>${item.displayTime || ''}</time><span class="pill ${typeClass(item.性質,item.行程)}">${item.性質 || ''}</span><div><h3>${item.行程 || ''}</h3><p>${item.說明 || ''}</p>${item.冬季狀況 ? `<p><strong>冬季：</strong>${item.冬季狀況}</p>` : ''}${droneInline(item.drone)}</div>${item['Google Map位置'] ? `<a class="map" href="${item['Google Map位置']}" target="_blank" rel="noreferrer">Map</a>` : ''}</section>`).join('')}</div></article>`;
  }).join('');
}
renderTimeline();
document.querySelectorAll('#dayFilters button').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('#dayFilters button').forEach(item => item.classList.remove('active'));
  button.classList.add('active');
  renderTimeline(button.dataset.filter);
}));

const tabLinks = document.querySelectorAll('.topbar a[data-tab]');
const pageTabs = document.querySelectorAll('.page-tab[data-tab]');
const tabPanels = document.querySelectorAll('.tab-panel');
function showTab(id, updateHash=true) {
  const target = document.getElementById(id) || document.getElementById('timeline');
  tabPanels.forEach(panel => panel.classList.toggle('active', panel === target));
  tabLinks.forEach(link => link.classList.toggle('active', link.dataset.tab === target.id));
  pageTabs.forEach(tab => {
    const active = tab.dataset.tab === target.id;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', String(active));
  });
  if (updateHash) history.replaceState(null, '', `#${target.id}`);
  const pager = document.getElementById('section-pager');
  (pager || target).scrollIntoView({behavior: 'smooth', block: 'start'});
}
tabLinks.forEach(link => link.addEventListener('click', (event) => {
  event.preventDefault();
  showTab(link.dataset.tab);
}));
pageTabs.forEach(tab => tab.addEventListener('click', () => showTab(tab.dataset.tab)));
if (location.hash) {
  const requestedTab = location.hash.slice(1);
  if (document.getElementById(requestedTab)?.classList.contains('tab-panel')) {
    showTab(requestedTab, false);
  }
}

$('#stayGrid').innerHTML = trip.hotels.map(hotel => `<article class="stay"><img class="stay__image" src="${hotel.imageUrl || fallbackImage}" alt="${hotel.飯店名稱 || '住宿照片'}" loading="lazy"${fallbackAttr}><div class="stay__body"><h3>${hotel.飯店名稱}</h3><p>${hotel.城市}｜${hotel.入住日期顯示} ${hotel.入住時間顯示} - ${hotel.退房日期顯示} ${hotel.退房時間顯示}</p><div class="meta"><span>${hotel.房型 || '房型未填'}</span><span>${hotel.訂房平台 || '平台未填'}</span><span>${hotel.金額顯示}</span><span>停車 ${hotel.停車位顯示}</span><span>早餐 ${hotel.早餐顯示}</span></div><p>${hotel.額外說明 || ''}</p>${hotel['Google Map位置'] ? `<a class="map" href="${hotel['Google Map位置']}" target="_blank" rel="noreferrer">Google Map</a>` : ''}</div></article>`).join('');

$('#notesList').innerHTML = trip.notes.map(note => `<article><h3>${escapeHtml(note.項目 || '行前提醒')}</h3><p>${emphasizeNote(note.備註內容 || '')}</p></article>`).join('');

$('#flightList').innerHTML = trip.flights.map(flight => `<article class="flight"><img class="flight__image" src="${flight.imageUrl || fallbackImage}" alt="${flight.出發機場 || '航班'} 到 ${flight.抵達機場 || '目的地'}" loading="lazy"${fallbackAttr}><div><span class="pill transport">${flight.航空公司}</span><h3>${flight.班機號碼}</h3></div><div class="airport"><span>${flight.出發機場}</span><b>→</b><span>${flight.抵達機場}</span></div><div><strong>${flight.搭乘日期顯示} ${flight.起飛時間顯示}</strong><br><small>抵達 ${flight.抵達日期顯示} ${flight.降落時間顯示}｜行李 ${flight.行李重量 || ''}</small></div></article>`).join('');

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
    reader.innerHTML = `<figure class="spot-photo"><img loading="lazy" src="${image}" alt="${escapeHtml(item.title)}景點照片"${fallbackAttr}></figure><header class="reading-head"><p class="eyebrow">${escapeHtml(item.city || 'Iceland')}</p><h3>${escapeHtml(item.title)}</h3><span>${escapeHtml(item.day || '')} · ${escapeHtml(item.date || '')}</span></header>${droneAlert(item.drone)}<div class="markdown">${item.fullHtml || `<section class="reading-block reading-block--supplement"><h2>補充資訊</h2><p>${escapeHtml(item.description || '')}</p></section>`}</div><div class="reader-actions">${pageLink}${mapLink}</div>`;
    grid.querySelectorAll('.spot-card').forEach((card, index) => card.classList.toggle('active', index === activeIndex));
  }

  function showAttractions(region) {
    visible = region === '全部' ? trip.attractions : trip.attractions.filter(item => (item.city || '未分類') === region);
    grid.innerHTML = visible.map((item, index) => `<button class="spot-card${index === 0 ? ' active' : ''}" data-index="${index}"><img loading="lazy" src="${item.imageUrl || fallbackImage}" alt="${escapeHtml(item.title)}縮圖"${fallbackAttr}><span>${escapeHtml(item.city || 'Iceland')}</span><strong>${escapeHtml(item.title)}</strong>${droneMini(item.drone)}<em>閱讀完整介紹</em></button>`).join('');
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
const revealObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, {threshold: 0.12}) : null;
document.querySelectorAll('.reveal, .hero').forEach(element => {
  element.classList.add('reveal');
  if (revealObserver) {
    revealObserver.observe(element);
  } else {
    element.classList.add('visible');
  }
});
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
