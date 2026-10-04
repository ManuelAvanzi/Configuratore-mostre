import {chromium,expect} from '@playwright/test';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://localhost:5173/templates');await expect(page.locator('.template-card')).toHaveCount(3);
 await page.locator('.template-use').first().click();await expect(page.locator('#project-name')).toHaveValue('Atlante della materia · la mia versione',{timeout:60000});await expect(page.locator('#area')).toHaveText('488 m²');
 const first=page.url();await page.locator('#project-name').fill('Il mio Atlante');await page.locator('#project-name').blur();await page.waitForTimeout(1500);await page.reload();await expect(page.locator('#project-name')).toHaveValue('Il mio Atlante');
 await page.goto('http://localhost:5173/studio?template=atlante-materia');await expect(page.locator('#project-name')).toHaveValue('Atlante della materia · la mia versione',{timeout:60000});expect(page.url()).not.toBe(first);await page.waitForTimeout(1200);
 await page.goto('http://localhost:5173/studio?template=corte-luce');await expect(page.locator('#area')).toHaveText('720 m²',{timeout:60000});await expect(page.locator('#check-count')).toHaveText('0');await page.waitForTimeout(2000);await page.screenshot({path:'output/review/template-studio.png'});
 await page.locator('[data-mode=space]').click();await expect(page.locator('[data-field="room.width"]')).toBeDisabled();await page.screenshot({path:'output/review/template-plan.png'});await page.locator('.top-actions [data-action=visit]').click();await page.waitForTimeout(1000);await page.locator('[data-action=layout]').click();
 await page.goto('http://localhost:5173/templates');await expect(page.locator('#template-drafts a')).toHaveCount(3);await expect(page.locator('#template-drafts')).toContainText('Il mio Atlante');await page.screenshot({path:'output/review/templates-gallery.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);await page.screenshot({path:'output/review/templates-mobile.png',fullPage:true});expect(errors).toEqual([]);console.log('OK: template, copie indipendenti, persistenza, aree, pianta, visita e mobile');
}finally{await browser.close();}
