import {chromium,expect} from '@playwright/test';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/WebGL|THREE|shader/i.test(m.text()))errors.push(m.text());});
try{
 await page.goto('http://localhost:5173/');
 await page.waitForFunction(()=>{const v=document.querySelector('.hero-film.active');return v&&v.currentTime>.2&&!v.paused;},{},{timeout:30000});
 await page.locator('#motion-toggle').click();
 const t=await page.locator('.hero-film.active').evaluate(v=>v.currentTime);await page.waitForTimeout(500);
 const t2=await page.locator('.hero-film.active').evaluate(v=>v.currentTime);if(Math.abs(t2-t)>.1)throw Error('Pause failed');
 await page.locator('#motion-toggle').click();await page.locator('[data-scene="1"]').click();
 await page.waitForFunction(()=>{const v=document.querySelectorAll('.hero-film')[1];return v.currentTime>.2&&!v.paused;});
 await page.emulateMedia({reducedMotion:'reduce'});if(!await page.locator('.hero-film').evaluateAll(vs=>vs.every(v=>v.paused)))throw Error('Reduced motion ignored');
 await page.emulateMedia({reducedMotion:'no-preference'});await page.setViewportSize({width:390,height:844});
 await page.waitForTimeout(300);if(!await page.locator('.hero-film').evaluateAll(vs=>vs.every(v=>v.paused)))throw Error('Mobile videos running');
 await page.setViewportSize({width:1440,height:1000});await page.goto('http://localhost:5173/studio?example=colore-luci');
 await expect(page.locator('#project-name')).toHaveValue('Abitare il colore — Edizione luce',{timeout:60000});
 await expect(page.locator('#scene')).toHaveAttribute('data-loading-models','0',{timeout:60000});
 await page.waitForTimeout(2000);await page.locator('.top-actions [data-action=visit]').click();await page.waitForTimeout(1000);
 await page.screenshot({path:'output/colore-luci/render-enhanced-visit.png'});
 await page.locator('[data-action=layout]').click();await page.locator('[data-mode=space]').click();await page.locator('[data-mode=layout]').click();
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(1000);
 if(errors.length)throw Error(errors.join('\n'));console.log('Video, pausa, cambio scena, reduced motion, mobile e renderer studio verificati.');
}finally{await browser.close();}
