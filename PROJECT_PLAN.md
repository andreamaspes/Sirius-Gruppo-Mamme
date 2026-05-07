# PROJECT PLAN - Sirius

## Stack Tecnologico

### Backend
  - ASP.NET Core (C#) -> API REST
  - HttpClient -> chiamate a Open Meteo API
  - SQL -> database relazionale

### Frontend
  - Nuxt 4 -> framework principale
  - Vanilla JS

### API Esterne 
  - Open Meteo API -> dati meteo (vento medio giornaliero)
    
## MVP (Minimal Viable Product)

- Implementazione Dati Turbina (CSV)
- Integrazione Dati su Database
- Integrazione Dati Meteo (vento)
- Integrazione Dati (tempo)
- Visualizzazione Grafico

### Output MVP
   - Grafico con -> Potenza reale turbina, Velocità vento
   - Dati coerenti all'intervallo temporale

---
## WBS
#### 1. Analisi
   - Studio requisiti
   - Definizione struttura dati
   - Definizione architettura
---
#### 2. Backend
   - Setup progetto ASP.NET Core
   - Creazione database
   - Import CSV
   - Integrazione API REST
   - Sincronizazione dati temporali
---
#### 3. Frontend Development
   - Setup nuxt 4
   - Configurazione VanillaJS
   - Creazione layout base
   - Fetch dati da API
   - Implementazione grafico
   - Test visualizzazioni 
---
#### 4. Testing
   - Test backend API
   - Test integrazione frontend-backend
   - Verifica corretta dati 
---
#### 5. Analisi dati
   - Confronto vento con potenza
   - Identificazione anomalie
   - Commento risultati
---
#### 6. Efficienza
   - Implementazione interpolazione lineare
   - Calcolo potenza teorica
   - Calcolo efficienza
   - Calcolo risultati 

## Suddivisione Del Team (3 Persone)
#### Backend (Garberoglio, Dell'uomo)
- **Garberoglio: Database**
    - Import CSV
    - Modellazione DB
    - Query dati
      
- **Dell'uomo: API & Meteo**
    -Integrazione Open Meteo API
    -Logica sincronizzazione dati
  
#### Frontend (Maspes, Dell'uomo)
- **Maspes: Grafici**
    -Grafici (VanillaJS)
    -Visualizzazione dati
  
  - **Dell'Uomo: Integrazione API** 
    -Fetch dati del backend
    -Gestione stato  
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

![GanttEXEL](https://github.com/andreamaspes/Sirius-Gruppo-Mamme/blob/main/GANTEXEL.png)

