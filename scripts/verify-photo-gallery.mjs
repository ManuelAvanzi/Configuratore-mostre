import {chromium,expect} from '@playwright/test';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://localhost:5173/');
 await expect(page.locator('.gallery-photo')).toHaveCount(6);
 await page.waitForFunction(()=>[...document.querySelectorAll('.hero-scene')].every(i=>i.complete&&i.naturalWidth));
 await page.waitForTimeout(1100);await page.screenshot({path:'output/colore-luci/gallery-desktop.png'});
 await page.locator('[data-gallery="0"]').click();await expect(page.locator('#photo-dialog')).toBeVisible();
 await page.keyboard.press('ArrowRight');await expect(page.locator('#photo-index')).toHaveText('2 / 6');
 await page.keyboard.press('Escape');await expect(page.locator('[data-gallery="0"]')).toBeFocused();
 for(const width of [1440,768,390]){
  await page.setViewportSize({width,height:900});await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(350);
  const measures=await page.evaluate(()=>{const im=document.querySelector('.hero-scene'),r=im.getBoundingClientRect();return {overflow:document.documentElement.scrollWidth>innerWidth,ratio:r.width/r.height,fit:getComputedStyle(im).objectFit,transform:getComputedStyle(im).transform};});
  if(measures.overflow||Math.abs(measures.ratio-16/9)>.01||measures.fit!=='contain'||measures.transform!=='none')throw Error(JSON.stringify({width,...measures}));
 }
 await page.screenshot({path:'output/colore-luci/gallery-mobile.png'});
 await page.locator('[data-gallery="5"]').click();await page.screenshot({path:'output/colore-luci/gallery-mobile-open.png'});
 await page.locator('[data-photo-next]').click();await expect(page.locator('#photo-index')).toHaveText('1 / 6');
 if(errors.length)throw Error(errors.join('\n'));console.log('Sei immagini, rapporto originale su tre viewport, navigazione e focus verificati.');
}finally{await browser.close();}
