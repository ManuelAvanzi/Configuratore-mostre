export function cropReference(ref,rect,size){
 const {x,y,width,height}=rect;
 if(width<2||height<2||x<0||y<0||x+width>size.width||y+height>size.height)throw Error('Seleziona un rettangolo dentro l’immagine.');
 return {...ref,width:ref.width*width/size.width,depth:ref.depth*height/size.height,x:(ref.x||0)+((x+width/2)/size.width-.5)*ref.width,z:(ref.z||0)+((y+height/2)/size.height-.5)*ref.depth};
}

export async function mountPlanCrop(canvas,button,reset,ref,onApply){
 const image=new Image();image.src=ref.src;await image.decode();
 const ratio=Math.min(1,1000/image.width,620/image.height);canvas.width=Math.round(image.width*ratio);canvas.height=Math.round(image.height*ratio);
 const ctx=canvas.getContext('2d');let anchor=null,rect=null;
 const point=e=>{const r=canvas.getBoundingClientRect();return {x:Math.max(0,Math.min(canvas.width,(e.clientX-r.left)*canvas.width/r.width)),y:Math.max(0,Math.min(canvas.height,(e.clientY-r.top)*canvas.height/r.height))};};
 function draw(){ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);if(rect){ctx.fillStyle='#16392c88';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,rect.x/ratio,rect.y/ratio,rect.width/ratio,rect.height/ratio,rect.x,rect.y,rect.width,rect.height);ctx.strokeStyle='#ed9100';ctx.lineWidth=2;ctx.strokeRect(rect.x,rect.y,rect.width,rect.height);}button.disabled=!rect||rect.width<5||rect.height<5;}
 canvas.onpointerdown=e=>{anchor=point(e);rect=null;canvas.setPointerCapture(e.pointerId);};
 canvas.onpointermove=e=>{if(!anchor)return;const q=point(e);rect={x:Math.min(q.x,anchor.x),y:Math.min(q.y,anchor.y),width:Math.abs(q.x-anchor.x),height:Math.abs(q.y-anchor.y)};draw();};
 canvas.onpointerup=()=>{anchor=null;};canvas.onpointercancel=()=>{anchor=null;rect=null;draw();};
 reset.onclick=()=>{rect=null;draw();};
 button.onclick=()=>{if(!rect)return;const crop={x:Math.round(rect.x/ratio),y:Math.round(rect.y/ratio),width:Math.round(rect.width/ratio),height:Math.round(rect.height/ratio)};crop.width=Math.min(crop.width,image.width-crop.x);crop.height=Math.min(crop.height,image.height-crop.y);const next=cropReference(ref,crop,{width:image.width,height:image.height});const out=document.createElement('canvas');out.width=crop.width;out.height=crop.height;out.getContext('2d').drawImage(image,crop.x,crop.y,crop.width,crop.height,0,0,out.width,out.height);next.src=out.toDataURL('image/jpeg',.92);onApply(next);};draw();
}
