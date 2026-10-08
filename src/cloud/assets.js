const MAX_ASSET = 30 * 1024 * 1024;
const MAX_TOTAL = 150 * 1024 * 1024;
const allowed = /^(image\/(png|jpeg|webp)|video\/(mp4|webm)|model\/gltf-binary|application\/octet-stream)$/;

function slots(project) {
  return [
    ...(project.reference ? [[project.reference, 'src']] : []),
    ...project.objects.flatMap(object => ['image', 'video', 'model'].filter(key => object[key]).map(key => [object, key])),
    ...[project.floorSurface, ...project.walls.flatMap(wall => [wall.surfaces?.a, wall.surfaces?.b]), ...project.objects.map(object => object.surface)]
      .filter(surface => surface?.texture).map(surface => [surface, 'texture']),
  ];
}

export async function packAssets(project, owner, upload) {
  const document = structuredClone(project);
  const uploaded = new Set();
  let bytes = 0;
  for (const [object, key] of slots(document)) {
    const match = /^data:([^;,]+);base64,([A-Za-z0-9+/=\s]+)$/.exec(object[key]);
    if (!match || !allowed.test(match[1])) throw Error('Spazio: Formato del contenuto non supportato.');
    const binary = Uint8Array.from(atob(match[2]), c => c.charCodeAt(0));
    bytes += binary.byteLength;
    if (binary.byteLength > MAX_ASSET || bytes > MAX_TOTAL) throw Error('Spazio: Limite online: 30 MB per contenuto e 150 MB per progetto.');
    const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', binary))].map(n => n.toString(16).padStart(2, '0')).join('');
    const path = `${owner}/${hash}`;
    if (!uploaded.has(path)) {
      await upload(path, new Blob([binary], {type: match[1]}));
      uploaded.add(path);
    }
    object[key] = {storage: path, mime: match[1]};
  }
  if (new Blob([JSON.stringify(document)]).size > 2 * 1024 * 1024) throw Error('Spazio: La struttura del progetto supera il limite di 2 MB.');
  return {document, assetCount: uploaded.size};
}

export async function unpackAssets(document, owner, download) {
  const project = structuredClone(document);
  const cache = new Map();
  let bytes = 0;
  for (const [object, key] of slots(project)) {
    const ref = object[key];
    if (!ref || typeof ref !== 'object' || !allowed.test(ref.mime) || !new RegExp(`^${owner}/[a-f0-9]{64}$`).test(ref.storage)) throw Error('Spazio: Riferimento al contenuto non valido.');
    if (!cache.has(ref.storage)) {
      const blob = await download(ref.storage);
      if (blob.size > MAX_ASSET) throw Error('Spazio: Contenuto troppo grande.');
      cache.set(ref.storage, new Uint8Array(await blob.arrayBuffer()));
    }
    const binary = cache.get(ref.storage);
    bytes += binary.byteLength;
    if (bytes > MAX_TOTAL) throw Error('Spazio: Il progetto supera il limite di 150 MB.');
    let text = '';
    for (let i = 0; i < binary.length; i += 16384) text += String.fromCharCode(...binary.subarray(i, i + 16384));
    object[key] = `data:${ref.mime};base64,${btoa(text)}`;
  }
  return project;
}
