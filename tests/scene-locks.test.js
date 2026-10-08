import test from 'node:test';
import assert from 'node:assert/strict';
import {createProject,item,validate} from '../src/model.js';
import {isLocked,lockTarget} from '../src/scene-locks.js';

test('locks survive project serialization for floor, reference, objects, walls and openings',()=>{
 const p=createProject(12,9,'Lock test');
 p.objects.push(item('art'));
 p.reference={src:'data:image/png;base64,AA==',width:12,depth:9};
 const wall=p.walls[0];wall.openings=[{id:'test-door',type:'door',offset:1,width:.9,height:2.1,sill:0}];
 const ids=['surface:floor','reference:plan',p.objects[0].id,wall.id,'test-door'];
 for(const id of ids)assert.equal(isLocked(p,id),false);
 for(const id of ids)lockTarget(p,id).locked=true;
 const restored=validate(JSON.parse(JSON.stringify(p)));
 for(const id of ids)assert.equal(isLocked(restored,id),true);
});

test('wall lock protects its openings without overwriting their individual locks',()=>{
 const p=createProject(12,9);const w=p.walls[0];w.openings=[{id:'door'}];
 w.locked=true;assert.equal(isLocked(p,'door'),true);
 w.locked=false;assert.equal(isLocked(p,'door'),false);
 w.openings[0].locked=true;w.locked=true;w.locked=false;
 assert.equal(isLocked(p,'door'),true);
 assert.equal(isLocked(p,null),false);
});

test('legacy projects remain selectable and malformed lock values are rejected',()=>{
 const p=createProject(12,9);assert.equal(isLocked(p,p.walls[0].id),false);
 p.walls[0].locked='false';assert.throws(()=>validate(p),/Blocco/);
});
