// Browser contract tests against mocked Supabase HTTP responses. No real users/emails are created.
// Database policies are tested separately against PostgreSQL in cloud.test.js.
import {chromium, expect} from '@playwright/test';
import {createServer} from 'vite';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';

await mkdir('test-results', {recursive:true});
const url='https://test-cloud.supabase.co', origin='http://localhost:5183';
const server=await createServer({server:{host:'127.0.0.1',port:5183,strictPort:true},define:{'import.meta.env.VITE_SUPABASE_URL':JSON.stringify(url),'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY':JSON.stringify('public-test-key')}});
const offline=await createServer({server:{host:'127.0.0.1',port:5184,strictPort:true},define:{'import.meta.env.VITE_SUPABASE_URL':'""','import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY':'""'}});
await server.listen();await offline.listen();
const browser=await chromium.launch({channel:'chrome',headless:true});
const users=[{id:'11111111-1111-4111-8111-111111111111',email:'alice@example.test'},{id:'22222222-2222-4222-8222-222222222222',email:'bob@example.test'}];
const projects=new Map(),assets=new Map();let failUploads=false,failSave=false;
const errors=[];
function session(user) {
  const exp=Math.floor(Date.now()/1000)+3600;
  const token=[{alg:'HS256',typ:'JWT'},{sub:user.id,exp,role:'authenticated'},'signature'].map((x,i)=>i===2?x:Buffer.from(JSON.stringify(x)).toString('base64url')).join('.');
  return {access_token:token,refresh_token:'test-refresh',token_type:'bearer',expires_in:3600,expires_at:exp,user:{...user,aud:'authenticated',role:'authenticated',app_metadata:{provider:'email'},user_metadata:{}}};
}
async function context() {
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  await context.route(url+'/**',async route=>{
    const req=route.request(),u=new URL(req.url()),method=req.method();
    const headers={'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*','access-control-expose-headers':'x-supabase-api-version','x-supabase-api-version':'2024-01-01'};
    const json=(body,status=200)=>route.fulfill({status,contentType:'application/json',headers,body:JSON.stringify(body)});
    if(method==='OPTIONS')return json({});
    let owner=null;
    try {owner=JSON.parse(Buffer.from(req.headers().authorization?.split('.')[1]||'','base64url').toString()).sub;}catch{}
    const user=users.find(user=>user.id===owner);
    if(u.pathname==='/auth/v1/token') {
      const input=req.postDataJSON(),found=users.find(user=>user.email===input.email);
      if(!found||input.password!=='valid-password-123')return json({code:'invalid_credentials',msg:'Invalid credentials'},400);
      return json(session(found));
    }
    if(u.pathname==='/auth/v1/signup')return json({user:users[0],session:null});
    if(u.pathname==='/auth/v1/recover')return json({});
    if(u.pathname==='/auth/v1/logout')return json({});
    if(u.pathname==='/auth/v1/user')return user?json(user):json({message:'Not authenticated'},401);
    if(!user)return json({message:'Not authenticated'},401);
    if(u.pathname==='/rest/v1/projects') {
      const rows=[...projects.values()].filter(p=>p.owner_id===owner);
      if(u.searchParams.has('id')) {const row=rows.find(p=>p.id===u.searchParams.get('id').slice(3));return row?json(row):json({code:'PGRST116'},406);}
      return json(rows);
    }
    if(u.pathname==='/rest/v1/rpc/save_project') {
      if(failSave)return json({code:'P0001',message:'Project conflict'},400);
      const input=req.postDataJSON(),previous=projects.get(input.project_id),doc=input.project_document;
      if(input.expected_revision && (previous?.revision!==input.expected_revision||previous?.owner_id!==owner))return json({code:'P0001'},400);
      const revision=(previous?.revision||0)+1;
      projects.set(input.project_id,{id:input.project_id,owner_id:owner,name:doc.name,document:doc,revision,asset_count:input.project_asset_count,width:doc.width,depth:doc.depth,object_count:doc.objects.length,updated_at:new Date().toISOString()});
      return json(revision);
    }
    if(u.pathname.startsWith('/storage/v1/object/')) {
      const path=decodeURIComponent(u.pathname.split('project-assets/')[1]||'');
      if(!path.startsWith(owner+'/'))return json({message:'Forbidden'},403);
      if(method==='HEAD')return route.fulfill({status:assets.has(path)?200:404,headers,body:''});
      if(method==='POST') {
        if(failUploads)return json({message:'Upload unavailable'},503);
        if(assets.has(path))return json({statusCode:'400',error:'Duplicate',message:'The resource already exists'},400);
        // Supabase uses multipart FormData for Blob uploads; extract the binary part.
        const raw=req.postDataBuffer(),type=req.headers()['content-type'];
        let bytes=raw,mime=type;
        if(type.includes('multipart/form-data')) {
          const boundary=type.split('boundary=')[1];
          const marker=Buffer.from('filename="blob"');const fileIndex=raw.indexOf(marker);
          const dataIndex=raw.indexOf(Buffer.from('\r\n\r\n'),fileIndex)+4;
          const end=raw.indexOf(Buffer.from('\r\n--'+boundary),dataIndex);
          bytes=raw.subarray(dataIndex,end);
          mime=raw.subarray(fileIndex,dataIndex).toString().match(/Content-Type: ([^\r]+)/i)?.[1]||'application/octet-stream';
        }
        assets.set(path,{bytes,mime});return json({Key:path});
      }
      const file=assets.get(path);return file?route.fulfill({status:200,headers,contentType:file.mime,body:file.bytes}):json({},404);
    }
    return json({unexpected:u.pathname},404);
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
  return {context,page};
}
async function login(page,email) {
  await page.goto(origin+'/account');
  await page.getByLabel('Email o nome utente',{exact:true}).fill(email);
  await page.getByLabel('Password',{exact:true}).fill('valid-password-123');
  await page.locator('#auth-form button').click();
  await expect(page.locator('h1')).toHaveText('I miei progetti');
  await expect(page.locator('#account-status')).toBeEmpty();
}
try {
  const {page}=await context();
  await page.goto('http://localhost:5184/account');
  await expect(page.getByLabel('Nome utente')).toBeVisible();
  assert.equal(await page.locator('input[type=password]').count(),1);
  await page.screenshot({path:'test-results/account-unconfigured.png',fullPage:true});
  await page.goto(origin+'/');await page.locator('.nav-actions [data-access]').click();
  await expect(page.locator('#auth-form')).toBeVisible();
  await page.getByLabel('Email o nome utente',{exact:true}).fill('alice@example.test');
  await page.getByLabel('Password',{exact:true}).fill('wrong-password');
  await page.locator('#auth-form button').click();await expect(page.locator('#account-status')).toContainText('non corretti');
  await page.locator('[data-mode=signup]').click();
  await page.getByLabel('Email',{exact:true}).fill('alice@example.test');await page.getByLabel('Password',{exact:true}).fill('valid-password-123');
  await page.locator('#auth-form button').click();await expect(page.locator('#account-status')).toContainText('Controlla la tua email');
  await page.locator('[data-mode=login]').click();await page.locator('[data-mode=reset]').click();
  await page.getByLabel('Email',{exact:true}).fill('alice@example.test');await page.locator('#auth-form button').click();
  await expect(page.locator('#account-status')).toContainText('Se l’indirizzo');
  await login(page,users[0].email);
  await expect(page.locator('.archive-empty')).toBeVisible();
  await page.locator('.archive-heading a').click();await page.locator('#new-form [name=name]').fill('Mostra account Alice');
  await page.locator('#new-form button[type=submit]').click();
  await page.locator('[data-mode=layout]').click();
  await page.locator('[data-action=image]').click();
  await page.locator('#file').setInputFiles({name:'opera.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==','base64')});
  await expect(page.locator('#count')).toHaveText('1 elementi');
  await page.locator('#cloud-save').click();failUploads=true;
  await page.locator('#confirm-cloud').click();await expect(page.locator('#cloud-state')).toContainText('non riuscito');
  assert.equal(projects.size,0,'Failed uploads cannot commit an incomplete project');
  failUploads=false;await page.locator('#confirm-cloud').click();await expect(page.locator('#cloud-state')).toHaveText('Salvato nell’account ✓');
  assert.equal(projects.size,1);assert.equal(assets.size,1);
  const {page:secondDevice}=await context();await login(secondDevice,users[0].email);
  await secondDevice.locator('.project-card-body a').click();await expect(secondDevice.locator('#cloud-state')).toHaveText('Versione nell’account aperta');
  await expect(secondDevice.locator('#project-name')).toHaveValue('Mostra account Alice');
  await expect(secondDevice.locator('#count')).toHaveText('1 elementi');
  await secondDevice.setViewportSize({width:390,height:844});await secondDevice.screenshot({path:'test-results/account-editor-mobile.png'});
  assert.equal(await secondDevice.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.equal(await secondDevice.evaluate(()=>document.querySelector('#cloud-save').getBoundingClientRect().bottom<=document.querySelector('.topbar').getBoundingClientRect().bottom),true,'Save button must not be clipped on mobile');
  await page.locator('.account-projects-link').click();await expect(page.locator('.project-card')).toHaveCount(1);
  await page.screenshot({path:'test-results/account-dashboard.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/account-dashboard-mobile.png',fullPage:true});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.setViewportSize({width:1440,height:1000});
  await page.locator('.project-card-body a').click();await expect(page.locator('#cloud-state')).toHaveText('Versione nell’account aperta');
  await expect(page.locator('#project-name')).toHaveValue('Mostra account Alice');
  await expect(page.locator('#count')).toHaveText('1 elementi');
  await page.locator('#project-name').fill('Bozza recuperata');await page.locator('#project-name').press('Tab');
  await expect(page.locator('#save-state')).toHaveText('Salvato su questo dispositivo');
  await page.reload();await expect(page.locator('#restore-draft')).toBeVisible();await page.locator('#restore-draft').click();
  await expect(page.locator('#project-name')).toHaveValue('Bozza recuperata');
  await page.locator('#cloud-save').click();failSave=true;await page.locator('#confirm-cloud').click();
  await expect(page.locator('#cloud-feedback')).toContainText('aggiornato altrove');
  failSave=false;await page.locator('#copy-cloud').click();await expect(page.locator('#cloud-state')).toHaveText('Salvato nell’account ✓');
  assert.equal(projects.size,2);assert.equal(assets.size,1,'Content reused across project copies');
  await page.goto(origin+'/account?mode=recovery');await expect(page.locator('input[name=password]')).toBeVisible();
  await page.locator('input[name=password]').fill('new-valid-password-123');await page.locator('#auth-form button').click();
  await expect(page.locator('h1')).toHaveText('I miei progetti');
  const {page:bob}=await context();await login(bob,users[1].email);
  await expect(bob.locator('.archive-empty')).toBeVisible();
  await bob.goto(origin+'/studio?project='+[...projects.keys()][0]);
  await expect(bob.locator('#cloud-dialog h2')).toHaveText('Progetto non aperto');
  await bob.keyboard.press('Escape');await expect(bob.locator('#cloud-dialog')).toBeVisible();
  await Promise.all([page.waitForNavigation({waitUntil:'networkidle'}),page.locator('#signout').click()]);await expect(page.locator('#auth-form')).toBeVisible();
  await page.screenshot({path:'test-results/account-login.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/account-login-mobile.png',fullPage:true});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.deepEqual(errors,[]);
  console.log('Account browser contracts: registration, invalid login, recovery, saving with assets, failed upload, reopen, draft recovery, conflict/copy, account isolation, logout, desktop/mobile OK.');
} catch(error) {console.error('Browser errors:',errors);throw error;} finally {await browser.close();await server.close();await offline.close();}
