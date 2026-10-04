import {test} from 'node:test';
import assert from 'node:assert/strict';
import {arrange} from '../src/arrange.js';
import {footprint} from '../src/planning.js';
const object=(id,x,w=1,rotation=0)=>({id,x,w,rotation,y:1,z:0,h:1,d:.2});
test('allineamento dei centri rispetta dimensioni diverse e ultimo riferimento',()=>{const objects=[{...object('a',0),h:2},object('b',2)];arrange(objects,['a','b'],'align-center');assert.equal(objects[0].y,.5);assert.equal(objects[1].y,1);assert.equal(objects[0].y+objects[0].h/2,objects[1].y+objects[1].h/2);});
test('distribuzione mantiene estremi e spazi uguali tra ingombri ruotati',()=>{const objects=[object('a',-4,2),object('b',-1,1,45),object('c',4,2)];arrange(objects,['a','b','c'],'distribute-x');const bounds=objects.map(o=>{const xs=footprint(o).map(q=>q.x);return [Math.min(...xs),Math.max(...xs)];});assert.equal(objects[0].x,-4);assert.equal(objects[2].x,4);assert.ok(Math.abs(bounds[1][0]-bounds[0][1]-(bounds[2][0]-bounds[1][1]))<1e-8);});
test('distribuzione rifiuta spazio insufficiente e traslazione preserva le distanze',()=>{const objects=[object('a',0,4),object('b',1,4),object('c',2,4)];assert.throws(()=>arrange(objects,['a','b','c'],'distribute-x'),/Spazio insufficiente/);arrange(objects,['a','b'],'offset-x',-.5);assert.equal(objects[1].x-objects[0].x,1);assert.equal(objects[2].x,2);assert.throws(()=>arrange(objects,['a','b'],'offset-x',NaN));});
