import {validate} from './model.js';
export const MAX_PROJECT_FILE = 150 * 1024 * 1024;
export function projectFromGLB(buffer){
 const view=new DataView(buffer);
 if(buffer.byteLength<20||view.getUint32(0,true)!==0x46546c67||view.getUint32(4,true)!==2||view.getUint32(8,true)!==buffer.byteLength)throw Error('File GLB non valido.');
 const length=view.getUint32(12,true);
 if(view.getUint32(16,true)!==0x4e4f534a||length%4||20+length>buffer.byteLength)throw Error('Dati GLB non validi.');
 const json=JSON.parse(new TextDecoder().decode(new Uint8Array(buffer,20,length)));
 const metadata=json.scenes?.[json.scene??0]?.extras?.spazio;
 if(!metadata)throw Error('Questo GLB non contiene un progetto Spazio modificabile. Puoi aggiungerlo come singolo modello 3D dal catalogo.');
 if(metadata.version!==1)throw Error('Versione del progetto GLB non supportata.');
 return validate(metadata.project);
}
export async function readProjectFile(file){
 if(file.size>MAX_PROJECT_FILE)throw Error('Il file supera il limite di 150 MB.');
 const buffer=await file.arrayBuffer();
 return buffer.byteLength>=4&&new DataView(buffer).getUint32(0,true)===0x46546c67?projectFromGLB(buffer):validate(JSON.parse(new TextDecoder().decode(buffer)));
}
