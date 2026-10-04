import {chromium,expect} from '@playwright/test';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
await page.goto('http://localhost:5173/studio?example=colore-luci');
await expect(page.locator('#project-name')).toHaveValue('Abitare il colore — Edizione luce',{timeout:60000});
await page.waitForTimeout(3000);
await page.waitForTimeout(1400);await page.screenshot({path:'output/review/studio-updated.png'});
const stage=await page.locator('.stage').boundingBox();await page.locator('[data-action=toggle-library]').click();expect((await page.locator('.stage').boundingBox()).width).toBeGreaterThan(stage.width);await page.locator('[data-action=toggle-library]').click();
await page.locator('[data-library-tab=objects]').click();
const checks=page.locator('[data-multi]');await checks.nth(4).check();await checks.nth(5).check();await expect(page.locator('#properties h2')).toHaveText('2 elementi');
await page.locator('[data-arrange=align-center]').click();
const readSaved=()=>page.evaluate(()=>new Promise(resolve=>{const req=indexedDB.open('spazio-studio',1);req.onsuccess=()=>{const db=req.result;const q=db.transaction('projects').objectStore('projects').get('example:colore-luci');q.onsuccess=()=>{resolve(q.result);db.close();};};}));
await expect.poll(async()=>{const saved=await readSaved();const a=saved.objects[4],b=saved.objects[5];return Math.abs(a.y+a.h/2-b.y-b.h/2);}).toBeLessThan(.00001);
const originalX=(await readSaved()).objects[4].x;
await page.locator('#batch-offset').fill('0.25');await page.locator('[data-offset=x]').click();
const moved=await checks.nth(4).getAttribute('data-multi');
await expect.poll(async()=>{const saved=await readSaved();return saved.objects.find(o=>o.id===moved).x;}).toBeCloseTo(originalX+.25,5);
await expect(page.locator('[data-action=undo]').first()).toBeEnabled();
await page.locator('[data-action=duplicate]').click();await expect(page.locator('#count')).toHaveText('52 elementi');
await page.locator('[data-action=delete]').click();await expect(page.locator('#count')).toHaveText('50 elementi');
await page.locator('[data-action=undo]').first().click();await expect(page.locator('#count')).toHaveText('52 elementi');
await checks.nth(4).check();await checks.nth(5).check();await checks.nth(6).check();await page.screenshot({path:'output/review/multi-updated.png'});
await page.locator('[data-mode=space]').click();await expect(page.locator('#properties h2')).toHaveText('3 elementi');
await page.locator('.top-actions [data-action=visit]').click();await page.locator('[data-action=layout]').click();await expect(page.locator('#properties h2')).toHaveText('3 elementi');
await page.setViewportSize({width:390,height:844});await page.screenshot({path:'output/review/mobile-updated.png',fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
await page.reload();await expect(page.locator('#count')).toHaveText('52 elementi');expect(errors).toEqual([]);console.log('OK: pannelli, selezione multipla, allinea, duplica, elimina, annulla, pianta, visita, mobile');
}finally{await browser.close();}
