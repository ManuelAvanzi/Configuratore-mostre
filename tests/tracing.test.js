import test from 'node:test';
import assert from 'node:assert/strict';
import {tracePoint,exactSegmentEnd,referenceBounds,movedCorner} from '../src/tracing.js';
import {cropReference} from '../src/trace-crop.js';
import {calibratedReference} from '../src/reference-calibration.js';
import {clone,createProject} from '../src/model.js';
import {createPlanEditor} from '../src/plan-editor.js';

test('trace snapping joins existing endpoints, supports orthogonal lines and exact metre lengths',()=>{
 const walls=[{ax:0,az:0,bx:4,bz:0}];
 assert.deepEqual(tracePoint({x:4.05,z:.03},{x:0,z:0},walls,50),{x:4,z:0});
 assert.deepEqual(tracePoint({x:2,z:1},{x:0,z:0},[],50,true),{x:2,z:0});
 assert.deepEqual(tracePoint({x:2.03,z:.54},null,[],50),{x:2.03,z:.54});
 assert.deepEqual(exactSegmentEnd({x:0,z:0},{x:3,z:4},10),{x:6,z:8});
});

test('calibration and cropping preserve image proportions and drawing coordinates',()=>{
 const ref={width:12,depth:8,x:2,z:3,opacity:.85,locked:true};
 assert.deepEqual(calibratedReference(ref,4,8),{width:24,depth:16});
 const crop=cropReference(ref,{x:250,y:0,width:500,height:1000},{width:1000,height:1000});
 assert.equal(crop.width,6);assert.equal(crop.depth,8);assert.equal(crop.x,2);assert.equal(crop.z,3);
 assert.deepEqual(referenceBounds(crop),{left:-1,right:5,top:-1,bottom:7});
 assert.throws(()=>cropReference(ref,{x:-1,y:0,width:10,height:10},{width:100,height:100}));
});

test('history snapshots isolate geometry while keeping immutable image content',()=>{
 const p=createProject(12,9);p.reference={src:'data:image/png;base64,'+'a'.repeat(1000000),width:12,depth:9};
 const saved=clone(p);p.walls[0].ax=10;p.reference.width=15;
 assert.notEqual(saved.walls[0].ax,p.walls[0].ax);assert.equal(saved.reference.width,12);assert.equal(saved.reference.src,p.reference.src);
});

test('canvas tracing commits one wall per click, keeps the chain, and renders one reference per frame',()=>{
 const original={document:globalThis.document,Image:globalThis.Image,devicePixelRatio:globalThis.devicePixelRatio,requestAnimationFrame:globalThis.requestAnimationFrame};
 const listeners={},readout={},frames=[];let imageDraws=0,commits=0,tool='wall',selected=null,zoom=1;
 const context=new Proxy({measureText:t=>({width:t.length*7}),drawImage:()=>imageDraws++},{get:(o,k)=>k in o?o[k]:()=>{}});
 const canvas={hidden:false,width:800,height:600,dataset:{},getBoundingClientRect:()=>({left:0,top:0,width:800,height:600}),getContext:()=>context,addEventListener:(name,fn)=>listeners[name]=fn,setPointerCapture:()=>{}};
 globalThis.document={querySelector:()=>readout};globalThis.devicePixelRatio=1;globalThis.requestAnimationFrame=cb=>{frames.push(cb);return frames.length;};globalThis.Image=class{complete=true;naturalWidth=100;};
 try {
  const p=createProject(12,9);p.walls=[];p.reference={src:'data:image/png;base64,AA==',width:12,depth:9,locked:true};
  const editor=createPlanEditor(canvas,{project:()=>p,tool:()=>tool,selected:()=>selected,select:id=>selected=id,snap:()=>false,zoom:()=>zoom,setZoom:v=>zoom=v,change:fn=>{commits++;fn(p);},notify:()=>{},gridStep:()=>1});
  editor.draw();assert.equal(imageDraws,1);
  const click=(x,y)=>listeners.pointerdown({clientX:x,clientY:y,button:0,pointerId:1});
  click(300,200);assert.equal(commits,0);click(500,200);click(500,400);
  assert.equal(commits,2);assert.equal(p.walls.length,2);assert.equal(p.walls[0].bx,p.walls[1].ax);assert.equal(p.walls[0].bz,p.walls[1].az);
  editor.cancel();click(300,400);assert.equal(commits,2);
  editor.cancel();tool='select';click(400,300);assert.equal(selected,null,'locked reference is not selected');
  const before=imageDraws;editor.draw();assert.equal(imageDraws-before,1,'each paint draws only one source image');
 } finally {Object.assign(globalThis,original);}
});

test('editing a shared corner keeps both walls joined and respects adjacent locks',()=>{
 const walls=[{id:'a',ax:0,az:0,bx:4,bz:0},{id:'b',ax:4,az:0,bx:4,bz:3}];
 const changes=movedCorner(walls,'a','b',{x:5,z:1});
 assert.deepEqual(changes,[{id:'a',values:{bx:5,bz:1}},{id:'b',values:{ax:5,az:1}}]);
 assert.equal(walls[0].bx,4,'preview does not mutate the project');
 walls[1].locked=true;assert.throws(()=>movedCorner(walls,'a','b',{x:5,z:1}),/bloccata/);
});
