import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium, webkit } from 'playwright';

const baseURL=process.env.MOTION_URL||'http://127.0.0.1:5187/';
const output=process.env.MOTION_OUTPUT||'.qa/mobile-motion';
const report={checks:[],errors:[],metrics:{}};
await mkdir(output,{recursive:true});
const browser=await chromium.launch();
const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const page=await context.newPage();
page.on('pageerror',error=>report.errors.push(error.message));
const client=await context.newCDPSession(page);
const touch=(type,points=[])=>client.send('Input.dispatchTouchEvent',{type,touchPoints:points.map(([x,y,id=1])=>({x,y,id}))});
const frame=()=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>resolve())));
const transform=()=>page.locator('#world').evaluate(node=>node.style.transform);
const position=()=>page.locator('#world').evaluate(node=>{
  const value=node.style.transform;
  return {x:Number(/rotateY\(([-.\d]+)/.exec(value)[1]),y:Number(/rotateX\(([-.\d]+)/.exec(value)[1])};
});
async function stop(){await touch('touchStart',[[195,420]]);await touch('touchCancel');await frame()}
async function drag(from,to,{release=true,steps=6}={}){
  await touch('touchStart',[from]);
  for(let i=1;i<=steps;i++){
    await page.waitForTimeout(17);
    await touch('touchMove',[[from[0]+(to[0]-from[0])*i/steps,from[1]+(to[1]-from[1])*i/steps]]);
  }
  await frame();
  if(release)await touch('touchEnd');
}
async function check(name,action){await action();report.checks.push(name);console.log(`PASS ${name}`)}
let navigation=0;
async function route(hash,waitReveal=true){const url=new URL(baseURL);url.searchParams.set('motion-check',String(++navigation));url.hash=hash;await page.goto(url.href,{waitUntil:'domcontentloaded'});if(waitReveal)await page.locator('body.revealed').waitFor()}
async function visibleCardPoint(){
  return page.evaluate(()=>{
    for(const card of document.querySelectorAll('.card')){
      const r=card.getBoundingClientRect();
      for(const ratio of [.5,.3,.7]){
        const x=r.left+r.width*ratio,y=r.top+r.height*.5;
        if(x>20&&x<innerWidth-35&&y>150&&y<innerHeight-170&&document.elementFromPoint(x,y)?.closest('.card')===card)return [x,y];
      }
    }
    throw new Error('No unobscured card found');
  });
}
try{
  await page.addInitScript(()=>{
    window.cropCount=0;
    const original=HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob=function(...args){window.cropCount++;return original.apply(this,args)};
    window.frameCount=0;
    const request=window.requestAnimationFrame;
    window.requestAnimationFrame=function(callback){return request.call(window,now=>{window.frameCount++;callback(now)})};
  });
  await check('Direct services/pricing/contact routes are interactive before images finish',async()=>{
    await page.route('**/assets/**',async request=>{await new Promise(resolve=>setTimeout(resolve,700));await request.continue()});
    for(const hash of ['services','pricing','contact']){
      await route(hash,false);
      assert.equal(await page.locator('body.revealed').count(),1);
      assert.equal(await page.locator('#content-panel').evaluate(node=>node.inert),false);
      assert.equal(await page.locator('#intro').count(),0);
      assert.equal(await page.locator(`#${hash}`).evaluate(node=>node.hidden),false);
      await page.waitForLoadState('networkidle');
    }
    await page.unrouteAll({behavior:'wait'});
  });
  await check('Content pages retain native vertical touch scrolling',async()=>{
    await route('services');await page.waitForTimeout(500);
    await drag([290,650],[290,250]);await page.waitForTimeout(200);
    assert.ok(await page.locator('#content-panel').evaluate(node=>node.scrollTop)>100);
  });
  await check('Gallery becomes interactive in under 2 seconds without awaiting image crops',async()=>{
    await page.route('**/assets/work-*-overview.webp',async request=>{await new Promise(resolve=>setTimeout(resolve,1500));await request.continue()});
    const start=Date.now();await route('works');report.metrics.galleryReadyMs=Date.now()-start;
    assert.ok(report.metrics.galleryReadyMs<2000,`Took ${report.metrics.galleryReadyMs}ms`);
    await page.waitForLoadState('networkidle');await page.unrouteAll({behavior:'wait'});await page.waitForTimeout(750);
  });
  await check('A 3px horizontal touch immediately moves the sphere',async()=>{
    const before=await position();await drag([195,420],[198,420],{release:false,steps:1});
    assert.ok((await position()).x-before.x>.1);await touch('touchEnd');
  });
  await check('Vertical touch rotates the sphere without scrolling the document',async()=>{
    const before=await position();await drag([195,480],[195,340],{release:false});
    assert.ok((await position()).y-before.y>10);
    assert.equal(await page.evaluate(()=>scrollY),0);await touch('touchEnd');
  });
  await check('Release coasts and pressing again stops immediately without opening a card',async()=>{
    await stop();await drag([120,420],[260,420]);
    const released=await position();await page.waitForTimeout(110);const coasting=await position();
    assert.ok(coasting.x-released.x>2);
    const point=await visibleCardPoint();await touch('touchStart',[point]);await frame();
    const held=await transform();await page.waitForTimeout(150);assert.equal(await transform(),held);
    await touch('touchEnd');await page.waitForTimeout(120);assert.equal(await transform(),held);
    assert.equal(await page.locator('#lit').getAttribute('aria-hidden'),'true');
  });
  await check('An 8px drag on a card never opens its preview',async()=>{
    await stop();const point=await visibleCardPoint();await drag(point,[point[0]+8,point[1]],{steps:2});
    assert.equal(await page.locator('#lit').getAttribute('aria-hidden'),'true');await stop();
  });
  await check('Pointer cancellation clears the drag and inertia',async()=>{
    await drag([150,420],[220,450],{release:false});await touch('touchCancel');await frame();
    const cancelled=await transform();await page.waitForTimeout(150);
    assert.equal(await transform(),cancelled);assert.equal(await page.locator('body.dragging').count(),0);
    assert.equal(await page.locator('#lit').getAttribute('aria-hidden'),'true');
  });
  await check('A second finger cancels rotation and a new single touch can resume',async()=>{
    await drag([150,420],[190,420],{release:false});
    await touch('touchStart',[[190,420,1],[260,420,2]]);await frame();const cancelled=await transform();
    await touch('touchMove',[[210,430,1],[280,430,2]]);await touch('touchEnd');await page.waitForTimeout(100);
    assert.equal(await transform(),cancelled);assert.equal(await page.locator('body.dragging').count(),0);
    assert.equal(await page.locator('#stage').evaluate(node=>getComputedStyle(node).touchAction),'pinch-zoom');
    await drag([160,420],[205,450],{release:false});assert.notEqual(await transform(),cancelled);await touch('touchCancel');
  });
  await check('A real card tap opens the preview and closing restores stage focus',async()=>{
    const point=await visibleCardPoint();await page.touchscreen.tap(...point);
    await page.locator('#lit[aria-hidden="false"]').waitFor();
    await page.locator('#lit [data-close]').last().click();
    await page.locator('#lit[aria-hidden="true"]').waitFor();
    assert.equal(await page.evaluate(()=>document.activeElement.id),'stage');
  });
  await check('Only 21 required sphere crops and 7 detail overviews are loaded',async()=>{
    await page.waitForFunction(()=>window.cropCount===21);
    report.metrics.cropCount=await page.evaluate(()=>window.cropCount);
    const resources=await page.evaluate(()=>performance.getEntriesByType('resource').filter(item=>/work-.*-overview\.webp/.test(item.name)).map(item=>item.name));
    report.metrics.galleryOverviewCount=new Set(resources).size;
    assert.equal(report.metrics.galleryOverviewCount,7);
    assert.equal(await page.locator('.card img').evaluateAll(nodes=>nodes.filter(node=>node.complete&&node.naturalWidth>0).length),21);
  });
  await check('Idle gallery stops scheduling animation frames',async()=>{
    await page.waitForTimeout(800);const before=await page.evaluate(()=>window.frameCount);
    await page.waitForTimeout(220);assert.equal(await page.evaluate(()=>window.frameCount),before);
  });
  await check('Reduced motion keeps touch and keyboard control without release inertia',async()=>{
    await page.emulateMedia({reducedMotion:'reduce'});await route('works');
    const before=await transform();await drag([150,420],[230,390]);await frame();const released=await transform();
    assert.notEqual(released,before);await page.waitForTimeout(180);assert.equal(await transform(),released);
    await page.locator('#stage').focus();await page.keyboard.press('ArrowRight');await frame();assert.notEqual(await transform(),released);
  });
  await check('Grid preview close returns focus to the exact source button',async()=>{
    await route('grid');const source=page.locator('.grid-card[data-project="salf"]');await source.click();
    await page.locator('#lit[aria-hidden="false"]').waitFor();await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(()=>document.activeElement.id),'work-salf');
  });
  await check('Starting in the grid and switching to 3D loads all sphere images',async()=>{
    await page.locator('#gridBtn').click();
    await page.waitForFunction(()=>[...document.querySelectorAll('.card img')].every(image=>image.complete&&image.naturalWidth>0));
    assert.equal(await page.locator('#stage').evaluate(node=>node.inert),false);
  });
  await check('Menu close restores trigger focus',async()=>{
    await page.locator('#menuBtn').click();await page.locator('#menu[aria-hidden="false"]').waitFor();await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(()=>document.activeElement.id),'menuBtn');
  });
  await check('Native pinch still zooms the mobile gallery',async()=>{
    const pinchPage=await context.newPage();await pinchPage.emulateMedia({reducedMotion:'reduce'});await pinchPage.goto(`${baseURL}#works`);
    const pinchClient=await context.newCDPSession(pinchPage);
    await pinchClient.send('Input.synthesizePinchGesture',{x:195,y:420,scaleFactor:1.5,relativeSpeed:800,gestureSourceType:'touch'});
    await pinchPage.waitForTimeout(150);
    assert.ok(await pinchPage.evaluate(()=>visualViewport.scale)>1.1);
    await pinchPage.close();
  });
  await page.screenshot({path:`${output}/mobile-gallery.png`});
  assert.deepEqual(report.errors,[]);
}catch(error){report.errors.push(error.stack);process.exitCode=1;console.error(error)}
finally{await context.close();await browser.close()}
try{
  const safari=await webkit.launch();const safariPage=await safari.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  safariPage.on('pageerror',error=>report.errors.push(error.message));
  await safariPage.goto(`${baseURL}#contact`,{waitUntil:'domcontentloaded'});
  assert.equal(await safariPage.locator('#content-panel').evaluate(node=>node.inert),false);
  await safariPage.goto(`${baseURL}#works`);await safariPage.locator('#stage').focus();
  const before=await safariPage.locator('#world').evaluate(node=>node.style.transform);await safariPage.keyboard.press('ArrowRight');await safariPage.waitForTimeout(40);
  assert.notEqual(await safariPage.locator('#world').evaluate(node=>node.style.transform),before);
  report.checks.push('WebKit mobile route and keyboard smoke');await safari.close();
}catch(error){report.errors.push(`WebKit: ${error.message}`);process.exitCode=1}
await writeFile(`${output}/report.json`,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({passed:report.checks.length,errors:report.errors.length,metrics:report.metrics}));
if(report.errors.length)process.exitCode=1;
