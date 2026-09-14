import * as T from 'three';
import {surface} from './surfaces.js';

const patterns=new Map();
function pattern(kind){
 if(patterns.has(kind))return patterns.get(kind);
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const ctx=canvas.getContext('2d');
 let seed=314159;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const data=ctx.createImageData(256,256);
 for(let y=0;y<256;y++)for(let x=0;x<256;x++){
  let v=235;const noise=random()-.5;
  if(kind==='oak'){const board=x<128?0:1,grain=Math.sin(x*.39+Math.sin(y*.027)*1.7)+Math.sin(x*.94+Math.sin(y*.016)*2);v=218+grain*10+noise*13+board*7;if(x%128<2||(y+board*128)%256<2)v=140;}
  else if(kind==='concrete')v=222+noise*22+Math.sin(x*.042)*Math.cos(y*.037)*12;
  else if(kind==='plaster')v=243+noise*17;
  else if(kind==='carpet')v=218+noise*50+(x%3===0?-13:0);
  else if(kind==='stone'){v=229+noise*15+Math.sin(x*.043+y*.018+Math.sin(y*.025))*9;if(x<2||y<2)v=160;}
  else if(kind==='metal')v=231+noise*9+Math.sin(y*2)*9;
  else if(kind==='resin')v=248+noise*7;
  const i=(y*256+x)*4;data.data[i]=data.data[i+1]=data.data[i+2]=Math.max(0,Math.min(255,v));data.data[i+3]=255;
 }
 ctx.putImageData(data,0,0);patterns.set(kind,canvas);return canvas;
}
export function surfaceMaterial(value,color){
 const s=surface(value,color),roughness={matte:.94,satin:.48,gloss:.16}[s.finish];
 const m=new T.MeshStandardMaterial({color:s.color,roughness,metalness:s.material==='metal'?.72:0});
 if(s.material!=='paint'){
  const map=new T.CanvasTexture(pattern(s.material));map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;map.repeat.set(1/(s.scale*(s.material==='oak'?2:1)),1/(s.scale*(s.material==='oak'?6:1)));map.rotation=s.rotation*Math.PI/180;map.anisotropy=4;
  const bump=map.clone();bump.colorSpace=T.NoColorSpace;bump.needsUpdate=true;m.map=map;m.bumpMap=bump;m.bumpScale={oak:.007,plaster:.012,concrete:.009,carpet:.016,stone:.008,metal:.002,resin:.001}[s.material];
 }
 return m;
}
// UV coordinates are metres, anchored to the whole surface, including across openings.
export function surfaceUV(geometry,offset={x:0,y:0,z:0}){
 const pos=geometry.attributes.position,norm=geometry.attributes.normal,uv=geometry.attributes.uv;
 for(let i=0;i<pos.count;i++){const x=pos.getX(i)+offset.x,y=pos.getY(i)+offset.y,z=pos.getZ(i)+offset.z;if(Math.abs(norm.getY(i))>.5)uv.setXY(i,x,z);else if(Math.abs(norm.getX(i))>.5)uv.setXY(i,z,y);else uv.setXY(i,x,y);}uv.needsUpdate=true;
}
export function surfacePreview(canvas,s){
 const ctx=canvas.getContext('2d');canvas.width=240;canvas.height=110;ctx.fillStyle=s.color;ctx.fillRect(0,0,240,110);
 if(s.material!=='paint'){ctx.save();ctx.globalCompositeOperation='multiply';ctx.translate(120,55);ctx.rotate(-s.rotation*Math.PI/180);const tile=pattern(s.material),width=s.material==='oak'?60:110,height=s.material==='oak'?180:110;for(let x=-360;x<360;x+=width)for(let y=-360;y<360;y+=height)ctx.drawImage(tile,x,y,width,height);ctx.restore();}
 const light=ctx.createLinearGradient(0,0,240,110);light.addColorStop(0,s.finish==='gloss'?'#ffffff80':s.finish==='satin'?'#ffffff35':'#ffffff15');light.addColorStop(1,'#00000010');ctx.fillStyle=light;ctx.fillRect(0,0,240,110);
}
