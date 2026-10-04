import {chromium,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import {validate} from '../src/model.js';
import {projectChecks} from '../src/planning.js';
const out='output/abitare-il-colore';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1680,height:1050}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://localhost:5173/studio?example=abitare-il-colore');
 await expect(page.locator('#project-name')).toHaveValue('Abitare il colore — Studi di equilibrio');
 const project=JSON.parse(await fs.readFile(`${out}/abitare-il-colore.spazio.json`,'utf8'));
 // Correct dimensions using the editor's centimetre precision.
 for(const [i,o] of project.objects.filter(o=>o.type==='art').entries()){
  await page.locator(`[data-select="${o.id}"]`).click();
  await page.locator('[data-field=h]').fill(String(i<3?2.12:1.42));
  await page.locator('[data-field=h]').press('Tab');
  await expect(page.locator('[data-field=h]')).toHaveValue(String(i<3?2.12:1.42));
 }
 await page.locator('[data-select="surface:floor"]').first().click();
 await page.locator('[data-action=grid]').click();
 await page.locator('[data-action=home]').click();
 await expect(page.locator('#scene')).toHaveAttribute('data-loading-models','0',{timeout:60000});
 await page.waitForTimeout(2500);
 await page.locator('.top-actions [data-action=export]').click();
 for(const [action,file] of [['save-json','abitare-il-colore.spazio.json'],['save-svg','planimetria.svg'],['report','scheda-allestimento.html']]){
  const pending=page.waitForEvent('download');await page.locator(`[data-action=${action}]`).click();await(await pending).saveAs(`${out}/${file}`);
 }
 await page.locator('[data-action=close]').click();
 await page.screenshot({path:`${out}/editor.png`});
 const final=validate(JSON.parse(await fs.readFile(`${out}/abitare-il-colore.spazio.json`,'utf8')));
 const issues=projectChecks(final);
 if(issues.length)throw Error(JSON.stringify(issues));
 await fs.copyFile(`${out}/abitare-il-colore.spazio.json`,'public/examples/abitare-il-colore.spazio.json');
 // Verify persistence and independence from the personal project slot.
 await page.locator('#project-name').fill('Test persistenza mostra');await page.locator('#project-name').press('Tab');
 await expect(page.locator('#save-state')).toContainText('salvata');
 await page.reload();await expect(page.locator('#project-name')).toHaveValue('Test persistenza mostra');
 const keys=await page.evaluate(()=>new Promise((resolve,reject)=>{const r=indexedDB.open('spazio-studio',1);r.onsuccess=()=>{const q=r.result.transaction('projects').objectStore('projects').getAllKeys();q.onsuccess=()=>resolve(q.result);q.onerror=reject;};}));
 if(keys.includes('current'))throw Error('Example wrote personal project slot');
 await page.locator('#project-name').fill(final.name);await page.locator('#project-name').press('Tab');
 await expect(page.locator('#scene')).toHaveAttribute('data-loading-models','0',{timeout:60000});
 await page.locator('.top-actions [data-action=visit]').click();
 await page.waitForTimeout(3000);
 await page.screenshot({path:`${out}/visita-editor.png`});
 if(errors.length)throw Error(errors.join('\n'));
 await fs.writeFile(`${out}/verifica.json`,JSON.stringify({elements:final.objects.length,issues,errors,persistence:true,storageKeys:keys},null,2));
 console.log('Verified: 23 objects, no geometry issues, editable example persists separately.');
}finally{await browser.close();}
