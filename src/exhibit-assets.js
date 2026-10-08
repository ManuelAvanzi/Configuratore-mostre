import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import * as T from 'three';

// Lightweight native geometry: no remote downloads, real dimensions and editable finishes.
export function createExhibitAsset(o){
 const g=new T.Group(),body=new T.MeshStandardMaterial({color:o.color,roughness:.65});
 const metal=new T.MeshStandardMaterial({color:'#525957',metalness:.8,roughness:.3});
 const add=(geo,x,y,z,mat=body)=>{const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;g.add(m);return m;};
 const box=(w,h,d,x,y,z,mat)=>add(new T.BoxGeometry(w,h,d),x,y,z,mat);
 const cyl=(r,h,x,y,z,mat)=>add(new T.CylinderGeometry(r,r,h,32),x,y,z,mat);
 const legs=(w,d,h)=>{for(const x of [-w/2,w/2])for(const z of [-d/2,d/2])box(.045,h,.045,x,h/2,z);};
 const rod=(a,b,r,mat=body)=>{const start=new T.Vector3(...a),end=new T.Vector3(...b),delta=end.clone().sub(start);const m=add(new T.CylinderGeometry(r,r,delta.length(),12),...start.clone().add(end).multiplyScalar(.5).toArray(),mat);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());};
 switch(o.type){
  case 'exhibit-chair':box(.5,.055,.5,0,.45,0);legs(.41,.41,.45);box(.5,.35,.055,0,.65,-.225);break;
  case 'exhibit-stool':cyl(.2,.06,0,.45,0);legs(.25,.25,.42);break;
  case 'exhibit-round-table':cyl(.55,.045,0,.7275,0);cyl(.055,.68,0,.37,0,metal);cyl(.32,.045,0,.0225,0,metal);break;
  case 'exhibit-sofa':box(1.8,.18,.8,0,.3,0);box(1.8,.4,.15,0,.6,-.325);for(const x of [-.82,.82])box(.16,.4,.8,x,.52,0);for(const x of [-.4,.4])box(.78,.14,.65,x,.45,.06);legs(1.5,.6,.22);break;
  case 'exhibit-shelf':for(const x of [-.575,.575])box(.05,1.8,.35,x,.9,0);for(const y of [.025,.46,.9,1.34,1.775])box(1.2,.05,.35,0,y,0);break;
  case 'exhibit-round-plinth':cyl(.3,.9,0,.45,0);break;
  case 'exhibit-display-table':box(1.6,.075,.8,0,.8125,0);legs(1.4,.6,.78);break;
  case 'exhibit-display-case':{
   box(.8,.45,.6,0,.225,0);box(.8,.045,.6,0,1.875,0);
   for(const x of [-.375,.375])for(const z of [-.275,.275])box(.03,1.43,.03,x,1.16,z,metal);
   const glass=new T.MeshPhysicalMaterial({color:'#d9edf0',transparent:true,opacity:.18,roughness:.08,depthWrite:false});
   for(const z of [-.29,.29]){const m=box(.75,1.4,.012,0,1.16,z,glass);m.userData.preserveContent=true;m.castShadow=false;}
   for(const x of [-.39,.39]){const m=box(.012,1.4,.55,x,1.16,0,glass);m.userData.preserveContent=true;m.castShadow=false;}
   for(const y of [.85,1.32])box(.75,.015,.55,0,y,0);break;
  }
  case 'exhibit-rope-barrier':for(const x of [-.74,.74]){cyl(.16,.035,x,.0175,0,metal);cyl(.025,.93,x,.5,0,metal);add(new T.SphereGeometry(.045,16,12),x,.97,0,metal);}add(new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(-.74,.93,0),new T.Vector3(0,.74,0),new T.Vector3(.74,.93,0)]),24,.025,8,false),0,0,0);break;
  case 'exhibit-easel':rod([-.3,0,.22],[-.06,1.7,-.06],.025);rod([.3,0,.22],[.06,1.7,-.06],.025);rod([0,0,-.3],[0,1.5,-.06],.025);box(.65,.065,.13,0,.6,.08);box(.45,.055,.055,0,1.22,0);break;
  case 'exhibit-lectern':box(.4,.035,.35,0,.0175,0,metal);box(.06,1,.06,0,.51,0,metal);{const top=box(.55,.04,.45,0,1.04,0);top.rotation.x=.3;}break;
  case 'exhibit-kiosk':{
   box(.6,.04,.35,0,.02,0);
   add(new RoundedBoxGeometry(.38,1.05,.12,3,.02),0,.565,-.04);
   const screenGroup=new T.Group();screenGroup.position.set(0,1.24,0);screenGroup.rotation.x=-.12;g.add(screenGroup);
   const shell=new T.Mesh(new RoundedBoxGeometry(.6,.8,.065,3,.025),body);shell.castShadow=shell.receiveShadow=true;screenGroup.add(shell);
   const display=new T.Mesh(new T.PlaneGeometry(.52,.7),new T.MeshStandardMaterial({color:'#203f42',roughness:.25,emissive:'#12292c',emissiveIntensity:.2}));display.position.z=.034;display.userData.preserveContent=true;display.userData.screen=true;screenGroup.add(display);
   break;
  }
 }
 g.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(g),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
 const root=new T.Group();root.add(g);g.position.set(-center.x,-bounds.min.y,-center.z);root.scale.set(o.w/size.x,o.h/size.y,o.d/size.z);return root;
}
