import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium, webkit } from 'playwright';

const baseURL=process.env.MOTION_URL||'http://127.0.0.1:5187/';
const output=process.env.ROUTE_OUTPUT||'.qa/route-position';
const report={checks:[],positions:[],errors:[]};
await mkdir(output,{recursive:true});
const mobile={viewport:{width:390,height:844},isMobile:true,hasTouch:true};
async function assertPosition(page,label){
  const position=await page.evaluate(()=>{
    const panel=document.querySelector('#content-panel');
    const bar=panel.querySelector('.panel-bar').getBoundingClientRect();
    const heading=panel.querySelector('.content-page:not([hidden]) h2').getBoundingClientRect();
    const header=document.querySelector('.site-header').getBoundingClientRect();
    return {route:location.hash,scrollTop:panel.scrollTop,barTop:bar.top,barBottom:bar.bottom,headingTop:heading.top,headingBottom:heading.bottom,headerBottom:header.bottom,viewportHeight:innerHeight};
  });
  report.positions.push({label,...position});
  assert.equal(position.scrollTop,0,`${label}: route should start at the top of the panel`);
  assert.ok(position.barTop>=position.headerBottom,`${label}: fixed header obscures the back-link bar`);
  assert.ok(position.headingTop>=position.headerBottom,`${label}: fixed header obscures the heading`);
  assert.ok(position.headingBottom<=position.viewportHeight,`${label}: heading is outside the viewport`);
}
for(const [name,engine] of Object.entries({chromium,webkit})){
  const browser=await engine.launch();
  try{
    for(const route of ['pricing','contact','services']){
      const context=await browser.newContext(mobile);const page=await context.newPage();
      page.on('pageerror',error=>report.errors.push(`${name}: ${error.message}`));
      await page.goto(`${baseURL}#${route}`,{waitUntil:'load'});
      await page.waitForTimeout(700);
      await assertPosition(page,`${name} fresh #${route}`);
      if(route==='pricing')await page.screenshot({path:`${output}/${name}-pricing-mobile.png`});
      report.checks.push(`${name}: fresh #${route} keeps the back link and heading below the header`);
      console.log(`PASS ${report.checks.at(-1)}`);
      await context.close();
    }
    const context=await browser.newContext(mobile);const page=await context.newPage();
    await page.goto(`${baseURL}#services`);
    await page.evaluate(()=>{location.hash='pricing'});
    await page.waitForFunction(()=>!document.querySelector('#pricing').hidden);
    await page.waitForTimeout(500);await assertPosition(page,`${name} hash → pricing`);
    await page.goBack();await page.waitForFunction(()=>!document.querySelector('#services').hidden);
    await page.waitForTimeout(500);await assertPosition(page,`${name} back → services`);
    await page.goForward();await page.waitForFunction(()=>!document.querySelector('#pricing').hidden);
    await page.waitForTimeout(500);await assertPosition(page,`${name} forward → pricing`);
    report.checks.push(`${name}: hash/back/forward keep the intended route and top position`);
    console.log(`PASS ${report.checks.at(-1)}`);
    await context.close();
    if(name==='chromium'){
      const scrollContext=await browser.newContext(mobile);const scrollPage=await scrollContext.newPage();
      await scrollPage.route('**/assets/**',async route=>{await new Promise(resolve=>setTimeout(resolve,1200));await route.continue()});
      await scrollPage.goto(`${baseURL}#services`,{waitUntil:'domcontentloaded'});
      await scrollPage.waitForTimeout(100);await assertPosition(scrollPage,'chromium slow images before user scroll');
      const client=await scrollContext.newCDPSession(scrollPage);
      const touch=(type,points=[])=>client.send('Input.dispatchTouchEvent',{type,touchPoints:points.map(([x,y])=>({x,y,id:1}))});
      await touch('touchStart',[[290,650]]);
      for(let step=1;step<=8;step++){await scrollPage.waitForTimeout(17);await touch('touchMove',[[290,650-step*45]])}
      await touch('touchEnd');await scrollPage.waitForTimeout(100);
      const beforeLoad=await scrollPage.locator('#content-panel').evaluate(panel=>panel.scrollTop);
      assert.ok(beforeLoad>100,'Native touch should scroll the content while images are still loading');
      await scrollPage.waitForLoadState('networkidle');
      const afterLoad=await scrollPage.locator('#content-panel').evaluate(panel=>panel.scrollTop);
      assert.ok(afterLoad>=beforeLoad-1,'Late image/load work must not pull the user back to the top');
      report.positions.push({label:'Native user scroll persists through delayed image load',beforeLoad,afterLoad});
      report.checks.push('chromium: native touch scroll persists through delayed image loading');
      console.log(`PASS ${report.checks.at(-1)}`);
      await scrollContext.close();
    }
  }catch(error){report.errors.push(`${name}: ${error.stack}`);console.error(error);process.exitCode=1}
  finally{await browser.close()}
}
await writeFile(`${output}/report.json`,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({passed:report.checks.length,errors:report.errors.length}));
if(report.errors.length)process.exitCode=1;
