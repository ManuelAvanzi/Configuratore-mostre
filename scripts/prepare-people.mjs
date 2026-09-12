import fs from 'node:fs/promises';
import sharp from 'sharp';
await fs.mkdir('public/people/models',{recursive:true});
const stats=[];
for(const file of await fs.readdir('assets/people/originals')){
 if(!file.endsWith('.glb'))continue;
 const source=await fs.readFile('assets/people/originals/'+file),jsonLength=source.readUInt32LE(12);
 const json=JSON.parse(source.subarray(20,20+jsonLength));
 const bin=source.subarray(28+jsonLength),parts=[];let offset=0;
 const images=new Map((json.images||[]).map(img=>[img.bufferView,img]));
 for(let i=0;i<json.bufferViews.length;i++){
  const view=json.bufferViews[i];let bytes=bin.subarray(view.byteOffset||0,(view.byteOffset||0)+view.byteLength);
  if(images.has(i)){
   const img=images.get(i),pipeline=sharp(bytes).resize({width:1024,height:1024,fit:'inside',withoutEnlargement:true});
   bytes=img.mimeType==='image/jpeg'?await pipeline.jpeg({quality:88}).toBuffer():await pipeline.png({compressionLevel:9}).toBuffer();
  }
  const padding=(4-offset%4)%4;if(padding){parts.push(Buffer.alloc(padding));offset+=padding;}
  view.byteOffset=offset;view.byteLength=bytes.length;view.buffer=0;parts.push(bytes);offset+=bytes.length;
 }
 const padding=(4-offset%4)%4;if(padding){parts.push(Buffer.alloc(padding));offset+=padding;}
 json.buffers=[{byteLength:offset}];
 let j=Buffer.from(JSON.stringify(json));j=Buffer.concat([j,Buffer.alloc((4-j.length%4)%4,0x20)]);
 const b=Buffer.concat(parts),header=Buffer.alloc(20),binHeader=Buffer.alloc(8);header.writeUInt32LE(0x46546c67,0);header.writeUInt32LE(2,4);header.writeUInt32LE(28+j.length+b.length,8);header.writeUInt32LE(j.length,12);header.writeUInt32LE(0x4e4f534a,16);binHeader.writeUInt32LE(b.length,0);binHeader.writeUInt32LE(0x004e4942,4);
 const output=Buffer.concat([header,j,binHeader,b]);await fs.writeFile('public/people/models/'+file,output);
 stats.push({file,originalBytes:source.length,browserBytes:output.length,textureMax:1024});console.log(file,Math.round(source.length/1024/1024)+' MB → '+(output.length/1024/1024).toFixed(1)+' MB');
}
await fs.writeFile('assets/people/optimization.json',JSON.stringify(stats,null,2));
