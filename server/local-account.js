import {readFile, writeFile, mkdir, rename, readdir} from 'node:fs/promises';
import {randomBytes, scryptSync, timingSafeEqual} from 'node:crypto';
import {join} from 'node:path';
import {validate} from '../src/model.js';

// Private files are never served by Vite. Only authenticated API requests read projects.
export function localAccount(directory) {
  const sessions = new Map(), attempts = new Map();
  let queue = Promise.resolve();
  const user = {id:'redazione', email:'redazione'};
  const read = async path => JSON.parse(await readFile(path, 'utf8'));
  const atomic = async (path, value) => {
    const temp = `${path}.${randomBytes(8).toString('hex')}.tmp`;
    await writeFile(temp, JSON.stringify(value)); await rename(temp, path);
  };
  return async (req, res, next) => {
    if (!req.url?.startsWith('/api/local-account/')) return next();
    res.setHeader('Cache-Control','no-store'); res.setHeader('Content-Type','application/json');
    const send = (status, data) => {res.statusCode=status; res.end(JSON.stringify(data));};
    const fail = (status, text, code) => Object.assign(Error(`Spazio: ${text}`), {status,code});
    try {
      const host = new URL(`http://${req.headers.host}`).hostname;
      if (!['localhost','127.0.0.1','[::1]'].includes(host)) throw fail(403,'Archivio disponibile su questo computer.');
      if (req.headers.origin && req.headers.origin !== `http://${req.headers.host}`) throw fail(403,'Origine non consentita.');
      if (req.headers['sec-fetch-site'] === 'cross-site') throw fail(403,'Origine non consentita.');
      const route = req.url.split('?')[0].slice('/api/local-account/'.length);
      const token = /(?:^|;\s*)exhibition_session=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie || '')?.[1];
      const authenticated = token && sessions.get(token) > Date.now();
      for (const [key, expiry] of sessions) if (expiry <= Date.now()) sessions.delete(key);
      const body = async () => {
        if (!req.headers['content-type']?.startsWith('application/json')) throw fail(415,'Formato non supportato.');
        let size=0; const chunks=[];
        for await (const chunk of req) {size+=chunk.length; if(size>150*1024*1024) throw fail(413,'Il progetto supera 150 MB.'); chunks.push(chunk);}
        try {return JSON.parse(Buffer.concat(chunks).toString());} catch {throw fail(400,'Dati non validi.');}
      };
      if (route==='session' && req.method==='GET') return send(200,{user:authenticated?user:null});
      if (route==='login' && req.method==='POST') {
        const ip=req.socket.remoteAddress, now=Date.now(), rate=attempts.get(ip);
        if (rate && rate.until>now && rate.count>=10) throw fail(429,'Attendi qualche minuto prima di riprovare.');
        const credentials=await body(), stored=await read(join(directory,'account.json'));
        const hash=scryptSync(String(credentials.password || '').slice(0,128),stored.salt,64);
        if(credentials.email!=='redazione' || !timingSafeEqual(hash,Buffer.from(stored.hash,'hex'))) {
          attempts.set(ip,{count:rate?.until>now?rate.count+1:1,until:rate?.until>now?rate.until:now+300000});
          throw fail(401,'Nome utente o password non corretti.','invalid_credentials');
        }
        attempts.delete(ip);
        const session=randomBytes(32).toString('hex'); sessions.set(session,now+7*86400000);
        res.setHeader('Set-Cookie',`exhibition_session=${session}; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800`);
        return send(200,{user});
      }
      if (!authenticated) throw fail(401,'Accedi al tuo account per continuare.');
      if (route==='logout' && req.method==='POST') {
        sessions.delete(token); res.setHeader('Set-Cookie','exhibition_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'); return send(200,{});
      }
      const folder=join(directory,'projects'); await mkdir(folder,{recursive:true});
      if(route==='projects' && req.method==='GET') {
        const items=await Promise.all((await readdir(folder)).filter(f=>f.endsWith('.json')).map(async f=>{
          const {project,...metadata}=await read(join(folder,f)); return metadata;
        }));
        return send(200,items.sort((a,b)=>b.updated_at.localeCompare(a.updated_at)));
      }
      const id=/^projects\/([a-f0-9-]{36})$/.exec(route)?.[1];
      if(!id) throw fail(404,'Risorsa non trovata.');
      const path=join(folder,`${id}.json`);
      if(req.method==='GET') return send(200,await read(path));
      if(req.method==='PUT') {
        const input=await body(); let project;
        try {project=validate(input.project);} catch {throw fail(400,'Progetto non valido.');}
        const operation=queue.then(async()=>{
          let old; try {old=await read(path);} catch(e) {if(e.code!=='ENOENT') throw e;}
          if((old?.revision || 0)!==input.revision) throw fail(409,'Il progetto è cambiato. Riaprilo o salva una nuova copia.','P0001');
          const record={archive:project.archive,id,owner:user.id,revision:(old?.revision||0)+1,name:project.name,width:project.width,depth:project.depth,object_count:project.objects.length,asset_count:(JSON.stringify(project).match(/data:[^;]+;base64,/g)||[]).length,updated_at:new Date().toISOString(),project};
          await atomic(path,record); return {id,owner:user.id,revision:record.revision};
        });
        queue=operation.catch(()=>{}); return send(200,await operation);
      }
      throw fail(405,'Operazione non supportata.');
    } catch(error) {send(error.status || (error.code==='ENOENT'?404:500),{message:error.status?error.message:'Spazio: Archivio non disponibile.',code:error.code});}
  };
}
