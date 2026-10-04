import {sculptureCatalog} from '../src/sculpture-catalog.js';
import fs from 'node:fs/promises';
import {createProject,item,uid,validate} from '../src/model.js';
import {preset} from '../src/surfaces.js';
import {projectChecks} from '../src/planning.js';
import {floorArea} from '../src/floor-plan.js';
const source=JSON.parse(await fs.readFile('public/examples/colore-luci.spazio.json','utf8'));
const paintings=source.objects.filter(o=>o.type==='art'&&o.image&&!/Didascalia|Prologo|nota|TERRA|SOGLIA|LUCE/.test(o.name));
await fs.mkdir('public/templates',{recursive:true});
for(const def of [
 {id:'atlante-materia',name:'Atlante della materia',w:32,d:24,outline:[[-16,-12],[16,-12],[16,-2],[-4,-2],[-4,12],[-16,12]],color:'#81503e',floor:'oak'},
 {id:'corte-luce',name:'Corte della luce',w:36,d:28,outline:[[-18,-14],[18,-14],[18,14],[8,14],[8,-4],[-8,-4],[-8,14],[-18,14]],color:'#263f48',floor:'stone'}
]){
 const p=createProject(def.w,def.d,def.name);p.height=4.5;p.floorOutline=def.outline.map(([x,z])=>({x,z}));p.floorSurface={...preset(def.floor),color:def.id==='atlante-materia'?'#eee1cc':'#f0eee8',scale:def.id==='atlante-materia'?2.4:3.5,finish:'satin'};p.lighting={ambient:.78,daylight:.5,environment:.38};
 const finish=color=>({...preset('painted-plaster'),color,scale:2.5});
 p.walls=p.floorOutline.map((a,i)=>{const b=p.floorOutline[(i+1)%p.floorOutline.length];return {id:uid(),ax:a.x,az:a.z,bx:b.x,bz:b.z,height:4.5,thickness:.2,openings:[],surfaces:{a:finish(i%3===0?def.color:'#e9e2d6'),b:finish('#e9e2d6')}};});
 const entry=p.walls.find(w=>w.az===def.d/2&&w.bz===def.d/2&&w.ax<0);entry.openings=[{id:uid(),type:'door',offset:3.5,width:3,height:3.3,sill:0}];
 const add=(type,name,x,z,props={})=>{const o={...item(type,x,z),name,...props};p.objects.push(o);return o;};
 let n=0,lights=0,sculptureIndex=0;
 const spot=(x,z,tx,tz,shadow=false)=>{const dx=tx-x,dz=tz-z,dy=-2.25;add('light','Faro curatoriale '+(++lights),x,z,{y:4.05,w:.22,h:.24,d:.22,intensity:60,beamAngle:85,tilt:Math.acos(-dy/Math.hypot(dx,dy,dz))*180/Math.PI,rotation:Math.atan2(-dx,-dz)*180/Math.PI,color:def.id==='atlante-materia'?'#fff0d9':'#f1f4ff',castShadow:shadow});};
 const art=(x,z,rotation=0,chapter='Materia')=>{const original=paintings[n%paintings.length];n++;const width=Math.min(3.4,2.4*original.w/original.h),height=width*original.h/original.w;add('art',`${chapter} / ${String(n).padStart(2,'0')}`,x,z,{w:width,h:height,d:.05,y:2.05-height/2,rotation,image:original.image});const a=rotation*Math.PI/180;add('sign',`Didascalia ${n}`,x+Math.cos(a)*.7,z-Math.sin(a)*.7,{w:1.1,h:.2,d:.025,y:.53,rotation,text:`${chapter.toUpperCase()} / ${String(n).padStart(2,'0')}\nCollezione di studio`,color:'#e9e2d6'});};
 const island=(x,z,label)=>{add('plinth',label+' · basamento',x,z,{w:1.8,d:1.8,h:.5,surface:{...preset(def.id==='atlante-materia'?'stone':'dark-marble'),scale:1.8}});const variety=def.id==='atlante-materia'?[0,1,2]:[3,2,0];const sculpt=sculptureCatalog[variety[sculptureIndex++]];add(sculpt.type,sculpt.name,x,z,{w:sculpt.w*1.8/sculpt.h,d:sculpt.d*1.8/sculpt.h,h:1.8,y:.5,color:sculpt.color});spot(x+2,z+1.8,x,z,true);};
 const bench=(x,z,rotation=0)=>add('bench','Pausa contemplativa',x,z,{w:2.8,d:.65,h:.45,rotation,surface:preset('dark-wood')});
 const north=-def.d/2+.15;
 for(let x=-def.w/2+3.5;x<def.w/2-2;x+=5){art(x,north,0,'Orizzonti');if(n%2===1)spot(x,north+2.5,x,north);}
 if(def.id==='atlante-materia'){
  for(const z of [-7,-1,4,9])art(-15.85,z,90,'Sedimenti');
  for(const z of [2,7]){art(-4.15,z,-90,'Tracce');spot(-6.5,z,-4.15,z);}
  for(const x of [-7,1,9]){island(x,-6.8,'Risonanza '+(x+8));bench(x,-3.6);}
  for(const z of [-1,6])spot(-13.3,z,-15.85,z);
  add('partition','Quinta / passaggio alla materia',-10,0,{w:5,h:3.2,d:.2,surface:finish(def.color)});art(-10,.15,0,'Soglia');
  bench(-12,5,90);add('desk','Accoglienza e cataloghi',-6.5,10,{w:2.4,d:.8,h:1.05,surface:preset('dark-wood')});
  add('panel','Atlante · introduzione',-15.83,-4,{w:1.4,h:1.6,y:1,rotation:90,text:'ATLANTE\nDELLA MATERIA\n\n01 Sedimenti\n02 Tracce\n03 Orizzonti',color:'#e9e2d6'});
 }else{
  for(const z of [-7,-1,5,11]){art(-17.85,z,90,'Memorie');art(17.85,z,-90,'Visioni');}
  for(const z of [0,7]){art(-8.15,z,-90,'Intervalli');art(8.15,z,90,'Riflessi');spot(-10.5,z,-8.15,z);spot(10.5,z,8.15,z);}
  for(const x of [-9,0,9]){island(x,-9,'Luce / volume '+(x+10));bench(x,-5.8);}
  for(const x of [-13,13]){add('partition','Quinta di attraversamento',x,3,{w:3.5,h:2.8,d:.2,surface:finish(def.color)});art(x,3.15,0,'Passaggi');bench(x,8,90);spot(x,5.7,x,3.15);}
  add('desk','Reception / Corte della luce',-10.5,12,{w:2.4,d:.8,h:1.05,surface:preset('dark-wood')});
  add('panel','Corte · introduzione',-17.83,13,{w:1.3,h:1.6,y:1,rotation:90,text:'CORTE\nDELLA LUCE\n\nMemorie / Intervalli\nOrizzonti / Visioni\nUn percorso in tre ali',color:'#e9e2d6'});
 }
 for(const [type,x,z] of [['person-casual-15',-12,-5],['person-grey-blazer',-11,8],['person-sophia',5,-10]])add(type,'Visitatore · riferimento di scala',x,z,{rotation:40});
 validate(p);const issues=projectChecks(p);if(issues.length)throw Error(def.id+': '+JSON.stringify(issues));
 await fs.writeFile(`public/examples/${def.id}.spazio.json`,JSON.stringify(p));
 console.log(def.id,floorArea(p)+' m²',p.objects.length+' elementi',lights+' fari');
}

