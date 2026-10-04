import {Scene} from 'three';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {materialsReady} from './surface-renderer.js';
import {validate} from './model.js';
import {MAX_PROJECT_FILE} from './project-file.js';
export async function exportProjectGLB(studio,project){
 if(studio.renderer.xr.isPresenting)throw Error('Esci dalla modalità VR o AR prima di esportare.');
 validate(project);
 if(studio.pendingModels||!materialsReady()||studio.objects.children.some(g=>!g.children.length))throw Error('Attendi il caricamento completo di modelli e materiali prima di esportare.');
 studio.world.traverse(o=>{for(const m of (Array.isArray(o.material)?o.material:[o.material]))if(m)for(const v of Object.values(m))if(v?.isTexture&&!v.isVideoTexture){const image=v.image;if(!image||image.complete===false||image.naturalWidth===0)throw Error('Attendi il caricamento delle immagini prima di esportare.');}});
 const scene=new Scene();scene.name=project.name;scene.userData.spazio={version:1,producer:'CarraroLAB',project:JSON.parse(JSON.stringify(project))};
 const root=clone(studio.world);root.position.set(0,0,0);root.rotation.set(0,0,0);root.scale.setScalar(1);
 // Editor helpers are excluded; architectural parts stay complete despite cutaway mode.
 const removed=[];root.traverse(o=>{if(o.isGridHelper)removed.push(o);const id=o.userData.id;if(id){o.visible=true;const object=project.objects.find(x=>x.id===id),wall=project.walls.find(x=>x.id===id);o.name=object?.name||(wall?'Parete '+(project.walls.indexOf(wall)+1):'Pavimento');o.userData={spazioId:id,spazioType:object?.type||(wall?'wall':'floor')};}if(o.material){o.material=Array.isArray(o.material)?o.material.map(m=>m.clone()):o.material.clone();for(const m of (Array.isArray(o.material)?o.material:[o.material]))if(m.map?.isVideoTexture)m.map=null;}});
 removed.forEach(o=>o.removeFromParent());
 const ceilingIndex=studio.world.children.indexOf(studio.ceiling);if(ceilingIndex>=0){const ceiling=root.children.find(o=>o.geometry===studio.ceiling.geometry);if(ceiling){ceiling.visible=true;ceiling.name='Soffitto';}}
 scene.add(root);scene.updateMatrixWorld(true);
 try{const binary=await new GLTFExporter().parseAsync(scene,{binary:true,onlyVisible:true,maxTextureSize:1024});if(binary.byteLength>MAX_PROJECT_FILE)throw Error('Il GLB supera 150 MB: riduci i contenuti oppure esporta il file progetto JSON.');return binary;}finally{root.traverse(o=>{for(const m of (Array.isArray(o.material)?o.material:[o.material]))m?.dispose();});}
}
