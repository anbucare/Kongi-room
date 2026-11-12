(function(){
'use strict';
const CORE=window.KONGI_CORE;
const $=(s,el)=>(el||document).querySelector(s);
const $$=(s,el)=>Array.from((el||document).querySelectorAll(s));
const store={
  get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},
  set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}},
  del(k){try{localStorage.removeItem(k)}catch(e){}}
};
const pad=n=>String(n).padStart(2,'0');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const todayKey=()=>CORE.dayKey(new Date());
const yesterdayKey=()=>{const y=new Date();y.setDate(y.getDate()-1);return CORE.dayKey(y)};
function josa(name,a,b){const c=name.charCodeAt(name.length-1);if(c>=0xAC00&&c<=0xD7A3)return name+(((c-0xAC00)%28)?a:b);return name+b}
let petName=store.get('petName','콩이')||'콩이';
const Nga=()=>josa(petName,'이','가'),Nneun=()=>josa(petName,'은','는'),Nreul=()=>josa(petName,'을','를'),Nwa=()=>josa(petName,'과','와');
const fill=s=>String(s).replace(/\{N네\}/g,petName+'네').replace(/\{N가\}/g,Nga()).replace(/\{N는\}/g,Nneun()).replace(/\{N를\}/g,Nreul()).replace(/\{N와\}/g,Nwa()).replace(/\{N랑\}/g,josa(petName,'이랑','랑')).replace(/\{N\}/g,dname());
const reduced=()=>window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
const SITE_URL='https://kongi-room.anbu-pilot.workers.dev/';
const LANGS=['ko','en','de'];
const THEME_IDS=['room','library','greenhouse','train','cabin'];
let curTheme=(()=>{const v=store.get('theme','room');return THEME_IDS.includes(v)?v:'room'})();
let lang=(()=>{const l=store.get('lang','ko');return LANGS.includes(l)?l:'ko'})();
const I18N=window.KONGI_I18N||{ko:{}};
function t(k,vars){const L=I18N[lang]||I18N.ko;let v=null;if(curTheme!=='room'){v=L[k+'@'+curTheme];if(v==null)v=I18N.ko[k+'@'+curTheme]}if(v==null)v=L[k];if(v==null)v=I18N.ko[k];if(v==null)v=k;if(vars)for(const key in vars)v=v.split('{'+key+'}').join(vars[key]);return v}
const dname=()=>(lang!=='ko'&&petName==='콩이')?'Kongi':petName;
const roomTitle=()=>fill(t('title.room'));
function sessionsOf(n){return lang==='en'?(n===1?'1 session':n+' sessions'):lang==='de'?(n===1?'1 Sitzung':n+' Sitzungen'):n+'세션'}
function bowlsOf(n){return lang==='en'?(n===1?'1 empty bowl':n+' empty bowls'):lang==='de'?(n===1?'1 leerer Napf':n+' leere Näpfe'):'빈 밥그릇 '+n}
function fmtDate(d){if(lang==='ko'){const days=['일','월','화','수','목','금','토'];return `${d.getFullYear()}.${pad(d.getMonth()+1)}.${pad(d.getDate())} ${days[d.getDay()]}`}
  try{return d.toLocaleDateString(lang==='en'?'en-US':'de-DE',{year:'numeric',month:'short',day:'numeric',weekday:'short'})}catch(e){return d.toDateString()}}
const KAKAO_JS_KEY='';
const RESULT_BASE=SITE_URL+'r';
const RESULT_WORKER='https://kongi-room-share.anbu-pilot.workers.dev/r';
const IN_APP=/KAKAOTALK|Instagram|FBAN|FBAV|NAVER\(inapp|Line\//i.test(navigator.userAgent);
function toast(msg,ms){const t=$('#toast');t.textContent=msg;t.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>{t.hidden=true},ms||2600)}
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Durations with seconds: "12분 30초" / "12m 30s" / "12 Min. 30 Sek."
function fmtDur(sec){return CORE.fmtDur(sec,lang)}
// Text set through setT is re-rendered when the language changes.
// A var given as {dur:seconds} is formatted in the current language each time.
function tv(vars){if(!vars)return vars;const o={};for(const k in vars){const v=vars[k];o[k]=(v&&typeof v==='object'&&'dur' in v)?fmtDur(v.dur):v}return o}
function setT(el,k,vars){if(typeof el==='string')el=$(el);if(!el)return;if(!k){el.textContent='';delete el.dataset.tkey;delete el.dataset.tvars;return}el.dataset.tkey=k;el.dataset.tvars=vars?JSON.stringify(vars):'';el.textContent=fill(t(k,tv(vars)))}
function rerenderT(){$$('[data-tkey]').forEach(el=>{let v=null;try{v=el.dataset.tvars?JSON.parse(el.dataset.tvars):null}catch(e){}el.textContent=fill(t(el.dataset.tkey,tv(v)))})}
// Lifetime totals (the daily log resets every day).
const STATS={get(){let s=store.get('stats',null);if(!s||typeof s.sec!=='number'){const al=store.get('album',[]);s={sec:al.filter(a=>!a.demo).reduce((a,b)=>a+(b.min|0)*60,0),sessions:store.get('doneTotal',0)|0,demos:0};store.set('stats',s)}return s},
  add(o){const s=this.get();for(const k in o)s[k]=(s[k]||0)+o[k];store.set('stats',s);return s}};
const POMO_DEF=CORE.POMO_DEF;
let pomo=Object.assign({},POMO_DEF,store.get('pomo',{}));
function cycleGet(){const c=store.get('cycle',null);return (c&&c.date===todayKey())?c:{date:todayKey(),n:0}}
function cycleSet(n){store.set('cycle',{date:todayKey(),n})}
function tstrOf(mins){const h=Math.floor(mins/60),m=mins%60;if(lang==='en')return ((h?h+'h ':'')+(m||!h?m+'m':'')).trim();if(lang==='de')return ((h?h+' Std. ':'')+(m||!h?m+' Min.':'')).trim();return (h?h+'시간 ':'')+(m||!h?m+'분':'')}

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

const scene=$('#scene'),catEl=$('#cat'),bubble=$('#bubble'),bowl=$('#bowl');
let run=store.get('run',null); // {state:'focus'|'done'|'break', endAt, dur, demo}
let log=store.get('log',null); if(!log||log.date!==todayKey()) log={date:todayKey(),items:[]};
let ui='setup', phase='idle', idleTimer=null, lookTimer=null, audioCtx=null, moveId=0, curX=13, curY=35, isSulking=store.get('sulking',false);
let lapMode=!!store.get('lapMode',false), stage=0, awake=false, resettleTimer=null, purrNodes=null;


const MIX_IDS=['rain','thunder','waves','stream','wind','crickets','purr','fire','clock','pencil','cafe','brown'];
const MIX_DEFAULT=Object.fromEntries(MIX_IDS.map(id=>[id,0]));
let mix=Object.assign({},MIX_DEFAULT,store.get('mix',{}));
const mixCh={};
let mixMaster=null;
function noiseBuf(sec,kind){
  const sr=audioCtx.sampleRate,n=Math.floor(sr*sec),b=audioCtx.createBuffer(1,n,sr),d=b.getChannelData(0);
  let last=0,b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
  for(let i=0;i<n;i++){
    const w=Math.random()*2-1;
    if(kind==='brown'){last=(last+0.02*w)/1.02;d[i]=last*3.5}
    else if(kind==='pink'){b0=0.99886*b0+w*0.0555179;b1=0.99332*b1+w*0.0750759;b2=0.96900*b2+w*0.1538520;b3=0.86650*b3+w*0.3104856;b4=0.55000*b4+w*0.5329522;b5=-0.7616*b5-w*0.0168980;d[i]=(b0+b1+b2+b3+b4+b5+b6+w*0.5362)*0.11;b6=w*0.115926}
    else d[i]=w;
  }
  return b;
}
function mixOut(){if(!mixMaster){mixMaster=audioCtx.createGain();mixMaster.gain.value=1;mixMaster.connect(audioCtx.destination)}return mixMaster}
const loopSrc=(buf)=>{const s=audioCtx.createBufferSource();s.buffer=buf;s.loop=true;return s};
const biq=(type,f,q)=>{const b=audioCtx.createBiquadFilter();b.type=type;b.frequency.value=f;b.Q.value=q;return b};
const pan=(x)=>{try{const p=audioCtx.createStereoPanner();p.pan.value=x;return p}catch(e){return audioCtx.createGain()}};
function chain(ch,fn,first){const go=()=>{if(!ch.alive)return;const next=fn();ch.timer=setTimeout(go,next)};ch.timer=setTimeout(go,first||0)}
function burst(buf,dest,opts){
  const s=audioCtx.createBufferSource();s.buffer=buf;
  const f=audioCtx.createBiquadFilter();f.type=opts.type||'bandpass';f.frequency.value=opts.freq;f.Q.value=opts.q||1;
  const g=audioCtx.createGain();const t0=audioCtx.currentTime+(opts.delay||0);
  g.gain.setValueAtTime(0,t0);g.gain.linearRampToValueAtTime(opts.gain,t0+(opts.attack||0.004));g.gain.exponentialRampToValueAtTime(0.0005,t0+opts.len);
  s.connect(f).connect(g).connect(dest);const off=Math.random()*Math.max(0,buf.duration-opts.len-0.01);s.start(t0,off,opts.len+0.02);
}
const MIX_BUILD={
  rain(){
    const sr=audioCtx.sampleRate,dur=4,n=sr*dur,buf=audioCtx.createBuffer(1,n,sr),d=buf.getChannelData(0);
    let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
    for(let i=0;i<n;i++){const w=Math.random()*2-1;b0=0.99886*b0+w*0.0555179;b1=0.99332*b1+w*0.0750759;b2=0.96900*b2+w*0.1538520;b3=0.86650*b3+w*0.3104856;b4=0.55000*b4+w*0.5329522;b5=-0.7616*b5-w*0.0168980;const pink=(b0+b1+b2+b3+b4+b5+b6+w*0.5362)*0.05;b6=w*0.115926;
      const swell=0.92+0.08*Math.sin((i/n)*Math.PI*2);
      if(Math.random()<0.00035){const L=Math.floor(sr*0.035),fq=340+Math.random()*240;for(let j=0;j<L&&i+j<n;j++){d[i+j]+=Math.sin((2*Math.PI*fq*j)/sr)*0.14*Math.exp(-j/(sr*0.008))}}
      d[i]+=pink*swell}
    const s=audioCtx.createBufferSource();s.buffer=buf;s.loop=true;
    const hp=audioCtx.createBiquadFilter();hp.type='highpass';hp.frequency.value=300;
    const lp=audioCtx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=1650;
    const g=audioCtx.createGain();g.gain.value=0;s.connect(hp).connect(lp).connect(g).connect(mixOut());s.start();
    return {g,base:0.3,stop(){try{s.stop()}catch(e){}}};
  },
  purr(){
    const g=audioCtx.createGain();g.gain.value=0;
    const o=audioCtx.createOscillator();o.type='sawtooth';o.frequency.value=25;
    const o2=audioCtx.createOscillator();o2.type='triangle';o2.frequency.value=50;
    const f=audioCtx.createBiquadFilter();f.type='lowpass';f.frequency.value=170;f.Q.value=3;
    const am=audioCtx.createGain();am.gain.value=0.55;
    const lfo=audioCtx.createOscillator();lfo.type='sine';lfo.frequency.value=0.45;const lg=audioCtx.createGain();lg.gain.value=0.45;
    const rough=audioCtx.createOscillator();rough.type='sine';rough.frequency.value=12;const rg=audioCtx.createGain();rg.gain.value=0.12;
    lfo.connect(lg).connect(am.gain);rough.connect(rg).connect(am.gain);
    const m2=audioCtx.createGain();m2.gain.value=0.35;
    o.connect(f);o2.connect(m2).connect(f);f.connect(am).connect(g).connect(mixOut());
    o.start();o2.start();lfo.start();rough.start();
    return {g,base:0.16,stop(){[o,o2,lfo,rough].forEach(x=>{try{x.stop()}catch(e){}})}};
  },
  fire(){
    const g=audioCtx.createGain();g.gain.value=0;
    const bed=audioCtx.createBufferSource();bed.buffer=noiseBuf(3,'brown');bed.loop=true;
    const lp=audioCtx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=260;
    const bg=audioCtx.createGain();bg.gain.value=0.5;bed.connect(lp).connect(bg).connect(g);
    const lfo=audioCtx.createOscillator();lfo.frequency.value=0.18;const lg=audioCtx.createGain();lg.gain.value=0.15;lfo.connect(lg).connect(bg.gain);lfo.start();
    bed.start();g.connect(mixOut());
    const white=noiseBuf(1,'white');const ch={alive:true};
    chain(ch,()=>{const k=1+(Math.random()<0.3?1:0);for(let i=0;i<k;i++)burst(white,g,{freq:1200+Math.random()*3200,q:2.5,gain:0.25+Math.random()*0.5,len:0.02+Math.random()*0.05,delay:i*0.03});return 60+Math.random()*420},200);
    return {g,base:0.22,stop(){ch.alive=false;clearTimeout(ch.timer);try{bed.stop();lfo.stop()}catch(e){}}};
  },
  clock(){
    const g=audioCtx.createGain();g.gain.value=0;g.connect(mixOut());
    const white=noiseBuf(0.5,'white');const ch={alive:true};let tock=false;
    chain(ch,()=>{tock=!tock;
      burst(white,g,{freq:tock?2100:2900,q:6,gain:0.9,len:0.03,attack:0.001});
      const o=audioCtx.createOscillator();o.type='square';o.frequency.value=tock?1100:1500;const og=audioCtx.createGain();const t0=audioCtx.currentTime;
      og.gain.setValueAtTime(0.12,t0);og.gain.exponentialRampToValueAtTime(0.0005,t0+0.025);o.connect(og).connect(g);o.start(t0);o.stop(t0+0.03);
      return 1000},100);
    return {g,base:0.28,stop(){ch.alive=false;clearTimeout(ch.timer)}};
  },
  thunder(){
    const g=audioCtx.createGain();g.gain.value=0;g.connect(mixOut());
    const rum=noiseBuf(9,'brown'),crk=noiseBuf(1,'white');const ch={alive:true};const live=[];
    const strike=()=>{
      const near=Math.random()<0.35,delay=near?0.25+Math.random()*0.4:1.1+Math.random()*2.2;
      flashWindow();
      const t0=audioCtx.currentTime+delay,dur=4+Math.random()*4;
      const s=audioCtx.createBufferSource();s.buffer=rum;
      const lp=audioCtx.createBiquadFilter();lp.type='lowpass';lp.frequency.setValueAtTime(near?900:380,t0);lp.frequency.exponentialRampToValueAtTime(near?150:105,t0+2);
      const e=audioCtx.createGain();e.gain.setValueAtTime(0.0001,t0);e.gain.exponentialRampToValueAtTime(near?1:0.7,t0+(near?0.06:0.5));
      let tt=t0+(near?0.3:0.8);const bumps=2+Math.floor(Math.random()*4);
      for(let i=0;i<bumps;i++){e.gain.setTargetAtTime(0.25+Math.random()*0.6,tt,0.18);tt+=0.4+Math.random()*0.9}
      e.gain.setTargetAtTime(0.0001,tt,dur/5);
      s.connect(lp).connect(e).connect(g);s.start(t0,Math.random(),dur+3);live.push(s);if(live.length>4)live.shift();
      if(near)burst(crk,g,{type:'bandpass',freq:1400+Math.random()*900,q:0.7,gain:0.5,len:0.18,attack:0.002,delay});
    };
    chain(ch,()=>{strike();return 14000+Math.random()*22000},2500+Math.random()*4000);
    return {g,base:0.5,stop(){ch.alive=false;clearTimeout(ch.timer);live.forEach(s=>{try{s.stop()}catch(e){}})}};
  },
  waves(){
    const g=audioCtx.createGain();g.gain.value=0;g.connect(mixOut());
    const bedS=loopSrc(noiseBuf(5,'pink'));const bedF=biq('lowpass',260,0.7);const bedG=audioCtx.createGain();bedG.gain.value=0.18;bedS.connect(bedF).connect(bedG).connect(g);
    const sw=loopSrc(noiseBuf(6,'pink'));const lp=biq('lowpass',420,0.8);const swG=audioCtx.createGain();swG.gain.value=0.12;sw.connect(lp).connect(swG).connect(g);
    const fo=loopSrc(noiseBuf(3,'white'));const hp=biq('highpass',2600,0.7);const foG=audioCtx.createGain();foG.gain.value=0.0001;fo.connect(hp).connect(foG).connect(g);
    bedS.start();sw.start(0,1.3);fo.start();
    const ch={alive:true};
    chain(ch,()=>{
      const t=audioCtx.currentTime,rise=2.6+Math.random()*1.6,fall=3.6+Math.random()*2.6,peak=0.55+Math.random()*0.45;
      [swG.gain,lp.frequency,foG.gain].forEach(p=>{p.cancelScheduledValues(t);p.setValueAtTime(p.value,t)});
      swG.gain.linearRampToValueAtTime(peak,t+rise);swG.gain.exponentialRampToValueAtTime(0.12,t+rise+fall);
      lp.frequency.linearRampToValueAtTime(1000+Math.random()*600,t+rise);lp.frequency.exponentialRampToValueAtTime(380,t+rise+fall);
      foG.gain.linearRampToValueAtTime(0.0001,t+rise*0.8);foG.gain.linearRampToValueAtTime(0.09*peak,t+rise+0.3);foG.gain.exponentialRampToValueAtTime(0.0005,t+rise+fall*0.8);
      return (rise+fall*0.78)*1000},0);
    return {g,base:0.33,stop(){ch.alive=false;clearTimeout(ch.timer);[bedS,sw,fo].forEach(s=>{try{s.stop()}catch(e){}})}};
  },
  stream(){
    const g=audioCtx.createGain();g.gain.value=0;g.connect(mixOut());
    const bed=loopSrc(noiseBuf(4,'pink'));const bf=biq('bandpass',900,0.5);const bg=audioCtx.createGain();bg.gain.value=0.12;bed.connect(bf).connect(bg).connect(g);
    const hs=loopSrc(noiseBuf(2,'white'));const hf=biq('highpass',3600,0.7);const hg=audioCtx.createGain();hg.gain.value=0.035;hs.connect(hf).connect(hg).connect(g);
    bed.start();hs.start();
    const ch={alive:true};
    chain(ch,()=>{
      const n=1+(Math.random()<0.4?1:0)+(Math.random()<0.15?1:0);
      for(let i=0;i<n;i++){
        const t=audioCtx.currentTime+0.01+i*(0.008+Math.random()*0.02),d=0.025+Math.random()*0.05,f0=450+Math.random()*1300;
        const o=audioCtx.createOscillator();o.type='sine';o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f0*(1.5+Math.random()*1.2),t+d);
        const e=audioCtx.createGain();e.gain.setValueAtTime(0,t);e.gain.linearRampToValueAtTime(0.08+Math.random()*0.2,t+0.003);e.gain.exponentialRampToValueAtTime(0.0001,t+d);
        o.connect(e).connect(pan(Math.random()*1.2-0.6)).connect(g);o.start(t);o.stop(t+d+0.02);
      }
      return 12+Math.random()*48},120);
    return {g,base:0.55,stop(){ch.alive=false;clearTimeout(ch.timer);[bed,hs].forEach(s=>{try{s.stop()}catch(e){}})}};
  },
  wind(){
    const g=audioCtx.createGain();g.gain.value=0;g.connect(mixOut());
    const s=loopSrc(noiseBuf(5,'pink'));const bp=biq('bandpass',480,0.8);const gust=audioCtx.createGain();gust.gain.value=0.4;s.connect(bp).connect(gust).connect(g);
    const s2=loopSrc(noiseBuf(3,'white'));const wh=biq('bandpass',900,14);const wg=audioCtx.createGain();wg.gain.value=0.004;s2.connect(wh).connect(wg).connect(g);
    const s3=loopSrc(noiseBuf(4,'brown'));const lo=biq('lowpass',170,0.7);const lg=audioCtx.createGain();lg.gain.value=0.35;s3.connect(lo).connect(lg).connect(g);
    s.start();s2.start();s3.start();
    const ch={alive:true};
    chain(ch,()=>{const t=audioCtx.currentTime,k=Math.random();
      bp.frequency.setTargetAtTime(220+k*700,t,1.1);gust.gain.setTargetAtTime(0.25+k*0.85,t,0.9);
      wh.frequency.setTargetAtTime(650+Math.random()*700,t,0.8);wg.gain.setTargetAtTime(k>0.7?0.04+Math.random()*0.05:0.004,t,0.7);
      return 1600+Math.random()*2600},0);
    return {g,base:0.42,stop(){ch.alive=false;clearTimeout(ch.timer);[s,s2,s3].forEach(x=>{try{x.stop()}catch(e){}})}};
  },
  crickets(){
    const g=audioCtx.createGain();g.gain.value=0;g.connect(mixOut());
    const soft=biq('lowpass',6500,0.7);soft.connect(g);
    const night=loopSrc(noiseBuf(4,'pink'));const nf=biq('lowpass',420,0.7);const ng=audioCtx.createGain();ng.gain.value=0.12;night.connect(nf).connect(ng).connect(g);night.start();
    const bugs=[];
    for(let k=0;k<3;k++){
      const o=audioCtx.createOscillator();o.type='sine';o.frequency.value=4200+Math.random()*900;
      const e=audioCtx.createGain();e.gain.value=0;o.connect(e).connect(pan(-0.6+k*0.6)).connect(soft);o.start();
      const amp=k===1?0.22:0.13,pulses=2+Math.floor(Math.random()*3),period=0.45+Math.random()*0.5;
      const bc={alive:true};bugs.push({o,bc});
      chain(bc,()=>{
        if(Math.random()<0.08)return 1500+Math.random()*3000;
        const t=audioCtx.currentTime+0.02;
        for(let i=0;i<pulses;i++){const tt=t+i*0.032;e.gain.setValueAtTime(0,tt);e.gain.linearRampToValueAtTime(amp,tt+0.006);e.gain.linearRampToValueAtTime(0,tt+0.022)}
        return period*1000*(0.9+Math.random()*0.2)},k*170);
    }
    return {g,base:0.36,stop(){bugs.forEach(b=>{b.bc.alive=false;clearTimeout(b.bc.timer);try{b.o.stop()}catch(e){}});try{night.stop()}catch(e){}}};
  },
  cafe(){
    const g=audioCtx.createGain();g.gain.value=0;g.connect(mixOut());
    const tone=loopSrc(noiseBuf(4,'brown'));const tl=biq('lowpass',260,0.7);const tg=audioCtx.createGain();tg.gain.value=0.3;tone.connect(tl).connect(tg).connect(g);tone.start();
    const voices=[];const ch={alive:true};
    for(let k=0;k<4;k++){
      const s=loopSrc(noiseBuf(3,'pink'));
      const f1=biq('bandpass',450+Math.random()*250,4),f2=biq('bandpass',1200+Math.random()*900,6);
      const m1=audioCtx.createGain();m1.gain.value=0.9;const m2=audioCtx.createGain();m2.gain.value=0.45;
      const amp=audioCtx.createGain();amp.gain.value=0;
      s.connect(f1).connect(m1).connect(amp);s.connect(f2).connect(m2).connect(amp);amp.connect(pan(-0.7+k*0.45)).connect(g);s.start(0,Math.random()*2);
      const vc={alive:true};voices.push({s,vc});
      chain(vc,()=>{const t=audioCtx.currentTime;
        if(Math.random()<0.12){amp.gain.setTargetAtTime(0,t,0.08);return 600+Math.random()*1800}
        amp.gain.setTargetAtTime((0.25+Math.random()*0.75)*(k===0?1:0.7),t,0.035);
        f1.frequency.setTargetAtTime(380+Math.random()*420,t,0.03);f2.frequency.setTargetAtTime(1000+Math.random()*1300,t,0.03);
        return 110+Math.random()*170},Math.random()*500);
    }
    chain(ch,()=>{const t=audioCtx.currentTime+0.01,n=1+(Math.random()<0.3?1:0);
      for(let j=0;j<n;j++){const base=1900+Math.random()*1400,tt=t+j*0.12,p=pan(Math.random()*1.4-0.7);p.connect(g);
        [1,1.52,2.31].forEach((r,i)=>{const o=audioCtx.createOscillator();o.type='sine';o.frequency.value=base*r;const e=audioCtx.createGain();
          e.gain.setValueAtTime(0,tt);e.gain.linearRampToValueAtTime((0.05+Math.random()*0.05)/(i+1),tt+0.002);e.gain.exponentialRampToValueAtTime(0.0001,tt+0.35/(i+1));
          o.connect(e).connect(p);o.start(tt);o.stop(tt+0.4)})}
      return 2200+Math.random()*7000},1500);
    return {g,base:0.46,stop(){ch.alive=false;clearTimeout(ch.timer);voices.forEach(v=>{v.vc.alive=false;clearTimeout(v.vc.timer);try{v.s.stop()}catch(e){}});try{tone.stop()}catch(e){}}};
  },
  brown(){
    const g=audioCtx.createGain();g.gain.value=0;g.connect(mixOut());
    const s=loopSrc(noiseBuf(8,'brown'));const lp=biq('lowpass',800,0.7);s.connect(lp).connect(g);s.start();
    return {g,base:0.15,stop(){try{s.stop()}catch(e){}}};
  },
  pencil(){
    const g=audioCtx.createGain();g.gain.value=0;g.connect(mixOut());
    const white=noiseBuf(1,'white');const ch={alive:true};let left=0;
    chain(ch,()=>{
      if(left<=0){left=4+Math.floor(Math.random()*9);return 500+Math.random()*1400}
      left--;
      const len=0.06+Math.random()*0.2;
      burst(white,g,{freq:2600+Math.random()*2800,q:0.9,gain:0.35+Math.random()*0.35,len,attack:0.02});
      if(Math.random()<0.25)burst(white,g,{freq:900+Math.random()*600,q:1.2,gain:0.12,len:len*0.8,attack:0.03,delay:0.01});
      return len*1000+40+Math.random()*180},300);
    return {g,base:0.3,stop(){ch.alive=false;clearTimeout(ch.timer)}};
  }
};
function mixApply(id){
  const v=mix[id]||0;
  if(!audioCtx)return;
  let ch=mixCh[id];
  if(v>0&&!ch){try{ch=mixCh[id]=MIX_BUILD[id]();ch.g.gain.setValueAtTime(0.0001,audioCtx.currentTime)}catch(e){ch=null}}
  if(!ch)return;
  const target=Math.max(0.0001,ch.base*v*v);
  try{ch.g.gain.cancelScheduledValues(audioCtx.currentTime);ch.g.gain.setTargetAtTime(target,audioCtx.currentTime,0.25)}catch(e){}
  if(v===0){const dead=ch;delete mixCh[id];setTimeout(()=>{try{dead.stop();dead.g.disconnect()}catch(e){}},900)}
}
function mixSync(){MIX_IDS.forEach(mixApply)}
function mixSet(id,v,opts){
  opts=opts||{};
  v=Math.max(0,Math.min(1,Math.round(v*100)/100));
  mix[id]=v;store.set('mix',mix);
  if(id==='rain'&&v>0)store.set('rainLvl',v);
  if(v>0)ensureAudio();
  mixApply(id);
  if(id==='rain')rainVisual(v>0);
  const r=$('.mix-range[data-mix="'+id+'"]');if(r&&!opts.fromUi)r.value=Math.round(v*100);
  const lbl=$('.mix-val[data-mix="'+id+'"]');if(lbl)lbl.textContent=Math.round(v*100)+'%';
}
function rainVisual(on){
  if(scene.classList.contains('rainy')===on){$('#rainBtn').setAttribute('aria-pressed',String(on));return}
  scene.classList.toggle('rainy',on);
  $('#rainBtn').setAttribute('aria-pressed',String(on));
  $('#rainBtn').textContent=on?t('rain.btnOn'):t('rain.btn');
  store.set('rain',on);
  if(on){setupRainDrops();caption('rain.start')}else caption('rain.stop');
}
function toggleRain(enable){
  const on=typeof enable==='boolean'?enable:!(mix.rain>0);
  if(on&&mix.rain>0){rainVisual(true);return}
  mixSet('rain',on?(store.get('rainLvl',0.6)):0);
}
function mixPreset(p){
  const P={night:{rain:0.5,purr:0.8,fire:0.3},library:{clock:0.35,pencil:0.6},cabin:{purr:0.4,fire:0.75,clock:0.2,wind:0.3},storm:{rain:0.8,thunder:0.6,wind:0.35,purr:0.25},sea:{waves:0.65,cafe:0.4},forest:{crickets:0.5,stream:0.5,wind:0.15},deep:{brown:0.55,rain:0.2},off:MIX_DEFAULT};
  const m=P[p]||P.off;ensureAudio();MIX_IDS.forEach(id=>mixSet(id,m[id]||0));
}
function setupRainDrops(){
  const rainEl = $('#rain');
  if(!rainEl || rainEl.children.length) return;
  for(let i=0; i<40; i++){
    const d = document.createElement('div');
    d.className = 'drop';
    d.style.left = (Math.random()*104 - 2) + '%';
    d.style.top = (Math.random()*80 - 12) + '%';
    d.style.animationDelay = (Math.random()*1.5) + 's';
    d.style.animationDuration = (0.45 + Math.random()*0.3) + 's';
    rainEl.appendChild(d);
  }
  for(let i=0; i<16; i++){
    const b = document.createElement('div');
    b.className = 'bead';
    const sz = 2.5 + Math.random()*3;
    b.style.width = sz + 'px';
    b.style.height = (sz*1.2) + 'px';
    b.style.left = (Math.random()*96) + '%';
    b.style.top = (Math.random()*92) + '%';
    rainEl.appendChild(b);
  }
}
function flashWindow(){
  if(reduced())return;
  if(!(scene.classList.contains('rainy')||curTheme==='greenhouse'))return;
  scene.classList.remove('flash');void scene.offsetWidth;scene.classList.add('flash');
  clearTimeout(flashWindow.t);flashWindow.t=setTimeout(()=>scene.classList.remove('flash'),1200);
}
const RAIN_BOX={"room":[28.82,11.25,42.19,36.25],"library":[39.15,6.11,30.3,42.92],"train":[30.82,11.53,37.85,34.17],"cabin":[29.95,11.94,39.93,35.69],"greenhouse":[0.0,0.0,79.95,46.53]};
const rainMaskImg={};
function getRainMask(th){th=RAIN_BOX[th]?th:'room';if(!rainMaskImg[th]){const im=new Image();im.src='assets/rainmask_'+th+'.png';rainMaskImg[th]=im}return rainMaskImg[th]}
function drawRainOnGlass(ctx,item,px,py,pw,ph){
  const th=RAIN_BOX[item.theme]?item.theme:'room';const b=RAIN_BOX[th];
  const x=px+pw*b[0]/100,y=py+ph*b[1]/100,w=Math.max(1,Math.round(pw*b[2]/100)),h=Math.max(1,Math.round(ph*b[3]/100));
  const off=document.createElement('canvas');off.width=w;off.height=h;const o=off.getContext('2d');
  o.fillStyle='rgba(150,170,195,.16)';o.fillRect(0,0,w,h);
  o.strokeStyle='rgba(255,255,255,.55)';o.lineWidth=Math.max(1.5,pw/460);o.lineCap='round';
  const n=Math.round(14+w*h/2600);
  for(let i=0;i<n;i++){const rx=(i*37.7+11)%w,ry=(i*53.3+7)%h,len=h*(.05+((i*7)%5)/60);o.beginPath();o.moveTo(rx,ry);o.lineTo(rx-len*.25,ry+len);o.stroke()}
  o.fillStyle='rgba(255,255,255,.6)';
  for(let i=0;i<Math.round(n/3);i++){const rx=(i*61.1+5)%w,ry=(i*41.9+13)%h,r=Math.max(1.4,pw/400);o.beginPath();o.ellipse(rx,ry,r,r*1.2,0,0,7);o.fill()}
  const m=getRainMask(th);
  if(m.complete&&m.naturalWidth){o.globalCompositeOperation='destination-in';o.drawImage(m,0,0,w,h)}
  ctx.drawImage(off,x,y);
}

const TREASURES = [
  {id:'acorn',icon:'🌰',tier:15,name:'tr.acorn.name',desc:'tr.acorn.desc'},
  {id:'leaf',icon:'🍁',tier:15,name:'tr.leaf.name',desc:'tr.leaf.desc'},
  {id:'cap',icon:'🔘',tier:15,name:'tr.cap.name',desc:'tr.cap.desc'},
  {id:'flower',icon:'🌼',tier:15,name:'tr.flower.name',desc:'tr.flower.desc'},
  {id:'feather',icon:'🪶',tier:15,name:'tr.feather.name',desc:'tr.feather.desc'},
  {id:'pebble',icon:'🪨',tier:15,name:'tr.pebble.name',desc:'tr.pebble.desc'},
  {id:'pinecone',icon:'🌲',tier:15,name:'tr.pinecone.name',desc:'tr.pinecone.desc'},
  {id:'clover',icon:'🍀',tier:15,name:'tr.clover.name',desc:'tr.clover.desc'},
  {id:'shell',icon:'🐚',tier:15,name:'tr.shell.name',desc:'tr.shell.desc'},
  {id:'button',icon:'🧵',tier:15,name:'tr.button.name',desc:'tr.button.desc'},
  {id:'ribbon',icon:'🎀',tier:15,name:'tr.ribbon.name',desc:'tr.ribbon.desc'},
  {id:'candy',icon:'🍬',tier:15,name:'tr.candy.name',desc:'tr.candy.desc'},
  {id:'yarn',icon:'🧶',tier:25,name:'tr.yarn.name',desc:'tr.yarn.desc'},
  {id:'bookmark',icon:'🔖',tier:25,name:'tr.bookmark.name',desc:'tr.bookmark.desc'},
  {id:'mug',icon:'☕',tier:25,name:'tr.mug.name',desc:'tr.mug.desc'},
  {id:'pencil',icon:'✏️',tier:25,name:'tr.pencil.name',desc:'tr.pencil.desc'},
  {id:'candle',icon:'🕯️',tier:25,name:'tr.candle.name',desc:'tr.candle.desc'},
  {id:'sock',icon:'🧦',tier:25,name:'tr.sock.name',desc:'tr.sock.desc'},
  {id:'stamp',icon:'📮',tier:25,name:'tr.stamp.name',desc:'tr.stamp.desc'},
  {id:'key',icon:'🗝️',tier:25,name:'tr.key.name',desc:'tr.key.desc'},
  {id:'teabag',icon:'🍵',tier:25,name:'tr.teabag.name',desc:'tr.teabag.desc'},
  {id:'marble',icon:'🔮',tier:25,name:'tr.marble.name',desc:'tr.marble.desc'},
  {id:'origami',icon:'🦢',tier:25,name:'tr.origami.name',desc:'tr.origami.desc'},
  {id:'postcard',icon:'📬',tier:25,name:'tr.postcard.name',desc:'tr.postcard.desc'},
  {id:'terrarium',icon:'🪴',tier:50,name:'tr.terrarium.name',desc:'tr.terrarium.desc'},
  {id:'watch',icon:'⌚',tier:50,name:'tr.watch.name',desc:'tr.watch.desc'},
  {id:'compass',icon:'🧭',tier:50,name:'tr.compass.name',desc:'tr.compass.desc'},
  {id:'inkpot',icon:'🖋️',tier:50,name:'tr.inkpot.name',desc:'tr.inkpot.desc'},
  {id:'lantern',icon:'🏮',tier:50,name:'tr.lantern.name',desc:'tr.lantern.desc'},
  {id:'record',icon:'📀',tier:50,name:'tr.record.name',desc:'tr.record.desc'},
  {id:'camera',icon:'📷',tier:50,name:'tr.camera.name',desc:'tr.camera.desc'},
  {id:'hourglass',icon:'⏳',tier:50,name:'tr.hourglass.name',desc:'tr.hourglass.desc'},
  {id:'map',icon:'🗺️',tier:50,name:'tr.map.name',desc:'tr.map.desc'},
  {id:'kite',icon:'🪁',tier:50,name:'tr.kite.name',desc:'tr.kite.desc'},
  {id:'telescope',icon:'🔭',tier:50,name:'tr.telescope.name',desc:'tr.telescope.desc'},
  {id:'tin',icon:'🍪',tier:50,name:'tr.tin.name',desc:'tr.tin.desc'},
  {id:'musicbox',icon:'🎵',tier:120,name:'tr.musicbox.name',desc:'tr.musicbox.desc'},
  {id:'galaxy',icon:'🌌',tier:120,name:'tr.galaxy.name',desc:'tr.galaxy.desc'},
  {id:'snowglobe',icon:'❄️',tier:120,name:'tr.snowglobe.name',desc:'tr.snowglobe.desc'},
  {id:'crown',icon:'👑',tier:120,name:'tr.crown.name',desc:'tr.crown.desc'},
  {id:'star',icon:'⭐',tier:120,name:'tr.star.name',desc:'tr.star.desc'},
  {id:'moon',icon:'🌙',tier:120,name:'tr.moon.name',desc:'tr.moon.desc'},
  {id:'lamp',icon:'🪔',tier:120,name:'tr.lamp.name',desc:'tr.lamp.desc'},
  {id:'hat',icon:'🎩',tier:120,name:'tr.hat.name',desc:'tr.hat.desc'},
  {id:'book',icon:'📕',tier:120,name:'tr.book.name',desc:'tr.book.desc'},
  {id:'violin',icon:'🎻',tier:120,name:'tr.violin.name',desc:'tr.violin.desc'},
  {id:'ring',icon:'💍',tier:120,name:'tr.ring.name',desc:'tr.ring.desc'},
  {id:'bell',icon:'🔔',tier:120,name:'tr.bell.name',desc:'tr.bell.desc'}
];
const TIERS=CORE.TIERS,tierOf=CORE.tierOf;

function getShelfItems(){
  return store.get('shelf', []);
}

function renderShelf(){
  const items = getShelfItems();
  const el = $('#shelfItems');
  if(!el) return;
  el.innerHTML = '';
  items.slice(-6).forEach(it => {
    const span = document.createElement('span');
    span.className = 'shelf-item';
    span.textContent = it.icon;
    const def = TREASURES.find(x => x.id === it.id) || it;
    span.title = `${t(def.name)}: ${t(def.desc)}`;
    el.appendChild(span);
  });
}

function showShelfModal(){
  const items = getShelfItems();
  const list = $('#shelfDetailList');
  list.innerHTML = '';
  const owned = items.filter(i => TREASURES.some(tr => tr.id === i.id)).length;
  $('#shelfTitle').textContent = t('dex.title');
  $('#shelfSubtitle').textContent = fill(t('dex.sub',{a:owned,b:TREASURES.length}));
  TIERS.forEach(tier => {
    const h = document.createElement('div');
    h.className = 'dex-tier';
    h.textContent = t('dex.tier' + tier);
    list.appendChild(h);
    const grid = document.createElement('div');
    grid.className = 'dex-grid';
    TREASURES.forEach((tr, i) => {
      if(tr.tier !== tier) return;
      const has = items.some(x => x.id === tr.id);
      const card = document.createElement('div');
      card.className = 'dex-card' + (has ? ' owned' : '');
      const no = 'No.' + String(i + 1).padStart(3, '0');
      const hint = tr.id === 'bell' ? t('dex.special') : fill(t('dex.hint',{m:tr.tier}));
      card.title = has ? `${no} ${t(tr.name)}: ${t(tr.desc)}` : `${no} ${hint}`;
      card.innerHTML = `<div class="dex-no">${no}</div><div class="dex-icon">${has ? tr.icon : '❓'}</div><div class="dex-name">${has ? t(tr.name) : t('dex.locked')}</div><div class="dex-desc">${has ? t(tr.desc) : hint}</div>`;
      grid.appendChild(card);
    });
    list.appendChild(grid);
  });
  $('#shelfModal').hidden = false;
}

async function checkTreasureReward(sessionMin, wasDemo){
  if(wasDemo) return;
  let tier = tierOf(sessionMin|0);
  if(!tier){ await sleep(600); caption('dex.tooShort'); return; }
  const owned = getShelfItems();
  let pool = [];
  while(tier && !pool.length){
    pool = TREASURES.filter(tr => tr.tier === tier && tr.id !== 'bell' && !owned.some(o => o.id === tr.id));
    if(!pool.length) tier = TIERS[TIERS.indexOf(tier) - 1] || 0;
  }
  if(!pool.length) return;
  const picked = pool[Math.floor(Math.random() * pool.length)];
  owned.push({id:picked.id, icon:picked.icon});
  store.set('shelf', owned);
  renderShelf();
  await sleep(600);
  say(t('treasure.found'), 4200);
  celebrate();
  hearts(4);
  const no = 'No.' + String(TREASURES.indexOf(picked) + 1).padStart(3, '0');
  caption('gift.caption',{icon:picked.icon,name:no + ' ' + t(picked.name)});
}

function quoteKey(tod, rain, demo){
  if (demo) return 'quote.demo';
  if (rain) return 'quote.rain';
  if (tod === 'night' || tod === 'morning' || tod === 'sunset') return 'quote.' + tod;
  return 'quote.default';
}
function getKongiQuote(mins, tod, rain, demo) { return t(quoteKey(tod, rain, demo), {m:mins}); }
// Album text is rendered in the current language (older items stored a sentence; re-derive it).
function quoteOf(item){ return fill(getKongiQuote(item.min|0, item.tod, item.rain, item.demo)); }
function noteOf(item){ return item.demo ? t('album.noteDemo') : fill(t('album.note',{m:item.min|0})); }

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
  let no = 0;
  if(!sessionRun.demo){ no = (store.get('doneTotal', 0)|0) + 1; store.set('doneTotal', no); }

  const item = {
    id: Date.now(),
    dateStr: `${now.getFullYear()}.${now.getMonth()+1}.${now.getDate()}`,
    timeStr: `${now.getHours()}:${now.getMinutes()<10?'0':''}${now.getMinutes()}`,
    min: mins,
    demo: !!sessionRun.demo,
    tod: curTod,
    rain: isRain,
    theme: curTheme,
    pose: pose,
    sprite: sprite,
    kongiMsg: kongiMsg,
    memo: '',
    no: no,
    lap: !!sessionRun.lap,
    wakes: sessionRun.wakes|0,
    place: store.get('place','') || '',
    streak: STREAK.valid(),
    note: sessionRun.demo ? t('album.noteDemo') : fill(t('album.note',{m:mins}))
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
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px 10px;color:var(--muted)">'+fill(t('album.empty'))+'</div>';
    return;
  }
  album.forEach((item, idx) => {
    const card = document.createElement('div');
    card.className = 'polaroid-card';
    card.style.setProperty('--rot', ((idx % 5) - 2) * 1.8);
    
    const todName = item.rain ? t('tag.rain') : item.tod==='night' ? t('tag.night') : item.tod==='sunset' ? t('tag.sunset') : item.tod==='morning' ? t('tag.morning') : t('tag.day');

    card.innerHTML = `
      <div class="polaroid-thumb" style="background-image:url('${roomSrc(item)}');background-size:cover;background-position:center;position:relative">
        ${item.rain ? '<div style="position:absolute;inset:0;background:rgba(40,60,80,.25)"></div>' : ''}
        <img src="${item.sprite||'assets/cat_sit.png'}" alt="${t('cat.alt')}" style="position:absolute;bottom:6%;left:50%;transform:translateX(-50%);width:42%;image-rendering:pixelated;filter:drop-shadow(0 2px 4px rgba(0,0,0,.5))">
        <span style="position:absolute;top:6px;right:6px;font-size:10px;background:rgba(0,0,0,.6);color:#fff;padding:2px 6px;border-radius:10px;backdrop-filter:blur(2px)">${todName}</span>
      </div>
      <div class="polaroid-caption">${esc(item.memo) || noteOf(item)}</div>
      <div class="polaroid-date">${item.dateStr} ${item.timeStr} · ${item.demo?t('demoShort'):t('minShort',{m:item.min})}</div>
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
  const pi = $('#polPlaceInput'); if(pi) pi.value = currentPolaroidItem.place || store.get('place','') || '';
  setPolStyle(polStyle);
  $('#polaroidDetailModal').hidden = false;
}
function setPolStyle(s){
  polStyle = s === 'essay' ? 'essay' : 'classic';
  store.set('polStyle', polStyle);
  const tc = $('#polTabClassic'), te = $('#polTabEssay');
  if(tc) tc.classList.toggle('active', polStyle === 'classic');
  if(te) te.classList.toggle('active', polStyle === 'essay');
  const pw = $('#polPlaceWrap'); if(pw) pw.hidden = polStyle !== 'essay';
  if(currentPolaroidItem) drawPolaroidCanvas(currentPolaroidItem);
}

let polStyle = store.get('polStyle', 'classic');
let serifReady = false, serifAsked = false;
function ensureSerif(cb){
  if(serifReady){ cb(); return; }
  if(!serifAsked){
    serifAsked = true;
    const l = document.createElement('link'); l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&display=swap';
    document.head.appendChild(l);
  }
  if(document.fonts && document.fonts.load){
    Promise.all([document.fonts.load('400 40px "Gowun Batang"'), document.fonts.load('700 40px "Gowun Batang"')])
      .then(()=>{ serifReady = true; cb(); }, ()=>{});
  }
}
function wrapLines(ctx, text, maxW, maxLines){
  const out = [];
  const words = String(text || '').split(/\s+/).filter(Boolean);
  let line = '';
  const push = () => { if(line){ out.push(line); line = ''; } };
  for(const w of words){
    const tryLine = line ? line + ' ' + w : w;
    if(ctx.measureText(tryLine).width <= maxW){ line = tryLine; continue; }
    push();
    if(ctx.measureText(w).width <= maxW){ line = w; continue; }
    let chunk = '';
    for(const ch of w){ if(ctx.measureText(chunk + ch).width > maxW){ out.push(chunk); chunk = ch; } else chunk += ch; }
    line = chunk;
  }
  push();
  if(maxLines && out.length > maxLines){ out.length = maxLines; out[maxLines-1] = out[maxLines-1].replace(/.{1}$/, '…'); }
  return out;
}
function essayTitle(item){
  if(item.rain) return t('essay.titleRain');
  const k = item.tod === 'night' ? 'Night' : item.tod === 'morning' ? 'Morning' : item.tod === 'sunset' ? 'Sunset' : 'Day';
  return t('essay.title' + k);
}
function essayTod(item){
  if(item.rain) return t('essay.todRain');
  const k = item.tod === 'night' ? 'Night' : item.tod === 'morning' ? 'Morning' : item.tod === 'sunset' ? 'Sunset' : 'Day';
  return t('essay.tod' + k);
}
function essaySub(item){
  if(item.demo) return fill(t('essay.subDemo'));
  const place = (item.place || '').trim();
  return fill(place ? t('essay.sub',{place, tod:essayTod(item), m:item.min}) : t('essay.subNoPlace',{m:item.min}));
}
function drawEssayCanvas(item){
  const c = $('#polaroidCanvas');
  if(!c) return;
  const ctx = c.getContext('2d');
  const W = 1080, H = 1350;
  const sf = '"Gowun Batang","Nanum Myeongjo","Apple Myungjo","Noto Serif KR",Georgia,"Times New Roman",serif';
  const ink = '#2b2521', mut = '#8a7f74', line = '#d8cfc3';
  ctx.fillStyle = '#f7f3ec'; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = line; ctx.lineWidth = 2; ctx.strokeRect(40, 40, W - 80, H - 80);
  const ls = (v) => { try{ ctx.letterSpacing = v; }catch(e){} };
  ctx.textAlign = 'center';
  ctx.fillStyle = mut; ctx.font = '400 22px ' + sf; ls('6px');
  ctx.fillText(t('essay.header'), W/2, 125);
  ls('0px');
  ctx.strokeStyle = line; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(W/2 - 70, 158); ctx.lineTo(W/2 + 70, 158); ctx.stroke();
  ctx.fillStyle = mut; ctx.font = '400 30px ' + sf; ls('3px');
  ctx.fillText(t('essay.no',{n:String(item.no|0).padStart(3,'0')}), W/2, 215);
  ls('0px');
  ctx.fillStyle = ink; ctx.font = '700 60px ' + sf;
  const titleLines = wrapLines(ctx, essayTitle(item), W - 240, 2);
  titleLines.forEach((l, i) => ctx.fillText(l, W/2, 300 + i * 72));
  const subY = 300 + (titleLines.length - 1) * 72 + 60;
  ctx.fillStyle = mut; ctx.font = '400 30px ' + sf;
  wrapLines(ctx, essaySub(item), W - 240, 2).forEach((l, i) => ctx.fillText(l, W/2, subY + i * 40));

  const px = 160, py = 470, pw = 760, ph = 475;
  ctx.fillStyle = '#fffdf9'; ctx.fillRect(px - 14, py - 14, pw + 28, ph + 28);
  ctx.strokeStyle = line; ctx.lineWidth = 1.5; ctx.strokeRect(px - 14, py - 14, pw + 28, ph + 28);
  const roomImg = new Image(); roomImg.src = roomSrc(item);
  const catImg = new Image(); catImg.src = item.sprite || 'assets/cat_sit.png';
  if(item.rain){const mk=getRainMask(item.theme);if(!mk.complete)mk.addEventListener('load',()=>renderContents(),{once:true})}
  const renderContents = () => {
    ctx.save(); ctx.beginPath(); ctx.rect(px, py, pw, ph); ctx.clip();
    ctx.imageSmoothingEnabled = false;
    if(roomImg.complete && roomImg.naturalWidth) ctx.drawImage(roomImg, px, py, pw, ph);
    else { ctx.fillStyle = '#3a2e26'; ctx.fillRect(px, py, pw, ph); }
    if(item.rain) drawRainOnGlass(ctx, item, px, py, pw, ph);
    if(catImg.complete && catImg.naturalWidth){
      const cw = pw * 0.24, ch = cw * (catImg.naturalHeight / catImg.naturalWidth);
      ctx.drawImage(catImg, px + pw * 0.4, py + ph - ch - ph * 0.08, cw, ch);
    }
    ctx.fillStyle = 'rgba(247,243,236,.08)'; ctx.fillRect(px, py, pw, ph);
    ctx.restore();

    ctx.textAlign = 'center';
    const body = item.memo ? item.memo : quoteOf(item);
    ctx.fillStyle = ink; ctx.font = '400 34px ' + sf;
    const bodyLines = wrapLines(ctx, item.memo ? body : '“' + body + '”', W - 260, 3);
    bodyLines.forEach((l, i) => ctx.fillText(l, W/2, 1040 + i * 50));
    if(item.lap && !item.demo){
      ctx.fillStyle = mut; ctx.font = '400 24px ' + sf;
      ctx.fillText(fill(item.wakes ? t('lap.wakes',{n:item.wakes}) : t('lap.noWake')), W/2, 1040 + bodyLines.length * 50 + 6);
    }
    ctx.strokeStyle = line; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(W/2 - 70, 1208); ctx.lineTo(W/2 + 70, 1208); ctx.stroke();
    ctx.fillStyle = mut; ctx.font = '400 26px ' + sf; ls('2px');
    ctx.fillText((item.dateStr || '') + '  ' + (item.timeStr || ''), W/2, 1250);
    ctx.font = '400 20px ' + sf; ls('4px');
    ctx.fillText(t('essay.footer'), W/2, 1292);
    ls('0px');
  };
  let loaded = 0;
  const check = () => { if(++loaded >= 2) renderContents(); };
  if(roomImg.complete && catImg.complete) renderContents();
  else { roomImg.onload = check; catImg.onload = check; setTimeout(renderContents, 120); }
}
function drawPolaroidCanvas(item){
  const c = $('#polaroidCanvas');
  if(!c) return;
  if(polStyle === 'essay'){
    drawEssayCanvas(item);
    if(!serifReady) ensureSerif(() => { if(polStyle === 'essay' && currentPolaroidItem === item) drawEssayCanvas(item); });
    return;
  }
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
  roomImg.src = roomSrc(item);
  const catImg = new Image();
  catImg.src = item.sprite || 'assets/cat_sit.png';
  if (item.rain) { const mk = getRainMask(item.theme); if (!mk.complete) mk.addEventListener('load', () => renderContents(), { once: true }); }

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

    if (item.rain) drawRainOnGlass(ctx, item, px, py, pw, ph);

    if (catImg.complete && catImg.naturalWidth) {
      ctx.imageSmoothingEnabled = false;
      const cw = pw * 0.28;
      const ch = cw * (catImg.naturalHeight / catImg.naturalWidth);
      const cx = px + pw * 0.38;
      const cy = py + ph - ch - (ph * 0.08);
      ctx.drawImage(catImg, cx, cy, cw, ch);
    }

    const tagText = item.rain ? t('pol.tagRain') :
      item.tod === 'night' ? t('pol.tagNight') :
      item.tod === 'sunset' ? t('pol.tagSunset') :
      item.tod === 'morning' ? t('pol.tagMorning') : t('pol.tagDay');
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
    ctx.fillText(item.demo ? t('pol.doneDemo') : t('pol.done',{m:item.min}), px + pw - 10, 915);

    ctx.strokeStyle = '#e4d8cb';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px + 10, 940);
    ctx.lineTo(px + pw - 10, 940);
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#3a2c22';
    ctx.font = '600 34px ' + ff;
    const quoteText = `"${quoteOf(item)}"`;
    ctx.fillText(quoteText, px + 10, 1005);

    const userMemo = item.memo || t('pol.memoDefault');
    ctx.fillStyle = item.memo ? '#1b4a32' : '#887768';
    ctx.font = '700 32px ' + ff;
    ctx.fillText(`✏️ ${userMemo}`, px + 10, 1075);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#a69485';
    ctx.font = '400 24px ' + ff;
    ctx.fillText(t('pol.footer'), W / 2, 1280);

    if(item.streak && item.streak >= 2){
      ctx.save();
      ctx.translate(px + 16, py + 16);
      ctx.rotate(-0.1);
      ctx.font = '700 30px ' + ff;
      const stampText = '🔥 ' + t('pol.stamp',{n:item.streak});
      const stw = ctx.measureText(stampText).width + 36;
      ctx.fillStyle = 'rgba(255,249,238,.88)';
      ctx.strokeStyle = 'rgba(192,64,34,.85)';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.roundRect(0,0,stw,54,14); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(179,64,34,.95)';
      ctx.textAlign = 'left';
      ctx.fillText(stampText, 18, 38);
      ctx.restore();
    }
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

// Levels and XP rules live in core.js (shared with the unit tests). Demos earn nothing, so the 30-second demo can't level Kongi up.
const INTIMACY_LEVELS=CORE.LEVELS,XP_RULE=CORE.XP_RULE,xpForFocus=CORE.xpForFocus;

function getIntimacy() {
  const data = store.get('intimacy', null);
  if (!data || typeof data.xp !== 'number') {
    return { xp: 0, level: 1, v2: 1 };
  }
  if (!data.v2) { // levels were rescaled (30/90/180 -> 60/180/420): keep everyone at the same level
    const o = data.xp;
    data.xp = o < 30 ? o * 2 : o < 90 ? 60 + (o - 30) * 2 : o < 180 ? 180 + (o - 90) * 240 / 90 : 420 + (o - 180) * 2;
    data.xp = Math.round(data.xp); data.v2 = 1; store.set('intimacy', data);
  }
  return data;
}

const getLevelInfo=CORE.levelInfo;

function updateIntimacyBadge() { renderStatus(); }

const STREAK={
  get(){const s=store.get('streak',null);return (s&&typeof s.count==='number')?s:{count:0,best:0,last:null}},
  valid(){return CORE.streakValid(this.get(),todayKey(),yesterdayKey())}
};
function bumpStreak(){
  const s=CORE.streakBump(STREAK.get(),todayKey(),yesterdayKey());
  store.set('streak',s);
  updateStreakBadge();
  return s.count;
}
function updateStreakBadge(){ renderStatus(); }

// ---- Kongi grows with you: room decorations and seasons unlock with lifetime focus minutes ----
const DECOR=CORE.DECOR;
function lifeMin(){return Math.floor(STATS.get().sec/60)}
function seasonNow(){return CORE.seasonFor(lifeMin())}
function nextUnlock(){return CORE.nextUnlock(lifeMin())}
function renderDecor(){
  const layer=$('#decorLayer');if(!layer)return;layer.innerHTML='';
  const items=$('#decorItems')||layer;items.innerHTML='';  // 누를 수 있는 소품은 aria-hidden 장식 층 밖(형제 층)에 둔다 — 보조기기·에이전트 접근성 트리에 보이도록
  const m=lifeMin();
  DECOR.forEach(d=>{if(m<d.min)return;const el=document.createElement('span');el.className='decor';el.textContent=d.icon;el.style.left=d.at[0]+'%';el.style.top=d.at[1]+'%';el.title=t('dc.'+d.id);layer.appendChild(el)});
  const di=dailyInfo();const it=document.createElement('button');it.type='button';it.className='decor daily-item';it.textContent=di.item;it.title=t('daily.itemTitle');it.setAttribute('aria-label',t('daily.itemTitle'));
  it.addEventListener('click',e=>{e.stopPropagation();hsReact(it,['✨','❓']);if(run&&run.state==='focus')return;moveCat('rug','sit',1).then(()=>{say(t('daily.itemSay'),2600);hearts(2);setTag('tag.curious')})});
  items.appendChild(it);
  const fx=$('#seasonFx');if(fx){const s=seasonNow();if(fx.dataset.season!==s.id){fx.dataset.season=s.id;fx.innerHTML='';
    const ch={spring:'🌸',summer:'✨',autumn:'🍂',winter:'❄'}[s.id];
    for(let i=0;i<9;i++){const p=document.createElement('i');p.textContent=ch;p.style.left=(Math.random()*96)+'%';p.style.animationDuration=(9+Math.random()*9)+'s';p.style.animationDelay=(-Math.random()*16)+'s';p.style.fontSize=(1.1+Math.random()*1)+'cqw';fx.appendChild(p)}}}
}

// ---- Today's room: a different mood, line and small item every day ----
const DAILY_EMO=['😺','😽','😼','😸','😻','🙀','😹'];
const DAILY_ITEM=['📦','🧦','🎈','🍊','🧸','☂️','🎀'];
function dailyInfo(){const d=new Date();const doy=Math.floor((d-new Date(d.getFullYear(),0,0))/864e5);const k=(doy*3+d.getFullYear())%7;return {k,emo:DAILY_EMO[k],item:DAILY_ITEM[(doy+d.getDay())%7]}}
function renderDaily(){
  const di=dailyInfo();
  const de=$('#dailyDate');if(de)de.textContent=fmtDate(new Date());
  const em=$('#dailyEmo');if(em)em.textContent=di.emo;
  setT('#dailyLine','daily.m'+di.k);
}
function goalGet(){const g=store.get('goal',null);return (g&&g.date===todayKey())?g.n|0:(store.get('goalDefault',0)|0)}
function goalSet(n){store.set('goal',{date:todayKey(),n});store.set('goalDefault',n);renderStatus()}

function todayTotals(){
  const real=log.items.filter(i=>i.type==='done'&&!i.demo),parts=log.items.filter(i=>i.type==='stop'),demos=log.items.filter(i=>i.type==='done'&&i.demo);
  const secOf=i=>typeof i.sec==='number'?i.sec:(i.min|0)*60;
  return {sessions:real.length,demos:demos.length,stops:parts.length,sec:real.reduce((a,b)=>a+secOf(b),0)+parts.reduce((a,b)=>a+secOf(b),0),partSec:parts.reduce((a,b)=>a+secOf(b),0),demoSec:demos.reduce((a,b)=>a+secOf(b),0)};
}
function renderStatus(){
  const cur=getIntimacy(),info=getLevelInfo(cur.xp),next=INTIMACY_LEVELS[info.level];
  const lv=$('#lvLabel');if(lv)lv.textContent=`${info.icon} Lv.${info.level} ${t(info.name)}`;
  const pct=next?Math.min(100,Math.round((cur.xp-info.minXp)/(info.maxXp-info.minXp)*100)):100;
  const xf=$('#xpFill');if(xf)xf.style.width=pct+'%';
  const ln=$('#lvNext');if(ln)ln.textContent=next?t('st.lvNext',{n:info.maxXp-cur.xp,m:t(next.motion)}):t('st.lvMax',{xp:cur.xp});
  const tt=todayTotals();
  const ts=$('#todaySum');if(ts)ts.textContent='⏱ '+(tt.sec>0?t('st.today',{t:fmtDur(tt.sec)}):t('st.todayNone'));
  const sub=[];if(tt.sessions)sub.push(sessionsOf(tt.sessions));if(tt.stops)sub.push(t('st.parts',{n:tt.stops}));if(tt.demos)sub.push(t('st.demos',{n:tt.demos}));
  const tsub=$('#todaySub');if(tsub)tsub.textContent=sub.length?sub.join(' · '):t('st.todayHint');
  const g=goalGet();
  const gt=$('#goalTop');if(gt)gt.textContent=g?'🎯 '+t('st.goal',{a:Math.min(tt.sessions,g),b:g}):'🎯 '+t('st.goalSet');
  const gb=$('#goalBar');if(gb){gb.innerHTML='';for(let i=0;i<g;i++){const d=document.createElement('i');if(i<tt.sessions)d.className='on';gb.appendChild(d)}gb.hidden=!g}
  const gs=$('#goalSub');if(gs)gs.textContent=g?(tt.sessions>=g?t('st.goalDone'):t('st.goalLeft',{n:g-tt.sessions})):t('st.goalHint');
  const sk=STREAK.get(),n=STREAK.valid();
  const sb=$('#streakBadge');if(sb){sb.classList.toggle('hot',n>=3);sb.classList.toggle('cold',n<1)}
  const st=$('#streakTop');if(st)st.textContent='🔥 '+t('st.streak',{n});
  const ss=$('#streakSub');if(ss)ss.textContent=n?(STREAK.get().last===todayKey()?t('st.streakToday',{b:Math.max(sk.best||0,n)}):t('st.streakKeep')):t('st.streakStart');
  const S=STATS.get();
  const bt=$('#booksTop');if(bt)bt.textContent='📚 '+t('st.books',{n:S.sessions|0});
  const bs=$('#booksSub');if(bs)bs.textContent=t('st.total',{t:fmtDur(S.sec)});
  const nu=nextUnlock(),se=seasonNow();
  const ut=$('#unlockTop');if(ut)ut.textContent=nu?'🎁 '+t(nu.name):'🎁 '+t('st.allOpen');
  const us=$('#unlockSub');if(us)us.textContent=nu?t('st.unlockIn',{t:fmtDur(nu.min*60-S.sec),s:se.icon+' '+t('season.'+se.id)}):se.icon+' '+t('season.'+se.id);
  renderDecor();
}
function celebrate(){
  if(reduced())return;
  const c=catRect();
  const icons=['✨','⭐','🌟','💫'];
  for(let i=0;i<14;i++){
    const el=document.createElement('span');
    el.className='celebrate';
    el.textContent=icons[i%icons.length];
    el.style.left=(c.l+c.w*(.2+Math.random()*.6))+'%';
    el.style.top=(c.t+c.h*(Math.random()*.4))+'%';
    el.style.setProperty('--dx',(Math.random()*10-5)+'cqw');
    el.style.setProperty('--dr',(Math.random()*40-20)+'deg');
    el.style.animationDelay=(i*90)+'ms';
    el.style.fontSize=(3.4+Math.random()*2.2)+'cqw';
    scene.appendChild(el);
    setTimeout(()=>el.remove(),2000);
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
    const bell = TREASURES.find(tr => tr.id === 'bell');
    if (bell) {
      owned.push(bell);
      store.set('shelf', owned);
      renderShelf();
    }
  }
}

function showLevelUpModal(info) {
  $('#lvlTitle').textContent = t('lvl.title');
  $('#lvlSubtitle').textContent = t('lvl.sub',{l:info.level,name:t(info.name)});
  $('#lvlMotionDesc').textContent = t('lvl.motion',{m:t(info.motion)});
  $('#levelUpModal').hidden = false;
  hearts(6);
}

function renderIntimacyModal() {
  const cur = getIntimacy();
  const info = getLevelInfo(cur.xp);
  $('#intimacyCurrentTitle').textContent = `${info.icon} Lv.${info.level} ${t(info.name)}`;
  $('#intimacyCurrentDesc').textContent = t(info.desc);

  const pct = CORE.levelPct(cur.xp);
  $('#intimacyProgressBar').style.width = pct + '%';
  $('#intimacyXpText').textContent = info.level >= 4 ? t('intimacy.max',{xp:cur.xp}) : t('intimacy.xp',{xp:cur.xp,max:info.maxXp,pct});

  const totalMin = log.items.reduce((s, it) => s + (it.min || 0), 0);
  const doneCount = log.items.filter(it => it.type === 'done').length;
  $('#intimacyStats').textContent = t('intimacy.stats',{m:totalMin,n:doneCount});

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
          <span>Lv.${lvl.level} ${t(lvl.name)}</span>
          ${isUnlocked ? `<span style="font-size:11px;color:#2e7d32;font-weight:700">${t('lvl.unlocked')}</span>` : `<span style="font-size:11px;color:var(--muted)">${t('lvl.need',{xp:lvl.minXp})}</span>`}
        </div>
        <div class="level-desc">${t(lvl.desc)}</div>
        <div class="level-motion">${t('lvl.motionLabel',{m:t(lvl.motion)})}</div>
      </div>
      ${isUnlocked ? `<button class="btn secondary" style="padding:5px 9px;font-size:11.5px" type="button" data-pose-action="${lvl.pose}" data-spot-action="${lvl.spot}">${t('lvl.view')}</button>` : ''}
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
      say(t('act.deskSay'), 2000);
      hearts(3);
      caption('act.deskCap');
    });
  } else if (pose === 'belly') {
    moveCat('rug', 'belly', 1).then(() => {
      say(t('act.bellySay'), 2200);
      hearts(4);
      caption('act.bellyCap');
    });
  } else {
    moveCat('sofa', 'sleep', 1).then(() => {
      say('zZ…', 1800);
      caption('act.sleepCap');
    });
  }
}

const FLOOR=6;
const SPOTS={
  sofa:{x:17.5,y:26.5},
  win:{x:24,y:47},
  rug:{x:44,y:7.5},
  mid:{x:42,y:7.5},
  bowl:{x:31,y:7.5},
  eat:{x:40.5,y:6.5},
  door:{x:80,y:7.5},
  desk:{x:76,y:37},
  belly:{x:44,y:7.5},
  lap:{x:43,y:13}
};
const SOFA_POSE={sleep:{x:17.5,y:26.5},lie:{x:17.5,y:26.5},stretch:{x:16.5,y:26.5},back:{x:14.5,y:27},sit:{x:19,y:27},wait:{x:19,y:27}};
const BASE_SPOTS=Object.assign({},SPOTS);
const THEMES={
  room:{spots:{},hs:{shelf:[81,14],coffee:[45.4,54.5],plant:[59.5,50],book:[84.5,57],radio:[93,27]}},
  library:{spots:{sofa:{x:10,y:40},win:{x:33,y:38},rug:{x:40,y:8},mid:{x:50,y:8},door:{x:70,y:8},desk:{x:58,y:40},belly:{x:40,y:8},lap:{x:41,y:13}},
    hs:{shelf:[68,29],coffee:null,plant:[59.5,47],book:[91,44],radio:[15,27]}},
  greenhouse:{spots:{sofa:{x:9,y:38},win:{x:37,y:40},rug:{x:42,y:8},mid:{x:52,y:8},door:{x:62,y:8},desk:{x:70,y:40},belly:{x:42,y:8},lap:{x:43,y:13}},
    hs:{shelf:[88,28],coffee:[88.5,51.5],plant:[8,42],book:null,radio:[13.5,45]}},
  train:{spots:{sofa:{x:4,y:36},win:{x:11,y:36},rug:{x:40,y:8},mid:{x:50,y:8},door:{x:70,y:8},desk:{x:62,y:38},belly:{x:40,y:8},lap:{x:41,y:13}},
    hs:{shelf:[74,10],coffee:[77.5,57.5],plant:null,book:[90,14],radio:[18.5,37]}},
  cabin:{spots:{sofa:{x:8,y:36},win:{x:40,y:40},rug:{x:40,y:8},mid:{x:50,y:8},door:{x:60,y:8},desk:{x:68,y:38},belly:{x:40,y:8},lap:{x:41,y:13}},
    hs:{shelf:[87,26],coffee:null,plant:[7,27],book:[15,18],radio:[92,52]}}
};
function spotFor(spot,pose){const t=SPOTS[spot]||SPOTS.rug;return (spot==='sofa'&&curTheme==='room'&&SOFA_POSE[pose])?Object.assign({},t,SOFA_POSE[pose]):t}
const HS_IDS={shelf:'#shelf',coffee:'#hotspotCoffee',plant:'#hotspotPlant',book:'#hotspotBook',radio:'#hotspotRadio',bowl:'#hotspotBowl'};
function applyTheme(id,opts){
  opts=opts||{};
  if(!THEME_IDS.includes(id))id='room';
  curTheme=id;store.set('theme',id);
  const th=THEMES[id];
  Object.keys(SPOTS).forEach(k=>{delete SPOTS[k]});Object.assign(SPOTS,BASE_SPOTS,th.spots);
  scene.dataset.theme=id;
  Object.keys(HS_IDS).forEach(k=>{
    const el=$(HS_IDS[k]);if(!el)return;
    const v=k==='bowl'?[58,88]:th.hs[k];
    if(!v){el.style.display='none';return}
    el.style.display='';el.style.left=v[0]+'%';el.style.top=v[1]+'%';
  });
  const fx=$('#themeFx');
  if(fx){fx.innerHTML='';
    if(id==='cabin'){for(let i=0;i<26;i++){const s=document.createElement('i');s.style.left=(Math.random()*100)+'%';s.style.animationDuration=(5+Math.random()*6)+'s';s.style.animationDelay=(-Math.random()*10)+'s';s.style.opacity=(.5+Math.random()*.5);s.style.fontSize=(.4+Math.random()*.6)+'cqw';fx.appendChild(s)}}
    if(id==='train'){for(let i=0;i<34;i++){const s=document.createElement('b');s.style.top=(Math.random()*70)+'%';s.style.animationDuration=(9+Math.random()*12)+'s';s.style.animationDelay=(-Math.random()*20)+'s';s.style.opacity=(.3+Math.random()*.7);s.style.width=s.style.height=(.15+Math.random()*.3)+'cqw';fx.appendChild(s)}}
  }
  if(id==='greenhouse')setupRainDrops();
  $$('.theme-card').forEach(c=>c.classList.toggle('active',c.dataset.theme===id));
  const tb=$('#themeBtn');if(tb)tb.textContent=t('theme.btn')+' · '+t('theme.'+id+'.name');
  if(!opts.boot){
    const spot=catEl.dataset.spot||'sofa',pose=catEl.dataset.pose||'sleep';
    moveCat(spot,pose,catEl.classList.contains('flip')?-1:1,{instant:true});
    if(lastCaption)caption(lastCaption.k,lastCaption.v);
    if(lastStatus)$('#focusStatus').textContent=fill(t(lastStatus.k,lastStatus.v));
  }
}
function roomSrc(item){if(item&&item.theme&&item.theme!=='room')return 'assets/theme_'+item.theme+'.webp';const tod=(item&&item.tod)||'day';if(item&&item.rain)return tod==='night'?'assets/room_bg.webp':'assets/room_'+tod+'_rain.webp';return 'assets/room_'+tod+'.webp'}
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
}
async function moveCat(spot, pose, face, opts){
  opts = opts || {};
  const id = ++moveId;
  const target = spotFor(spot, pose);
  catEl.dataset.spot = spot;
  catEl.classList.remove('loaf','purring');

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

  if ((curIsSofa && targetIsSofa) || (curIsDesk && targetIsDesk)) {
    setFace(face !== undefined ? face : (targetIsDesk ? -1 : 1));
    setXY(target.x, target.y, 'left 280ms ease-in-out, bottom 280ms ease-in-out');
    await sleep(300);
    if (moveId !== id) return;
    setPose(pose);
    return;
  }

  if (curY > 15) {
    const isDesk = curX >= 55;
    const dropFloorX = isDesk ? 74 : 26;
    setFace(isDesk ? -1 : 1);
    setPose('stretch');
    setXY(dropFloorX, 7.5, 'left 320ms ease-out, bottom 320ms cubic-bezier(.35,0,.7,1)');
    await sleep(340);
    if (moveId !== id) return;
  }

  const isTargetElevated = target.y > 15;
  const targetFloorX = isTargetElevated ? (target.x >= 55 ? 74 : 26) : target.x;
  const targetFloorY = isTargetElevated ? 7.5 : target.y;

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

  if (isTargetElevated) {
    const isTargetDesk = target.x >= 55;
    setFace(isTargetDesk ? 1 : -1);
    setPose('stretch');
    setXY(target.x, target.y, 'left 440ms cubic-bezier(.2,.8,.4,1), bottom 440ms cubic-bezier(.2,.8,.4,1)');
    await sleep(460);
    if (moveId !== id) return;
  }

  setFace(face !== undefined ? face : (target.x >= 55 ? -1 : 1));
  setPose(pose);
}
function say(t,ms){bubble.textContent=t;bubble.hidden=false;bubble.style.marginLeft='0px';clearTimeout(say.t);if(ms)say.t=setTimeout(()=>{bubble.hidden=true},ms);
  // keep long lines inside the room picture
  try{const r=bubble.getBoundingClientRect(),sr=scene.getBoundingClientRect(),pad=6;let dx=0;if(r.left<sr.left+pad)dx=sr.left+pad-r.left;else if(r.right>sr.right-pad)dx=sr.right-pad-r.right;bubble.style.marginLeft=dx+'px'}catch(e){}}
function hush(){bubble.hidden=true}
function catRect(){const r=catEl.getBoundingClientRect(),sr=scene.getBoundingClientRect();return{l:(r.left-sr.left)/sr.width*100,t:(r.top-sr.top)/sr.height*100,w:r.width/sr.width*100,h:r.height/sr.height*100}}
function hearts(n){const c=catRect();
  for(let i=0;i<n;i++){const h=document.createElement('span');h.className='heart';h.textContent='♥';
    h.style.left=(c.l+c.w*(.3+Math.random()*.4))+'%';h.style.top=c.t+'%';h.style.setProperty('--dx',(Math.random()*6-3)+'cqw');
    h.style.animationDelay=(i*120)+'ms';scene.appendChild(h);setTimeout(()=>h.remove(),1700)}}
function crumbs(){for(let i=0;i<3;i++){const s=document.createElement('span');s.className='crumb';
  s.style.left=(77+Math.random()*7)+'%';s.style.bottom='9%';s.style.setProperty('--dx',(Math.random()*4-2)+'cqw');scene.appendChild(s);setTimeout(()=>s.remove(),800)}}
let lastCaption=null,lastStatus=null;
function caption(k,v){lastCaption={k,v};$('#caption').textContent=fill(t(k,v))}

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
  {spot:'sofa',pose:'sleep',face:1,w:5,minLv:1,msg:'idle.sleep'},
  {spot:'sofa',pose:'lie',face:1,w:2,minLv:1,msg:'idle.lie'},
  {spot:'win',pose:'back',face:1,w:3,minLv:1,msg:'idle.win'},
  {spot:'rug',pose:'groom',face:-1,w:2,minLv:1,msg:'idle.groom'},
  {spot:'rug',pose:'stretch',face:-1,w:1,minLv:1,msg:'idle.stretch',then:'sit'},
  {spot:'mid',pose:'sit',face:1,w:1,minLv:1,msg:'idle.mid'},
  {spot:'desk',pose:'desk',face:-1,w:4,minLv:2,msg:'idle.desk'},
  {spot:'rug',pose:'belly',face:1,w:3,minLv:3,msg:'idle.belly'}
];
const homeSpot=()=>(run&&run.lap)?'lap':'sofa';
function renderStages(){
  const ol=$('#stages');if(!ol)return;
  ol.hidden=!(run&&run.state==='focus');
  $$('li',ol).forEach((li,i)=>{const n=i+1;li.classList.toggle('active',n===stage);li.classList.toggle('done',n<stage)});
}
function startPurr(){
  stopPurr();
  if(!(run&&run.lap)||!audioCtx||reduced())return;
  try{
    const o=audioCtx.createOscillator(),f=audioCtx.createBiquadFilter(),g=audioCtx.createGain(),lfo=audioCtx.createOscillator(),lg=audioCtx.createGain();
    o.type='sawtooth';o.frequency.value=27;f.type='lowpass';f.frequency.value=160;f.Q.value=2;
    g.gain.value=0;lfo.type='sine';lfo.frequency.value=0.9;lg.gain.value=0.035;
    lfo.connect(lg).connect(g.gain);o.connect(f).connect(g).connect(audioCtx.destination);
    g.gain.setValueAtTime(0,audioCtx.currentTime);g.gain.linearRampToValueAtTime(0.045,audioCtx.currentTime+1.2);
    o.start();lfo.start();purrNodes={o,lfo,g};
  }catch(e){purrNodes=null}
}
function stopPurr(){
  if(!purrNodes)return;const p=purrNodes;purrNodes=null;
  try{p.g.gain.cancelScheduledValues(audioCtx.currentTime);p.g.gain.setTargetAtTime(0,audioCtx.currentTime,0.15);setTimeout(()=>{try{p.o.stop();p.lfo.stop()}catch(e){}},500)}catch(e){}
}
const stageFor=CORE.stageFor;
function setStage(n,quiet){
  stage=n;renderStages();
  const home=homeSpot(),lap=!!(run&&run.lap);
  catEl.classList.remove('loaf','purring');
  if(lap&&n>=1&&n<=3)setLapView(true,n);
  if(n===1){
    stopPurr();
    const id=moveId+1;
    moveCat(home,'sit',1).then(()=>{setTimeout(()=>{if(moveId===id&&stage===1&&!awake&&run&&run.state==='focus'&&!run.paused)setPose('lie')},1600)});
    setTag('tag.settle');
    if(!quiet)setStatus('stage.settleCap');
  }else if(n===2){
    stopPurr();
    const id=moveId+1;
    const p=(catEl.dataset.spot===home)?Promise.resolve():moveCat(home,'sit',1);
    p.then(()=>{if(moveId>id)return;setPose('sit');catEl.classList.add('loaf')});
    setTag('tag.loaf');
    if(!quiet)setStatus('stage.loafCap');
  }else if(n===3){
    clearTimeout(idleTimer);
    moveCat(home,'sleep',1).then(()=>{if(stage===3&&!awake){catEl.classList.add('purring');startPurr()}});
    setTag(lap?'tag.lapSleep':'tag.sleep');
    if(!quiet)setStatus(lap?'stage.lapSleepCap':'stage.sleepCap');
  }else if(n===4){
    stopPurr();setLapView(false);
    setPose('stretch');hearts(3);setTag('tag.eye');
    if(!quiet)caption('stage.finishCap');
  }
}
// Lap mode gets its own close-up view: a blanket over your knees with Kongi asleep on it.
function setLapView(on,n){
  scene.classList.toggle('lap-view-on',!!on);
  const lv=$('#lapView');if(!lv)return;
  if(!on){lv.classList.remove('awake','s1','s2','s3');return}
  lv.classList.remove('awake','s1','s2','s3');lv.classList.add('s'+(n||1));
  const img=$('#lapCatImg');const src=n>=3?SPRITES.sleep:SPRITES.sit;if(img.getAttribute('src')!==src)img.src=src;
  setT('#lapLabel',n>=3?'lap.l3':n===2?'lap.l2':'lap.l1');
}
function wakeCat(fromStop){
  if(!(run&&run.state==='focus'&&run.lap)||awake||run.paused)return;
  awake=true;clearTimeout(resettleTimer);
  run.wakes=(run.wakes|0)+1;store.set('run',run);
  stopPurr();catEl.classList.remove('loaf','purring');
  setPose('sit');
  const lv=$('#lapView');if(lv&&scene.classList.contains('lap-view-on')){lv.classList.remove('s1','s2','s3');lv.classList.add('awake');$('#lapCatImg').src=SPRITES.sit;setT('#lapLabel','lap.awake')}
  catEl.classList.remove('startled');void catEl.offsetWidth;catEl.classList.add('startled');
  setTimeout(()=>catEl.classList.remove('startled'),800);
  say(t('wake.say'),2600);emote('🙀');setTag('tag.startled');
  if(!fromStop){setStatus('wake.status',{n:run.wakes});caption('wake.cap')}
}
function resettle(){
  if(!(run&&run.state==='focus'&&run.lap)||!awake)return;
  clearTimeout(resettleTimer);
  resettleTimer=setTimeout(()=>{
    if(!(run&&run.state==='focus'&&run.lap)||!awake||run.paused)return;
    awake=false;
    const p=1-remainOf()/(run.dur*1000);
    setStage(stageFor(p),true);
    setStatus('wake.back');
  },3000);
}
function onLeave(){if(run&&run.state==='focus'&&run.lap&&!run.paused&&phase==='idle'&&stage>=1)wakeCat(false)}
// A small label over Kongi that says what it is doing right now.
function setTag(k){const el=$('#catTag');if(!el)return;if(!k){el.hidden=true;setT(el,null);return}setT(el,k);el.hidden=false;el.classList.remove('pop');void el.offsetWidth;el.classList.add('pop')}
function emote(ch){if(reduced())return;const c=catRect();const e=document.createElement('span');e.className='emote';e.textContent=ch;e.style.left=(c.l+c.w*.55)+'%';e.style.top=Math.max(2,c.t-6)+'%';scene.appendChild(e);setTimeout(()=>e.remove(),1600)}
let sulkPets=0;
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')onLeave();else resettle()});
window.addEventListener('blur',onLeave);
window.addEventListener('focus',resettle);
function scheduleIdle(){clearTimeout(idleTimer);if(!(run&&run.state==='focus'&&phase==='idle'&&!run.lap&&stage===2))return;
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
  if(c.spot==='sofa'&&stage===2){moveCat('sofa','sit',1).then(()=>{if(moveId===id&&stage===2&&!awake)catEl.classList.add('loaf')});setStatus('stage.loafCap');return}
  moveCat(c.spot,c.pose,c.face).then(()=>{if(c.then&&moveId===id)setTimeout(()=>{if(moveId===id&&catEl.dataset.pose===c.pose)setPose(c.then)},2500)});
  setStatus(c.msg);
}
function setStatus(k,v){lastStatus={k,v};$('#focusStatus').textContent=fill(t(k,v));caption(k,v)}

function ensureAudio(){try{const fresh=!audioCtx;if(!audioCtx)audioCtx=new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();if(fresh)mixSync()}catch(e){}}
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

function show(id){ui=id;['setup','focus','done','after','break'].forEach(k=>{$('#ui-'+k).hidden=k!==id});renderCycle();document.body.dataset.ui=id}
const fmt=s=>{s=Math.ceil(s/1000);const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return (h?h+':':'')+(h?pad(m):m<10?'0'+m:m)+':'+pad(x)};
// Remaining time of the current run; a paused run keeps its remaining time frozen.
function remainOf(r){r=r||run;if(!r)return 0;return r.paused?Math.max(0,r.pausedRemain|0):Math.max(0,r.endAt-Date.now())}
function elapsedSec(r){r=r||run;if(!r)return 0;return Math.max(0,Math.round((r.dur*1000-remainOf(r))/1000))}
function tick(){
  if(!run){if($('#resultModal').hidden&&$('#joinModal').hidden)document.title=roomTitle()+' · '+t('tagline');return}
  const rem=remainOf();
  if(run.state==='focus'){
    $('#clock').textContent=fmt(rem);$('#barFill').style.width=(100-rem/(run.dur*1000)*100)+'%';
    document.title=(run.paused?'⏸ ':'')+fmt(rem)+' · '+roomTitle();
    if(run.paused)return;
    if(run.pre){ // together: waiting for the shared start time
      return;
    }
    const waitAt=run.demo?12000:120000;
    if(phase==='idle'&&!awake&&rem>0){const s=stageFor(1-rem/(run.dur*1000));if(s!==stage)setStage(s)}
    if(phase==='idle'&&!run.lap&&rem<=waitAt&&rem>0)enterWait();
    if(rem===0)complete(true);
  }else if(run.state==='break'){
    $('#breakClock').textContent=fmt(rem);document.title=t('title.break')+' '+fmt(rem)+' · '+roomTitle();
    if(rem===0)endBreak(true);
  }else{
    document.title=t('title.treat')+' · '+roomTitle();
    if(run.autoAt){const left=Math.max(0,Math.ceil((run.autoAt-Date.now())/1000));
      const n=ui==='done'?$('#autoNote'):$('#autoNoteA');if(n)n.textContent=fill(t(ui==='done'?'auto.treatIn':'auto.breakIn',{n:left,m:nextBreakMin()}));
      if(left===0){run.autoAt=0;if(ui==='done'){$('#treatBtn').click()}else if(ui==='after'){startBreak(nextBreakMin()*60)}}}
  }
}
setInterval(tick,250);

function nextBreak(){return CORE.pomoNextBreak(cycleGet().n,pomo)}
function nextIsLong(){return nextBreak().long}
function nextBreakMin(){return nextBreak().min}
function renderCycle(){
  const every=CORE.pomoEvery(pomo),n=cycleGet().n,inCycle=n%every===0&&n>0?every:n%every;
  ['#cycleBox','#cycleBoxF','#cycleBoxA','#cycleBoxB'].forEach(sel=>{const el=$(sel);if(!el)return;
    let dots='';for(let i=0;i<every;i++)dots+=`<i class="${i<inCycle?'on':''}"></i>`;
    const next=nextIsLong()?t('cyc.long',{m:pomo.long}):t('cyc.short',{m:pomo.short});
    el.innerHTML=`<span class="cyc-dots" aria-hidden="true">${dots}</span><span class="cyc-txt">${esc(t('cyc.label',{a:inCycle,b:every}))} · ${esc(t('cyc.next'))} ${esc(next)}</span>`});
  const bb=$('#breakBtn');if(bb)bb.textContent=nextIsLong()?t('break.long',{m:pomo.long}):t('break.short',{m:pomo.short});
}

function notify(titleKey,bodyKey,vars){
  if(pomo.sound)chime();
  try{
    if(pomo.notify&&'Notification' in window&&Notification.permission==='granted'&&document.visibilityState!=='visible'){
      const n=new Notification(fill(t(titleKey,vars)),{body:fill(t(bodyKey,vars)),icon:'icons/icon-192.png',tag:'kongi-room'});
      n.onclick=()=>{window.focus();n.close()};
    }
  }catch(e){}
}

function start(sec,demo,opts){
  opts=opts||{};
  clearTimeout(afterTimer);
  run={state:'focus',endAt:Date.now()+sec*1000,dur:sec,demo:!!demo,lap:lapMode,wakes:0,paused:false};
  if(opts.together){run.together=opts.together;run.endAt=opts.together.start+sec*1000}
  store.set('run',run);phase='idle';
  stage=0;awake=false;clearTimeout(resettleTimer);scene.classList.toggle('lap-on',lapMode);
  ensureAudio();wake();hush();bowl.dataset.level=0;
  catEl.classList.remove('petable');
  const wasSulking = isSulking || store.get('sulking', false);
  isSulking=false;store.del('sulking');sulkPets=0;
  renderFriend();
  if(wasSulking){
    moveCat('sofa','stretch',1);
    say(t('start.sulkSay'), 2400);
    hearts(3);
    caption('start.sulkCap');
    setStatus(demo?'start.sulkStatusDemo':'start.sulkStatus');
    setTimeout(()=>{ if(run&&run.state==='focus'&&stage===0) setStage(1); }, 2400);
  } else {
    setStage(1);
  }
  if(demo)toast(t('demo.toast'),3600);
  renderPause();show('focus');renderStages();tick();scheduleIdle();
  // on a phone, bring Kongi back into view: the room picture on top, the timer right below it
  if(innerWidth<=720){try{scene.scrollIntoView({block:'start',behavior:reduced()?'auto':'smooth'})}catch(e){}}
}
function pauseRun(auto){
  if(!run||run.state!=='focus'||run.paused)return false;
  run.pausedRemain=Math.max(0,run.endAt-Date.now());run.paused=true;run.autoPaused=!!auto;store.set('run',run);
  clearTimeout(idleTimer);stopPurr();catEl.classList.remove('loaf','purring');
  if(!auto){
    if(run.lap){setLapView(false)}
    moveCat(run.lap?'lap':'sofa','sit',1);say(t('pause.say'),2400);setTag('tag.waiting');setStatus('pause.status');
  }
  renderPause();tick();return true;
}
function resumeRun(){
  if(!run||run.state!=='focus'||!run.paused)return;
  run.endAt=Date.now()+(run.pausedRemain|0);run.paused=false;run.autoPaused=false;delete run.pausedRemain;store.set('run',run);
  awake=false;const p=1-remainOf()/(run.dur*1000);stage=0;setStage(stageFor(p));
  say(t('resume.say'),1800);renderPause();scheduleIdle();tick();
}
function renderPause(){
  const pb=$('#pauseBtn');if(!pb)return;
  const paused=!!(run&&run.paused&&!run.autoPaused);
  pb.textContent=paused?t('resume'):t('pause');pb.classList.toggle('resume',paused);
  $('#pausedNote').hidden=!paused;
  $('#clock').classList.toggle('paused',!!(run&&run.paused));
}
function enterWait(){phase='wait';clearTimeout(idleTimer);stopPurr();setLapView(false);
  moveCat('bowl','wait',1).then(()=>{if(phase==='wait'||phase==='done')say('…')});setTag('tag.waitBowl');
  setStatus(run.demo?'wait.demo':'wait.full')}

// Record a finished focus right away (not only after the treat), so today's numbers update immediately.
function recordFocus(r,kind){
  if(!r||r.recorded)return null;
  r.recorded=true;store.set('run',r);
  const sec=kind==='stop'?elapsedSec(r):r.dur;
  const demo=!!r.demo;
  let xp=0;
  if(kind==='stop'){
    // under a minute (or a demo) nothing is kept, as the stop dialog says
    if(demo||sec<XP_RULE.stopMinSec)return {sec:0,xp:0,demo};
    log.items.push({type:'stop',sec,min:Math.floor(sec/60),demo});
    xp=CORE.xpForStop(sec);STATS.add({sec});
  }else{
    log.items.push({type:'done',sec,min:demo?0:Math.round(sec/60),demo,lap:!!r.lap,wakes:r.wakes|0});
    if(demo)STATS.add({demos:1});
    else{xp=xpForFocus(sec,true,false);STATS.add({sec,sessions:1});bumpStreak();cycleSet(cycleGet().n+1)}
    recordAlbum(r);
  }
  store.set('log',log);
  if(xp>0)addIntimacy(xp);
  renderLog();renderStatus();
  const g=goalGet(),tt=todayTotals();
  if(kind!=='stop'&&!demo&&g&&tt.sessions===g)setTimeout(()=>{say(t('goal.doneSay'),3600);celebrate();hearts(6);toast(t('goal.doneToast'),4000)},2600);
  return {sec,xp,demo};
}
let afterTimer=null;
function complete(withSound){
  clearTimeout(idleTimer);clearTimeout(resettleTimer);awake=false;
  const wasDemo=!!run.demo;
  run.state='done';run.paused=false;store.set('run',run);phase='done';setLapView(false);
  const res=recordFocus(run,'done')||{sec:run.dur,xp:0,demo:wasDemo};
  if(withSound)notify('nt.focusTitle','nt.focusBody',{m:Math.round(run.dur/60)});
  const greet=withSound&&!reduced();
  if(greet)setStage(4);
  setTimeout(()=>{
    scene.classList.remove('lap-on');stage=0;renderStages();
    moveCat('bowl','wait',1).then(()=>{if(phase==='done')say('!')});
    caption('done.cap');setTag('tag.waitBowl');
  },greet?2200:0);
  setT('#doneMsg','done.msg');
  setT('#doneReward',res.demo?'reward.demo':'reward.real',{t:{dur:res.sec},xp:res.xp});
  if(greet)caption('stage.finishCap');else caption('done.cap');
  run.autoAt=(!wasDemo&&pomo.autoBreak)?Date.now()+15000:0;store.set('run',run);
  $('#autoNote').textContent='';
  show('done');
}
async function giveTreat(){
  const btn=$('#treatBtn');btn.disabled=true;hush();phase='eating';
  if(run)run.autoAt=0;
  $('#autoNote').textContent='';
  try{
    await sleep(350);
    if(bowl)bowl.dataset.level=3;
    await moveCat('eat','eat',1);
    caption('eat.cap');setTag('tag.eating');
    for(let lv=3;lv>0;lv--){
      for(let k=0;k<3;k++){await sleep(320);crunch();if(k===1)crumbs();}
      if(bowl)bowl.dataset.level=lv-1;
    }
    await sleep(200);
    setPose('lick');caption('eat.lick');hearts(3);
    const wasDemo = !!(run && run.demo);
    const sessionMin = wasDemo ? 0 : Math.round((run?run.dur:30)/60);
    if(run&&!run.recorded)recordFocus(run,'done');
    if(!wasDemo)addIntimacy(XP_RULE.treat);
    checkTreasureReward(sessionMin, wasDemo);
    const auto=!wasDemo&&pomo.autoBreak;
    run=null;store.del('run');phase='idle';
    setT('#afterMsg',wasDemo?'after.msgDemo2':'after.msg');
    $('#autoNoteA').textContent='';
    show('after');
    if(auto){run={state:'after',autoAt:Date.now()+6000,dur:0,endAt:0};}
    say(t('after.bragBubble'), 4200);
    hearts(3);
    await sleep(1500);
    if(run&&run.state!=='after') return;
    setPose('groom');caption('groom.cap');hearts(4);setTag('tag.groom');
    await sleep(2000);
    if(run&&run.state!=='after') return;
    const curLv = getLevelInfo(getIntimacy().xp).level;
    if(curLv >= 3 && Math.random() < 0.45){
      await moveCat('rug','belly',1);
      caption('after.belly');setTag('tag.belly');
    } else if(curLv >= 2 && Math.random() < 0.45){
      await moveCat('desk','desk',-1);
      caption('after.desk');setTag('tag.desk');
    } else {
      await moveCat('sofa','sleep',1);
      caption('after.sofa');setTag('tag.sleep');
    }
  }catch(e){
    console.error('giveTreat error:', e);
    show('after');
  }finally{
    btn.disabled=false;
  }
}
function startBreak(sec){
  const long=nextIsLong();
  if(long)cycleSet(0);
  run={state:'break',endAt:Date.now()+sec*1000,dur:sec,demo:false,long};store.set('run',run);
  moveCat('rug','sit',-1);catEl.classList.add('petable');setTag('tag.break');
  setT('#breakStatus',long?'break.statusLong':'break.status');caption('break.cap');
  $('#autoNoteB').textContent=pomo.autoFocus?fill(t('auto.focusAfter',{m:focusMin()})):'';
  show('break');tick();
}
function focusMin(){let v=parseInt($('#customMin').value,10);if(!(v>=5))v=25;return Math.min(180,v)}
function endBreak(timeUp){
  catEl.classList.remove('petable');hush();
  run=null;store.del('run');
  if(timeUp)notify('nt.breakTitle','nt.breakBody',{m:focusMin()});
  moveCat('sofa','lie',1);caption('break.endCap');setTag(null);
  if(timeUp&&pomo.autoFocus){start(focusMin()*60,false);return}
  setT('#setupMsg','break.endMsg');
  show('setup');
}
function doStop(){
  const elapsed=elapsedSec();
  $('#stopModal').hidden=true;
  if(run&&run.state==='focus'&&run.lap&&!awake){wakeCat(true);setTimeout(()=>finishStop(elapsed),1100);return}
  finishStop(elapsed);
}
function finishStop(elapsed){
  clearTimeout(idleTimer);clearTimeout(resettleTimer);awake=false;stopPurr();catEl.classList.remove('loaf','purring');scene.classList.remove('lap-on');setLapView(false);stage=0;renderStages();
  const r=run;const res=r?recordFocus(r,'stop'):null;
  run=null;store.del('run');phase='idle';hush();
  isSulking=true;store.set('sulking',true);sulkPets=0;
  caption('stop.walk');
  const id=moveId+1;
  moveCat('sofa','back',1).then(()=>{
    if(moveId!==id)return;
    clearTimeout(lookTimer);
    say(t('stop.say'), 2800);emote('💢');
    catEl.classList.add('petable');
    caption('stop.cap');setTag('tag.sulk');
  });
  if(res&&!res.demo&&res.sec>0)setT('#setupMsg','stop.saved',{t:{dur:res.sec},xp:res.xp});
  else setT('#setupMsg','stop.msg');
  show('setup');
}

const BOOK=['#b2574f','#4f6d8a','#7a8a4f','#c9933e','#6a5a8a','#8a5a3c'];
function renderLog(){
  const tt=todayTotals();
  const ls=$('#logSum');
  if(ls){const parts=[];if(tt.sec>0)parts.push(t('log.todayT',{t:fmtDur(tt.sec)}));if(tt.sessions)parts.push(sessionsOf(tt.sessions));if(tt.stops)parts.push(t('st.parts',{n:tt.stops}));if(tt.demos)parts.push(t('st.demos',{n:tt.demos}));ls.textContent=parts.join(' · ')}
  const it=$('#logItems');
  if(it){
    it.innerHTML='';
    log.items.forEach((x,i)=>{
      const d=document.createElement('span');
      const sec=typeof x.sec==='number'?x.sec:(x.min|0)*60;
      if(x.type==='done'&&!x.demo){
        d.className='lg-book';
        d.style.background=BOOK[i%BOOK.length];
        d.title=t('log.doneTitle2',{t:fmtDur(sec)});
      }else if(x.type==='done'){
        d.className='lg-demo';d.textContent='🐾';
        d.title=t('log.demoTitle');
      }else{
        d.className='lg-stop';
        d.title=t('log.stopTitle2',{t:fmtDur(sec)});
      }
      it.appendChild(d);
    });
  }
  const le=$('#logEmpty');if(le)le.hidden=log.items.length>0;
  renderStatus();
}

function tod(){const o=store.get('tod','auto');if(o!=='auto')return o;const h=new Date().getHours();
  return h>=6&&h<10?'morning':h<17?'day':h<20?'sunset':'night'}
function applyTod(){const v=tod();const changed=!scene.classList.contains('t-'+v);scene.classList.remove('t-morning','t-day','t-sunset','t-night');scene.classList.add('t-'+v);document.body.dataset.tod=v;if(changed&&typeof followSound==='function'&&applyTod.ready)followSound();applyTod.ready=true}
setInterval(applyTod,60000);

function shareStats(){
  const tt=todayTotals();
  const done=log.items.filter(i=>i.type==='done'&&!i.demo);
  const ld=done.length?done[done.length-1]:null;
  return {sessions:tt.sessions,mins:Math.floor(tt.sec/60),sec:tt.sec,last:ld?ld.min:0,lastLap:!!(ld&&ld.lap),lastWakes:ld?(ld.wakes|0):0,stops:tt.stops};
}
function cardData(){
  const st=shareStats();
  return Object.assign({canvas:$('#card'),tod:tod(),rain:scene.classList.contains('rainy'),theme:curTheme,shelf:getShelfItems(),name:dname(),date:new Date(),level:getLevelInfo(getIntimacy().xp)},st);
}
const IMG_CACHE={};
function loadImg(src){if(!IMG_CACHE[src])IMG_CACHE[src]=new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src=src});return IMG_CACHE[src]}
// Loads the real room art, Kongi and the bowl before the card is drawn.
async function prepCard(data){
  const [room,cat,bowlI]=await Promise.all([loadImg(roomSrc({theme:data.theme||'room',tod:data.tod,rain:data.rain})),loadImg(data.sessions?SPRITES.sleep:SPRITES.sit),loadImg('assets/pixel_bowl.png')]);
  data.imgs={room,cat,bowl:bowlI};return data;
}
function withFonts(fn){return (document.fonts&&document.fonts.ready?document.fonts.ready:Promise.resolve()).then(fn,fn)}
function drawCard(data){
  data=data||cardData();
  const c=data.canvas,x=c.getContext('2d'),W=1080,H=1920,todv=data.tod;
  const P={morning:['#f8ead2','#efd6b4'],day:['#f4e6cf','#e8d0ad'],sunset:['#f3d6bb','#dfae86'],night:['#3a2c2a','#221a1a']}[todv]||['#f4e6cf','#e8d0ad'];
  const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,P[0]);g.addColorStop(1,P[1]);x.fillStyle=g;x.fillRect(0,0,W,H);
  const dark=todv==='night';const ink=dark?'#f5e8d6':'#3a2a20',mut=dark?'#c9b6a2':'#8a6f5a',acc=dark?'#f0a462':'#b5612f';
  const ff='"Gowun Dodum","Apple SD Gothic Neo","Noto Sans KR",sans-serif';
  const name=data.name||dname(),sessions=Math.max(0,data.sessions|0);
  const sec=typeof data.sec==='number'?data.sec:(data.mins|0)*60;
  // header
  x.textAlign='center';x.fillStyle=mut;x.font='400 42px '+ff;x.fillText(fmtDate(data.date||new Date()),W/2,190);
  x.fillStyle=ink;x.font='400 128px '+ff;
  const big=data.last?t('card.done',{m:data.last}):(sec>0?fmtDur(sec):t('card.startBig'));
  x.fillText(big,W/2,330);
  // the room picture
  const rx=60,ry=410,rw=960,rh=600;
  x.save();x.beginPath();x.roundRect(rx,ry,rw,rh,36);x.clip();
  const im=data.imgs||{};
  if(im.room){x.imageSmoothingEnabled=false;x.drawImage(im.room,rx,ry,rw,rh)}else{x.fillStyle='#6b4a36';x.fillRect(rx,ry,rw,rh)}
  if(im.bowl){const bw=rw*.08;x.drawImage(im.bowl,rx+rw*.475,ry+rh*(1-.065)-bw*im.bowl.naturalHeight/im.bowl.naturalWidth,bw,bw*im.bowl.naturalHeight/im.bowl.naturalWidth)}
  if(im.cat){const isRoom=(data.theme||'room')==='room';const cw=rw*.2,chh=cw*im.cat.naturalHeight/im.cat.naturalWidth;const cx=rx+rw*(isRoom?.175:.4),cy=ry+rh*(1-(isRoom?.265:.075))-chh;x.drawImage(im.cat,cx,cy,cw,chh)}
  if(dark&&!im.room){x.fillStyle='rgba(15,10,40,.22)';x.fillRect(rx,ry,rw,rh)}
  x.restore();
  x.strokeStyle=dark?'rgba(255,230,200,.25)':'rgba(120,80,50,.25)';x.lineWidth=4;x.beginPath();x.roundRect(rx,ry,rw,rh,36);x.stroke();
  // treasures, books and empty bowls under the picture
  const shItems=(data.shelf||[]).slice(-6);
  let y=1080;
  x.font='52px sans-serif';x.textAlign='center';
  if(shItems.length){shItems.forEach((it,i)=>x.fillText(it.icon,W/2+(i-(shItems.length-1)/2)*72,y+30));y+=70}
  const nb=Math.min(sessions,14);
  if(nb){const bw=34,gap=10,total=nb*bw+(nb-1)*gap;let bx=W/2-total/2;
    for(let i=0;i<nb;i++){x.fillStyle=BOOK[i%BOOK.length];const bh=120+((i*37)%5)*8;x.beginPath();x.roundRect(bx,y+150-bh,bw,bh,6);x.fill();x.fillStyle='rgba(0,0,0,.15)';x.fillRect(bx,y+150-bh+bh*.2,bw,8);bx+=bw+gap}
    x.fillStyle=dark?'#7a5a44':'#8a5a3c';x.fillRect(W/2-total/2-30,y+150,total+60,14);y+=200}
  x.textAlign='center';x.fillStyle=ink;x.font='400 54px '+ff;
  x.fillText(sessions?t('card.cum2',{t:fmtDur(sec),s:sessionsOf(sessions)}):(sec>0?t('card.partOnly',{t:fmtDur(sec)}):fill(t('card.invite')).replace(/\{N\}/g,name)),W/2,y+40);
  x.fillStyle=mut;x.font='400 40px '+ff;
  const stops=data.stops|0;
  x.fillText(sessions?(t('card.bowls',{n:sessions})+(stops?' · '+t('st.parts',{n:stops}):'')):t('card.noStops2'),W/2,y+110);
  if(data.lastLap&&data.last){x.fillStyle=ink;x.font='400 40px '+ff;x.fillText('🛏️ '+fill(data.lastWakes?t('lap.wakes',{n:data.lastWakes}):t('lap.noWake')),W/2,y+180)}
  const stk=(data.streak!=null)?data.streak:STREAK.valid();
  const lvl=data.level;
  const chips=[];if(lvl)chips.push(lvl.icon+' Lv.'+lvl.level+' '+t(lvl.name));if(stk>=1)chips.push('🔥 '+t('st.streak',{n:stk}));
  if(chips.length){x.font='700 40px '+ff;const txt=chips.join('   ');const tw=x.measureText(txt).width+64;x.fillStyle=dark?'rgba(255,240,220,.12)':'rgba(255,250,240,.75)';x.beginPath();x.roundRect(W/2-tw/2,1640,tw,80,40);x.fill();x.fillStyle=acc;x.fillText(txt,W/2,1694)}
  x.font='400 40px '+ff;x.fillStyle=mut;x.fillText(t('title.room').replace('{N}',name)+' · '+t('tagline'),W/2,1830);
}

function resultUrl(st){
  const p=new URLSearchParams({s:st.sessions,m:st.mins,l:st.last,n:petName,t:tod(),d:todayKey().replace(/-/g,'')});
  if(lang!=='ko')p.set('lang',lang);
  return (RESULT_BASE||SITE_URL)+'?'+p.toString();
}
function shareLine(st){
  if(st.lastLap&&st.last&&!st.lastWakes)return fill(t('share.lapLine',{m:st.last}));
  const what=st.last?t('what.done',{m:st.last}):(st.sessions?t('what.focus',{t:tstrOf(st.mins)}):t('what.start'));
  return fill(t('share.line',{what}));
}
let sheetCtx=null;
function canvasBlob(c){return new Promise(r=>{try{c.toBlob(b=>r(b),'image/png')}catch(e){r(null)}})}
async function openShareSheet(ctx){
  sheetCtx=ctx;
  $('#sheetLine').textContent=ctx.text;
  drawPreview(ctx.canvas);
  $('#shNative').hidden=!navigator.share;
  const grid=$('#shareGrid');
  if(IN_APP){grid.prepend($('#shCopyText'));grid.prepend($('#shCopy'));$('#sheetHint').textContent=t('sheet.hintInApp')}
  else $('#sheetHint').textContent=navigator.share?t('sheet.hintNative'):t('sheet.hintCopy');
  $('#shareSheet').hidden=false;
}
async function copyText(txt,msg){
  try{await navigator.clipboard.writeText(txt);toast(msg||t('toast.copied'))}
  catch(e){const ta=document.createElement('textarea');ta.value=txt;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');toast(msg||t('toast.copied'))}catch(_){toast(t('toast.copyBlocked'))}ta.remove()}
}
async function shareNative(){
  if(!sheetCtx)return;
  const data={title:sheetCtx.title,text:sheetCtx.text+'\n'+sheetCtx.url,url:sheetCtx.url};
  try{
    const blob=await canvasBlob(sheetCtx.canvas);
    if(blob&&navigator.canShare){const file=new File([blob],sheetCtx.fileName||'kongi-room.png',{type:'image/png'});if(navigator.canShare({files:[file]}))data.files=[file]}
    await navigator.share(data);
  }catch(e){if(e&&e.name!=='AbortError'){copyText(sheetCtx.text+'\n'+sheetCtx.url,t('toast.shareFallback'))}}
}
function saveImage(canvas,name){
  try{const a=document.createElement('a');a.download=name;a.href=canvas.toDataURL('image/png');document.body.appendChild(a);a.click();a.remove();toast(IN_APP?t('toast.savedInApp'):t('toast.saved'))}
  catch(e){toast(t('toast.saveHint'))}
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
    try{const K=await loadKakao();K.Share.sendDefault({objectType:'feed',content:{title:sheetCtx.title,description:sheetCtx.text,imageUrl:SITE_URL+'assets/og.jpg',link:{mobileWebUrl:sheetCtx.url,webUrl:sheetCtx.url}},buttons:[{title:t('kakao.btn'),link:{mobileWebUrl:sheetCtx.url,webUrl:sheetCtx.url}}]});return}catch(e){}
  }
  if(navigator.share){return shareNative()}
  copyText(sheetCtx.text+'\n'+sheetCtx.url,t('toast.kakaoCopy'));
}
function openResultView(){
  const q=new URLSearchParams(location.search);
  if(!q.has('s'))return false;
  if(LANGS.includes(q.get('lang'))&&store.get('lang',null)==null){lang=q.get('lang');applyLang()}
  const st={sessions:Math.max(0,parseInt(q.get('s'),10)||0),mins:Math.max(0,parseInt(q.get('m'),10)||0),last:Math.max(0,parseInt(q.get('l'),10)||0),stops:0};
  const name=((q.get('n')||'콩이').replace(/[<>]/g,'').slice(0,6)||'콩이').replace(/^콩이$/,dname());
  const todq=['morning','day','sunset','night'].includes(q.get('t'))?q.get('t'):'day';
  let date=new Date();const dm=/^(\d{4})(\d{2})(\d{2})$/.exec(q.get('d')||'');if(dm)date=new Date(+dm[1],+dm[2]-1,+dm[3]);
  const what=st.last?t('result.whatDone',{m:st.last}):(st.sessions?t('result.whatFocus',{t:tstrOf(st.mins)}):t('result.whatPlain'));
  const nm=s=>s.replace('{N와}',josa(name,'과','와')).replace('{N가}',josa(name,'이','가')).replace(/\{N\}/g,name);
  $('#resultTitle').textContent=nm(t('result.title'));
  $('#resultLine').textContent=nm(t('result.line',{what,t:tstrOf(st.mins),s:sessionsOf(st.sessions)}));
  document.title=t('result.docTitle');
  const cd=Object.assign({canvas:$('#resultCard'),tod:todq,rain:false,theme:'room',shelf:[],streak:0,name,date,sec:st.mins*60},st);
  withFonts(()=>prepCard(cd)).then(()=>drawCard(cd));
  $('#resultModal').hidden=false;
  const leave=()=>{history.replaceState(null,'',location.pathname);$('#resultModal').hidden=true};
  $('#resultTry').onclick=()=>{leave();start(30,true)};
  $('#resultClose').onclick=leave;
  return true;
}

$$('.chip:not(.pchip)').forEach(b=>b.addEventListener('click',()=>{$$('.chip:not(.pchip)').forEach(c=>c.setAttribute('aria-pressed','false'));b.setAttribute('aria-pressed','true');$('#customMin').value=b.dataset.min}));
$('#customMin').addEventListener('input',e=>{$$('.chip:not(.pchip)').forEach(c=>c.setAttribute('aria-pressed',String(+c.dataset.min===+e.target.value)))});
$('#startBtn').addEventListener('click',()=>{let v=parseInt($('#customMin').value,10);if(!(v>=5)){v=5;$('#customMin').value=5}if(v>180){v=180;$('#customMin').value=180}start(v*60,false)});
$('#demoBtn').addEventListener('click',()=>start(30,true));
// Stopping first pauses the timer, so the clock doesn't keep running behind the dialog.
$('#stopBtn').addEventListener('click',()=>{pauseRun(true);setT('#stopMsg',run&&!run.demo&&elapsedSec()>=60?'stop.confirm2':'stop.confirmShort',{t:{dur:elapsedSec()}});$('#stopModal').hidden=false;$('#keepBtn').focus()});
$('#keepBtn').addEventListener('click',()=>{$('#stopModal').hidden=true;if(run&&run.autoPaused)resumeRun()});
$('#confirmStop').addEventListener('click',doStop);
$('#pauseBtn').addEventListener('click',()=>{if(run&&run.paused)resumeRun();else pauseRun(false)});
$('#treatBtn').addEventListener('click',()=>{ensureAudio();giveTreat()});
$('#breakBtn').addEventListener('click',()=>startBreak(nextBreakMin()*60));
$('#nextBtn').addEventListener('click',()=>{if(run&&run.state==='after')run=null;setT('#setupMsg','next.msg');show('setup');$('#startBtn').focus()});
$('#skipBreak').addEventListener('click',()=>endBreak(false));
function petXpOk(){const k='petXp',d=store.get(k,null),n=(d&&d.date===todayKey())?d.n:0;if(n>=XP_RULE.petPerDay)return false;store.set(k,{date:todayKey(),n:n+2});return true}
catEl.addEventListener('click',()=>{
  const p = catEl.dataset.pose;
  if(run&&run.state==='focus'&&!run.paused){
    hearts(2);say(t('click.focusSay'),1500);
    caption('click.focusCap');return;
  }
  if(!run && isSulking){
    sulkPets++;
    if(sulkPets>=3){ // forgiven: turns around, looks at you
      isSulking=false;store.del('sulking');sulkPets=0;
      moveCat('sofa','sit',1).then(()=>{say(t('click.forgiveSay'),2400);hearts(5);setTag('tag.eye');eyeContact()});
      caption('click.forgiveCap');return;
    }
    hearts(1);say(t('click.sulkSay'),1600);emote('😾');
    setT('#caption',null);caption('click.sulkCap2',{n:3-sulkPets});return;
  }
  if(p === 'desk'){
    hearts(3);say(t('click.deskSay'), 1800);
    caption('click.deskCap');
  } else if(p === 'belly'){
    hearts(4);say(t('click.bellySay'), 2000);
    caption('click.bellyCap');
  } else if(run&&run.state==='break'){
    hearts(3);say(t('click.breakSay'),1500);
    if(catEl.dataset.pose==='sit'){setPose('lie');clearTimeout(catEl.p);catEl.p=setTimeout(()=>{if(run&&run.state==='break')setPose('sit')},2400)}
  } else {
    hearts(3);say(t('click.eyeSay'),2200);
    caption('click.eyeCap');
  }
  eyeContact();setTag('tag.eye');
  if(petXpOk())addIntimacy(2);
});
// Petting: Kongi turns to you, looks you in the eye and slow-blinks.
function eyeContact(){if(reduced())return;catEl.classList.remove('eyecontact');void catEl.offsetWidth;catEl.classList.add('eyecontact');setTimeout(()=>catEl.classList.remove('eyecontact'),1600);emote('💛')}

// Room hotspots: every one shows a visible reaction (ripple + Kongi reacts), some open a panel.
function hsReact(el,icons){
  if(!el)return;el.classList.remove('hit');void el.offsetWidth;el.classList.add('hit');
  const r=el.getBoundingClientRect(),sr=scene.getBoundingClientRect();
  (icons||['✨']).forEach((ch,i)=>{const s=document.createElement('span');s.className='hs-pop';s.textContent=ch;
    s.style.left=((r.left-sr.left+r.width/2)/sr.width*100)+'%';s.style.top=((r.top-sr.top)/sr.height*100)+'%';s.style.setProperty('--dx',(i*2.4-1.2)+'cqw');s.style.animationDelay=(i*90)+'ms';
    scene.appendChild(s);setTimeout(()=>s.remove(),1400)});
}
function catNotice(spot,face){if(run&&run.state==='focus')return Promise.resolve();return moveCat(spot,'sit',face)}
$('#petName').value=petName;
const sizeName=()=>{const i=$('#petName');if(!i)return;let m=$('#petNameMirror');if(!m){m=document.createElement('span');m.id='petNameMirror';m.setAttribute('aria-hidden','true');Object.assign(m.style,{position:'absolute',visibility:'hidden',whiteSpace:'pre',pointerEvents:'none',left:'-9999px',top:'0'});i.parentNode.appendChild(m)}const cs=getComputedStyle(i);m.style.font=cs.font;m.style.letterSpacing=cs.letterSpacing;m.textContent=i.value||'콩이';i.style.width=Math.ceil(m.getBoundingClientRect().width+2)+'px'};sizeName();$('#petName').addEventListener('input',sizeName);if(document.fonts&&document.fonts.ready)document.fonts.ready.then(sizeName,()=>{});window.addEventListener('load',sizeName);
$('#petName').addEventListener('change',e=>{const v=e.target.value.trim()||'콩이';petName=v;e.target.value=v;store.set('petName',v);renderLog();tick();if(lastCaption)caption(lastCaption.k,lastCaption.v)});
$('#todSel').value=store.get('tod','auto');
$('#todSel').addEventListener('change',e=>{store.set('tod',e.target.value);applyTod();caption('tod.cap',{d:t('tod.'+tod())})});
$('#shareBtn').addEventListener('click',()=>{const d=cardData();withFonts(()=>prepCard(d)).then(()=>{drawCard(d);$('#shareModal').hidden=false})});
function openDayShare(){const d=cardData();withFonts(()=>prepCard(d)).then(()=>{drawCard(d);const st=shareStats();openShareSheet({canvas:$('#card'),title:roomTitle(),text:shareLine(st),url:resultUrl(st),fileName:'kongi-room-'+todayKey()+'.png'})})}
$('#openShareBtn').addEventListener('click',openDayShare);
$('#afterShareBtn').addEventListener('click',openDayShare);
$('#shareCardBtn').addEventListener('click',()=>{$('#shareModal').hidden=true;openDayShare()});
$('#closeSheet').addEventListener('click',()=>{$('#shareSheet').hidden=true});
$('#shNative').addEventListener('click',shareNative);
$('#shCopy').addEventListener('click',()=>{if(sheetCtx)copyText(sheetCtx.url,t('toast.linkCopied'))});
$('#shCopyText').addEventListener('click',()=>{if(sheetCtx)copyText(sheetCtx.text+'\n'+sheetCtx.url,t('toast.textCopied'))});
$('#shKakao').addEventListener('click',shareKakao);
const waUrl=txt=>'https://wa.me/?text='+encodeURIComponent(txt);
$('#shWhatsApp').addEventListener('click',()=>{if(!sheetCtx)return;window.open(waUrl(sheetCtx.text+'\n'+sheetCtx.url),'_blank','noopener')});
$('#shX').addEventListener('click',()=>{if(!sheetCtx)return;window.open('https://x.com/intent/post?text='+encodeURIComponent(sheetCtx.text)+'&url='+encodeURIComponent(sheetCtx.url),'_blank','noopener')});
$('#shThreads').addEventListener('click',()=>{if(!sheetCtx)return;window.open('https://www.threads.net/intent/post?text='+encodeURIComponent(sheetCtx.text+'\n'+sheetCtx.url),'_blank','noopener')});
$('#shSave').addEventListener('click',()=>{if(sheetCtx)saveImage(sheetCtx.canvas,sheetCtx.fileName||'kongi-room.png')});
$('#sharePolaroidBtn').addEventListener('click',()=>{if(!currentPolaroidItem)return;const it=currentPolaroidItem;const st=shareStats();
  openShareSheet({canvas:$('#polaroidCanvas'),title:roomTitle(),text:fill(t('pol.shareText',{d:it.demo?t('demoShort'):t('minShort',{m:it.min}),memo:it.memo?'"'+it.memo+'" ':''})),url:resultUrl(st),fileName:'kongi-room-polaroid.png'})});
$('#closeShare').addEventListener('click',()=>{$('#shareModal').hidden=true});
$('#rainBtn').addEventListener('click',()=>toggleRain());
$('#closeRadio').addEventListener('click',()=>{$('#radioModal').hidden=true});
$$('.mix-range').forEach(r=>{r.value=Math.round((mix[r.dataset.mix]||0)*100);const l=$('.mix-val[data-mix="'+r.dataset.mix+'"]');if(l)l.textContent=r.value+'%';
  r.addEventListener('input',e=>mixSet(r.dataset.mix,e.target.value/100,{fromUi:true}))});
$$('[data-preset]').forEach(b=>b.addEventListener('click',()=>mixPreset(b.dataset.preset)));
const mixKick=()=>{if(MIX_IDS.some(id=>mix[id]>0))ensureAudio()};
window.addEventListener('pointerdown',mixKick,{once:true});window.addEventListener('keydown',mixKick,{once:true});

function openMixer(){renderSoundNow();$('#radioModal').hidden=false;ensureAudio()}
$('#hotspotRadio').addEventListener('click',e=>{hsReact(e.currentTarget,['🎵','🎶']);if(!(run&&run.state==='focus'))say(t('radio.say'),1800);setTimeout(openMixer,260)});
$('#soundBtn').addEventListener('click',openMixer);
$('#hotspotBook').addEventListener('click',e=>{hsReact(e.currentTarget,['📖']);setTimeout(()=>{$('#toolsModal').hidden=false},260)});
$('#closeTools').addEventListener('click',()=>{$('#toolsModal').hidden=true});
$('#hotspotCoffee').addEventListener('click',e=>{
  hsReact(e.currentTarget,['☁️','☕']);
  say(t('coffee.say'), 2600);hearts(2);
  caption('coffee.cap');
});
$('#hotspotPlant').addEventListener('click',e=>{
  hsReact(e.currentTarget,['🌱','✨','🍃']);
  catNotice('win',1).then(()=>{say(t('plant.say'), 2200);hearts(2);setTag('tag.curious')});
  caption('plant.cap');
});
$('#hotspotBowl').addEventListener('click',e=>{
  hsReact(e.currentTarget,['🍚']);
  if(ui==='done'){$('#treatBtn').click();return}
  if(run&&run.state==='focus'){say(t('bowl.focusSay'),2200);caption('bowl.focusCap');return}
  catNotice('bowl',1).then(()=>{say(t('bowl.say'),2400);emote('👀');setTag('tag.waitBowl');caption('bowl.cap')});
});
$('#shelf').addEventListener('click',e=>{hsReact(e.currentTarget,['🏆','✨']);setTimeout(showShelfModal,260)});
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

$('#polTabClassic').addEventListener('click', () => setPolStyle('classic'));
$('#polTabEssay').addEventListener('click', () => setPolStyle('essay'));
$('#polPlaceInput').addEventListener('input', (e) => {
  const v = e.target.value.trim().slice(0, 24);
  store.set('place', v);
  if (currentPolaroidItem) {
    currentPolaroidItem.place = v;
    const album = store.get('album', []);
    if (album[currentPolaroidIndex]) { album[currentPolaroidIndex].place = v; store.set('album', album); }
    drawPolaroidCanvas(currentPolaroidItem);
  }
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
    alert(t('pol.alertSave'));
  }
});

$('#copyPolaroidTextBtn').addEventListener('click', () => {
  if (!currentPolaroidItem) return;
  const it = currentPolaroidItem;
  const memoLine = it.memo ? t('pol.memoLine',{memo:it.memo}) : '';
  const text = fill(t('pol.copyText',{d:it.demo?t('demoShort'):t('minShort',{m:it.min}),q:quoteOf(it),memo:memoLine,url:SITE_URL}));
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      alert(t('pol.copied'));
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

// Escape or a tap on the dark backdrop closes whichever panel is open.
function closeModal(m){if(!m||m.hidden)return;m.hidden=true;if(m.id==='stopModal'&&run&&run.autoPaused)resumeRun();if(m.id==='joinModal')leaveJoin();if(m.id==='resultModal')history.replaceState(null,'',location.pathname)}
document.addEventListener('keydown',e=>{if(e.key==='Escape')$$('.modal').forEach(m=>{if(!m.hidden)closeModal(m)})});
$$('.modal').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)closeModal(m)}));

// ---- Kongi's room sound: each space and time of day has its own signature mix ----
const SPACE_SOUND={
  room:{base:{purr:0.45,clock:0.22},morning:{stream:0.3},day:{cafe:0.18},sunset:{wind:0.25},night:{crickets:0.45,fire:0.2}},
  library:{base:{clock:0.4,pencil:0.55,fire:0.25},morning:{},day:{},sunset:{},night:{rain:0.25}},
  greenhouse:{base:{rain:0.7,stream:0.3,cafe:0.25},morning:{},day:{},sunset:{},night:{thunder:0.3}},
  train:{base:{brown:0.5,wind:0.25,clock:0.15},morning:{},day:{},sunset:{},night:{rain:0.2}},
  cabin:{base:{fire:0.75,wind:0.45,purr:0.3},morning:{},day:{},sunset:{},night:{crickets:0.15}}
};
function spaceMix(){const S=SPACE_SOUND[curTheme]||SPACE_SOUND.room;return Object.assign({},S.base,S[tod()]||{})}
function applySpaceSound(){ensureAudio();const m=spaceMix();if(scene.classList.contains('rainy'))m.rain=Math.max(m.rain||0,0.5);MIX_IDS.forEach(id=>mixSet(id,m[id]||0));renderSoundNow();toast(t('snd.applied',{s:t('theme.'+curTheme+'.name'),d:t('tod.'+tod())}))}
function renderSoundNow(){
  const el=$('#sndNow');if(!el)return;
  const m=spaceMix(),ico={rain:'🌧️',thunder:'🌩️',waves:'🌊',stream:'🏞️',wind:'🍃',crickets:'🦗',purr:'🐱',fire:'🔥',clock:'🕰️',pencil:'✏️',cafe:'☕',brown:'🟤'};
  el.innerHTML=`<b>${esc(t('theme.'+curTheme+'.name'))} · ${esc(t('tod.'+tod()))}</b><span>${Object.keys(m).map(k=>ico[k]+' '+esc(t('mix.'+k))).join(' · ')}</span>`;
  const f=$('#sndFollow');if(f)f.checked=!!store.get('sndFollow',false);
}
$('#sndSpaceBtn').addEventListener('click',applySpaceSound);
$('#sndFollow').addEventListener('change',e=>{store.set('sndFollow',!!e.target.checked);if(e.target.checked)applySpaceSound()});
function followSound(){if(store.get('sndFollow',false)&&audioCtx)applySpaceSound()}

// ---- Pomodoro settings ----
function fillSel(sel,vals,cur,unit){const el=$(sel);if(!el)return;el.innerHTML=vals.map(v=>`<option value="${v}"${v===cur?' selected':''}>${esc(unit(v))}</option>`).join('')}
function renderPomoSet(){
  fillSel('#pmShort',[3,5,10,15],pomo.short,v=>t('minutes',{m:v}));
  fillSel('#pmLong',[10,15,20,30],pomo.long,v=>t('minutes',{m:v}));
  fillSel('#pmEvery',[2,3,4,5,6],pomo.every,v=>t('pomo.everyN',{n:v}));
  $('#pmAutoBreak').checked=!!pomo.autoBreak;$('#pmAutoFocus').checked=!!pomo.autoFocus;$('#pmSound').checked=!!pomo.sound;
  $('#pmNotify').checked=!!pomo.notify&&('Notification' in window)&&Notification.permission==='granted';
}
function savePomo(){store.set('pomo',pomo);renderCycle()}
$('#pmShort').addEventListener('change',e=>{pomo.short=+e.target.value;savePomo()});
$('#pmLong').addEventListener('change',e=>{pomo.long=+e.target.value;savePomo()});
$('#pmEvery').addEventListener('change',e=>{pomo.every=+e.target.value;savePomo()});
$('#pmAutoBreak').addEventListener('change',e=>{pomo.autoBreak=e.target.checked;savePomo()});
$('#pmAutoFocus').addEventListener('change',e=>{pomo.autoFocus=e.target.checked;savePomo()});
$('#pmSound').addEventListener('change',e=>{pomo.sound=e.target.checked;savePomo();if(pomo.sound){ensureAudio();chime()}});
$('#pmNotify').addEventListener('change',async e=>{
  if(!e.target.checked){pomo.notify=false;savePomo();return}
  if(!('Notification' in window)){e.target.checked=false;toast(t('pomo.noNotify'));return}
  let p=Notification.permission;if(p==='default'){try{p=await Notification.requestPermission()}catch(_){}}
  pomo.notify=p==='granted';e.target.checked=pomo.notify;savePomo();toast(pomo.notify?t('pomo.notifyOn'):t('pomo.notifyBlocked'));
});

// ---- Today's goal ----
$('#goalBtn').addEventListener('click',()=>{const g=goalGet();$('#goalChips').innerHTML=[1,2,3,4,6,8].map(n=>`<button class="chip" type="button" data-goal="${n}" aria-pressed="${n===g}">${esc(t('goal.n',{n}))}</button>`).join('');
  $$('[data-goal]').forEach(b=>b.addEventListener('click',()=>{goalSet(+b.dataset.goal);$('#goalModal').hidden=true;say(t('goal.setSay',{n:+b.dataset.goal}),2400);hearts(2)}));$('#goalModal').hidden=false});
$('#goalClose').addEventListener('click',()=>{$('#goalModal').hidden=true});
$('#unlockBtn').addEventListener('click',()=>{renderIntimacyModal();$('#intimacyModal').hidden=false});

// ---- In-app feedback (no GitHub account needed) ----
let fbKind='idea';
$$('[data-fb]').forEach(b=>b.addEventListener('click',()=>{fbKind=b.dataset.fb;$$('[data-fb]').forEach(c=>c.setAttribute('aria-pressed',String(c===b)))}));
$('#feedbackBtn').addEventListener('click',()=>{$('#feedbackModal').hidden=false;setTimeout(()=>$('#fbText').focus(),50)});
$('#fbClose').addEventListener('click',()=>{$('#feedbackModal').hidden=true});
// The mail link is the first channel (a static site has no inbox of its own); the in-app form posts to
// /api/feedback where that API exists and opens the mail app with the same text everywhere else.
const FEEDBACK_MAIL='hana.park86@outlook.com';
function fbMailto(){
  const text=$('#fbText').value.trim(),contact=$('#fbContact').value.trim(),kind=t('fb.'+fbKind);
  const body=[kind,'',text,'',contact,'— '+lang+' · '+innerWidth+'x'+innerHeight].filter(Boolean).join('\n');
  return 'mailto:'+FEEDBACK_MAIL+'?subject='+encodeURIComponent(t('foot.mailSubject')+' · '+kind)+'&body='+encodeURIComponent(body);
}
function openMail(href){const a=document.createElement('a');a.href=href;a.rel='noopener';document.body.appendChild(a);a.click();a.remove()}
$('#fbMail').addEventListener('click',()=>{
  const text=$('#fbText').value.trim();if(text.length<2){toast(t('fb.empty'));$('#fbText').focus();return}
  openMail(fbMailto());toast(t('fb.mailOpened'),3600);say(t('fb.say'),2400);hearts(3);
});
$('#fbSend').addEventListener('click',async()=>{
  const text=$('#fbText').value.trim();if(text.length<2){toast(t('fb.empty'));$('#fbText').focus();return}
  const btn=$('#fbSend');btn.disabled=true;
  const body={kind:fbKind,text,contact:$('#fbContact').value.trim(),lang,screen:innerWidth+'x'+innerHeight,lv:getLevelInfo(getIntimacy().xp).level};
  try{const r=await fetch('/api/feedback',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});if(!r.ok)throw new Error(r.status);
    $('#fbText').value='';$('#fbContact').value='';$('#feedbackModal').hidden=true;toast(t('fb.thanks'),3600);say(t('fb.say'),2400);hearts(3)}
  catch(e){const href=fbMailto();copyText(text,t('fb.failMail'));openMail(href)}
  finally{btn.disabled=false}
});

// ---- Backup: file export/import and a transfer code for another device ----
const BK_SKIP=new Set(['run']);
function snapshot(){const data={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(BK_SKIP.has(k))continue;data[k]=localStorage.getItem(k)}return {app:'kongi-room',v:1,at:new Date().toISOString(),data}}
function restore(snap){
  if(!snap||snap.app!=='kongi-room'||!snap.data)throw new Error('bad');
  if(!confirm(t('bk.confirm')))return false;
  Object.keys(snap.data).forEach(k=>{try{localStorage.setItem(k,snap.data[k])}catch(e){}});
  toast(t('bk.restored'));setTimeout(()=>location.reload(),900);return true;
}
function renderBackup(){const l=store.get('lastBackup',null);$('#bkLast').textContent=l?t('bk.lastAt',{d:new Date(l).toLocaleString(lang==='ko'?'ko-KR':lang==='de'?'de-DE':'en-US')}):t('bk.never');$('#bkCode').hidden=true}
function openBackup(){renderBackup();$('#backupModal').hidden=false}
$('#backupBtn').addEventListener('click',openBackup);$('#backupBtn2').addEventListener('click',openBackup);
$('#bkClose').addEventListener('click',()=>{$('#backupModal').hidden=true});
$('#bkExport').addEventListener('click',()=>{
  const blob=new Blob([JSON.stringify(snapshot(),null,1)],{type:'application/json'});const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);a.download='kongi-room-backup-'+todayKey()+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000);
  store.set('lastBackup',Date.now());renderBackup();toast(t('bk.exported'));
});
$('#bkFile').addEventListener('change',e=>{const f=e.target.files&&e.target.files[0];if(!f)return;const rd=new FileReader();
  rd.onload=()=>{try{restore(JSON.parse(rd.result))}catch(err){toast(t('bk.badFile'))}};rd.readAsText(f);e.target.value=''});
$('#bkMake').addEventListener('click',async()=>{
  const btn=$('#bkMake');btn.disabled=true;
  try{const r=await fetch('/api/backup',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(snapshot())});const j=await r.json();if(!r.ok||!j.code)throw new Error(j.error||r.status);
    const box=$('#bkCode');box.innerHTML=`<span>${esc(t('bk.yourCode'))}</span><b>${esc(j.code)}</b><small>${esc(t('bk.codeExp'))}</small>`;box.hidden=false;
    store.set('lastBackup',Date.now());copyText(j.code,t('bk.codeCopied'))}
  catch(e){toast(t('bk.codeFail'),3600)}
  finally{btn.disabled=false}
});
$('#bkLoad').addEventListener('click',async()=>{
  const code=$('#bkCodeIn').value.trim().toUpperCase().replace(/[^A-Z0-9]/g,'');if(code.length<8){toast(t('bk.codeShort'));return}
  try{const r=await fetch('/api/backup/'+code);if(!r.ok)throw new Error(r.status);restore(await r.json())}
  catch(e){toast(t('bk.codeNotFound'),3600)}
});

// ---- Focus together: a link that starts the same timer at the same moment for a friend ----
function renderFriend(){
  const fc=$('#friendCat');if(!fc)return;
  const tg=run&&run.together;
  fc.hidden=!(tg&&run.state==='focus');
  if(tg)$('#friendTag').textContent=t('tg.friendTag',{n:tg.name||t('tg.friend')});
}
$('#togetherBtn').addEventListener('click',()=>{const v=focusMin();const sel=$('#tgMin');if(![...sel.options].some(o=>+o.value===v)){const o=document.createElement('option');o.textContent=v;sel.appendChild(o)}sel.value=String(v);$('#tgInfo').textContent='';$('#togetherModal').hidden=false});
$('#tgClose').addEventListener('click',()=>{$('#togetherModal').hidden=true});
// Builds the shared-start link, closes the panel and starts this room's countdown; returns what to send.
function buildTogether(){
  const m=+$('#tgMin').value,delay=+$('#tgDelay').value;const startAt=Date.now()+delay*60000;
  const p=new URLSearchParams({tg:startAt.toString(36),tm:m,tn:dname()});if(lang!=='ko')p.set('lang',lang);
  const url=SITE_URL+'?'+p.toString();
  const hh=new Date(startAt);const at=pad(hh.getHours())+':'+pad(hh.getMinutes());
  const text=fill(t('tg.shareText',{m,at}));
  $('#togetherModal').hidden=true;
  scheduleTogether({start:startAt,m,name:t('tg.friends'),host:true});
  return {url,text};
}
$('#tgMake').addEventListener('click',async()=>{
  const {url,text}=buildTogether();
  try{if(navigator.share){await navigator.share({title:roomTitle(),text,url});}else{await copyText(text+'\n'+url,t('tg.copied'))}}catch(e){if(e&&e.name!=='AbortError')copyText(text+'\n'+url,t('tg.copied'))}
});
$('#tgWa').addEventListener('click',()=>{const {url,text}=buildTogether();window.open(waUrl(text+'\n'+url),'_blank','noopener')});
let joinTimer=null,joinInfo=null;
function leaveJoin(){clearInterval(joinTimer);joinTimer=null;if(joinInfo&&!joinInfo.started){joinInfo=null;history.replaceState(null,'',location.pathname)}}
// Shows a countdown until the shared start time, then starts the focus with the end time both people share.
function scheduleTogether(info){
  joinInfo=info;
  const endAt=info.start+info.m*60000;
  if(Date.now()>=endAt){toast(t('tg.over'),3600);history.replaceState(null,'',location.pathname);return}
  setT('#joinTitle',info.host?'tg.hostTitle':'tg.joinTitle',{n:info.name});
  const hh=new Date(info.start);setT('#joinLine','tg.joinLine',{m:info.m,at:pad(hh.getHours())+':'+pad(hh.getMinutes())});
  $('#joinGo').hidden=!!info.host;$('#joinModal').hidden=false;
  const go=()=>{clearInterval(joinTimer);joinTimer=null;$('#joinModal').hidden=true;info.started=true;history.replaceState(null,'',location.pathname);
    const left=Math.round((endAt-Date.now())/1000);start(info.m*60,false,{together:{start:info.start,name:info.name}});if(left<info.m*60)toast(t('tg.joinedLate',{t:fmtDur(info.m*60-left)}),3600);
    moveCat('sofa','sit',1);say(t('tg.startSay'),2600);hearts(4)};
  const upd=()=>{const ms=info.start-Date.now();if(ms<=0){if(info.host||info.accepted)go();else{$('#joinClock').textContent=t('tg.now')}return}$('#joinClock').textContent=fmt(ms)};
  clearInterval(joinTimer);joinTimer=setInterval(upd,250);upd();
  $('#joinGo').onclick=()=>{info.accepted=true;if(Date.now()>=info.start)go();else{$('#joinGo').hidden=true;setT('#joinLine','tg.waiting')}};
  $('#joinNo').onclick=()=>closeModal($('#joinModal'));
}
function openTogetherLink(){
  const q=new URLSearchParams(location.search);if(!q.has('tg'))return false;
  if(LANGS.includes(q.get('lang'))&&store.get('lang',null)==null){lang=q.get('lang');applyLang()}
  const st=parseInt(q.get('tg'),36),m=Math.min(180,Math.max(1,parseInt(q.get('tm'),10)||25));
  const name=(q.get('tn')||'').replace(/[<>]/g,'').slice(0,12)||t('tg.friend');
  if(!(st>0)){history.replaceState(null,'',location.pathname);return false}
  if(run&&run.state==='focus'){toast(t('tg.busy'),3600);history.replaceState(null,'',location.pathname);return true}
  scheduleTogether({start:st,m,name});return true;
}

// ---- Share card preview: a downscaled copy drawn on a small canvas (no image decoding, can't break) ----
function drawPreview(src){const pv=$('#sheetPreview');if(!pv||!src)return;const r=src.height/src.width;pv.width=338;pv.height=Math.round(338*r);const c=pv.getContext('2d');c.imageSmoothingQuality='high';try{c.drawImage(src,0,0,pv.width,pv.height)}catch(e){}}

function applyLang(){
  document.documentElement.lang=lang;hush();
  $$('[data-i18n]').forEach(el=>{el.textContent=t(el.dataset.i18n)});
  $$('[data-i18n-subject]').forEach(el=>{el.href=el.getAttribute('href').split('?')[0]+'?subject='+encodeURIComponent(t(el.dataset.i18nSubject))});
  $$('[data-i18n-title]').forEach(el=>{el.title=t(el.dataset.i18nTitle)});
  $$('[data-i18n-aria]').forEach(el=>{el.setAttribute('aria-label',t(el.dataset.i18nAria))});
  $$('[data-i18n-ph]').forEach(el=>{el.placeholder=t(el.dataset.i18nPh)});
  $$('[data-i18n-alt]').forEach(el=>{el.alt=t(el.dataset.i18nAlt)});
  $$('.presets .chip[data-min]').forEach(c=>{c.textContent=t('minutes',{m:c.dataset.min})});
  const ls=$('#langSel');if(ls)ls.value=lang;
  const ni=$('#petName');if(ni&&petName==='콩이'){ni.value=dname()}sizeName();
  $('#rainBtn').textContent=scene.classList.contains('rainy')?t('rain.btnOn'):t('rain.btn');
  const lh=$('#lapHint');if(lh)lh.textContent=fill(t('lap.hint'));
  const tb=$('#themeBtn');if(tb)tb.textContent=t('theme.btn')+' · '+t('theme.'+curTheme+'.name');
  $$('.theme-card').forEach(c=>{c.dataset.broken='🖼️ '+t('theme.broken')});
  rerenderT();renderDaily();renderPomoSet();renderPause();renderFriend();renderSoundNow();
  renderLog();renderShelf();
  if(lastCaption)caption(lastCaption.k,lastCaption.v);
  if(lastStatus){$('#focusStatus').textContent=fill(t(lastStatus.k,lastStatus.v))}
  if(!$('#albumModal').hidden)renderAlbum();
  if(!$('#intimacyModal').hidden)renderIntimacyModal();
  if(!$('#shelfModal').hidden)showShelfModal();
  renderCycle();tick();
}
const lapToggle=$('#lapToggle');
if(lapToggle){lapToggle.checked=lapMode;lapToggle.addEventListener('change',e=>{lapMode=!!e.target.checked;store.set('lapMode',lapMode);if(lapMode){scene.classList.add('lap-preview');setLapView(true,3);setTimeout(()=>{scene.classList.remove('lap-preview');if(!(run&&run.state==='focus'&&run.lap))setLapView(false)},2600)}})}
$('#themeBtn').addEventListener('click',()=>{$('#themeModal').hidden=false});
$('#closeTheme').addEventListener('click',()=>{$('#themeModal').hidden=true});
$$('.theme-card').forEach(c=>c.addEventListener('click',()=>{applyTheme(c.dataset.theme);$('#themeModal').hidden=true;caption('theme.cap');followSound()}));
$$('.theme-card img').forEach(im=>{const bad=()=>{im.classList.add('broken');const c=im.closest('.theme-card');if(c)c.classList.add('broken')};im.addEventListener('error',bad);if(im.complete&&!im.naturalWidth)bad()});
const langSel=$('#langSel');
if(langSel){langSel.addEventListener('change',e=>{const v=e.target.value;if(!LANGS.includes(v))return;lang=v;store.set('lang',v);applyLang()})}

applyTheme(curTheme,{boot:true});applyLang();applyTod();renderLog();renderShelf();renderStatus();
if(!$('#setupMsg').dataset.tkey)setT('#setupMsg','setup.msg');
const fromLink=openResultView()||openTogetherLink();
if(mix.rain>0||store.get('rain',false)){if(!(mix.rain>0))mix.rain=store.get('rainLvl',0.6);rainVisual(true);$('#rainBtn').textContent=t('rain.btnOn')}
if(run&&run.state==='focus'){
  const rem=remainOf();
  if(rem<=0&&!run.paused){moveCat('bowl','wait',1,{instant:true});complete(false)}
  else{show('focus');const waitAt=run.demo?12000:120000;
    scene.classList.toggle('lap-on',!!run.lap);
    if(run.paused){run.autoPaused=false;store.set('run',run);moveCat(homeSpot(),'sit',1,{instant:true});setStatus('pause.status')}
    else if(!run.lap&&rem<=waitAt){moveCat('bowl','wait',1,{instant:true});phase='wait';setStatus('wait.demo');say('…')}
    else{moveCat(homeSpot(),'sleep',1,{instant:true});stage=0;tick();scheduleIdle()}
    renderFriend();renderPause();renderStages();tick()}
}else if(run&&run.state==='done'){moveCat('bowl','wait',1,{instant:true});complete(false)}
else if(run&&run.state==='break'){if(run.endAt<=Date.now()){run=null;store.del('run');moveCat('sofa','lie',1,{instant:true});show('setup')}else{moveCat('rug','sit',-1,{instant:true});catEl.classList.add('petable');setT('#breakStatus',run.long?'break.statusLong':'break.status');caption('break.cap');show('break');tick()}}
else{
  if(run){run=null;store.del('run')}
  const lastStop=isSulking || store.get('sulking', false);
  if(lastStop){
    isSulking=true;
    moveCat('sofa','back',1,{instant:true});
    catEl.classList.add('petable');
    caption('boot.sulkCap');setTag('tag.sulk');
    setT('#setupMsg','stop.msg');
  } else {
    moveCat('sofa','sleep',1,{instant:true});
    caption('idle.sleep');
    // first visit of the day: Kongi greets you with today's line
    if(!fromLink&&store.get('dailySeen','')!==todayKey()){store.set('dailySeen',todayKey());setTimeout(()=>{if(!run){say(fill(t('daily.m'+dailyInfo().k)),5200)}},900)}
  }
  show('setup');
}
// preload the space thumbnails once the page is idle, so the space picker opens with pictures
{const pre=()=>{$$('.theme-card img').forEach(im=>{const i=new Image();i.src=im.src})};if(window.requestIdleCallback)requestIdleCallback(pre,{timeout:5000});else setTimeout(pre,3000)}
})();
