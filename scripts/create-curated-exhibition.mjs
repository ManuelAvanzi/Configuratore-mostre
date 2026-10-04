// Creates a complete example through the editor UI in an isolated browser session.
import {chromium,expect} from '@playwright/test';
import sharp from 'sharp';
import fs from 'node:fs/promises';
import {validate} from '../src/model.js';
import {projectChecks} from '../src/planning.js';

const out='output/abitare-il-colore';
await fs.mkdir(`${out}/opere`,{recursive:true});
const palettes=[['#f0e6d5','#b85537','#dba96a','#273d53'],['#f5ead3','#d2a438','#e2c375','#51402e'],['#eeeadd','#294768','#7c9ca1','#b16447']];
for(let i=0;i<7;i++){
 const [paper,a,b,c]=palettes[i%3],landscape=i>2,w=landscape?1400:1000,h=landscape?950:1250;
 const shapes=landscape?`<rect x="95" y="95" width="1210" height="760" fill="${b}"/><path d="M95 555 Q390 200 705 525 T1305 350 V855 H95Z" fill="${a}"/><circle cx="${940-i*37}" cy="300" r="145" fill="${paper}"/><path d="M95 710 Q450 420 790 660 T1305 580 V855 H95Z" fill="${c}"/><path d="M150 755 H1240" stroke="${paper}" stroke-width="3"/>`:`<rect x="95" y="95" width="810" height="1060" fill="${b}"/><path d="M175 990 V500 A325 325 0 0 1 825 500 V990Z" fill="${a}"/><circle cx="${i===1?530:500}" cy="${i===2?570:440}" r="${i===1?225:190}" fill="${paper}"/><rect x="${i===2?285:510}" y="${i===1?740:685}" width="250" height="360" fill="${c}"/><path d="M200 1100 H800" stroke="${paper}" stroke-width="3"/>`;
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="${paper}"/>${shapes}</svg>`;
 await fs.writeFile(`${out}/opere/studio-${i+1}.svg`,svg);
 await sharp(Buffer.from(svg)).png().toFile(`${out}/opere/studio-${i+1}.png`);
}
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1680,height:1050}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
async function field(key,value){const el=page.locator(`[data-field="${key}"]`);await el.fill(String(value));await el.press('Tab');}
async function text(key,value){const el=page.locator(`[data-text="${key}"]`);await el.fill(value);await el.press('Tab');}
async function color(value){await page.locator('[data-color=object]').fill(value);await page.locator('[data-color=object]').dispatchEvent('change');}
async function surface(material,tint){await page.locator(`[data-material="${material}"]`).click();if(tint){const el=page.locator('[data-surface-field=color]').last();await el.fill(tint);await el.press('Tab');}}
async function add(type,name,props={},material){await page.locator(`[data-add="${type}"]`).click();await text('name',name);for(const [key,value] of Object.entries(props))await field(key,value);if(material)await surface(material);}
async function artwork(index,name,x,z,rotation=0){await page.locator('[data-action=image]').click();await page.locator('#file').setInputFiles(`${out}/opere/studio-${index+1}.png`);await text('name',name);for(const[k,v]of Object.entries({w:index<3?1.7:2.1,h:index<3?2.12:1.42,d:.05,x,z,y:index<3?.6:.95,rotation}))await field(k,v);}
async function panel(name,content,props){await add('panel',name,props);await text('text',content);await color('#f5efe2');}
async function download(action,path){const pending=page.waitForEvent('download');await page.locator(`[data-action="${action}"]`).click();await(await pending).saveAs(path);}
try{
 await page.goto('http://localhost:5173/studio?start=new');
 await page.locator('[name=name]').fill('Abitare il colore — Studi di equilibrio');await page.locator('[name=width]').fill('14');await page.locator('[name=depth]').fill('10');await page.locator('#new-form button').click();
 // Place a real 1.8 m opening in the entrance wall using the plan tool.
 await page.locator('[data-tool=door]').click();const r=await page.locator('#plan').boundingBox(),scale=Math.min((r.width-110)/14,(r.height-170)/10);await page.mouse.click(r.x+r.width/2,r.y+r.height/2+5*scale);
 const doorWidth=page.locator('[data-field^="opening."][data-field$=".width"]');await doorWidth.fill('1.8');await doorWidth.press('Tab');
 const doorOffset=page.locator('[data-field^="opening."][data-field$=".offset"]');await doorOffset.fill('6.1');await doorOffset.press('Tab');
 await page.locator('[data-mode=layout]').click();
 await page.locator('[data-select="surface:floor"]').first().click();await surface('oak');
 await page.locator('#surface-wall').selectOption({label:'Parete 1'});await surface('plaster','#e9e1d2');await page.locator('[data-action=all-walls]').click();
 // A muted blue end wall gives the central triptych a shared visual field.
 await surface('paint','#53636a');await page.locator('[data-action=both-sides]').click();
 console.log('Ambiente, ingresso e materiali creati attraverso editor.');
 await artwork(0,'01 · Terra',-4.1,-4.87);await artwork(1,'02 · Luce',-1.15,-4.87);await artwork(2,'03 · Oltremare',1.8,-4.87);
 await panel('Introduzione alla mostra','ABITARE\nIL COLORE\n\nStudi di equilibrio\n\nSette composizioni.\nTre famiglie cromatiche.\nUn invito a osservare\nle relazioni tra forme,\nmateriali e distanze.\n\nSpazio / Mostra di studio',{w:1.5,h:2.1,d:.04,x:4.85,z:-4.87,y:.6});
 await artwork(3,'04 · Orizzonte di terra',6.87,-2.65,-90);await artwork(4,'05 · Luce distante',6.87,.6,-90);
 await artwork(5,'06 · Mare interno',-6.87,-2.65,90);await artwork(6,'07 · Paesaggio sospeso',-6.87,.6,90);
 await add('plinth','Basamento · Equilibrio',{w:.95,d:.95,h:.72,x:.5,z:.25},'stone');
 await add('sculpture','Equilibrio · studio plastico',{w:.8,d:.8,h:1.35,x:.5,z:.25,y:.72});await color('#a36843');
 await add('bench','Sosta · osservare il trittico',{w:2.4,d:.6,h:.44,x:2.7,z:2.5},'dark-wood');
 await add('bench','Sosta · paesaggi',{w:1.8,d:.55,h:.44,x:-3.6,z:2.45,rotation:90},'dark-wood');
 await panel('Testo curatoriale · Paesaggi','PAESAGGI\nINTERIORI\n\nUna curva diventa\nun orizzonte.\nUn colore diventa\nuna distanza.\n\nPrenditi il tempo\ndi cambiare\npunto di vista.',{w:1.2,h:1.65,d:.04,x:-6.87,z:3.25,y:.65,rotation:90});
 await panel('Testo curatoriale · Materia','MATERIA\nE RELAZIONI\n\nIl centro della sala\nmette in dialogo\nvolume e superficie.\n\nGira attorno\nalla scultura:\nle forme cambiano\ncon il tuo sguardo.',{w:1.2,h:1.65,d:.04,x:6.87,z:3.3,y:.65,rotation:-90});
 await add('person-sophia','Visitatrice · osservazione del trittico',{h:1.7,x:-1.8,z:-2.25,rotation:175});
 await add('person-grey-blazer','Visitatore · percorso laterale',{h:1.8,x:4.6,z:.1,rotation:-90});
 // Small wall captions, below each work, with no overlap with artwork volumes.
 for(const[index,name,x,z,rotation]of [[1,'TERRA',-4.1,-4.87,0],[2,'LUCE',-1.15,-4.87,0],[3,'OLTREMARE',1.8,-4.87,0],[4,'ORIZZONTE DI TERRA',6.87,-2.65,-90],[5,'LUCE DISTANTE',6.87,.6,-90],[6,'MARE INTERNO',-6.87,-2.65,90],[7,'PAESAGGIO SOSPESO',-6.87,.6,90]]){
   await panel(`Didascalia ${index}`,`${String(index).padStart(2,'0')} / ${name}\nComposizione grafica originale\nStudio di forma e colore`,{w:.85,h:.25,d:.02,x,z,y:.24,rotation});
 }
 console.log('Opere, scultura, pannelli, sedute e visitatori collocati.');
 await page.locator('[data-action=grid]').click();await page.locator('[data-action=home]').click();
 await page.waitForFunction(()=>document.querySelector('#scene').dataset.loadingMaterials==='0'||!document.querySelector('#scene').dataset.loadingMaterials);
 await expect(page.locator('#scene')).toHaveAttribute('data-loading-models','0',{timeout:60000});
 await page.waitForTimeout(2500);
 await page.locator('.top-actions [data-action=export]').click();await download('save-json',`${out}/abitare-il-colore.spazio.json`);await download('save-svg',`${out}/planimetria.svg`);await download('report',`${out}/scheda-allestimento.html`);await page.locator('[data-action=close]').click();
 const project=validate(JSON.parse(await fs.readFile(`${out}/abitare-il-colore.spazio.json`,'utf8')));const issues=projectChecks(project);await fs.writeFile(`${out}/verifica.json`,JSON.stringify({elements:project.objects.length,issues,errors},null,2));
 if(issues.length)console.log('Segnalazioni:',JSON.stringify(issues));
 await page.screenshot({path:`${out}/editor.png`});
 await page.locator('.top-actions [data-action=visit]').click();await page.waitForTimeout(2500);
 await page.screenshot({path:`${out}/visita-editor.png`});
 if(errors.length)throw Error(errors.join('\n'));
 console.log(`Mostra esportata: ${project.objects.length} elementi, ${issues.length} segnalazioni geometriche.`);
}finally{await browser.close();}
