// One committed change per gesture: dragging must not rebuild the editor on every pixel.
let gesture=null;
function enhance(){
 document.querySelectorAll('input[type=number]:not([data-scrubbable])').forEach(input=>{
  input.dataset.scrubbable='true';
  const button=document.createElement('button');button.type='button';button.className='number-scrub';button.textContent='↔';
  button.title='Trascina per cambiare il valore · Maiusc: precisione · Esc: annulla';
  button.setAttribute('aria-label','Regola '+(input.getAttribute('aria-label')||input.closest('label')?.textContent.trim()||'valore'));
  button.disabled=input.disabled;input.after(button);
  button.addEventListener('pointerdown',e=>{
   if(e.button!==0||input.disabled)return;
   e.preventDefault();e.stopPropagation();
   gesture={input,button,x:e.clientX,start:input.value,value:Number(input.value)||0,step:Number(input.step)||1};
   button.setPointerCapture(e.pointerId);document.body.classList.add('scrubbing-number');
  });
  button.addEventListener('keydown',e=>{
   if(!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();
   input.value=clamp(input,(Number(input.value)||0)+(e.key==='ArrowRight'?1:-1)*(Number(input.step)||1));input.dispatchEvent(new Event('change',{bubbles:true}));
  });
 });
}
function clamp(input,value){return String(Number(Math.max(input.min===''?-Infinity:Number(input.min),Math.min(input.max===''?Infinity:Number(input.max),value)).toFixed(6)));}
document.addEventListener('pointermove',e=>{
 if(!gesture)return;const g=gesture,steps=Math.round((e.clientX-g.x)/(e.shiftKey?15:3));
 g.input.value=clamp(g.input,g.value+steps*g.step);
 g.input.dispatchEvent(new Event('input',{bubbles:true}));
});
function finish(cancel=false){if(!gesture)return;const g=gesture;gesture=null;document.body.classList.remove('scrubbing-number');if(cancel)g.input.value=g.start;else if(g.input.value!==g.start)g.input.dispatchEvent(new Event('change',{bubbles:true}));}
document.addEventListener('pointerup',()=>finish());
document.addEventListener('pointercancel',()=>finish(true));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&gesture){e.preventDefault();e.stopImmediatePropagation();finish(true);}},true);
new MutationObserver(enhance).observe(document.documentElement,{childList:true,subtree:true});
enhance();
