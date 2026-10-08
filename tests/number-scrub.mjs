import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const b=await chromium.launch({channel:'chrome',headless:true});const page=await b.newPage({viewport:{width:1600,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:4175/studio?start=new');await page.locator('#new-form button[type=submit]').click();
 const input=page.locator('[data-field="room.width"]');const handle=input.locator('xpath=following-sibling::button');const r=await handle.boundingBox();await page.mouse.move(r.x+7,r.y+10);await page.mouse.down();await page.mouse.move(r.x+67,r.y+10,{steps:5});await page.mouse.up();assert.equal(await input.inputValue(),'12.2');
 const h=await input.locator('xpath=following-sibling::button').boundingBox();await page.mouse.move(h.x+7,h.y+10);await page.mouse.down();await page.mouse.move(h.x+67,h.y+10);await page.keyboard.press('Escape');await page.mouse.up();assert.equal(await input.inputValue(),'12.2');
 await page.locator('[data-tool=door]').click();const c=await page.locator('#plan').boundingBox(),s=Math.min((c.width-110)/12.2,(c.height-170)/9);await page.mouse.click(c.x+c.width/2,c.y+c.height/2+4.5*s);await page.locator('[data-mode=layout]').click();
 assert.equal(await page.locator('#stage-tools [data-action=move]').count(),0);await page.waitForTimeout(500);await page.screenshot({path:'test-results/selection-door-3d.png'});
 await page.locator('[data-category=Arredi]').click();await page.locator('[data-add=bench]').click();await page.waitForTimeout(300);await page.screenshot({path:'test-results/selection-object-3d.png'});
 assert.deepEqual(errors,[]);console.log('PASS scrub commit/cancel, toolbar and 3D opening/object outlines without runtime errors');
}finally{await b.close();}
