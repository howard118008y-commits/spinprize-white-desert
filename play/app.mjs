import {TYPES,LABELS,TARGET,createGame,canDeliver,advance,pause,resume,place,redraw,deliver,loadPreferences,savePreferences} from './game.mjs';
const $=id=>document.getElementById(id);
const slots=[...document.querySelectorAll('[data-slot]')],cards=[...document.querySelectorAll('[data-card]')];
let storage=null;try{storage=window.localStorage;}catch{}
const prefs=loadPreferences(storage);
let state=null,selected=null,lastTick=performance.now(),lastClock='',endedShown=false,warned=false,audioContext=null,offlineReady=false;
const artwork={
 coffee:'<svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="62" cy="62" r="52" fill="currentColor" opacity=".16"/><path d="M23 44h62v32a23 23 0 0 1-23 23H46a23 23 0 0 1-23-23Z" fill="currentColor"/><path d="M85 51h5a14 14 0 0 1 0 28h-5" fill="none" stroke="currentColor" stroke-width="8"/><path d="M42 16c-12 12 9 11 0 23m20-23c-12 12 9 11 0 23" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M21 104h79" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>',
 photo:'<svg viewBox="0 0 120 120" aria-hidden="true"><rect x="13" y="9" width="94" height="106" rx="5" fill="currentColor" opacity=".18"/><path d="M24 90V30a36 36 0 0 1 72 0v60Z" fill="currentColor"/><circle cx="78" cy="33" r="12" fill="#f1ca89"/><path d="m24 80 25-30 20 22 10-9 17 20v7H24Z" fill="#ded8ef"/><path d="M35 102h50" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>',
 plant:'<svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="61" r="50" fill="currentColor" opacity=".14"/><path d="M40 77h41l-6 31H46Z" fill="currentColor"/><path d="M60 77V25" stroke="currentColor" stroke-width="4"/><path d="M60 53C32 55 27 38 30 27c23-1 33 10 30 26Zm1-12C63 18 81 14 91 18c0 17-11 26-30 23Zm0 30c4-24 22-25 31-22-1 19-15 26-31 22Z" fill="currentColor"/></svg>'
};
function emptyMarkup(type){return `<span class="empty-slot"><span class="empty-icon icon-${type}" aria-hidden="true"></span><strong>${LABELS[type]}</strong><small>${type==='hero'||type==='cta'?'交付必備':'選填加分'} · 放一張卡到這裡</small></span>`;}
function moduleMarkup(type){
 const b=state.brief;
 if(type==='hero')return `<span class="module-hero"><span><small class="mini-eyebrow">${b.tag}</small><strong>${b.headline}</strong><span class="mini-copy">${b.copy}</span></span><span class="art">${artwork[b.id]}</span></span>`;
 if(type==='services')return `<span class="module-small"><strong class="mini-section-title">我們的服務 <small>SERVICES</small></strong><span class="service-list">${b.services.map((s,i)=>`<span><i aria-hidden="true">${i===0?'✦':'＋'}</i>${s}</span>`).join('')}</span></span>`;
 if(type==='work')return `<span class="module-small"><strong class="mini-section-title">一些小故事 <small>SELECTED</small></strong><span class="work-grid">${b.work.map(s=>`<span><b aria-hidden="true"></b>${s}</span>`).join('')}</span></span>`;
 return `<span class="module-cta"><span><small>LET’S SAY HELLO</small><strong>從這裡，開始一段故事。</strong></span><span class="mini-cta-pill">${b.cta} ↗</span></span>`;
}
function announce(message,kind='hint'){$('feedback').dataset.kind=kind;$('feedback').textContent=message;}
function updateSound(){$('sound').textContent=`音效：${prefs.sound?'開':'關'}`;$('sound').setAttribute('aria-pressed',String(prefs.sound));}
function sound(kind){
 if(!prefs.sound)return;
 try{
  audioContext??=new (window.AudioContext||window.webkitAudioContext)();audioContext.resume().catch(()=>{});
  const oscillator=audioContext.createOscillator(),gain=audioContext.createGain(),now=audioContext.currentTime;
  oscillator.type='sine';oscillator.frequency.setValueAtTime(kind==='wrong'?190:kind==='delivered'?660:440,now);
  if(kind==='delivered')oscillator.frequency.setValueAtTime(880,now+.09);
  gain.gain.setValueAtTime(.035,now);gain.gain.exponentialRampToValueAtTime(.001,now+.2);
  oscillator.connect(gain);gain.connect(audioContext.destination);oscillator.start();oscillator.stop(now+.21);
 }catch{}
}
function updateClock(){
 if(!state)return;const text=state.mode==='practice'?`${Math.max(0,6-state.deliveries)} 次`:`${Math.ceil(state.remainingMs/1000)}s`;
 if(text!==lastClock){$('clock').textContent=text;lastClock=text;}
 $('clock').classList.toggle('urgent',state.mode==='timed'&&state.remainingMs<=15000);
 if(state.mode==='timed'&&state.remainingMs<=15000&&!warned&&state.status==='playing'){warned=true;announce('還有 15 秒，記得把完成的網站交付。');}
}
function render(){
 if(!state)return;if(state.status==='ended'){showResults();return;}
 $('score').textContent=state.score;$('streak').innerHTML=`${state.streak}<span>×</span>`;$('deliveries').textContent=state.deliveries;
 $('clock-label').textContent=state.mode==='practice'?'還可交付':'剩餘時間';$('progress').value=Math.min(TARGET,state.score);updateClock();
 $('brief-number').textContent=String(state.deliveries+1).padStart(2,'0');$('brief-name').textContent=state.brief.name;$('brief-request').textContent=state.brief.request;
 $('preference').textContent=`偏好：${LABELS[state.brief.preferred]} +20`;$('preview-address').textContent=`${state.brief.id}.demo`;$('mini-site').dataset.theme=state.brief.id;
 for(const button of slots){const type=button.dataset.slot;button.innerHTML=state.slots[type]?moduleMarkup(type):emptyMarkup(type);button.classList.toggle('filled',state.slots[type]);button.classList.toggle('is-match',selected!==null&&state.cards[selected]===type&&!state.slots[type]);button.setAttribute('aria-label',`${LABELS[type]}位置，${state.slots[type]?'已完成':'尚未完成'}${type==='hero'||type==='cta'?'，交付必備':''}`);}
 cards.forEach((button,index)=>{const type=state.cards[index];button.innerHTML=`<span class="card-icon icon-${type}" aria-hidden="true"></span><span class="card-text"><strong>${LABELS[type]}</strong><small>${type==='hero'||type==='cta'?'交付必備':type===state.brief.preferred?'委託偏好，加分更多':'補齊網站，完整加分'}</small></span><span class="card-key" aria-hidden="true">${index+1}</span>`;button.setAttribute('aria-pressed',String(selected===index));button.setAttribute('aria-label',`第 ${index+1} 張，${LABELS[type]}${state.slots[type]?'，此位置已完成':''}`);});
 $('selection-hint').textContent=selected===null?'選一張卡，讓網站長出來。':`已選「${LABELS[state.cards[selected]]}」，點同名位置。`;
 $('deliver').disabled=!canDeliver(state);
 $('delivery-hint').textContent=canDeliver(state)?(TYPES.every(t=>state.slots[t])?'四區完成！現在交付，拿完整網站加分。':'已可交付！也可以補完網站，拿更多分。'):'主視覺＋行動按鈕完成，就能交付。';
 updateSound();
}
function syncClock(){const now=performance.now(),delta=now-lastTick;lastTick=now;if(state&&advance(state,delta))showResults();else updateClock();}
function tick(){syncClock();requestAnimationFrame(tick);}
function selectCard(index){syncClock();if(state?.status!=='playing')return;selected=index;render();announce(`選了${LABELS[state.cards[index]]}，請點同名位置。`);}
function apply(result){if(result.kind==='ignored')return;announce(result.message,result.kind);if(['placed','wrong','delivered'].includes(result.kind))sound(result.kind);render();if(result.kind==='placed'){const button=slots.find(s=>s.dataset.slot===result.slot);button.classList.add('just-placed');setTimeout(()=>button.classList.remove('just-placed'),300);}}
function placeSelected(slot,index=selected){syncClock();if(state?.status!=='playing')return;const result=place(state,index,slot);if(result.kind==='placed')selected=null;apply(result);}
function start(mode){
 state=createGame(mode);selected=null;endedShown=false;warned=false;lastClock='';lastTick=performance.now();
 $('welcome').hidden=true;$('results').hidden=true;$('game-screen').hidden=false;document.body.classList.add('playing');
 render();announce('先選卡，再點同名位置。主視覺和行動按鈕完成，就能交付。');cards[0].focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});
}
function showWelcome(){
 if($('pause-dialog').open)$('pause-dialog').close();state=null;selected=null;
 $('game-screen').hidden=true;$('results').hidden=true;$('welcome').hidden=false;document.body.classList.remove('playing');
 $('welcome-best').textContent=`最佳紀錄：75 秒 ${prefs.best.timed} 分 ／ 不限時 ${prefs.best.practice} 分`;
 $('start-game').focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});
}
function showResults(){
 if(!state||endedShown)return;endedShown=true;const won=state.score>=TARGET,newBest=state.score>prefs.best[state.mode];
 if($('pause-dialog').open)$('pause-dialog').close();
 prefs.best[state.mode]=Math.max(prefs.best[state.mode],state.score);const saved=savePreferences(storage,prefs);
 $('game-screen').hidden=true;$('results').hidden=false;document.body.classList.remove('playing');
 $('result-eyebrow').textContent=state.mode==='timed'?'75 SECOND CHALLENGE':'SLOW PLAY / 6 DELIVERIES';
 $('result-title').textContent=won?'你的網站小宇宙，上線。':'靈感已就位，再來一局。';
 $('result-copy').textContent=won?'600 分達標！從一張卡，變成一個完整的想法。':`離 600 分還差 ${TARGET-state.score} 分。下次多補一塊，連擊也會幫你加分。`;
 $('final-score').textContent=state.score;$('final-deliveries').textContent=state.deliveries;$('final-full').textContent=state.fullSites;$('final-streak').textContent=state.bestStreak;
 $('record-note').textContent=`${newBest?'✦ 新紀錄！ ':''}此模式最佳 ${prefs.best[state.mode]} 分${saved?'':' · 這次紀錄暫存於本頁'}`;
 $('result-title').focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});
}
function pauseGame(){syncClock();if(state?.status!=='playing')return;pause(state);$('pause-dialog').showModal();$('resume').focus();}
function resumeGame(){if(!state||state.status!=='paused')return;resume(state);lastTick=performance.now();$('pause-dialog').close();render();cards[selected??0].focus({preventScroll:true});}
$('start-game').addEventListener('click',()=>start(document.querySelector('input[name=mode]:checked').value));
cards.forEach((button,index)=>{
 button.addEventListener('click',()=>selectCard(index));
 button.addEventListener('dragend',()=>{if(state?.status==='playing'&&selected!==null){selected=null;render();announce('已取消拖曳，也可以點卡片再點位置。');}});
 button.addEventListener('dragstart',event=>{if(state?.status!=='playing'){event.preventDefault();return;}selectCard(index);event.dataTransfer.setData('application/x-heycheng-play-card',String(index));event.dataTransfer.effectAllowed='move';});
});
slots.forEach(button=>{
 button.addEventListener('click',()=>placeSelected(button.dataset.slot));
 button.addEventListener('dragover',event=>{if(event.dataTransfer.types.includes('application/x-heycheng-play-card'))event.preventDefault();});
 button.addEventListener('drop',event=>{if(!event.dataTransfer.types.includes('application/x-heycheng-play-card'))return;event.preventDefault();const raw=event.dataTransfer.getData('application/x-heycheng-play-card');if(/^[0-2]$/.test(raw))placeSelected(button.dataset.slot,Number(raw));});
});
$('deliver').addEventListener('click',()=>{syncClock();if(state?.status!=='playing')return;const result=deliver(state);if(result.kind==='delivered')selected=null;apply(result);if(state.status==='playing')cards[0].focus({preventScroll:true});});
$('redraw').addEventListener('click',()=>{syncClock();if(state?.status!=='playing')return;selected=null;apply(redraw(state));});
$('pause').addEventListener('click',pauseGame);$('resume').addEventListener('click',resumeGame);$('back-to-modes').addEventListener('click',showWelcome);
$('pause-dialog').addEventListener('cancel',event=>{event.preventDefault();resumeGame();});
$('sound').addEventListener('click',()=>{prefs.sound=!prefs.sound;savePreferences(storage,prefs);updateSound();sound('placed');});
$('retry').addEventListener('click',()=>start(state.mode));$('change-mode').addEventListener('click',showWelcome);
$('game-interaction').addEventListener('keydown',event=>{if(event.altKey||event.ctrlKey||event.metaKey||state?.status!=='playing')return;if(/^[1-3]$/.test(event.key)){event.preventDefault();selectCard(Number(event.key)-1);}else if(event.key==='Escape'){selected=null;render();announce('已取消選取。');}});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state?.status==='playing')pauseGame();});
function offlineStatus(){$('offline-status').textContent=!navigator.onLine?(offlineReady?'已離線：遊戲可玩，回官網需連線。':'目前離線；本頁可玩，離線重開尚未就緒。'):(offlineReady?'離線已就緒 · 回官網與報價需連線':'首次需要連線載入，之後可離線重玩。');}
if('serviceWorker'in navigator){navigator.serviceWorker.register('./sw.js',{scope:'./'}).then(()=>navigator.serviceWorker.ready).then(registration=>{if(new URL(registration.scope).pathname==='/play/'){offlineReady=true;offlineStatus();}}).catch(()=>{$('offline-status').textContent='遊戲可正常遊玩；這個瀏覽器尚未啟用離線重開。';});}
window.addEventListener('online',offlineStatus);window.addEventListener('offline',offlineStatus);
$('welcome-best').textContent=`最佳紀錄：75 秒 ${prefs.best.timed} 分 ／ 不限時 ${prefs.best.practice} 分`;
updateSound();offlineStatus();requestAnimationFrame(tick);
