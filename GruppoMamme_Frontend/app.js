// =========================
// CONFIGURAZIONE BASE
// =========================

// URL base dell'API (modifica qui se cambia porta o host).
const Base_URL = 'https://localhost:7024';

// Attiva/disattiva log di debug (true = log, false = silenzioso).
const DEBUG = false;

// =========================
// DATI DI FALLBACK (TEST)
// =========================

// Dati finti usati solo se l'API non risponde.
const fallbackData = {
  power: [
    {data: "2026-05-01T00:00:00", activePower: 450},
    {data: "2026-05-02T00:00:00", activePower: 520},
    {data: "2026-05-03T00:00:00", activePower: 380},
    {data: "2026-05-04T00:00:00", activePower: 610},
    {data: "2026-05-05T00:00:00", activePower: 720},
    {data: "2026-05-06T00:00:00", activePower: 580},
    {data: "2026-05-07T00:00:00", activePower: 490}
  ],
  wind: [
    {data: "2026-05-01T00:00:00", windspeed: 7.2},
    {data: "2026-05-02T00:00:00", windspeed: 8.5},
    {data: "2026-05-03T00:00:00", windspeed: 5.3},
    {data: "2026-05-04T00:00:00", windspeed: 9.1},
    {data: "2026-05-05T00:00:00", windspeed: 10.2},
    {data: "2026-05-06T00:00:00", windspeed: 8.7},
    {data: "2026-05-07T00:00:00", windspeed: 6.9}
  ]
};

// =========================
// STATO GLOBALE
// =========================

// Dati scaricati da API.
let allPowerData = [];
let allWindData = [];

// Periodi attivi per grafici.
let curDays = 7;
let effDays = 7;

// Istanze Chart.js (servono per destroy/refresh).
let mainC = null;
let effC = null;

// Stato visibilita serie nel grafico principale.
let sv = { pow: true, wind: true, curve: true };

// Lista pannelli per la navigazione.
const panels = ['home', 'db', 'chart', 'eff', 'anom'];

// =========================
// HELPER GENERALI
// =========================

// Shortcut per recuperare un elemento per id.
const $ = (id) => document.getElementById(id);

// Log condizionale, utile quando DEBUG e true.
const dbg = (...args) => { if (DEBUG) console.log(...args); };

// Media sicura: evita NaN se array vuoto.
function avg(arr) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

// Prende il primo valore non null/undefined tra le chiavi indicate.
function pickValue(obj, keys) {
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null) {
      return obj[key];
    }
  }
  return undefined;
}

// Estrae la data da varianti di nome campo.
function getDateValue(obj) {
  return pickValue(obj, ['data', 'Data', 'date', 'Date']);
}

// Estrae la potenza da varianti di nome campo.
function getPowerValue(obj) {
  return pickValue(obj, ['activePower', 'ActivePower', 'activePowerKw', 'ActivePowerKw', 'activePowerKW', 'ActivePowerKW']);
}

// Estrae il vento da varianti di nome campo.
function getWindValue(obj) {
  return pickValue(obj, ['windspeed', 'Windspeed', 'windSpeed', 'WindSpeed', 'windSpeedAvg', 'WindSpeedAvg']);
}

// Converte una data in chiave giornaliera YYYY-MM-DD.
function toDateKey(value) {
  return value ? String(value).substring(0, 10) : null;
}

// Aggrega i dati per giorno e calcola somma + conteggio.
function aggregateDaily(data, valueGetter) {
  const map = {};
  for (const item of data) {
    const rawDate = getDateValue(item);
    const key = toDateKey(rawDate);
    if (!key) {
      continue;
    }
    const val = parseFloat(valueGetter(item));
    if (Number.isNaN(val)) {
      continue;
    }
    if (!map[key]) {
      map[key] = { sum: 0, count: 0 };
    }
    map[key].sum += val;
    map[key].count += 1;
  }
  return map;
}

// =========================
// FETCH DATI
// =========================

// Carica dati dalle API. Se fallisce, usa fallback.
async function fetchAllData() {
  try {
    const powerRes = await fetch(`${Base_URL}/active-power-data`);
    const windRes = await fetch(`${Base_URL}/windspeed-data`);

    if (!powerRes.ok) {
      throw new Error(`Power API error: ${powerRes.status} ${powerRes.statusText}`);
    }
    if (!windRes.ok) {
      throw new Error(`Wind API error: ${windRes.status} ${windRes.statusText}`);
    }

    allPowerData = await powerRes.json();
    allWindData = await windRes.json();

    dbg('Power data:', allPowerData.length, allPowerData[0]);
    dbg('Wind data:', allWindData.length, allWindData[0]);

    return true;
  } catch (err) {
    console.error('Errore nel caricamento dati:', err);

    // Fallback: mantiene l'app funzionante anche senza backend.
    allPowerData = fallbackData.power;
    allWindData = fallbackData.wind;

    return true;
  }
}

// =========================
// PREPARAZIONE DATI GRAFICI
// =========================

// Genera serie per grafici e lista anomalie.
function gen(days) {
  const result = { labels: [], power: [], wind: [], curve: [], eff: [], anomalies: [] };

  // Se non ci sono dati potenza, non ha senso proseguire.
  if (!allPowerData.length) {
    return result;
  }

  // Media giornaliera per potenza e vento.
  const powerDaily = aggregateDaily(allPowerData, getPowerValue);
  const windDaily = aggregateDaily(allWindData, getWindValue);

  // Ultimi N giorni disponibili (ordinati).
  const sortedDates = Object.keys(powerDaily).sort((a, b) => new Date(a) - new Date(b));
  const recentDates = sortedDates.slice(-days);

  // Costruzione serie giorno per giorno.
  for (const dateKey of recentDates) {
    const dateObj = new Date(dateKey);
    const label = dateObj.toLocaleDateString('it-IT', { month: '2-digit', day: '2-digit' });

    const powerBucket = powerDaily[dateKey];
    const windBucket = windDaily[dateKey];

    const powerVal = powerBucket ? powerBucket.sum / powerBucket.count : 0;
    const windVal = windBucket ? windBucket.sum / windBucket.count : 0;

    result.labels.push(label);
    result.power.push(powerVal);
    result.wind.push(windVal);

    // Power curve teorica semplificata.
    const curveVal = windVal < 3.5 ? 0 : (windVal < 12 ? (windVal - 3) * 100 : 900);
    result.curve.push(curveVal);

    // Efficienza percentuale (max 100%).
    const effVal = curveVal > 0 ? (powerVal / curveVal) * 100 : 0;
    result.eff.push(Math.min(100, effVal));

    // Anomalia: vento > 6 e potenza < 50% teorica.
    if (windVal > 6 && powerVal < curveVal * 0.5) {
      result.anomalies.push({
        date: label,
        wind: windVal.toFixed(2),
        real: powerVal.toFixed(2),
        th: curveVal.toFixed(2)
      });
    }
  }

  return result;
}

// =========================
// METRICHE
// =========================

// Aggiorna i numeri di testata (metriche).
function updateMetrics(data) {
  const ap = avg(data.power);
  const aw = avg(data.wind);
  const ae = avg(data.eff);

  $('m-pow').textContent = Math.round(ap);
  $('m-wind').textContent = aw.toFixed(1);
  $('m-eff').textContent = Math.round(ae);
  $('m-anom').textContent = data.anomalies.length;
  $('sb-anom-count').textContent = data.anomalies.length;
}

// =========================
// GRAFICI
// =========================

// Opzioni base Chart.js condivise.
const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      mode: 'index',
      intersect: false,
      backgroundColor: '#0d1628',
      titleColor: '#8aabcc',
      bodyColor: '#e8f4ff',
      borderColor: 'rgba(99,179,255,0.2)',
      borderWidth: 1
    }
  }
};

// Costruisce il grafico principale (potenza + vento + curva).
function buildMain(days) {
  const d = gen(days);
  updateMetrics(d);
  buildAnom(d);

  const ctx = $('mainChart').getContext('2d');
  if (mainC) mainC.destroy();

  mainC = new Chart(ctx, {
    data: {
      labels: d.labels,
      datasets: [
        {
          type: 'line',
          label: 'Potenza reale (kW)',
          data: d.power,
          borderColor: '#3b9eff',
          backgroundColor: 'rgba(59,158,255,0.05)',
          borderWidth: 2,
          pointRadius: 2.5,
          pointBackgroundColor: '#3b9eff',
          tension: 0.35,
          yAxisID: 'y',
          hidden: !sv.pow
        },
        {
          type: 'bar',
          label: 'Vento (m/s)',
          data: d.wind,
          backgroundColor: 'rgba(0,229,160,0.25)',
          borderColor: 'rgba(0,229,160,0.5)',
          borderWidth: 1,
          yAxisID: 'y2',
          hidden: !sv.wind
        },
        {
          type: 'line',
          label: 'Power curve',
          data: d.curve,
          borderColor: 'rgba(255,178,63,0.65)',
          borderDash: [6, 4],
          borderWidth: 1.5,
          pointRadius: 0,
          tension: 0.35,
          yAxisID: 'y',
          hidden: !sv.curve
        }
      ]
    },
    options: {
      ...chartDefaults,
      scales: {
        x: {
          ticks: { color: '#4a6a8a', font: { size: 10, family: "'DM Mono',monospace" }, maxRotation: 40 },
          grid: { color: 'rgba(99,179,255,0.04)' },
          border: { color: 'rgba(99,179,255,0.1)' }
        },
        y: {
          position: 'left',
          title: { display: true, text: 'kW', color: '#4a6a8a', font: { size: 11 } },
          ticks: { color: '#4a6a8a', font: { size: 10 } },
          grid: { color: 'rgba(99,179,255,0.06)' },
          border: { color: 'rgba(99,179,255,0.1)' }
        },
        y2: {
          position: 'right',
          title: { display: true, text: 'm/s', color: '#4a6a8a', font: { size: 11 } },
          ticks: { color: '#4a6a8a', font: { size: 10 } },
          grid: { display: false },
          border: { color: 'rgba(99,179,255,0.1)' }
        }
      }
    }
  });
}

// Costruisce il grafico efficienza (barre + soglia 75%).
function buildEff(days) {
  const d = gen(days);
  const ctx = $('effChart').getContext('2d');
  if (effC) effC.destroy();

  const cols = d.eff.map(e => e < 75 ? 'rgba(255,77,106,0.75)' : 'rgba(0,229,160,0.7)');

  effC = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: d.labels,
      datasets: [
        { label: 'Efficienza %', data: d.eff, backgroundColor: cols, borderWidth: 0, borderRadius: 3 },
        { type: 'line', label: 'Soglia 75%', data: d.labels.map(() => 75), borderColor: 'rgba(255,77,106,0.45)', borderDash: [5, 4], borderWidth: 1.5, pointRadius: 0 }
      ]
    },
    options: {
      ...chartDefaults,
      scales: {
        x: {
          ticks: { color: '#4a6a8a', font: { size: 10, family: "'DM Mono',monospace" }, maxRotation: 40 },
          grid: { display: false },
          border: { color: 'rgba(99,179,255,0.1)' }
        },
        y: {
          min: 0,
          max: 115,
          ticks: { color: '#4a6a8a', font: { size: 10 }, callback: v => v + '%' },
          grid: { color: 'rgba(99,179,255,0.06)' },
          border: { color: 'rgba(99,179,255,0.1)' }
        }
      }
    }
  });
}

// =========================
// ANOMALIE
// =========================

// Aggiorna lista anomalie e label contatore.
function buildAnom(data) {
  const el = $('anom-list');
  const lbl = $('anom-count-lbl');

  lbl.textContent = data.anomalies.length + ' giorni';
  $('sb-anom-count').textContent = data.anomalies.length;

  if (!data.anomalies.length) {
    el.innerHTML = '<div style="padding:14px;text-align:center;font-family:var(--font-mono);font-size:13px;color:var(--green)"><i class="ti ti-circle-check"></i> Nessuna anomalia nel periodo</div>';
    return;
  }

  el.innerHTML = data.anomalies.map(a => `
    <div class="anom-row">
      <span class="anom-date">${a.date}</span>
      <span class="anom-stat">Vento: <strong>${a.wind} m/s</strong></span>
      <span class="anom-stat">Reale: <strong>${a.real} kW</strong></span>
      <span class="anom-stat">Teorica: <strong>${a.th} kW</strong></span>
      <span class="anom-tag">Possibile fermo</span>
    </div>`).join('');
}

// =========================
// NAVIGAZIONE
// =========================

// Cambia pannello e aggiorna grafici se necessario.
function goTo(name) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  panels.forEach(p => $('p-' + p).classList.remove('active'));

  const navBtns = document.querySelectorAll('.nav-btn');
  const idx = panels.indexOf(name);
  if (idx >= 0) {
    navBtns[idx].classList.add('active');
  }

  $('p-' + name).classList.add('active');

  if (name === 'chart') {
    buildMain(curDays);
  }
  if (name === 'eff') {
    buildEff(effDays);
    calcInterp();
  }
  if (name === 'anom') {
    buildAnom(gen(curDays));
  }
}

// =========================
// CAMBIO PERIODO
// =========================

// Imposta periodo per grafico principale.
function setPeriod(d, el) {
  curDays = d;
  document.querySelectorAll('#c7,#c14,#c30').forEach(c => { c.className = 'chip'; });
  el.className = 'chip on-blue';
  buildMain(d);
}

// Imposta periodo per grafico efficienza.
function setEffP(d, el) {
  effDays = d;
  document.querySelectorAll('#ew7,#ew14,#ew30').forEach(c => { c.className = 'chip'; });
  el.className = 'chip on-blue';
  buildEff(d);
}

// =========================
// TOGGLE SERIE
// =========================

// Mostra/nasconde una serie del grafico principale.
function toggleS(key, el) {
  sv[key] = !sv[key];

  const clsMap = { pow: 'on-blue', wind: 'on-green', curve: 'on-amber' };
  el.className = sv[key] ? 'chip ' + clsMap[key] : 'chip';

  if (mainC) {
    const idx = { pow: 0, wind: 1, curve: 2 };
    mainC.data.datasets[idx[key]].hidden = !sv[key];
    mainC.update();
  }
}

// =========================
// INTERPOLAZIONE
// =========================

// Calcola P(v) con interpolazione lineare.
function calcInterp() {
  const v1 = +$('iv1').value;
  const v2 = +$('iv2').value;
  const vm = +$('ivm').value;
  const p1 = +$('ip1').value;
  const p2 = +$('ip2').value;

  // Validazione minima: evita divisione per zero e NaN.
  if ([v1, v2, vm, p1, p2].some(isNaN) || v2 === v1) {
    return;
  }

  const res = p1 + (vm - v1) * (p2 - p1) / (v2 - v1);

  $('interp-result').textContent = res.toFixed(2) + ' kW';
  $('interp-steps').innerHTML =
    `${p1.toFixed(2)} + (${vm} − ${v1}) × (${p2.toFixed(2)} − ${p1.toFixed(2)}) / (${v2} − ${v1}) = <strong style="color:var(--cyan)">${res.toFixed(2)} kW</strong>`;
}

// =========================
// PROMPT CODICE (HELPER)
// =========================

// Testi predefiniti per i bottoni "Genera codice".
const prompts = {
  backend: 'Genera il controller ASP.NET Core completo per importare il CSV della turbina eolica su SQL Server con EF Core, includendo la mappatura dei timestamp Unix in millisecondi.',
  frontend: 'Crea un componente NUXT 4 con PrimeVue Chart.js che mostri il grafico potenza reale vs velocita del vento con dual y-axis.',
  sql: 'Genera gli script SQL completi per creare le tabelle TurbineData e WeatherData su SQL Server con chiave esterna per data.',
  relazione: 'Aiutami a scrivere la relazione scolastica per Wind Turbine Stats della classe 5, commentando la correlazione vento-potenza e le anomalie rilevate.',
  httpclient: 'Mostrami il codice C# con HttpClient per chiamare Open-Meteo API alle coordinate 41.030N 15.595E e salvare i dati di vento su SQL Server.',
  sdk: 'Mostrami come usare il package NuGet open-meteo-dotnet-client-sdk in ASP.NET Core per il progetto Wind Turbine Stats.',
  'nuxt-chart': 'Genera il componente NUXT 4 completo con PrimeVue per visualizzare produzione turbina e vento con Chart.js e dual y-axis.',
  'efficienza-c#': 'Come implemento il calcolo della efficienza giornaliera della turbina con interpolazione lineare della power curve in C# ASP.NET Core?',
  'relazione-anomalie': 'Scrivi la sezione della relazione scolastica che analizza le anomalie rilevate nella turbina eolica, con commento su possibili cause.',
  'rilevamento-anomalie': 'Come implemento in C# il rilevamento automatico delle anomalie della turbina confrontando potenza reale e power curve?'
};

// Invia il prompt al gestore esterno, se presente.
function askCode(key) {
  const t = prompts[key] || `Aiutami con: ${key} per il progetto Wind Turbine Stats`;
  if (typeof sendPrompt === 'function') {
    sendPrompt(t);
  }
}

// =========================
// INIZIALIZZAZIONE
// =========================

// Avvia caricamento dati e inizializza UI.
(async () => {
  const loaded = await fetchAllData();
  const statusEl = $('load-status');

  if (loaded) {
    const initData = gen(7);
    updateMetrics(initData);
    buildAnom(initData);
    calcInterp();

    if (statusEl) {
      if (allPowerData === fallbackData.power) {
        statusEl.innerHTML = '<i class="ti ti-alert-circle"></i> Modalita TEST - Usando dati di esempio. Connetti il backend per i dati reali.';
        statusEl.style.background = 'rgba(0,212,255,0.1)';
        statusEl.style.borderColor = 'rgba(0,212,255,0.3)';
        statusEl.style.color = 'var(--cyan)';
      } else {
        statusEl.style.display = 'none';
      }
    }
  } else {
    console.error('Impossibile inizializzare il dashboard');
    if (statusEl) {
      statusEl.innerHTML = '<i class="ti ti-alert-triangle"></i> Errore: impossibile connettersi alla API. Apri la console (F12) per i dettagli.';
      statusEl.style.background = 'rgba(255,77,106,0.1)';
      statusEl.style.borderColor = 'rgba(255,77,106,0.3)';
      statusEl.style.color = 'var(--red)';
    }
  }
})();
