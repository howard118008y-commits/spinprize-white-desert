import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';

const source=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const between=(a,b)=>source.slice(source.indexOf(a),source.indexOf(b,source.indexOf(a)));
const code=[
  between('function setInactive(','function layout('),
  between('function camera(now){','function setMenu(open){')
].join('\n');

function model(){
  const environment={Event};
  runInNewContext(`
    const nodes=new Map(),pending=new Set(),cancelled=[];
    function node(){return {style:{},events:{},eventOptions:{},dataset:{idx:'0'},inert:false,clientHeight:500,
      classList:{add(){},remove(){},toggle(){}},setAttribute(){},
      addEventListener(type,fn,options){(this.events[type]??=[]).push(fn);this.eventOptions[type]=options},
      captured:new Set(),hasPointerCapture(id){return this.captured.has(id)},
      setPointerCapture(id){this.captured.add(id)},releasePointerCapture(id){this.captured.delete(id)}}}
    const $=selector=>{if(!nodes.has(selector))nodes.set(selector,node());return nodes.get(selector)};
    const stage=node(),world=node(),hero=node(),grid=node(),panel=node(),menu=node(),lit=node(),body=node(),dot=node();
    const document={...node(),hidden:false,documentElement:node()},performance={now:()=>clock};
    let clock=1000,nextFrame=0;
    const requestAnimationFrame=()=>{const id=++nextFrame;pending.add(id);return id};
    const cancelAnimationFrame=id=>{pending.delete(id);cancelled.push(id)};
    const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
    const touchPointers=new Set(),reducedMotion={matches:false},finePointer={matches:false};
    const cards=[{x:0,y:0,z:1,depth:1,lastDim:-1,shade:node(),node:node(),project:{index:0}}];
    let radius=160,perspective=1100,spin=0,tilt=-4,dragX=0,dragY=0,velX=0,velY=0,dragSensitivity=.3;
    let revealed=true,currentView='works',gridOpen=false,menuOpen=false,litOpen=false,gesture=null;
    let cameraFrame=0,lastFrame=0,previousTransform='',dirty=true,selectedProject=0,opened=0;
    const inertiaFriction=.0037,openProject=()=>opened++;
    ${code}
    globalThis.evaluate=text=>eval(text);
    globalThis.dispatch=(type,x,y,time,id=1,pointerType='touch',extra={})=>{
      clock=time;
      const event=new Event(type,{cancelable:extra.cancelable??false});
      const properties={pointerId:id,pointerType,isPrimary:id===1,button:0,clientX:x,clientY:y,timeStamp:time,
        target:{closest:()=>cards[0].node},...extra};
      Object.defineProperties(event,Object.fromEntries(Object.entries(properties).map(([key,value])=>[key,{value}])));
      for(const fn of document.events[type]??[])fn(event);
      for(const fn of stage.events[type]??[])fn(event);
      return event;
    };
  `,environment);
  return {get:environment.evaluate,send:environment.dispatch};
}

test('projected card bounds fit the complete stage on phones, desktop and tablet',()=>{
  const m=model();
  for(const [width,height] of [[320,290],[390,394],[768,850],[1280,552],[1920,864]]){
    const size=m.get(`galleryGeometry(${width},${height})`);
    const outer=Math.hypot(size.radius,size.cardWidth/2,size.cardWidth*1.25/2);
    const projected=outer/Math.sqrt(1-(outer/size.perspective)**2);
    assert.ok(projected<=Math.min(width,height)/2-7.99);
    assert.ok(projected*2>=Math.min(width,height)*.94);
  }
});

function wheel(m,deltaX,deltaY,deltaMode=0,extra={}){
  return m.send('wheel',0,0,1000,1,'mouse',{
    deltaX,deltaY,deltaMode,cancelable:true,ctrlKey:false,...extra
  });
}

test('wheel on the sphere prevents page scrolling and rotates without adding a second momentum',()=>{
  const m=model();m.get('velX=.2;velY=.2');const event=wheel(m,0,500);
  assert.equal(event.defaultPrevented,true);
  assert.equal(m.get('stage.eventOptions.wheel.passive'),false);
  const angle=m.get('dragY');assert.ok(angle<0&&angle>=-30);
  m.get('camera(1020)');assert.equal(m.get('dragY'),angle);
  assert.deepEqual([...m.get('[velX,velY]')],[0,0]);
  assert.equal(m.get('opened'),0);
  assert.equal(m.get('document.events.wheel'),undefined);
});

test('native touch movement is cancelled only on the active sphere when cancelable',()=>{
  for(const [state,cancelable,prevented] of [['',true,true],['',false,false],["currentView='services'",true,false],["litOpen=true",true,false],["gridOpen=true",true,false]]){
    const m=model();if(state)m.get(state);
    const event=m.send('touchmove',0,0,1000,1,'touch',{cancelable});
    assert.equal(event.defaultPrevented,prevented);
    assert.equal(m.get('stage.eventOptions.touchmove.passive'),false);
    assert.equal(m.get('document.events.touchmove'),undefined);
  }
});

test('touch scroll guard preserves taps with up to 3px of finger movement',()=>{
  for(const offset of [0,1,2,3]){
    const m=model();m.send('pointerdown',30,30,1000);
    if(offset){
      m.send('pointermove',30+offset,30+offset,1020);
      m.send('touchmove',30+offset,30+offset,1020,1,'touch',{cancelable:true});
    }
    m.send('pointerup',30+offset,30+offset,1040);
    assert.equal(m.get('opened'),1);assert.equal(m.get('stage.captured.size'),0);
  }
});

test('wheel line and page deltas normalize to pixels and preserve diagonal direction',()=>{
  const pixels=model(),lines=model();wheel(pixels,16,32);wheel(lines,1,2,1);
  assert.deepEqual([...pixels.get('[dragX,dragY]')],[...lines.get('[dragX,dragY]')]);
  assert.equal(pixels.get('dragY/dragX'),-2);
  const largePixels=model(),page=model();wheel(largePixels,0,500);wheel(page,0,1,2);
  assert.deepEqual([...largePixels.get('[dragX,dragY]')],[...page.get('[dragX,dragY]')]);
});

test('Ctrl wheel and inactive gallery keep native scrolling or browser zoom',()=>{
  for(const state of ['',"document.hidden=true","currentView='services'","gridOpen=true","menuOpen=true","litOpen=true"]){
    const m=model();if(state)m.get(state);
    const event=wheel(m,0,200,0,{ctrlKey:!state});
    assert.equal(event.defaultPrevented,false);
    assert.deepEqual([...m.get('[dragX,dragY,velX,velY]')],[0,0,0,0]);
    assert.equal(m.get('cameraFrame'),0);
  }
});

test('wheel cannot disrupt an active pointer drag and reduced motion has no wheel inertia',()=>{
  const m=model();m.send('pointerdown',30,30,1000);m.send('pointermove',90,60,1040);
  const angle=[...m.get('[dragX,dragY]')],event=wheel(m,200,200);
  assert.equal(event.defaultPrevented,true);assert.deepEqual([...m.get('[dragX,dragY]')],angle);
  assert.equal(m.get('stage.captured.has(1)'),true);
  const reduced=model();reduced.get('reducedMotion.matches=true');wheel(reduced,0,100);
  const stopped=reduced.get('dragY');assert.ok(stopped<0);
  reduced.get('camera(1100)');assert.equal(reduced.get('dragY'),stopped);
  assert.equal(reduced.get('cameraFrame'),0);
});

test('the same drag and 800 ms release agree at 60, 90, 120 and 144 Hz',()=>{
  const results=[];
  for(const hz of [60,90,120,144]){
    const m=model();m.send('pointerdown',20,40,1000);
    for(let i=1;i<=hz/2;i++)m.send('pointermove',20+120*i/(hz/2),40+30*i/(hz/2),1000+i*1000/hz);
    m.send('pointerup',140,70,1500);
    const start=m.get('[dragX,dragY,velX,velY]');
    for(let frame=1;frame<hz*.8;frame++)m.get(`camera(${1500+frame*1000/hz})`);
    m.get('camera(2300)');results.push([...start,...m.get('[dragX,dragY,velX,velY]')]);
  }
  for(const result of results)result.forEach((value,i)=>assert.ok(Math.abs(value-results[0][i])<1e-9));
});

test('drag follows input immediately, continues on release, and re-grab stops without opening',()=>{
  const m=model();m.send('pointerdown',50,80,1000);m.send('pointermove',110,95,1040);
  assert.equal(m.get('dragX'),18);m.send('pointerup',110,95,1040);
  m.get('camera(1060)');assert.ok(m.get('dragX')>18);
  const stopped=m.get('dragX');m.send('pointerdown',110,95,1061);m.get('camera(1080)');
  assert.equal(m.get('dragX'),stopped);assert.equal(m.get('velX'),0);
  m.send('pointerup',110,95,1081);assert.equal(m.get('opened'),0);
});

test('pointer cancellation and a second finger clear capture and cannot open a project',()=>{
  for(const interrupt of ['pointercancel','second-touch']){
    const m=model();m.send('pointerdown',40,70,1000);m.send('pointermove',80,80,1030);
    if(interrupt==='pointercancel')m.send('pointercancel',80,80,1035);
    else m.send('pointerdown',110,90,1035,2);
    const angle=m.get('dragX');m.send('pointermove',150,110,1040);m.send('pointerup',150,110,1050);
    assert.equal(m.get('gesture'),null);assert.equal(m.get('dragX'),angle);
    assert.equal(m.get('velX'),0);assert.equal(m.get('stage.captured.size'),0);assert.equal(m.get('opened'),0);
  }
});

test('hidden tabs, content, grid and dialogs cancel pending frames; gallery can resume',()=>{
  for(const state of ["document.hidden=true","currentView='services'","gridOpen=true","menuOpen=true","litOpen=true"]){
    const m=model();m.get('invalidate()');assert.ok(m.get('cameraFrame')>0);
    m.get(state+';syncAccess()');assert.equal(m.get('cameraFrame'),0);
    const count=m.get('nextFrame');m.get('invalidate();camera(1200)');assert.equal(m.get('nextFrame'),count);
    m.get("document.hidden=false;currentView='works';gridOpen=false;menuOpen=false;litOpen=false;syncAccess();invalidate()");
    assert.ok(m.get('cameraFrame')>0);
  }
});

test('reduced motion retains direct manipulation without release inertia',()=>{
  const m=model();m.get('reducedMotion.matches=true');
  m.send('pointerdown',30,30,1000);m.send('pointermove',90,60,1040);m.send('pointerup',90,60,1040);
  const angle=m.get('dragX');m.get('camera(1100)');assert.equal(m.get('dragX'),angle);
  assert.equal(m.get('velX'),0);assert.equal(m.get('cameraFrame'),0);
});

test('coalesced pointer input uses the latest coordinate and idle frames do no further work',()=>{
  const m=model();m.send('pointerdown',20,40,1000);
  m.send('pointermove',30,40,1020,1,'touch',{getCoalescedEvents:()=>[{clientX:32,clientY:40,timeStamp:1020}]});
  assert.ok(Math.abs(m.get('dragX')-3.6)<1e-12);
  m.send('pointercancel',32,40,1021);m.get('camera(1030)');
  assert.equal(m.get('cameraFrame'),0);
});
