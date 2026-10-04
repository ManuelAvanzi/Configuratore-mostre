import {chromium,expect} from '@playwright/test';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://localhost:5173/');
 await expect(page.locator('.hero-scene').first()).toHaveAttribute('src','/marketing/spazio-luce.webp');
 await page.waitForFunction(()=>[...document.querySelectorAll('.hero-scene')].every(i=>i.complete&&i.naturalWidth));
 await page.waitForTimeout(1200);await page.screenshot({path:'output/colore-luci/landing-desktop.png'});
 await page.locator('[data-scene="1"]').click();await expect(page.locator('[data-scene="1"]')).toHaveAttribute('aria-pressed','true');
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(1000);
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Mobile overflow');
 await page.screenshot({path:'output/colore-luci/landing-mobile.png'});
 await page.setViewportSize({width:1440,height:1000});
 await page.locator('.hero-actions a[href="/studio?example=colore-luci"]').click();
 await expect(page.locator('#project-name')).toHaveValue('Abitare il colore — Edizione luce',{timeout:60000});
 await expect(page.locator('#scene')).toHaveAttribute('data-loading-models','0',{timeout:60000});
 await page.locator('.list-item').filter({hasText:'Faro / Luce sinistra'}).click();
 for(const [key,val] of [['intensity','0'],['beamAngle','55'],['tilt','45']]){
  await page.locator(`[data-field=${key}]`).fill(val);await page.locator(`[data-field=${key}]`).press('Tab');
 }
 await expect(page.locator('#save-state')).toContainText('salvata');await page.reload();
 await expect(page.locator('#project-name')).toHaveValue('Abitare il colore — Edizione luce',{timeout:60000});
 await page.locator('.list-item').filter({hasText:'Faro / Luce sinistra'}).click();
 await expect(page.locator('[data-field=intensity]')).toHaveValue('0');await expect(page.locator('[data-field=beamAngle]')).toHaveValue('55');
 await page.locator('[data-mode=space]').click();await page.locator('[data-field="lighting.ambient"]').fill('0.6');await page.locator('[data-field="lighting.ambient"]').press('Tab');
 if(errors.length)throw Error(errors.join('\n'));console.log('Landing desktop/mobile, collegamento mostra, controlli fari e persistenza verificati.');
}finally{await browser.close();}
