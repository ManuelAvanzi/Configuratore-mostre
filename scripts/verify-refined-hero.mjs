import {chromium,expect} from '@playwright/test';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 for(const [width,height,name] of [[1440,1000,'desktop'],[390,844,'mobile']]){
  await page.setViewportSize({width,height});await page.goto('http://localhost:5173/');
  await expect(page.locator('.hero-scene')).toHaveCount(3);await expect(page.locator('.photo-gallery')).toHaveCount(0);
  await page.waitForFunction(()=>[...document.querySelectorAll('.hero-scene')].every(i=>i.complete&&i.naturalWidth));
  await page.locator('#motion-toggle').click();
  for(let i=0;i<3;i++){
   await page.locator(`[data-scene="${i}"]`).click();await page.waitForTimeout(1700);
   await expect(page.locator(`[data-scene="${i}"]`)).toHaveAttribute('aria-pressed','true');
   await page.screenshot({path:`output/colore-luci/refined-${name}-${i}.png`});
  }
  const info=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,height:document.querySelector('.cinema-hero').getBoundingClientRect().height,source:document.querySelector('.hero-scene').currentSrc}));
  if(info.overflow||Math.abs(info.height-height)>2||((width<700)!==info.source.includes('-mobile')))throw Error(JSON.stringify(info));
 }
 if(errors.length)throw Error(errors.join('\n'));console.log('Tre scene full screen, fonti desktop/mobile e selettori verificati.');
}finally{await browser.close();}
