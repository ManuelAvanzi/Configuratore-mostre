import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
const browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:480,height:640}});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://localhost:5173/tests/asset-viewer.html');await page.waitForFunction(()=>window.ready);const results=[];
for(const type of ['person-business','person-casual-15','person-casual-35','person-grey-blazer','person-mint','person-sophia']){results.push(await page.evaluate(type=>window.preview(type),type));await page.locator('canvas').screenshot({path:`test-results/${type}-inspect.png`});}
await fs.writeFile('assets/people/bounds.json',JSON.stringify(results,null,2));await browser.close();console.log(JSON.stringify({results,errors}));if(errors.length)process.exitCode=1;
