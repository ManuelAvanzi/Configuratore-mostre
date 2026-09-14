export const FLOOR_ID='surface:floor';
export const surfaceObjects=['bench','desk','plinth','partition','structure','scenery'];
import {materials} from './material-catalog.js';
export {materials};
export const finishes={matte:'Opaca',satin:'Satinata',gloss:'Lucida'};
export const swatches=['#f6f5f0','#dfd8c9','#c3b69f','#b9936c','#9ca295','#6c8178','#365968','#bd715c','#8b524b','#494946','#292d30','#ffffff'];
export function surface(value,color='#f6f5f0'){if(!value)return {material:'paint',color,scale:1,rotation:0,finish:'matte',textureVersion:2};return {...value,scale:value.textureVersion===undefined&&value.material==='oak'?Math.min(10,value.scale*9):value.scale,textureVersion:2};}
export function preset(id){const m=materials.find(m=>m.id===id);if(!m)throw Error('Materiale non disponibile.');return {material:m.id,color:m.color,scale:m.scale,rotation:0,finish:m.finish,textureVersion:2};}
export function validateSurface(s){if(s===undefined)return;if(!s||!materials.some(m=>m.id===s.material)||!/^#[0-9a-f]{6}$/i.test(s.color)||!Object.hasOwn(finishes,s.finish)||typeof s.scale!=='number'||!Number.isFinite(s.scale)||s.scale<.05||s.scale>10||typeof s.rotation!=='number'||!Number.isFinite(s.rotation)||s.rotation<-360||s.rotation>360)throw Error('Materiale non valido: verifica colore, finitura e dimensione del campione.');}
export const surfaceDescription=s=>`${materials.find(m=>m.id===s.material)?.name} · ${s.color.toUpperCase()} · ${finishes[s.finish]}${s.material==='paint'?'':` · modulo ${s.scale} m · ${s.rotation}°`}`;
export function surfaceRows(p){return [{name:'Pavimento',...surface(p.floorSurface,p.floor)},...p.walls.flatMap((w,i)=>[{name:`Parete ${i+1} · lato A`,...surface(w.surfaces?.a)},{name:`Parete ${i+1} · lato B`,...surface(w.surfaces?.b)}]),...p.objects.filter(o=>o.surface).map(o=>({name:o.name,...surface(o.surface,o.color)}))];}
