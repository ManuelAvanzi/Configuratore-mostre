const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const hero = document.querySelector('.cinema-hero');
const scenes = [...document.querySelectorAll('.hero-scene')];
const buttons = [...document.querySelectorAll('[data-scene]')];
const toggle = document.querySelector('#motion-toggle');
const desktopFilm=matchMedia('(min-width: 701px)');
const films=['luce','terra','soglia'].map(name=>{
 const video=document.createElement('video');video.className='hero-film';video.muted=true;video.loop=false;video.playsInline=true;video.preload='none';video.setAttribute('aria-hidden','true');video.dataset.src=`/marketing/hero-${name}-forward.webm`;
 video.addEventListener('loadeddata',()=>video.classList.add('ready'));
 video.addEventListener('seeked',()=>video.classList.add('ready'));
 video.addEventListener('ended',()=>{if(films[active]===video&&!paused&&!document.hidden&&visible)show((active+1)%scenes.length);});
 video.addEventListener('error',()=>{video.classList.remove('ready');video.dataset.failed='true';schedule();});
 hero.querySelector('.hero-scenes').append(video);return video;
});
let active = 0, paused = reduced.matches, timer, frame, visible = true;
function syncFilms(){
 films.forEach((video,i)=>{
  video.classList.toggle('active',i===active&&desktopFilm.matches&&!reduced.matches);
  if(i===active&&!paused&&!document.hidden&&visible&&desktopFilm.matches){
   if(!video.hasAttribute('src'))video.src=video.dataset.src;
   video.play().then(()=>{if(video.readyState>=2&&!video.seeking)video.classList.add('ready');}).catch(()=>{});
  }else video.pause();
 });
}
desktopFilm.addEventListener('change',schedule);
function schedule() {
  clearTimeout(timer);
  syncFilms();
  if (!paused && !document.hidden && visible){
  if(desktopFilm.matches&&films[active].ended){show((active+1)%scenes.length);return;}
  if(!desktopFilm.matches||films[active].dataset.failed)timer=setTimeout(()=>show((active+1)%scenes.length),9000);
 }
}
function show(index) {
  if(index!==active){const next=films[index];next.classList.remove('ready');if(next.readyState>0)next.currentTime=0;}
  active = index;
  scenes.forEach((scene, i) => scene.classList.toggle('active', i === index));
  buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
  schedule();
}
function syncMotion() {
  document.body.classList.toggle('motion-paused', paused);
  toggle.textContent = paused ? '▶' : 'Ⅱ';
  toggle.setAttribute('aria-label', paused ? 'Riprendi le animazioni' : 'Metti in pausa le animazioni');
  toggle.setAttribute('aria-pressed', String(paused));
  schedule();
}
buttons.forEach((button, index) => button.addEventListener('click', () => show(index)));
toggle.addEventListener('click', () => {paused = !paused; syncMotion();});
reduced.addEventListener('change', () => {paused = reduced.matches; syncMotion();});
document.addEventListener('visibilitychange', schedule);
window.addEventListener('scroll', () => {
  if (frame || paused || reduced.matches || !visible) return;
  frame = requestAnimationFrame(() => {hero.style.setProperty('--parallax', `${Math.min(scrollY * .13, 100)}px`); frame = null;});
}, {passive:true});
const heroObserver = new IntersectionObserver(entries => {visible = entries[0].isIntersecting; schedule();});
heroObserver.observe(hero);
const reveal = new IntersectionObserver(entries => {
  entries.forEach(entry => {if (entry.isIntersecting) {entry.target.classList.add('revealed'); reveal.unobserve(entry.target);}});
}, {threshold:.12});
document.querySelectorAll('.intro-line,.section-heading,.steps article,.experience-copy,.walk-figure,.finish-story>div,.start-heading,.start-card,.audience-cards article,.immersive,.faq-section,.closing').forEach((element,index) => {
  element.dataset.reveal = '';
  element.style.setProperty('--reveal-delay', `${element.matches('.steps article,.start-card,.audience-cards article') ? index % 3 * 80 : 0}ms`);
  reveal.observe(element);
});
document.body.classList.add('motion-ready');
syncMotion();
window.addEventListener('pagehide', event => {
  films.forEach(video=>video.pause());
  clearTimeout(timer); cancelAnimationFrame(frame); frame = null;
  if (!event.persisted) {reveal.disconnect(); heroObserver.disconnect();}
});
window.addEventListener('pageshow', schedule);
