export const TYPES = ['hero', 'services', 'work', 'cta'];
export const LABELS = {hero:'主視覺',services:'服務介紹',work:'作品展示',cta:'行動按鈕'};
export const TARGET = 600;
export const DURATION = 75000;
export const BRIEFS = [
  {id:'coffee',name:'小島咖啡',tag:'COFFEE & SLOW DAYS',headline:'把日常，沖成好日子。',copy:'一杯手沖，一點留白。找到屬於你的慢時光。',preferred:'services',services:['手沖咖啡','每日甜點'],work:['晨光角落','一杯日常'],cta:'來喝一杯',request:'讓人一眼找到店裡的好味道。'},
  {id:'photo',name:'午後照相館',tag:'STORIES IN THE LIGHT',headline:'把喜歡的瞬間，留下。',copy:'散步、相遇與午後的光，都是值得收藏的故事。',preferred:'work',services:['人像寫真','生活紀錄'],work:['海邊日記','城市漫步'],cta:'預約拍攝',request:'先用作品，讓人喜歡你的風格。'},
  {id:'plant',name:'芽芽小工作室',tag:'GROW SOMETHING GOOD',headline:'讓小小的想法，長大。',copy:'用植物與手作，替平凡的角落加一點生氣。',preferred:'services',services:['植栽搭配','手作課程'],work:['窗邊小森林','綠意提案'],cta:'一起動手做',request:'把提供的服務，說得簡單又清楚。'}
];
const pick=(items,rng)=>items[Math.min(items.length-1,Math.max(0,Math.floor(rng()*items.length)))];
function hand(state,rng){
  const missing=TYPES.filter(type=>!state.slots[type]);
  if(missing.length&&!state.cards.some(type=>missing.includes(type)))state.cards[0]=pick(missing,rng);
}
function drawCard(state,others,rng){
  const available=TYPES.filter(type=>!state.slots[type]&&!others.includes(type));
  return pick(available.length?available:TYPES.filter(type=>!others.includes(type)),rng);
}
function newHand(state,rng){state.cards=[];for(let i=0;i<3;i++)state.cards.push(drawCard(state,state.cards,rng));}
function nextSite(state,rng){
  const choices=BRIEFS.filter(brief=>brief.id!==state.brief?.id);
  state.brief=pick(choices.length?choices:BRIEFS,rng);
  state.slots=Object.fromEntries(TYPES.map(type=>[type,false]));
  newHand(state,rng);hand(state,rng);
}
export function createGame(mode='timed',rng=Math.random){
  const state={mode:mode==='practice'?'practice':'timed',status:'playing',score:0,remainingMs:DURATION,deliveries:0,fullSites:0,streak:0,bestStreak:0,brief:null,slots:{},cards:[]};
  nextSite(state,rng);return state;
}
export function canDeliver(state){return state.status==='playing'&&state.slots.hero&&state.slots.cta;}
export function advance(state,elapsedMs){
  if(state.status!=='playing'||state.mode!=='timed')return false;
  state.remainingMs=Math.max(0,state.remainingMs-Math.max(0,Number.isFinite(elapsedMs)?elapsedMs:0));
  if(state.remainingMs===0){state.status='ended';return true;}return false;
}
export function pause(state){if(state.status==='playing')state.status='paused';}
export function resume(state){if(state.status==='paused')state.status='playing';}
export function place(state,index,slot,rng=Math.random){
  if(state.status!=='playing')return {kind:'ignored'};
  if(!Number.isInteger(index)||index<0||index>2||!TYPES.includes(slot))return {kind:'hint',message:'先選一張模組卡，再點網站的位置。'};
  const type=state.cards[index];
  if(type!==slot||state.slots[slot]){
    state.score=Math.max(0,state.score-5);state.streak=0;
    return {kind:'wrong',message:state.slots[slot]?'這裡已完成，試試另一個位置。':`${LABELS[type]}要放在「${LABELS[type]}」的位置。`,points:-5};
  }
  state.slots[slot]=true;state.streak++;state.bestStreak=Math.max(state.bestStreak,state.streak);
  const points=state.streak>=3?20:10;state.score+=points;
  state.cards[index]=drawCard(state,state.cards.filter((_,i)=>i!==index),rng);hand(state,rng);
  return {kind:'placed',slot,points,message:`${LABELS[slot]}完成，＋${points}${state.streak>=3?'，連擊加分！':'！'}`};
}
export function redraw(state,rng=Math.random){
  if(state.status!=='playing')return {kind:'ignored'};
  state.score=Math.max(0,state.score-10);state.streak=0;newHand(state,rng);hand(state,rng);
  return {kind:'redrawn',message:'換了一手新牌，扣 10 分，連擊重新開始。'};
}
export function deliver(state,rng=Math.random){
  if(state.status!=='playing')return {kind:'ignored'};
  if(!canDeliver(state))return {kind:'hint',message:'先完成主視覺和行動按鈕，就能交付。'};
  const full=TYPES.every(type=>state.slots[type]);
  let points=60;
  for(const type of ['services','work'])if(state.slots[type])points+=state.brief.preferred===type?20:10;
  if(full){points+=30;state.fullSites++;}state.score+=points;state.deliveries++;
  if(state.mode==='practice'&&state.deliveries>=6)state.status='ended';else nextSite(state,rng);
  return {kind:'delivered',full,points,message:`${full?'完整網站':'網站'}交付成功，＋${points}！`};
}
export function loadPreferences(storage){
  const fallback={sound:false,best:{timed:0,practice:0}};
  try{
    const saved=JSON.parse(storage?.getItem('heycheng-play-v1')||'null');
    if(saved?.version!==1)return fallback;
    for(const mode of ['timed','practice'])if(Number.isSafeInteger(saved.best?.[mode])&&saved.best[mode]>=0&&saved.best[mode]<=1000000)fallback.best[mode]=saved.best[mode];
    fallback.sound=saved.sound===true;
  }catch{}return fallback;
}
export function savePreferences(storage,prefs){
  try{if(!storage)return false;storage.setItem('heycheng-play-v1',JSON.stringify({version:1,sound:prefs.sound,best:prefs.best}));return true;}catch{return false;}
}
