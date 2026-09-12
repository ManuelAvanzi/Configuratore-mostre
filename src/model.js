import {peopleCatalog,legacyPeople,migratePerson} from './people-catalog.js';
export const uid=()=>crypto.randomUUID();
export const clone=x=>structuredClone(x);
export const round=x=>Math.round(x*100)/100;
export const catalog=[
 {type:'art',name:'Quadro / fotografia',icon:'image',category:'Opere',w:1.2,h:.8,d:.05,y:1.15,color:'#e8c88e'},
 {type:'sculpture',name:'Scultura',icon:'gem',category:'Opere',w:.6,h:1.2,d:.6,y:0,color:'#aa7554'},
 ...peopleCatalog,
 {type:'panel',name:'Pannello informativo',icon:'text',category:'Comunicazione',w:1,h:1.5,d:.06,y:.5,color:'#f1eee6'},
 {type:'case',name:'Teca',icon:'box',category:'Strutture',w:1.2,h:1.2,d:.65,y:0,color:'#c3d5d7'},
 {type:'plinth',name:'Piedistallo',icon:'columns-3',category:'Strutture',w:.6,h:.9,d:.6,y:0,color:'#f6f4ed'},
 {type:'partition',name:'Parete temporanea',icon:'panel-top',category:'Strutture',w:3,h:2.8,d:.15,y:0,color:'#f5f4ef'},
 {type:'structure',name:'Struttura espositiva',icon:'layout-panel-top',category:'Strutture',w:2,h:2,d:.5,y:0,color:'#383d39'},
 {type:'monitor',name:'Monitor / video',icon:'monitor-play',category:'Multimedia',w:1.2,h:.7,d:.08,y:1.2,color:'#1c2627'},
 {type:'bench',name:'Seduta',icon:'armchair',category:'Arredi',w:1.6,h:.45,d:.5,y:0,color:'#9d7555'},
 {type:'desk',name:'Desk accoglienza',icon:'table-2',category:'Arredi',w:1.8,h:1.05,d:.65,y:0,color:'#b89871'},
 {type:'sign',name:'Segnaletica',icon:'signpost',category:'Comunicazione',w:.6,h:.3,d:.04,y:1.7,color:'#234d40'},
 {type:'light',name:'Punto luce',icon:'lamp-ceiling',category:'Luci',w:.2,h:.25,d:.2,y:2.7,color:'#fff0ca'},
 {type:'scenery',name:'Elemento scenografico',icon:'shapes',category:'Strutture',w:1,h:1,d:1,y:0,color:'#af6648'},
 {type:'column',name:'Colonna',icon:'columns-2',category:'Architettura',w:.4,h:3.2,d:.4,y:0,color:'#efeee9'},
];
export function item(type,x=0,z=0){const c=catalog.find(c=>c.type===(legacyPeople[type]||type))||catalog[0];return {...c,id:uid(),x,z,rotation:0,text:c.type==='panel'?'Titolo della mostra\nUna storia da raccontare.':c.type==='sign'?'Percorso →':'',intensity:8};}
export function rectangle(w,d){return [[-w/2,-d/2,w/2,-d/2],[w/2,-d/2,w/2,d/2],[w/2,d/2,-w/2,d/2],[-w/2,d/2,-w/2,-d/2]].map(([ax,az,bx,bz])=>({id:uid(),ax,az,bx,bz,thickness:.15,height:3.2,openings:[]}));}
export function createProject(w=12,d=9,name='La mia mostra'){return {version:1,id:uid(),name,width:w,depth:d,height:3.2,floor:'#d8d3c8',walls:rectangle(w,d),objects:[],reference:null,modified:new Date().toISOString()};}
export function demo(){let p=createProject(14,10,'Forme in dialogo');let add=(t,x,z,props={})=>p.objects.push(Object.assign(item(t,x,z),props));
 p.walls[2].openings=[{id:uid(),type:'door',offset:6.3,width:1.4,height:2.4,sill:0}];
 add('partition',-2.8,-.8,{w:3.5,h:2.8});add('panel',-4.7,-4.87,{name:'Forme in dialogo — introduzione',w:1.4,h:1.8,y:.65,text:'FORME\nIN DIALOGO\n\nMateria, luce, spazio.\nUn percorso tra equilibri\ne nuove prospettive.'});
 ['#bf5639','#dda93d','#365e69'].forEach((c,i)=>add('art',-1.9+i*2.6,-4.86,{color:c,name:['Terra / 01','Luce / 02','Acqua / 03'][i],w:1.5,h:1.8,y:.7}));
 add('art',6.86,-1.8,{rotation:-90,color:'#7e8571',w:1.8,h:1.3,name:'Paesaggio interiore'});add('art',6.86,1.4,{rotation:-90,color:'#b77e68',w:1.8,h:1.3,name:'Tracce'});
 add('plinth',2.1,.5);add('sculpture',2.1,.5,{y:.9,h:1.25,name:'Equilibrio',color:'#a26e49'});add('bench',1.9,3,{w:2.3});add('case',-4,1.4);add('sign',-2,4.7,{rotation:180});
 add('person-casual-15',.4,-2.4,{rotation:165});add('person-grey-blazer',4.3,.6,{rotation:-55});add('person-sophia',5.2,-.8,{rotation:-65});
 return p;}
export const wallLength=w=>Math.hypot(w.bx-w.ax,w.bz-w.az);
export function validateGLB(data){try{const binary=Uint8Array.from(atob(data.split(',')[1]),c=>c.charCodeAt(0));const v=new DataView(binary.buffer);if(v.byteLength<20||v.getUint32(0,true)!==0x46546c67||v.getUint32(4,true)!==2||v.getUint32(8,true)!==v.byteLength||v.getUint32(16,true)!==0x4e4f534a)throw Error();const length=v.getUint32(12,true);const json=JSON.parse(new TextDecoder().decode(binary.slice(20,20+length)));if([...(json.buffers||[]),...(json.images||[])].some(a=>a.uri&&!a.uri.startsWith('data:')))throw Error();if(json.extensionsRequired?.some(x=>['KHR_draco_mesh_compression','EXT_meshopt_compression','KHR_texture_basisu'].includes(x)))throw Error();return data;}catch{throw Error('Usa un GLB 2.0 non compresso, con tutte le risorse incorporate.');}}
export function wallParts(w){const len=wallLength(w),out=[];let at=0;for(const o of [...w.openings].sort((a,b)=>a.offset-b.offset)){if(o.offset>at)out.push({start:at,end:o.offset,bottom:0,top:w.height});if(o.sill>0)out.push({start:o.offset,end:o.offset+o.width,bottom:0,top:o.sill});if(o.sill+o.height<w.height)out.push({start:o.offset,end:o.offset+o.width,bottom:o.sill+o.height,top:w.height});at=o.offset+o.width;}if(at<len)out.push({start:at,end:len,bottom:0,top:w.height});return out;}
export function openingFits(w,o,exclude){return o.offset>=0&&o.width>=.2&&o.offset+o.width<=wallLength(w)+.001&&o.sill>=0&&o.height>=.2&&o.sill+o.height<=w.height+.001&&!w.openings.some(a=>a.id!==exclude&&o.offset<a.offset+a.width&&o.offset+o.width>a.offset);}
export function validate(p){const n=(v,min,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max; if(!p||p.version!==1||typeof p.name!=='string'||!n(p.width,2,100)||!n(p.depth,2,100)||!n(p.height,2,12)||!Array.isArray(p.walls)||!Array.isArray(p.objects)||p.walls.length>500||p.objects.length>500)throw Error('Il file non è un progetto Spazio valido.');
 if(typeof p.id!=='string'||typeof p.floor!=='string'||!/^#[0-9a-f]{6}$/i.test(p.floor)||p.name.length>200)throw Error('Proprietà progetto non valide.');
 const ids=new Set();const id=x=>{if(typeof x!=='string'||ids.has(x))throw Error('Identificatori non validi.');ids.add(x)};
 if(p.measurements!==undefined){if(!Array.isArray(p.measurements)||p.measurements.length>200)throw Error('Massimo 200 quote per progetto.');for(const m of p.measurements){if(!m||!['ax','az','bx','bz'].every(k=>n(m[k],-100,100))||Math.hypot(m.bx-m.ax,m.bz-m.az)<.1)throw Error('Quota non valida: indica due punti distanti almeno 10 cm.');id(m.id);}}
 for(const w of p.walls){id(w.id);if(!['ax','az','bx','bz'].every(k=>n(w[k],-100,100))||!n(w.height,.2,12)||!n(w.thickness,.03,2)||wallLength(w)<.1||!Array.isArray(w.openings))throw Error('Parete non valida.');for(const o of w.openings){id(o.id);if(!['door','window','opening'].includes(o.type)||!['offset','width','height','sill'].every(k=>n(o[k],0,200))||!openingFits(w,o,o.id))throw Error('Aperture sovrapposte o fuori parete.');}}
 for(const o of p.objects){id(o.id);if(![...catalog.map(c=>c.type),...Object.keys(legacyPeople),'model'].includes(o.type)||typeof o.name!=='string'||!['w','h','d'].every(k=>n(o[k],.01,100))||!['x','z','y','rotation'].every(k=>n(o[k],-360,360))||typeof o.color!=='string'||!/^#[0-9a-f]{6}$/i.test(o.color))throw Error('Elemento non valido.');for(const k of ['image','video','model'])if(o[k]&&!(typeof o[k]==='string'&&o[k].startsWith('data:')))throw Error('Asset esterno non consentito.');migratePerson(o);}
 for(const o of p.objects){if(o.text!==undefined&&typeof o.text!=='string'||o.name.length>200)throw Error('Testo non valido.');if(o.image&&!/^data:image\/(png|jpeg|webp);base64,/.test(o.image))throw Error('Formato immagine non supportato.');if(o.video&&!/^data:video\/(mp4|webm);base64,/.test(o.video))throw Error('Formato video non supportato.');if(o.model)validateGLB(o.model);}
 if(p.reference&&(!n(p.reference.width,.1,200)||!n(p.reference.depth,.1,200)||typeof p.reference.src!=='string'||!/^data:image\/(png|jpeg|webp);base64,/.test(p.reference.src)))throw Error('Riferimento non valido.');return p;}
export function distanceToWall(x,z,w){const dx=w.bx-w.ax,dz=w.bz-w.az,t=Math.max(0,Math.min(1,((x-w.ax)*dx+(z-w.az)*dz)/(dx*dx+dz*dz)));return {distance:Math.hypot(x-w.ax-t*dx,z-w.az-t*dz),offset:t*wallLength(w)};}
export function canWalk(p,x,z){if(Math.abs(x)>p.width/2-.2||Math.abs(z)>p.depth/2-.2)return false;for(const w of p.walls){const a=distanceToWall(x,z,w);if(a.distance<w.thickness/2+.18&&!w.openings.some(o=>o.sill<.1&&o.height>1.7&&a.offset>o.offset+.18&&a.offset<o.offset+o.width-.18))return false;}return !p.objects.some(o=>{if(o.y>1.7||['art','sign','light','panel'].includes(o.type))return false;const r=o.rotation*Math.PI/180,dx=x-o.x,dz=z-o.z;return Math.abs(dx*Math.cos(r)-dz*Math.sin(r))<o.w/2+.18&&Math.abs(dx*Math.sin(r)+dz*Math.cos(r))<o.d/2+.18;});}

