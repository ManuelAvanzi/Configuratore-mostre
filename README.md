# Spazio — Studio espositivo

Applicazione web autonoma e locale per creare uno spazio, allestire una mostra e visitarla in scala reale. Codice, dipendenze, caratteri, documentazione e build sono contenuti in questa cartella. Nessun progetto preesistente è stato modificato; la cartella codex non conteneva MetaReality.

## Installazione dalla repository

Richiede Node.js 20 o successivo e npm.

```sh
git clone https://github.com/ManuelAvanzi/Configuratore-mostre.git
cd Configuratore-mostre
npm ci
npm run dev
```

Apri l'indirizzo localhost mostrato dal terminale. Per l'avvio autonomo con `AVVIA.cmd`, esegui prima `npm run build`. Verifica del modello: `npm test`; verifica completa dell'editor con server attivo su porta 5173 e Chrome installato: `node tests/precision.mjs`.

La repository include i sei GLB ottimizzati usati dall'app. Le copie originali in `assets/people/originals`, le dipendenze installate, la build e gli esiti dei test restano locali. Per rieseguire `scripts/prepare-people.mjs` occorre ripristinare gli originali descritti in `assets/people/PROVENIENZA.md`; non servono per compilare o usare l'app.

## Homepage e accesso

La pagina `/` presenta il prodotto, il flusso, gli impieghi e le domande frequenti. Lo studio è su `/studio`. Il pulsante Accedi apre l’accesso locale: gli account online e la registrazione non sono attivi e non vengono richieste credenziali.

Il logo Spazio nell’editor riporta alla homepage dopo avere completato eventuali salvataggi in corso. La sezione **Il tuo prossimo spazio, inizia qui** è parte della landing: consente di creare uno spazio, partire da una planimetria, esplorare la demo, aprire un file progetto o riprendere l’ultimo progetto personale. Il nome del progetto salvato compare nel relativo pulsante. Un file non valido viene rifiutato senza sostituire il salvataggio.

“Crea una mostra” apre direttamente la configurazione iniziale. I collegamenti alla demo e alla visita dalla homepage aprono un progetto dimostrativo con salvataggio separato: le sue modifiche non sostituiscono il progetto personale. Per conservarle altrove, esporta il file progetto. La homepage carica il motore 3D soltanto dopo l’ingresso nello studio.

## Avvio sul PC

Apri **AVVIA.cmd** con doppio clic. Richiede Node.js (già presente sul PC). La versione compilata si apre su http://localhost:4173. Lascia aperta la finestra di avvio; chiudila per fermare il server. Non occorre una connessione Internet dopo l’installazione.

Per lo sviluppo: `npm run dev`. Per aggiornare la versione avviata da AVVIA.cmd: `npm run build`.

## Flusso

1. **Crea spazio**: scegli le dimensioni iniziali o importa una planimetria JPG, PNG o WebP. La larghezza del riferimento corrisponde all’intera immagine, inclusi eventuali margini; ritagliala prima se necessario. Il ricalco è manuale. Una unità equivale a un metro.
2. **Pianta 2D**: aggiungi pareti con due tocchi o usa “Aggiungi parete con misure” e imposta estremi e lunghezza. Inserisci porte, finestre e aperture toccando una parete, poi regola larghezza, altezza, distanza dall’inizio e quota. Le aperture sovrapposte o fuori parete sono rifiutate. Modificare larghezza e profondità sposta gli estremi delle pareti sul perimetro; gli elementi e i punti interni mantengono le coordinate. Le modifiche che rendono invalide le aperture vengono annullate.
3. **Allestisci**: aggiungi opere, sculture parametriche, pannelli, teche, piedistalli, pareti temporanee, strutture, monitor, sedute, desk, segnaletica, luci e volumi scenografici. Seleziona un elemento per regolare misure, posizione e rotazione. Le frecce 3D consentono il trascinamento; le quote numeriche consentono la precisione.
4. **Contenuti**: carica immagini locali, video MP4/WebM nei monitor e modelli GLB con risorse incorporate. Massimo 30 MB per asset. I modelli sono ridimensionati secondo L × H × P; conserva i rapporti delle misure per evitare deformazioni. Le immagini occupano l’intera superficie: imposta il rapporto corretto dell’opera. I video sono silenziosi e si riproducono in visita.
5. **Visita**: W A S D per camminare, trascinamento per guardarsi attorno, frecce laterali per ruotare. Pulsanti touch disponibili. Quota occhio 1,65 m. Collisioni semplificate con pareti e ingombri degli oggetti. Esc torna all’editor.
6. **Esporta**: file progetto JSON con asset incorporati, pianta SVG con quote, elenco CSV, screenshot PNG, scheda HTML da aprire e stampare in PDF. Salva file con nomi diversi per conservare versioni alternative.

### Precisione e revisione

- **Misura** in pianta: indica due punti per salvare una quota. Aggancio ai vertici delle pareti e agli angoli degli elementi, oppure alla griglia di 10 cm. Esc interrompe la misura; il pulsante accanto alla quota la elimina. Le quote sono statiche: indicano punti del progetto e non seguono automaticamente gli oggetti spostati. Massimo 200 quote, incluse in JSON, SVG e scheda di allestimento.
- **Spostamento 2D**: trascina un elemento con Seleziona. Alt + trascina, oppure pulsante centrale/destro, sposta la vista. Centra ripristina inquadratura e zoom. Esc annulla un trascinamento; annulla/ripristina comprende gli spostamenti e le quote.
- **Posizionamento 3D**: aggancio selezionabile a 1, 5 o 10 cm, oppure libero. Le opere, i pannelli, i monitor e i cartelli dispongono della quota del centro da terra. Appoggia a terra porta la base a quota zero. La sezione nasconde soltanto le pareti perimetrali davanti alla camera e mantiene visibili le pareti interne.
- **Controlli geometrici**: segnalano elementi fuori dal pavimento, quote fuori ambiente, intersezioni con le parti solide delle pareti e sovrapposizioni tra ingombri orientati. Rispettano porte/finestre e appoggi verticali. Un clic sulla segnalazione seleziona l’elemento; sono mostrate al massimo 100 segnalazioni. I volumi rettangolari sono approssimazioni, soprattutto per sculture e persone: valutare gli accostamenti intenzionali. Non verificano passaggi minimi, accessibilità o conformità normativa.
- La scheda HTML esportata raccoglie pianta, lista elementi, quote e controlli al momento dell’esportazione. Le misure stampate sono arrotondate al centimetro.

### Persone come riferimento di scala

Nella categoria **Persone** trovi i sei GLB forniti dall’utente: Camicia azzurra, Camicia verde, Camicia blu, Blazer grigio, Top menta e Completo beige. Le vecchie miniature procedurali sono state rimosse. Tutti i modelli mantengono posa statica e materiali originali; non è applicata una tinta globale agli abiti e alla pelle.

L’altezza iniziale di 1,75 m è un riferimento di progetto modificabile, non una statura misurata della persona originale. Il parametro **Altezza persona** ridimensiona il modello uniformemente. Si misura l’ingombro verticale della posa, dal punto più basso al più alto; i modelli con gambe piegate o in passo non sono modelli antropometrici. L’ingombro orizzontale viene aggiornato mantenendo i rapporti originali.

Le figure compaiono anche in visita, planimetrie e liste esportate. I file progetto le identificano tramite il catalogo dell’app, senza incorporare nuovamente i GLB. I vecchi identificatori vengono migrati ai nuovi modelli conservando altezza, posizione e rotazione. La vecchia figura bambino viene sostituita da un adulto ridimensionato: il catalogo fornito contiene solo figure adulte.

Gli originali sono in `assets/people/originals`; le copie per il browser in `public/people/models`, con texture a massimo 1024 px e geometria invariata. Il caricamento avviene una sola volta per modello e sessione, condividendo geometrie, materiali e texture tra le copie. `scripts/prepare-people.mjs` riproduce l’ottimizzazione. Provenienza e nomi originali sono in `assets/people/PROVENIENZA.md`.

## Salvataggio

Il progetto corrente è salvato automaticamente in IndexedDB sul dispositivo, per browser e indirizzo. Le anteprime sulle porte 5173 e 4173 hanno salvataggi distinti: usa Esporta / Apri file progetto per trasferirli. Il file `.spazio.json` è la copia portabile. La cancellazione dei dati del browser elimina il salvataggio locale. Non sono presenti account, backend cloud o collaborazione simultanea. Annulla/ripristina mantiene fino a 40 modifiche durante la sessione.

## VR e AR

- **VR**: sessione WebXR immersive-vr, scala 1:1 e locomozione con stick sui controller disponibili. Per avviare, entra in Visita dal browser del visore.
- **AR**: sessione WebXR immersive-ar; il progetto appare come plastico in scala 0,06 (circa 1:16,7), davanti al dispositivo. Non include ancoraggio alla superficie, hit testing o sovrapposizione in scala reale.
- Richiesti HTTPS o localhost, browser e hardware compatibili. Il server di avvio è locale al PC; per un visore o telefono occorre servire la build tramite HTTPS raggiungibile dal dispositivo. Nessuna pubblicazione o configurazione remota è stata effettuata.
- I pulsanti verificano il supporto e mostrano un messaggio quando manca. Safari/iOS e visori non compatibili non ricevono un fallback USDZ. La prova fisica VR/AR resta da fare.
- Riferimenti tecnici: [Three.js WebXR](https://threejs.org/manual/en/webxr-basics.html), [TransformControls](https://threejs.org/docs/pages/TransformControls.html).

## Limiti della prima versione

Pavimento rettangolare, singolo livello, pareti rettilinee senza soffitto. Le pareti possono essere ricomposte liberamente sul pavimento; non vengono riconosciuti automaticamente locali chiusi. Superficie mostrata = area del pavimento rettangolare. Le sculture di catalogo sono volumi dimostrativi: importa un GLB per un’opera specifica. Illuminazione indicativa, non simulazione fotometrica. Mancano CAD/BIM, import PDF/DWG, viste quotate di tutte le pareti e verifiche normative. Il plastico AR non sostituisce un rilievo.

L’app consente la progettazione preliminare e l’attività didattica. Prima della realizzazione fisica verifica in sito le misure e i requisiti del progetto.

## Verifiche

- `npm test`: geometria, misure, validazione dei file, aperture, collisioni.
- `node tests/browser.mjs`: flusso browser su Edge; richiede `npm run dev` sulla porta 5173. Risultati e schermate in `test-results`.
- `npm run build`: build di produzione in `dist`.

Stack: JavaScript modulare, Three.js, Vite, Lucide. Font locali DM Sans e Manrope da Google Fonts, licenza SIL Open Font License. Le licenze di Three.js, Lucide e delle altre dipendenze sono nei rispettivi pacchetti in node_modules.
