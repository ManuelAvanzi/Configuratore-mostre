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
 await page.setViewportSize({width:1440,height:810});
 for(const [name,position,target] of [
  ['luce',[-2.5,2.05,.2],[.7,1.7,-5.5]],
  ['terra',[-3.4,2.05,-2.6],[-8.85,1.8,-4]],
  ['soglia',[3.4,2.05,-2.5],[8.85,1.8,-4]]
 ]){
  const result=await page.evaluate(async({position,target})=>{
   const s=window.galleryPhoto;s.renderer.setAnimationLoop(null);s.resize();s.camera.fov=60;s.camera.updateProjectionMatrix();s.ceiling.visible=true;
   s.camera.position.set(...position);s.camera.lookAt(...target);s.renderFrame();
   const stream=s.renderer.domElement.captureStream(30),mime=MediaRecorder.isTypeSupported('video/webm;codecs=vp9')?'video/webm;codecs=vp9':'video/webm';
   const recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:6500000}),chunks=[];
   recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
   const stopped=new Promise(resolve=>recorder.onstop=resolve);let frames=0;const start=performance.now();recorder.start();
   await new Promise(resolve=>{function tick(now){const t=Math.min((now-start)/8000,1),sweep=t*.44;
    s.camera.position.set(position[0]+sweep,position[1],position[2]-sweep*.4);s.camera.lookAt(...target);s.renderFrame();frames++;
    if(t<1)requestAnimationFrame(tick);else resolve();}requestAnimationFrame(tick);});
   recorder.stop();await stopped;stream.getTracks().forEach(t=>t.stop());
   const blob=new Blob(chunks,{type:mime}),data=await new Promise(resolve=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.readAsDataURL(blob);});return {data,frames};
  },{position,target});
  await fs.writeFile(`public/marketing/hero-${name}-forward.webm`,Buffer.from(result.data.split(',')[1],'base64'));console.log(name,result.frames+' frames');
 }
 if(errors.length)throw Error(errors.join('\n'));console.log('Tre scene, con fotografie dedicate a desktop e mobile.');
}finally{await browser.close();}
