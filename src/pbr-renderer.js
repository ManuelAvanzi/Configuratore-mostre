import * as T from 'three';
import {surface,materials} from './surfaces.js';
const sets=new Map(),pool=new Map(),used=new Set(),pending=new Set(),loader=new T.TextureLoader();
let anisotropy=4;
export function setSurfaceAnisotropy(max){anisotropy=Math.min(16,max);}
export function materialsReady(){return pending.size===0;}
function status(){const host=document.querySelector('#scene');if(host)host.dataset.loadingMaterials=String(pending.size);}
function loadSet(asset){
 if(sets.has(asset)){const entry=sets.get(asset);entry.time=Date.now();return entry.promise;}
 const entry={time:Date.now()};pending.add(asset);status();
 entry.promise=Promise.all(['color','normal','roughness'].map(async kind=>{const texture=await loader.loadAsync(`/materials/${asset}/${kind}.webp`);texture.colorSpace=kind==='color'?T.SRGBColorSpace:T.NoColorSpace;texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.anisotropy=anisotropy;return texture;})).then(textures=>{entry.textures=textures;return textures;}).catch(error=>{sets.delete(asset);window.dispatchEvent(new CustomEvent('surface-load-error',{detail:'Texture non disponibile. Ricarica la pagina per riprovare.'}));throw error;}).finally(()=>{pending.delete(asset);status();});
 sets.set(asset,entry);return entry.promise;
}
export function beginSurfaceBuild(){used.clear();}
function dispose(m){for(const key of ['map','normalMap','roughnessMap'])m[key]?.dispose();m.dispose();}
export function endSurfaceBuild(){
 for(const [key,m] of pool)if(!used.has(key)){dispose(m);pool.delete(key);}
 const active=new Set([...pool.values()].map(m=>m.userData.asset));
 for(const [asset,entry] of [...sets].sort((a,b)=>a[1].time-b[1].time)){if(sets.size<=6)break;if(!active.has(asset)&&entry.textures){entry.textures.forEach(t=>t.dispose());sets.delete(asset);}}
 status();
}
export function surfaceMaterial(value,color){
 const s=surface(value,color),def=materials.find(m=>m.id===s.material),key=JSON.stringify(s);used.add(key);if(pool.has(key))return pool.get(key);
 const m=new T.MeshStandardMaterial({color:s.color,roughness:{matte:1,satin:.65,gloss:.24}[s.finish],metalness:def.metalness||0,normalScale:new T.Vector2(.7,.7)});
 m.userData.surfaceManaged=true;m.userData.asset=def.asset;pool.set(key,m);
 if(def.asset)loadSet(def.asset).then(textures=>{if(pool.get(key)!==m)return;const [map,normalMap,roughnessMap]=textures.map(base=>{const texture=base.clone();texture.repeat.set(1/s.scale,1/(s.scale*(def.aspect||1)));texture.rotation=s.rotation*Math.PI/180;texture.needsUpdate=true;return texture;});Object.assign(m,{map,normalMap,roughnessMap});m.needsUpdate=true;}).catch(()=>{});
 return m;
}
export function surfaceUV(geometry,offset={x:0,y:0,z:0}){
 const pos=geometry.attributes.position,norm=geometry.attributes.normal,uv=geometry.attributes.uv;
 for(let i=0;i<pos.count;i++){const x=pos.getX(i)+offset.x,y=pos.getY(i)+offset.y,z=pos.getZ(i)+offset.z;if(Math.abs(norm.getY(i))>.5)uv.setXY(i,x,z);else if(Math.abs(norm.getX(i))>.5)uv.setXY(i,z,y);else uv.setXY(i,x,y);}uv.needsUpdate=true;
}
export function surfacePreview(canvas,s){
 const ctx=canvas.getContext('2d');canvas.width=480;canvas.height=220;const token=JSON.stringify(s);canvas.dataset.surface=token;
 function draw(img){if(!canvas.isConnected||canvas.dataset.surface!==token)return;ctx.fillStyle='#fff';ctx.fillRect(0,0,480,220);if(img){ctx.save();ctx.translate(240,110);ctx.rotate(-s.rotation*Math.PI/180);ctx.drawImage(img,-280,-280,560,560);ctx.restore();}ctx.globalCompositeOperation='multiply';ctx.fillStyle=s.color;ctx.fillRect(0,0,480,220);ctx.globalCompositeOperation='source-over';}
 draw();const asset=materials.find(m=>m.id===s.material)?.asset;if(asset){const img=new Image();img.onload=()=>draw(img);img.src=`/materials/${asset}/preview.webp`;}
}
