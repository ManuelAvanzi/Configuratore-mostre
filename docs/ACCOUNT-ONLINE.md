# Account e progetti online

## Stato

L'integrazione è implementata ma non collegata a un progetto Supabase reale. Senza configurazione l'app mostra “Area online in preparazione”, non raccoglie credenziali e continua a funzionare in locale.

Sono disponibili: registrazione email/password, conferma email, accesso, recupero password, uscita dalla sessione corrente, pagina I miei progetti con ricerca, salvataggio online esplicito, riapertura e salvataggio come nuovo progetto. Immagini, planimetrie, video e GLB dei progetti sono inclusi. I modelli e materiali del catalogo restano asset comuni dell'app, senza duplicarli per utente.

## Attivazione a cura del proprietario

Scelta concordata: partire dal piano **Free**, senza attivare abbonamenti o componenti a pagamento. Al 19 settembre 2026 include 500 MB di database e 1 GB di file per progetto Supabase (condivisi da tutti gli utenti dell'app), 5 GB di traffico in uscita e sospensione dopo una settimana di inattività. È adatto al primo collaudo con pochi utenti; video e GLB possono riempire lo spazio rapidamente. Il Pro parte da 25 USD/mese e va valutato separatamente prima di qualsiasi upgrade. Fonte: https://supabase.com/pricing. SMTP, hosting e dominio vanno valutati a parte: il piano gratuito del database non rende automaticamente gratuita tutta la pubblicazione.

1. Creare un progetto su https://supabase.com/dashboard sotto il proprio account. Scegliere la regione e verificare limiti/costi del piano prima dell'attivazione.
2. Eseguire **una volta** nel SQL Editor il file `supabase/migrations/202609190001_projects.sql`. Crea tabella, funzione atomica e bucket privato con le relative policy. Non rendere pubblico il bucket.
3. Copiare `.env.example` in `.env.local` e impostare `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` dalle impostazioni API del progetto. Si può usare anche la chiave pubblica legacy `anon` in questa seconda variabile. **Mai** usare `service_role`, `sb_secret_...`, password del database o chiavi amministrative nel browser.
4. In Authentication → Providers abilitare Email e mantenere attiva la conferma email. Impostare password minima di 12 caratteri anche sul server.
5. In Authentication → URL Configuration impostare l'URL del sito e aggiungere esattamente gli URL di ritorno necessari: `http://localhost:5173/account`, `http://localhost:5173/account?mode=recovery`, e gli equivalenti HTTPS del dominio di produzione. Per usare anche AVVIA.cmd aggiungere gli equivalenti su porta 4173. Non usare wildcard aperte in produzione.
6. Configurare il mittente SMTP per l'uso con utenti reali: il servizio email predefinito Supabase ha limitazioni e non è una configurazione di produzione. Verificare consegna di conferme e recuperi con indirizzi reali.
7. Riavviare Vite dopo la configurazione. La build incorpora le variabili: per aggiornare il server autonomo eseguire nuovamente `npm run build`. L'hosting deve servire `index.html` per `/`, `/studio` e `/account`; `server.mjs` lo fa già.
8. Prima di aprire il servizio agli utenti, eseguire la verifica reale descritta sotto e pubblicare l'informativa sul trattamento dei dati relativa alla configurazione scelta.

## Salvataggio e recupero

- Il salvataggio **locale** è automatico. “Salva online” è un'operazione esplicita: lo stato online è mostrato separatamente dallo stato locale, così un errore di rete non viene presentato come un salvataggio cloud riuscito.
- Alla prima conferma viene creato un progetto online. I successivi salvataggi aggiornano quel progetto. “Salva come nuovo progetto” crea una copia indipendente. Il nome si cambia nello studio, poi si salva online.
- Il database conserva la struttura; i contenuti sono in Storage, con percorsi `user-id/sha256`. I file sono immutabili e riutilizzati tra progetti dello stesso utente. Gli upload devono terminare prima della scrittura del documento.
- Limiti applicativi: 30 MiB per asset, 150 MiB complessivi per progetto (contando anche riferimenti duplicati), 2 MiB per la struttura JSON. Lo Storage applica anche il limite server per file. Il progetto Supabase può avere limiti più restrittivi. I file grandi utilizzano upload standard: in caso di interruzione occorre riprovare, non c'è ripresa parziale TUS.
- Ogni aggiornamento passa dalla funzione `save_project`, che verifica proprietario e revisione in modo atomico. Una modifica proveniente da una versione precedente viene respinta. Si può riaprire la versione corrente oppure salvare una nuova copia. Non è collaborazione in tempo reale.
- Le bozze dei progetti online sono conservate in IndexedDB con chiave distinta per account/progetto. Alla riapertura online, se esiste una bozza non sincronizzata, si può recuperarla. Il recupero richiede accesso e connessione per leggere la revisione online; per conservare una copia indipendente e aprirla offline usare Esporta JSON.
- Le copie locali restano dati del browser sul dispositivo: uscire dall'account non cancella automaticamente i progetti già scaricati o creati localmente. Su un computer condiviso usare profili browser separati o cancellare i dati dopo aver salvato/esportato.
- In questa prima versione i contenuti appartengono ai progetti. Non è ancora presente una mediateca autonoma per organizzare file, la cancellazione dei progetti/account dall'interfaccia o uno storico versioni navigabile.
- File caricati prima di un salvataggio fallito e file sostituiti possono restare nel bucket. Non eliminarli dal client: possono essere condivisi tra più progetti. Prima di un rilascio esteso aggiungere una pulizia amministrativa basata sui riferimenti effettivi, limiti di spazio per utente e le procedure di cancellazione/esportazione dell'account. La cancellazione SQL di un utente rimuove i progetti, **non** i suoi oggetti Storage: questi vanno rimossi con l'API Storage amministrativa.

## Verifiche

`npm test` comprende round-trip dei contenuti, rifiuto di percorsi esterni, file troppo grandi, esecuzione della migrazione in PostgreSQL incorporato (PGlite), isolamento fra due ruoli autenticati, negazione degli accessi anonimi, scritture dirette vietate e conflitti di revisione.

`npm run test:account` avvia due server di test sulle porte 5183/5184 e usa Chrome installato. Verifica interfaccia non configurata, registrazione, errori di accesso, recupero password, archivio, file allegati, errori di upload, riapertura, recupero bozza, conflitto/copia, isolamento fra sessioni, logout e responsive. Le risposte HTTP Supabase sono **simulate**; questi test non verificano un'istanza remota né inviano email. I server di test vengono chiusi alla fine e le variabili simulate non sono scritte in `.env`.

Verifica reale dopo l'attivazione: creare due account confermati da email diverse; salvare con A un progetto con immagine, video e GLB; aprirlo da un altro browser; verificare che B non lo legga né ne scarichi i file; provare due schede con revisioni divergenti, interruzione di rete, logout e recupero password tramite email. Non considerare attivo il servizio prima di questa verifica.

Riferimenti: [Auth](https://supabase.com/docs/guides/auth), [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security), [Storage privato](https://supabase.com/docs/guides/storage/buckets/fundamentals), [SMTP](https://supabase.com/docs/guides/auth/auth-smtp).
