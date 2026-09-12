import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base=process.env.SPAZIO_TEST_URL||'http://localhost:5173';
const browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[],failed=[];const requests=new Map();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)failed.push(r.url());});page.on('request',r=>{if(r.url().endsWith('.glb'))requests.set(r.url(),(requests.get(r.url())||0)+1);});
const ready=()=>page.locator('#scene[data-loading-models="0"]').waitFor();
await page.goto(base+'/studio?start=demo');await ready();await page.locator('[data-category="Persone"]').click();assert.equal(await page.locator('.catalog-card').count(),6);
const types=['person-business','person-casual-15','person-casual-35','person-grey-blazer','person-mint','person-sophia'];
for(const [i,type] of types.entries()){await page.locator(`[data-add="${type}"]`).click();await ready();await page.locator('[data-field="x"]').fill(String(-4.5+i*1.7));await page.locator('[data-field="x"]').press('Tab');await page.locator('[data-field="z"]').fill('1');await page.locator('[data-field="z"]').press('Tab');await ready();}
await page.locator('[data-field="h"]').fill('1.9');await page.locator('[data-field="h"]').press('Tab');await ready();assert.match(await page.locator('.measurement-note').textContent(),/190 cm/);assert.equal(await page.locator('[data-color="object"]').count(),0);await page.locator('[data-action="duplicate"]').click();await ready();await page.locator('[data-action="delete"]').click();await ready();
await page.locator('#properties').evaluate(el=>el.scrollTop=0);await page.screenshot({path:'test-results/glb-people-editor.png'});
await page.locator('.top-actions [data-action="export"]').click();const event=page.waitForEvent('download');await page.locator('[data-action="save-json"]').click();const file=await event;await file.saveAs('test-results/glb-people.spazio.json');const data=JSON.parse(await fs.readFile('test-results/glb-people.spazio.json','utf8'));assert.equal(data.objects.filter(o=>o.type.startsWith('person')).length,9);assert.ok(data.objects.some(o=>o.type==='person-sophia'&&o.h===1.9));await page.locator('[data-action="close"]').click();
await page.locator('.top-actions [data-action="visit"]').click();await ready();await page.screenshot({path:'test-results/glb-people-visit.png'});await page.keyboard.press('Escape');
for(const [url,count] of requests)assert.equal(count,1,'Il GLB non deve essere riscaricato a ogni modifica: '+url);assert.equal(requests.size,6);
await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/glb-people-mobile.png',fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
await browser.close();assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);console.log('Sei GLB: caricamento, cache, catalogo, altezza, duplicazione, esportazione, visita e mobile OK.');

