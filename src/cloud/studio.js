import {cloud, cloudEnabled, currentUser, message} from './client.js';
import {loadProject, saveProject} from './projects.js';
import {validate} from '../model.js';

export function mountCloud({getProject, saveLocal, replaceProject, readDraft, cacheCloud, notify}) {
  let binding = null, savedRevision = -1, changes = 0, busy = false, locked = false, cloudProjectLocalId = null;
  const button = document.createElement('button');
  button.id = 'cloud-save'; button.textContent = 'Salva nel mio account';
  button.title = 'Conserva il progetto e i contenuti nel tuo account';
  document.querySelector('.top-actions').prepend(button);
  const link = document.createElement('a');
  link.href = '/account'; link.textContent = 'I miei progetti ↗'; link.className = 'account-projects-link';
  document.querySelector('.app-footer').append(link);
  const status = document.createElement('span'); status.id = 'cloud-state'; status.setAttribute('role','status');
  document.querySelector('.project-heading').append(status);
  const dialog = document.createElement('dialog'); dialog.id = 'cloud-dialog'; dialog.setAttribute('aria-label','Salvataggio nell’account'); document.body.append(dialog);
  const close = () => {if (!busy && !locked) dialog.close();};
  function show(html) {
    dialog.innerHTML = `<button class="close-modal" id="close-cloud" aria-label="Chiudi">×</button>${html}`;
    dialog.querySelector('#close-cloud').onclick = close;
    if (!dialog.open) dialog.showModal();
  }
  dialog.addEventListener('cancel', event => {if (busy || locked) event.preventDefault();});
  async function save(asCopy = false) {
    if (busy) return;
    busy = true; button.disabled = true;
    const snapshot = structuredClone(getProject()), revision = changes;
    const target = !asCopy && cloudProjectLocalId === snapshot.id ? binding : null;
    dialog.querySelectorAll('button').forEach(b => b.disabled = true);
    const progress = text => {status.textContent = text;};
    try {
      await saveLocal();
      const result = await saveProject(snapshot, target, progress);
      // A save belongs to the snapshot that started it, never to a newly opened project.
      if (getProject().id === snapshot.id) {
        binding = result; cloudProjectLocalId = snapshot.id; savedRevision = revision;
        status.textContent = changes === revision ? 'Salvato nell’account ✓' : 'Modifiche da salvare nell’account';
        await cacheCloud(`cloud:${binding.owner}:${binding.id}`);
        window.history.replaceState({}, '', `/studio?project=${encodeURIComponent(binding.id)}`);
      }
      dialog.close(); notify('Progetto e contenuti salvati nel tuo account.');
    } catch (error) {
      status.textContent = 'Salvataggio nell’account non riuscito';
      dialog.querySelector('#cloud-feedback').textContent = message(error);
    } finally {
      busy = false; button.disabled = false; dialog.querySelectorAll('button').forEach(b => b.disabled = false);
    }
  }
  button.onclick = async () => {
    if (!cloudEnabled) {
      show('<span class="eyebrow">IL TUO ARCHIVIO PERSONALE</span><h2>Salva le tue mostre nell’account.</h2><p>Gli account devono ancora essere attivati. Per ora il progetto è conservato sul dispositivo: usa Esporta per avere una copia completa.</p><a class="cloud-link" href="/account">Scopri l’area personale ↗</a>'); return;
    }
    button.disabled = true;
    try {
      const user = await currentUser();
      if (!user) {
        show('<h2>Accedi per salvare nell’account</h2><p>Prima di accedere, conserveremo il progetto su questo dispositivo. Dopo l’accesso potrai riprenderlo e salvarlo nel tuo archivio.</p><button class="primary" id="cloud-login">Accedi o registrati →</button><p id="cloud-feedback" role="status"></p>');
        dialog.querySelector('#cloud-login').onclick = async () => {
          try {await saveLocal(); location.assign('/account');} catch (error) {dialog.querySelector('#cloud-feedback').textContent = error.message;}
        }; return;
      }
      show(`<span class="eyebrow">ARCHIVIO PRIVATO</span><h2>${binding ? 'Salva le modifiche' : 'Aggiungi ai miei progetti'}</h2><p>Salva nel mio account l’allestimento con immagini, planimetrie, video e modelli caricati. Il salvataggio sul dispositivo resta automatico; quello nell’account avviene con questo pulsante.</p><div class="cloud-buttons"><button class="primary" id="confirm-cloud">${binding ? 'Salva modifiche' : 'Salva nel mio account'}</button>${binding ? '<button id="copy-cloud">Salva come nuovo progetto</button>' : ''}</div><p id="cloud-feedback" role="status"></p>`);
      dialog.querySelector('#confirm-cloud').onclick = () => save();
      dialog.querySelector('#copy-cloud')?.addEventListener('click', () => save(true));
    } catch (error) {notify(message(error));}
    finally {button.disabled = false;}
  };
  link.onclick = async event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (busy) {notify('Attendi il completamento del salvataggio nell’account.'); return;}
    try {await saveLocal(); location.assign('/account');} catch (error) {notify(error.message);}
  };
  cloud?.auth.onAuthStateChange((event, session) => {
    if (binding && session?.user.id !== binding.owner && (event === 'SIGNED_OUT' || event === 'SIGNED_IN')) {
      status.textContent = 'Accedi con il proprietario per salvare nell’account';
    }
  });
  window.addEventListener('beforeunload', event => {
    if (busy || binding && changes !== savedRevision) {event.preventDefault(); event.returnValue = '';}
  });
  return {
    draftState() {return binding ? {id:binding.id,owner:binding.owner,revision:binding.revision,dirty:changes !== savedRevision} : null;},
    changed() {
      changes++;
      if (binding && getProject().id !== cloudProjectLocalId) {binding = null; status.textContent = '';}
      else if (binding) status.textContent = 'Modifiche da salvare nell’account';
    },
    detach() {binding = null; cloudProjectLocalId = null; savedRevision = -1; status.textContent = '';},
    async open(id) {
      button.disabled = true; busy = true; locked = true;
      show('<h2>Apertura del progetto…</h2><p>Recupero dell’allestimento e dei contenuti privati.</p>');
      dialog.querySelector('#close-cloud').hidden = true;
      try {
        if (!cloudEnabled) throw Error('Spazio: Il servizio nell’account deve ancora essere attivato.');
        const loaded = await loadProject(id);
        const key = `cloud:${loaded.owner}:${loaded.id}`;
        const draft = await readDraft(key);
        if (draft?.cloud?.dirty && draft.cloud.owner === loaded.owner && draft.cloud.id === loaded.id) {
          busy = false;
          show('<h2>Hai modifiche su questo dispositivo</h2><p>Questa copia contiene modifiche non ancora salvate nell’account. Puoi recuperarle oppure aprire la versione nell’account. Se il progetto nell’account è cambiato, potrai salvare la bozza come nuovo progetto.</p><div class="cloud-buttons"><button class="primary" id="restore-draft">Recupera modifiche locali</button><button id="use-online">Apri versione nell’account</button></div>');
          dialog.querySelector('#close-cloud').hidden = true;
          const restore = await new Promise(resolve => {
            dialog.querySelector('#restore-draft').onclick = () => resolve(true);
            dialog.querySelector('#use-online').onclick = () => resolve(false);
          });
          if (restore) {loaded.project = validate(draft.project); loaded.revision = draft.cloud.revision;}
          replaceProject(loaded.project, key);
          binding = loaded; cloudProjectLocalId = loaded.project.id; savedRevision = restore ? -1 : changes;
          status.textContent = restore ? 'Modifiche recuperate · da salvare nell’account' : 'Versione nell’account aperta';
          locked = false; dialog.close(); await cacheCloud(key); return;
        }
        replaceProject(loaded.project, key);
        binding = loaded; cloudProjectLocalId = loaded.project.id; savedRevision = changes;
        status.textContent = 'Versione nell’account aperta'; locked = false; dialog.close();
      } catch (error) {
        // Keep the editor covered after a failed open, so its demo cannot be mistaken for the user's project.
        show('<h2>Progetto non aperto</h2><p id="cloud-feedback" role="alert"></p><a class="cloud-link" href="/account">Torna ai miei progetti →</a>');
        dialog.querySelector('#cloud-feedback').textContent = message(error);
        dialog.querySelector('#close-cloud').hidden = true;
        dialog.addEventListener('cancel', event => event.preventDefault(), {once:true});
      } finally {busy = false; button.disabled = false;}
    },
  };
}
