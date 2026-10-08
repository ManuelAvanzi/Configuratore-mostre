const scenes = [...document.querySelectorAll('.hero-scene')];
const buttons = [...document.querySelectorAll('[data-scene]')];
const toggle = document.querySelector('#motion-toggle');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let active = 0, paused = reduced.matches, visible = true, timer;
function schedule() {
  clearTimeout(timer);
  document.body.classList.toggle('slider-motion-paused', paused || !visible || document.hidden);
  if (!paused && visible && !document.hidden) timer = setTimeout(() => show((active + 1) % scenes.length), 12000);
}
function show(index) {
  active = index;
  scenes.forEach((scene, i) => scene.classList.toggle('active', i === index));
  buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
  schedule();
}
function sync() {
  toggle.textContent = paused ? '▶' : 'Ⅱ';
  toggle.setAttribute('aria-label', paused ? 'Riprendi lo slider' : 'Metti in pausa lo slider');
  toggle.setAttribute('aria-pressed', String(paused));
  schedule();
}
buttons.forEach((button, index) => button.addEventListener('click', () => show(index)));
toggle.addEventListener('click', () => { paused = !paused; sync(); });
reduced.addEventListener('change', () => { paused = reduced.matches; sync(); });
document.addEventListener('visibilitychange', schedule);
const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; schedule(); });
observer.observe(document.querySelector('.cinema-hero'));
window.addEventListener('pagehide', () => clearTimeout(timer));
window.addEventListener('pageshow', schedule);
sync();
