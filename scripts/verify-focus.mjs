import {chromium,expect} from '@playwright/test';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
try {
 await page.goto('http://localhost:5173/studio?example=colore-luci');
 await expect(page.locator('#project-name')).toHaveValue('Abitare il colore — Edizione luce',{timeout:60000});
 await expect(page.locator('.top-actions [data-action=undo]')).not.toBeVisible();
 await page.evaluate(async()=>{const url=performance.getEntriesByType('resource').map(e=>e.name).find(u=>/\/src\/scene\.js/.test(u));const {StudioScene}=await import(url);const focus=StudioScene.prototype.focusObject;StudioScene.prototype.focusObject=function(id){window.focusScene=this;return focus.call(this,id);};});
 await page.locator('[data-library-tab=objects]').click();
 const buttons=page.locator('[data-focus]');expect(await buttons.count()).toBe(50);
 await buttons.nth(4).click();
 await expect.poll(()=>page.evaluate(()=>!!window.focusScene&&!window.focusScene.focusTransition),{timeout:30000}).toBe(true);
 const result=await page.evaluate(()=>{const s=window.focusScene,o=s.project.objects.find(o=>o.id===s.selected);return {target:s.orbit.target.toArray(),expected:[o.x,o.y+o.h/2,o.z],distance:s.camera.position.distanceTo(s.orbit.target)};});
 expect(result.target).toEqual(result.expected);expect(result.distance).toBeGreaterThan(2);
 await page.screenshot({path:'output/review/focus-object.png'});
 await page.locator('[data-mode=space]').click();await page.locator('[data-focus]').first().click();
 await expect.poll(()=>page.evaluate(()=>!window.focusScene.focusTransition)).toBe(true);
 expect(await page.evaluate(()=>window.focusScene.orbit.target.toArray().every(Number.isFinite))).toBe(true);
 await page.locator('.top-actions summary').click();await expect(page.locator('.top-actions [data-action=export]')).toBeVisible();
 await page.locator('.workflow').click({position:{x:10,y:10}});await expect(page.locator('.top-actions [data-action=export]')).not.toBeVisible();
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
 await page.screenshot({path:'output/review/focus-mobile.png',fullPage:true});expect(errors).toEqual([]);
 console.log('OK: menu, focus oggetto, target camera, focus parete da pianta e mobile');
} finally {await browser.close();}
