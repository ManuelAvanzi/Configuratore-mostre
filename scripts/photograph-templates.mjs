import {chromium} from '@playwright/test';
import sharp from 'sharp';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
for(const id of ['atlante-materia','corte-luce','colore-luci']){
 const page=await browser.newPage({viewport:{width:1600,height:1200}});
 await page.goto('http://localhost:5173/');
 await page.evaluate(async id=>{
 const {StudioScene}=await import('/src/scene.js');document.body.innerHTML='<div id="photo" style="position:fixed;inset:0"></div>';
 const scene=new StudioScene(document.querySelector('#photo'),()=>{},()=>{},console.log);const p=await(await fetch('/examples/'+id+'.spazio.json')).json();scene.build(p);scene.setVisit(true);scene.setVisitQuality('detail');scene.showCeiling=true;scene.cutaway=false;scene.showGrid=false;scene.grid.visible=false;scene.scene.background.set('#e0e3dc');const shots={'atlante-materia':{from:[-3,2.05,-3.7],to:[1,1.65,-10.6]},'corte-luce':{from:[4.5,2.1,-5.3],to:[9,1.65,-12.8]},'colore-luci':{from:[-2.5,2.05,.2],to:[.7,1.7,-5.5]}};const shot=shots[id];scene.camera.fov=57;scene.camera.updateProjectionMatrix();scene.camera.position.set(...shot.from);scene.camera.lookAt(...shot.to);scene.camera.rotation.reorder('YXZ');scene.yaw=scene.camera.rotation.y;scene.pitch=scene.camera.rotation.x;scene.resize();window.templateScene=scene;
 },id);
 await page.waitForFunction(async()=>window.templateScene.pendingModels===0&&(await import('/src/pbr-renderer.js')).materialsReady(),{},{timeout:60000});await page.waitForTimeout(4500);
 const data=await page.evaluate(()=>window.templateScene.screenshot());await sharp(Buffer.from(data.split(',')[1],'base64')).webp({quality:90}).toFile('public/templates/'+id+'.webp');await page.close();console.log('Fotografato',id);
}
}finally{await browser.close();}
