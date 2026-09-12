import {uid,round,item,wallLength,distanceToWall,openingFits} from './model.js';
import {containsPoint,footprint,measureLength} from './planning.js';

export function createPlanEditor(canvas,api){
 let start=null,cursor=null,drag=null,reference=null,scale=35,pan={x:0,z:0},panning=null;
 const point=e=>{const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left-r.width/2)/scale-pan.x,z:(e.clientY-r.top-r.height/2)/scale-pan.z};};
 function snap(q){
  if(!api.snap())return q;
  const p=api.project(),vertices=[...p.walls.flatMap(w=>[{x:w.ax,z:w.az},{x:w.bx,z:w.bz}]),...p.objects.flatMap(footprint)];
  const near=vertices.filter(v=>Math.hypot(q.x-v.x,q.z-v.z)<9/scale).sort((a,b)=>Math.hypot(q.x-a.x,q.z-a.z)-Math.hypot(q.x-b.x,q.z-b.z))[0];
  return near?{...near}:{x:round(Math.round(q.x*10)/10),z:round(Math.round(q.z*10)/10)};
 }
 function draw(){
  if(canvas.hidden)return;const p=api.project(),r=canvas.getBoundingClientRect(),width=r.width,height=r.height;if(!width||!height)return;
  canvas.width=width*devicePixelRatio;canvas.height=height*devicePixelRatio;const c=canvas.getContext('2d');c.scale(devicePixelRatio,devicePixelRatio);
  scale=Math.max(1,Math.min((width-110)/p.width,(height-170)/p.depth)*api.zoom());
  const to=q=>({x:width/2+(q.x+pan.x)*scale,z:height/2+(q.z+pan.z)*scale});
  const line=(a,b,color='#dbe1dc',weight=1,dash=[])=>{a=to(a);b=to(b);c.strokeStyle=color;c.lineWidth=weight;c.setLineDash(dash);c.beginPath();c.moveTo(a.x,a.z);c.lineTo(b.x,b.z);c.stroke();c.setLineDash([]);};
  const label=(q,text,color='#53675a')=>{q=to(q);c.font='12px "DM Sans", Arial';const tw=c.measureText(text).width;c.fillStyle='#fafcf8ed';c.fillRect(q.x-tw/2-5,q.z-10,tw+10,20);c.fillStyle=color;c.textAlign='center';c.textBaseline='middle';c.fillText(text,q.x,q.z);};
  c.fillStyle='#edf0ec';c.fillRect(0,0,width,height);const corner=to({x:-p.width/2,z:-p.depth/2});c.fillStyle='#fafbf7';c.fillRect(corner.x,corner.z,p.width*scale,p.depth*scale);
  if(p.reference){if(reference?.src!==p.reference.src){reference={src:p.reference.src,img:new Image()};reference.img.onload=draw;reference.img.src=p.reference.src;}if(reference.img.complete&&reference.img.naturalWidth){const q=to({x:-p.reference.width/2,z:-p.reference.depth/2});c.globalAlpha=.38;c.drawImage(reference.img,q.x,q.z,p.reference.width*scale,p.reference.depth*scale);c.globalAlpha=1;}}else reference=null;
  const step=scale<12?2:scale<25?1:.5;
  const left=-width/2/scale-pan.x,right=width/2/scale-pan.x,top=-height/2/scale-pan.z,bottom=height/2/scale-pan.z;
  for(let x=Math.ceil(left/step)*step;x<=right;x+=step)line({x,z:top},{x,z:bottom});
  for(let z=Math.ceil(top/step)*step;z<=bottom;z+=step)line({x:left,z},{x:right,z});
  line({x:left,z:0},{x:right,z:0},'#bac9be',1,[4,4]);line({x:0,z:top},{x:0,z:bottom},'#bac9be',1,[4,4]);
  for(const w of p.walls){line({x:w.ax,z:w.az},{x:w.bx,z:w.bz},w.id===api.selected()?'#52845d':'#3e5147',Math.max(2,w.thickness*scale));for(const o of w.openings){const length=wallLength(w),dx=(w.bx-w.ax)/length,dz=(w.bz-w.az)/length,a={x:w.ax+dx*o.offset,z:w.az+dz*o.offset},b={x:a.x+dx*o.width,z:a.z+dz*o.width};line(a,b,o.type==='window'?'#8cb8c7':'#fafbf7',w.thickness*scale+2);line(a,b,'#8a9e94',1,[3,3]);}label({x:(w.ax+w.bx)/2,z:(w.az+w.bz)/2-18/scale},wallLength(w).toFixed(2)+' m');}
  p.objects.forEach((original,index)=>{const o=drag?.id===original.id&&drag.next?{...original,...drag.next}:original;const corners=footprint(o).map(to);c.beginPath();corners.forEach((q,i)=>i?c.lineTo(q.x,q.z):c.moveTo(q.x,q.z));c.closePath();c.fillStyle=o.color;c.globalAlpha=.8;c.fill();c.globalAlpha=1;c.lineWidth=o.id===api.selected()?2.5:1;c.strokeStyle=o.id===api.selected()?'#226746':'#6b8173';c.stroke();if(Math.max(o.w,o.d)*scale>23)label({x:o.x,z:o.z},String(index+1));});
  function dimension(m,temporary=false){const a={x:m.ax,z:m.az},b={x:m.bx,z:m.bz};line(a,b,'#256b85',1.5,temporary?[5,4]:[]);for(const q of [a,b]){const v=to(q);c.fillStyle='#256b85';c.beginPath();c.arc(v.x,v.z,3.5,0,Math.PI*2);c.fill();}label({x:(m.ax+m.bx)/2,z:(m.az+m.bz)/2-14/scale},measureLength(m).toFixed(2)+' m','#256b85');}
  (p.measurements||[]).forEach(m=>dimension(m));
  if(start&&cursor){const m={ax:start.x,az:start.z,bx:cursor.x,bz:cursor.z};dimension(m,true);}
  if(cursor&&['measure','wall'].includes(api.tool())){const q=to(cursor);c.strokeStyle='#256b85';c.lineWidth=1;c.beginPath();c.moveTo(q.x-7,q.z);c.lineTo(q.x+7,q.z);c.moveTo(q.x,q.z-7);c.lineTo(q.x,q.z+7);c.stroke();}
  label({x:0,z:p.depth/2+35/scale},`${p.width.toFixed(2)} × ${p.depth.toFixed(2)} m`);
  c.textAlign='left';c.fillStyle='#667b6d';c.font='11px "DM Sans", Arial';c.fillText(`Griglia ${step*100} cm · Origine al centro · X → / Z ↓`,18,height-60);
  const readout=document.querySelector('#plan-readout');if(readout){readout.hidden=!start;readout.textContent=start&&cursor?`${api.tool()==='measure'?'Misura':'Parete'} · ${Math.hypot(cursor.x-start.x,cursor.z-start.z).toFixed(2)} m · clic per terminare`:'';}
 }
 function apply(change){try{api.change(change);}catch(error){api.notify(error.message);}}
 canvas.addEventListener('contextmenu',e=>e.preventDefault());
 canvas.addEventListener('pointerdown',e=>{
  if(e.button===1||e.button===2||e.altKey){e.preventDefault();panning={x:e.clientX,y:e.clientY,pan:{...pan}};canvas.setPointerCapture(e.pointerId);return;}
  const p=api.project(),raw=point(e),q=snap(raw),tool=api.tool();cursor=q;
  if(tool==='measure'||tool==='wall'){
   if(!start){start=q;draw();return;}if(Math.hypot(q.x-start.x,q.z-start.z)<.1)return;
   if(tool==='measure')apply(p=>{(p.measurements??=[]).push({id:uid(),ax:start.x,az:start.z,bx:q.x,bz:q.z});});
   else apply(p=>{const w={id:uid(),ax:start.x,az:start.z,bx:q.x,bz:q.z,height:p.height,thickness:.15,openings:[]};p.walls.push(w);});
   start=null;draw();return;
  }
  if(tool==='column'){const o=item('column',q.x,q.z);o.h=p.height;apply(p=>p.objects.push(o));api.select(o.id);return;}
  const nearest=p.walls.map(w=>({w,...distanceToWall(raw.x,raw.z,w)})).sort((a,b)=>a.distance-b.distance)[0];
  if(['door','window','opening'].includes(tool)){
   if(!nearest||nearest.distance>.4){api.notify('Tocca una parete per inserire l’apertura.');return;}
   const w=nearest.w,o={id:uid(),type:tool,width:tool==='door'?.9:1.2,height:tool==='window'?1.2:2.1,sill:tool==='window'?1:0,offset:round(Math.max(0,nearest.offset-(tool==='door'?.45:.6)))};
   if(!openingFits(w,o)){api.notify('L’apertura non entra o si sovrappone a un’altra.');return;}apply(()=>w.openings.push(o));api.select(w.id);return;
  }
  const obj=[...p.objects].reverse().find(o=>containsPoint(o,raw.x,raw.z,3/scale));api.select(obj?.id||(nearest?.distance<.3?nearest.w.id:null));
  if(obj){drag={id:obj.id,origin:{x:obj.x,z:obj.z},pointer:raw,screen:{x:e.clientX,y:e.clientY},moved:false};canvas.setPointerCapture(e.pointerId);}
 });
 canvas.addEventListener('pointermove',e=>{
  if(panning){pan={x:panning.pan.x+(e.clientX-panning.x)/scale,z:panning.pan.z+(e.clientY-panning.y)/scale};draw();return;}
  const raw=point(e);cursor=snap(raw);
  if(drag){if(!drag.moved&&Math.hypot(e.clientX-drag.screen.x,e.clientY-drag.screen.y)<4)return;drag.moved=true;const q={x:drag.origin.x+raw.x-drag.pointer.x,z:drag.origin.z+raw.z-drag.pointer.z};drag.next={x:api.snap()?Math.round(q.x*10)/10:round(q.x),z:api.snap()?Math.round(q.z*10)/10:round(q.z)};}
  draw();
 });
 function endDrag(cancel=false){if(panning){panning=null;return;}if(!drag)return;const current=drag;drag=null;const o=api.project().objects.find(o=>o.id===current.id);if(!o)return;if(current.moved&&!cancel)apply(()=>Object.assign(o,current.next));draw();}
 canvas.addEventListener('pointerup',()=>endDrag());canvas.addEventListener('pointercancel',()=>endDrag(true));
 return {draw,cancel(){endDrag(true);start=null;cursor=null;draw();},fit(){pan={x:0,z:0};draw();}};
}
