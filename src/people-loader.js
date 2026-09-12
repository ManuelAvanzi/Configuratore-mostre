import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {personDefinition} from './people-catalog.js';
const cache=new Map();
const loader=new GLTFLoader();
export function fitPerson(source,object,sourceBounds){
 const figure=source.clone(true);figure.updateMatrixWorld(true);
 const bounds=sourceBounds||new T.Box3().setFromObject(figure,true),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
 if(!Number.isFinite(size.y)||size.y<=0)throw Error('Il modello della persona non ha un’altezza valida.');
 const scale=object.h/size.y;
 const positioned=new T.Group();positioned.add(figure);positioned.scale.setScalar(scale);positioned.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);
 const group=new T.Group();group.add(positioned);
 group.traverse(m=>{if(m.isMesh){m.castShadow=true;m.receiveShadow=true;m.userData.sharedPersonAsset=true;}});
 return group;
}
export async function createPerson(object){
 const def=personDefinition(object.type);if(!def)throw Error('Persona non disponibile nel catalogo.');
 if(!cache.has(def.type))cache.set(def.type,loader.loadAsync(`/people/models/${def.type}.glb`).then(gltf=>{gltf.scene.updateMatrixWorld(true);return {scene:gltf.scene,bounds:new T.Box3().setFromObject(gltf.scene,true)};}).catch(error=>{cache.delete(def.type);throw error;}));
 const source=await cache.get(def.type);return fitPerson(source.scene,object,source.bounds);
}
