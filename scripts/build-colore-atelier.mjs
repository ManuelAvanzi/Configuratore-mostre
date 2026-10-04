import fs from 'node:fs/promises';
import sharp from 'sharp';
import {createProject,item,uid,validate} from '../src/model.js';
import {preset} from '../src/surfaces.js';
import {projectChecks} from '../src/planning.js';
const out='output/colore-atelier';await fs.mkdir(out,{recursive:true});
const p=createProject(18,16,'Abitare il colore — Terra / Soglia / Luce');p.height=4.2;
const finish=(id,color)=>({...preset(id),...(color?{color}:{})});
p.floorSurface=finish('terrazzo','#e8e0d2');p.floorSurface.scale=2.5;
for(const w of p.walls){w.height=4.2;w.surfaces={a:finish('plaster','#eee4d3'),b:finish('plaster','#eee4d3')};}
p.walls[0].surfaces={a:finish('paint','#293e3c'),b:finish('paint','#293e3c')};
p.walls[2].openings=[{id:uid(),type:'door',offset:7.8,width:2.4,height:3.2,sill:0}];
const add=(type,name,x,z,props={})=>{const o=Object.assign(item(type,x,z),{name},props);p.objects.push(o);return o;};
const image=async file=>'data:image/webp;base64,'+(await sharp(file).resize({width:1800,withoutEnlargement:true}).webp({quality:91}).toBuffer()).toString('base64');
const art=async(name,file,x,z,w,h,y=.75,rotation=0)=>add('art',name,x,z,{w,h,y,rotation,d:.05,image:await image(file)});
const graphic=async(name,lines,x,z,w,h,y,rotation=0,bg='#eee5d4',fg='#293e3c')=>{
 const W=1200,H=Math.round(W*h/w),margin=90;
 const body=lines.map((l,i)=>`<text x="${margin}" y="${l.y}" fill="${fg}" font-family="${l.serif?'Georgia':'Arial'}" font-size="${l.size||35}" ${l.italic?'font-style="italic"':''} letter-spacing="${l.spacing||0}">${l.text.replaceAll('&','&amp;')}</text>`).join('');
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="100%" height="100%" fill="${bg}"/><path d="M90 75 H1110" stroke="${fg}" stroke-width="2"/>${body}<path d="M90 ${H-75} H1110" stroke="${fg}" stroke-width="1"/></svg>`;
 const file=`${out}/${name.replace(/[^a-z0-9]/gi,'-')}.png`;await sharp(Buffer.from(svg)).png().toFile(file);
 return art(name,file,x,z,w,h,y,rotation);
};
const partition=(name,x,z,w,color)=>add('partition',name,x,z,{w,h:3.25,d:.22,surface:finish('paint',color)});
partition('Prologo · quinta di ingresso',-4.3,5.1,5.8,'#293e3c');
partition('01 Terra · quinta bifacciale',-4.6,.5,5.6,'#985b45');
partition('02 Soglia · quinta bifacciale',4.7,-.4,4.7,'#293e3c');
await graphic('Prologo — Abitare il colore',[
 {text:'SPAZIO   /   COLLEZIONE DI STUDIO',y:145,size:28,spacing:4},
 {text:'Abitare',y:340,size:142,serif:true},{text:'il colore.',y:495,size:142,serif:true,italic:true},
 {text:'TERRA    /    SOGLIA    /    LUCE',y:630,size:34,spacing:5},
 {text:'Un percorso tra materia, silenzio e percezione.',y:735,size:31},
 {text:'Tre capitoli. Nessun punto di vista definitivo.',y:785,size:31},
 {text:'INIZIA DA SINISTRA  ←         ESPLORA CON CALMA',y:950,size:26,spacing:2}
],-4.3,5.25,3.6,3.05,.1,0,'#293e3c','#f0e2c7');
await art('01 · Sedimenti',`${out}/terra.png`,-8.87,-3.8,4.5,3,.65,90);
await art('02 · La soglia',`${out}/soglia.png`,8.87,-3.9,4.5,3,.65,-90);
await art('03 · Luce sospesa',`${out}/luce.png`,0,-7.87,5.4,3.6,.4);
// A smaller graphic collection sets up a deliberate contrast with the large material paintings.
const old='output/abitare-il-colore/opere';
await art('Terra · Studio I',`${old}/studio-1.png`,-6.05,.66,1.15,1.44,1.05);
await art('Terra · Studio II',`${old}/studio-2.png`,-3.8,.66,1.15,1.44,1.05);
await art('Soglia · Studio III',`${old}/studio-3.png`,4.1,-.24,1.25,1.56,1);
await art('Paesaggio / I',`${old}/studio-4.png`,-4.6,.34,3.5,2.38,.55,180);
await art('Paesaggio / II',`${old}/studio-6.png`,4.7,-.56,3.5,2.38,.55,180);
await art('Intervallo caldo',`${old}/studio-5.png`,-8.87,2.9,2.5,1.7,.95,90);
await art('Intervallo freddo',`${old}/studio-7.png`,8.87,3,2.5,1.7,.95,-90);
for(const [title,x,z,rot,desc] of [
 ['01 / TERRA',-8.86,-.55,90,['Il colore nasce dalla materia.','Strati, tracce, superfici.','Avvicinati. Poi fai un passo indietro.']],
 ['02 / SOGLIA',8.86,-.65,-90,['Il blu apre uno spazio interiore.','Tra il visibile e il possibile,','il tuo sguardo completa l’opera.']],
 ['03 / LUCE',4.3,-7.86,0,['La forma si dissolve nella luce.','Una pausa, prima di tornare','a guardare tutto diversamente.']]
 ])await graphic(title,[{text:title,y:200,size:77,serif:true},...desc.map((text,i)=>({text,y:340+i*65,size:37})),{text:'ABITARE IL COLORE  /  SPAZIO',y:720,size:25,spacing:2}],x,z,1.45,1.1,1.1,rot);
add('plinth','Isola scultorea · basamento',1.1,-3.75,{w:1.6,d:1.6,h:.55,surface:finish('dark-marble')});
add('sculpture','Nodo / continuità',1.1,-3.75,{w:1.2,d:1.2,h:1.75,y:.55,color:'#b78b53'});
// Three distinct monoliths create a second sculptural ensemble in the entrance lounge.
for(const [i,x,z,w,h,color] of [[1,4.2,4.5,.55,1.5,'#b7855e'],[2,5.15,4.4,.65,2.15,'#304d4a'],[3,6.15,4.7,.5,1.1,'#e5d2af']])
 add('scenery',`Risonanze / monolite ${i}`,x,z,{w,d:w,h,surface:finish(i===1?'worked-metal':'paint',color)});
add('bench','Sosta / grande opera',-.5,-5.5,{w:2.8,d:.65,h:.44,surface:finish('dark-wood')});
add('bench','Sosta / Terra',-6,-3.4,{w:2.4,d:.6,h:.44,rotation:90,surface:finish('dark-wood')});
add('bench','Sosta / Soglia',6.1,-3.5,{w:2.4,d:.6,h:.44,rotation:90,surface:finish('dark-wood')});
add('bench','Conversazione / ingresso',4.8,6.2,{w:3,d:.65,h:.44,surface:finish('dark-wood')});
await graphic('Risonanze — nota',[
 {text:'Risonanze',y:220,size:105,serif:true,italic:true},
 {text:'Tre volumi, tre altezze, un equilibrio.',y:360,size:38},
 {text:'Il vuoto tra le forme è parte dell’opera.',y:425,size:38},
 {text:'STUDIO SCULTOREO  /  2026',y:640,size:29,spacing:2}
],8.86,5.6,1.6,1.1,1.1,-90);
for(const [type,name,x,z,rotation] of [['person-sophia','Visitatrice / Terra',-6.8,-.95,80],['person-grey-blazer','Visitatore / Luce',-2.6,-5.85,170],['person-casual-15','Visitatore / Soglia',6,-1.85,-80]])add(type,name,x,z,{rotation});
// Discreet captions, placed beside or underneath each artwork.
for(const o of p.objects.filter(o=>o.type==='art'&&!o.name.includes('/')&&['01 · Sedimenti','02 · La soglia','03 · Luce sospesa','Terra · Studio I','Terra · Studio II','Soglia · Studio III'].includes(o.name))){
 const yy=o.y>.6?o.y-.3:.08;
 await graphic(`Didascalia ${o.name}`,[{text:o.name,y:155,size:58,serif:true},{text:'COLLEZIONE DI STUDIO  /  2026',y:245,size:27,spacing:2}],o.x,o.z,.9,.24,yy,o.rotation);
}
validate(p);const issues=projectChecks(p);await fs.writeFile(`${out}/verifica-geometria.json`,JSON.stringify(issues,null,2));
if(issues.length)throw Error(JSON.stringify(issues));
await fs.writeFile(`${out}/colore-atelier.spazio.json`,JSON.stringify(p));
await fs.copyFile(`${out}/colore-atelier.spazio.json`,'public/examples/colore-atelier.spazio.json');
console.log(`${p.objects.length} elementi, ${p.width*p.depth} m², nessuna intersezione.`);
