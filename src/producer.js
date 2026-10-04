import './producer.css';
export const producer = (compact = false) => `<section class="producer-credit${compact ? ' producer-credit--compact' : ''}" aria-label="Produttore del software"><span>Un software di</span><img src="/brand/carrarolab.png" alt="CarraroLAB" width="2156" height="457" /></section>`;
