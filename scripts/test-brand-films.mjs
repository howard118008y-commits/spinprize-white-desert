import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const controller=html.split('// Brand film controller:')[1].split('// End brand film controller.')[0];
const source=controller.slice(controller.indexOf('function createBrandFilmPlayer'));
class Element extends EventTarget {
  constructor(dataset={}){super();this.dataset=dataset;this.attrs=new Map();this.textContent='';}
  setAttribute(k,v){this.attrs.set(k,String(v));}getAttribute(k){return this.attrs.get(k)??null;}removeAttribute(k){this.attrs.delete(k);}
  click(){this.dispatchEvent(new Event('click'));}
}
class Video extends Element {
  loads=0;plays=0;pauses=0;paused=true;error=null;posters=[];sources=[];next=null;
  set src(value){this.sources.push(value);this.setAttribute('src',value);}set poster(value){this.posters.push(value);}
  load(){this.loads++;this.error=null;}
  play(){this.plays++;this.paused=false;this.dispatchEvent(new Event('play'));return this.next??Promise.resolve();}
  pause(){this.pauses++;const wasPlaying=!this.paused;this.paused=true;if(wasPlaying)this.dispatchEvent(new Event('pause'));}
}
function fixture(showVideo=()=>{}){
  const choices=['portrait','landscape'].map((film,i)=>new Element({film,title:`Film ${film}`,width:i?'1920':'1080',height:i?'1080':'1920',src:`assets/${film}.mp4`,poster:`assets/${film}.webp`}));
  const video=new Video(),button=new Element(),status=new Element(),stage=new Element(),title=new Element();let allowed=true;
  const elements={'video':video,'.brand-film-play':button,'.brand-film-status':status,'.brand-film-stage':stage,'#brand-film-current-title':title};
  const root={querySelector:s=>elements[s],querySelectorAll:()=>choices};
  const create=runInNewContext(`${source}\ncreateBrandFilmPlayer;`,{Promise});
  return {player:create(root,()=>allowed,showVideo),video,button,status,stage,title,choices,block(){allowed=false;}};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
test('initial HTML and controller assign no video/source URL, autoplay or initial poster',()=>{
  const tag=html.match(/<video id="brand-film-video"[^>]*>/)[0];assert.match(tag,/controls/);assert.match(tag,/playsinline/);assert.match(tag,/preload="none"/);assert.doesNotMatch(tag,/\s(?:src|poster|autoplay)=|\sautoplay(?:\s|>)/);assert.equal(html.includes('<source'),false);
  const f=fixture();assert.equal(f.video.loads,0);assert.equal(f.video.plays,0);assert.deepEqual(f.video.sources,[]);assert.deepEqual(f.video.posters,[]);
});
test('enter and format selection load posters only; explicit play loads the selected source',async()=>{
  const f=fixture();f.player.enter();assert.deepEqual(f.video.posters,['assets/portrait.webp']);assert.equal(f.video.sources.length,0);
  f.choices[1].click();assert.equal(f.video.sources.length,0);assert.equal(f.video.plays,0);assert.equal(f.stage.dataset.format,'landscape');assert.equal(f.video.width,1920);
  f.button.click();await flush();assert.deepEqual(f.video.sources,['assets/landscape.mp4']);assert.equal(f.video.plays,1);assert.equal(f.status.textContent,'播放中，可使用播放器控制。');
});
test('switch pauses prior media, clears source, updates pressed/label state and never auto-plays next version',async()=>{
  const f=fixture();f.player.enter();f.button.click();await flush();f.choices[1].click();
  assert.equal(f.video.paused,true);assert.equal(f.video.getAttribute('src'),null);assert.equal(f.video.plays,1);assert.equal(f.choices[0].getAttribute('aria-pressed'),'false');assert.equal(f.choices[1].getAttribute('aria-pressed'),'true');assert.equal(f.video.getAttribute('aria-label'),'Film landscape');
});
test('leaving and reentering preserves selected format but stays paused until a new user play',async()=>{
  const f=fixture();f.choices[1].click();f.button.click();await flush();f.player.pause();f.player.enter();assert.equal(f.video.paused,true);assert.equal(f.stage.dataset.format,'landscape');assert.equal(f.video.plays,1);
  f.button.click();await flush();assert.equal(f.video.plays,2);assert.equal(f.video.sources.length,1);
});
test('late play settlement after leaving cannot restart or overwrite the selected version status',async()=>{
  const f=fixture();let resolve;f.video.next=new Promise(r=>resolve=r);f.button.click();f.block();f.player.pause();resolve();await flush();assert.equal(f.video.paused,true);
  f.video.paused=false;f.video.dispatchEvent(new Event('play'));assert.equal(f.video.paused,true);
});
test('old play rejection on a version switch and native AbortError never report a new-film failure',async()=>{
  const f=fixture();let reject;f.video.next=new Promise((_,r)=>reject=r);f.button.click();f.choices[1].click();reject(new Error('old request'));await flush();assert.equal(f.status.textContent,'按播放後才會載入影片。');
  f.video.next=Promise.reject(Object.assign(new Error('user paused'),{name:'AbortError'}));f.button.click();f.video.pause();await flush();assert.doesNotMatch(f.status.textContent,/未能|無法/);
});
test('actual current media failure can be retried; stale reset error is ignored',async()=>{
  const f=fixture();f.button.click();await flush();f.video.error={code:2};f.video.dispatchEvent(new Event('error'));assert.match(f.status.textContent,/無法載入/);const loads=f.video.loads;f.button.click();await flush();assert.equal(f.video.loads,loads+1);assert.match(f.status.textContent,/播放中/);
  f.choices[1].click();f.video.dispatchEvent(new Event('error'));assert.equal(f.status.textContent,'按播放後才會載入影片。');
});
test('unavailable route/menu/hidden state refuses new playback without setting a source',()=>{
  const f=fixture();f.block();f.button.click();assert.equal(f.video.plays,0);assert.equal(f.video.sources.length,0);
});

test('only the explicit play action brings the player below the fixed header',async()=>{
  const shown=[],f=fixture(video=>shown.push(video));f.player.enter();f.choices[1].click();f.player.enter();assert.equal(shown.length,0);
  f.button.click();await flush();assert.equal(shown.length,1);assert.equal(shown[0],f.video);f.player.pause();f.player.enter();assert.equal(shown.length,1);
});
