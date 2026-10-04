// Uses the application's unmodified StudioScene renderer, with deliberate camera positions.
import {chromium} from '@playwright/test';
import sharp from 'sharp';
import fs from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1920,height:1080}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://localhost:5173/');
 await page.evaluate(async()=>{
  const {StudioScene}=await import('/src/scene.js');
  document.body.innerHTML='<div id="photo" style="position:fixed;inset:0;width:100vw;height:100vh"></div>';
  const scene=new StudioScene(document.querySelector('#photo'),()=>{},()=>{},console.log);
  const p=await(await fetch('/examples/colore-luci.spazio.json')).json();
  scene.build(p);scene.setVisit(true);scene.resize();window.galleryPhoto=scene;
 });
 await page.waitForFunction(()=>window.galleryPhoto.pendingModels===0,{},{timeout:60000});
 await page.waitForTimeout(7000);
 for(const [name,position,target] of [
  ['spazio-luce',[0,2.1,1.8],[0,1.6,-6.5]],
  ['spazio-terra',[-3.1,1.95,-4],[-8.85,1.95,-3.8]],
  ['spazio-scultura',[5,2.1,-.8],[.8,1.3,-4.5]],
  ['spazio-soglia',[3.1,1.95,-4],[8.85,1.95,-3.9]],
  ['spazio-ingresso',[.5,2.1,7.6],[-4.3,1.45,5.1]],
  ['spazio-risonanze',[.5,1.85,6.5],[5.3,1.3,4.5]]
 ]){
  await page.evaluate(({position,target})=>{const s=window.galleryPhoto;s.camera.fov=60;s.camera.updateProjectionMatrix();s.camera.position.set(...position);s.camera.lookAt(...target);s.camera.rotation.reorder('YXZ');s.yaw=s.camera.rotation.y;s.pitch=s.camera.rotation.x;},{position,target});
  await page.waitForTimeout(1200);
  const png=await page.evaluate(()=>window.galleryPhoto.screenshot());
  const bytes=Buffer.from(png.split(',')[1],'base64');
  await fs.writeFile(`output/colore-luci/${name}.png`,bytes);
  await sharp(bytes).webp({quality:90}).toFile(`public/marketing/${name}.webp`);
 }
 if(errors.length)throw Error(errors.join('\n'));console.log('Sei fotografie del renderer Spazio salvate.');
}finally{await browser.close();}
