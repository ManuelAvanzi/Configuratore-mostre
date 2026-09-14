import {chromium} from '@playwright/test';
import {PerspectiveCamera,Vector3} from 'three';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base=process.env.SPAZIO_TEST_URL||'http://localhost:5173';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await fs.mkdir('test-results',{recursive:true});
async function clickPoint(x,y,z){const r=await page.locator('#scene canvas').boundingBox();const camera=new PerspectiveCamera(45,r.width/r.height,.05,400);camera.position.set(13.2,12,13.5);camera.lookAt(0,0,0);camera.updateMatrixWorld();const v=new Vector3(x,y,z).project(camera);await page.mouse.click(r.x+(v.x+1)*r.width/2,r.y+(1-v.y)*r.height/2);}
async function change(field,value){const input=page.locator(`[data-surface-field=${field}]`).last();await input.fill(String(value));await input.press('Tab');}
try{
 await page.goto(base+'/studio?start=new');await page.locator('[name=name]').fill('Materiali e colori');await page.locator('#new-form button').click();await page.locator('[data-mode=layout]').click();
 await clickPoint(0,0,0);assert.equal(await page.locator('#properties h2').textContent(),'Pavimento');
 for(const kind of ['plaster','concrete','resin','carpet','stone','metal','oak']){await page.locator(`[data-material=${kind}]`).click();assert.equal(await page.locator(`[data-material=${kind}]`).getAttribute('aria-pressed'),'true');}
 await change('scale',.25);await change('rotation',90);await page.locator('[data-surface-field=finish]').selectOption('satin');await page.locator('[data-action=grid]').click();
 await page.screenshot({path:'test-results/materials-floor.png'});
 await clickPoint(0,1.5,-4.5);assert.equal(await page.locator('#properties h2').textContent(),'Parete 1');assert.equal(await page.locator('[data-wall-side=a]').getAttribute('aria-pressed'),'true');
 await page.locator('[data-material=plaster]').click();await change('color','#365968');await page.locator('[data-wall-side=b]').click();await page.locator('[data-material=paint]').click();await change('color','#DFD8C9');await page.locator('[data-wall-side=a]').click();assert.equal(await page.locator('[data-surface-field=color]').last().inputValue(),'#365968');
 await page.screenshot({path:'test-results/materials-wall.png'});
 await page.locator('[data-action=all-walls]').click();await page.locator('#surface-wall').selectOption({label:'Parete 2'});await page.locator('[data-wall-side=b]').click();assert.equal(await page.locator('[data-surface-field=color]').last().inputValue(),'#365968');
 await page.locator('[data-action=undo]').click();await page.locator('#surface-wall').selectOption({label:'Parete 2'});assert.equal(await page.locator('[data-surface-field=color]').last().inputValue(),'#F6F5F0');await page.locator('[data-action=redo]').click();
 await page.locator('[data-add=bench]').click();await page.locator('[data-material=oak]').click();
 await page.locator('.top-actions [data-action=export]').click();let pending=page.waitForEvent('download');await page.locator('[data-action=save-json]').click();await (await pending).saveAs('test-results/surfaces.spazio.json');const data=JSON.parse(await fs.readFile('test-results/surfaces.spazio.json','utf8'));assert.equal(data.floorSurface.scale,.25);assert.equal(data.floorSurface.rotation,90);assert.equal(data.walls[2].surfaces.b.color,'#365968');assert.equal(data.objects[0].surface.material,'oak');
 pending=page.waitForEvent('download');await page.locator('[data-action=report]').click();await (await pending).saveAs('test-results/surfaces-report.html');const report=await fs.readFile('test-results/surfaces-report.html','utf8');assert.match(report,/Materiali e finiture/);assert.match(report,/Parquet rovere/);assert.match(report,/#365968/);
 await page.locator('[data-action=close]').click();await page.locator('a.brand').click();await page.waitForURL(base+'/');await page.locator('#resume-project:not([hidden])').click();await page.locator('#dialog').waitFor({state:'attached'});await page.locator('#dialog').waitFor({state:'hidden'});await page.locator('[data-select="surface:floor"]').first().click();assert.equal(await page.locator('[data-material=oak]').getAttribute('aria-pressed'),'true');assert.equal(await page.locator('[data-surface-field=scale]').inputValue(),'0.25');
 await change('scale',0);assert.equal(await page.locator('[data-surface-field=scale]').inputValue(),'0.25');
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/materials-mobile.png',fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 assert.deepEqual(errors,[]);console.log('PASS: selezione 3D pavimento/parete, 8 materiali, scala, lati, colore, applicazione multipla, undo/redo, arredi, export e ripresa, mobile.');
}finally{await browser.close();}
