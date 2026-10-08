import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{
 window.testWrites=0;window.testDraws=0;
 const put=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(...args){window.testWrites++;return put.apply(this,args);};
 for(const key of ['drawElements','drawArrays']){const fn=WebGL2RenderingContext.prototype[key];WebGL2RenderingContext.prototype[key]=function(...args){window.testDraws++;return fn.apply(this,args);};}
});
const waitSaved=()=>page.waitForFunction(()=>document.querySelector('#save-state').textContent.startsWith('Salvato'));
const snapshot=()=>page.evaluate(async()=>{const db=await new Promise(r=>{const q=indexedDB.open('spazio-studio',1);q.onsuccess=()=>r(q.result);});return new Promise(r=>{const q=db.transaction('projects').objectStore('projects').get('current');q.onsuccess=()=>{db.close();r(q.result);};});});
async function move(axis,dx,dy,cancel=false){
 const c=page.locator('#plan');const r=await c.boundingBox();const q=await c.evaluate(e=>({x:+e.dataset.gizmoX,y:+e.dataset.gizmoY}));
 const x=r.x+q.x+(axis==='x'?42:0),y=r.y+q.y+(axis==='z'?42:0);
 await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+dx,y+dy,{steps:10});
 if(cancel)await page.keyboard.press('Escape');
 await page.mouse.up();
}
try{
 await page.goto((process.env.SPAZIO_TEST_URL||'http://127.0.0.1:4175')+'/studio?start=new');
 await page.locator('#new-form button[type=submit]').click();await waitSaved();
 assert.equal(await page.locator('#left').getByText('Quote salvate').count(),0);
 assert.equal(await page.locator('#left [data-action=reference]').count(),0);
 const idle=await page.evaluate(()=>window.testDraws);await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>window.testDraws),idle,'Hidden 3D must not render');
 await page.locator('[data-action=wall-numeric]').click();await page.locator('#plan[data-gizmo]').waitFor();await waitSaved();
 const before=await snapshot();const wall=before.walls.at(-1);const writes=await page.evaluate(()=>window.testWrites);
 await page.locator(`[data-select="${wall.id}"]`).click();await page.waitForTimeout(450);assert.equal(await page.evaluate(()=>window.testWrites),writes,'Selection must not save');
 await move('x',55,30);await waitSaved();const after=await snapshot();const moved=after.walls.at(-1);assert.ok(moved.ax>wall.ax);assert.equal(moved.az,wall.az);assert.equal(moved.bx-moved.ax,wall.bx-wall.ax);assert.equal(await page.evaluate(()=>window.testWrites),writes+1);
 await page.locator('.top-actions summary').click();await page.locator('.top-actions [data-action=undo]').click();await waitSaved();assert.equal((await snapshot()).walls.at(-1).ax,wall.ax);
 await page.locator('[data-mode=layout]').click();await page.locator('[data-category=Arredi]').click();await page.locator('[data-add=bench]').click();await page.locator('[data-mode=space]').click();await waitSaved();const obj=(await snapshot()).objects.at(-1);
 await move('z',25,55);await waitSaved();const objAfter=(await snapshot()).objects.at(-1);assert.equal(objAfter.x,obj.x);assert.ok(objAfter.z>obj.z);
 await move('x',50,0,true);assert.equal((await snapshot()).objects.at(-1).x,objAfter.x);
 await page.screenshot({path:'test-results/plan-gizmo.png'});
 await page.locator('.top-actions summary').click();const chooser=page.waitForEvent('filechooser');await page.locator('.top-actions [data-action=reference]').click();await (await chooser).setFiles('assets/test-planimetrie/pianta-mano.png');
 await page.locator('#dialog [data-field="ref.width"]').fill('15');await page.locator('#dialog [data-field="ref.width"]').press('Tab');await page.locator('#dialog [data-action=close]').last().click();await waitSaved();assert.equal((await snapshot()).reference.width,15);
 await page.locator('[data-mode=layout]').click();await page.waitForTimeout(200);assert.ok(await page.evaluate(()=>window.testDraws)>idle);
 assert.deepEqual(errors,[]);console.log('PASS: gizmo pareti/oggetti, assi, annulla, cancellazione drag, selezione senza salvataggi, rendering 3D sospeso, importazione e scala dal menu.');
}finally{await browser.close();}
