import {wallLength} from './model.js';
import {sizePerson} from './people-catalog.js';

export function transformPanel(entity,wall=false,linked=true){
 const person=entity.type?.startsWith('person');
 const position=wall?[(entity.ax+entity.bx)/2,0,(entity.az+entity.bz)/2]:[entity.x,entity.y,entity.z];
 const angle=wall?-Math.atan2(entity.bz-entity.az,entity.bx-entity.ax)*180/Math.PI:entity.rotation;
 const scale=entity.transformScale||{x:1,y:1,z:1};
 const cell=(row,axis,value,disabled=false)=>{
  const key=!wall&&row==='position'?`data-field="${axis}"`:!wall&&row==='rotation'&&axis==='y'?'data-field="rotation"':`data-transform="${row}.${axis}"`;
  const name={position:'Posizione',rotation:'Rotazione',scale:'Scala'}[row];
  const limits=row==='scale'?'min="0.01" max="100" step="0.01"':row==='rotation'?'min="-360" max="360" step="1"':`min="${axis==='y'?0:-100}" max="100" step="0.01"`;
  return `<label class="transform-axis axis-${axis}"><span>${axis.toUpperCase()}</span><input type="number" ${key} value="${Number(value.toFixed(3))}" ${limits} aria-label="${name} ${axis.toUpperCase()}" ${disabled?'disabled title="Non disponibile: gli elementi restano verticali e le pareti appoggiate al pavimento"':''}/></label>`;
 };
 return `<section class="transform-panel" aria-label="Trasformazione"><header><h3>Trasformazione</h3><small>m · ° · ×</small></header><div class="transform-row"><span class="transform-symbol" title="Posizione" aria-label="Posizione"><i data-lucide="move"></i></span>${['x','y','z'].map((a,i)=>cell('position',a,position[i],wall&&a==='y')).join('')}</div><div class="transform-row"><span class="transform-symbol" title="Rotazione" aria-label="Rotazione"><i data-lucide="rotate-cw"></i></span>${['x','y','z'].map(a=>cell('rotation',a,a==='y'?angle:0,a!=='y')).join('')}</div><div class="transform-row"><span class="transform-symbol" title="Scala" aria-label="Scala"><i data-lucide="maximize-2"></i></span>${['x','y','z'].map(a=>cell('scale',a,scale[a])).join('')}</div><button type="button" class="scale-link" title="Mantieni proporzioni" aria-label="Mantieni proporzioni" data-action="scale-link" aria-pressed="${linked||person}" ${person?'disabled':''}><span aria-hidden="true">${linked||person?'↔':'↮'}</span></button><p>${wall?'Posizione al centro della parete. Scala: lunghezza, altezza, spessore.':'X/Z: centro dell’elemento. Y: altezza della base da terra.'}</p></section>`;
}

export function applyTransform(entity,wall,key,value,linked){
 if(!Number.isFinite(value))throw Error('Inserisci un numero valido.');
 const [kind,axis]=key.split('.');
 if(!['x','y','z'].includes(axis))throw Error('Asse non valido.');
 if(wall&&kind==='position'){
  if(axis==='y')throw Error('La parete resta appoggiata al pavimento.');
  const a=axis==='x'?'ax':'az',b=axis==='x'?'bx':'bz',delta=value-(entity[a]+entity[b])/2;
  entity[a]+=delta;entity[b]+=delta;return;
 }
 if(wall&&kind==='rotation'&&axis==='y'){
  const x=(entity.ax+entity.bx)/2,z=(entity.az+entity.bz)/2,l=wallLength(entity)/2,r=-value*Math.PI/180;
  entity.ax=x-Math.cos(r)*l;entity.bx=x+Math.cos(r)*l;entity.az=z-Math.sin(r)*l;entity.bz=z+Math.sin(r)*l;return;
 }
 if(kind!=='scale'||value<=0||value>100)throw Error('Scala non valida.');
 const previous=entity.transformScale||{x:1,y:1,z:1};
 const ratio=value/previous[axis];if(!Number.isFinite(ratio)||ratio<=0)throw Error('Scala non valida.');
 const person=entity.type?.startsWith('person');
 const factors=Object.fromEntries(['x','y','z'].map(a=>[a,linked||person||a===axis?ratio:1]));
 if(wall){
  const x=(entity.ax+entity.bx)/2,z=(entity.az+entity.bz)/2;
  for(const k of ['ax','bx'])entity[k]=x+(entity[k]-x)*factors.x;
  for(const k of ['az','bz'])entity[k]=z+(entity[k]-z)*factors.x;
  entity.height*=factors.y;entity.thickness*=factors.z;
  for(const opening of entity.openings){opening.offset*=factors.x;opening.width*=factors.x;opening.height*=factors.y;opening.sill*=factors.y;}
 }else if(person){
  const height=entity.h*ratio;if(height<.5||height>2.5)throw Error('L’altezza della persona deve essere tra 0,5 e 2,5 m.');sizePerson(entity,height);
 }else{entity.w*=factors.x;entity.h*=factors.y;entity.d*=factors.z;}
 entity.transformScale=Object.fromEntries(['x','y','z'].map(a=>[a,previous[a]*factors[a]]));
}
