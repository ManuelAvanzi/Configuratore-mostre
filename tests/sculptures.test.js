import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Box3,Vector3} from 'three';
import {createSculpture} from '../src/sculptures.js';
import {sculptureCatalog} from '../src/sculpture-catalog.js';
import {item,createProject,validate} from '../src/model.js';
for(const def of sculptureCatalog)test(def.name+': ingombri reali, appoggio e salvataggio',()=>{const o={...item(def.type),w:1.2,h:2,d:.75};const sculpture=createSculpture(o);sculpture.updateMatrixWorld(true);const box=new Box3().setFromObject(sculpture),size=box.getSize(new Vector3());for(const [a,b] of [[size.x,o.w],[size.y,o.h],[size.z,o.d],[box.min.y,0]])assert.ok(Math.abs(a-b)<1e-5);const p=createProject();p.objects=[o];assert.equal(validate(JSON.parse(JSON.stringify(p))).objects[0].type,def.type);sculpture.traverse(m=>{if(m.geometry){assert.ok([...m.geometry.attributes.position.array].every(Number.isFinite));m.geometry.dispose();m.material.dispose();}});});
