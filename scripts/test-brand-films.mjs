import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,statSync,openSync,readSync,closeSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const controller=html.split('// Brand film controller:')[1].split('// End brand film controller.')[0];
const source=controller.slice(controller.indexOf('function createBrandFilmPlayer'));
class Element extends EventTarget {
  constructor(dataset={}){super();this.dataset=dataset;this.attrs=new Map();this.textContent='';this.style={values:{},setProperty(key,value){this.values[key]=value;}};}
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
  const choices=[['portrait',1080,1920,26.718],['landscape',1920,1080,91.24],['square',1200,1200,125.4],['screen',1440,1080,303.9]].map(([film,width,height,duration])=>new Element({title:`Film ${film}`,width:String(width),height:String(height),duration:String(duration),src:`assets/${film}.mp4`,poster:`assets/${film}.webp`}));
  const select=new Element();select.options=choices;select.selectedIndex=0;select.choose=index=>{select.selectedIndex=index;select.dispatchEvent(new Event('change'));};
  const video=new Video(),button=new Element(),status=new Element(),stage=new Element(),title=new Element(),duration=new Element();let allowed=true;
  const elements={'video':video,'.brand-film-select':select,'#brand-film-duration':duration,'.brand-film-play':button,'.brand-film-status':status,'.brand-film-stage':stage,'#brand-film-current-title':title};
  const root={querySelector:s=>elements[s]};
  const create=runInNewContext(`${source}\ncreateBrandFilmPlayer;`,{Promise});
  return {player:create(root,()=>allowed,showVideo),video,button,status,stage,title,duration,select,choices,block(){allowed=false;}};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
test('initial HTML and controller assign no video/source URL, autoplay or initial poster',()=>{
  const tag=html.match(/<video id="brand-film-video"[^>]*>/)[0];assert.match(tag,/controls/);assert.match(tag,/playsinline/);assert.match(tag,/preload="none"/);assert.doesNotMatch(tag,/\s(?:src|poster|autoplay)=|\sautoplay(?:\s|>)/);assert.equal(html.includes('<source'),false);
  const f=fixture();assert.equal(f.video.loads,0);assert.equal(f.video.plays,0);assert.deepEqual(f.video.sources,[]);assert.deepEqual(f.video.posters,[]);
});
test('enter and format selection load posters only; explicit play loads the selected source',async()=>{
  const f=fixture();f.player.enter();assert.deepEqual(f.video.posters,['assets/portrait.webp']);assert.equal(f.video.sources.length,0);
  f.select.choose(1);assert.equal(f.video.sources.length,0);assert.equal(f.video.plays,0);assert.equal(f.stage.style.values['--film-ratio'],String(1920/1080));assert.equal(f.video.width,1920);
  f.button.click();await flush();assert.deepEqual(f.video.sources,['assets/landscape.mp4']);assert.equal(f.video.plays,1);assert.equal(f.status.textContent,'播放中，可使用播放器控制。');
});
test('switch pauses prior media, clears source, updates selected option/label state and never auto-plays next version',async()=>{
  const f=fixture();f.player.enter();f.button.click();await flush();f.select.choose(1);
  assert.equal(f.video.paused,true);assert.equal(f.video.getAttribute('src'),null);assert.equal(f.video.plays,1);assert.equal(f.select.selectedIndex,1);assert.equal(f.video.getAttribute('aria-label'),'Film landscape');
});
test('leaving and reentering preserves selected format but stays paused until a new user play',async()=>{
  const f=fixture();f.select.choose(1);f.button.click();await flush();f.player.pause();f.player.enter();assert.equal(f.video.paused,true);assert.equal(f.stage.style.values['--film-ratio'],String(1920/1080));assert.equal(f.video.plays,1);
  f.button.click();await flush();assert.equal(f.video.plays,2);assert.equal(f.video.sources.length,1);
});
test('late play settlement after leaving cannot restart or overwrite the selected version status',async()=>{
  const f=fixture();let resolve;f.video.next=new Promise(r=>resolve=r);f.button.click();f.block();f.player.pause();resolve();await flush();assert.equal(f.video.paused,true);
  f.video.paused=false;f.video.dispatchEvent(new Event('play'));assert.equal(f.video.paused,true);
});
test('old play rejection on a version switch and native AbortError never report a new-film failure',async()=>{
  const f=fixture();let reject;f.video.next=new Promise((_,r)=>reject=r);f.button.click();f.select.choose(1);reject(new Error('old request'));await flush();assert.equal(f.status.textContent,'按播放後才會載入影片。');
  f.video.next=Promise.reject(Object.assign(new Error('user paused'),{name:'AbortError'}));f.button.click();f.video.pause();await flush();assert.doesNotMatch(f.status.textContent,/未能|無法/);
});
test('actual current media failure can be retried; stale reset error is ignored',async()=>{
  const f=fixture();f.button.click();await flush();f.video.error={code:2};f.video.dispatchEvent(new Event('error'));assert.match(f.status.textContent,/無法載入/);const loads=f.video.loads;f.button.click();await flush();assert.equal(f.video.loads,loads+1);assert.match(f.status.textContent,/播放中/);
  f.select.choose(1);f.video.dispatchEvent(new Event('error'));assert.equal(f.status.textContent,'按播放後才會載入影片。');
});
test('unavailable route/menu/hidden state refuses new playback without setting a source',()=>{
  const f=fixture();f.block();f.button.click();assert.equal(f.video.plays,0);assert.equal(f.video.sources.length,0);
});

test('only the explicit play action brings the player below the fixed header',async()=>{
  const shown=[],f=fixture(video=>shown.push(video));f.player.enter();f.select.choose(1);f.player.enter();assert.equal(shown.length,0);
  f.button.click();await flush();assert.equal(shown.length,1);assert.equal(shown[0],f.video);f.player.pause();f.player.enter();assert.equal(shown.length,1);
});

test('any catalog entry uses its own title, duration and actual ratio, including square and non-16:9 footage',async()=>{
  const f=fixture();f.player.enter();assert.equal(f.duration.textContent,'27 秒');
  for(const [index,ratio,time,title] of [[1,1920/1080,'1 分 31 秒','landscape'],[2,1,'2 分 05 秒','square'],[3,1440/1080,'5 分 04 秒','screen']]){
    f.select.choose(index);assert.equal(f.title.textContent,`Film ${title}`);assert.equal(f.duration.textContent,time);assert.equal(f.stage.style.values['--film-ratio'],String(ratio));assert.equal(f.video.sources.length,0);assert.equal(f.video.plays,0);
  }
  f.button.click();await flush();assert.deepEqual(f.video.sources,['assets/screen.mp4']);assert.equal(f.video.width,1440);assert.equal(f.video.height,1080);
  const pauses=f.video.pauses,loads=f.video.loads;f.select.choose(3);assert.equal(f.video.pauses,pauses);assert.equal(f.video.loads,loads);
});

test('production catalog contains exactly the six approved root videos and complete public metadata',()=>{
  const section=html.match(/<select class="brand-film-select"[\s\S]*?<\/select>/)[0];
  const entries=[...section.matchAll(/<option ([^>]+)>([^<]+)<\/option>/g)].map(([,attributes,label])=>({...Object.fromEntries([...attributes.matchAll(/([a-z-]+)="([^"]*)"/g)].map(([,key,value])=>[key,value])),label}));
  assert.deepEqual(entries.map(entry=>entry.value),['brand-portrait','brand-landscape','restaurant-portrait','restaurant-landscape','faq-portrait','faq-landscape']);
  const expectedFiles=[];
  for(const entry of entries){
    const [kind,orientation]=entry.value.split('-'),title={brand:'品牌形象',restaurant:'餐飲廣告',faq:'網站FAQ'}[kind]+(orientation==='portrait'?'｜直式':'｜橫式');
    assert.equal(entry['data-title'],title);assert.equal(Number(entry['data-duration']),{brand:26.718005,restaurant:13.125011,faq:43.808005}[kind]);
    assert.deepEqual([Number(entry['data-width']),Number(entry['data-height'])],orientation==='portrait'?[1080,1920]:[1920,1080]);
    assert.equal(entry.label,`${title} · ${Math.round(Number(entry['data-duration']))} 秒`);
    for(const [attribute,extension] of [['data-src','mp4'],['data-poster','webp']]){
      const path=entry[attribute];assert.match(path,new RegExp(`^assets/brand-films/[a-z0-9-]+\\.${extension}$`));expectedFiles.push(path.split('/').at(-1));
      const url=new URL('../'+path,import.meta.url);assert.ok(statSync(url).isFile());assert.ok(statSync(url).size>16);
      const fd=openSync(url,'r'),header=Buffer.alloc(16);try{readSync(fd,header,0,16,0);}finally{closeSync(fd);}
      if(extension==='mp4')assert.equal(header.toString('ascii',4,8),'ftyp');else{assert.equal(header.toString('ascii',0,4),'RIFF');assert.equal(header.toString('ascii',8,12),'WEBP');}
    }
  }
  assert.equal(new Set(expectedFiles).size,12);assert.deepEqual(readdirSync(new URL('../assets/brand-films/',import.meta.url)).sort(),expectedFiles.sort());
});
