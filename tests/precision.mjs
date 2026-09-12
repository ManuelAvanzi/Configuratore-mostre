import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base=process.env.SPAZIO_TEST_URL||'http://localhost:5173';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
await fs.mkdir('test-results',{recursive:true});
try{
 await page.goto(base+'/studio?start=demo');
 await page.locator('#scene[data-loading-models="0"]').waitFor({timeout:60000});
 await page.screenshot({path:'test-results/studio-professional.png'});
 assert.equal(await page.locator('#stage-title').textContent(),'Allestimento 3D');
 assert.equal(await page.locator('vite-error-overlay').count(),0);
 await page.goto(base+'/studio?start=new');
 await page.locator('[name=name]').fill('Studio misure');await page.locator('#new-form button').click();
 async function field(key,value){await page.locator(`[data-field="${key}"]`).fill(String(value));await page.locator(`[data-field="${key}"]`).press('Tab');}
 async function world(x,z){const r=await page.locator('#plan').boundingBox();const scale=Math.min((r.width-110)/12,(r.height-170)/9);return {x:r.x+r.width/2+x*scale,y:r.y+r.height/2+z*scale};}
 await page.locator('[data-tool=measure]').click();
 const a=await world(-3,-2),b=await world(0,2);
 await page.mouse.click(a.x,a.y);await page.mouse.move(b.x,b.y);await page.mouse.click(b.x,b.y);
 assert.equal(await page.locator('.measurement-row b').textContent(),'5.00 m');
 await page.screenshot({path:'test-results/studio-measurements.png'});
 await page.locator('#snap').uncheck();await page.locator('[data-tool=select]').click();assert.equal(await page.locator('#snap').isChecked(),false);
 await page.locator('[data-mode=layout]').click();await page.locator('[data-add=bench]').click();
 await page.locator('[data-mode=space]').click();
 const origin=await world(0,0),destination=await world(1,1);
 await page.mouse.move(origin.x,origin.y);await page.mouse.down();await page.mouse.move(destination.x,destination.y,{steps:10});await page.mouse.up();
 assert.equal(Number(await page.locator('[data-field=x]').inputValue()),1);assert.equal(Number(await page.locator('[data-field=z]').inputValue()),1);
 await page.locator('[data-action=undo]').click();await page.locator('[data-mode=layout]').click();await page.locator('.list-item').click();assert.equal(Number(await page.locator('[data-field=x]').inputValue()),0);
 await page.locator('[data-action=redo]').click();await page.locator('.list-item').click();assert.equal(Number(await page.locator('[data-field=x]').inputValue()),1);
 await page.locator('[data-mode=space]').click();const current=await world(1,1),cancelled=await world(2,2);await page.mouse.move(current.x,current.y);await page.mouse.down();await page.mouse.move(cancelled.x,cancelled.y,{steps:5});await page.keyboard.press('Escape');await page.mouse.up();await page.locator('[data-mode=layout]').click();await page.locator('.list-item').click();assert.equal(Number(await page.locator('[data-field=x]').inputValue()),1);
 await field('x',8);assert.ok(Number(await page.locator('#check-count').textContent())>0);
 await page.locator('#check-button').click();assert.match(await page.locator('.checks-list').textContent(),/Fuori dal pavimento/);await page.locator('.checks-list [data-inspect]').first().click();assert.equal(await page.locator('#dialog').isVisible(),false);
 await field('x',1);await field('y',.6);await page.locator('[data-action=ground]').click();assert.equal(Number(await page.locator('[data-field=y]').inputValue()),0);
 await page.locator('[data-add=art]').click();await field('centerHeight',1.6);assert.equal(Number(await page.locator('[data-field=y]').inputValue()),1.2);
 await page.locator('[data-mode=space]').click();await field('room.width',16);
 assert.equal(await page.locator('#room-size').textContent(),'16 × 9 m');
 await page.locator('.list-item').first().click();assert.equal(Number(await page.locator('[data-field="wall.length"]').inputValue()),16);
 await page.locator('.top-actions [data-action=export]').click();
 let pending=page.waitForEvent('download');await page.locator('[data-action=save-json]').click();const json=await pending;await json.saveAs('test-results/precision.spazio.json');
 const project=JSON.parse(await fs.readFile('test-results/precision.spazio.json','utf8'));assert.equal(project.measurements.length,1);assert.equal(project.walls[0].ax,-8);assert.equal(project.objects[0].w,1.6);
 pending=page.waitForEvent('download');await page.locator('[data-action=save-svg]').click();await (await pending).saveAs('test-results/precision.svg');assert.match(await fs.readFile('test-results/precision.svg','utf8'),/5.00 m/);
 pending=page.waitForEvent('download');await page.locator('[data-action=report]').click();await (await pending).saveAs('test-results/precision-report.html');const report=await fs.readFile('test-results/precision-report.html','utf8');assert.match(report,/5.00 m/);assert.match(report,/Controlli geometrici/);assert.match(report,/Studio misure/);
 await page.locator('[data-action=close]').click();await page.locator('a.brand').click();await page.waitForURL(base+'/');await page.locator('#resume-project:not([hidden])').click();await page.locator('#dialog').waitFor({state:'hidden'});await page.locator('[data-mode=space]').click();assert.equal(await page.locator('.measurement-row b').textContent(),'5.00 m');
 await page.locator('[data-remove-measure]').click();assert.equal(await page.locator('.measurement-row').count(),0);await page.locator('[data-action=undo]').click();assert.equal(await page.locator('.measurement-row').count(),1);
 await page.setViewportSize({width:390,height:844});await page.locator('[data-mode=layout]').click();await page.screenshot({path:'test-results/studio-mobile.png',fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 assert.deepEqual(errors,[]);console.log('PASS: browser, quote, trascinamento/undo, snap, diagnostica, posizionamento, perimetro, export, ripresa e mobile.');
}finally{await browser.close();}
