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
 for(const mobile of [false,true]){
 await page.setViewportSize(mobile?{width:900,height:1400}:{width:1920,height:1080});
 for(const [name,position,target] of (mobile?[
  ['hero-luce',[.9,2,2.8],[.9,1.4,-4.2]],
  ['hero-terra',[-2.4,2,-3.8],[-8.85,2,-3.8]],
  ['hero-soglia',[2.4,2,-3.9],[8.85,2,-3.9]]
 ]:[
  ['hero-luce',[-2.5,2.05,.2],[.7,1.7,-5.5]],
  ['hero-terra',[-3.4,2.05,-2.6],[-8.85,1.8,-4]],
  ['hero-soglia',[3.4,2.05,-2.5],[8.85,1.8,-4]]
 ])){
  await page.evaluate(({position,target})=>{const s=window.galleryPhoto;s.resize();s.camera.fov=60;s.camera.updateProjectionMatrix();s.camera.position.set(...position);s.camera.lookAt(...target);s.camera.rotation.reorder('YXZ');s.yaw=s.camera.rotation.y;s.pitch=s.camera.rotation.x;},{position,target});
  await page.waitForTimeout(1400);
  const png=await page.evaluate(()=>window.galleryPhoto.screenshot());
  const bytes=Buffer.from(png.split(',')[1],'base64'),suffix=mobile?'-mobile':'';
  await fs.writeFile(`output/colore-luci/${name}${suffix}.png`,bytes);
  await sharp(bytes).webp({quality:93}).toFile(`public/marketing/${name}${suffix}.webp`);
 }}
 if(errors.length)throw Error(errors.join('\n'));console.log('Tre scene, con fotografie dedicate a desktop e mobile.');
}finally{await browser.close();}
