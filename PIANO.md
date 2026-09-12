# Spazio — piano di prodotto

Applicazione autonoma locale per progettare mostre. Ogni unità della scena equivale a un metro. Flusso: crea spazio, allestisci, visita.

## Fondamenta
- Modello JSON versionato: pareti a segmenti, aperture collegate alle pareti, oggetti con dimensioni e trasformazioni in metri.
- Editor 2D con griglia, snap, disegno pareti, selezione e misure; riferimento immagine calibrabile tramite larghezza reale.
- Scena Three.js derivata dai dati; nessuna dipendenza da MetaReality.
- Stato locale con IndexedDB, annulla/ripristina e file progetto portabile.

## Flusso completo
- Ingresso con nuovo spazio, planimetria e mostra dimostrativa.
- Allestimento con catalogo, immagini, video e modelli GLB; proprietà numeriche e trascinamento.
- Visita a quota occhio, comandi tastiera e touch, controlli VR e AR WebXR con rilevamento supporto.
- Output: progetto JSON, elenco CSV, planimetria SVG, scheda di allestimento stampabile, screenshot.

## Confini e sviluppi successivi
- Nessun servizio cloud o account; i progetti restano nel browser e nei file esportati.
- Riferimenti raster ricostruiti manualmente, non riconoscimento automatico CAD/PDF.
- Architettura a pareti rettilinee, pavimento rettangolare; nessuna certificazione CAD/BIM o verifica normativa.
- VR e AR richiedono HTTPS o localhost e hardware/browser compatibile. Validazione hardware separata da quella desktop.
- Evoluzioni: planimetrie poligonali/multilivello, viste ortogonali di tutte le pareti, collaborazione, gestione museale avanzata, esportazione USDZ.

## Verifica
Build di produzione, test della geometria e convalida progetti, prova browser del flusso completo e controllo visivo desktop/mobile.
