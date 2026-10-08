import {cloud, currentUser, localAccountEnabled} from './client.js';
import {localRequest} from './local.js';
import {packAssets, unpackAssets} from './assets.js';
import {validate} from '../model.js';

export async function requireUser() {
  const user = await currentUser();
  if (!user) throw Error('Spazio: Accedi al tuo account per continuare.');
  return user;
}

export async function listProjects() {
  await requireUser();
  if (localAccountEnabled) return localRequest('projects');
  const {data, error} = await cloud.from('projects').select('id,name,updated_at,revision,asset_count,width,depth,object_count,archive:document->archive').order('updated_at', {ascending: false});
  if (error) throw error;
  return data;
}

export async function loadProject(id) {
  const user = await requireUser();
  if (localAccountEnabled) { const data=await localRequest(`projects/${encodeURIComponent(id)}`); return {...data,project:validate(data.project)}; }
  const {data, error} = await cloud.from('projects').select('*').eq('id', id).single();
  if (error) throw error;
  const project = await unpackAssets(data.document, user.id, async path => {
    const {data: blob, error} = await cloud.storage.from('project-assets').download(path);
    if (error) throw error;
    return blob;
  });
  return {project: validate(project), id: data.id, revision: data.revision, owner: user.id};
}

export async function saveProject(project, binding, progress = () => {}) {
  const user = await requireUser();
  if (binding && binding.owner !== user.id) throw Error('Spazio: Questo progetto appartiene a un altro account. Accedi con il proprietario.');
  validate(project);
  if (localAccountEnabled) return localRequest(`projects/${binding?.id || crypto.randomUUID()}`,'PUT',{project,revision:binding?.revision || 0});
  progress('Caricamento dei contenuti…');
  const {document, assetCount} = await packAssets(project, user.id, async (path, blob) => {
    const stored = await cloud.storage.from('project-assets').exists(path);
    if (stored.error && ![400,404].includes(stored.error.originalError?.status)) throw stored.error;
    if (stored.data) return;
    const {error} = await cloud.storage.from('project-assets').upload(path, blob, {upsert: false, contentType: blob.type, cacheControl: '31536000'});
    // Content-addressed immutable files can already exist after a previous save.
    const exists = error && (Number(error.statusCode) === 409 || Number(error.statusCode) === 400 && /already exists|duplicate/i.test(error.message));
    if (error && !exists) throw error;
  });
  progress('Salvataggio del progetto…');
  const id = binding?.id || crypto.randomUUID();
  const {data, error} = await cloud.rpc('save_project', {
    project_id: id, expected_revision: binding?.revision || 0,
    project_document: document, project_asset_count: assetCount,
  });
  if (error) throw error;
  return {id, owner: user.id, revision: data};
}

// Card edits use the same revision-checked save as the editor, preserving every asset.
export async function editProjectCard(id, patch) {
  const loaded = await loadProject(id);
  if (patch.name !== undefined) {
    const name = String(patch.name).trim();
    if (!name || name.length > 200) throw Error('Spazio: Inserisci un titolo da 1 a 200 caratteri.');
    loaded.project.name = name;
  }
  loaded.project.archive = {...loaded.project.archive};
  for (const key of ['cover', 'trashed']) if (patch[key] !== undefined) loaded.project.archive[key] = patch[key];
  return saveProject(loaded.project, loaded);
}
