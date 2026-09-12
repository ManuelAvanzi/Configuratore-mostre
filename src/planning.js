import {wallLength,wallParts,round} from './model.js';

// Footprints use the same Y-axis rotation as the Three.js scene.
export function footprint(o){
 const a=o.rotation*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
 return [[-o.w/2,-o.d/2],[o.w/2,-o.d/2],[o.w/2,o.d/2],[-o.w/2,o.d/2]].map(([x,z])=>({x:o.x+x*c+z*s,z:o.z-x*s+z*c}));
}
export function containsPoint(o,x,z,padding=0){
 const a=o.rotation*Math.PI/180,dx=x-o.x,dz=z-o.z;
 return Math.abs(dx*Math.cos(a)-dz*Math.sin(a))<=o.w/2+padding&&Math.abs(dx*Math.sin(a)+dz*Math.cos(a))<=o.d/2+padding;
}
export function footprintsOverlap(a,b,tolerance=.005){
 const pa=footprint(a),pb=footprint(b);
 for(const polygon of [pa,pb])for(let i=0;i<2;i++){
  const u=polygon[i],v=polygon[i+1],length=Math.hypot(v.x-u.x,v.z-u.z),nx=-(v.z-u.z)/length,nz=(v.x-u.x)/length;
  const aa=pa.map(q=>q.x*nx+q.z*nz),bb=pb.map(q=>q.x*nx+q.z*nz);
  if(Math.min(Math.max(...aa),Math.max(...bb))-Math.max(Math.min(...aa),Math.min(...bb))<=tolerance)return false;
 }
 return true;
}
export function volumesOverlap(a,b){return Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)>.005&&footprintsOverlap(a,b);}
export function projectChecks(p){
 const issues=[],add=(id,title,detail)=>{if(issues.length<100)issues.push({id,title,detail});};
 const solids=p.walls.flatMap((w,index)=>{const length=wallLength(w),dx=(w.bx-w.ax)/length,dz=(w.bz-w.az)/length;return wallParts(w).map(part=>({id:w.id,label:`Parete ${index+1}`,x:w.ax+dx*(part.start+part.end)/2,z:w.az+dz*(part.start+part.end)/2,w:part.end-part.start,d:w.thickness,y:part.bottom,h:part.top-part.bottom,rotation:-Math.atan2(dz,dx)*180/Math.PI}));});
 for(let i=0;i<p.objects.length;i++){
  const o=p.objects[i];
  if(footprint(o).some(q=>Math.abs(q.x)>p.width/2+.005||Math.abs(q.z)>p.depth/2+.005))add(o.id,'Fuori dal pavimento',o.name);
  if(o.y<-.005||o.y+o.h>p.height+.005)add(o.id,'Quota fuori ambiente',`${o.name} · sommità ${round(o.y+o.h)} m`);
  const wall=solids.find(w=>volumesOverlap(o,w));if(wall)add(o.id,'Intersezione con parete',`${o.name} · ${wall.label}`);
  for(let j=i+1;j<p.objects.length&&issues.length<100;j++)if(volumesOverlap(o,p.objects[j]))add(o.id,'Ingombri sovrapposti',`${o.name} / ${p.objects[j].name}`);
 }
 return issues;
}
export function resizeRoom(p,key,value){
 const previous=p[key],axis=key==='width'?['ax','bx']:['az','bz'];
 // Move perimeter endpoints, preserving interior coordinates, assets and real dimensions.
 for(const wall of p.walls)for(const k of axis)if(Math.abs(Math.abs(wall[k])-previous/2)<.001)wall[k]=Math.sign(wall[k])*value/2;
 p[key]=value;
}
export function setWallLength(w,length){const ratio=length/wallLength(w);w.bx=w.ax+(w.bx-w.ax)*ratio;w.bz=w.az+(w.bz-w.az)*ratio;}
export const measureLength=m=>Math.hypot(m.bx-m.ax,m.bz-m.az);
export function measurementSVG(p){return (p.measurements||[]).map(m=>`<g stroke="#256b85" stroke-width=".025"><line x1="${m.ax}" y1="${m.az}" x2="${m.bx}" y2="${m.bz}" stroke-dasharray=".09 .05"/><circle cx="${m.ax}" cy="${m.az}" r=".045" fill="#256b85"/><circle cx="${m.bx}" cy="${m.bz}" r=".045" fill="#256b85"/><text x="${(m.ax+m.bx)/2}" y="${(m.az+m.bz)/2-.15}" fill="#256b85" stroke="none" text-anchor="middle" font-family="Arial" font-size=".24">${measureLength(m).toFixed(2)} m</text></g>`).join('');}
