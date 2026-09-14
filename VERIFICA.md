# Verifica della prima versione

Data: 11 settembre 2026. Ambiente: Windows, Node 20, browser Microsoft Edge tramite Playwright.

## Esito

- Build Vite di produzione completata. Il bundle 3D genera un avviso di dimensione oltre 500 kB, non bloccante.
- 5 test del modello superati: dimensioni, sottrazione del volume delle aperture, rifiuto sovrapposizioni, convalida importazioni, collisioni.
- Flusso browser superato: demo, aggiunta opera 120 × 80 cm, duplica, elimina, annulla, modifica parete, visita e fallback VR non supportata.
- Esportazione e ripresa del progetto IndexedDB superate. Nessun errore JavaScript rilevato.
- Nuova stanza 20 × 10 m = 200 m², riferimento immagine calibrato, import immagine e reimportazione JSON con asset superati.
- File progetto invalido rifiutato senza sostituire il progetto aperto.
- Download SVG, CSV e scheda HTML superati.
- Visualizzazione a 1440 × 1000 e 390 × 844 verificata; nessun overflow orizzontale su mobile.
- Build servita dal server autonomo su porta 4173: editor e visita funzionanti con ogni richiesta esterna bloccata. Font e risorse sono locali.

## Non verificato fisicamente

- Sessioni VR/AR su hardware reale e locomozione con controller.
- Riproduzione di ogni codec video, modelli GLB complessi e carichi da centinaia di asset.
- API WebMCP in un browser con implementazione nativa: registrazione protetta da rilevamento del supporto.
- Conformità completa WCAG o compatibilità di tutti i browser.

Schermate e risultati riproducibili sono nella cartella test-results. Lo script tests/production.mjs verifica la build senza connessioni esterne; tests/imports.mjs verifica importazioni ed esportazioni.

## Homepage pubblica

`node tests/landing.mjs`: verificati homepage desktop e mobile, dialogo di accesso locale senza credenziali, creazione diretta, demo con salvataggio separato dal progetto personale, visita diretta, menu mobile e FAQ. Nessun errore JavaScript, overflow orizzontale o dipendenza da richieste esterne. Le immagini mostrano il prodotto reale e sono acquisite con `tests/capture-landing.mjs`.

## Persone GLB da Sketchfab

Le tre miniature procedurali sono state sostituite dai sei GLB forniti dall’utente. Verificati visivamente tutti i modelli, materiali e posa. Geometria preservata; texture ridimensionate a massimo 1024 px. Le copie originali sono conservate nel progetto.

I test del modello sono ora 9: comprendono normalizzazione uniforme, appoggio a terra, precisione delle dimensioni, catalogo di sei persone e migrazione dei vecchi identificatori senza perdere altezza e posizione.

`node tests/people-glb.mjs` verifica in Chrome tutti e sei i caricamenti, altezza 1,90 m, duplicazione, eliminazione, esportazione, visita e mobile. Controlla che ciascun GLB sia richiesto una sola volta durante tutte le modifiche e che non vi siano errori JavaScript o risorse mancanti. Schermate in test-results/glb-people-*.png. `SPAZIO_TEST_URL` consente di scegliere la build da verificare.

## Logo e scelte nella landing

`node tests/home-navigation.mjs`: verifica logo editor → homepage senza modale, sezione con entrambe le scelte, salvataggio di una modifica immediatamente prima della navigazione, ripresa diretta, apertura file valido, rifiuto file invalido, percorso planimetria e visualizzazione mobile senza overflow.

## Precisione dello studio — 12 settembre 2026

- `npm test`: 14 test superati. Nuovi casi: ingombri orientati, selezione in pianta, appoggio senza sovrapposizione, vuoti delle porte, limiti del pavimento, ridimensionamento perimetrale senza deformare gli oggetti, quote valide/invalide e relativa esportazione.
- `node tests/precision.mjs`: Chrome desktop 1440 × 1000 e mobile 390 × 844. Quote salvate/riprese, aggancio mantenuto, trascinamento con annulla/ripristina, diagnostica con selezione, appoggio a terra, quota del centro, perimetro, JSON/SVG e assenza di overflow/errori JavaScript.
- `SPAZIO_TEST_URL=http://localhost:5173 node tests/home-navigation.mjs`: flusso logo → landing, modifica salvata immediatamente prima di uscire, ripresa, import valido/invalido e percorso planimetria superati. Il test attende il montaggio dell’editor prima di verificare la chiusura del dialogo asincrono.
- `npm run build`: compilazione completata. Rimane l’avviso dimensione bundle del motore 3D; nessun errore di compilazione.

Schermate: `test-results/studio-professional.png`, `studio-measurements.png`, `studio-mobile.png`. Quote statiche, ingombri rettangolari e controlli non normativi: dettagli nel README.

## Materiali e superfici — 14 settembre 2026

- `npm test`: 17 test superati, inclusi compatibilità dei progetti precedenti, due lati indipendenti, validazione delle finiture e continuità delle coordinate texture in metri attraverso le porzioni delle pareti.
- `node tests/surfaces.mjs`: selezione con clic reale del pavimento e di una parete nel 3D, materiali, colore HEX, finitura, scala/direzione, copia su tutte le pareti, undo/redo, materiale di una seduta, esportazioni JSON/HTML, ripresa e rifiuto di una scala invalida. Verifica desktop e mobile senza overflow ed errori JavaScript.
- `node tests/precision.mjs`: regressione dei flussi quote, trascinamento, annullamento, controlli, ridimensionamento, esportazione e ripresa superata.
- Schermate in `test-results/materials-floor.png`, `materials-wall.png` e `materials-mobile.png`.
- `node tests/people-glb.mjs`: tutti i sei GLB superano caricamento, cache, ridimensionamento, duplicazione, esportazione, visita e mobile anche con il nuovo sistema di materiali.
- `npm run build`: build aggiornata completata; resta l'avviso già presente sulla dimensione del bundle 3D.

Le finiture sono campioni procedurali indicativi. Resa verificata in Chrome; non eseguita una verifica colorimetrica o fotometrica fisica.

## Libreria HD — 14 settembre 2026

La precedente libreria procedurale è sostituita da 20 materiali: 18 set PBR ambientCG CC0 e 2 finiture uniformi. Mappe colore 2K, normali OpenGL e rugosità 1K; anteprime tratte dalle texture reali. Asset locali circa 46,4 MiB, ZIP sorgente esclusi da Git.

`node tests/material-quality.mjs` verifica le dimensioni fisiche dei file con Sharp e carica tutti i 18 set nel browser. Verificati filtro per categoria, cambio dei materiali, applicazione a più pareti e modifica tinta senza ricaricare le mappe dello stesso set, visita e mobile. Nessun errore JavaScript o risorsa mancante. `node tests/surfaces.mjs` verifica anche salvataggio, esportazioni, lati delle pareti e annulla/ripristina con il nuovo catalogo.

La conversione del vecchio parametro del parquet al modulo texture viene verificata come operazione non distruttiva e non cumulativa. Schermate: `test-results/materials-hd-editor.png`, `materials-hd-marble.png`, `materials-hd-visit.png`, `materials-hd-mobile.png`.

Verifica finale: 18 test unitari superati e build completata. L'illuminazione è stata ridotta per preservare il contrasto delle texture; la resa è stata ricontrollata in editor e visita. Rimane l'avviso sulla dimensione del bundle 3D.
