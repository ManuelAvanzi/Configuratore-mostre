// Geometry shared by the tracing gestures and their tests. Units are metres.
export function tracePoint(raw, start, walls, pixelsPerMetre, orthogonal=false) {
  const radius=10/pixelsPerMetre;
  const vertices=walls.flatMap(w=>[{x:w.ax,z:w.az},{x:w.bx,z:w.bz}]);
  const candidates=vertices.filter(v=>!start||Math.hypot(v.x-start.x,v.z-start.z)>.01);
  const nearest=candidates.sort((a,b)=>Math.hypot(raw.x-a.x,raw.z-a.z)-Math.hypot(raw.x-b.x,raw.z-b.z))[0];
  if(nearest&&Math.hypot(raw.x-nearest.x,raw.z-nearest.z)<radius)return {...nearest};
  if(!start)return {...raw};
  const dx=raw.x-start.x,dz=raw.z-start.z;
  if(orthogonal||Math.min(Math.abs(dx),Math.abs(dz))<6/pixelsPerMetre)
    return Math.abs(dx)>Math.abs(dz)?{x:raw.x,z:start.z}:{x:start.x,z:raw.z};
  return {...raw};
}

export function exactSegmentEnd(start,end,length) {
  const d=Math.hypot(end.x-start.x,end.z-start.z);
  if(!Number.isFinite(length)||length<=0||!d)return end;
  return {x:start.x+(end.x-start.x)*length/d,z:start.z+(end.z-start.z)*length/d};
}

export function referenceBounds(ref) {
  return {left:(ref.x||0)-ref.width/2,right:(ref.x||0)+ref.width/2,top:(ref.z||0)-ref.depth/2,bottom:(ref.z||0)+ref.depth/2};
}

export function movedCorner(walls,id,end,point) {
  const wall=walls.find(w=>w.id===id),x=wall[end+'x'],z=wall[end+'z'];
  const changes=walls.flatMap(w=>['a','b'].filter(k=>Math.hypot(w[k+'x']-x,w[k+'z']-z)<.001).map(k=>({id:w.id,end:k,locked:w.locked})));
  if(changes.some(c=>c.locked))throw Error('Questo angolo appartiene a una parete bloccata. Sblocca prima il lucchetto.');
  return changes.map(c=>({id:c.id,values:{[c.end+'x']:point.x,[c.end+'z']:point.z}}));
}

export async function readPlanImage(file) {
  if(file.size>30*1024*1024||!/^image\/(png|jpeg|webp)$/.test(file.type))throw Error('Scegli un’immagine JPG, PNG o WebP entro 30 MB.');
  const bitmap=await createImageBitmap(file);
  try {
    const ratio=Math.min(1,2400/Math.max(bitmap.width,bitmap.height));
    const canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*ratio);canvas.height=Math.round(bitmap.height*ratio);
    const c=canvas.getContext('2d');c.fillStyle='#fff';c.fillRect(0,0,canvas.width,canvas.height);c.drawImage(bitmap,0,0,canvas.width,canvas.height);
    const width=bitmap.width>=bitmap.height?12:12*bitmap.width/bitmap.height,depth=width*bitmap.height/bitmap.width;
    if(Math.min(width,depth)<.1)throw Error('La pianta è troppo stretta: ritaglia i margini del file.');
    return {src:canvas.toDataURL('image/jpeg',.92),width,depth,x:0,z:0,opacity:.85,locked:true,calibrated:false,name:file.name};
  } finally {bitmap.close();}
}
