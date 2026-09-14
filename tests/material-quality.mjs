import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import sharp from 'sharp';
import {materials} from '../src/surfaces.js';
const base=process.env.SPAZIO_TEST_URL||'http://localhost:5173';
assert.equal(materials.length,20);assert.equal(new Set(materials.map(m=>m.asset).filter(Boolean)).size,18);
for(const m of materials.filter(m=>m.asset))for(const [map,size] of [['color',2048],['normal',1024],['roughness',1024]]){const meta=await sharp(`public/materials/${m.asset}/${map}.webp`).metadata();assert.equal(meta.width,size);assert.equal(meta.height,size);}
const browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],failed=[],requests=new Map();
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)failed.push(r.url());});page.on('request',r=>{if(/\/materials\/.*\/(color|normal|roughness)\.webp/.test(r.url()))requests.set(r.url(),(requests.get(r.url())||0)+1);});
const ready=()=>page.locator('#scene[data-loading-materials="0"]').waitFor({timeout:30000});
try{
 await page.goto(base+'/studio?start=new');await page.locator('[name=name]').fill('Campioni materiali HD');await page.locator('#new-form button').click();await page.locator('[data-mode=layout]').click();await page.locator('[data-select="surface:floor"]').first().click();await page.locator('[data-action=grid]').click();
 assert.equal(await page.locator('[data-material]').count(),20);
 await page.locator('#material-category').selectOption('Legni');assert.equal(await page.locator('[data-material]:visible').count(),4);await page.locator('[data-material=oak]').click();await ready();await page.screenshot({path:'test-results/materials-hd-parquet.png'});
 await page.locator('#material-category').selectOption('Tutti');
 for(const m of materials.filter(m=>m.asset)){await page.locator(`[data-material="${m.id}"]`).click();await ready();}
 await page.locator('[data-material=dark-marble]').click();await ready();await page.screenshot({path:'test-results/materials-hd-marble.png'});
 await page.locator('#surface-wall').selectOption({label:'Parete 1'});await page.locator('[data-material=brick]').click();await ready();await page.locator('[data-action=all-walls]').click();await ready();
 const before=[...requests].filter(([url])=>url.includes('/Bricks097/'));await page.locator('[data-surface-field=color]').last().fill('#dddddd');await page.locator('[data-surface-field=color]').last().press('Tab');await ready();assert.deepEqual([...requests].filter(([url])=>url.includes('/Bricks097/')),before);
 await page.locator('[data-material=paint]').click();await page.locator('[data-action=all-walls]').click();await page.locator('[data-select="surface:floor"]').first().click();await page.locator('[data-material=oak]').click();await ready();await page.screenshot({path:'test-results/materials-hd-editor.png'});
 await page.locator('.top-actions [data-action=visit]').click();await page.screenshot({path:'test-results/materials-hd-visit.png'});await page.locator('.visit-top [data-action=layout]').click();await ready();
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/materials-hd-mobile.png',fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);console.log('PASS: 20 materiali, 18 set PBR con risoluzioni verificate, tutti caricati, filtri, riuso mappe, visita, desktop/mobile e nessuna risorsa mancante.');
}finally{await browser.close();}
