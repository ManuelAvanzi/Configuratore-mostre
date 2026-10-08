import * as T from 'three';

// Original stylized seated figure and manual wheelchair, dimensions in metres.
export function createWheelchairPerson(){
 const g=new T.Group();
 const mat=(color,metalness=0,roughness=.65)=>new T.MeshStandardMaterial({color,metalness,roughness});
 const frame=mat('#737d84',.8,.28),rubber=mat('#25292b'),seat=mat('#293943'),shirt=mat('#527c91'),pants=mat('#384855'),skin=mat('#bd8e70'),hair=mat('#3e3028');
 const add=(geo,m,x,y,z)=>{const mesh=new T.Mesh(geo,m);mesh.position.set(x,y,z);g.add(mesh);return mesh;};
 const box=(w,h,d,m,x,y,z)=>add(new T.BoxGeometry(w,h,d),m,x,y,z);
 const ellipsoid=(rx,ry,rz,m,x,y,z)=>{const mesh=add(new T.SphereGeometry(1,24,16),m,x,y,z);mesh.scale.set(rx,ry,rz);return mesh;};
 const rod=(a,b,r,m)=>{const av=new T.Vector3(...a),bv=new T.Vector3(...b),delta=bv.clone().sub(av);const mesh=add(new T.CylinderGeometry(r,r,delta.length(),12),m,...av.clone().add(bv).multiplyScalar(.5).toArray());mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());};
 for(const x of [-.315,.315]){
  const wheel=add(new T.TorusGeometry(.295,.022,10,48),rubber,x,.317,-.12);wheel.rotation.y=Math.PI/2;
  const rim=add(new T.TorusGeometry(.25,.01,8,48),frame,x+Math.sign(x)*.035,.317,-.12);rim.rotation.y=Math.PI/2;
  for(let i=0;i<16;i++){const a=i*Math.PI/8;rod([x,.317,-.12],[x,.317+Math.sin(a)*.278,-.12+Math.cos(a)*.278],.0025,frame);}
  ellipsoid(.025,.028,.028,frame,x,.317,-.12);
  const front=add(new T.CylinderGeometry(.065,.065,.034,24),rubber,x*.8,.065,.42);front.rotation.z=Math.PI/2;
  rod([x*.8,.065,.42],[x*.8,.23,.38],.014,frame);
  rod([x*.8,.22,.38],[x*.8,.49,-.22],.018,frame);
  rod([x*.8,.24,-.18],[x*.8,.88,-.25],.017,frame);
  rod([x*.8,.88,-.25],[x*.8,.88,-.36],.015,rubber);
  rod([x*.8,.47,.18],[x*.8,.68,.18],.014,frame);
  box(.055,.035,.34,rubber,x*.8,.7,.015);
 }
 rod([-.25,.25,-.16],[.25,.45,.2],.012,frame);rod([.25,.25,-.16],[-.25,.45,.2],.012,frame);
 box(.46,.055,.43,seat,0,.49,-.005);box(.46,.37,.045,seat,0,.7,-.23);
 for(const x of [-.12,.12]){rod([x,.42,.21],[x,.12,.52],.012,frame);box(.18,.022,.2,rubber,x,.1,.49);}
 // Upright torso, bent hips/knees, hands resting naturally on the thighs.
 ellipsoid(.19,.245,.12,shirt,0,.78,-.035);ellipsoid(.19,.085,.16,pants,0,.55,.025);
 for(const x of [-.11,.11]){
  rod([x,.555,.015],[x,.535,.32],.083,pants);ellipsoid(.082,.076,.079,pants,x,.535,.32);
  rod([x,.51,.32],[x,.18,.41],.055,pants);ellipsoid(.068,.048,.135,rubber,x,.155,.465);
 }
 for(const sign of [-1,1]){
  ellipsoid(.085,.09,.087,shirt,sign*.175,.91,-.025);
  rod([sign*.185,.9,-.015],[sign*.225,.705,.045],.056,shirt);
  rod([sign*.225,.705,.045],[sign*.155,.64,.255],.038,skin);
  ellipsoid(.045,.025,.069,skin,sign*.145,.63,.29);
 }
 rod([0,.97,-.035],[0,1.045,-.025],.05,skin);
 ellipsoid(.09,.125,.09,skin,0,1.14,-.02);ellipsoid(.093,.063,.093,hair,0,1.217,-.03);
 ellipsoid(.019,.027,.025,skin,0,1.13,.066);
 for(const x of [-.034,.034])ellipsoid(.009,.006,.004,rubber,x,1.17,.063);
 rod([-.022,1.095,.061],[.022,1.095,.061],.0025,hair);
 g.updateMatrixWorld(true);const b=new T.Box3().setFromObject(g),center=b.getCenter(new T.Vector3());g.position.set(-center.x,-b.min.y,-center.z);
 const root=new T.Group();root.add(g);return root;
}
