import {loadProject,editProjectCard} from './cloud/projects.js';
import {message} from './cloud/client.js';
export function cardMenu(project,escape){
 const id=escape(project.id);
 return `<details class="project-card-menu"><summary aria-label="Opzioni per ${escape(project.name)}" title="Opzioni progetto">⋯</summary><div>${project.archive?.trashed?'<button data-card-action="restore">Ripristina progetto</button>':`<button data-card-action="cover">Cambia copertina</button><button data-card-action="rename">Cambia titolo</button><a href="/studio?project=${id}&export=glb">Scarica modello 3D · GLB</a><button data-card-action="download">Scarica progetto completo · JSON</button><button data-card-action="trash">Sposta nel cestino</button>`}</div></details>`;
}
function download(project){
 const url=URL.createObjectURL(new Blob([JSON.stringify(project,null,2)],{type:'application/json'}));
 const a=document.createElement('a');a.href=url;a.download=(project.name.replace(/[^a-zA-Z0-9àèéìòù _-]/g,'').trim()||'mostra')+'.spazio.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
export function bindCardActions(grid,{notice,refresh}){
 grid.onclick=async e=>{
  const button=e.target.closest('[data-card-action]');if(!button)return;
  const card=button.closest('[data-project-id]'),id=card.dataset.projectId,action=button.dataset.cardAction;
  card.querySelector('details').open=false;
  if(action==='download'){
   button.disabled=true;notice('Preparazione del progetto completo, inclusi immagini e modelli…');
   try{download((await loadProject(id)).project);notice('File progetto preparato. Controlla i download del browser.');}catch(error){notice(message(error));}finally{button.disabled=false;}return;
  }
  if(action==='restore'){
   button.disabled=true;
   try{await editProjectCard(id,{trashed:false});await refresh();}catch(error){notice(message(error));button.disabled=false;}return;
  }
  const dialog=document.createElement('dialog');dialog.className='card-dialog';dialog.setAttribute('aria-label','Modifica progetto');
  dialog.innerHTML=`<button type="button" class="card-dialog-close" aria-label="Chiudi">×</button><h2>${action==='rename'?'Cambia titolo':action==='cover'?'Cambia immagine di copertina':'Sposta nel cestino'}</h2><form>${action==='rename'?'<label>Titolo della mostra<input name="name" maxlength="200" required/></label>':action==='cover'?'<label>Immagine di copertina<input name="cover" type="file" accept="image/png,image/jpeg,image/webp" required/></label><img class="cover-preview" alt="Anteprima copertina" hidden/><p>JPG, PNG o WebP · massimo 30 MB. La copertina viene adattata alla card.</p>':'<p>Il progetto verrà tolto dall’elenco. Potrai recuperarlo dal Cestino.</p>'}<p role="status"></p><button class="button solid" type="submit">${action==='trash'?'Sposta nel cestino':'Salva'}</button></form>`;
  document.body.append(dialog);dialog.querySelector('.card-dialog-close').onclick=()=>dialog.close();dialog.onclose=()=>dialog.remove();
  if(action==='rename')dialog.querySelector('input').value=card.querySelector('h3').textContent;
  let cover,previewRevision=0;
  if(action==='cover')dialog.querySelector('input').onchange=async ev=>{
   const revision=++previewRevision;cover=null;const f=ev.target.files[0],status=dialog.querySelector('[role=status]'),preview=dialog.querySelector('img');preview.hidden=true;status.textContent='';if(!f)return;
   const url=URL.createObjectURL(f);
   try{if(f.size>30*1024*1024||!/^image\/(png|jpeg|webp)$/.test(f.type))throw Error('Usa JPG, PNG o WebP entro 30 MB.');const img=new Image();img.src=url;await img.decode();const canvas=document.createElement('canvas');const ratio=Math.min(1,900/img.width,600/img.height);canvas.width=Math.max(1,Math.round(img.width*ratio));canvas.height=Math.max(1,Math.round(img.height*ratio));const ctx=canvas.getContext('2d');ctx.fillStyle='#f5f4ef';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);let value=canvas.toDataURL('image/jpeg',.78);if(value.length>300000)value=canvas.toDataURL('image/jpeg',.45);if(value.length>300000)throw Error('Immagine troppo dettagliata. Scegli una copertina più piccola.');if(revision!==previewRevision)return;cover=value;preview.src=cover;preview.hidden=false;}catch(error){if(revision===previewRevision)status.textContent=error.message;}finally{URL.revokeObjectURL(url);}
  };
  dialog.querySelector('form').onsubmit=async ev=>{
   ev.preventDefault();const status=dialog.querySelector('[role=status]');
   if(action==='cover'&&!cover){status.textContent='Attendi l’anteprima di una copertina valida.';return;}
   const patch=action==='rename'?{name:dialog.querySelector('input').value}:action==='cover'?{cover}:{trashed:true};
   dialog.querySelectorAll('button,input').forEach(b=>b.disabled=true);dialog.oncancel=ev=>ev.preventDefault();status.textContent='Salvataggio…';
   try{await editProjectCard(id,patch);dialog.close();await refresh();}catch(error){status.textContent=message(error);dialog.querySelectorAll('button,input').forEach(b=>b.disabled=false);dialog.oncancel=null;}
  };dialog.showModal();
 };
}
