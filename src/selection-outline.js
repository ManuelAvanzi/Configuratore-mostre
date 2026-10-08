import {BoxHelper,Vector2} from 'three';
import {LineSegments2} from 'three/addons/lines/LineSegments2.js';
import {LineSegmentsGeometry} from 'three/addons/lines/LineSegmentsGeometry.js';
import {LineMaterial} from 'three/addons/lines/LineMaterial.js';

export function selectionOutline(target,color,renderer){
 const source=new BoxHelper(target),geometry=new LineSegmentsGeometry();
 const material=new LineMaterial({color,linewidth:4,depthTest:false,depthWrite:false});
 const outline=new LineSegments2(geometry,material);outline.renderOrder=1000;outline.frustumCulled=false;
 let previous=[];
 outline.update=()=>{
  source.update();const positions=source.geometry.attributes.position,index=source.geometry.index;
  const points=[];for(let i=0;i<index.count;i++){const n=index.getX(i);points.push(positions.getX(n),positions.getY(n),positions.getZ(n));}
  if(points.some((v,i)=>v!==previous[i])){if(geometry.attributes.instanceStart){const buffer=geometry.attributes.instanceStart.data;buffer.array.set(points);buffer.needsUpdate=true;geometry.computeBoundingBox();geometry.computeBoundingSphere();}else geometry.setPositions(points);previous=points;}material.resolution.copy(renderer.getSize(new Vector2()));
 };
 geometry.addEventListener('dispose',()=>{source.geometry.dispose();source.material.dispose();});
 outline.update();return outline;
}
