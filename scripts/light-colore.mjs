import fs from 'node:fs/promises';
import {item,uid,validate} from '../src/model.js';
import {projectChecks} from '../src/planning.js';
const p=JSON.parse(await fs.readFile('public/examples/colore-atelier.spazio.json','utf8'));
p.id=uid();p.name='Abitare il colore — Edizione luce';p.lighting={ambient:.42,daylight:.12,environment:.22};
function spot(name,x,z,tx,ty,tz,intensity=65,beamAngle=48,castShadow=false){
 const y=3.85,dx=tx-x,dy=ty-y,dz=tz-z,len=Math.hypot(dx,dy,dz);
 p.objects.push({...item('light',x,z),name,y,w:.25,h:.23,d:.25,intensity,beamAngle,tilt:Math.acos(-dy/len)*180/Math.PI,rotation:Math.atan2(-dx,-dz)*180/Math.PI,color:'#ffe2b5',castShadow});
}
spot('Faro / Luce sinistra',-1.7,-5.7,-1.5,2,-7.85,40,75,true);
spot('Faro / Luce destra',1.7,-5.7,1.5,2,-7.85,40,75,true);
spot('Faro / Terra',-6.5,-3.8,-8.85,2,-3.8,70,85,true);
spot('Faro / Soglia',6.5,-3.9,8.85,2,-3.9,70,85,true);
spot('Faro / Nodo',2.5,-2.7,1.1,1.4,-3.75,55,38);
spot('Faro / Studi Terra',-4.9,2.6,-4.9,1.8,.65,60,65);
spot('Faro / Studio Soglia',4.1,1.7,4.1,1.8,-.25,48,45);
spot('Faro / Paesaggio Terra',-4.6,-1.6,-4.6,1.8,.32,50,60);
spot('Faro / Paesaggio Soglia',4.7,-2.5,4.7,1.8,-.57,50,60);
spot('Faro / Prologo',-4.3,6.9,-4.3,1.8,5.27,65,70);
spot('Faro / Risonanze',5.2,5.9,5.2,1,4.5,60,55);
for(const [name,x,z,w,rotation] of [['Binario / Terra',-6.5,-1,12,90],['Binario / Soglia',6.5,-1,12,90],['Binario / Luce',0,-5.7,7,0]])p.objects.push({...item('scenery',x,z),name,w,h:.06,d:.07,y:4.08,rotation,color:'#222725'});
validate(p);const issues=projectChecks(p);if(issues.length)throw Error(JSON.stringify(issues));
await fs.writeFile('public/examples/colore-luci.spazio.json',JSON.stringify(p));
console.log(`${p.objects.length} elementi, 11 fari, nessuna intersezione.`);
