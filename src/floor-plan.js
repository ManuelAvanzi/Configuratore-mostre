export const floorOutline=p=>p.floorOutline||[{x:-p.width/2,z:-p.depth/2},{x:p.width/2,z:-p.depth/2},{x:p.width/2,z:p.depth/2},{x:-p.width/2,z:p.depth/2}];
export const floorArea=p=>Math.abs(floorOutline(p).reduce((a,q,i,points)=>{const r=points[(i+1)%points.length];return a+q.x*r.z-r.x*q.z;},0))/2;
export function insideFloor(p,x,z,margin=0){
 const points=floorOutline(p);let inside=false,min=Infinity;
 for(let i=0,j=points.length-1;i<points.length;j=i++){
  const a=points[j],b=points[i],dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz)));
  min=Math.min(min,Math.hypot(x-a.x-t*dx,z-a.z-t*dz));
  if((a.z>z)!==(b.z>z)&&x<(b.x-a.x)*(z-a.z)/(b.z-a.z)+a.x)inside=!inside;
 }
 return margin===0&&min<.00001||inside&&min>=margin;
}
export function validateFloor(p){
 if(p.floorOutline===undefined)return;
 const v=p.floorOutline;
 if(!Array.isArray(v)||v.length<3||v.length>64||v.some(q=>!q||!Number.isFinite(q.x)||!Number.isFinite(q.z)||Math.abs(q.x)>p.width/2+.001||Math.abs(q.z)>p.depth/2+.001))throw Error('Perimetro del pavimento non valido.');
 const cross=(a,b,c)=>(b.x-a.x)*(c.z-a.z)-(b.z-a.z)*(c.x-a.x);
 for(let i=0;i<v.length;i++){
  const a=v[i],b=v[(i+1)%v.length];if(Math.hypot(a.x-b.x,a.z-b.z)<.01)throw Error('Vertici del pavimento sovrapposti.');
  for(let j=i+2;j<v.length;j++){if(i===0&&j===v.length-1)continue;const c=v[j],d=v[(j+1)%v.length];if(Math.max(a.x,b.x)>=Math.min(c.x,d.x)&&Math.max(c.x,d.x)>=Math.min(a.x,b.x)&&Math.max(a.z,b.z)>=Math.min(c.z,d.z)&&Math.max(c.z,d.z)>=Math.min(a.z,b.z)&&cross(a,b,c)*cross(a,b,d)<=0&&cross(c,d,a)*cross(c,d,b)<=0)throw Error('Il perimetro del pavimento si interseca.');}
 }
 if(floorArea(p)<1)throw Error('Superficie del pavimento non valida.');
}

export function footprintInFloor(p,points){
 if(points.some(q=>!insideFloor(p,q.x,q.z)))return false;
 const boundary=floorOutline(p),cross=(a,b,c)=>(b.x-a.x)*(c.z-a.z)-(b.z-a.z)*(c.x-a.x);
 for(let i=0;i<points.length;i++){
  const a=points[i],b=points[(i+1)%points.length];
  if(!insideFloor(p,(a.x+b.x)/2,(a.z+b.z)/2))return false;
  for(let j=0;j<boundary.length;j++){const c=boundary[j],d=boundary[(j+1)%boundary.length];if(cross(a,b,c)*cross(a,b,d)<-1e-10&&cross(c,d,a)*cross(c,d,b)<-1e-10)return false;}
 }
 return true;
}
