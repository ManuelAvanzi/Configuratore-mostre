const cache=new Map();
export function materialCanvas(kind){
 if(cache.has(kind))return cache.get(kind);
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
 const c=canvas.getContext('2d');let seed=47;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 c.fillStyle={cork:'#af8558',rubber:'#3b3e3e',felt:'#a8aaa2',ceramic:'#e6ddd0',terracotta:'#ac6043',speckle:'#ddd8cd'}[kind];c.fillRect(0,0,256,256);
 for(let i=0;i<5500;i++){const shade=random()>.5?255:0;c.fillStyle=`rgba(${shade},${shade},${shade},${random()*.16})`;const size=kind==='cork'?2+random()*5:1;c.fillRect(random()*256,random()*256,size,size);}
 if(['ceramic','terracotta'].includes(kind)){c.strokeStyle=kind==='terracotta'?'#d5bda1':'#aaa698';c.lineWidth=3;for(let i=0;i<=256;i+=64){c.beginPath();c.moveTo(i,0);c.lineTo(i,256);c.moveTo(0,i);c.lineTo(256,i);c.stroke();}}
 if(kind==='rubber'){c.fillStyle='#626666';for(let x=16;x<256;x+=32)for(let y=16;y<256;y+=32){c.beginPath();c.arc(x,y,5,0,Math.PI*2);c.fill();}}
 if(kind==='felt'){c.globalAlpha=.17;c.strokeStyle='#505749';c.lineWidth=1;for(let x=0;x<256;x+=3){c.beginPath();c.moveTo(x,0);c.lineTo(x,256);c.stroke();}c.globalAlpha=1;}
 if(kind==='speckle'){for(let i=0;i<420;i++){c.fillStyle=['#f4eee4','#786f66','#a3a69d','#b79580'][i%4];const x=random()*256,y=random()*256;c.beginPath();c.moveTo(x,y);c.lineTo(x+2+random()*5,y+random()*3);c.lineTo(x+random()*4,y+2+random()*6);c.closePath();c.fill();}}
 cache.set(kind,canvas);return canvas;
}
const previews=new Map();
export function materialThumbnail(kind){if(!previews.has(kind))previews.set(kind,materialCanvas(kind).toDataURL());return previews.get(kind);}
