
# SiriusBackend - Guida semplice

**A cosa serve**
Questo backend .NET 9(sersione dotnet,ovvero il framework) importa dati da due CSV, li salva su SQL Server LocalDB e li espone via API(è un insieme di regole e strumenti che permettono a due programmi diversi di comunicare tra loro.) in JSON.

**Come funziona in breve**
- Legge due file CSV in [SiriusBackend/Dati/Dati.csv](SiriusBackend/Dati/Dati.csv) e [SiriusBackend/Dati/DATI_Vento.csv](SiriusBackend/Dati/DATI_Vento.csv).
- All avvio, importa i CSV nel database usando CsvHelper (delimitatore `;`) in [SiriusBackend/Program.cs](SiriusBackend/Program.cs).
- Le colonne sono mappate in [SiriusBackend/Models/EnergiaRecord.cs](SiriusBackend/Models/EnergiaRecord.cs) e [SiriusBackend/Models/VentoRecord.cs](SiriusBackend/Models/VentoRecord.cs).
- Le API leggono i dati dal DB tramite le DAL in [SiriusBackend/TurbinaDAL.cs](SiriusBackend/TurbinaDAL.cs) e [SiriusBackend/VentoDAL.cs](SiriusBackend/VentoDAL.cs).
- Le risposte sono JSON da [SiriusBackend/Program.cs](SiriusBackend/Program.cs).

**API disponibili**
- `GET /` risponde con un messaggio di stato(se il programma funziona o meno).
- `GET /active-power-data` ritorna `{ data, activePower }`.
- `GET /windspeed-data` ritorna `{ data, windspeed }`.

**Database**
- Provider: SQL Server LocalDB.
- Connection string: [SiriusBackend/appsettings.json](SiriusBackend/appsettings.json).
- Tabelle create da migrazione: Energia (Id, Data, ActivePower) e Vento (Id, Data, Windspeed) in [SiriusBackend/Migrations/20260430210232_InitialCreate.cs](SiriusBackend/Migrations/20260430210232_InitialCreate.cs).

**Avvio locale**
- Profili di avvio in [SiriusBackend/Properties/launchSettings.json](SiriusBackend/Properties/launchSettings.json).
- URL: `http://localhost:5121` e `https://localhost:7024`.


