const Base_URL = 'https://localhost:7024';//collegamento all'api

// Global storage per i dati delle API
let allPowerData = [];
let allWindData = [];

// Dati di fallback per test quando il backend non è disponibile
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

function pickValue(obj, keys) {
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null) {
      return obj[key];
    }
  }
  return undefined;
}

function getDateValue(obj) {
  return pickValue(obj, ['data', 'Data', 'date', 'Date']);
}

function getPowerValue(obj) {
  return pickValue(obj, ['activePower', 'ActivePower', 'activePowerKw', 'ActivePowerKw', 'activePowerKW', 'ActivePowerKW']);
}

function getWindValue(obj) {
  return pickValue(obj, ['windspeed', 'Windspeed', 'windSpeed', 'WindSpeed', 'windSpeedAvg', 'WindSpeedAvg']);
}

function aggregateDaily(data, valueGetter) {
  const map = {};
  data.forEach(item => {
    const rawDate = getDateValue(item);
    if(!rawDate) {
      return;
    }
    const dateOnly = String(rawDate).substring(0, 10);
    const val = parseFloat(valueGetter(item));
    if(Number.isNaN(val)) {
      return;
    }
    if(!map[dateOnly]) {
      map[dateOnly] = { sum: 0, count: 0 };
    }
    map[dateOnly].sum += val;
    map[dateOnly].count += 1;
  });
  return map;
}

// Funzione per fetchare i dati dalle API
async function fetchAllData() {
  try {
    console.log('Fetching data from:', Base_URL);

    const powerRes = await fetch(`${Base_URL}/active-power-data`);
    console.log('Power API Response:', powerRes.status, powerRes.statusText);
    const windRes = await fetch(`${Base_URL}/windspeed-data`);
    console.log('Wind API Response:', windRes.status, windRes.statusText);

    if(!powerRes.ok) {
      throw new Error(`Power API error: ${powerRes.status} ${powerRes.statusText}`);
    }
    if(!windRes.ok) {
      throw new Error(`Wind API error: ${windRes.status} ${windRes.statusText}`);
    }

    allPowerData = await powerRes.json();
    allWindData = await windRes.json();

    console.log('✓ Power data loaded:', allPowerData.length, 'records');
    console.log('  Primo record:', JSON.stringify(allPowerData[0]));
    console.log('✓ Wind data loaded:', allWindData.length, 'records');
    console.log('  Primo record:', JSON.stringify(allWindData[0]));

    if(allPowerData.length === 0 || allWindData.length === 0) {
      console.warn('⚠ Avviso: uno o entrambi gli endpoint hanno ritornato dati vuoti');
    }

    return true;
  } catch(err) {
    console.error('✗ Errore nel caricamento dati:', err);
    console.log('📌 Usando dati di fallback per il test...');

    // Usa dati di fallback
    allPowerData = fallbackData.power;
    allWindData = fallbackData.wind;

    console.log('✓ Dati di fallback caricati (' + allPowerData.length + ' giorni)');
    console.log('⚠ Connetti il backend su ' + Base_URL + ' per usare i dati reali');

    return true; // Ritorna true per continuare con i dati di fallback
  }
}

// Funzione per generare i dati dei grafici dai dati reali
function gen(days) {
  const labels = [];
  const power = [];
  const wind = [];
  const curve = [];
  const eff = [];
  const anomalies = [];

  if(allPowerData.length === 0) {
    console.warn('⚠ Nessun dato di potenza disponibile');
    return { labels, power, wind, curve, eff, anomalies };
  }

  const powerDaily = aggregateDaily(allPowerData, getPowerValue);
  const windDaily = aggregateDaily(allWindData, getWindValue);

  console.log('Power days:', Object.keys(powerDaily).length, 'Wind days:', Object.keys(windDaily).length);

  // Ordina per data e prendi gli ultimi `days` giorni
  const sortedDates = Object.keys(powerDaily).sort((a, b) => new Date(a) - new Date(b));
  const recentDates = sortedDates.slice(-days);

  console.log(`Processing ${recentDates.length} giorni di dati`);

  recentDates.forEach(dateOnly => {
    const dateObj = new Date(dateOnly);
    const dateStr = dateObj.toLocaleDateString('it-IT', {month: '2-digit', day: '2-digit'});

    labels.push(dateStr);

    const powerBucket = powerDaily[dateOnly];
    const powerVal = powerBucket ? powerBucket.sum / powerBucket.count : 0;
    power.push(powerVal);

    const windBucket = windDaily[dateOnly];
    const windVal = windBucket ? windBucket.sum / windBucket.count : 0;
    wind.push(windVal);

    console.log(`  Data: ${dateStr}, Potenza: ${powerVal}, Vento: ${windVal}`);

    // Power curve teorica (approssimazione per turbina)
    const curveVal = windVal < 3.5 ? 0 : (windVal < 12 ? (windVal - 3) * 100 : 900);
    curve.push(curveVal);

    // Efficienza
    const effVal = curveVal > 0 ? (powerVal / curveVal) * 100 : 0;
    eff.push(Math.min(100, effVal));

    // Rilevamento anomalie: vento > 6 e potenza < 50% teorica
    if(windVal > 6 && powerVal < curveVal * 0.5) {
      anomalies.push({
        date: dateStr,
        wind: windVal.toFixed(2),
        real: powerVal.toFixed(2),
        th: curveVal.toFixed(2)
      });
    }
  });

  console.log(`✓ Generati dati per ${labels.length} giorni`);
  return { labels, power, wind, curve, eff, anomalies };
}

// State variables for current settings
/* ─── STATE ─── */
// Current period for main chart and efficiency chart
let curDays=7, effDays=7;
// Chart.js instances for main and efficiency charts
let mainC=null, effC=null;
// Visibility state for chart series
let sv={pow:true,wind:true,curve:true};

// Metrics update function
/* ─── METRICS ─── */
// Function to calculate and update the displayed metrics from data
function updateMetrics(data){
  const ap=data.power.reduce((a,b)=>a+b,0)/data.power.length;
  const aw=data.wind.reduce((a,b)=>a+b,0)/data.wind.length;
  const ae=data.eff.reduce((a,b)=>a+b,0)/data.eff.length;
  document.getElementById('m-pow').textContent=Math.round(ap);
  document.getElementById('m-wind').textContent=aw.toFixed(1);
  document.getElementById('m-eff').textContent=Math.round(ae);
  document.getElementById('m-anom').textContent=data.anomalies.length;
  document.getElementById('sb-anom-count').textContent=data.anomalies.length;
}

// Chart building functions
/* ─── CHARTS ─── */
// Default options for Chart.js charts
const chartDefaults={
  responsive:true, maintainAspectRatio:false,
  plugins:{legend:{display:false},tooltip:{mode:'index',intersect:false,backgroundColor:'#0d1628',titleColor:'#8aabcc',bodyColor:'#e8f4ff',borderColor:'rgba(99,179,255,0.2)',borderWidth:1}},
};

// Function to build the main chart with power, wind, and power curve
function buildMain(days){
  const d=gen(days); updateMetrics(d); buildAnom(d);
  const ctx=document.getElementById('mainChart').getContext('2d');
  if(mainC) mainC.destroy();
  mainC=new Chart(ctx,{
    data:{labels:d.labels,datasets:[
      {type:'line',label:'Potenza reale (kW)',data:d.power,borderColor:'#3b9eff',backgroundColor:'rgba(59,158,255,0.05)',borderWidth:2,pointRadius:2.5,pointBackgroundColor:'#3b9eff',tension:0.35,yAxisID:'y',hidden:!sv.pow},
      {type:'bar',label:'Vento (m/s)',data:d.wind,backgroundColor:'rgba(0,229,160,0.25)',borderColor:'rgba(0,229,160,0.5)',borderWidth:1,yAxisID:'y2',hidden:!sv.wind},
      {type:'line',label:'Power curve',data:d.curve,borderColor:'rgba(255,178,63,0.65)',borderDash:[6,4],borderWidth:1.5,pointRadius:0,tension:0.35,yAxisID:'y',hidden:!sv.curve}
    ]},
    options:{...chartDefaults,scales:{
      x:{ticks:{color:'#4a6a8a',font:{size:10,family:"'DM Mono',monospace"},maxRotation:40},grid:{color:'rgba(99,179,255,0.04)'},border:{color:'rgba(99,179,255,0.1)'}},
      y:{position:'left',title:{display:true,text:'kW',color:'#4a6a8a',font:{size:11}},ticks:{color:'#4a6a8a',font:{size:10}},grid:{color:'rgba(99,179,255,0.06)'},border:{color:'rgba(99,179,255,0.1)'}},
      y2:{position:'right',title:{display:true,text:'m/s',color:'#4a6a8a',font:{size:11}},ticks:{color:'#4a6a8a',font:{size:10}},grid:{display:false},border:{color:'rgba(99,179,255,0.1)'}}
    }}
  });
}

// Function to build the efficiency chart
function buildEff(days){
  const d=gen(days);
  const ctx=document.getElementById('effChart').getContext('2d');
  if(effC) effC.destroy();
  const cols=d.eff.map(e=>e<75?'rgba(255,77,106,0.75)':'rgba(0,229,160,0.7)');
  effC=new Chart(ctx,{
    type:'bar',
    data:{labels:d.labels,datasets:[
      {label:'Efficienza %',data:d.eff,backgroundColor:cols,borderWidth:0,borderRadius:3},
      {type:'line',label:'Soglia 75%',data:d.labels.map(()=>75),borderColor:'rgba(255,77,106,0.45)',borderDash:[5,4],borderWidth:1.5,pointRadius:0}
    ]},
    options:{...chartDefaults,scales:{
      x:{ticks:{color:'#4a6a8a',font:{size:10,family:"'DM Mono',monospace"},maxRotation:40},grid:{display:false},border:{color:'rgba(99,179,255,0.1)'}},
      y:{min:0,max:115,ticks:{color:'#4a6a8a',font:{size:10},callback:v=>v+'%'},grid:{color:'rgba(99,179,255,0.06)'},border:{color:'rgba(99,179,255,0.1)'}}
    }}
  });
}

// Function to build the anomalies list
function buildAnom(data){
  const el=document.getElementById('anom-list');
  const lbl=document.getElementById('anom-count-lbl');
  lbl.textContent=data.anomalies.length+' giorni';
  document.getElementById('sb-anom-count').textContent=data.anomalies.length;
  if(!data.anomalies.length){
    el.innerHTML='<div style="padding:14px;text-align:center;font-family:var(--font-mono);font-size:13px;color:var(--green)"><i class="ti ti-circle-check"></i> Nessuna anomalia nel periodo</div>';
    return;
  }
  el.innerHTML=data.anomalies.map(a=>`
    <div class="anom-row">
      <span class="anom-date">${a.date}</span>
      <span class="anom-stat">Vento: <strong>${a.wind} m/s</strong></span>
      <span class="anom-stat">Reale: <strong>${a.real} kW</strong></span>
      <span class="anom-stat">Teorica: <strong>${a.th} kW</strong></span>
      <span class="anom-tag">Possibile fermo</span>
    </div>`).join('');
}

// Navigation functions
/* ─── NAVIGATION ─── */
// Array of panel names
const panels=['home','db','chart','eff','anom'];

// Function to switch to a specific panel
function goTo(name){
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  panels.forEach(p=>document.getElementById('p-'+p).classList.remove('active'));
  const navBtns=document.querySelectorAll('.nav-btn');
  const idx=panels.indexOf(name);
  if(idx>=0) navBtns[idx].classList.add('active');
  document.getElementById('p-'+name).classList.add('active');
  if(name==='chart') buildMain(curDays);
  if(name==='eff'){ buildEff(effDays); calcInterp(); }
  if(name==='anom') buildAnom(gen(curDays));
}

// Functions to change the period for charts
/* ─── PERIOD TOGGLES ─── */
// Function to set the period for main chart
function setPeriod(d,el){
  curDays=d;
  document.querySelectorAll('#c7,#c14,#c30').forEach(c=>{c.className='chip';});
  el.className='chip on-blue';
  buildMain(d);
}

// Function to set the period for efficiency chart
function setEffP(d,el){
  effDays=d;
  document.querySelectorAll('#ew7,#ew14,#ew30').forEach(c=>{c.className='chip';});
  el.className='chip on-blue';
  buildEff(d);
}

// Function to toggle series visibility
/* ─── SERIES TOGGLE ─── */
// Function to toggle visibility of a chart series
function toggleS(key,el){
  sv[key]=!sv[key];
  const clsMap={pow:'on-blue',wind:'on-green',curve:'on-amber'};
  el.className=sv[key]?'chip '+clsMap[key]:'chip';
  if(mainC){const idx={pow:0,wind:1,curve:2};mainC.data.datasets[idx[key]].hidden=!sv[key];mainC.update();}
}

// Interpolation calculation for efficiency
/* ─── INTERP CALC ─── */
// Function to calculate interpolated power and display steps
function calcInterp(){
  const v1=+document.getElementById('iv1').value, v2=+document.getElementById('iv2').value;
  const vm=+document.getElementById('ivm').value, p1=+document.getElementById('ip1').value;
  const p2=+document.getElementById('ip2').value;
  if([v1,v2,vm,p1,p2].some(isNaN)||v2===v1) return;
  const res=p1+(vm-v1)*(p2-p1)/(v2-v1);
  document.getElementById('interp-result').textContent=res.toFixed(2)+' kW';
  document.getElementById('interp-steps').innerHTML=
    `${p1.toFixed(2)} + (${vm} − ${v1}) × (${p2.toFixed(2)} − ${p1.toFixed(2)}) / (${v2} − ${v1}) = <strong style="color:var(--cyan)">${res.toFixed(2)} kW</strong>`;
}

// Prompts for code generation
/* ─── CODE PROMPTS ─── */
// Object containing prompts for different code generation requests
const prompts={
  backend:'Genera il controller ASP.NET Core completo per importare il CSV della turbina eolica su SQL Server con EF Core, includendo la mappatura dei timestamp Unix in millisecondi.',
  frontend:'Crea un componente NUXT 4 con PrimeVue Chart.js che mostri il grafico potenza reale vs velocità del vento con dual y-axis.',
  sql:'Genera gli script SQL completi per creare le tabelle TurbineData e WeatherData su SQL Server con chiave esterna per data.',
  relazione:'Aiutami a scrivere la relazione scolastica per Wind Turbine Stats della classe 5°, commentando la correlazione vento-potenza e le anomalie rilevate.',
  httpclient:'Mostrami il codice C# con HttpClient per chiamare Open-Meteo API alle coordinate 41.030N 15.595E e salvare i dati di vento su SQL Server.',
  sdk:'Mostrami come usare il package NuGet open-meteo-dotnet-client-sdk in ASP.NET Core per il progetto Wind Turbine Stats.',
  'nuxt-chart':'Genera il componente NUXT 4 completo con PrimeVue per visualizzare produzione turbina e vento con Chart.js e dual y-axis.',
  'efficienza-c#':'Come implemento il calcolo dell\'efficienza giornaliera della turbina con interpolazione lineare della power curve in C# ASP.NET Core?',
  'relazione-anomalie':'Scrivi la sezione della relazione scolastica che analizza le anomalie rilevate nella turbina eolica, con commento su possibili cause.',
  'rilevamento-anomalie':'Come implemento in C# il rilevamento automatico delle anomalie della turbina confrontando potenza reale e power curve?'
};

// Function to send a prompt for code generation
function askCode(key){
  const t=prompts[key]||`Aiutami con: ${key} per il progetto Wind Turbine Stats`;
  if(typeof sendPrompt==='function') sendPrompt(t);
}

// Initialization code
/* ─── INIT ─── */
// Load data from APIs first, then initialize dashboard
(async () => {
  console.log('=== Inizializzazione Dashboard ===');
  const loaded = await fetchAllData();
  const statusEl = document.getElementById('load-status');

  if(loaded) {
    const initData = gen(7);
    updateMetrics(initData);
    buildAnom(initData);
    calcInterp();
    console.log('✓ Dashboard inizializzata con successo');

    if(statusEl) {
      if(allPowerData === fallbackData.power) {
        statusEl.innerHTML = '<i class="ti ti-alert-circle"></i> Modalità TEST - Usando dati di esempio. Connetti il backend per i dati reali.';
        statusEl.style.background = 'rgba(0,212,255,0.1)';
        statusEl.style.borderColor = 'rgba(0,212,255,0.3)';
        statusEl.style.color = 'var(--cyan)';
      } else {
        statusEl.style.display = 'none';
      }
    }
  } else {
    console.error('✗ Impossibile inizializzare il dashboard');
    if(statusEl) {
      statusEl.innerHTML = '<i class="ti ti-alert-triangle"></i> Errore: impossibile connettersi all\'API. Apri la console (F12) per i dettagli.';
      statusEl.style.background = 'rgba(255,77,106,0.1)';
      statusEl.style.borderColor = 'rgba(255,77,106,0.3)';
      statusEl.style.color = 'var(--red)';
    }
  }
})();
