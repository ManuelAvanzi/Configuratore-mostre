import {footprint} from './planning.js';

// The last selected object is the fixed alignment reference.
export function arrange(objects, ids, operation, value = 0) {
 const selected = ids.map(id => objects.find(o => o.id === id)).filter(Boolean);
 if (selected.length < 2) throw Error('Seleziona almeno due elementi.');
 const anchor = selected.at(-1);
 if (operation.startsWith('align-')) {
  const axis = operation.slice(6);
  if (!['x', 'z', 'center', 'base'].includes(axis)) throw Error('Allineamento non valido.');
  selected.forEach(o => {
   if (axis === 'center') o.y = anchor.y + anchor.h / 2 - o.h / 2;
   else if (axis === 'base') o.y = anchor.y;
   else o[axis] = anchor[axis];
  });
 } else if (operation.startsWith('distribute-')) {
  const axis = operation.slice(11);
  if (!['x', 'z'].includes(axis) || selected.length < 3) throw Error('Seleziona almeno tre elementi per distribuire.');
  const rows = selected.map(o => {
   const points = footprint(o).map(p => p[axis]);
   return {o, half: (Math.max(...points) - Math.min(...points)) / 2};
  }).sort((a, b) => a.o[axis] - b.o[axis]);
  const first = rows[0], last = rows.at(-1);
  const gap = (last.o[axis] - last.half - first.o[axis] - first.half - rows.slice(1, -1).reduce((n,r) => n + 2*r.half, 0)) / (rows.length - 1);
  if (gap < 0) throw Error('Spazio insufficiente: allontana i due elementi estremi.');
  let edge = first.o[axis] + first.half;
  rows.slice(1, -1).forEach(r => {r.o[axis] = edge + gap + r.half; edge = r.o[axis] + r.half;});
 } else if (operation.startsWith('offset-')) {
  const axis = operation.slice(7);
  if (!['x','y','z'].includes(axis) || !Number.isFinite(value)) throw Error('Spostamento non valido.');
  selected.forEach(o => o[axis] += value);
 } else throw Error('Operazione non valida.');
 if (selected.some(o => o.y < 0)) throw Error('L’operazione porterebbe un elemento sotto il pavimento.');
}
