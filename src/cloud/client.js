import {createClient} from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const cloudEnabled = Boolean(url && key);
export const cloud = cloudEnabled ? createClient(url, key, {
  auth: {persistSession: true, autoRefreshToken: true, detectSessionInUrl: true},
}) : null;

export async function currentUser() {
  if (!cloud) return null;
  const {data, error} = await cloud.auth.getUser();
  if (error) {
    if (error.name === 'AuthSessionMissingError') return null;
    throw error;
  }
  return data.user;
}

export function message(error) {
  const code = error?.code;
  if (code === 'invalid_credentials') return 'Email o password non corretti.';
  if (code === 'email_not_confirmed') return 'Conferma il tuo indirizzo dal messaggio ricevuto via email.';
  if (code === 'over_email_send_rate_limit' || error?.status === 429) return 'Troppe richieste. Attendi qualche minuto e riprova.';
  if (code === 'weak_password') return 'Scegli una password più lunga e difficile da indovinare.';
  if (code === 'P0001') return 'Il progetto è stato aggiornato altrove. Apri la versione online oppure salva le tue modifiche come una nuova copia.';
  if (error?.message?.includes('fetch') || error?.name === 'AuthRetryableFetchError') return 'Connessione non disponibile. Il progetto locale resta sul dispositivo; riprova quando sei online.';
  if (error?.message?.startsWith('Spazio:')) return error.message.slice(8);
  return 'Operazione non riuscita. Riprova; se il problema continua, verifica la configurazione del servizio online.';
}
