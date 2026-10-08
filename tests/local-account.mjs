import {chromium, request} from '@playwright/test';
import assert from 'node:assert/strict';
import {unlink} from 'node:fs/promises';
const baseURL='http://127.0.0.1:4175';
const anonymous=await request.newContext({baseURL});
assert.equal((await anonymous.get('/api/local-account/projects')).status(),401);
assert.equal((await anonymous.post('/api/local-account/login',{data:{email:'redazione',password:'wrong'}})).status(),401);
await anonymous.dispose();
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1500,height:1000}});
let savedId;
const login=async()=>{
  await page.goto(`${baseURL}/account`);
  await page.getByLabel('Nome utente').fill('redazione');
  await page.getByLabel('Password',{exact:true}).fill('redazionepassword');
  await page.locator('#auth-form button').click();
  await page.getByRole('heading',{name:'I miei progetti',exact:true}).waitFor();
};
try {
  await login();
  await page.getByRole('link',{name:'+ Nuovo progetto',exact:true}).click();
  await page.locator('#new-form button[type=submit]').click();
  await page.locator('#project-name').fill('Verifica archivio redazione');
  await page.locator('#project-name').dispatchEvent('change');
  await page.locator('#cloud-save').click();
  await page.locator('#confirm-cloud').click();
  await page.waitForURL(/project=/);
  savedId=new URL(page.url()).searchParams.get('project');
  const record=await (await page.request.get(`${baseURL}/api/local-account/projects/${savedId}`)).json();
  assert.equal(record.project.name,'Verifica archivio redazione');
  const conflict=await page.request.put(`${baseURL}/api/local-account/projects/${savedId}`,{data:{project:record.project,revision:0}});
  assert.equal(conflict.status(),409);
  await page.goto(`${baseURL}/account`);
  await page.getByRole('heading',{name:'Verifica archivio redazione',exact:true}).waitFor();
  await page.locator('#signout').click();
  await page.getByLabel('Nome utente').waitFor();
  assert.equal((await page.request.get(`${baseURL}/api/local-account/projects`)).status(),401);
  await login();
  await page.getByRole('article').filter({hasText:'Verifica archivio redazione'}).getByRole('link',{name:'Apri progetto ↗',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('#project-name')?.value==='Verifica archivio redazione');
  await page.screenshot({path:'test-results/redazione-project.png'});
  console.log('PASS login, save, archive, logout, reopen, unauthorized access and revision conflict.');
} finally {
  await browser.close();
  if(savedId && /^[a-f0-9-]{36}$/.test(savedId)) await unlink(new URL(`../.local-data/projects/${savedId}.json`,import.meta.url));
}
