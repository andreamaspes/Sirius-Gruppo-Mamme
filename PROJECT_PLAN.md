# PROJECT PLAN - Sirius

## 2. MVP (Minimal Viable Product)

Il prodotto minimo funzionante includerà:
- Visualizzazione dati da database
- Grafici per visualizzazione dati
  -potenza reale turbina
  -velocità vento
- Comunicazione tra frontend e backend 

Obiettivo:
Realizzare una versione che visualizzi tramite grafici i dati presi dal database

---

## 3.Stack Tecnologico

### Backend
Data e Database
   - Import csv
   - Modellazione db
   - Query dati
API e Meteo
   - Integrazione open meteo API
   - Endpoint rest
   - Logica sicronizzazione dati

### Frontend
UI E Grafici
  - Grafici (primevue)
  - Visualizzazione dati
Integrazione API
  - Fetch dati dal backend
  - Gestione stato
  - Eventuali filtri (date range)

### API Esterne
7. Open Meteo API -> dati meteo (vento medio giornaliero)

---

### 4. WBS
1. Analisi
   - studio requisiti
   - definizione struttura dati
   - definizione architettura
---
2. Backend
   - setup progetto ASP.NET Core
   - creazione database
   - import CSV
   - integrazione API REST
   - sincronizazione dati temporali
---
3. Frontend Development
   - setup nuxt 4
   - configurazione PrimeVue
   - creazione layout base
   - fetch dati da API
   - implementazione grafico
   - test visualizzazioni 
---
4. Testing
   - test backend API
   - test integrazione frontend-backend
   - verifica corretta dati 
---
5. Analisi dati
   - confronto vento con potenza
   - identificazione anomalie
   - commento risultati
---
6. Efficienza
   - implementazione interpolazione lineare
   - calcolo potenza teorica
   - calcolo efficienza
   - calcolo risultati 
    
---

## 4. GANTT

| Attività                | Durata | Periodo     |
|------------------------|--------|------------|
| Setup progetto         | 1 SETT. | SETT. 1   |
| Backend base           | 2 SETT. | SETT. 2-3 |
| Frontend base          | 2 SETT. | SETT. 4-5 |
| Integrazione           | 2 SETT. | SETT. 6-7 |
| Testing e debug        | 1 SETT. | SETT. 8   |
| Rifinitura finale      | 1 SETT. | SETT. 9   |

![Gantt](https://github.com/andreamaspes/Sirius-Gruppo-Mamme/blob/22845ea59331ad2c95f1d152854f0cfc5969b0e1/immagine.png)

![GanttEXEL](https://github.com/andreamaspes/Sirius-Gruppo-Mamme/blob/main/GANTEXEL.png)

