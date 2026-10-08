import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1100}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:4175/studio?start=new');await page.locator('#new-form button[type=submit]').click();
 assert.ok((await page.locator('[data-field="room.width"]').boundingBox()).y<(await page.locator('.plan-tools').boundingBox()).y);
 const r=await page.locator('#plan').boundingBox(),scale=Math.min((r.width-110)/12,(r.height-170)/9);
 const click=async(x,z)=>page.mouse.click(r.x+r.width/2+x*scale,r.y+r.height/2+z*scale);
 for(const [i,type] of ['door','window','opening'].entries()){
  await page.locator(`[data-tool=${type}]`).click();await click(-3+i*3,4.5);
  const field=page.locator('#properties [data-field$=".width"]');await field.fill('1.4');await field.press('Tab');assert.equal(await field.inputValue(),'1.4');
 }
 for(const name of ['Porta','Finestra','Apertura']){await page.locator('#object-list .list-item').filter({hasText:name}).click();assert.ok(await page.locator('#properties [data-field$=".height"]').isVisible());}
 await page.locator('[data-tool=floor-area]').click();await click(-2,-1);await click(1,1);
 assert.equal(await page.locator('[data-field=w]').inputValue(),'3');assert.equal(await page.locator('[data-field=d]').inputValue(),'2');
 await page.locator('[data-field=w]').fill('4');await page.locator('[data-field=w]').press('Tab');
 await page.locator('[data-mode=layout]').click();await page.locator('[data-mode=space]').click();
 await page.locator('.top-actions summary').click();const chooser=page.waitForEvent('filechooser');await page.locator('[data-action=reference]').click();await (await chooser).setFiles('assets/test-planimetrie/pianta-mano.png');
 await page.getByRole('button',{name:'Fine',exact:true}).click();const opacity=page.locator('#reference-controls input');await opacity.fill('17');await opacity.dispatchEvent('input');await opacity.dispatchEvent('change');assert.equal(await page.locator('#reference-controls output').textContent(),'17%');
 await page.waitForTimeout(650);
 const saved=await page.evaluate(()=>new Promise(resolve=>{const req=indexedDB.open('spazio-studio');req.onsuccess=()=>{const db=req.result,r=db.transaction('projects').objectStore('projects').get('current');r.onsuccess=()=>resolve(r.result);};}));
 assert.equal(saved.reference.opacity,.17);assert.equal(saved.objects.find(o=>o.type==='floor-area').w,4);assert.equal(saved.walls.flatMap(w=>w.openings).length,3);
 await page.screenshot({path:'test-results/architecture-reference.png'});assert.deepEqual(errors,[]);
 console.log('PASS: ordine pannelli, porte/finestre/aperture selezionabili e modificabili, superficie 2D/3D, opacità e salvataggio.');
}finally{await browser.close();}

