import * as T from 'three';
export function createSculpture(o){
 const group=new T.Group();
 const metal=['sculpture','sculpture-ribbon','sculpture-orbit'].includes(o.type);
 const material=new T.MeshStandardMaterial({color:o.color,metalness:metal?.78:.06,roughness:metal?.28:.65});
 const add=(geometry,x=0,y=0,z=0)=>{const mesh=new T.Mesh(geometry,material);mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);return mesh;};
 if(o.type==='sculpture-portal'){
  const outer=new T.Shape();outer.moveTo(-.55,0);outer.lineTo(.55,0);outer.lineTo(.55,1);outer.bezierCurveTo(.55,1.8,-.55,1.8,-.55,1);outer.closePath();
  const hole=new T.Path();hole.moveTo(-.27,.28);hole.lineTo(-.27,1);hole.bezierCurveTo(-.27,1.43,.27,1.43,.27,1);hole.lineTo(.27,.28);hole.closePath();outer.holes.push(hole);
  add(new T.ExtrudeGeometry(outer,{depth:.3,bevelEnabled:true,bevelThickness:.06,bevelSize:.06,bevelSegments:5,steps:1,curveSegments:48}));
 }else if(o.type==='sculpture-ribbon'){
  const positions=[],uv=[],indices=[],steps=180,sides=12;
  // A broad elliptical ribbon section sweeps around a rising, open spiral.
  const curve=new T.CatmullRomCurve3(Array.from({length:81},(_,i)=>{const t=i/80,a=t*Math.PI*3.5;return new T.Vector3(Math.cos(a)*(.43-.18*t),t*1.8,Math.sin(a)*(.43-.18*t));}));
  const frames=curve.computeFrenetFrames(steps,false);
  for(let i=0;i<=steps;i++){const center=curve.getPointAt(i/steps);for(let j=0;j<=sides;j++){const a=j/sides*Math.PI*2;const v=center.clone().addScaledVector(frames.normals[i],Math.cos(a)*.145).addScaledVector(frames.binormals[i],Math.sin(a)*.038);positions.push(v.x,v.y,v.z);uv.push(j/sides,i/steps);if(i<steps&&j<sides){const n=i*(sides+1)+j;indices.push(n,n+sides+1,n+1,n+1,n+sides+1,n+sides+2);}}}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();material.side=T.DoubleSide;add(g);
 }else if(o.type==='sculpture-balance'){
  for(const [x,y,sx,sy,sz,angle] of [[0,.22,.52,.22,.39,0],[-.1,.61,.4,.2,.31,-.2],[.07,1.02,.32,.24,.27,.25],[-.05,1.4,.22,.17,.2,-.15]]){const m=add(new T.SphereGeometry(1,48,32),x,y);m.scale.set(sx,sy,sz);m.rotation.z=angle;}
 }else if(o.type==='sculpture-orbit'){
  const a=add(new T.TorusGeometry(.48,.055,20,128),0,.63);a.rotation.y=.6;
  const b=add(new T.TorusGeometry(.4,.045,20,128),0,.63);b.rotation.y=-.9;b.rotation.x=.35;
  add(new T.SphereGeometry(.15,40,24),0,.63);add(new T.CylinderGeometry(.035,.045,.24,24),0,.12);add(new T.CylinderGeometry(.27,.29,.06,48),0,.03);
 }else add(new T.TorusKnotGeometry(.3,.11,192,32));
 group.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(group),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
 const root=new T.Group();root.add(group);group.position.set(-center.x,-bounds.min.y,-center.z);root.scale.set(o.w/size.x,o.h/size.y,o.d/size.z);return root;
}
