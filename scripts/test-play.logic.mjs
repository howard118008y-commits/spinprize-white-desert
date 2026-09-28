import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {TYPES,TARGET,DURATION,createGame,canDeliver,advance,pause,resume,place,redraw,deliver,loadPreferences,savePreferences} from '../portal/play/game.mjs';
function put(state,type){state.cards[0]=type;return place(state,0,type,()=>0);}
function full(state){for(const type of TYPES)put(state,type);}
test('Two required blocks allow an 80 point delivery; optional preference changes reward',()=>{
 const basic=createGame('timed',()=>0);put(basic,'hero');assert.equal(canDeliver(basic),false);put(basic,'cta');assert.equal(canDeliver(basic),true);const result=deliver(basic,()=>0);assert.equal(result.points,60);assert.equal(basic.score,80);assert.equal(basic.deliveries,1);assert.ok(TYPES.every(t=>!basic.slots[t]));
 const preferred=createGame('timed',()=>0);put(preferred,'hero');put(preferred,'cta');put(preferred,preferred.brief.preferred);assert.equal(deliver(preferred,()=>0).points,80);
 const other=createGame('timed',()=>0);put(other,'hero');put(other,'cta');put(other,other.brief.preferred==='services'?'work':'services');assert.equal(deliver(other,()=>0).points,70);
});
test('Full website grants the complete bonus and keeps combo into the next site',()=>{const s=createGame('timed',()=>0);full(s);assert.equal(s.score,60);const result=deliver(s,()=>0);assert.equal(result.points,120);assert.equal(result.full,true);assert.equal(s.score,180);assert.equal(s.fullSites,1);assert.equal(s.streak,4);put(s,'hero');assert.equal(s.score,200);assert.equal(s.bestStreak,5);});
test('Wrong placement cannot overwrite a module; penalty is bounded and breaks combo',()=>{const s=createGame();put(s,'hero');put(s,'cta');s.cards[0]='hero';const before={...s.slots};assert.equal(place(s,0,'hero').kind,'wrong');assert.deepEqual(s.slots,before);assert.equal(s.score,15);assert.equal(s.streak,0);for(let i=0;i<10;i++)place(s,0,'work');assert.equal(s.score,0);const snapshot=JSON.stringify(s);assert.equal(place(s,null,'hero').kind,'hint');assert.equal(JSON.stringify(s),snapshot);});
test('Hand always has a legal move while a slot remains; redraw handles repeated RNG values',()=>{
 let seed=41;const rng=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
 for(const random of [()=>0,()=>.999999,rng]){const s=createGame('timed',random);for(let turn=0;turn<120;turn++){const empty=TYPES.filter(t=>!s.slots[t]);if(!empty.length){deliver(s,random);continue;}const index=s.cards.findIndex(type=>empty.includes(type));assert.ok(index>=0);place(s,index,s.cards[index],random);if(turn%7===0){redraw(s,random);if(TYPES.some(t=>!s.slots[t]))assert.ok(s.cards.some(t=>!s.slots[t]));}}}
});
test('Opening hand has three distinct choices; refill stays distinct and favors unfinished slots',()=>{let seed=3;const rng=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};for(let round=0;round<80;round++){const s=createGame('timed',rng);assert.equal(new Set(s.cards).size,3);assert.ok(s.cards.includes('hero')||s.cards.includes('cta'));for(let step=0;step<4;step++){const index=s.cards.findIndex(t=>!s.slots[t]);assert.ok(index>=0);place(s,index,s.cards[index],rng);assert.equal(new Set(s.cards).size,3);const remaining=TYPES.filter(t=>!s.slots[t]);for(const type of remaining)assert.ok(s.cards.includes(type),'Unfinished choice was unnecessarily hidden');}redraw(s,rng);assert.equal(new Set(s.cards).size,3);}});
test('Exactly 75 active seconds ends once; paused/background gap does not consume time',()=>{const s=createGame();advance(s,1000);pause(s);const snapshot=JSON.stringify(s);advance(s,100000);assert.equal(JSON.stringify(s),snapshot);assert.equal(place(s,0,'hero').kind,'ignored');assert.equal(deliver(s).kind,'ignored');resume(s);assert.equal(advance(s,74000),true);assert.equal(s.remainingMs,0);assert.equal(s.status,'ended');const ended=JSON.stringify(s);advance(s,4000);redraw(s);deliver(s);put(s,'hero');assert.equal(s.status,'ended');assert.equal(s.score,JSON.parse(ended).score);assert.equal(advance(s,1),false);});
test('Practice ignores the clock and ends on the sixth valid delivery, never the fifth',()=>{const s=createGame('practice');advance(s,10*DURATION);assert.equal(s.remainingMs,DURATION);for(let i=0;i<6;i++){assert.equal(s.status,'playing');put(s,'hero');put(s,'cta');deliver(s);}assert.equal(s.status,'ended');assert.equal(s.deliveries,6);assert.equal(s.score,580);assert.ok(s.score<TARGET);});
test('A complete practice game can win; new game resets every round and timer field',()=>{const s=createGame('practice');for(let i=0;i<6;i++){full(s);deliver(s);}assert.ok(s.score>=TARGET);assert.equal(s.fullSites,6);const retry=createGame('practice');assert.equal(retry.score,0);assert.equal(retry.deliveries,0);assert.equal(retry.streak,0);assert.equal(retry.remainingMs,DURATION);assert.equal(retry.status,'playing');});
test('Bad elapsed values cannot add time or corrupt the clock',()=>{const s=createGame();advance(s,-100);advance(s,NaN);advance(s,Infinity);assert.equal(s.remainingMs,DURATION);advance(s,75_001);assert.equal(s.remainingMs,0);});
test('Storage blocked, corrupt or wrong-version data never blocks play',()=>{const fallback={sound:false,best:{timed:0,practice:0}};assert.deepEqual(loadPreferences(null),fallback);assert.deepEqual(loadPreferences({getItem(){throw Error('blocked');}}),fallback);assert.deepEqual(loadPreferences({getItem:()=>'{oops'}),fallback);assert.deepEqual(loadPreferences({getItem:()=>JSON.stringify({version:2,sound:true,best:{timed:999}})}),fallback);assert.equal(savePreferences({setItem(){throw Error('full');}},fallback),false);assert.equal(savePreferences(null,fallback),false);const s=createGame('practice');full(s);assert.equal(deliver(s).kind,'delivered');});
test('Best scores are validated and kept separate by mode; initial sound is muted',()=>{const stored={version:1,sound:true,best:{timed:420,practice:900}};let value=JSON.stringify(stored);const memory={getItem:()=>value,setItem:(key,next)=>{assert.equal(key,'heycheng-play-v1');value=next;}};const prefs=loadPreferences(memory);assert.deepEqual(prefs, {sound:true,best:{timed:420,practice:900}});assert.equal(savePreferences(memory,prefs),true);assert.deepEqual(JSON.parse(value),stored);assert.deepEqual(loadPreferences({getItem:()=>JSON.stringify({version:1,sound:'true',best:{timed:-1,practice:'900'}})}),{sound:false,best:{timed:0,practice:0}});});
const sw=await readFile(new URL('../play/sw.js',import.meta.url),'utf8');
function worker(){
 const handlers={},deleted=[],navigated=[];let unregistered=false;
 const self={location:{origin:'https://example.test'},addEventListener:(name,fn)=>handlers[name]=fn,skipWaiting:async()=>{},registration:{unregister:async()=>{unregistered=true;}},clients:{matchAll:async()=>['https://example.test/play/','https://example.test/portal/','https://example.test/'].map(url=>({url,navigate:async next=>navigated.push([url,next])}))}};
 vm.runInNewContext(sw,{self,URL,caches:{keys:async()=>['unrelated-root-cache','heycheng-play-old','heycheng-play-20260927-v4'],delete:async name=>deleted.push(name)}});
 return {handlers,deleted,navigated,get unregistered(){return unregistered;}};
}
test('Retired game worker clears only its own caches, unregisters and redirects only old game clients',async()=>{
 const w=worker();let pending;w.handlers.install({waitUntil:p=>pending=p});await pending;w.handlers.activate({waitUntil:p=>pending=p});await pending;
 assert.deepEqual(w.deleted,['heycheng-play-old','heycheng-play-20260927-v4']);assert.equal(w.unregistered,true);
 assert.deepEqual(w.navigated,[['https://example.test/play/','/portal/#play']]);assert.equal(w.handlers.fetch,undefined);
});
test('Internal game creates no service worker or offline document cache',async()=>{
 const app=await readFile(new URL('../portal/play/app.mjs',import.meta.url),'utf8');assert.doesNotMatch(app,/serviceWorker\.register|caches\./);
 const redirect=await readFile(new URL('../play/index.html',import.meta.url),'utf8');assert.match(redirect,/url=\/portal\/#play/);
});
test('Game starts only after a same-origin parent message; direct visits return to the portal',async()=>{
 const gate=(await readFile(new URL('../portal/play/gate.mjs',import.meta.url),'utf8')).replace("import('./app.mjs')","loadGame()");
 const handlers={},parent={},body={hidden:true};let loaded=0,redirect='';
 const window={parent,addEventListener:(type,fn)=>handlers[type]=fn,removeEventListener:type=>delete handlers[type]};
 const context={window,location:{origin:'https://example.test',href:'https://example.test/portal/play/index.html',replace:url=>redirect=url},document:{body,querySelectorAll:()=>[]},URL,loadGame:()=>loaded++};
 vm.runInNewContext(gate,context);const start=handlers.message;
 for(const event of [{source:{},origin:'https://example.test',data:{type:'heycheng-play-start'}},{source:parent,origin:'https://other.test',data:{type:'heycheng-play-start'}},{source:parent,origin:'https://example.test',data:{type:'other'}}])start(event);
 assert.equal(loaded,0);assert.equal(body.hidden,true);start({source:parent,origin:'https://example.test',data:{type:'heycheng-play-start'}});assert.equal(loaded,1);assert.equal(body.hidden,false);assert.equal(handlers.message,undefined);
 window.parent=window;vm.runInNewContext(gate,context);assert.equal(redirect,'https://example.test/portal/#play');
});
