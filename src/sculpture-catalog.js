export const sculptureCatalog=[
 {type:'sculpture-ribbon',name:'Nastro · bronzo',color:'#b48752',w:1,h:1.8,d:.7},
 {type:'sculpture-portal',name:'Soglia · ceramica',color:'#ece1cf',w:1.1,h:1.65,d:.45},
 {type:'sculpture-balance',name:'Equilibrio · pietra',color:'#77877e',w:1,h:1.7,d:.8},
 {type:'sculpture-orbit',name:'Orbite · rame',color:'#b36d4d',w:1.3,h:1.55,d:1}
].map(o=>({...o,icon:'gem',category:'Opere',y:0}));
export const isSculpture=type=>type==='sculpture'||sculptureCatalog.some(o=>o.type===type);
