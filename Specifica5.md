### Wind Turbin Stats - Classe 5°

#### Coordinate impianto: [41.03001111,15.59496667]

#### Tecnologie
- BackEnd: ASP.NET Core
- FrontEnd: NUXT4 con PrimeVue or VanillaJS
- Open Meteo API - Dati meteorologici in tempo reale - https://open-meteo.com/
- Database: SqlServer Developer Edition

#### Required Feature (Task 1 - Obbligatorio)

**Obiettivo:** Visualizzare il comportamento della turbina confrontando produzione reale e velocità del vento.

**Dati della turbina**
- Salvare su DB: File CSV fornito con dati di produzione della turbina eolica active power (kW) con timestamp (Unix time milliseconds)

**Recuperare i dati meteorologici** 
*NOTA*: Usare HttpClient per contattire API o usare https://github.com/colinnuk/open-meteo-dotnet-client-sdk
- Utilizzare Open Meteo API per ottenere la velocità media del vento per ciascun giorno
- Salvare i dati su Database in un altra tabella, collegata tramite data/time alla tabella della turbina

**Elaborare e graficare i dati**
- Leggere i dati, precentemente salvati su DB, di active power della turbina e velocità del vento
- Generare un grafico che mostri:
  - Power reale della turbina nel tempo (linea o scatter plot)
  - Velocità del vento nello stesso periodo
  - Facoltativamente: linea della power curve per confrontare produzione teorica e reale
- Sincronizzare dati storici turbina con dati meteorologici per lo stesso periodo

**Analisi qualitativa**
- Commentare eventuali scostamenti tra potenza prevista dalla power curve e potenza reale
- Identificare anomalie (es. giornate con vento intenso ma bassa produzione possono indicare manutenzione o guasti)
- Documentare correlazioni tra velocità del vento e output di potenza

#### Optional Feature (Task 2 - Facoltativo)

**Obiettivo:** Calcolare l'efficienza della turbina mediante interpolazione lineare della power curve.

**Metodo di calcolo**
- Stimare la potenza teorica giornaliera utilizzando la power curve e la velocità media del vento
- Se la velocità del vento non corrisponde esattamente ai valori della power curve, usare **interpolazione lineare** tra i punti adiacenti

**Formula di interpolazione lineare**
Dati due punti della power curve: $(v_1, P_1)$ e $(v_2, P_2)$, con $v_1 < v < v_2$:

$$P(v) = P_1 + \frac{(v - v_1)(P_2 - P_1)}{v_2 - v_1}$$

**Esempio numerico**
Power curve:
- 7 m/s → 688,33 kW
- 7,5 m/s → 845,33 kW

Vento misurato: 7,2 m/s

Calcolo:
$$P(7.2) = 688,33 + \frac{(7,2 - 7)(845,33 - 688,33)}{7,5 - 7} = 688,33 + \frac{157}{5} = 688,33 + 62,67 = 751 \text{ kW}$$

**Confronto efficienza**
- Comparare produzione reale con quella teorica stimata:

$$\text{Efficienza} = \frac{\text{Potenza Reale Giornaliera}}{\text{Potenza Teorica Giornaliera}} \times 100\%$$

- Visualizzare graficamente l'efficienza giornaliera o settimanale
- Identificare trend temporali e possibili degrado delle prestazioni