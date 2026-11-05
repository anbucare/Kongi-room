(function(){
'use strict';
const $=(s,el)=>(el||document).querySelector(s);
const $$=(s,el)=>Array.from((el||document).querySelectorAll(s));
const store={
  get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},
  set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}},
  del(k){try{localStorage.removeItem(k)}catch(e){}}
};
const pad=n=>String(n).padStart(2,'0');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const todayKey=()=>{const d=new Date();return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())};
function josa(name,a,b){const c=name.charCodeAt(name.length-1);if(c>=0xAC00&&c<=0xD7A3)return name+(((c-0xAC00)%28)?a:b);return name+b}
let petName=store.get('petName','콩이')||'콩이';
const Nga=()=>josa(petName,'이','가'),Nneun=()=>josa(petName,'은','는'),Nreul=()=>josa(petName,'을','를'),Nwa=()=>josa(petName,'과','와');
const fill=s=>s.replace(/\{N네\}/g,petName+'네').replace(/\{N가\}/g,Nga()).replace(/\{N는\}/g,Nneun()).replace(/\{N를\}/g,Nreul()).replace(/\{N와\}/g,Nwa()).replace(/\{N\}/g,petName);
const reduced=()=>window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
const SITE_URL='https://anbucare.github.io/Kongi-room/';
const SITE_TAGLINE='고양이와 함께하는 집중 타이머';
const KAKAO_JS_KEY='';
const IN_APP=/KAKAOTALK|Instagram|FBAN|FBAV|NAVER\(inapp|Line\//i.test(navigator.userAgent);
function toast(msg){const t=$('#toast');t.textContent=msg;t.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>{t.hidden=true},2400)}
function tstrOf(mins){const h=Math.floor(mins/60),m=mins%60;return (h?h+'시간 ':'')+(m||!h?m+'분':'')}

/* ---------- cat svg ---------- */
function frontHead(tf){return `<g transform="${tf||''}"><g class="head">
  <polygon class="ear l" points="40,36 46,10 60,30"/><polygon class="ear r" points="66,30 80,10 86,36"/>
  <polygon class="ear-in" points="45,33 48,18 56,29"/><polygon class="ear-in" points="70,29 78,18 81,33"/>
  <circle class="face" cx="63" cy="40" r="21"/>
  <path class="stripe" d="M56 22 l2 8 M63 20 v8 M70 22 l-2 8"/>
  <g class="eyes-wrap"><g class="eyes"><ellipse class="eye" cx="54" cy="42" rx="3.2" ry="4.2"/><ellipse class="eye" cx="72" cy="42" rx="3.2" ry="4.2"/><circle class="glint" cx="55.2" cy="40.5" r="1"/><circle class="glint" cx="73.2" cy="40.5" r="1"/></g></g>
  <g class="eyes-closed"><path d="M50 43 q4 3 8 0 M68 43 q4 3 8 0"/></g>
  <g class="eyes-happy"><path d="M50 43 q4 -4 8 0 M68 43 q4 -4 8 0"/></g>
  <path class="nose" d="M60.5 48 h5 l-2.5 3 z"/>
  <path class="mouth" d="M59.5 51 q3.5 3 7 0"/>
  <ellipse class="yawn-mouth" cx="63" cy="53" rx="3.6" ry="4.2"/>
  <ellipse class="tongue" cx="63" cy="54" rx="2.4" ry="3"/>
  <path class="whisk" d="M38 46 h13 M38 50 l13 -1 M75 45 h13 M75 49 l13 1"/>
</g></g>`}
if($('#catSvg')) $('#catSvg').innerHTML=`<svg viewBox="0 0 120 100" aria-hidden="true">
<g class="p-sit">
  <path class="tail" d="M34 88 C 12 86, 8 62, 24 54"/>
  <path class="body" d="M34 96 C 30 66, 42 46, 62 46 C 84 46, 92 68, 90 96 Z"/>
  <path class="stripe" d="M52 60 q8 6 16 0 M48 72 q10 6 20 0 M47 84 q11 6 22 0"/>
  <ellipse class="paw l" cx="50" cy="95" rx="7" ry="4"/><ellipse class="paw r" cx="74" cy="95" rx="7" ry="4"/>
  ${frontHead('')}
</g>
<g class="p-lie">
  <path class="tail" d="M18 90 C 2 88, 2 66, 16 62"/>
  <path class="body" d="M14 96 C 12 74, 34 60, 64 60 C 92 60, 108 72, 108 96 Z"/>
  <path class="stripe" d="M40 72 q8 6 16 0 M36 84 q10 6 20 0 M58 68 q8 6 16 0"/>
  <ellipse class="paw" cx="30" cy="95" rx="8" ry="4"/><ellipse class="paw" cx="92" cy="95" rx="8" ry="4"/>
  ${frontHead('translate(26,26)')}
</g>
<g class="p-back">
  <path class="tail" d="M80 92 C 100 92, 108 74, 98 60"/>
  <path class="body" d="M30 96 C 26 66, 40 50, 60 50 C 80 50, 94 66, 90 96 Z"/>
  <path class="stripe" d="M48 64 q12 -5 24 0 M46 76 q14 -5 28 0 M46 88 q14 -5 28 0"/>
  <g class="head">
    <polygon class="ear l" points="42,34 46,8 60,28"/><polygon class="ear r" points="62,28 76,8 80,34"/>
    <polygon class="ear-back" points="46,31 48,15 57,28"/><polygon class="ear-back" points="65,28 74,15 76,31"/>
    <circle class="face" cx="61" cy="36" r="20"/>
    <path class="stripe" d="M54 22 l2 8 M61 20 v8 M68 22 l-2 8"/>
  </g>
</g>
<g class="p-walk">
  <path class="tail" d="M22 66 C 6 60, 4 42, 16 34"/>
  <g class="leg b1"><rect x="30" y="72" width="9" height="24" rx="4"/></g>
  <g class="leg f1"><rect x="72" y="72" width="9" height="24" rx="4"/></g>
  <path class="body" d="M22 76 C 20 56, 40 48, 62 48 C 82 48, 96 54, 98 70 C 98 80, 84 82, 60 82 C 40 82, 24 82, 22 76 Z"/>
  <path class="stripe" d="M40 56 q6 8 0 16 M54 54 q6 8 0 16 M68 54 q6 8 0 16"/>
  <g class="leg b2"><rect x="42" y="72" width="9" height="24" rx="4"/></g>
  <g class="leg f2"><rect x="84" y="72" width="9" height="24" rx="4"/></g>
  <g class="head">
    <polygon class="ear l" points="84,32 86,10 98,27"/><polygon class="ear r" points="100,27 112,12 114,34"/>
    <polygon class="ear-in" points="88,29 89,17 96,27"/><polygon class="ear-in" points="103,27 110,18 110,31"/>
    <circle class="face" cx="97" cy="44" r="17"/>
    <path class="stripe" d="M92 28 l1 7 M98 27 v7 M104 28 l-1 7"/>
    <g class="eyes-wrap"><g class="eyes"><ellipse class="eye" cx="103" cy="43" rx="2.6" ry="3.6"/><circle class="glint" cx="104" cy="41.8" r=".8"/></g></g>
    <g class="eyes-closed"><path d="M100 44 q3 2.5 6 0"/></g>
    <path class="nose" d="M111 47 l3.5 1.5 l-3 2.5 z"/>
    <path class="whisk" d="M106 50 l10 -1 M106 53 l10 1"/>
  </g>
</g>
<g class="p-stretch">
  <path class="tail" d="M20 58 C 6 50, 10 30, 24 26"/>
  <path class="body" d="M18 62 C 16 46, 34 42, 50 52 C 64 62, 78 76, 96 82 C 100 88, 98 94, 90 94 L 26 94 C 16 94, 14 74, 18 62 Z"/>
  <path class="stripe" d="M30 56 q8 -4 14 2 M42 62 q8 -3 14 4 M54 70 q8 -2 12 4"/>
  <rect class="paw" x="20" y="80" width="9" height="14" rx="4"/>
  <rect class="paw" x="84" y="86" width="30" height="8" rx="4"/>
  ${frontHead('translate(38,38) scale(.82)')}
</g>
</svg>`;

/* ---------- state ---------- */
const scene=$('#scene'),catEl=$('#cat'),bubble=$('#bubble'),bowl=$('#bowl');
let run=store.get('run',null); // {state:'focus'|'done'|'break', endAt, dur, demo}
let log=store.get('log',null); if(!log||log.date!==todayKey()) log={date:todayKey(),items:[]};
let ui='setup', phase='idle', idleTimer=null, lookTimer=null, audioCtx=null, moveId=0, curX=13, curY=35, isSulking=store.get('sulking',false);


/* ---------- Weather (Rain ASMR) ---------- */
let rainSource=null, rainGain=null;

function toggleRain(enable){
  const on = typeof enable === 'boolean' ? enable : !scene.classList.contains('rainy');
  scene.classList.toggle('rainy', on);
  $('#rainBtn').setAttribute('aria-pressed', String(on));
  $('#rainBtn').textContent = on ? '🌧️ 비 내리는 중' : '🌧️ 빗소리';
  store.set('rain', on);
  ensureAudio();
  if(on){
    setupRainDrops();
    startRainAudio();
    caption(fill('창밖에 잔잔한 비가 내리기 시작했어요. 빗소리가 {N네} 방을 채웁니다.'));
  } else {
    stopRainAudio();
    caption('비가 그치고 창밖이 개었습니다.');
  }
}

function setupRainDrops(){
  const rainEl = $('#rain');
  if(!rainEl || rainEl.children.length) return;
  for(let i=0; i<18; i++){
    const d = document.createElement('div');
    d.className = 'drop';
    d.style.left = (Math.random()*96) + '%';
    d.style.top = (Math.random()*60) + '%';
    d.style.animationDelay = (Math.random()*1.5) + 's';
    d.style.animationDuration = (0.45 + Math.random()*0.3) + 's';
    rainEl.appendChild(d);
  }
  for(let i=0; i<10; i++){
    const b = document.createElement('div');
    b.className = 'bead';
    const sz = 2.5 + Math.random()*3;
    b.style.width = sz + 'px';
    b.style.height = (sz*1.2) + 'px';
    b.style.left = (Math.random()*92) + '%';
    b.style.top = (Math.random()*85) + '%';
    rainEl.appendChild(b);
  }
}

function startRainAudio(){
  if(!audioCtx) return;
  try{
    if(rainSource) stopRainAudio();
    const sr = audioCtx.sampleRate;
    const dur = 4; // 4s seamless soft rain loop
    const bufferSize = sr * dur;
    const buffer = audioCtx.createBuffer(1, bufferSize, sr);
    const data = buffer.getChannelData(0);

    // Warm pink noise generator
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      const pink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.05;
      b6 = white * 0.115926;

      // Soft rain wave breathing (very subtle)
      const swell = 0.92 + 0.08 * Math.sin((i / bufferSize) * Math.PI * 2);

      // Cozy muffled "후둑... 후둑..." raindrops (warm 350-580Hz resonance, not sharp clicks)
      if (Math.random() < 0.00035) {
        const dropLen = Math.floor(sr * 0.035);
        const dropFreq = 340 + Math.random() * 240;
        for (let j = 0; j < dropLen && i + j < bufferSize; j++) {
          const env = Math.exp(-j / (sr * 0.008));
          data[i + j] += Math.sin((2 * Math.PI * dropFreq * j) / sr) * 0.14 * env;
        }
      }

      data[i] += pink * swell;
    }

    rainSource = audioCtx.createBufferSource();
    rainSource.buffer = buffer;
    rainSource.loop = true;

    // Filters: Highpass at 300Hz (no wind rumble), Lowpass at 1650Hz (warm, peaceful muffled room ASMR)
    const hp = audioCtx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 300;

    const lp = audioCtx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1650;

    rainGain = audioCtx.createGain();
    rainGain.gain.setValueAtTime(0.01, audioCtx.currentTime);
    rainGain.gain.exponentialRampToValueAtTime(0.055, audioCtx.currentTime + 1.2);

    rainSource.connect(hp);
    hp.connect(lp);
    lp.connect(rainGain);
    rainGain.connect(audioCtx.destination);
    rainSource.start();
  }catch(e){}
}

function stopRainAudio(){
  if(rainGain && audioCtx){
    try{
      rainGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
      setTimeout(()=>{
        if(rainSource){rainSource.stop();rainSource.disconnect();rainSource=null;}
      }, 450);
    }catch(e){if(rainSource){rainSource.stop();rainSource=null;}}
  }
}

/* ---------- Treasures & Shelf (가변 보상) ---------- */
const TREASURES = [
  { id: 'leaf', name: '가을 단풍잎', icon: '🍂', desc: '창가에서 물어온 바스락거리는 고운 단풍잎' },
  { id: 'yarn', name: '알록달록 털실', icon: '🧶', desc: '굴리며 놀다 선반에 얹어둔 폭신한 털실 뭉치' },
  { id: 'acorn', name: '통통한 도토리', icon: '🌰', desc: '산책길에서 소중하게 주워온 매끄러운 도토리' },
  { id: 'cap', name: '반짝이는 병뚜껑', icon: '🔘', desc: '은색으로 빛나서 콩이가 특별히 아끼는 보물' },
  { id: 'flower', name: '작은 노란 들꽃', icon: '🌼', desc: '햇살 냄새가 은은하게 배어있는 들꽃' },
  { id: 'feather', name: '보드라운 파랑 깃털', icon: '🪶', desc: '창밖을 스쳐 날아가던 새가 남기고 간 깃털' },
  { id: 'bell', name: '딸랑딸랑 황금 방울', icon: '🔔', desc: '평생의 반려가 된 증표로 콩이가 건넨 특별한 금빛 방울' }
];

function getShelfItems(){
  return store.get('shelf', []);
}

function renderShelf(){
  const items = getShelfItems();
  const el = $('#shelfItems');
  if(!el) return;
  el.innerHTML = '';
  items.forEach(it => {
    const span = document.createElement('span');
    span.className = 'shelf-item';
    span.textContent = it.icon;
    span.title = `${it.name}: ${it.desc}`;
    el.appendChild(span);
  });
}

function showShelfModal(){
  const items = getShelfItems();
  const list = $('#shelfDetailList');
  list.innerHTML = '';
  $('#shelfSubtitle').textContent = fill(`{N가} 완주 선물로 물어다 둔 소중한 보물들이에요. (${items.length}/${TREASURES.length})`);
  
  TREASURES.forEach(t => {
    const owned = items.some(i => i.id === t.id);
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.gap = '12px';
    row.style.padding = '8px 12px';
    row.style.background = owned ? 'var(--soft)' : 'var(--panel)';
    row.style.borderRadius = '8px';
    row.style.border = '1px solid var(--line)';
    row.style.opacity = owned ? '1' : '0.45';
    
    row.innerHTML = `
      <div style="font-size:26px;width:34px;text-align:center">${owned ? t.icon : '❓'}</div>
      <div style="flex:1">
        <div style="font-weight:700;font-size:14px">${owned ? t.name : '아직 발견하지 못한 보물'}</div>
        <div style="font-size:12px;color:var(--muted)">${owned ? t.desc : fill('{N와} 집중 타이머를 완주하다 보면 콩이가 물어올지도 몰라요.')}</div>
      </div>
      <div style="font-size:12px;font-weight:700;color:var(--accent)">${owned ? '보관 중' : '미발견'}</div>
    `;
    list.appendChild(row);
  });
  $('#shelfModal').hidden = false;
}

async function checkTreasureReward(){
  const owned = getShelfItems();
  const unowned = TREASURES.filter(t => !owned.some(o => o.id === t.id));
  if(!unowned.length) return;
  const shouldReward = owned.length === 0 || Math.random() < 0.35;
  if(!shouldReward) return;
  const picked = unowned[Math.floor(Math.random() * unowned.length)];
  owned.push(picked);
  store.set('shelf', owned);
  renderShelf();
  await sleep(600);
  say('선물!', 3200);
  hearts(4);
  caption(fill(`{N가} 어디선가 [${picked.icon} ${picked.name}]을(를) 물어와 방 선반에 올려두었어요!`));
}

/* ---------- Polaroid Album (감성 폴라로이드 일기) ---------- */
function getKongiQuote(mins, tod, rain, demo) {
  if (demo) return '체험 세션도 정말 대단하다냥! 집중 준비 완료냥 🐾';
  if (rain) return `창밖 빗소리 들으며 ${mins}분 집중 완료! 마음이 차분해졌다냥 ☕`;
  if (tod === 'night') return `밤늦게까지 ${mins}분 완주! 오늘 정말 고생 많았다냥, 내가 곁에 있을게 zZ`;
  if (tod === 'morning') return `아침부터 상쾌하게 ${mins}분 집중! 오늘 하루 출발이 아주 좋다냥 ☀️`;
  if (tod === 'sunset') return `노을빛 물든 방에서 ${mins}분 완주! 노을보다 더 빛났다냥 🌅`;
  return `오늘 ${mins}분 동안 정말 멋지게 집중했다냥! 곁에서 지켜봐서 행복하다냥 🐾`;
}

function recordAlbum(sessionRun){
  if(!sessionRun)return;
  let album = store.get('album', []);
  const mins = sessionRun.demo ? 0 : Math.round(sessionRun.dur/60);
  const now = new Date();
  const curTod = tod();
  const isRain = scene.classList.contains('rainy');
  const pose = catEl.dataset.pose || 'sit';
  const sprite = SPRITES[pose] || 'assets/cat_sit.png';
  const kongiMsg = getKongiQuote(mins, curTod, isRain, !!sessionRun.demo);

  const item = {
    id: Date.now(),
    dateStr: `${now.getFullYear()}.${now.getMonth()+1}.${now.getDate()}`,
    timeStr: `${now.getHours()}:${now.getMinutes()<10?'0':''}${now.getMinutes()}`,
    min: mins,
    demo: !!sessionRun.demo,
    tod: curTod,
    rain: isRain,
    pose: pose,
    sprite: sprite,
    kongiMsg: kongiMsg,
    memo: '',
    note: sessionRun.demo ? '30초 체험 세션 완주' : `${mins}분 집중 완주 · ${petName}와 함께한 시간`
  };
  album.unshift(item);
  if(album.length > 50) album = album.slice(0, 50);
  store.set('album', album);
}

let currentPolaroidItem = null;
let currentPolaroidIndex = 0;

function renderAlbum(){
  const album = store.get('album', []);
  const grid = $('#albumGrid');
  if(!grid) return;
  grid.innerHTML = '';
  if(!album.length){
    grid.innerHTML = fill('<div style="grid-column:1/-1;text-align:center;padding:40px 10px;color:var(--muted)">아직 완주한 집중 기록이 없어요.<br>타이머를 완주하면 {N와} 보낸 순간이 사진으로 남아요!</div>');
    return;
  }
  album.forEach((item, idx) => {
    const card = document.createElement('div');
    card.className = 'polaroid-card';
    card.style.setProperty('--rot', ((idx % 5) - 2) * 1.8);
    
    const todName = item.rain ? '🌧️ 빗소리' : item.tod==='night' ? '🌙 밤' : item.tod==='sunset' ? '🌅 노을' : item.tod==='morning' ? '☀️ 아침' : '☀️ 낮';

    card.innerHTML = `
      <div class="polaroid-thumb" style="background-image:url('assets/room_${item.tod||'day'}.webp');background-size:cover;background-position:center;position:relative">
        ${item.rain ? '<div style="position:absolute;inset:0;background:rgba(40,60,80,.25)"></div>' : ''}
        <img src="${item.sprite||'assets/cat_sit.png'}" alt="콩이" style="position:absolute;bottom:6%;left:50%;transform:translateX(-50%);width:42%;image-rendering:pixelated;filter:drop-shadow(0 2px 4px rgba(0,0,0,.5))">
        <span style="position:absolute;top:6px;right:6px;font-size:10px;background:rgba(0,0,0,.6);color:#fff;padding:2px 6px;border-radius:10px;backdrop-filter:blur(2px)">${todName}</span>
      </div>
      <div class="polaroid-caption">${item.memo || item.note}</div>
      <div class="polaroid-date">${item.dateStr} ${item.timeStr} · ${item.demo?'체험':item.min+'분'}</div>
    `;
    card.addEventListener('click', () => {
      openPolaroidDetail(idx);
    });
    grid.appendChild(card);
  });
}

function openPolaroidDetail(idx){
  const album = store.get('album', []);
  if(!album.length) return;
  idx = Math.max(0, Math.min(album.length - 1, idx || 0));
  currentPolaroidIndex = idx;
  currentPolaroidItem = album[idx];
  
  $('#polMemoInput').value = currentPolaroidItem.memo || '';
  drawPolaroidCanvas(currentPolaroidItem);
  $('#polaroidDetailModal').hidden = false;
}

function drawPolaroidCanvas(item){
  const c = $('#polaroidCanvas');
  if(!c) return;
  const ctx = c.getContext('2d');
  const W = 1080, H = 1350;
  
  ctx.fillStyle = '#fdfaf5';
  ctx.fillRect(0, 0, W, H);
  
  ctx.strokeStyle = '#e7ded4';
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, W - 6, H - 6);
  
  const px = 70, py = 70, pw = 940, ph = 780;
  ctx.fillStyle = '#2b211a';
  ctx.fillRect(px, py, pw, ph);

  const roomImg = new Image();
  roomImg.src = 'assets/room_' + (item.tod || 'day') + '.webp';
  const catImg = new Image();
  catImg.src = item.sprite || 'assets/cat_sit.png';

  const renderContents = () => {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(px, py, pw, ph, 8);
    ctx.clip();
    
    if (roomImg.complete && roomImg.naturalWidth) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(roomImg, px, py, pw, ph);
    } else {
      ctx.fillStyle = '#3a2e26';
      ctx.fillRect(px, py, pw, ph);
    }

    if (item.rain) {
      ctx.fillStyle = 'rgba(30, 48, 70, 0.28)';
      ctx.fillRect(px, py, pw, ph);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 2.5;
      for (let i = 0; i < 28; i++) {
        const rx = px + ((i * 37) % pw);
        const ry = py + ((i * 29) % ph);
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 6, ry + 22);
        ctx.stroke();
      }
    }

    if (catImg.complete && catImg.naturalWidth) {
      ctx.imageSmoothingEnabled = false;
      const cw = pw * 0.28;
      const ch = cw * (catImg.naturalHeight / catImg.naturalWidth);
      const cx = px + pw * 0.38;
      const cy = py + ph - ch - (ph * 0.08);
      ctx.drawImage(catImg, cx, cy, cw, ch);
    }

    const tagText = item.rain ? '🌧️ 빗소리와 함께' :
      item.tod === 'night' ? '🌙 고요한 밤' :
      item.tod === 'sunset' ? '🌅 따스한 노을' :
      item.tod === 'morning' ? '☀️ 상쾌한 아침' : '☀️ 포근한 오후';
    ctx.fillStyle = 'rgba(24, 18, 14, 0.65)';
    ctx.beginPath();
    ctx.roundRect(px + pw - 210, py + 22, 190, 44, 22);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(tagText, px + pw - 115, py + 52);

    ctx.restore();

    const ff = '"Gowun Dodum","Apple SD Gothic Neo","Noto Sans KR",sans-serif';
    
    ctx.textAlign = 'left';
    ctx.fillStyle = '#8c7b6f';
    ctx.font = '500 28px ' + ff;
    ctx.fillText(`📅 ${item.dateStr} ${item.timeStr}`, px + 10, 915);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#b84224';
    ctx.font = '700 32px ' + ff;
    ctx.fillText(item.demo ? '체험 세션 완료 🐾' : `${item.min}분 집중 완주 🐾`, px + pw - 10, 915);

    ctx.strokeStyle = '#e4d8cb';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px + 10, 940);
    ctx.lineTo(px + pw - 10, 940);
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#3a2c22';
    ctx.font = '600 34px ' + ff;
    const quoteText = `"${item.kongiMsg || '오늘도 함께 집중해서 행복했다냥 🐾'}"`;
    ctx.fillText(quoteText, px + 10, 1005);

    const userMemo = item.memo || '오늘의 집중 기록이 남겨진 소중한 순간';
    ctx.fillStyle = item.memo ? '#1b4a32' : '#887768';
    ctx.font = '700 32px ' + ff;
    ctx.fillText(`✏️ ${userMemo}`, px + 10, 1075);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#a69485';
    ctx.font = '400 24px ' + ff;
    ctx.fillText('🐾 콩이네 방 · Lo-Fi 고양이 집중 타이머 (Kongi-room)', W / 2, 1280);
  };

  let loaded = 0;
  const check = () => { if (++loaded >= 2) renderContents(); };
  if (roomImg.complete && catImg.complete) {
    renderContents();
  } else {
    roomImg.onload = check;
    catImg.onload = check;
    setTimeout(renderContents, 120);
  }
}

/* ---------- Intimacy & Motion Unlocks (친밀도 시스템) ---------- */
const INTIMACY_LEVELS = [
  { level: 1, name: '낯가리는 사이', minXp: 0, maxXp: 30, icon: '🌱', desc: '아직은 조금 서먹하지만, 곁에 있어 주는 것만으로도 고마워해요.', motion: '소파 구석에서 조용히 수면', spot: 'sofa', pose: 'sleep' },
  { level: 2, name: '다정한 룸메이트', minXp: 30, maxXp: 90, icon: '🌿', desc: '당신이 일하고 공부할 때 책상 위로 올라와 턱을 괴고 가만히 지켜봐요.', motion: '책상 위 식빵 굽기 (지켜보기)', spot: 'desk', pose: 'desk' },
  { level: 3, name: '믿음직한 단짝', minXp: 90, maxXp: 180, icon: '🐾', desc: '가장 연약한 배를 보여줄 만큼 당신을 온전히 믿고 골골송을 불러요.', motion: '러그 위 발라당 애교 & 골골송', spot: 'rug', pose: 'belly' },
  { level: 4, name: '평생의 반려', minXp: 180, maxXp: 9999, icon: '👑', desc: '세상에서 당신이 가장 안전하고 따뜻한 안식처예요. 어디든 찰싹 붙어있어요.', motion: '황금 방울 선물 & 무한 애착', spot: 'rug', pose: 'belly' }
];

function getIntimacy() {
  const data = store.get('intimacy', null);
  if (!data || typeof data.xp !== 'number') {
    return { xp: 0, level: 1 };
  }
  return data;
}

function getLevelInfo(xp) {
  for (let i = INTIMACY_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= INTIMACY_LEVELS[i].minXp) {
      return { ...INTIMACY_LEVELS[i] };
    }
  }
  return INTIMACY_LEVELS[0];
}

function updateIntimacyBadge() {
  const cur = getIntimacy();
  const info = getLevelInfo(cur.xp);
  const btn = $('#intimacyBtn');
  if (btn) {
    const nextText = info.level < 4 ? ` (${cur.xp}/${info.maxXp} XP)` : ' (MAX)';
    btn.innerHTML = `${info.icon} <b>Lv.${info.level} ${info.name}</b>${nextText}`;
  }
}

function showXpFloating(amount) {
  try {
    const el = document.createElement('div');
    el.className = 'xp-float';
    el.textContent = `+${amount} XP ❤️`;
    const rect = catEl.getBoundingClientRect();
    const sceneRect = scene.getBoundingClientRect();
    el.style.left = (rect.left - sceneRect.left + rect.width / 2 - 25) + 'px';
    el.style.top = (rect.top - sceneRect.top - 10) + 'px';
    scene.appendChild(el);
    setTimeout(() => el.remove(), 1450);
  } catch(e) {}
}

function addIntimacy(amount) {
  const current = getIntimacy();
  const oldLevel = getLevelInfo(current.xp).level;
  current.xp += amount;
  const newInfo = getLevelInfo(current.xp);
  current.level = newInfo.level;
  store.set('intimacy', current);
  updateIntimacyBadge();
  showXpFloating(amount);

  if (newInfo.level > oldLevel) {
    showLevelUpModal(newInfo);
    if (newInfo.level === 4) {
      unlockGoldenBell();
    }
  }
}

function unlockGoldenBell() {
  const owned = getShelfItems();
  if (!owned.some(o => o.id === 'bell')) {
    const bell = TREASURES.find(t => t.id === 'bell');
    if (bell) {
      owned.push(bell);
      store.set('shelf', owned);
      renderShelf();
    }
  }
}

function showLevelUpModal(info) {
  $('#lvlTitle').textContent = `콩이와의 친밀도 상승!`;
  $('#lvlSubtitle').textContent = `Lv.${info.level} 「${info.name}」 등급이 되었습니다!`;
  $('#lvlMotionDesc').textContent = `✨ 새로 해금된 행동: [${info.motion}]`;
  $('#levelUpModal').hidden = false;
  hearts(6);
}

function renderIntimacyModal() {
  const cur = getIntimacy();
  const info = getLevelInfo(cur.xp);
  $('#intimacyCurrentTitle').textContent = `${info.icon} Lv.${info.level} ${info.name}`;
  $('#intimacyCurrentDesc').textContent = info.desc;

  const pct = info.level >= 4 ? 100 : Math.min(100, Math.round(((cur.xp - info.minXp) / (info.maxXp - info.minXp)) * 100));
  $('#intimacyProgressBar').style.width = pct + '%';
  $('#intimacyXpText').textContent = info.level >= 4 ? `${cur.xp} XP (최고 등급 달성!)` : `${cur.xp} / ${info.maxXp} XP (${pct}%)`;

  const totalMin = log.items.reduce((s, it) => s + (it.min || 0), 0);
  const doneCount = log.items.filter(it => it.type === 'done').length;
  $('#intimacyStats').textContent = `누적 집중 ${totalMin}분 · 완주 ${doneCount}회`;

  const list = $('#intimacyLevelList');
  list.innerHTML = '';
  INTIMACY_LEVELS.forEach(lvl => {
    const isUnlocked = cur.xp >= lvl.minXp;
    const card = document.createElement('div');
    card.className = `level-card ${isUnlocked ? 'unlocked' : 'locked'}`;
    card.innerHTML = `
      <div class="level-icon">${lvl.icon}</div>
      <div class="level-info">
        <div class="level-name">
          <span>Lv.${lvl.level} ${lvl.name}</span>
          ${isUnlocked ? '<span style="font-size:11px;color:#2e7d32;font-weight:700">해금됨 ✓</span>' : `<span style="font-size:11px;color:var(--muted)">🔒 ${lvl.minXp} XP 필요</span>`}
        </div>
        <div class="level-desc">${lvl.desc}</div>
        <div class="level-motion">🐾 해금 행동: ${lvl.motion}</div>
      </div>
      ${isUnlocked ? `<button class="btn secondary" style="padding:5px 9px;font-size:11.5px" type="button" data-pose-action="${lvl.pose}" data-spot-action="${lvl.spot}">이 행동 보기</button>` : ''}
    `;
    list.appendChild(card);
  });

  $$('[data-pose-action]').forEach(b => {
    b.addEventListener('click', (e) => {
      const p = e.target.dataset.poseAction;
      const s = e.target.dataset.spotAction;
      $('#intimacyModal').hidden = true;
      executeCatAction(s, p);
    });
  });
}

function executeCatAction(spot, pose) {
  if (pose === 'desk') {
    moveCat('desk', 'desk', -1).then(() => {
      say('골골… 🐾', 2000);
      hearts(3);
      caption(fill('{N가} 책상 위로 올라와 턱을 괴고 다정하게 바라봅니다.'));
    });
  } else if (pose === 'belly') {
    moveCat('rug', 'belly', 1).then(() => {
      say('골골골… 🐾', 2200);
      hearts(4);
      caption(fill('{N가} 러그 위에 발라당 누워 애교를 부려요!'));
    });
  } else {
    moveCat('sofa', 'sleep', 1).then(() => {
      say('zZ…', 1800);
      caption(fill('{N가} 소파에서 조용히 잠을 잡니다.'));
    });
  }
}

/* ---------- cat movement ---------- */
const FLOOR=6;
const SPOTS={
  sofa:{x:24.5,y:23},
  win:{x:34,y:45},
  rug:{x:44,y:7.5},
  mid:{x:42,y:7.5},
  bowl:{x:31,y:7.5},
  eat:{x:40.5,y:6.5},
  door:{x:80,y:7.5},
  desk:{x:76,y:37},
  belly:{x:44,y:7.5}
};
const SPRITES={
  sleep:'assets/cat_sleep.png',
  lie:'assets/cat_sleep.png',
  sit:'assets/cat_sit.png',
  wait:'assets/cat_sit.png',
  back:'assets/cat_back.png',
  stretch:'assets/cat_stretch.png',
  eat:'assets/cat_eat.png',
  lick:'assets/cat_sit.png',
  groom:'assets/cat_sit.png',
  walk:'assets/cat_sit.png',
  desk:'assets/cat_desk.png',
  belly:'assets/cat_belly.png'
};
function setPose(p){
  catEl.dataset.pose=p;
  const img=$('#catImg');
  if(img && SPRITES[p] && img.getAttribute('src')!==SPRITES[p]){
    img.style.opacity='0';
    setTimeout(()=>{
      img.src=SPRITES[p];
      img.style.opacity='1';
    },160);
  }
  if(p==='sleep'||p==='back'){ catEl.style.width='18%'; }
  else if(p==='stretch'){ catEl.style.width='19%'; }
  else if(p==='eat'){ catEl.style.width='17%'; }
  else if(p==='desk'){ catEl.style.width='18%'; }
  else if(p==='belly'){ catEl.style.width='17%'; }
  else{ catEl.style.width='16%'; }

  const b=$('#bowl');
  if(b){ b.style.display=(p==='eat')?'none':'block'; }
}
function setFace(f){catEl.classList.toggle('flip',f===-1)}
function setXY(x,y,tr){catEl.style.transition=tr||'none';catEl.style.left=x+'%';catEl.style.bottom=y+'%';curX=x;curY=y;
  bubble.style.left=(x+9)+'%';bubble.style.bottom=(y+19)+'%'}
async function moveCat(spot, pose, face, opts){
  opts = opts || {};
  const id = ++moveId;
  const target = SPOTS[spot] || SPOTS.rug;
  catEl.dataset.spot = spot;

  if (opts.instant || reduced()) {
    setXY(target.x, target.y);
    setFace(face !== undefined ? face : 1);
    setPose(pose);
    return;
  }

  const curIsSofa = curY > 15 && curX < 55;
  const targetIsSofa = target.y > 15 && target.x < 55;
  const curIsDesk = curY > 15 && curX >= 55;
  const targetIsDesk = target.y > 15 && target.x >= 55;

  // Same elevated surface (e.g. sofa -> sofa or desk -> desk)
  if ((curIsSofa && targetIsSofa) || (curIsDesk && targetIsDesk)) {
    setFace(face !== undefined ? face : (targetIsDesk ? -1 : 1));
    setXY(target.x, target.y, 'left 280ms ease-in-out, bottom 280ms ease-in-out');
    await sleep(300);
    if (moveId !== id) return;
    setPose(pose);
    return;
  }

  // 1. If currently elevated (sofa or desk), hop down to floor first
  if (curY > 15) {
    const isDesk = curX >= 55;
    const dropFloorX = isDesk ? 74 : 26;
    setFace(isDesk ? -1 : 1);
    setPose('stretch');
    setXY(dropFloorX, 7.5, 'left 320ms ease-out, bottom 320ms cubic-bezier(.35,0,.7,1)');
    await sleep(340);
    if (moveId !== id) return;
  }

  // 2. Now cat is on the floor (curY <= 15).
  // Determine floor base coordinate for target:
  const isTargetElevated = target.y > 15;
  const targetFloorX = isTargetElevated ? (target.x >= 55 ? 74 : 26) : target.x;
  const targetFloorY = isTargetElevated ? 7.5 : target.y;

  // Walk horizontally on floor if needed
  const walkDist = Math.abs(targetFloorX - curX);
  if (walkDist > 1.8) {
    const walkDir = targetFloorX < curX ? -1 : 1;
    setFace(walkDir);
    setPose('sit');
    const dur = Math.max(260, Math.min(750, walkDist * 22));
    setXY(targetFloorX, targetFloorY, `left ${dur}ms ease-in-out, bottom ${dur}ms ease-in-out`);
    await sleep(dur + 20);
    if (moveId !== id) return;
  }

  // 3. If target is elevated (sofa or desk), leap up from floor base to target!
  if (isTargetElevated) {
    const isTargetDesk = target.x >= 55;
    setFace(isTargetDesk ? 1 : -1);
    setPose('stretch');
    setXY(target.x, target.y, 'left 440ms cubic-bezier(.2,.8,.4,1), bottom 440ms cubic-bezier(.2,.8,.4,1)');
    await sleep(460);
    if (moveId !== id) return;
  }

  // Final pose and orientation
  setFace(face !== undefined ? face : (target.x >= 55 ? -1 : 1));
  setPose(pose);
}
function say(t,ms){bubble.textContent=t;bubble.hidden=false;clearTimeout(say.t);if(ms)say.t=setTimeout(()=>{bubble.hidden=true},ms)}
function hush(){bubble.hidden=true}
function catRect(){const r=catEl.getBoundingClientRect(),sr=scene.getBoundingClientRect();return{l:(r.left-sr.left)/sr.width*100,t:(r.top-sr.top)/sr.height*100,w:r.width/sr.width*100,h:r.height/sr.height*100}}
function hearts(n){const c=catRect();
  for(let i=0;i<n;i++){const h=document.createElement('span');h.className='heart';h.textContent='♥';
    h.style.left=(c.l+c.w*(.3+Math.random()*.4))+'%';h.style.top=c.t+'%';h.style.setProperty('--dx',(Math.random()*6-3)+'cqw');
    h.style.animationDelay=(i*120)+'ms';scene.appendChild(h);setTimeout(()=>h.remove(),1700)}}
function crumbs(){for(let i=0;i<3;i++){const s=document.createElement('span');s.className='crumb';
  s.style.left=(77+Math.random()*7)+'%';s.style.bottom='9%';s.style.setProperty('--dx',(Math.random()*4-2)+'cqw');scene.appendChild(s);setTimeout(()=>s.remove(),800)}}
function caption(t){$('#caption').textContent=fill(t)}

/* small fidgets so the cat never looks frozen */
function fidget(){
  const p=catEl.dataset.pose;if(reduced()||catEl.classList.contains('walking')||catEl.classList.contains('jump'))return;
  const o=[];
  if(['sit','wait','lie','groom','sleep','back'].includes(p))o.push('twitch','flick');
  if(['sit','wait','lie','back'].includes(p))o.push('look-l','look-r','look-l','look-r');
  if(['sit','lie'].includes(p))o.push('yawn');
  if(!o.length)return;const c=o[Math.floor(Math.random()*o.length)];
  catEl.classList.remove('look-l','look-r');catEl.classList.add(c);
  setTimeout(()=>catEl.classList.remove(c),c==='yawn'?1500:c.startsWith('look')?1900:650);
}
(function fidgetLoop(){setTimeout(()=>{fidget();fidgetLoop()},2200+Math.random()*3200)})();

const IDLE=[
  {spot:'sofa',pose:'sleep',face:1,w:5,minLv:1,msg:'{N는} 소파에서 자고 있어요'},
  {spot:'sofa',pose:'lie',face:1,w:2,minLv:1,msg:'{N가} 소파에서 뒹굴고 있어요'},
  {spot:'win',pose:'back',face:1,w:3,minLv:1,msg:'{N가} 소파 등받이에 올라가 창밖을 보고 있어요'},
  {spot:'rug',pose:'groom',face:-1,w:2,minLv:1,msg:'{N가} 러그 위에서 그루밍 중이에요'},
  {spot:'rug',pose:'stretch',face:-1,w:1,minLv:1,msg:'{N가} 기지개를 쭉 켜요',then:'sit'},
  {spot:'mid',pose:'sit',face:1,w:1,minLv:1,msg:'{N가} 방 한가운데 앉아서 이쪽을 보고 있어요'},
  {spot:'desk',pose:'desk',face:-1,w:4,minLv:2,msg:'{N가} 책상 위로 올라와 턱을 괴고 당신을 지켜봐요'},
  {spot:'rug',pose:'belly',face:1,w:3,minLv:3,msg:'{N가} 러그 위에 발라당 누워 애교를 부리고 있어요'}
];
function scheduleIdle(){clearTimeout(idleTimer);if(!(run&&run.state==='focus'&&phase==='idle'))return;
  const d=run.demo?4500+Math.random()*3000:15000+Math.random()*25000;
  idleTimer=setTimeout(()=>{pickIdle();scheduleIdle()},d)}
function pickIdle(){
  const curLv = getLevelInfo(getIntimacy().xp).level;
  const available = IDLE.filter(i => (i.minLv || 1) <= curLv);
  const tot = available.reduce((a,b)=>a+b.w, 0);
  let r = Math.random()*tot, c = available[0];
  for(const i of available){r-=i.w;if(r<=0){c=i;break}}
  if(c.spot===catEl.dataset.spot&&c.pose===catEl.dataset.pose)return;
  const id=moveId+1;
  moveCat(c.spot,c.pose,c.face).then(()=>{if(c.then&&moveId===id)setTimeout(()=>{if(moveId===id&&catEl.dataset.pose===c.pose)setPose(c.then)},2500)});
  setStatus(c.msg);
}
function setStatus(t){$('#focusStatus').textContent=fill(t);caption(t)}

/* ---------- audio / wake lock ---------- */
function ensureAudio(){try{if(!audioCtx)audioCtx=new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume()}catch(e){}}
function chime(){try{if(!audioCtx)return;const t=audioCtx.currentTime;[[659,0],[880,.22],[1046,.44]].forEach(([f,d])=>{
  const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='sine';o.frequency.value=f;
  g.gain.setValueAtTime(0,t+d);g.gain.linearRampToValueAtTime(.18,t+d+.03);g.gain.exponentialRampToValueAtTime(.001,t+d+.7);
  o.connect(g).connect(audioCtx.destination);o.start(t+d);o.stop(t+d+.75)})}catch(e){}}
function crunch(){try{if(!audioCtx)return;const n=audioCtx.sampleRate*.06,b=audioCtx.createBuffer(1,n,audioCtx.sampleRate),d=b.getChannelData(0);
  for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*(1-i/n);
  const s=audioCtx.createBufferSource(),f=audioCtx.createBiquadFilter(),g=audioCtx.createGain();s.buffer=b;f.type='bandpass';f.frequency.value=1800+Math.random()*800;g.gain.value=.12;
  s.connect(f).connect(g).connect(audioCtx.destination);s.start()}catch(e){}}
let lock=null;function wake(){try{if(navigator.wakeLock&&!lock)navigator.wakeLock.request('screen').then(l=>{lock=l;l.addEventListener('release',()=>{lock=null})}).catch(()=>{})}catch(e){}}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&run)wake()});

/* ---------- UI ---------- */
function show(id){ui=id;['setup','focus','done','after','break'].forEach(k=>{$('#ui-'+k).hidden=k!==id})}
const fmt=s=>{s=Math.ceil(s/1000);const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return (h?h+':':'')+(h?pad(m):m<10?'0'+m:m)+':'+pad(x)};
function tick(){
  if(!run){if($('#resultModal').hidden)document.title=petName+'네 방 · '+SITE_TAGLINE;return}
  const rem=Math.max(0,run.endAt-Date.now());
  if(run.state==='focus'){
    $('#clock').textContent=fmt(rem);$('#barFill').style.width=(100-rem/(run.dur*1000)*100)+'%';
    document.title=fmt(rem)+' · '+petName+'네 방';
    const waitAt=run.demo?12000:120000;
    if(phase==='idle'&&rem<=waitAt&&rem>0)enterWait();
    if(rem===0)complete(true);
  }else if(run.state==='break'){
    $('#breakClock').textContent=fmt(rem);document.title='쉬는 중 '+fmt(rem)+' · '+petName+'네 방';
    if(rem===0)endBreak();
  }else{document.title='간식 시간! · '+petName+'네 방'}
}
setInterval(tick,250);

function start(sec,demo){
  run={state:'focus',endAt:Date.now()+sec*1000,dur:sec,demo:!!demo};store.set('run',run);phase='idle';
  ensureAudio();wake();hush();bowl.dataset.level=0;
  catEl.classList.remove('petable');
  const wasSulking = isSulking || store.get('sulking', false) || (log.items.length && log.items[log.items.length-1].type==='stop');
  isSulking=false;store.del('sulking');

  if(wasSulking){
    moveCat('sofa','stretch',1);
    say('야옹!', 2400);
    hearts(3);
    caption(fill('{N가} "다시 왔구나!" 하고 시원하게 기지개를 켜며 반겨줘요.'));
    setStatus(demo?'{N가} 반갑게 기지개를 켜고 자러 가요 (30초 체험)':'{N가} 기지개를 켜고 편안하게 소파에 누웠어요');
    setTimeout(()=>{
      if(run&&run.state==='focus'){
        setPose('sleep');
        setStatus(demo?'{N는} 소파에서 자고 있어요 (30초 체험)':'{N는} 소파에서 자고 있어요');
      }
    }, 2400);
  } else {
    moveCat('sofa','sleep',1);
    setStatus(demo?'{N는} 소파에서 자고 있어요 (30초 체험)':'{N는} 소파에서 자고 있어요');
  }
  show('focus');tick();scheduleIdle();
}
function enterWait(){phase='wait';clearTimeout(idleTimer);
  moveCat('bowl','wait',1).then(()=>{if(phase==='wait'||phase==='done')say('…')});
  setStatus(run.demo?'{N가} 밥그릇 앞에 앉아서 기다리고 있어요':'{N가} 밥그릇 앞에 앉아서 기다리고 있어요. 2분 남았어요')}
function complete(withSound){
  clearTimeout(idleTimer);run.state='done';store.set('run',run);phase='done';
  if(withSound)chime();
  moveCat('bowl','wait',1).then(()=>{if(phase==='done')say('!')});
  $('#doneMsg').textContent=fill('{N가} 끝까지 기다렸어요. 간식을 주세요.');caption('{N가} 밥그릇 앞에서 올려다보고 있어요');
  show('done');
}
async function giveTreat(){
  const btn=$('#treatBtn');btn.disabled=true;hush();phase='eating';
  const t=$('#treat');if(t){t.classList.remove('drop');void t.offsetWidth;t.classList.add('drop');}
  try{
    await sleep(350);
    if(bowl)bowl.dataset.level=3;
    await moveCat('eat','eat',1);
    caption('냠냠, 오독오독…');
    for(let lv=3;lv>0;lv--){
      for(let k=0;k<3;k++){await sleep(320);crunch();if(k===1)crumbs();}
      if(bowl)bowl.dataset.level=lv-1;
    }
    await sleep(200);
    setPose('lick');caption('{N가} 입맛을 다셔요');hearts(3);
    const wasDemo = !!(run && run.demo);
    const sessionMin = wasDemo ? 0 : Math.round((run?run.dur:30)/60);
    log.items.push({type:'done',min:sessionMin,demo:wasDemo});
    store.set('log',log);renderLog();
    if(run)recordAlbum(run);
    
    // Intimacy XP
    const gainedXp = wasDemo ? 15 : Math.max(25, 25 + sessionMin);
    addIntimacy(gainedXp);

    checkTreasureReward();
    run=null;store.del('run');phase='idle';
    $('#afterMsg').textContent=fill(wasDemo?'체험 세션이라 시간은 쌓이지 않지만, 책은 한 권 올라갔어요. {N가} 기분이 좋아 보여요.':'책이 한 권 쌓였어요. {N가} 기분이 좋아 보여요.');
    show('after');
    await sleep(1500);
    setPose('groom');caption('{N가} 앞발로 세수를 해요');hearts(4);
    await sleep(2000);
    
    const curLv = getLevelInfo(getIntimacy().xp).level;
    if(curLv >= 3 && Math.random() < 0.45){
      await moveCat('rug','belly',1);
      caption(fill('{N가} 배부른 얼굴로 러그에 발라당 누워 애교를 부려요'));
    } else if(curLv >= 2 && Math.random() < 0.45){
      await moveCat('desk','desk',-1);
      caption(fill('{N가} 책상 위로 올라와 턱을 괴고 곁을 지켜줘요'));
    } else {
      await moveCat('sofa','sleep',1);
      caption(fill('{N가} 배부른 얼굴로 소파에서 자요'));
    }
  }catch(e){
    console.error('giveTreat error:', e);
    show('after');
  }finally{
    btn.disabled=false;
  }
}
function startBreak(sec){
  run={state:'break',endAt:Date.now()+sec*1000,dur:sec,demo:false};store.set('run',run);
  moveCat('rug','sit',-1);catEl.classList.add('petable');
  $('#breakStatus').textContent=fill('{N를} 눌러서 쓰다듬어 보세요.');caption('쉬는 시간. {N를} 눌러서 쓰다듬어 보세요');
  show('break');tick();
}
function endBreak(){
  chime();run=null;store.del('run');catEl.classList.remove('petable');hush();
  moveCat('sofa','lie',1);caption('{N가} 자기 자리로 돌아갔어요. 다음 세션을 시작해 볼까요?');
  $('#setupMsg').textContent=fill('쉬는 시간이 끝났어요. {N가} 자기 자리로 돌아갔어요.');
  show('setup');
}
function doStop(){
  const elapsed=run?Math.round((run.dur*1000-(run.endAt-Date.now()))/60000):0;
  clearTimeout(idleTimer);run=null;store.del('run');phase='idle';hush();$('#stopModal').hidden=true;
  log.items.push({type:'stop',min:elapsed});store.set('log',log);renderLog();
  isSulking=true;store.set('sulking',true);
  caption(fill('{N가} 소파 구석으로 걸어가요…'));
  const id=moveId+1;
  moveCat('sofa','back',1).then(()=>{
    if(moveId!==id)return;
    clearTimeout(lookTimer);
    say('힝…', 2800);
    catEl.classList.add('petable');
    caption(fill('{N가} "벌써 끝난 거야…?" 하고 소파 구석에서 삐진 척 등을 돌렸어요. 다음 타이머를 켜면 반겨줄 거예요.'));
  });
  $('#setupMsg').textContent=fill('{N가} 조금 서운해하고 있어요. 다음 타이머를 켜면 기지개를 켜며 반겨줄 거예요!');
  show('setup');
}

/* ---------- log ---------- */
const BOOK=['#b2574f','#4f6d8a','#7a8a4f','#c9933e','#6a5a8a','#8a5a3c'];
function renderLog(){
  const done=log.items.filter(i=>i.type==='done'),stops=log.items.filter(i=>i.type==='stop');
  const mins=done.reduce((a,b)=>a+b.min,0);
  const books=$('#books');
  if(books){
    books.innerHTML='';
    done.slice(0,9).forEach((b,i)=>{const d=document.createElement('div');d.className='book';d.style.background=BOOK[i%BOOK.length];
      d.style.width=(72+((i*37)%28))+'%';d.style.marginLeft=((i*13)%14)+'%';books.appendChild(d);});
    if(done.length>9){const m=document.createElement('span');m.className='more';m.textContent='+'+(done.length-9);books.appendChild(m);}
  }
  const h=Math.floor(mins/60),m=mins%60;const tstr=(h?h+'시간 ':'')+(m||!h?m+'분':'');
  const ts=$('#todaySum');if(ts)ts.textContent=done.length?`오늘 ${done.length}세션 · ${tstr}`:'';
  const ls=$('#logSum');if(ls)ls.textContent=done.length||stops.length?`오늘 ${done.length}세션 · ${tstr}`+(stops.length?` · 빈 밥그릇 ${stops.length}`:''):'';
  const it=$('#logItems');
  if(it){
    it.innerHTML='';
    log.items.forEach((x,i)=>{
      const d=document.createElement('span');
      if(x.type==='done'){
        d.className='lg-book';
        d.style.background=BOOK[i%BOOK.length];
        d.title=x.demo?'30초 체험 세션':x.min+'분 집중 완주';
      }else{
        d.className='lg-stop';
        d.title='중간에 멈춤 ('+x.min+'분)';
      }
      it.appendChild(d);
    });
  }
  const le=$('#logEmpty');if(le)le.hidden=log.items.length>0;
}

/* ---------- time of day ---------- */
function tod(){const o=store.get('tod','auto');if(o!=='auto')return o;const h=new Date().getHours();
  return h>=6&&h<10?'morning':h<17?'day':h<20?'sunset':'night'}
function applyTod(){scene.classList.remove('t-morning','t-day','t-sunset','t-night');scene.classList.add('t-'+tod())}
setInterval(applyTod,60000);

/* ---------- share card ---------- */
function shareStats(){
  const done=log.items.filter(i=>i.type==='done'&&!i.demo);
  const mins=done.reduce((a,b)=>a+b.min,0);
  return {sessions:done.length,mins,last:done.length?done[done.length-1].min:0,stops:log.items.filter(i=>i.type==='stop').length};
}
function cardData(){
  const st=shareStats();
  return Object.assign({canvas:$('#card'),tod:tod(),rain:scene.classList.contains('rainy'),shelf:getShelfItems(),name:petName,date:new Date()},st);
}
function drawCard(data){
  data=data||cardData();
  const c=data.canvas,x=c.getContext('2d'),W=1080,H=1920,t=data.tod;
  const P={morning:['#f6e3c6','#e9cfae','#bfe0f4','#fbe7c2','#f2e0c8'],day:['#efdcc3','#dcc3a6','#9fd0ef','#e3f1f8','#ead6bf'],
    sunset:['#eac4a3','#cfa07c','#f3a46b','#7d4f7f','#e6c3a2'],night:['#2f2633','#1f1a24','#141a38','#2b365f','#4a3b47']}[t]||['#efdcc3','#dcc3a6','#9fd0ef','#e3f1f8','#ead6bf'];
  const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,P[0]);g.addColorStop(1,P[1]);x.fillStyle=g;x.fillRect(0,0,W,H);
  const dark=t==='night';const ink=dark?'#efe5d6':'#372c25',mut=dark?'#b9aa9d':'#857566';
  const ff='"Gowun Dodum","Apple SD Gothic Neo","Noto Sans KR",sans-serif';
  const rx=90,ry=420,rw=W-180,rh=900;
  x.save();x.beginPath();x.roundRect(rx,ry,rw,rh,40);x.clip();
  x.fillStyle=P[4];x.fillRect(rx,ry,rw,rh*.72);
  x.fillStyle=dark?'#5a3f33':'#b98a5c';x.fillRect(rx,ry+rh*.72,rw,rh*.28);
  x.fillStyle='rgba(0,0,0,.14)';x.fillRect(rx,ry+rh*.72-10,rw,12);
  const isRain=!!data.rain;
  const wx=rx+rw*.07,wy=ry+rh*.08,ww=rw*.25,wh=rh*.34;
  const sg=x.createLinearGradient(0,wy,0,wy+wh);
  if(isRain){ sg.addColorStop(0,'#728394');sg.addColorStop(1,'#9db0bf'); }
  else { sg.addColorStop(0,P[2]);sg.addColorStop(1,P[3]); }
  x.fillStyle='#efe4d2';x.fillRect(wx-10,wy-10,ww+20,wh+20);x.fillStyle=sg;x.fillRect(wx,wy,ww,wh);
  if(!isRain){
    x.fillStyle=dark?'#f4f0d8':'#ffe9a8';x.beginPath();x.arc(wx+ww*.72,wy+wh*.3,ww*.1,0,7);x.fill();
  } else {
    x.save();x.strokeStyle='rgba(255,255,255,0.7)';x.lineWidth=3;x.lineCap='round';
    for(let i=0;i<10;i++){
      const rx1=wx+12+(i*22)%(ww-24), ry1=wy+10+(i*17)%(wh-25);
      x.beginPath();x.moveTo(rx1,ry1);x.lineTo(rx1-4,ry1+15);x.stroke();
    }
    x.restore();
  }
  x.fillStyle='#efe4d2';x.fillRect(wx+ww/2-5,wy,10,wh);x.fillRect(wx,wy+wh/2-5,ww,10);
  const shX=rx+rw*.39, shY=ry+rh*.18, shW=rw*.16;
  x.fillStyle='#7b5234';x.beginPath();x.roundRect(shX,shY,shW,9,3);x.fill();
  const shItems=data.shelf||[];
  if(shItems.length){
    x.font='22px sans-serif';x.textAlign='center';
    shItems.slice(0,3).forEach((it, idx)=>{ x.fillText(it.icon, shX + 16 + idx * 24, shY - 4); });
  }
  const sx=rx+rw*.04,sy=ry+rh*.46,sw=rw*.36,sh=rh*.24;
  x.fillStyle='#6f8f7a';x.beginPath();x.roundRect(sx+sw*.05,sy,sw*.9,sh*.58,24);x.fill();
  x.fillStyle='#7fa08a';x.beginPath();x.roundRect(sx,sy+sh*.46,sw,sh*.44,18);x.fill();
  x.fillStyle='#6a8a75';x.beginPath();x.roundRect(sx,sy+sh*.26,sw*.12,sh*.64,20);x.roundRect(sx+sw*.88,sy+sh*.26,sw*.12,sh*.64,20);x.fill();
  x.fillStyle='#b35d63';x.beginPath();x.ellipse(rx+rw*.51,ry+rh*.9,rw*.17,rh*.06,0,0,7);x.fill();
  x.strokeStyle='#d9a66f';x.lineWidth=8;x.beginPath();x.ellipse(rx+rw*.51,ry+rh*.9,rw*.125,rh*.044,0,0,7);x.stroke();
  const dx=rx+rw*.6,dy=ry+rh*.6,dw=rw*.24;
  x.fillStyle='#7b5234';x.beginPath();x.roundRect(dx,dy,dw,22,6);x.fill();
  x.fillStyle='#67432d';x.fillRect(dx+dw*.05,dy+22,16,rh*.12);x.fillRect(dx+dw*.88,dy+22,16,rh*.12);
  const sessions=Math.max(0,data.sessions|0);
  for(let i=0;i<Math.min(sessions,9);i++){x.fillStyle=BOOK[i%BOOK.length];const bw=dw*.36*(.72+((i*37)%28)/100);x.beginPath();x.roundRect(dx+dw*.05+((i*13)%14)/100*dw*.36,dy-18-i*18,bw,16,3);x.fill()}
  x.fillStyle='#5b4a3a';x.fillRect(dx+dw*.78,dy-120,8,120);x.fillStyle='#e8c47a';x.beginPath();x.moveTo(dx+dw*.68,dy-120);x.lineTo(dx+dw*.98,dy-120);x.lineTo(dx+dw*1.02,dy-70);x.lineTo(dx+dw*.64,dy-70);x.closePath();x.fill();
  if(dark){const lg=x.createRadialGradient(dx+dw*.82,dy-100,10,dx+dw*.82,dy-100,260);lg.addColorStop(0,'rgba(255,214,120,.5)');lg.addColorStop(1,'rgba(255,214,120,0)');x.fillStyle=lg;x.fillRect(dx-300,dy-400,700,700)}
  const cx=sx+sw*.48,cy=sy+sh*.5;
  x.fillStyle='#e39a4c';x.beginPath();x.ellipse(cx,cy,sw*.26,sh*.22,0,0,7);x.fill();
  x.beginPath();x.arc(cx+sw*.2,cy-sh*.1,sw*.11,0,7);x.fill();
  x.beginPath();x.moveTo(cx+sw*.12,cy-sh*.18);x.lineTo(cx+sw*.14,cy-sh*.42);x.lineTo(cx+sw*.2,cy-sh*.2);x.closePath();x.fill();
  x.beginPath();x.moveTo(cx+sw*.22,cy-sh*.2);x.lineTo(cx+sw*.27,cy-sh*.42);x.lineTo(cx+sw*.29,cy-sh*.17);x.closePath();x.fill();
  x.strokeStyle='#2e2a24';x.lineWidth=5;x.lineCap='round';x.beginPath();x.moveTo(cx+sw*.15,cy-sh*.1);x.quadraticCurveTo(cx+sw*.17,cy-sh*.05,cx+sw*.19,cy-sh*.1);x.moveTo(cx+sw*.22,cy-sh*.1);x.quadraticCurveTo(cx+sw*.24,cy-sh*.05,cx+sw*.26,cy-sh*.1);x.stroke();
  x.strokeStyle='#e39a4c';x.lineWidth=18;x.beginPath();x.moveTo(cx-sw*.24,cy+sh*.05);x.quadraticCurveTo(cx-sw*.4,cy-sh*.05,cx-sw*.36,cy-sh*.3);x.stroke();
  if(dark){x.fillStyle='rgba(15,10,40,.22)';x.fillRect(rx,ry,rw,rh)}
  x.restore();
  const mins=data.mins|0,tstr=tstrOf(mins),name=data.name||'콩이';
  const d=data.date||new Date(),days=['일','월','화','수','목','금','토'];
  x.textAlign='center';x.fillStyle=mut;x.font='400 44px '+ff;
  x.fillText(`${d.getFullYear()}.${pad(d.getMonth()+1)}.${pad(d.getDate())} ${days[d.getDay()]}`,W/2,230);
  x.fillStyle=ink;x.font='400 150px '+ff;
  x.fillText(data.last?`${data.last}분 완주`:tstr,W/2,360);
  x.font='400 54px '+ff;x.fillStyle=ink;
  x.fillText(data.last?`오늘 누적 ${tstr} · ${sessions}세션`:`${josa(name,'과','와')} 함께 ${sessions}세션을 보냈어요`,W/2,1460);
  x.fillStyle=mut;x.font='400 40px '+ff;
  const stops=data.stops|0;
  x.fillText(stops?`빈 밥그릇 ${stops}개는 내일 채우기로`:'밥그릇은 한 번도 비지 않았어요',W/2,1540);
  x.font='400 46px '+ff;x.fillStyle=mut;x.fillText(name+'네 방 · '+SITE_TAGLINE,W/2,1800);
}

/* ---------- share sheet ---------- */
function resultUrl(st){
  const p=new URLSearchParams({s:st.sessions,m:st.mins,l:st.last,n:petName,t:tod(),d:todayKey().replace(/-/g,'')});
  return SITE_URL+'?'+p.toString();
}
function shareLine(st){
  const what=st.last?`${st.last}분 집중 완주`:(st.sessions?`${tstrOf(st.mins)} 집중`:'고양이와 집중 타이머 시작');
  return `오늘 ${what}! ${josa(petName,'이랑','랑')} 같이 해 볼래요? 🐾`;
}
let sheetCtx=null;
function canvasBlob(c){return new Promise(r=>{try{c.toBlob(b=>r(b),'image/png')}catch(e){r(null)}})}
async function openShareSheet(ctx){
  sheetCtx=ctx;
  $('#sheetLine').textContent=ctx.text;
  const img=$('#sheetPreview');
  try{img.src=ctx.canvas.toDataURL('image/png');img.hidden=false}catch(e){img.hidden=true}
  $('#shNative').hidden=!navigator.share;
  const grid=$('#shareGrid');
  if(IN_APP){grid.prepend($('#shCopyText'));grid.prepend($('#shCopy'));$('#sheetHint').textContent='카카오톡·인스타그램 안의 브라우저예요. 복사한 뒤 대화창에 붙여넣는 게 가장 확실하고, 그림은 길게 눌러 저장할 수 있어요.'}
  else $('#sheetHint').textContent=navigator.share?'휴대폰 공유창에서는 카카오톡·문자·인스타그램 등 설치된 앱으로 바로 보낼 수 있어요.':'링크를 복사해서 보내거나, X·Threads 버튼으로 바로 올릴 수 있어요.';
  $('#shareSheet').hidden=false;
}
async function copyText(t,msg){
  try{await navigator.clipboard.writeText(t);toast(msg||'복사했어요')}
  catch(e){const ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');toast(msg||'복사했어요')}catch(_){toast('복사가 막혀 있어요. 주소창의 링크를 직접 복사해 주세요')}ta.remove()}
}
async function shareNative(){
  if(!sheetCtx)return;
  const data={title:sheetCtx.title,text:sheetCtx.text+'\n'+sheetCtx.url,url:sheetCtx.url};
  try{
    const blob=await canvasBlob(sheetCtx.canvas);
    if(blob&&navigator.canShare){const file=new File([blob],sheetCtx.fileName||'kongi-room.png',{type:'image/png'});if(navigator.canShare({files:[file]}))data.files=[file]}
    await navigator.share(data);
  }catch(e){if(e&&e.name!=='AbortError'){copyText(sheetCtx.text+'\n'+sheetCtx.url,'공유창을 열 수 없어서 글과 링크를 복사했어요')}}
}
function saveImage(canvas,name){
  try{const a=document.createElement('a');a.download=name;a.href=canvas.toDataURL('image/png');document.body.appendChild(a);a.click();a.remove();toast(IN_APP?'저장이 안 되면 그림을 길게 눌러 저장해 주세요':'그림을 저장했어요')}
  catch(e){toast('그림을 길게 누르거나 우클릭해서 저장해 주세요')}
}
function loadKakao(){
  return new Promise((res,rej)=>{
    if(window.Kakao&&window.Kakao.isInitialized&&window.Kakao.isInitialized())return res(window.Kakao);
    const sc=document.createElement('script');sc.src='https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js';sc.async=true;
    sc.onload=()=>{try{window.Kakao.init(KAKAO_JS_KEY);res(window.Kakao)}catch(e){rej(e)}};sc.onerror=rej;document.head.appendChild(sc);
  });
}
async function shareKakao(){
  if(!sheetCtx)return;
  if(KAKAO_JS_KEY){
    try{const K=await loadKakao();K.Share.sendDefault({objectType:'feed',content:{title:sheetCtx.title,description:sheetCtx.text,imageUrl:SITE_URL+'assets/og.jpg',link:{mobileWebUrl:sheetCtx.url,webUrl:sheetCtx.url}},buttons:[{title:'나도 해 보기',link:{mobileWebUrl:sheetCtx.url,webUrl:sheetCtx.url}}]});return}catch(e){}
  }
  if(navigator.share){return shareNative()}
  copyText(sheetCtx.text+'\n'+sheetCtx.url,'글과 링크를 복사했어요. 카카오톡 대화창에 붙여넣어 주세요');
}
function openResultView(){
  const q=new URLSearchParams(location.search);
  if(!q.has('s'))return false;
  const st={sessions:Math.max(0,parseInt(q.get('s'),10)||0),mins:Math.max(0,parseInt(q.get('m'),10)||0),last:Math.max(0,parseInt(q.get('l'),10)||0),stops:0};
  const name=(q.get('n')||'콩이').replace(/[<>]/g,'').slice(0,6)||'콩이';
  const t=['morning','day','sunset','night'].includes(q.get('t'))?q.get('t'):'day';
  let date=new Date();const dm=/^(\d{4})(\d{2})(\d{2})$/.exec(q.get('d')||'');if(dm)date=new Date(+dm[1],+dm[2]-1,+dm[3]);
  const what=st.last?`${st.last}분 집중을 완주`:(st.sessions?`${tstrOf(st.mins)} 집중`:'집중');
  $('#resultTitle').textContent=`${josa(name,'과','와')} 함께한 친구의 오늘`;
  $('#resultLine').textContent=`친구가 오늘 ${what}했어요. 누적 ${tstrOf(st.mins)}, ${st.sessions}세션. 아래 버튼을 누르면 ${josa(name,'이','가')} 당신 방에도 찾아와요.`;
  document.title=`${name}${josa(name,'과','와').slice(name.length)} ${what}한 친구의 방 · 콩이네 방`;
  const draw=()=>drawCard(Object.assign({canvas:$('#resultCard'),tod:t,rain:false,shelf:[],name,date},st));
  (document.fonts&&document.fonts.ready?document.fonts.ready.then(draw,draw):draw());
  $('#resultModal').hidden=false;
  const leave=()=>{history.replaceState(null,'',location.pathname);$('#resultModal').hidden=true};
  $('#resultTry').onclick=()=>{leave();start(30,true)};
  $('#resultClose').onclick=leave;
  return true;
}

/* ---------- events ---------- */
$$('.chip').forEach(b=>b.addEventListener('click',()=>{$$('.chip').forEach(c=>c.setAttribute('aria-pressed','false'));b.setAttribute('aria-pressed','true');$('#customMin').value=b.dataset.min}));
$('#customMin').addEventListener('input',e=>{$$('.chip').forEach(c=>c.setAttribute('aria-pressed',String(+c.dataset.min===+e.target.value)))});
$('#startBtn').addEventListener('click',()=>{let v=parseInt($('#customMin').value,10);if(!(v>=5)){v=5;$('#customMin').value=5}if(v>180){v=180;$('#customMin').value=180}start(v*60,false)});
$('#demoBtn').addEventListener('click',()=>start(30,true));
$('#stopBtn').addEventListener('click',()=>{$('#stopMsg').textContent=fill('지금 멈추면 {N가} 소파 구석에서 조금 서운해할 수 있어요. 이번 세션의 밥그릇도 빈 채로 남습니다. 그래도 멈출까요?');$('#stopModal').hidden=false;$('#keepBtn').focus()});
$('#keepBtn').addEventListener('click',()=>{$('#stopModal').hidden=true});
$('#confirmStop').addEventListener('click',doStop);
$('#treatBtn').addEventListener('click',()=>{ensureAudio();giveTreat()});
$$('[data-break]').forEach(b=>b.addEventListener('click',()=>startBreak(+b.dataset.break*60)));
$('#nextBtn').addEventListener('click',()=>{$('#setupMsg').textContent=fill('바로 이어서 갈까요? {N는} 소파에서 쉬고 있어요.');show('setup')});
$('#skipBreak').addEventListener('click',endBreak);
catEl.addEventListener('click',()=>{
  const p = catEl.dataset.pose;
  if(p === 'desk'){
    hearts(3);say('골골… 🐾', 1800);
    caption(fill('{N가} 책상에 턱을 괸 채 편안하게 골골송을 불러요. "집중 잘하고 있냐옹?"'));
    addIntimacy(2);
  } else if(p === 'belly'){
    hearts(4);say('골골골… 🐾', 2000);
    caption(fill('{N가} 앞발을 꼬물거리며 배를 만져주는 손길을 느껴요.'));
    addIntimacy(2);
  } else if(run&&run.state==='break'){
    hearts(3);say('골골…',1500);
    if(catEl.dataset.pose==='sit'){setPose('lie');clearTimeout(catEl.p);catEl.p=setTimeout(()=>{if(run&&run.state==='break')setPose('sit')},2400)}
    addIntimacy(2);
  } else if(!run && isSulking){
    hearts(1);say('힝…',1600);
    caption(fill('{N가} 슬쩍 뒤돌아보더니 다시 웅크려요. 집중을 시작하면 기운을 차릴 거예요.'));
  } else if(run&&run.state==='focus'){
    hearts(2);say('파이팅 🐾',1500);
    caption(fill('{N가} 조용히 눈을 깜빡이며 당신의 집중을 응원해요.'));
  } else {
    hearts(2);say('야옹~',1500);
    caption(fill('{N가} 다정하게 눈을 마주쳐요.'));
  }
});
$('#petName').value=petName;
const sizeName=()=>{const i=$('#petName');i.style.width=(i.value.length*1.15+.9)+'em'};sizeName();$('#petName').addEventListener('input',sizeName);
$('#petName').addEventListener('change',e=>{const v=e.target.value.trim()||'콩이';petName=v;e.target.value=v;store.set('petName',v);renderLog();tick()});
$('#todSel').value=store.get('tod','auto');
$('#todSel').addEventListener('change',e=>{store.set('tod',e.target.value);applyTod()});
$('#shareBtn').addEventListener('click',()=>{const go=()=>{drawCard();$('#shareModal').hidden=false};(document.fonts&&document.fonts.ready?document.fonts.ready.then(go,go):go())});
function openDayShare(){const go=()=>{drawCard();const st=shareStats();openShareSheet({canvas:$('#card'),title:petName+'네 방',text:shareLine(st),url:resultUrl(st),fileName:'kongi-room-'+todayKey()+'.png'})};(document.fonts&&document.fonts.ready?document.fonts.ready.then(go,go):go())}
$('#openShareBtn').addEventListener('click',openDayShare);
$('#afterShareBtn').addEventListener('click',openDayShare);
$('#shareCardBtn').addEventListener('click',()=>{$('#shareModal').hidden=true;openDayShare()});
$('#closeSheet').addEventListener('click',()=>{$('#shareSheet').hidden=true});
$('#shNative').addEventListener('click',shareNative);
$('#shCopy').addEventListener('click',()=>{if(sheetCtx)copyText(sheetCtx.url,'링크를 복사했어요')});
$('#shCopyText').addEventListener('click',()=>{if(sheetCtx)copyText(sheetCtx.text+'\n'+sheetCtx.url,'글과 링크를 복사했어요')});
$('#shKakao').addEventListener('click',shareKakao);
$('#shX').addEventListener('click',()=>{if(!sheetCtx)return;window.open('https://x.com/intent/post?text='+encodeURIComponent(sheetCtx.text)+'&url='+encodeURIComponent(sheetCtx.url),'_blank','noopener')});
$('#shThreads').addEventListener('click',()=>{if(!sheetCtx)return;window.open('https://www.threads.net/intent/post?text='+encodeURIComponent(sheetCtx.text+'\n'+sheetCtx.url),'_blank','noopener')});
$('#shSave').addEventListener('click',()=>{if(sheetCtx)saveImage(sheetCtx.canvas,sheetCtx.fileName||'kongi-room.png')});
$('#sharePolaroidBtn').addEventListener('click',()=>{if(!currentPolaroidItem)return;const it=currentPolaroidItem;const st=shareStats();
  openShareSheet({canvas:$('#polaroidCanvas'),title:petName+'네 방',text:`${josa(petName,'과','와')} 함께 ${it.demo?'체험':it.min+'분'} 집중 완주! ${it.memo?'"'+it.memo+'" ':''}🐾`,url:resultUrl(st),fileName:'kongi-room-polaroid.png'})});
$('#closeShare').addEventListener('click',()=>{$('#shareModal').hidden=true});
$('#rainBtn').addEventListener('click',()=>toggleRain());
$('#hotspotRadio').addEventListener('click',()=>{$('#radioModal').hidden=false;$('#radioRainStatus').textContent=scene.classList.contains('rainy')?'켜짐':'꺼짐'});
$('#closeRadio').addEventListener('click',()=>{$('#radioModal').hidden=true});
$('#radioRainToggle').addEventListener('click',()=>{toggleRain();$('#radioRainStatus').textContent=scene.classList.contains('rainy')?'켜짐':'꺼짐'});

$('#hotspotBook').addEventListener('click',()=>{$('#toolsModal').hidden=false});
$('#closeTools').addEventListener('click',()=>{$('#toolsModal').hidden=true});

$('#hotspotCoffee').addEventListener('click',()=>{
  say('따뜻해… ☕', 2600);
  hearts(2);
  caption(fill('{N가} 커피 향을 맡으며 킁킁거려요. 잠시 따뜻한 차 한 잔 마시며 쉬어가세요.'));
});
const plantEl=$('#hotspotPlant');
if(plantEl){
  plantEl.addEventListener('click',()=>{
    say('파릇파릇 🌱', 2200);
    hearts(2);
    caption(fill('창가 서랍장에서 햇살을 받으며 자라는 싱그러운 화분이에요.'));
  });
}
$('#shelf').addEventListener('click',showShelfModal);
$('#closeShelf').addEventListener('click',()=>{$('#shelfModal').hidden=true});
$('#albumBtn').addEventListener('click',()=>{renderAlbum();$('#albumModal').hidden=false;});
$('#closeAlbum').addEventListener('click',()=>{$('#albumModal').hidden=true});

const afterPolBtn = $('#afterPolaroidBtn');
if (afterPolBtn) {
  afterPolBtn.addEventListener('click', () => {
    openPolaroidDetail(0);
  });
}

$('#closePolaroid').addEventListener('click', () => {
  $('#polaroidDetailModal').hidden = true;
  renderAlbum();
});

$('#polMemoInput').addEventListener('input', (e) => {
  if (currentPolaroidItem) {
    currentPolaroidItem.memo = e.target.value.trim();
    const album = store.get('album', []);
    if (album[currentPolaroidIndex]) {
      album[currentPolaroidIndex].memo = currentPolaroidItem.memo;
      store.set('album', album);
    }
    drawPolaroidCanvas(currentPolaroidItem);
  }
});

$('#downloadPolaroidBtn').addEventListener('click', () => {
  const c = $('#polaroidCanvas');
  if (!c) return;
  try {
    const link = document.createElement('a');
    link.download = `kongi-room-polaroid-${Date.now()}.png`;
    link.href = c.toDataURL('image/png');
    link.click();
  } catch (e) {
    alert('이미지를 길게 누르거나 우클릭하여 저장해 주세요.');
  }
});

$('#copyPolaroidTextBtn').addEventListener('click', () => {
  if (!currentPolaroidItem) return;
  const it = currentPolaroidItem;
  const memoLine = it.memo ? `\n✏️ 오늘의 한마디: "${it.memo}"` : '';
  const text = `콩이와 함께 ${it.demo ? '체험' : it.min + '분'} 집중 완주 완료! 🐱🐾\n"${it.kongiMsg || ''}"${memoLine}\n\n#콩이네방 #집중타이머 #인디메이커 ${SITE_URL}`;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      alert('스레드·X 공유용 문구가 복사되었습니다!');
    }).catch(() => {});
  }
});

$('#intimacyBtn').addEventListener('click',()=>{renderIntimacyModal();$('#intimacyModal').hidden=false;});
$('#closeIntimacy').addEventListener('click',()=>{$('#intimacyModal').hidden=true;});
$('#closeLevelUp').addEventListener('click',()=>{$('#levelUpModal').hidden=true;});
$('#lvlActionBtn').addEventListener('click',()=>{
  $('#levelUpModal').hidden=true;
  const curLv = getLevelInfo(getIntimacy().xp).level;
  if(curLv === 2) executeCatAction('desk','desk');
  else if(curLv === 3) executeCatAction('rug','belly');
});

document.addEventListener('keydown',e=>{if(e.key==='Escape'){$('#shareModal').hidden=true;$('#stopModal').hidden=true;$('#shelfModal').hidden=true;$('#albumModal').hidden=true;$('#polaroidDetailModal').hidden=true;$('#intimacyModal').hidden=true;$('#levelUpModal').hidden=true;$('#shareSheet').hidden=true;$('#resultModal').hidden=true;}});

/* ---------- boot ---------- */
applyTod();renderLog();renderShelf();updateIntimacyBadge();
openResultView();
if(store.get('rain',false)){toggleRain(true);}
if(run&&run.state==='focus'){
  const rem=run.endAt-Date.now();
  if(rem<=0){moveCat('bowl','wait',1,{instant:true});complete(false)}
  else{show('focus');const waitAt=run.demo?12000:120000;
    if(rem<=waitAt){moveCat('bowl','wait',1,{instant:true});phase='wait';setStatus('{N가} 밥그릇 앞에 앉아서 기다리고 있어요');say('…')}
    else{moveCat('sofa','sleep',1,{instant:true});setStatus('{N는} 소파에서 자고 있어요');scheduleIdle()}
    tick()}
}else if(run&&run.state==='done'){moveCat('bowl','wait',1,{instant:true});complete(false)}
else if(run&&run.state==='break'){if(run.endAt<=Date.now()){run=null;store.del('run');moveCat('sofa','lie',1,{instant:true});show('setup')}else{moveCat('rug','sit',-1,{instant:true});catEl.classList.add('petable');$('#breakStatus').textContent=fill('{N를} 눌러서 쓰다듬어 보세요.');caption('쉬는 시간. {N를} 눌러서 쓰다듬어 보세요');show('break');tick()}}
else{
  const lastStop=isSulking || store.get('sulking', false) || (log.items.length && log.items[log.items.length-1].type==='stop');
  if(lastStop){
    isSulking=true;
    moveCat('sofa','back',1,{instant:true});
    catEl.classList.add('petable');
    caption(fill('{N가} 소파 구석에서 등을 돌리고 쉬고 있어요'));
    $('#setupMsg').textContent=fill('{N가} 조금 서운해하고 있어요. 타이머를 시작하면 기지개를 켜며 반겨줄 거예요!');
  } else {
    moveCat('sofa','sleep',1,{instant:true});
    caption(fill('{N는} 소파에서 자고 있어요'));
  }
  show('setup');
}
})();
