import {currentUser} from './client.js';
import {localRequest} from './local.js';
import {validate} from '../model.js';
export async function requireUser(){const user=await currentUser();if(!user)throw Error('Spazio: Archivio locale non disponibile. Usa Esporta nello studio.');return user;}
export async function listProjects(){await requireUser();return localRequest('projects');}
export async function loadProject(id){await requireUser();const data=await localRequest(`projects/${encodeURIComponent(id)}`);return {...data,project:validate(data.project)};}
export async function saveProject(project,binding){const user=await requireUser();if(binding&&binding.owner!==user.id)throw Error('Spazio: Il progetto appartiene a un altro archivio.');validate(project);return localRequest(`projects/${binding?.id||crypto.randomUUID()}`,'PUT',{project,revision:binding?.revision||0});}
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
