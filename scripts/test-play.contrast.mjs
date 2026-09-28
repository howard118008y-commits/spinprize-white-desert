import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const css=await readFile(new URL('../portal/play/play.css',import.meta.url),'utf8');
function rule(selector){const escaped=selector.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');return css.match(new RegExp(escaped+'\\{([^}]+)\\}'))?.[1]||'';}
function color(body,name){return body.match(new RegExp('--'+name+':(#[a-f0-9]+)'))[1];}
function luminance(hex){const values=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return values.reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);}
function contrast(a,b){const [lo,hi]=[luminance(a),luminance(b)].sort((x,y)=>x-y);return(hi+.05)/(lo+.05);}
for(const [name,selector] of [['coffee','.mini-site'],['photo','.mini-site[data-theme=photo]'],['plant','.mini-site[data-theme=plant]']]){
 test(name+' preview CTA and small captions meet normal-text contrast',()=>{const body=rule(selector),paper=color(body,'paper'),accent=color(body,'siteaccent'),ink=color(body,'siteink');assert.ok(contrast(paper,accent)>=4.5);assert.ok(contrast(paper,ink)>=4.5);if(name!=='plant')assert.ok(contrast(paper,accent)>=5);});
}
test('Small preview labels do not lower their computed text contrast with opacity',()=>{for(const selector of ['.module-cta small','.mini-section-title small','.empty-slot small'])assert.match(rule(selector),/(?:^|;)opacity:1(?:;|$)/);});
test('Studio Tiffany green matches the main site',()=>{assert.match(rule(':root'),/--green:#00D9BA/);});

test('Primary CTA text on shared Tiffany green exceeds normal-text contrast',()=>{assert.ok(contrast('#00D9BA','#08271c')>=4.5);assert.match(rule('.primary'),/color:#08271c/);});
