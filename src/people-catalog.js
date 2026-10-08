// Ratios measured from the GLBs in their original standing poses.
// 1.75 m is a configurable design reference, not a measured human stature.
const entries=[
 ['person-business','Camicia azzurra',.3331502166880303,.37941768906793627,'#aac1c8'],
 ['person-casual-15','Camicia verde',.31117621925166333,.17975950680583533,'#7e8e65'],
 ['person-casual-35','Camicia blu',.3151437465665629,.1793322346334615,'#354556'],
 ['person-grey-blazer','Blazer grigio',.2827321003479216,.23402307269730818,'#a5a69f'],
 ['person-mint','Top menta',.28236586705731553,.40969297442470853,'#b4cab5'],
 ['person-sophia','Completo beige',.26018096866466767,.19064358983156587,'#bda789'],
];
export const peopleCatalog=entries.map(([type,name,widthRatio,depthRatio,color])=>({type,name,widthRatio,depthRatio,color,icon:'person-standing',category:'Persone',w:widthRatio*1.75,h:1.75,d:depthRatio*1.75,y:0}));
peopleCatalog.push({type:'person-wheelchair',modelFile:'person-wheelchair-joy',name:'Persona in carrozzina',widthRatio:0.4633501835706212,depthRatio:0.716015315633488,color:'#384855',icon:'person-standing',category:'Persone',w:0.6255227478203387,h:1.35,d:0.9666206761052089,y:0,attribution:'Joy in Motion — restore50 — CC BY 4.0. Geometria semplificata, texture ridotte e scala adattata. https://sketchfab.com/3d-models/joy-in-motion-e32d83e2aa6445e488f9393006aae8aa'});
export const legacyPeople={person:'person-casual-15','person-coat':'person-grey-blazer','person-child':'person-mint'};
export const personDefinition=type=>peopleCatalog.find(p=>p.type===(legacyPeople[type]||type));
export function sizePerson(object,height){const def=personDefinition(object.type);if(!def)throw Error('Persona non disponibile nel catalogo.');object.h=height;object.w=def.widthRatio*height;object.d=def.depthRatio*height;return object;}
export function migratePerson(object){if(object.type==='person-wheelchair'){object.modelFile='person-wheelchair-joy';object.attribution=personDefinition(object.type).attribution;return sizePerson(object,object.h);}const type=legacyPeople[object.type];if(!type)return object;const def=personDefinition(type);object.type=type;object.category='Persone';object.icon=def.icon;object.color=def.color;if(/^(Persona in piedi|Persona con cappotto|Bambino \/ bambina)/.test(object.name))object.name=def.name;return sizePerson(object,object.h);}
