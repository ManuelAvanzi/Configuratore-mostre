# Archivio locale

In assenza della configurazione Supabase, su localhost l'app usa l'account locale
`redazione`. L'installazione corrente conserva la password come hash scrypt in
`.local-data/account.json`, escluso da Git e dall'accesso HTTP di Vite.

I progetti completi, compresi i contenuti incorporati, vengono salvati in
`.local-data/projects/`. Conservare una copia di tutta `.local-data` per il backup:
la cartella non fa parte della build e non va pubblicata. Il limite per progetto
è 150 MB. Riavviare il server non elimina progetti o credenziali; richiede un nuovo
accesso perché le sessioni rimangono solo in memoria.

L'API è disponibile con `npm run dev` e `npm run preview`, solo tramite un host
loopback. Una pubblicazione statica di `dist` non include questo archivio. Per un
archivio condiviso online resta disponibile l'integrazione Supabase esistente.

Verifica dell'installazione corrente: `node tests/local-account.mjs`.
Il test crea e rimuove soltanto un proprio progetto di prova.
