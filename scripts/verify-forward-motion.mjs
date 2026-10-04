import {chromium,expect} from '@playwright/test';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://localhost:5173/');
 await page.waitForFunction(()=>document.querySelectorAll('.hero-film').length===3);
 await page.evaluate(()=>{
  window.completedFilms=[];
  document.querySelectorAll('.hero-film').forEach((v,i)=>{v.playbackRate=3;v.addEventListener('ended',()=>window.completedFilms.push(i));});
 });
 await page.waitForFunction(()=>window.completedFilms.length>=3,{},{timeout:40000});
 const result=await page.evaluate(()=>({ended:window.completedFilms.slice(0,3),loop:[...document.querySelectorAll('.hero-film')].some(v=>v.loop),sources:[...document.querySelectorAll('.hero-film')].map(v=>v.src)}));
 if(result.ended.join(',')!=='0,1,2'||result.loop||result.sources.some(s=>!s.includes('-forward.webm')))throw Error(JSON.stringify(result));
 await page.locator('#motion-toggle').click();
 await expect(page.locator('#motion-toggle')).toHaveAttribute('aria-pressed','true');
 if(!await page.locator('.hero-film').evaluateAll(vs=>vs.every(v=>v.paused)))throw Error('Pause failed');
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.setViewportSize({width:390,height:844});
 const direction=await page.locator('.hero-scene.active').evaluate(el=>getComputedStyle(el).animationDirection);
 if(direction.includes('alternate'))throw Error('Mobile reverses');
 if(errors.length)throw Error(errors.join('\n'));
 console.log('Fine reale dei tre filmati -> scena successiva; nessun loop; pausa e mobile verificati.');
}finally{await browser.close();}
