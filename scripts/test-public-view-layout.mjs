import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';

const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const routes=['index.html','faq/index.html','privacy/index.html','terms/index.html','portal/play/index.html',
  ...['brand-websites','brand-content','ai-custom-systems'].map(slug=>`services/${slug}/index.html`),
  ...['shanyu','yongzhen-tofu','goshoot'].map(slug=>`work/${slug}/index.html`)];

test('every public content route mounts one mode control and initializes before rendering',()=>{
  for(const path of routes){
    const source=read(path);
    assert.equal((source.match(/data-view-mode-host/g)||[]).length,1,path);
    const script=source.match(/<script\b[^>]*src="\/assets\/view-mode\.js\?v=20260928-modes"[^>]*>/)?.[0];
    assert.ok(script,path);
    assert.doesNotMatch(script,/\b(?:defer|async)\b/,path);
    assert.ok(source.indexOf(script)<source.indexOf('</head>'),path);
    assert.match(source,/view-mode\.css\?v=20260928-modes/,path);
  }
});

test('changing a wide display to mobile reflows the sphere from the actual stage size',()=>{
  const source=read('index.html');
  const start=source.indexOf('function galleryGeometry('),end=source.indexOf('function camera(now){',start);
  const context={};
  runInNewContext(`
    const events={},pending=new Map(),values={};let frame=0,cancelledGestures=0;
    const stage={clientWidth:1200,clientHeight:540};
    const window={innerWidth:1440,addEventListener:(name,fn)=>events[name]=fn};
    const document={documentElement:{style:{setProperty:(name,value)=>values[name]=value}}};
    const requestAnimationFrame=fn=>{pending.set(++frame,fn);return frame};
    const cancelAnimationFrame=id=>pending.delete(id);
    const cancelGesture=()=>cancelledGestures++;
    const invalidate=()=>{};
    const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
    const cards=[{x:1,y:0,z:0,lon:90,lat:0,node:{style:{}}}];
    let viewportWidth=0,viewportHeight=0,radius=0,perspective=0,dragSensitivity=0;
    ${source.slice(start,end)}
    layout(true);
    const originalRadius=radius;
    stage.clientWidth=636;stage.clientHeight=320;
    events['heycheng:viewchange']({detail:{mode:'mobile',preference:'mobile'}});
    for(const callback of pending.values())callback();
    globalThis.result={originalRadius,radius,viewportWidth,viewportHeight,cancelledGestures,cardTransform:cards[0].node.style.transform};
  `,context);
  assert.equal(context.result.viewportWidth,636);
  assert.equal(context.result.viewportHeight,320);
  assert.equal(context.result.cancelledGestures,1);
  assert.ok(context.result.radius<context.result.originalRadius);
  assert.match(context.result.cardTransform,/translate3d/);
});

test('old public game route stays a redirect and cannot introduce a second active game shell',()=>{
  const redirect=read('play/index.html');
  assert.match(redirect,/url=\/portal\/#play/);
  assert.doesNotMatch(redirect,/data-view-mode-host|start-game|view-mode\.js/);
  assert.match(read('portal/play/index.html'),/name="robots" content="noindex,nofollow,noarchive"/);
});
