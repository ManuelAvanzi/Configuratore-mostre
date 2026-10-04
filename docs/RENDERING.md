# Rendering e movimento

Lo studio usa AgX per preservare le alte luci, GTAO per le ombre di contatto su desktop e un render target HDR con MSAA a 4 campioni. Su schermi piccoli e in WebXR usa il rendering diretto; il postprocessing non è una simulazione di illuminazione globale o ray tracing.

Gli arredi hanno bordi smussati, la scultura usa più segmenti e un materiale metallico, le opere usano filtraggio anisotropico. Le normal map sono meno accentuate. Le ombre dei fari hanno mappe 2048 px, con riuso dei risultati finché geometrie, modelli o visibilità non cambiano. Massimo quattro fari con ombre.

La landing mantiene tre scene a tutto schermo. Su desktop riproduce filmati WebM di otto secondi registrati dal renderer reale, caricando solo la scena necessaria. Il pulsante pausa ferma i filmati; il cambio scheda e l'uscita dalla sezione li sospendono. Riduci movimento mostra le fotografie statiche. Su mobile le fotografie verticali hanno un lieve movimento di scala, senza scaricare video.

Rigenerazione: `scripts/photograph-hero.mjs` e `scripts/record-hero-motion.mjs`. Verifica browser: `scripts/verify-render-motion.mjs`. La qualità delle miniature umane dipende dai GLB originali; non sono stati sostituiti. Non è ancora una resa fotorealistica.

Le riprese `hero-*-forward.webm` seguono un percorso monotono di otto secondi, senza ritorno e senza loop del singolo video. Il passaggio alla scena successiva dipende dall’evento ended. Su mobile lo zoom avanza una volta e mantiene il fotogramma finale fino al cambio. Verifica: `scripts/verify-forward-motion.mjs`.
