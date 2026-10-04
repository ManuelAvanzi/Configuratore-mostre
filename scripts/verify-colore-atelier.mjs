import {chromium,expect} from '@playwright/test';
import fs from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1680,height:1050}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://localhost:5173/studio?example=colore-atelier');
 await expect(page.locator('#project-name')).toHaveValue('Abitare il colore — Terra / Soglia / Luce');
 await expect(page.locator('#scene')).toHaveAttribute('data-loading-models','0',{timeout:60000});
 await expect(page.locator('#check-count')).toHaveText('0');
 await page.waitForTimeout(3500);
 await page.locator('[data-action=grid]').click();
 await page.screenshot({path:'output/colore-atelier/editor.png'});
 await page.locator('.top-actions [data-action=visit]').click();await page.waitForTimeout(1000);
 await page.screenshot({path:'output/colore-atelier/ingresso.png'});
 await page.keyboard.down('KeyW');await page.waitForTimeout(3500);await page.keyboard.up('KeyW');
 await page.screenshot({path:'output/colore-atelier/percorso.png'});
 await page.locator('[data-action=layout]').click();
 await page.locator('#project-name').fill('Verifica salvataggio');await page.locator('#project-name').press('Tab');
 await expect(page.locator('#save-state')).toContainText('salvata');
 await page.reload();await expect(page.locator('#project-name')).toHaveValue('Verifica salvataggio');
 const keys=await page.evaluate(()=>new Promise(resolve=>{const r=indexedDB.open('spazio-studio',1);r.onsuccess=()=>{const q=r.result.transaction('projects').objectStore('projects').getAllKeys();q.onsuccess=()=>resolve(q.result);};}));
 if(keys.includes('current')||keys.includes('example:abitare-il-colore'))throw Error('Unexpected storage write');
 if(errors.length)throw Error(errors.join('\n'));
 await fs.writeFile('output/colore-atelier/verifica-browser.json',JSON.stringify({errors,keys,persistence:true},null,2));
 console.log('Editor, visita, controlli e salvataggio separato verificati.');
}finally{await browser.close();}
