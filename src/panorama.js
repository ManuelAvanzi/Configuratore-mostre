import * as T from 'three';

// Capture all six directions from the visitor's eye, then unwrap to a 2:1 sphere.
export function capturePanorama(studio){
 const {renderer,scene,camera}=studio;
 if(renderer.xr.isPresenting)throw new Error('Esci dalla modalità immersiva prima di esportare.');
 const size=1024,width=4096,height=2048;
 const cube=new T.WebGLCubeRenderTarget(size,{type:T.HalfFloatType,generateMipmaps:false});
 const output=new T.WebGLRenderTarget(width,height,{depthBuffer:false});
 output.texture.colorSpace=T.SRGBColorSpace;
 const probe=new T.CubeCamera(.05,Math.max(camera.far,150),cube);probe.position.copy(camera.position);
 const geometry=new T.PlaneGeometry(2,2);
 const material=new T.ShaderMaterial({uniforms:{panorama:{value:cube.texture}},vertexShader:`varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`,fragmentShader:`uniform samplerCube panorama; varying vec2 vUv;
 void main(){float longitude=(vUv.x-.5)*6.28318530718;float latitude=(vUv.y-.5)*3.14159265359;vec3 direction=vec3(sin(longitude)*cos(latitude),sin(latitude),-cos(longitude)*cos(latitude));gl_FragColor=textureCube(panorama,direction);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`,depthTest:false,depthWrite:false});
 const quad=new T.Scene();quad.add(new T.Mesh(geometry,material));
 const previous=renderer.getRenderTarget(),tone=renderer.toneMapping;
 const hidden=[studio.transform?.getHelper(),studio.selection,studio.grid].filter(Boolean).map(o=>[o,o.visible]);
 try{
  hidden.forEach(([o])=>o.visible=false);
  renderer.toneMapping=T.NoToneMapping;probe.update(renderer,scene);
  renderer.toneMapping=tone;renderer.setRenderTarget(output);renderer.render(quad,new T.Camera());
  const pixels=new Uint8Array(width*height*4);renderer.readRenderTargetPixels(output,0,0,width,height,pixels);
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d'),image=ctx.createImageData(width,height),stride=width*4;
  for(let y=0;y<height;y++)image.data.set(pixels.subarray((height-1-y)*stride,(height-y)*stride),y*stride);
  ctx.putImageData(image,0,0);return canvas.toDataURL('image/png');
 }finally{renderer.toneMapping=tone;renderer.setRenderTarget(previous);hidden.forEach(([o,visible])=>o.visible=visible);cube.dispose();output.dispose();geometry.dispose();material.dispose();studio.renderFrame();}
}
