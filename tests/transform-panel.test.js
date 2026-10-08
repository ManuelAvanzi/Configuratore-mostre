import test from 'node:test';
import assert from 'node:assert/strict';
import {applyTransform} from '../src/transform-panel.js';
import {createProject,item,validate,wallLength} from '../src/model.js';
test('object scale supports linked, independent, repeated edits and serialization',()=>{
 const p=createProject(12,9,'Test'),o=item('bench');p.objects.push(o);const initial={...o};
 applyTransform(o,false,'scale.x',2,true);assert.equal(o.w,initial.w*2);assert.equal(o.h,initial.h*2);
 applyTransform(o,false,'scale.x',3,false);assert.equal(o.w,initial.w*3);assert.equal(o.h,initial.h*2);
 const restored=validate(JSON.parse(JSON.stringify(p))).objects[0];applyTransform(restored,false,'scale.x',1,false);assert.equal(restored.w,initial.w);
});
test('wall translation and rotation preserve center, length and openings; scale transforms openings',()=>{
 const w={ax:-2,az:0,bx:2,bz:0,height:3,thickness:.15,openings:[{offset:1,width:1,height:2,sill:0}]};
 applyTransform(w,true,'position.x',3,true);assert.equal(w.ax,1);assert.equal(w.bx,5);
 applyTransform(w,true,'rotation.y',90,true);assert.ok(Math.abs(wallLength(w)-4)<1e-9);assert.equal((w.ax+w.bx)/2,3);
 applyTransform(w,true,'scale.x',2,false);assert.ok(Math.abs(wallLength(w)-8)<1e-9);assert.equal(w.height,3);assert.equal(w.openings[0].offset,2);assert.equal(w.openings[0].width,2);
});
test('invalid scale and malformed persisted factors are rejected',()=>{
 assert.throws(()=>applyTransform(item('bench'),false,'scale.x',0,true));
 const p=createProject(12,9,'Test');p.objects.push({...item('bench'),transformScale:{x:0,y:1,z:1}});assert.throws(()=>validate(p));
});
