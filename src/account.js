import {producer} from './producer.js';
import './landing.css';
import './account.css';
import {cloud, cloudEnabled, currentUser, message} from './cloud/client.js';
import {listProjects} from './cloud/projects.js';

const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const app = document.querySelector('#app');
const params = new URLSearchParams(location.search);
let mode = params.get('mode') === 'signup' ? 'signup' : params.get('mode') === 'recovery' ? 'recovery' : 'login';
let user;

app.innerHTML = `<header class="account-header"><a class="logo" href="/">⌑ spazio</a><a href="/studio?start=resume">Studio locale ↗</a></header><main id="account-main" class="account-main"><p role="status">Apertura dell’area personale…</p></main><footer class="account-producer">${producer()}</footer>`;
const main = document.querySelector('#account-main');
const notice = text => { document.querySelector('#account-status').textContent = text; };

function authForm() {
  const signup = mode === 'signup', reset = mode === 'reset', recovery = mode === 'recovery';
  main.innerHTML = `<div class="account-auth"><section class="account-story"><span class="eyebrow">IL TUO SPAZIO PERSONALE</span><h1>Le tue mostre.<br/>Sempre con te.</h1><p>Un posto per conservare le idee, ritrovare i tuoi contenuti e riprendere il progetto da un altro dispositivo.</p><div class="account-room" aria-hidden="true"><span></span><span></span><span></span></div><p class="account-caption">Progetti, opere, planimetrie e modelli 3D.<br/>Riuniti nel tuo archivio privato.</p></section><section class="account-form-card"><span class="eyebrow">SPAZIO / ACCOUNT</span><h2>${signup ? 'Crea il tuo account' : reset ? 'Recupera l’accesso' : recovery ? 'Scegli una nuova password' : 'Bentornato.'}</h2><p>${signup ? 'Inizia il tuo archivio di mostre.' : reset ? 'Ti invieremo un link per scegliere una nuova password.' : recovery ? 'Usa almeno 12 caratteri.' : 'Accedi al tuo archivio personale.'}</p>${!cloudEnabled ? `<div class="account-notice"><b>Area online in preparazione</b><p>Il servizio per gli account deve ancora essere attivato. Nel frattempo puoi progettare e salvare sul dispositivo.</p></div><a class="button solid" href="/studio?start=resume">Continua nello studio locale ↗</a>` : `<form id="auth-form">${!recovery ? '<label>Email<input name="email" type="email" autocomplete="email" required maxlength="254" placeholder="nome@esempio.it"></label>' : ''}${!reset ? `<label>${recovery ? 'Nuova password' : 'Password'}<input name="password" type="password" autocomplete="${signup || recovery ? 'new-password' : 'current-password'}" required minlength="${signup || recovery ? 12 : 1}" maxlength="128" ${signup || recovery ? 'placeholder="Almeno 12 caratteri"' : ''}></label>` : ''}<button class="button solid" type="submit">${signup ? 'Registrati' : reset ? 'Invia il link' : recovery ? 'Salva la nuova password' : 'Accedi'} →</button></form><p id="account-status" role="status" aria-live="polite"></p><div class="auth-links">${mode === 'login' ? '<button data-mode="reset">Password dimenticata?</button><button data-mode="signup">Non hai un account? Registrati</button>' : '<button data-mode="login">Torna ad Accedi</button>'}</div>${signup ? '<small>Riceverai un’email per confermare l’indirizzo prima del primo accesso.</small>' : ''}`}</section></div>`;
  main.querySelectorAll('[data-mode]').forEach(button => button.onclick = () => {mode = button.dataset.mode; authForm();});
  main.querySelector('#auth-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.target, values = new FormData(form), submit = form.querySelector('button');
    submit.disabled = true; notice('Attendi…');
    const email = String(values.get('email') || '').trim(), password = String(values.get('password') || '');
    try {
      if (mode === 'reset') {
        const {error} = await cloud.auth.resetPasswordForEmail(email, {redirectTo: `${location.origin}/account?mode=recovery`});
        if (error) throw error;
        notice('Se l’indirizzo è registrato, riceverai un link per reimpostare la password.');
      } else if (mode === 'recovery') {
        const {error} = await cloud.auth.updateUser({password});
        if (error) throw error;
        location.assign('/account');
      } else if (mode === 'signup') {
        const {data, error} = await cloud.auth.signUp({email, password, options: {emailRedirectTo: `${location.origin}/account`}});
        if (error) throw error;
        if (data.session) location.assign('/account');
        else { form.reset(); notice('Controlla la tua email: segui il link di conferma per attivare l’account. Se hai già un account, usa Accedi.'); }
      } else {
        const {error} = await cloud.auth.signInWithPassword({email, password});
        if (error) throw error;
        location.assign('/account');
      }
    } catch (error) { notice(message(error)); }
    finally { submit.disabled = false; }
  });
}

async function dashboard() {
  main.innerHTML = `<section class="archive-heading"><div><span class="eyebrow">IL TUO ARCHIVIO PERSONALE</span><h1>I miei progetti</h1><p>Ogni mostra comincia da un’idea. Qui ritrovi le tue.</p></div><a class="button solid" href="/studio?start=new">+ Nuovo progetto</a></section><div class="account-toolbar"><span>${escape(user.email)}</span><button id="signout">Esci dall’account</button></div><div class="archive-local"><div><b>Hai iniziato su questo dispositivo?</b><p>Apri il progetto locale e scegli “Salva online” per aggiungerlo al tuo archivio.</p></div><a href="/studio?start=resume">Riprendi il progetto locale ↗</a></div><div class="archive-controls"><h2>Progetti salvati online <span id="project-count"></span></h2><label>Cerca<input id="project-search" type="search" placeholder="Nome della mostra"></label></div><p id="account-status" role="status" aria-live="polite">Caricamento dei progetti…</p><div id="project-grid" class="project-grid"></div>`;
  document.querySelector('#signout').onclick = async event => {
    event.target.disabled = true;
    try {const {error} = await cloud.auth.signOut({scope:'local'}); if (error) throw error; location.assign('/account');}
    catch (error) {notice(message(error)); event.target.disabled = false;}
  };
  try {
    const projects = await listProjects();
    document.querySelector('#project-count').textContent = `(${projects.length})`;
    notice('');
    const render = () => {
      const query = document.querySelector('#project-search').value.trim().toLocaleLowerCase();
      const matches = projects.filter(project => project.name.toLocaleLowerCase().includes(query));
      document.querySelector('#project-grid').innerHTML = matches.length ? matches.map(project => `<article class="project-card"><a href="/studio?project=${encodeURIComponent(project.id)}" class="project-card-preview" aria-label="Apri ${escape(project.name)}"><div class="plan-symbol" aria-hidden="true"><i></i><i></i><i></i></div><span>${Number(project.width)} × ${Number(project.depth)} m</span></a><div class="project-card-body"><span class="eyebrow">PROGETTO PRIVATO</span><h3>${escape(project.name)}</h3><p>${Number(project.object_count)} elementi · ${Number(project.asset_count)} contenuti caricati</p><div><small>${escape(new Date(project.updated_at).toLocaleDateString('it-IT', {day:'numeric', month:'short', year:'numeric'}))}</small><a href="/studio?project=${encodeURIComponent(project.id)}">Apri progetto ↗</a></div></div></article>`).join('') : `<div class="archive-empty"><span aria-hidden="true">⌑</span><h3>${query ? 'Nessun progetto trovato' : 'Il primo spazio è tutto da immaginare.'}</h3><p>${query ? 'Prova un altro nome.' : 'Crea una mostra, poi scegli “Salva online” nello studio. Qui compariranno il progetto e i suoi contenuti.'}</p>${query ? '' : '<a class="button outline" href="/studio?start=new">Crea il primo progetto ↗</a>'}</div>`;
    };
    document.querySelector('#project-search').oninput = render;
    render();
  } catch (error) {
    notice(message(error));
    const retry = document.createElement('button'); retry.textContent = 'Riprova'; retry.className = 'button outline'; retry.onclick = dashboard; main.append(retry);
  }
}

if (cloud) cloud.auth.onAuthStateChange(event => {
  if (event === 'PASSWORD_RECOVERY') {mode = 'recovery'; authForm();}
  if (event === 'SIGNED_OUT') {user = null; mode = 'login'; authForm();}
});
async function initializeAccount() { try {
  user = await currentUser();
  if (params.get('error') || new URLSearchParams(location.hash.slice(1)).get('error')) {
    authForm(); if (cloudEnabled) notice('Il link non è valido o è scaduto. Richiedi una nuova email di recupero.');
  } else if (user && mode !== 'recovery') await dashboard();
  else authForm();
} catch (error) {authForm(); if (cloudEnabled) notice(message(error));} }
initializeAccount();
