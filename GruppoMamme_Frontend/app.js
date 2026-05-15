/*
  =============================================================================
  ARCHITETTURA APPLICAZIONE (Vanilla JS)
  =============================================================================
  Questo script condensa l'intera logica di presentazione e business dell'app.
  Si compone di:
  1. Utilies generali (funzioni di compressione e recupero).
  2. Elaborazione dei Dati (logica per calcolo anomalie e percentuali di efficienza).
  3. Controlli Grafici (inizializzazione, distruzione e setup instanze di Chart.js).
  4. Aggiornamento UI (Modifica esplicita nodale).
  5. Gestore Eventi (Event Delegation globale su navigazione, input ed elementi interattivi).
  =============================================================================
*/

// Alias rapidi per velocizzare selettori DOM e Base URL dell'API.
const API = 'https://localhost:7024', $ = s => document.querySelector(s), $$ = s => document.querySelectorAll(s);

// STATO GLOBALE
// `gData`: Immagazzina i raw json scaricati dalle api (o fallback) di potenza e vento.
// `charts`: Mantiene la referenza alle istanze di Chart.js (essenziale per sovrascriverle via distruzione previa).
// `state`: Salva filtri utente: pDay (giorni per main), eDay (giorni per eff.), sv (flag visibilità per set di dataset).
let gData = { pow: [], wind: [] }, charts = { main: null, eff: null };
let state = { pDay: 7, eDay: 7, sv: { pow: 1, wind: 1, curve: 1 } };

/* 
  DATI DI FALLBACK
  Vengono attivati in modo completamente silente (eccetto update panel)
  qualora non riesca a raggiungere il server (API === offline).
*/
const fallback = {
  pow: Array.from({length: 30}, (_,i) => ({ date: `2026-05-${String(i+1).padStart(2,'0')}T00:00:00`, activePower: 400 + Math.random()*400 })),
  wind: Array.from({length: 30}, (_,i) => ({ date: `2026-05-${String(i+1).padStart(2,'0')}T00:00:00`, windspeed: 4 + Math.random()*8 }))
};

// ======================= UTILITIES GLOBALI ============================== //

// Estrazione flessibile. Se un json cambia camelCase/PascalCase, cerca nella lista passata come keys.
const extract = (d, keys) => d[keys.find(k => d[k] !== undefined)] || 0;

// Evita divisioni per 0 calcolando medie da un array in modo sicuro.
const avg = arr => arr.length ? arr.reduce((a,b) => a+b, 0)/arr.length : 0;

// Permette il raggruppamento delle chiavi json in un oggetto mappato a Data 'YYYY-MM-DD' e con sum/count per successive medie.
const groupDaily = (arr, vKeys) => arr.reduce((acc, obj) => {
  const k = extract(obj, ['data','Date','date']).substring(0,10);
  if(k) { acc[k] = acc[k] || {s:0, c:0}; acc[k].s += Number(extract(obj, vKeys))||0; acc[k].c++; }
  return acc;
}, {});


// ================= PROCESSING E LOGICA DI BUSINESS ====================== //

// `processData`: Applica le metriche in base a un range di X ultimi giorni storici ('days').
const processData = (days) => {
  // Raggruppo l'array originale a dizionario chiave(data)-sum e poi ordino gli step storici (days).
  const pd = groupDaily(gData.pow, ['activePower','ActivePower','activePowerKw']);
  const wd = groupDaily(gData.wind, ['windspeed','WindSpeed','windSpeedAvg']);
  const dates = Object.keys(pd).sort().slice(-days);

  // Trasformo la struttura iterando sui giorni necessari.
  return dates.reduce((acc, d) => {
    // Media del giorno in questione (somma/count).
    const p = pd[d] ? pd[d].s/pd[d].c : 0, w = wd[d] ? wd[d].s/wd[d].c : 0;
    
    // Formula euristica semplificata per Power Curve Teorica = (vento).
    const c = w < 3.5 ? 0 : (w < 12 ? (w-3)*100 : 900);
    // Efficienza calcolata dalla discrepanza tra reale ed attesa (limite massimo logico protetto al 100%).
    const e = c > 0 ? Math.min(100, (p/c)*100) : 0;
    
    // Preparo le label per le assi X e pusho tutti i set per quel giorno.
    acc.lbl.push(new Date(d).toLocaleDateString('it-IT',{month:'2-digit',day:'2-digit'}));
    acc.p.push(p); acc.w.push(w); acc.c.push(c); acc.e.push(e);
    
    // Check anomalie: Vento consistente (>6) ma la potenza è inspiegabilmente droppata sotto il 50% di attesa.
    if(w > 6 && p < c*0.5) acc.anom.push({ d: acc.lbl.at(-1), w: w.toFixed(2), p: p.toFixed(2), c: c.toFixed(2) });
    return acc;
  }, { lbl:[], p:[], w:[], c:[], e:[], anom:[] });
};


// ========================== GESTIONE DOM (UI) =========================== //

// `updateUI`: Modifica chirurgicamente la DOM solo sui label dei metric superiori o lista anomale interna.
const updateUI = () => {
  const d = processData(state.pDay);
  $('#m-pow').innerText = Math.round(avg(d.p)); $('#m-wind').innerText = avg(d.w).toFixed(1);
  $('#m-eff').innerText = Math.round(avg(d.e)); $('#m-anom').innerText = d.anom.length;
  $('#a-tot').innerText = d.anom.length; $('#sb-anom').innerText = d.anom.length;
  
  // Costruisce la UI List Anomalie a concatenazione (mapping dinamico template strings).
  $('#a-list').innerHTML = d.anom.length ? d.anom.map(a => `<div class="anom-row"><span class="anom-date">${a.d}</span><span>Vento: <b>${a.w} m/s</b> | Reale: <b>${a.p} kW</b> | Teor: <b>${a.c} kW</b></span></div>`).join('') : '<div class="text-green text-xs font-mono mt-1">Nessuna anomalia</div>';
};


// ============================== CHART.JS ================================ //

// Parametri riutilizzabili per Chart
const cOpt = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display:false }}};

// `buildCharts`: Costruisce e renderizza Main Chart + Efficienza Chart
const buildCharts = () => {
  const md = processData(state.pDay), ed = processData(state.eDay);
  
  // Previene memory leak grafico (destroy forza la liberazione canvas).
  if(charts.main) charts.main.destroy(); if(charts.eff) charts.eff.destroy();
  
  // 1. Chart Main (Dataset misto a Line, Bar, Dashed Line; con doppio Axis in caso visibilità check)
  charts.main = new Chart($('#mainChart'), { data: { labels: md.lbl, datasets: [
    { type:'line', data: md.p, borderColor: '#3b9eff', borderWidth: 2, tension: .3, yAxisID: 'y', hidden: !state.sv.pow },
    { type:'bar', data: md.w, backgroundColor: 'rgba(0,229,160,.25)', yAxisID: 'y2', hidden: !state.sv.wind },
    { type:'line', data: md.c, borderColor: 'rgba(255,178,63,.6)', borderDash: [5,5], tension: .3, yAxisID: 'y', hidden: !state.sv.curve }
  ]}, options: { ...cOpt, scales: { x:{grid:{color:'rgba(99,179,255,.05)'}}, y:{position:'left'}, y2:{position:'right',grid:{display:false}} } }});

  // 2. Chart Efficienza (Varia il bg della bar rossa/verde a seconda se passa una soglia fissa e calcolata dinamicamente).
  charts.eff = new Chart($('#effChart'), { type: 'bar', data: { labels: ed.lbl, datasets: [
    { data: ed.e, backgroundColor: ed.e.map(v => v<75 ? 'rgba(255,77,106,.7)' : 'rgba(0,229,160,.7)') },
    { type:'line', data: ed.lbl.map(()=>75), borderColor: 'rgba(255,77,106,.5)', borderDash:[5,5], pointRadius:0 }
  ]}, options: { ...cOpt, scales: { y:{min:0, max:115} } }});
};


// ====================== INTERPOLAZIONE LOGICA =========================== //

// `calcI`: Sfrutta la formula matematica fornita (Lineare) per calcolare la potenza da parametri input dell'utente.
const calcI = () => {
  // Cast massivo (string to number) dal blocco DOM
  const [v1, v2, vm, p1, p2] = ['v1','v2','vm','p1','p2'].map(id => +$(`#${id}`).value);
  
  // Condizioni per abortirvi calcolo (es invalidità input o errore deltanut).
  if([v1,v2,vm,p1,p2].some(isNaN) || v2===v1) return;
  
  // Formula Lineare
  const r = p1 + (vm-v1)*(p2-p1)/(v2-v1);
  $('#i-res').innerText = `${r.toFixed(2)} kW`;
  // Documenta i passi di soluzione per scopi educativi ed esplorativi utente.
  $('#i-steps').innerHTML = `${p1} + (${vm} - ${v1}) &times; (${p2} - ${p1}) / (${v2} - ${v1}) = <b>${r.toFixed(2)}</b>`;
};


// ========================= EVENT LISTENERS ============================== //

// EVENT DELEGATION NAVIGAZIONE: Si appende un solo click a #nav e valuta il trigger `data-panel`. Modifica classes attive.
$('#nav').addEventListener('click', e => {
  const btn = e.target.closest('.nav-btn'); if(!btn) return;
  $$('.nav-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active');
  $$('.panel').forEach(p => p.classList.remove('active')); $(`#p-${btn.dataset.panel}`).classList.add('active');
  // Re-build istantaneo grafici solo se apriamo un pannello grafico compatibile.
  if(['chart','eff'].includes(btn.dataset.panel)) buildCharts();
});

// EVENT DELEGATION CAMBIO GIORNI (CHIP 7|14|30). Supporta filtri separati a griglie pDay (Global/Main) / eDay (Efficiency).
$$('#c-days, #c-eff-days').forEach(g => g.addEventListener('click', e => {
  if(!e.target.matches('.chip')) return;
  const isMain = g.id === 'c-days';
  state[isMain ? 'pDay' : 'eDay'] = +e.target.dataset.days;
  
  g.querySelectorAll('.chip').forEach(c => c.className = 'chip'); e.target.className = 'chip on-blue';
  buildCharts();
}));

// EVENT DELEGATION CAMBIO SERIE VISIBILI (CHIP toggle Pow/Wind/Curve) - Salva l'inversione booleana del flag corrente e forza render.
$('#c-series').addEventListener('click', e => {
  const c = e.target.closest('.chip'); if(!c) return;
  const k = c.dataset.series; state.sv[k] = !state.sv[k];
  c.className = state.sv[k] ? `chip on-${k==='pow'?'blue':k==='wind'?'green':'amber'}` : 'chip';
  buildCharts();
});

// Event Listener real time sull'aggregato parente Input-Form Efficienza (scatta la func ogni volta un value diviene alterato).
$('#interp-form').addEventListener('input', calcI);

// Trigger globali window helper (Prompt Esterni/Redirect)
const askCode = t => window.sendPrompt && sendPrompt(`Prompt: ${t}`);
window.goTo = p => $(`[data-panel="${p}"]`).click();

// ======================== APP INITIALIZATION ============================ //

// IIFE (Immediately Invoked Function Expression) Asincrona.
// Scatena le fetch originarie alle route e in caso successo parsa/prepara setup.
(async () => {
  try {
    const [pR, wR] = await Promise.all([fetch(`${API}/active-power`), fetch(`${API}/windspeed`)]);
    if(!pR.ok || !wR.ok) throw 1;
    gData = { pow: await pR.json(), wind: await wR.json() };
    
    // Disattiva il banner loader
    $('#loader').outerHTML = '';
  } catch {
    // In caso d'errore (cross origin, downserver, bad call) esegue fallback dummy automatico.
    gData = fallback;
    $('#loader').innerHTML = 'TEST MODE - API non disponibile';
  }
  
  // Run finale dei cicli visivi essenziali post-fetching.
  updateUI(); buildCharts(); calcI();
})();