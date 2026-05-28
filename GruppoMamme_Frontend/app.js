var oggettoGrafico = null;
// Cambia questa porta con quella corretta del tuo backend .NET
const BASE_URL = "https://localhost:7024"; 

function init() {
    // Configura Chart.js per usare testi chiari adatti allo sfondo scuro
    Chart.defaults.color = '#94a3b8'; 
    Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.1)'; 

    const data = {
        labels: [],
        datasets: [
            {
                label: 'Potenza Attiva (kW)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgb(255, 99, 132)',
                data: [],
                yAxisID: 'y', 
            },
            {
                label: 'Velocità Vento (m/s)',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgb(54, 162, 235)',
                data: [],
                yAxisID: 'y1', 
            }
        ]
    };

    const config = {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: {
                        drawOnChartArea: false, 
                    },
                },
            }
        }
    };

    oggettoGrafico = new Chart(
        document.getElementById('myChart'),
        config
    );
}

// Funzione modificata: rimosso Promise.all, inserite fetch separate
async function caricaDatiSirius() {
    try {
        // 1. Prima fetch: Dati della turbina
        const resTurbina = await fetch(`${BASE_URL}/active-power-data`);
        const datiTurbina = await resTurbina.json();

        // 2. Seconda fetch: Dati del vento
        const resVento = await fetch(`${BASE_URL}/windspeed-data`);
        const datiVento = await resVento.json();

        // Una volta ottenuti entrambi i risultati, aggiorna il grafico
        aggiornaGrafico(datiTurbina, datiVento);

    } catch (error) {
        console.error("Errore nel recupero dei dati dalle API:", error);
        alert("Impossibile recuperare i dati dal server.");
    }
}

function aggiornaGrafico(datiTurbina, datiVento) {
    // 1. Estraiamo le date formattate per l'asse X
    const labels = datiTurbina.map(item => {
        let dataObj = new Date(item.data); 
        return dataObj.toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' });
    });

    // 2. Estraiamo i valori numerici per i due dataset
    const valoriPotenza = datiTurbina.map(item => item.activePower);
    const valoriVento = datiVento.map(item => item.windspeed);

    // 3. Aggiorniamo l'oggetto Chart.js
    oggettoGrafico.data.labels = labels;
    oggettoGrafico.data.datasets[0].data = valoriPotenza;
    oggettoGrafico.data.datasets[1].data = valoriVento;

    // 4. Renderizziamo i cambiamenti
    oggettoGrafico.update();
}