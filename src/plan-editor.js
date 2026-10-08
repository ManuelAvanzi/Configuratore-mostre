import {isLocked} from './scene-locks.js';
import {floorOutline} from './floor-plan.js';
import {uid,round,item,wallLength,distanceToWall,openingFits} from './model.js';
import {containsPoint,footprint,measureLength} from './planning.js';
import {applyTransform} from './transform-panel.js';

export function createPlanEditor(canvas,api){
 let measurement=null;
 let start=null,cursor=null,drag=null,reference=null,scale=35,pan={x:0,z:0},panning=null;
 let frame=null;
 const scheduleDraw=()=>{if(frame===null)frame=requestAnimationFrame(()=>{frame=null;draw();});};
 const selectedItem=()=>api.multiple?.()?null:api.project().objects.find(o=>o.id===api.selected())||api.project().walls.find(w=>w.id===api.selected());
 const center=o=>o.ax===undefined?{x:o.x,z:o.z}:{x:(o.ax+o.bx)/2,z:(o.az+o.bz)/2};
 const preview=o=>drag?.id===o.id&&drag.next?{...o,...drag.next}:o;
 const point=e=>{const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left-r.width/2)/scale-pan.x,z:(e.clientY-r.top-r.height/2)/scale-pan.z};};
 function snap(q){
  if(!api.snap())return q;
  const p=api.project(),vertices=[...p.walls.flatMap(w=>[{x:w.ax,z:w.az},{x:w.bx,z:w.bz}]),...p.objects.flatMap(footprint)];
  const near=vertices.filter(v=>Math.hypot(q.x-v.x,q.z-v.z)<9/scale).sort((a,b)=>Math.hypot(q.x-a.x,q.z-a.z)-Math.hypot(q.x-b.x,q.z-b.z))[0];
  return near?{...near}:{x:round(Math.round(q.x*10)/10),z:round(Math.round(q.z*10)/10)};
 }
 function draw(){
  if(canvas.hidden)return;const p=api.project(),r=canvas.getBoundingClientRect(),width=r.width,height=r.height;if(!width||!height)return;
  const pw=Math.round(width*devicePixelRatio),ph=Math.round(height*devicePixelRatio);if(canvas.width!==pw||canvas.height!==ph){canvas.width=pw;canvas.height=ph;}const c=canvas.getContext('2d');c.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
  scale=Math.max(1,Math.min((width-110)/p.width,(height-170)/p.depth)*api.zoom());
  const to=q=>({x:width/2+(q.x+pan.x)*scale,z:height/2+(q.z+pan.z)*scale});
  const line=(a,b,color='#dbe1dc',weight=1,dash=[])=>{a=to(a);b=to(b);c.strokeStyle=color;c.lineWidth=weight;c.setLineDash(dash);c.beginPath();c.moveTo(a.x,a.z);c.lineTo(b.x,b.z);c.stroke();c.setLineDash([]);};
  const label=(q,text,color='#53675a')=>{q=to(q);c.font='12px "DM Sans", Arial';const tw=c.measureText(text).width;c.fillStyle='#fafcf8ed';c.fillRect(q.x-tw/2-5,q.z-10,tw+10,20);c.fillStyle=color;c.textAlign='center';c.textBaseline='middle';c.fillText(text,q.x,q.z);};
  c.fillStyle='#edf0ec';c.fillRect(0,0,width,height);const corner=to({x:-p.width/2,z:-p.depth/2});c.fillStyle='#fafbf7';c.beginPath();floorOutline(p).map(to).forEach((q,i)=>i?c.lineTo(q.x,q.z):c.moveTo(q.x,q.z));c.closePath();c.fill();if(api.selected()==='surface:floor'){c.strokeStyle='#df7900';c.lineWidth=5;c.stroke();}
  if(p.reference){if(reference?.src!==p.reference.src){reference={src:p.reference.src,img:new Image()};reference.img.onload=draw;reference.img.src=p.reference.src;}if(reference.img.complete&&reference.img.naturalWidth){const dimensions=drag?.reference&&drag.next?drag.next:api.referenceDimensions?.()??p.reference,q=to({x:-dimensions.width/2,z:-dimensions.depth/2});c.globalAlpha=api.referenceOpacity?.()??p.reference.opacity??.38;c.drawImage(reference.img,q.x,q.z,dimensions.width*scale,dimensions.depth*scale);c.globalAlpha=1;}}else reference=null;
  const step=api.gridStep?.()||1;
  const left=-width/2/scale-pan.x,right=width/2/scale-pan.x,top=-height/2/scale-pan.z,bottom=height/2/scale-pan.z;
  for(let x=Math.ceil(left/step)*step;x<=right;x+=step)line({x,z:top},{x,z:bottom},Math.abs(x-Math.round(x))<.001?'#c4cfc5':'#e0e6e0');
  for(let z=Math.ceil(top/step)*step;z<=bottom;z+=step)line({x:left,z},{x:right,z},Math.abs(z-Math.round(z))<.001?'#c4cfc5':'#e0e6e0');
  line({x:left,z:0},{x:right,z:0},'#bac9be',1,[4,4]);line({x:0,z:top},{x:0,z:bottom},'#bac9be',1,[4,4]);
  for(const original of p.walls){const w=preview(original);line({x:w.ax,z:w.az},{x:w.bx,z:w.bz},w.id===api.selected()?'#df7900':'#3e5147',Math.max(2,w.thickness*scale)+(w.id===api.selected()?4:0));for(const o of w.openings){const length=wallLength(w),dx=(w.bx-w.ax)/length,dz=(w.bz-w.az)/length,a={x:w.ax+dx*o.offset,z:w.az+dz*o.offset},b={x:a.x+dx*o.width,z:a.z+dz*o.width};line(a,b,o.type==='window'?'#8cb8c7':'#fafbf7',w.thickness*scale+2);if(o.id===api.selected()){line(a,b,'#fff',w.thickness*scale+9);line(a,b,'#df7900',w.thickness*scale+5);}else line(a,b,'#8a9e94',1,[3,3]);}label({x:(w.ax+w.bx)/2,z:(w.az+w.bz)/2-18/scale},wallLength(w).toFixed(2)+' m');}
  [...p.objects].sort((a,b)=>(a.type==='floor-area'?0:1)-(b.type==='floor-area'?0:1)).forEach((original,index)=>{const o=drag?.id===original.id&&drag.next?{...original,...drag.next}:original;const corners=footprint(o).map(to);c.beginPath();corners.forEach((q,i)=>i?c.lineTo(q.x,q.z):c.moveTo(q.x,q.z));c.closePath();c.fillStyle=o.color;c.globalAlpha=o.type==='floor-area'?.25:.8;c.fill();c.globalAlpha=1;c.lineWidth=(api.isSelected?.(o.id)??o.id===api.selected())?4:1;c.strokeStyle=(api.isSelected?.(o.id)??o.id===api.selected())?'#df7900':'#6b8173';c.stroke();if(Math.max(o.w,o.d)*scale>23)label({x:o.x,z:o.z},String(index+1));});
  if(p.reference&&api.selected()==='reference:plan'&&api.tool()==='select'){
   const ref=drag?.reference&&drag.next?drag.next:api.referenceDimensions?.()??p.reference;
   const a=to({x:-ref.width/2,z:-ref.depth/2}),b=to({x:ref.width/2,z:ref.depth/2});
   c.strokeStyle='#df7900';c.lineWidth=3;c.strokeRect(a.x,a.z,b.x-a.x,b.z-a.z);
   for(const q of [{x:a.x,z:a.z},{x:b.x,z:a.z},{x:b.x,z:b.z},{x:a.x,z:b.z}]){c.fillStyle='#fff';c.fillRect(q.x-7,q.z-7,14,14);c.strokeRect(q.x-7,q.z-7,14,14);}
   label({x:0,z:ref.depth/2+22/scale},`${ref.width.toFixed(2)} × ${ref.depth.toFixed(2)} m · trascina un angolo`,'#975300');
  }
  const selected=selectedItem();
  if(selected&&api.tool()==='select'){
   const q=to(center(preview(selected)));
   canvas.dataset.gizmo=selected.id;
   canvas.dataset.gizmoX=String(q.x);canvas.dataset.gizmoY=String(q.z);
   const arrow=(dx,dz,color,text)=>{c.strokeStyle=color;c.fillStyle=color;c.lineWidth=3;c.beginPath();c.moveTo(q.x,q.z);c.lineTo(q.x+dx,q.z+dz);c.stroke();c.beginPath();c.moveTo(q.x+dx,q.z+dz);if(dx){c.lineTo(q.x+dx-10,q.z-6);c.lineTo(q.x+dx-10,q.z+6);}else{c.lineTo(q.x-6,q.z+dz-10);c.lineTo(q.x+6,q.z+dz-10);}c.closePath();c.fill();c.font='bold 12px Arial';c.textAlign='center';c.fillText(text,q.x+dx+(dx?12:0),q.z+dz+(dz?15:-12));};
   const operation=api.transform?.()||'move';canvas.dataset.gizmoMode=operation;
   if(operation==='rotate'){
    c.strokeStyle='#478152';c.lineWidth=3;c.beginPath();c.arc(q.x,q.z,52,0,Math.PI*2);c.stroke();
    c.fillStyle='#478152';c.beginPath();c.arc(q.x+52,q.z,7,0,Math.PI*2);c.fill();
    c.font='12px Arial';c.textAlign='center';c.fillText('Y',q.x,q.z-65);
   }else if(operation==='scale'){
    c.strokeStyle='#47765a';c.lineWidth=2;c.beginPath();c.moveTo(q.x,q.z);c.lineTo(q.x+48,q.z+48);c.stroke();
    c.fillStyle='white';c.fillRect(q.x+40,q.z+40,16,16);c.strokeRect(q.x+40,q.z+40,16,16);
   }else{arrow(58,0,'#b64236','X');arrow(0,58,'#2465b0','Z');}
   c.fillStyle='white';c.strokeStyle='#285940';c.lineWidth=2;c.fillRect(q.x-5,q.z-5,10,10);c.strokeRect(q.x-5,q.z-5,10,10);
  }else delete canvas.dataset.gizmo;
  function dimension(m,temporary=false){const a={x:m.ax,z:m.az},b={x:m.bx,z:m.bz};line(a,b,'#256b85',1.5,temporary?[5,4]:[]);for(const q of [a,b]){const v=to(q);c.fillStyle='#256b85';c.beginPath();c.arc(v.x,v.z,3.5,0,Math.PI*2);c.fill();}label({x:(m.ax+m.bx)/2,z:(m.az+m.bz)/2-14/scale},measureLength(m).toFixed(2)+' m','#256b85');}
  (p.measurements||[]).forEach(m=>dimension(m));
  if(measurement)dimension(measurement);
  if(start&&cursor&&api.tool()==='floor-area'){const a=to(start),b=to(cursor);c.fillStyle='#527d5826';c.fillRect(a.x,a.z,b.x-a.x,b.z-a.z);c.strokeStyle='#527d58';c.strokeRect(a.x,a.z,b.x-a.x,b.z-a.z);label({x:(start.x+cursor.x)/2,z:(start.z+cursor.z)/2},`${Math.abs(cursor.x-start.x).toFixed(2)} × ${Math.abs(cursor.z-start.z).toFixed(2)} m`);}
  if(start&&cursor&&api.tool()!=='floor-area'){const m={ax:start.x,az:start.z,bx:cursor.x,bz:cursor.z};dimension(m,true);}
  if(cursor&&['measure','wall','floor-area','calibrate'].includes(api.tool())){const q=to(cursor);c.strokeStyle='#256b85';c.lineWidth=1;c.beginPath();c.moveTo(q.x-7,q.z);c.lineTo(q.x+7,q.z);c.moveTo(q.x,q.z-7);c.lineTo(q.x,q.z+7);c.stroke();}
  const readout=document.querySelector('#plan-readout');if(readout){readout.hidden=!start&&!measurement;readout.textContent=measurement&&!start?`${measureLength(measurement).toFixed(2)} m · Esc per cancellare`:start&&cursor?`${api.tool()==='calibrate'?'Calibrazione':api.tool()==='measure'?'Misura':'Parete'} · ${Math.hypot(cursor.x-start.x,cursor.z-start.z).toFixed(2)} m · clic per terminare`:'';}
 }
 function apply(change){try{api.change(change);}catch(error){api.notify(error.message);}}
 canvas.addEventListener('contextmenu',e=>e.preventDefault());
 canvas.addEventListener('wheel',e=>{
  e.preventDefault();
  if(drag||panning)return;
  const anchor=point(e),r=canvas.getBoundingClientRect(),p=api.project();
  const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?r.height:1);
  const zoom=Math.max(.3,Math.min(3,api.zoom()*Math.exp(-Math.max(-200,Math.min(200,delta))*.002)));
  api.setZoom(zoom);
  scale=Math.max(1,Math.min((r.width-110)/p.width,(r.height-170)/p.depth)*zoom);
  pan={x:(e.clientX-r.left-r.width/2)/scale-anchor.x,z:(e.clientY-r.top-r.height/2)/scale-anchor.z};
  scheduleDraw();
 },{passive:false});
 canvas.addEventListener('pointerdown',e=>{
  if(e.button===1||e.button===2||e.altKey){e.preventDefault();panning={x:e.clientX,y:e.clientY,pan:{...pan}};canvas.setPointerCapture(e.pointerId);return;}
  const p=api.project(),raw=point(e),q=snap(raw),tool=api.tool();cursor=q;
  if(tool==='calibrate'){
   if(!p.reference)return;
   if(!start){start=raw;cursor=raw;api.notify('Ora indica il secondo estremo del lato.');draw();return;}
   const distance=Math.hypot(raw.x-start.x,raw.z-start.z);
   if(distance*scale<8){api.notify('Scegli due punti più distanti per una misura precisa.');return;}
   measurement={ax:start.x,az:start.z,bx:raw.x,bz:raw.z};start=null;draw();api.calibrate(distance);return;
  }
  if(tool==='floor-area'){if(!start){start=q;api.notify('Indica l’angolo opposto della superficie.');draw();return;}const w=round(Math.abs(q.x-start.x)),d=round(Math.abs(q.z-start.z));if(w<.1||d<.1)return;const o={...item('floor-area',(q.x+start.x)/2,(q.z+start.z)/2),w,d};apply(p=>p.objects.push(o));start=null;api.select(o.id);draw();return;}
  if(tool==='select'&&p.reference&&api.selected()==='reference:plan'){
   const ref=p.reference;
   const corner=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,z])=>({x:x*ref.width/2,z:z*ref.depth/2})).find(q=>Math.hypot(raw.x-q.x,raw.z-q.z)*scale<16);
   if(corner){drag={reference:true,original:{width:ref.width,depth:ref.depth},pointer:corner,screen:{x:e.clientX,y:e.clientY},moved:false};canvas.setPointerCapture(e.pointerId);return;}
  }
  const chosen=selectedItem();
  if(tool==='select'&&chosen){
   const c=center(chosen),dx=(raw.x-c.x)*scale,dz=(raw.z-c.z)*scale,operation=api.transform?.()||'move';let axis=null;
   if(operation==='rotate'&&Math.abs(Math.hypot(dx,dz)-52)<12)axis='rotate';
   else if(operation==='scale'&&Math.abs(dx-48)<13&&Math.abs(dz-48)<13)axis='scale';
   else if(operation==='move'){if(Math.abs(dx)<10&&Math.abs(dz)<10)axis='free';else if(dx>8&&dx<70&&Math.abs(dz)<11)axis='x';else if(dz>8&&dz<70&&Math.abs(dx)<11)axis='z';}
   if(axis){drag={id:chosen.id,wall:chosen.ax!==undefined,original:structuredClone(chosen),origin:c,pointer:raw,screen:{x:e.clientX,y:e.clientY},axis,moved:false};canvas.setPointerCapture(e.pointerId);return;}
  }
  if(tool==='measure'||tool==='wall'){
   if(!start){measurement=null;start=q;draw();return;}if(Math.hypot(q.x-start.x,q.z-start.z)<.1)return;
   if(tool==='measure')measurement={ax:start.x,az:start.z,bx:q.x,bz:q.z};
   else apply(p=>{const w={id:uid(),ax:start.x,az:start.z,bx:q.x,bz:q.z,height:p.height,thickness:.15,openings:[]};p.walls.push(w);});
   start=null;draw();return;
  }
  if(tool==='column'){const o=item('column',q.x,q.z);o.h=p.height;apply(p=>p.objects.push(o));api.select(o.id);return;}
  const nearest=p.walls.filter(w=>!isLocked(p,w.id)).map(w=>({w,...distanceToWall(raw.x,raw.z,w)})).sort((a,b)=>a.distance-b.distance)[0];
  if(['door','window','opening'].includes(tool)){
   if(!nearest||nearest.distance>.4){api.notify('Tocca una parete per inserire l’apertura.');return;}
   const w=nearest.w,o={id:uid(),type:tool,width:tool==='door'?.9:1.2,height:tool==='window'?1.2:2.1,sill:tool==='window'?1:0,offset:round(Math.max(0,nearest.offset-(tool==='door'?.45:.6)))};
   if(!openingFits(w,o)){api.notify('L’apertura non entra o si sovrappone a un’altra.');return;}apply(()=>w.openings.push(o));api.select(o.id);return;
  }
  const opening=nearest?.distance<.3?nearest.w.openings.find(o=>nearest.offset>=o.offset&&nearest.offset<=o.offset+o.width):null;if(opening&&!isLocked(p,opening.id)){api.select(opening.id);return;}
  const obj=[...p.objects].sort((a,b)=>(a.type==='floor-area'?0:1)-(b.type==='floor-area'?0:1)).reverse().find(o=>!isLocked(p,o.id)&&containsPoint(o,raw.x,raw.z,3/scale));api.select(obj?.id||(nearest?.distance<.3?nearest.w.id:p.reference&&!isLocked(p,'reference:plan')&&Math.abs(raw.x)<=p.reference.width/2&&Math.abs(raw.z)<=p.reference.depth/2?'reference:plan':null),undefined,e.shiftKey);
  if(obj&&!e.shiftKey&&!api.multiple?.()&&(!api.transform||api.transform()==='move')){drag={id:obj.id,origin:{x:obj.x,z:obj.z},pointer:raw,screen:{x:e.clientX,y:e.clientY},moved:false};canvas.setPointerCapture(e.pointerId);}
 });
 canvas.addEventListener('pointermove',e=>{
  if(panning){pan={x:panning.pan.x+(e.clientX-panning.x)/scale,z:panning.pan.z+(e.clientY-panning.y)/scale};scheduleDraw();return;}
  if(!drag&&!['wall','measure','floor-area','calibrate'].includes(api.tool()))return;
  const raw=point(e);cursor=drag||api.tool()==='calibrate'?raw:snap(raw);
  if(drag?.reference){
   if(!drag.moved&&Math.hypot(e.clientX-drag.screen.x,e.clientY-drag.screen.y)<4)return;
   const ref=drag.original,ratio=Math.max(.1/Math.min(ref.width,ref.depth),Math.min(200/Math.max(ref.width,ref.depth),(raw.x*drag.pointer.x+raw.z*drag.pointer.z)/(drag.pointer.x**2+drag.pointer.z**2)));
   drag.next={width:ref.width*ratio,depth:ref.depth*ratio};drag.moved=true;scheduleDraw();return;
  }
  if(drag&&['rotate','scale'].includes(drag.axis)){
   if(!drag.moved&&Math.hypot(e.clientX-drag.screen.x,e.clientY-drag.screen.y)<4)return;
   const next=structuredClone(drag.original);
   try{
    if(drag.axis==='rotate'){
     const a=Math.atan2(raw.z-drag.origin.z,raw.x-drag.origin.x),b=Math.atan2(drag.pointer.z-drag.origin.z,drag.pointer.x-drag.origin.x);
     const delta=Math.atan2(Math.sin(a-b),Math.cos(a-b))*180/Math.PI;
     const initial=drag.wall?-Math.atan2(next.bz-next.az,next.bx-next.ax)*180/Math.PI:next.rotation;
     let value=initial-delta;if(api.snap())value=Math.round(value/15)*15;value=((value+180)%360+360)%360-180;
     if(drag.wall)applyTransform(next,true,'rotation.y',value,false);else next.rotation=value;
    }else{
     const ratio=Math.max(.05,Math.min(10,Math.hypot(raw.x-drag.origin.x,raw.z-drag.origin.z)/Math.hypot(drag.pointer.x-drag.origin.x,drag.pointer.z-drag.origin.z)));
     applyTransform(next,drag.wall,'scale.x',(next.transformScale?.x||1)*ratio,api.linked?.()??true);
    }
    drag.next=next;drag.moved=true;
   }catch{}scheduleDraw();return;
  }
  if(drag){if(!drag.moved&&Math.hypot(e.clientX-drag.screen.x,e.clientY-drag.screen.y)<4)return;drag.moved=true;const q={x:drag.origin.x+raw.x-drag.pointer.x,z:drag.origin.z+raw.z-drag.pointer.z};if(drag.axis==='x')q.z=drag.origin.z;if(drag.axis==='z')q.x=drag.origin.x;drag.next={x:api.snap()?Math.round(q.x*10)/10:round(q.x),z:api.snap()?Math.round(q.z*10)/10:round(q.z)};if(drag.axis==='x')drag.next.z=drag.origin.z;if(drag.axis==='z')drag.next.x=drag.origin.x;if(drag.wall){const dx=drag.next.x-drag.origin.x,dz=drag.next.z-drag.origin.z;drag.next={ax:round(drag.original.ax+dx),az:round(drag.original.az+dz),bx:round(drag.original.bx+dx),bz:round(drag.original.bz+dz)};}}
  scheduleDraw();
 });
 function endDrag(cancel=false){if(panning){panning=null;return;}if(!drag)return;const current=drag;drag=null;if(current.reference){if(current.moved&&!cancel)apply(p=>Object.assign(p.reference,current.next));draw();return;}const o=(current.wall?api.project().walls:api.project().objects).find(o=>o.id===current.id);if(!o)return;if(current.moved&&!cancel)apply(()=>Object.assign(o,current.next));draw();}
 canvas.addEventListener('pointerup',()=>endDrag());canvas.addEventListener('pointercancel',()=>endDrag(true));
 return {draw,cancel(){endDrag(true);measurement=null;start=null;cursor=null;draw();},fit(){pan={x:0,z:0};draw();}};
}
