import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
async function tool(name){await page.locator(`[data-plan-transform=${name}]`).click();assert.equal(await page.locator(`[data-plan-transform=${name}]`).getAttribute('aria-pressed'),'true');}
async function drag(from,to,cancel=false){const r=await page.locator('#plan').boundingBox(),q=await page.locator('#plan').evaluate(e=>({x:+e.dataset.gizmoX,y:+e.dataset.gizmoY}));await page.mouse.move(r.x+q.x+from[0],r.y+q.y+from[1]);await page.mouse.down();await page.mouse.move(r.x+q.x+to[0],r.y+q.y+to[1],{steps:12});if(cancel)await page.keyboard.press('Escape');await page.mouse.up();}
try{
 await page.goto((process.env.SPAZIO_TEST_URL||'http://127.0.0.1:4175')+'/studio?start=new');await page.locator('#new-form button[type=submit]').click();await page.locator('[data-action=wall-numeric]').click();
 await tool('rotate');await drag([52,0],[0,52]);assert.equal(+await page.locator('[data-transform="rotation.y"]').inputValue(),-90);assert.equal(+await page.locator('[data-field="wall.length"]').inputValue(),4);
 await page.screenshot({path:'test-results/plan-rotate-tool.png'});
 await tool('scale');await drag([48,48],[72,72]);assert.equal(+await page.locator('[data-field="wall.length"]').inputValue(),6);assert.equal(+await page.locator('[data-transform="scale.x"]').inputValue(),1.5);
 await tool('move');await drag([42,0],[82,0]);assert.ok(+await page.locator('[data-transform="position.x"]').inputValue()>0);
 await page.locator('[data-mode=layout]').click();await page.locator('[data-category=Arredi]').click();await page.locator('[data-add=bench]').click();await page.locator('[data-mode=space]').click();
 await tool('rotate');await drag([52,0],[0,52]);assert.equal(+await page.locator('[data-field=rotation]').inputValue(),-90);
 const width=+await page.locator('[data-field=w]').inputValue();await tool('scale');await drag([48,48],[72,72]);assert.ok(Math.abs(+await page.locator('[data-field=w]').inputValue()-width*1.5)<.001);
 await page.screenshot({path:'test-results/plan-scale-tool.png'});
 await page.locator('.top-actions summary').click();await page.locator('.top-actions [data-action=undo]').click();
 await page.locator('[data-mode=layout]').click();await page.locator('[data-mode=space]').click();
 await page.setViewportSize({width:390,height:844});assert.equal(await page.locator('#plan-transform-tools').isVisible(),true);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 assert.deepEqual(errors,[]);console.log('PASS: selettori, rotazione/scala pareti e oggetti, sposta, annulla e toolbar mobile.');
}finally{await browser.close();}
