import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const pricing = JSON.parse(await readFile(resolve(process.env.PRICING_DATA || resolve(root, 'pricing-data.public.json')), 'utf8'));
const origin = 'https://heycheng.com.tw';
const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const money = value => new Intl.NumberFormat('en-US').format(value);
const organization = {
  '@type':'Organization', '@id':`${origin}/#organization`, name:'Hey Cheng',
  alternateName:'旋賞數位', legalName:'旋賞數位有限公司', url:`${origin}/`, taxID:'62149294',
  logo:{'@type':'ImageObject',url:`${origin}/assets/hey-cheng-logo.png`,width:2061,height:763},
  telephone:'+886-2-2226-2678', email:'howard118008y@gmail.com',
  address:{'@type':'PostalAddress',streetAddress:'景平路593號之1',addressLocality:'中和區',addressRegion:'新北市',addressCountry:'TW'},
  sameAs:['https://www.instagram.com/heychengtw/']
};
const website = {'@type':'WebSite','@id':`${origin}/#website`,url:`${origin}/`,name:'Hey Cheng',alternateName:['HeyCheng','旋賞數位'],inLanguage:'zh-Hant',publisher:{'@id':organization['@id']}};
const services = [
  {
    slug:'brand-websites', name:'品牌形象網站', label:'WEBSITE DESIGN', title:'品牌形象網站建置｜從內容規劃到空間導覽｜Hey Cheng 旋賞數位',
    description:'Hey Cheng 旋賞數位提供品牌形象網站建置，整理商家資訊、服務內容與聯絡動線。了解網站規劃、手機閱讀、品牌後台與立體導覽，並瀏覽山遇、永貞豆腐店及 Go Shoot 公開作品。',
    lead:'把你的生意，說成一個看得懂的網站。', image:'case-shanyu.webp', imageAlt:'山遇民宿網站以建築與庭園呈現住宿品牌', caption:'山遇民宿 · 品牌網站作品',
    intro:'訪客可能先從手機認識你的品牌，也可能帶著明確問題來找服務。形象網站需要同時回答：你是誰、提供什麼、特色在哪裡，以及下一步怎麼聯絡。Hey Cheng 從現有資訊與實際營運出發，安排頁面內容與瀏覽順序。',
    sections:[
      ['先把資訊整理清楚','商家介紹、產品服務、實際照片和聯絡方式，是網站規劃的起點。已有網站時，可以先盤點內容是否仍符合現在的營運；準備第一次上線時，則從訪客最需要知道的資訊開始。'],
      ['讓品牌特色有自己的位置','住宿空間、餐飲品牌與零售店家的看點不同。畫面比例、文字長度與行動入口，應配合內容安排。手機上先讀懂重點，再逐步看細節；桌面則保留照片與文字的完整層次。'],
      ['依內容選擇網站規模','以商家資訊為主，可先看入門方案；需要品牌視覺與可編輯後台，可參考標準方案；有實體空間希望介紹，可再討論立體導覽。實際方案內容列於下方，先確認要解決的問題，再決定功能。']
    ],
    checklist:['現有品牌名稱、標誌與介紹','主要產品、服務與實際照片','希望訪客完成的行動','需要自行更新的內容'],
    faqs:[['已有網站，可以重新整理嗎？','可以先從現有網址、內容與目前遇到的問題討論。需要保留的頁面、功能、資料與使用工具，會影響後續的規劃範圍。'],['形象網站和客製系統如何選？','如果重點是讓人理解品牌與聯絡你，先看形象網站；若涉及會員、資料處理或內部操作流程，則適合進一步討論客製系統。']],
    planIds:['entry','standard','advanced'], related:['shanyu','yongzhen-tofu','goshoot']
  },
  {
    slug:'brand-content', name:'品牌攝影與文案', label:'PHOTOGRAPHY & CONTENT', title:'品牌攝影與網站文案｜現場拍攝與內容整理｜Hey Cheng 旋賞數位',
    description:'從現場拍攝到網站文案，Hey Cheng 旋賞數位協助整理品牌特色、產品與服務。查看品牌內容的準備方式、公開方案，以及永貞豆腐店和山遇民宿的圖文呈現案例。',
    lead:'照片有畫面，文字有你的個性。', image:'case-tofu.webp', imageAlt:'永貞豆腐店網站的品牌標題', heroImage:'work-tofu-overview.webp', heroAlt:'永貞豆腐店網站裡的全彩餐點照片', caption:'永貞豆腐店 · 2026.09.18 網站截圖，活動內容以原站為準',
    intro:'網站的內容來自你的現場：產品怎麼做、空間怎麼使用、服務有什麼細節。品牌攝影與文案把這些資訊整理成訪客容易閱讀的內容，讓照片與文字共同說明特色，而不是各說各的。',
    sections:[
      ['拍攝之前，先知道要說什麼','可以先列出網站要介紹的主角：店面、商品、空間、製作過程或服務情境，再確認現場可拍攝的內容。拍攝清單與頁面規劃一起討論，較容易知道照片要放在哪裡、需要表現什麼。'],
      ['用真實細節寫品牌介紹','品牌故事可以從經營者的說明、現有資料與實際做法開始。把特色寫具體，把服務說明寫清楚，再安排標題、段落與聯絡入口。涉及產品資訊與對外宣稱的內容，需由品牌提供並確認。'],
      ['把內容放回完整頁面','一張餐點照可以介紹品項，也能成為品牌主視覺；空間照片可以呈現氣氛，也應幫助訪客辨識房型。圖文配置依閱讀情境調整，手機上保留清楚的主體、段落與操作入口。']
    ],
    checklist:['既有照片與素材的使用權限','品牌故事與產品服務資料','可拍攝場景、商品與時段','需確認的名稱與對外資訊'],
    faqs:[['已經有照片，也能討論文案嗎？','可以先提供既有素材，確認清晰度、內容與使用權限，再盤點哪些資訊足夠、哪些需要補充。'],['案例中的照片代表每一張都由你們拍攝嗎？','案例展示網站的圖文成果，不將素材呈現等同攝影來源。各專案拍攝與既有素材的使用範圍，依實際安排確認。']],
    planIds:['plus'], related:['yongzhen-tofu','shanyu']
  },
  {
    slug:'ai-custom-systems', name:'AI 與客製系統', label:'AI & CUSTOM SYSTEMS', title:'AI 與客製系統開發｜諮詢流程、資料串接與營運工具｜Hey Cheng',
    description:'Hey Cheng 旋賞數位依實際營運流程規劃客製系統，討論 AI 助理、文件解析、報表與資料串接。了解需求盤點方式、公開系統方案，以及既有品牌與平台作品。',
    lead:'從每天重複的工作，找到系統的起點。', image:'case-ichiban.webp', imageAlt:'線上一番賞平台的商品與操作介面', caption:'線上一番賞 · 既有客製系統作品',
    intro:'當網站需要接上諮詢、資料整理、會員或營運流程，規劃就不能只停在頁面外觀。先把使用者、操作步驟、資料來源與結果說清楚，再決定哪些工作適合由系統協助。',
    sections:[
      ['從實際流程開始盤點','用一個真實工作情境，說明誰在什麼時候做什麼、輸入哪些資料、最後需要什麼結果。現有工具、資料格式、權限與人工確認的位置，都會影響功能範圍。'],
      ['把 AI 放在適合的步驟','AI 助理、文件解析、自動發文與報表，都是可討論的方向。先確認資料的使用方式、輸出要由誰檢查，以及不適合自動處理的情況，再安排功能與操作介面。'],
      ['讓介面接上日常營運','既有線上一番賞作品涵蓋會員、點數、金流、庫存與亂數驗證的操作流程；企業服務作品也呈現諮詢與 AI 助理入口。這些作品可協助討論需求，實際功能仍從你的流程個別規劃。']
    ],
    checklist:['目前使用的工具與工作步驟','資料來源、格式與使用權限','使用者角色與審核方式','希望產出的報表或操作結果'],
    faqs:[['還不確定需要哪些功能，怎麼開始？','先用一個常見情境描述目前怎麼做，以及最希望改善的步驟。可以由流程盤點開始，逐項確認要保留、串接或新增的功能。'],['可以直接套用展示作品的功能嗎？','展示作品有各自的使用情境。是否適用，需要比對資料、權限、操作流程與第三方工具，再確認專案範圍。']],
    planIds:['system'], related:['goshoot']
  }
];

const works = [
  {
    slug:'shanyu', id:'shanyu', name:'山遇民宿', label:'HOSPITALITY / BRAND WEBSITE', title:'山遇民宿網站案例｜住宿空間、房型與立體導覽｜Hey Cheng',
    description:'山遇民宿公開網站案例：從庭園與房型照片、品牌故事到空間導覽與詢房入口，了解 Hey Cheng 如何整理住宿網站的資訊與瀏覽動線，並查看完整作品截圖。',
    lead:'讓住宿的想像，從空間開始。', intro:'山遇民宿的網站，以庭園、房型與住宿生活作為敘事主角。作品把品牌故事、房間照片、公共空間及聯絡資訊放進同一段瀏覽動線，讓訪客先感受環境，再了解適合自己的住宿方式。',
    image:'case-shanyu.webp', imageAlt:'山遇民宿網站的庭園、建築與品牌主視覺', kind:'住宿空間', focus:'品牌網站 · 房型內容 · 空間導覽', live:'https://shanyu2015.com/', height:15095, overviewHeight:10063, captured:'2026 年 9 月 30 日',
    context:'住宿網站需要同時呈現感受與資訊。照片讓人理解環境，房型、空間說明和聯絡入口則幫助旅客把想像轉為具體問題。此案例可以觀察：如何讓不同內容各有位置，又保持一致的閱讀節奏。',
    sections:[
      ['空間先行，建立對場域的印象','頁面以自然色系與留白呼應住宿空間，將建築、庭園與品牌識別放在視覺主軸。空間導覽提供整體配置的參考，房型實景照片則承接各個空間的細節，兩種資訊在網站中各自發揮作用。'],
      ['房型逐一說明，讓照片可以比較','房間段落分別安排名稱、照片與介紹，讓訪客逐步看懂不同住宿空間。除了房間本身，早餐、公共空間與庭園也被放入內容，補足單靠房型列表難以傳達的生活情境。'],
      ['從品牌故事，走到實際詢問','品牌故事、住宿須知、交通與聯絡方式按內容分段。旅客可以先閱讀與欣賞，再找到詢房入口；網站沒有把所有細節擠進同一張照片，而是讓畫面與說明在捲動過程中接續。']
    ],
    takeaways:['適合用於討論：住宿、場域或有實體空間的品牌網站。','可參考的內容安排：環境、房型、故事、須知與聯絡。','空間示意與實景照片需清楚區分，避免讓訪客誤認。'], services:['brand-websites','brand-content']
  },
  {
    slug:'yongzhen-tofu', id:'tofu', name:'永貞豆腐店', label:'FOOD & BEVERAGE / BRAND CONTENT', title:'永貞豆腐店網站案例｜餐點攝影、品牌故事與店家資訊｜Hey Cheng',
    description:'永貞豆腐店公開網站案例：以餐點照片、製作故事、菜單與店家資訊串起餐飲品牌。查看網站圖文安排、完整作品截圖及相關品牌攝影與文案服務。',
    lead:'把一間店的味道，整理成可閱讀的故事。', intro:'永貞豆腐店的網站，從招牌餐點與品牌標題開始，把製作特色、菜單、店家資訊與加盟入口依序呈現。餐點照片是視覺主角，文字則補充食物背後的做法與店家個性。',
    image:'case-tofu.webp', imageAlt:'永貞豆腐店網站以大字標題與餐點照片呈現餐飲品牌', kind:'餐飲品牌', focus:'餐點內容 · 品牌故事 · 店家資訊', live:'https://yongzhen-tofu.com.tw/', height:7754, overviewHeight:5169,
    context:'餐飲網站的訪客，可能想先看吃什麼，也可能只想快速找到店址與聯絡方式。這個作品將品牌敘事與實用資訊分段，讓細看故事和直接找資訊的閱讀方式，都有清楚的入口。',
    sections:[
      ['用餐點與版面建立第一印象','網站採用帶有刊物感的標題、編號與圖說，搭配米色、深色區塊和全彩食物照片。大幅餐點畫面呈現主題，小幅店面與製作照片則補上現場感，讓畫面不只停留在單一產品。'],
      ['把製作特色拆成可閱讀的段落','品牌段落以製作過程為敘事線索，將步驟與照片並列，再接到菜單內容。訪客可以先理解特色，再往下查看品項；文字與圖片共同說明，避免把整個故事藏在一張宣傳圖裡。'],
      ['將菜單、到店與品牌延伸分開','菜單之後接續店家資訊、聯絡與外送相關入口，再安排加盟資訊。不同目的的內容保持可辨識的區塊：想吃、想到店、想進一步了解品牌，都可以沿著相應的入口往下走。']
    ],
    takeaways:['適合用於討論：餐飲品牌、菜單與店家介紹網站。','可參考的內容安排：招牌產品、製作故事、菜單與到店資訊。','活動、菜單與營業資訊需要隨店家現況維護，案例截圖保留擷取當時畫面。'], services:['brand-content','brand-websites']
  },
  {
    slug:'goshoot', id:'goshoot', name:'Go Shoot', label:'RETAIL / BRAND & ACTIVITIES', title:'Go Shoot 品牌網站案例｜玩具零售、活動與服務資訊｜Hey Cheng',
    description:'Go Shoot 公開品牌網站案例：以鮮明視覺整合玩具店資訊、活動、服務與新手內容。查看網站資訊層次、完整作品截圖，以及品牌網站和客製系統服務。',
    lead:'內容很多，也能有清楚的方向。', intro:'Go Shoot 的品牌網站集合玩具、店內服務、活動與相關入口。作品運用鮮明的橘黑色品牌語言，將多種內容分區，讓第一次接觸品牌的訪客與已熟悉活動的玩家，都能找到想看的資訊。',
    image:'case-goshoot.webp', imageAlt:'Go Shoot 網站的橘黑色品牌視覺與店面資訊', kind:'零售品牌', focus:'品牌識別 · 活動情報 · 服務入口', live:'https://goshoot.com.tw/index.html', height:9426, overviewHeight:6284,
    context:'當一個品牌同時提供多種服務，網站容易堆滿公告與連結。這個作品的重點是內容層次：先說明品牌與主要服務，再分配活動、新品、操作說明和到店資訊的閱讀位置。',
    sections:[
      ['品牌主視覺，接上空間與服務','首頁使用 Go Shoot 識別和橘黑色系，搭配店內空間示意，再列出主要服務。視覺先讓訪客辨識品牌，服務區塊則進一步說明可以在這裡找到什麼。'],
      ['把持續變動的內容放在對的位置','新品情報、活動與商品相關資訊以不同區塊呈現。標題、分類和卡片層次幫助訪客辨識內容性質，也讓較長的首頁可以逐段閱讀；活動與商品狀態則以原站的最新資訊為準。'],
      ['從認識品牌，走向各自的入口','頁面安排新手說明、相關服務連結與店面資訊。品牌網站負責建立理解與導引，連結的線上平台則承接各自的操作情境；案例不把品牌頁面與獨立平台視為同一個功能。']
    ],
    takeaways:['適合用於討論：有多種服務、活動或新品資訊的零售品牌。','可參考的內容安排：品牌、主力服務、情報、新手說明與到店。','品牌入口與交易或會員平台的功能範圍，應分別確認。'], services:['brand-websites','ai-custom-systems']
  }
];

function pricingBlock(ids) {
  const plans = ids.map(id => {
    const plan = pricing.plans.find(item => item.id === id);
    if (!plan) throw new Error(`Missing pricing plan: ${id}`);
    return `<article class="plan"><div><h3>${escape(plan.name)}</h3><p>${escape(plan.purpose)}</p></div><p class="price"><span>NT$</span> ${money(plan.price)}${plan.from ? '<small> 起</small>' : ''}<small>${escape(pricing.constructionTax)}</small></p><p>${escape(plan.includes)}</p></article>`;
  }).join('');
  const m = pricing.maintenance;
  const s = pricing.socialAutopost;
  const social = ids.includes('system') && s ? `<p>${escape(s.name)}另有明列價目：建置 NT$${money(s.setup)}，月費自助版 NT$${money(s.monthly.selfServe)}／月或代寫代發 NT$${money(s.monthly.managed)}／月（每月 ${escape(s.postsPerMonth)} 篇），均${escape(s.tax)}。 <a class="text-link" href="/#pricing">查看社群自動發文價目 <span aria-hidden="true">↗</span></a></p>` : '';
  return `<section class="section" id="plans"><div class="section-head"><p class="eyebrow">PLANS & SCOPE</p><h2>${ids.includes('plus')?'包含拍攝文案的建置方案':'從需要的規模開始'}</h2><p>${ids.includes('plus')?'本區顯示整套網站建置方案，不是單項攝影或文案的報價。':'以下為公開建置方案，作品畫面不代表個別方案的交付範圍。'}</p></div><div class="plans">${plans}</div>${social}<details class="terms"><summary>維運與合作條件</summary><div><p>${escape(m.firstYear)}</p><p>第 ${escape(m.startsYear)} 年起，基本維運每年 NT$${money(m.annual)}（${escape(m.tax)}）。${escape(m.service)}${escape(m.excluded)}</p><p>${escape(pricing.terms.payment)}${escape(pricing.terms.schedule)}${escape(pricing.terms.productionRevisions)}</p><p>${escape(pricing.terms.addons)}</p><p>${escape(pricing.terms.documentCopyright)}${escape(pricing.terms.websiteRights)}</p></div></details><a class="text-link" href="/#pricing">查看全部方案與完整條件 <span aria-hidden="true">↗</span></a></section>`;
}
const paragraphs = sections => sections.map(([title, text], i) => `<section class="story-row"><p class="number" aria-hidden="true">0${i+1}</p><div><h2>${escape(title)}</h2><p>${escape(text)}</p></div></section>`).join('');
const workCards = slugs => `<div class="related-grid">${slugs.map(slug => { const w = works.find(item => item.slug === slug); return `<a class="work-card" href="/work/${w.slug}/"><img src="/assets/${w.image}" alt="${escape(w.imageAlt)}" width="1440" height="900" loading="lazy" decoding="async"><p class="eyebrow">${escape(w.kind)}</p><h3>${escape(w.name)} <span aria-hidden="true">↗</span></h3><p>${escape(w.focus)}</p></a>`; }).join('')}</div>`;
const serviceLinks = slugs => `<div class="service-links">${slugs.map(slug => { const s = services.find(item => item.slug === slug); return `<a href="/services/${slug}/"><span>${escape(s.name)}</span><span aria-hidden="true">↗</span></a>`; }).join('')}</div>`;

function document(page, type, body) {
  const url = `${origin}${type==='faq' ? '/faq/' : `/${type}/${page.slug}/`}`;
  const schema = {'@context':'https://schema.org','@graph':[
    organization, website,
    {'@type':'WebPage','@id':`${url}#page`,url,name:page.title,description:page.description,inLanguage:'zh-Hant',isPartOf:{'@id':website['@id']},publisher:{'@id':organization['@id']},breadcrumb:{'@id':`${url}#breadcrumb`},about:{'@id':type==='services'?`${url}#service`:organization['@id']},...(type==='services'?{mainEntity:{'@id':`${url}#service`}}:{})},
    {'@type':'BreadcrumbList','@id':`${url}#breadcrumb`,itemListElement:[{'@type':'ListItem',position:1,name:'Hey Cheng',item:`${origin}/`},{'@type':'ListItem',position:2,name:page.name,item:url}]},
    ...(type==='services' ? [{'@type':'Service','@id':`${url}#service`,name:page.name,serviceType:page.name,description:page.intro,url,provider:{'@id':organization['@id']},mainEntityOfPage:{'@id':`${url}#page`}}] : [])
  ]};
  return `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${escape(page.title)}</title>
  <meta name="description" content="${escape(page.description)}">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="website"><meta property="og:locale" content="zh_TW"><meta property="og:site_name" content="Hey Cheng">
  <meta property="og:title" content="${escape(page.title)}"><meta property="og:description" content="${escape(page.description)}"><meta property="og:url" content="${url}">
  <meta property="og:image" content="${origin}/assets/${page.image}"><meta property="og:image:alt" content="${escape(page.imageAlt)}">
  <meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(page.title)}"><meta name="twitter:description" content="${escape(page.description)}"><meta name="twitter:image" content="${origin}/assets/${page.image}">
  <meta name="theme-color" content="#080d0c"><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/assets/search-pages.css?v=20260929-safearea">
  <script type="application/ld+json">${JSON.stringify(schema).replace(/</g,'\\u003c')}</script>
<script src="/assets/view-mode.js?v=20260928-modes"></script>
<link rel="stylesheet" href="/assets/view-mode.css?v=20260928-modes">
</head>
<body>
  <a class="skip-link" href="#main">跳至內容</a>
  <header class="site-header"><a href="/" class="brand" aria-label="Hey Cheng 首頁"><img src="/assets/hey-cheng-logo.png" alt="Hey Cheng" width="2061" height="763"></a><nav aria-label="主要導覽"><a href="/#grid">作品</a><a href="/#services">服務</a><a href="/#pricing">方案</a><a class="contact-link" href="/#contact">聯絡 <span aria-hidden="true">↗</span></a></nav><div class="page-view-mode" data-view-mode-host></div></header>
  <main id="main"><nav class="breadcrumb" aria-label="麵包屑"><a href="/">首頁</a><span aria-hidden="true">/</span><span aria-current="page">${escape(page.name)}</span></nav>
  <header class="hero"><p class="eyebrow">${escape(page.label)}</p><h1>${escape(page.name)}</h1><p class="hero-lead">${escape(page.lead)}</p><p class="intro">${escape(page.intro)}</p></header>
  ${body}
  <section class="contact section"><p class="eyebrow">LET'S TALK</p><h2>你的下一個網站，<br>從一段對話開始。</h2><a class="button" href="/#contact">和 Hey Cheng 聊聊 <span aria-hidden="true">↗</span></a></section>
  </main>
  <footer class="site-footer"><div><a class="brand" href="/" aria-label="回到 Hey Cheng 首頁"><img src="/assets/hey-cheng-logo.png" alt="Hey Cheng" width="2061" height="763" loading="lazy"></a><p>旋賞數位有限公司 · 新北中和</p><a href="tel:+886222262678">02-2226-2678</a></div><div><p class="eyebrow">服務</p>${services.map(s => `<a href="/services/${s.slug}/">${escape(s.name)}</a>`).join('')}</div><div><p class="eyebrow">完整案例</p>${works.map(w => `<a href="/work/${w.slug}/">${escape(w.name)}</a>`).join('')}</div><div><a href="/#about">關於我們</a><a href="/#pricing">方案與價格</a><a href="/faq/">合作常見問題</a><a href="/#contact">聯絡方式</a><a href="/portal/">文件工作台</a><a href="/privacy/">隱私說明</a><a href="/terms/">使用說明</a></div></footer>
</body>
</html>
`;
}

for (const s of services) {
  const body = `<figure class="hero-image${s.heroImage?' food-image':''}"><img src="/assets/${s.heroImage||s.image}" alt="${escape(s.heroAlt||s.imageAlt)}" width="${s.heroImage?960:1440}" height="${s.heroImage?5169:900}" fetchpriority="high"><figcaption>${escape(s.caption)}</figcaption></figure><div class="story section">${paragraphs(s.sections)}</div><section class="preparation section"><div><p class="eyebrow">BEFORE WE START</p><h2>先準備這些，<br>討論會更具體。</h2></div><ul>${s.checklist.map(item=>`<li>${escape(item)}</li>`).join('')}</ul></section>${pricingBlock(s.planIds)}<section class="section"><div class="section-head"><p class="eyebrow">SELECTED WORK</p><h2>用實際作品，看看不同做法</h2><p>以下為已公開的網站作品；各案內容與交付範圍不同。</p></div>${workCards(s.related)}</section><section class="section faqs"><div class="section-head"><p class="eyebrow">QUESTIONS</p><h2>開始之前，你可能想知道</h2></div>${s.faqs.map(([q,a])=>`<details><summary>${escape(q)}</summary><p>${escape(a)}</p></details>`).join('')}</section>`;
  const path = resolve(root, `services/${s.slug}/index.html`); await mkdir(dirname(path), {recursive:true}); await writeFile(path, document(s,'services',body));
}
for (const w of works) {
  const body = `<dl class="project-facts"><div><dt>網站類型</dt><dd>${escape(w.kind)}</dd></div><div><dt>呈現重點</dt><dd>${escape(w.focus)}</dd></div><div><dt>公開狀態</dt><dd><a href="${w.live}" target="_blank" rel="noopener noreferrer">已上線 · 前往原站 <span aria-hidden="true">↗</span><span class="sr-only">（新分頁）</span></a></dd></div></dl><figure class="hero-image"><img src="/assets/${w.image}" alt="${escape(w.imageAlt)}" width="1440" height="900" fetchpriority="high"><figcaption>${escape(w.name)} · 既有公開作品畫面</figcaption></figure><section class="section context"><p class="eyebrow">THE CONTEXT</p><h2>這個網站，要讓人看懂什麼？</h2><p>${escape(w.context)}</p></section><div class="story section">${paragraphs(w.sections)}</div><section class="section"><div class="section-head"><p class="eyebrow">THE COMPLETE PAGE</p><h2>從頁首到頁尾，看完整作品</h2><p>以下為 ${w.captured||'2026 年 9 月 18 日'}擷取的全頁畫面，可在圖片區上下捲動。原站的內容與動態效果，以實際網站為準。</p></div><figure class="full-capture"><div class="capture-scroll" tabindex="0" role="region" aria-label="${escape(w.name)}完整網站截圖，可上下捲動"><img src="/assets/work-${w.id}-overview.webp" alt="${escape(w.name)}網站從頁首、內容區到頁尾的完整截圖" width="960" height="${w.overviewHeight}" loading="lazy" decoding="async"></div><figcaption>截圖保留擷取當時的圖片、活動與資訊。<a href="/assets/work-${w.id}-full.webp" target="_blank" rel="noopener noreferrer">開啟原尺寸截圖<span class="sr-only">（新分頁）</span> ↗</a></figcaption></figure></section><section class="preparation section"><div><p class="eyebrow">WHAT TO TAKE AWAY</p><h2>規劃相似網站時，<br>可以從這裡開始。</h2></div><ul>${w.takeaways.map(item=>`<li>${escape(item)}</li>`).join('')}</ul></section><section class="section"><div class="section-head"><p class="eyebrow">RELATED SERVICES</p><h2>對應的服務方向</h2><p>先從需要呈現的內容與操作情境出發，再討論適合的規模。</p></div>${serviceLinks(w.services)}</section><section class="section"><div class="section-head"><p class="eyebrow">KEEP EXPLORING</p><h2>再看看不同的生意</h2></div>${workCards(works.filter(item=>item.id!==w.id).map(item=>item.slug))}</section>`;
  const path = resolve(root, `work/${w.slug}/index.html`); await mkdir(dirname(path), {recursive:true}); await writeFile(path, document(w,'work',body));
}
const plan = id => pricing.plans.find(item=>item.id===id);
const faq = {
  name:'合作常見問題', label:'WORKING TOGETHER', title:'網站建置常見問題｜費用、交付、維運與 AI 系統｜Hey Cheng',
  description:`Hey Cheng 旋賞數位網站合作問答：入門網站 NT$${money(plan('entry').price)} ${pricing.constructionTax}、拍攝文案、付款與修改、第二年維運、網域與成果權利、搬遷及 AI 系統費用，一次了解公開合作條件。`,
  lead:'先把合作的細節，說清楚。', intro:'從第一個網站到需要串接營運的系統，先了解費用包含什麼、交付如何約定，以及上線後怎麼維護。以下依公開方案整理；實際範圍與交期，會在正式報價與合約中確認。',
  image:'hey-cheng-logo.png', imageAlt:'Hey Cheng 黑色與 Tiffany 綠品牌標誌'
};
const faqGroups = [
  ['方案與內容', [
    ['建立一個品牌網站要多少錢？',`入門方案為 NT$${money(plan('entry').price)}（${pricing.constructionTax}）。${plan('entry').includes}需要品牌視覺客製、文案、SEO 架構與可自行編輯的後台，可參考標準方案 NT$${money(plan('standard').price)}（${pricing.constructionTax}）。`,'/services/brand-websites/','了解品牌形象網站'],
    ['還沒有照片和文案，可以一起準備嗎？',`入門＋為整套網站建置方案，NT$${money(plan('plus').price)}（${pricing.constructionTax}）。${plan('plus').includes}品牌需提供並確認實際產品、服務與對外資訊；既有素材的使用權限，也會先確認。`,'/services/brand-content/','了解品牌攝影與文案'],
    ['什麼情況需要 AI 或客製系統？',`若需求涉及諮詢流程、會員、文件解析、報表或資料串接，可從實際工作步驟、資料來源與使用權限開始討論。系統方案 NT$${money(plan('system').price)} 起（${pricing.constructionTax}），依規格報價；系統工具依約定授權。`,'/services/ai-custom-systems/','了解 AI 與客製系統'],
    ['AI 會用在哪些地方？相關費用包含嗎？',`Hey Cheng 運用 AI 協助設計、內容整理與開發。若要在客戶系統中加入 AI 助理、文件解析或自動發文，會先確認資料使用方式、人工檢查位置與功能範圍。${pricing.maintenance.excluded}`,'/services/ai-custom-systems/','查看系統需求的準備方式']
  ]],
  ['交付與維運', [
    ['網站上線後，每年要付多少維運費？',`${pricing.maintenance.firstYear}一般網站新案第 ${pricing.maintenance.startsYear} 年起，基本維運 NT$${money(pricing.maintenance.annual)}／年（${pricing.maintenance.tax}）。${pricing.maintenance.service}${pricing.maintenance.excluded}`,'/#pricing','查看完整方案與價格'],
    ['可以修改幾次？年度更新和製作修改相同嗎？',`${pricing.terms.productionRevisions}年度維運另包含每年 ${pricing.maintenance.updatesPerYear} 次內容更新，適用上線後的維運階段；製作修改與年度更新分別計算。超出約定範圍的項目另行報價。`],
    ['網域、網站和交付文件的權利怎麼約定？',`網域登記在客戶名下。${pricing.terms.websiteRights}${pricing.terms.documentCopyright}實際交付項目會在合作前說明，並於合約中約定。`,'/#about','了解 Hey Cheng 的交付原則'],
    ['既有網站需要搬遷，費用怎麼算？',`搬遷協助為 NT$${money(pricing.migration.price)}（${pricing.migration.tax}）。平台部署、DNS、教學及資料搬移的實際範圍於個案報價確認；請先提供現有網址、使用平台，以及需要保留的內容與資料。`]
  ]],
  ['合作與聯絡', [
    ['如何付款？報價和製作時程怎麼安排？',`${pricing.terms.payment}正式報價有效期為 ${pricing.terms.quoteValidityDays} 日。${pricing.terms.schedule}洽談時可先提供希望上線的時間、內容與功能，確認範圍後再安排。`,'/#contact','開始討論需求'],
    ['Hey Cheng 是哪家公司？如何聯絡？','Hey Cheng 是旋賞數位有限公司的品牌，統一編號 62149294，位於新北市中和區景平路593號之1。聯絡窗口為程子顥；電話 02-2226-2678、手機 0983-158-911，LINE ID 為 hao__cheng。來店前請先電話聯絡。','/#contact','查看 Email 與社群聯絡方式']
  ]]
];
const faqBody = faqGroups.map(([heading, questions])=>`<section class="section faqs"><div class="section-head"><h2>${escape(heading)}</h2></div>${questions.map(([q,a,href,label],i)=>`<details${i===0?' open':''}><summary>${escape(q)}</summary><p>${escape(a)}${href?` <a class="text-link" href="${href}">${escape(label)} <span aria-hidden="true">↗</span></a>`:''}</p></details>`).join('')}</section>`).join('');
await mkdir(resolve(root,'faq'),{recursive:true});
await writeFile(resolve(root,'faq/index.html'), document(faq,'faq',faqBody));

// Keep the homepage and generated pages on the same public brand identity.
const homePath = resolve(root,'index.html');
const home = await readFile(homePath,'utf8');
const homeSchema = {'@context':'https://schema.org','@graph':[organization,website,{
  '@type':'WebPage','@id':`${origin}/#page`,url:`${origin}/`,
  name:home.match(/<title>(.*?)<\/title>/)[1],description:home.match(/<meta name="description" content="(.*?)">/)[1],
  inLanguage:'zh-Hant',isPartOf:{'@id':website['@id']},about:{'@id':organization['@id']},publisher:{'@id':organization['@id']}
}]};
await writeFile(homePath,home.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/,`<script type="application/ld+json">\n${JSON.stringify(homeSchema,null,2).replace(/</g,'\\u003c')}\n  </script>`));

const routes = ['/', ...services.map(s=>`/services/${s.slug}/`), ...works.map(w=>`/work/${w.slug}/`), '/faq/'];
await writeFile(resolve(root,'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes.map(route=>`  <url><loc>${origin}${route}</loc></url>`).join('\n')}\n</urlset>\n`);
await writeFile(resolve(root,'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`);
console.log(`Generated ${services.length} service pages, ${works.length} case pages and the FAQ from public pricing data (${pricing.asOf}); synchronized homepage schema.`);
