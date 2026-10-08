export function calibratedReference(reference, measured, actual){
 if(!reference||!Number.isFinite(measured)||measured<=0||!Number.isFinite(actual)||actual<=0)throw Error('Indica una misura reale maggiore di zero.');
 const ratio=actual/measured,width=reference.width*ratio,depth=reference.depth*ratio;
 if(Math.min(width,depth)<.1||Math.max(width,depth)>200)throw Error('La scala porta la pianta fuori dai limiti di 0,1–200 m. Controlla i due punti e la misura.');
 return {width,depth};
}
