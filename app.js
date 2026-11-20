const machines = [
  { id: 'corte-1', name: 'Corte 1', short: 'Corte 1', area: 'Corte', type: 'corte', production: 352, downtime: 1.52, efficiency: 97.7, effective: 83.3, oee: 41.2, rejects: 8, reprocess: 0, areaM2: 277.37, kg: 4852.16, piecesHour: 210.14, color: '#7ca9ff', note: 'La eficiencia se mantiene alta; el ciclo efectivo es la principal oportunidad.' },
  { id: 'corte-2', name: 'Corte 2', short: 'Corte 2', area: 'Corte', type: 'corte', production: 330, downtime: 0.73, efficiency: 96.7, effective: 89.3, oee: 82.9, rejects: 11, reprocess: 0, areaM2: 649.25, kg: 9738.24, piecesHour: 298.09, color: '#8fb6ff', note: 'Buen balance operativo; requiere seguimiento a rechazos por encima del promedio.' },
  { id: 'duo-vent', name: 'Duo-vent', short: 'Duo-vent', area: 'Proceso', type: 'duo', production: 123, downtime: 0.45, efficiency: 100, effective: 95.3, oee: 101.4, rejects: 5, reprocess: 5, areaM2: 304.33, kg: 10317.35, piecesHour: 0, color: '#b9ed72', note: 'Supera la meta de ciclo; validar 5 registros de reproceso antes del cierre.' },
  { id: 'horno-1', name: 'Horno 1', short: 'Horno 1', area: 'Hornos', type: 'horno', production: 0, downtime: 0, efficiency: 0, effective: 0, oee: 0, rejects: 0, reprocess: 0, areaM2: 0, kg: 0, piecesHour: 0, color: '#f6c86b', note: 'Sin registro productivo en este corte de demostración.' },
  { id: 'horno-2', name: 'Horno 2', short: 'Horno 2', area: 'Hornos', type: 'horno', production: 338, downtime: 2.13, efficiency: 94.4, effective: 77.7, oee: 56.0, rejects: 30, reprocess: 0, areaM2: 595.04, kg: 9178.93, piecesHour: 0, color: '#e9b65e', note: 'El tiempo muerto por mesa de descarga y falta de personal concentra la pérdida.' },
  { id: 'ksr', name: 'Lijadora', short: 'Lijadora', area: 'Proceso', type: 'process', production: 271, downtime: 0, efficiency: 98.2, effective: 100, oee: 59.4, rejects: 7, reprocess: 0, areaM2: 545.85, kg: 8187.61, piecesHour: 0, color: '#b18cff', note: 'Tiempo efectivo sólido; oportunidad en ritmo y disponibilidad de ciclo.' },
  { id: 'laminado', name: 'Laminadora', short: 'Laminadora', area: 'Proceso', type: 'process', production: 29, downtime: 0.95, efficiency: 100, effective: 79.3, oee: 51.8, rejects: 0, reprocess: 0, areaM2: 37.31, kg: 1154.76, piecesHour: 0, color: '#c09bff', note: 'Sin rechazo reportado; el reto es elevar horas efectivas del proceso.' },
  { id: 'decorado', name: 'Decoradora', short: 'Decoradora', area: 'Proceso', type: 'process', production: 0, downtime: 0, efficiency: 0, effective: 0, oee: 0, rejects: 1, reprocess: 0, areaM2: 0, kg: 0, piecesHour: 0, color: '#d2b9ff', note: 'Registro de calidad detectado; sin producción cuantificada en el concentrado.' }
];

const demo = {
  causes: [
    ['Falla en mesa de descarga', 1.45],
    ['Falta de personal', 0.50],
    ['Limpieza de pieza(s)', 0.42],
    ['Movimientos de material', 0.35]
  ],
  rejectionCauses: ['Tallones', 'Mancha de pintura', 'SelloTemp mal ubicado', 'Suciedad interna', 'Manejo'],
  rejectionValues: [18, 12, 9, 8, 6]
};

let currentView = 'overview';
let selectedMachine = 'corte-1';
let charts = {};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const format = (value, decimals = 0) => Number(value).toLocaleString('es-MX', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
const getMachine = (id) => machines.find((machine) => machine.id === id) || machines[0];

function getStatus(oee) {
  if (oee >= 80) return { label: 'En objetivo', className: 'green' };
  if (oee >= 50) return { label: 'Atención', className: 'amber' };
  return { label: 'Crítico', className: 'red' };
}

function iconClass(type) { return type === 'corte' ? 'corte' : type === 'horno' ? 'horno' : type === 'duo' ? 'duo' : 'process'; }

function filteredMachines() {
  const machine = $('#machineFilter')?.value || 'all';
  const area = $('#areaFilter')?.value || 'all';
  return machines.filter((item) => (machine === 'all' || item.id === machine) && (area === 'all' || item.area === area));
}

function renderFilters() {
  const select = $('#machineFilter');
  machines.forEach((machine) => {
    const option = document.createElement('option'); option.value = machine.id; option.textContent = machine.name; select.appendChild(option);
  });
  const detail = $('#detailMachine');
  machines.forEach((machine) => {
    const option = document.createElement('option'); option.value = machine.id; option.textContent = machine.name; detail.appendChild(option);
  });
  detail.value = selectedMachine;
}

function renderKpis() {
  const scope = filteredMachines();
  const active = scope.filter((item) => item.production > 0);
  const totalProduction = active.reduce((sum, item) => sum + item.production, 0);
  const downtime = scope.reduce((sum, item) => sum + item.downtime, 0);
  const rejects = scope.reduce((sum, item) => sum + item.rejects, 0);
  const average = (key) => active.length ? active.reduce((sum, item) => sum + item[key], 0) / active.length : 0;
  const kpis = [
    { label: 'Producción total', value: format(totalProduction), unit: 'pzs', trend: '↑ 6.4% vs. promedio', color: 'cyan', trendClass: 'trend-up' },
    { label: 'OEE promedio', value: format(average('oee'), 1), unit: '%', trend: '↑ 2.1 pts vs. ayer', color: average('oee') >= 80 ? 'lime' : 'amber', trendClass: 'trend-up' },
    { label: 'Eficiencia', value: format(average('efficiency'), 1), unit: '%', trend: 'En rango operativo', color: 'lime', trendClass: 'trend-flat' },
    { label: 'Tiempo muerto', value: format(downtime, 2), unit: 'hrs', trend: '↓ 0.8 hrs vs. ayer', color: 'amber', trendClass: 'trend-up' },
    { label: 'Rechazos', value: format(rejects), unit: 'eventos', trend: '↑ 4 vs. promedio', color: 'red', trendClass: 'trend-down' },
    { label: 'Tiempo efectivo', value: format(average('effective'), 1), unit: '%', trend: '↑ 1.8 pts vs. ayer', color: 'cyan', trendClass: 'trend-up' }
  ];
  $('#kpiGrid').innerHTML = kpis.map((kpi) => `<article class="kpi-card ${kpi.color}"><span class="kpi-label">${kpi.label}</span><strong class="kpi-value">${kpi.value}<span class="kpi-unit">${kpi.unit}</span></strong><span class="kpi-trend ${kpi.trendClass}">${kpi.trend}</span></article>`).join('');
}

function renderPerformance() {
  const list = filteredMachines().sort((a, b) => b.oee - a.oee);
  $('#performanceBody').innerHTML = list.map((machine) => {
    const status = getStatus(machine.oee);
    return `<tr data-machine="${machine.id}"><td><span class="machine-name"><span class="machine-glyph ${iconClass(machine.type)}"></span>${machine.name}</span></td><td><span class="metric-bar"><span class="metric-strong">${format(machine.production)}</span><span class="mini-bar"><i style="width:${Math.min(machine.production / 4, 100)}%"></i></span></span></td><td class="mono">${machine.downtime ? `${format(machine.downtime, 2)} h` : '—'}</td><td><span class="metric-strong">${machine.efficiency ? `${format(machine.efficiency, 1)}%` : '—'}</span></td><td><span class="metric-bar"><span class="metric-strong">${machine.oee ? `${format(machine.oee, 1)}%` : '—'}</span><span class="mini-bar lime"><i style="width:${Math.min(machine.oee, 100)}%"></i></span></span></td><td><span class="status-tag ${status.className}">${machine.oee ? status.label : 'Sin dato'}</span></td></tr>`;
  }).join('');
  $$('#performanceBody tr').forEach((row) => row.addEventListener('click', () => openMachine(row.dataset.machine)));
}

function renderInsights() {
  const insights = [
    ['01', 'Horno 2 concentra la pérdida', `Representa <strong>${format(getMachine('horno-2').downtime, 2)} horas</strong> de tiempo muerto, principalmente por descarga y personal.`],
    ['02', 'Duo-vent sobre la meta', 'Su ciclo registra <strong>101.4% OEE</strong>; conviene revisar los 5 eventos de reproceso asociados.'],
    ['03', 'Calidad en observación', 'Se acumulan <strong>53 eventos</strong> de rechazo/reproceso; tallones y pintura explican la mayor parte.']
  ];
  $('#insightList').innerHTML = insights.map(([index, title, copy]) => `<div class="insight-item"><span class="insight-index">${index}</span><div><h4>${title}</h4><p>${copy}</p></div></div>`).join('');
}

function renderQuickMachines() {
  const top = [...machines].filter((machine) => machine.production).sort((a, b) => b.oee - a.oee).slice(0, 4);
  $('#quickMachines').innerHTML = top.map((machine) => `<button class="quick-machine" data-machine="${machine.id}"><strong>${machine.short}</strong><span>${format(machine.oee, 1)}% OEE</span></button>`).join('');
  $$('#quickMachines .quick-machine').forEach((button) => button.addEventListener('click', () => openMachine(button.dataset.machine)));
}

function chartDefaults() {
  return { responsive: true, maintainAspectRatio: false, animation: { duration: 500 }, plugins: { legend: { display: false }, tooltip: { backgroundColor: '#0b1020', titleColor: '#f3f6ff', bodyColor: '#aeb9d0', borderColor: 'rgba(207,222,255,.18)', borderWidth: 1, padding: 11, displayColors: false } }, scales: { x: { grid: { display: false }, ticks: { color: '#75819a', font: { family: 'DM Mono', size: 9 } } }, y: { beginAtZero: true, grid: { color: 'rgba(207,222,255,.08)' }, ticks: { color: '#75819a', font: { family: 'DM Mono', size: 9 } } } } };
}

function initCharts() {
  if (typeof Chart === 'undefined') return;
  const base = chartDefaults();
  charts.oee = new Chart($('#oeeChart'), { type: 'bar', data: { labels: machines.map((machine) => machine.short), datasets: [{ label: 'OEE', data: machines.map((machine) => machine.oee), backgroundColor: '#5de4d5', borderRadius: 4, barPercentage: .55 }, { label: 'Eficiencia', data: machines.map((machine) => machine.efficiency), backgroundColor: '#b9ed72', borderRadius: 4, barPercentage: .55 }] }, options: { ...base, scales: { ...base.scales, y: { ...base.scales.y, max: 110, ticks: { ...base.scales.y.ticks, callback: (value) => `${value}%` } } } } });
  charts.downtime = new Chart($('#downtimeChart'), { type: 'doughnut', data: { labels: demo.causes.map((cause) => cause[0]), datasets: [{ data: demo.causes.map((cause) => cause[1]), backgroundColor: ['#5de4d5', '#f6c86b', '#b18cff', '#fa7c82'], borderWidth: 0, spacing: 3 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '77%', plugins: { legend: { display: false }, tooltip: base.plugins.tooltip } } });
  charts.rejection = new Chart($('#rejectionChart'), { type: 'bar', data: { labels: demo.rejectionCauses, datasets: [{ data: demo.rejectionValues, backgroundColor: ['#fa7c82', '#f6c86b', '#b18cff', '#7ca9ff', '#5de4d5'], borderRadius: 5, barPercentage: .55 }] }, options: { ...base, indexAxis: 'y', scales: { x: { ...base.scales.y, ticks: { ...base.scales.y.ticks, precision: 0 } }, y: { ...base.scales.x } } } });
  charts.oven = new Chart($('#ovenChart'), { type: 'line', data: { labels: ['3 mm', '4 mm', '5 mm', '6 mm', '8 mm', '9 mm', '12 mm', '16 mm', '19 mm'], datasets: [{ label: 'Camas', data: [0, 0, 1, 28, 0, 6, 1, 1, 0], borderColor: '#7ca9ff', backgroundColor: 'rgba(124,169,255,.1)', fill: true, tension: .35, pointRadius: 3 }, { label: 'Carga', data: [0, 0, 1, 24, 0, 5, 1, 1, 0], borderColor: '#b18cff', backgroundColor: 'transparent', tension: .35, pointRadius: 3 }] }, options: { ...base, scales: { ...base.scales, y: { ...base.scales.y, ticks: { ...base.scales.y.ticks, precision: 0 } } } } });
  charts.cuts = new Chart($('#cutsChart'), { type: 'doughnut', data: { labels: ['Claro', 'Low-E', 'Sobrante'], datasets: [{ data: [54, 43, 4], backgroundColor: ['#7ca9ff', '#b18cff', '#f6c86b'], borderWidth: 0, spacing: 3 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '68%', plugins: { legend: { display: false }, tooltip: base.plugins.tooltip } } });
}

function renderCauseList() { $('#causeList').innerHTML = demo.causes.map(([name, value]) => `<div class="cause-row"><span>${name}</span><strong>${format(value, 2)} h</strong></div>`).join(''); }

function renderQuality() {
  const totalRejects = machines.reduce((sum, machine) => sum + machine.rejects, 0);
  const qualityKpis = [
    { label: 'Eventos de rechazo', value: totalRejects, unit: 'eventos', trend: '53 registros fuente', color: 'red' },
    { label: 'Reprocesos', value: 16, unit: 'pzs', trend: '30% del total', color: 'amber' },
    { label: 'Área afectada', value: '64.8', unit: 'm²', trend: '−8.2% vs. promedio', color: 'cyan' },
    { label: 'Peso perdido', value: '1,094', unit: 'kg', trend: 'Concentrado del día', color: 'purple' }
  ];
  $('#qualityKpis').innerHTML = qualityKpis.map((kpi) => `<article class="kpi-card ${kpi.color}"><span class="kpi-label">${kpi.label}</span><strong class="kpi-value">${kpi.value}<span class="kpi-unit">${kpi.unit}</span></strong><span class="kpi-trend trend-flat">${kpi.trend}</span></article>`).join('');
  const max = 30;
  $('#rejectionMachineList').innerHTML = [...machines].filter((machine) => machine.rejects).sort((a, b) => b.rejects - a.rejects).map((machine) => `<div class="rejection-machine"><span>${machine.name}</span><span class="reject-bar"><i style="width:${machine.rejects / max * 100}%"></i></span><strong>${machine.rejects}</strong></div>`).join('');
}

function machineDetail(machine) {
  const status = getStatus(machine.oee);
  const chartId = `machineChart-${machine.id}`;
  return `<div class="machine-detail-header"><span class="machine-detail-icon" style="background:${machine.color}"></span><div><h3>${machine.name}</h3><p>${machine.area} · Fórmula de ciclo activa · Turno 1</p></div><span class="status-tag ${status.className} machine-detail-status">${machine.oee ? status.label : 'Sin dato'}</span></div><div class="detail-kpis"><div class="detail-kpi"><span>Producción</span><strong>${format(machine.production)}</strong><small>piezas</small></div><div class="detail-kpi"><span>OEE</span><strong style="color:${machine.color}">${machine.oee ? `${format(machine.oee, 1)}%` : '—'}</strong><small>meta 85%</small></div><div class="detail-kpi"><span>Eficiencia</span><strong>${machine.efficiency ? `${format(machine.efficiency, 1)}%` : '—'}</strong><small>meta 95%</small></div><div class="detail-kpi"><span>Tiempo muerto</span><strong>${machine.downtime ? `${format(machine.downtime, 2)}` : '—'}</strong><small>horas</small></div><div class="detail-kpi"><span>Rechazos</span><strong>${machine.rejects || '—'}</strong><small>${machine.reprocess ? `${machine.reprocess} reprocesos` : 'sin reproceso'}</small></div></div><div class="detail-charts"><section class="panel chart-panel"><div class="panel-header"><div><p class="section-overline">Ritmo del proceso</p><h3>Producción por hora</h3></div><span class="chart-period">06:00—22:00</span></div><div class="chart-box"><canvas id="${chartId}"></canvas></div></section><section class="panel"><div class="panel-header"><div><p class="section-overline">Lectura</p><h3>Oportunidad principal</h3></div><span class="sparkle">✦</span></div><div class="detail-callout"><span>↗</span><span><strong>Hallazgo:</strong> ${machine.note}</span></div><div class="cycle-list"><div class="cycle-row"><span>Disponibilidad</span><span class="cycle-bar"><i style="width:${Math.min(machine.effective + 5, 100)}%"></i></span><span>${machine.effective ? format(machine.effective, 1) : '—'}%</span></div><div class="cycle-row"><span>Rendimiento</span><span class="cycle-bar"><i style="width:${Math.min(machine.efficiency, 100)}%"></i></span><span>${machine.efficiency ? format(machine.efficiency, 1) : '—'}%</span></div><div class="cycle-row"><span>Calidad</span><span class="cycle-bar"><i style="width:${Math.max(100 - machine.rejects, 0)}%"></i></span><span>${machine.rejects ? format(Math.max(100 - machine.rejects, 0), 1) : '100'}%</span></div></div></section></div>`;
}

function renderMachineDetail() {
  const machine = getMachine(selectedMachine);
  $('#detailMachine').value = machine.id;
  $('#machineTabs').innerHTML = machines.map((item) => `<button class="machine-tab ${item.id === selectedMachine ? 'active' : ''}" data-machine="${item.id}">${item.name}</button>`).join('');
  $('#machineDetailContent').innerHTML = machineDetail(machine);
  $$('#machineTabs .machine-tab').forEach((tab) => tab.addEventListener('click', () => openMachine(tab.dataset.machine)));
  const canvas = $(`#machineChart-${machine.id}`);
  if (canvas && typeof Chart !== 'undefined') {
    if (charts.machine) charts.machine.destroy();
    const hourly = machine.production ? [0, 8, 21, 28, 32, 27, 35, 31, 38, 34, 28, 33, 29, 24, 22, 18] : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    charts.machine = new Chart(canvas, { type: 'line', data: { labels: ['06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21'], datasets: [{ data: hourly, borderColor: machine.color, backgroundColor: `${machine.color}18`, fill: true, tension: .35, pointRadius: 2.5, pointBackgroundColor: machine.color }] }, options: { ...chartDefaults(), scales: { ...chartDefaults().scales, y: { ...chartDefaults().scales.y, ticks: { ...chartDefaults().scales.y.ticks, precision: 0 } } } } });
  }
}

function showView(view) {
  currentView = view;
  $$('.view').forEach((section) => section.classList.toggle('active', section.id === `${view}View`));
  $$('.nav-item').forEach((item) => item.classList.toggle('active', item.dataset.view === view));
  const labels = { overview: 'Portada gerencial', machines: 'Máquinas', quality: 'Calidad operacional', oven: 'Hornos y cortes' };
  $('#breadcrumbCurrent').textContent = labels[view];
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openMachine(id) { selectedMachine = id; showView('machines'); renderMachineDetail(); }
function showToast(message) { $('#toastMessage').textContent = message; $('#toast').classList.add('show'); window.clearTimeout(showToast.timeout); showToast.timeout = window.setTimeout(() => $('#toast').classList.remove('show'), 2600); }

function bindEvents() {
  $$('.nav-item').forEach((item) => item.addEventListener('click', () => { showView(item.dataset.view); if (item.dataset.view === 'machines') renderMachineDetail(); }));
  $$('[data-view-target]').forEach((button) => button.addEventListener('click', () => { const view = button.dataset.viewTarget; showView(view); if (view === 'machines') renderMachineDetail(); }));
  $('#machineFilter').addEventListener('change', () => { renderKpis(); renderPerformance(); });
  $('#areaFilter').addEventListener('change', () => { renderKpis(); renderPerformance(); });
  $('#clearFilters').addEventListener('click', () => { $('#machineFilter').value = 'all'; $('#areaFilter').value = 'all'; $('#shiftFilter').value = 'all'; renderKpis(); renderPerformance(); showToast('Filtros restablecidos'); });
  $('#detailMachine').addEventListener('change', (event) => openMachine(event.target.value));
  $('#refreshData').addEventListener('click', () => showToast('Demo actualizada · sin cambios pendientes'));
  $('#downloadBtn').addEventListener('click', () => showToast('Resumen listo para descargar en la versión conectada'));
  $('#mobileMenu').addEventListener('click', () => $('#sidebar').classList.toggle('open'));
}

function init() {
  renderFilters(); renderKpis(); renderPerformance(); renderInsights(); renderQuickMachines(); renderCauseList(); renderQuality(); initCharts(); renderMachineDetail(); bindEvents();
}

document.addEventListener('DOMContentLoaded', init);
