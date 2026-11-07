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
const fill=s=>String(s).replace(/\{N네\}/g,petName+'네').replace(/\{N가\}/g,Nga()).replace(/\{N는\}/g,Nneun()).replace(/\{N를\}/g,Nreul()).replace(/\{N와\}/g,Nwa()).replace(/\{N랑\}/g,josa(petName,'이랑','랑')).replace(/\{N\}/g,dname());
const reduced=()=>window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
const SITE_URL='https://anbucare.github.io/Kongi-room/';
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
const RESULT_BASE='';
const RESULT_WORKER='https://kongi-room-share.anbu-pilot.workers.dev/r';
const IN_APP=/KAKAOTALK|Instagram|FBAN|FBAV|NAVER\(inapp|Line\//i.test(navigator.userAgent);
function toast(msg){const t=$('#toast');t.textContent=msg;t.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>{t.hidden=true},2400)}
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
const TIERS=[15,25,50,120];
function tierOf(min){let tier=0;for(const x of TIERS)if(min>=x)tier=x;return tier}

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

function getKongiQuote(mins, tod, rain, demo) {
  if (demo) return t('quote.demo');
  if (rain) return t('quote.rain',{m:mins});
  if (tod === 'night') return t('quote.night',{m:mins});
  if (tod === 'morning') return t('quote.morning',{m:mins});
  if (tod === 'sunset') return t('quote.sunset',{m:mins});
  return t('quote.default',{m:mins});
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
      <div class="polaroid-thumb" style="background-image:url('assets/room_${item.tod||'day'}.webp');background-size:cover;background-position:center;position:relative">
        ${item.rain ? '<div style="position:absolute;inset:0;background:rgba(40,60,80,.25)"></div>' : ''}
        <img src="${item.sprite||'assets/cat_sit.png'}" alt="${t('cat.alt')}" style="position:absolute;bottom:6%;left:50%;transform:translateX(-50%);width:42%;image-rendering:pixelated;filter:drop-shadow(0 2px 4px rgba(0,0,0,.5))">
        <span style="position:absolute;top:6px;right:6px;font-size:10px;background:rgba(0,0,0,.6);color:#fff;padding:2px 6px;border-radius:10px;backdrop-filter:blur(2px)">${todName}</span>
      </div>
      <div class="polaroid-caption">${item.memo || item.note}</div>
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
    const body = item.memo ? item.memo : (item.kongiMsg || t('pol.quoteDefault'));
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
    const quoteText = `"${item.kongiMsg || t('pol.quoteDefault')}"`;
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

const INTIMACY_LEVELS = [
  { level: 1, name: 'lv1.name', minXp: 0, maxXp: 30, icon: '🌱', desc: 'lv1.desc', motion: 'lv1.motion', spot: 'sofa', pose: 'sleep' },
  { level: 2, name: 'lv2.name', minXp: 30, maxXp: 90, icon: '🌿', desc: 'lv2.desc', motion: 'lv2.motion', spot: 'desk', pose: 'desk' },
  { level: 3, name: 'lv3.name', minXp: 90, maxXp: 180, icon: '🐾', desc: 'lv3.desc', motion: 'lv3.motion', spot: 'rug', pose: 'belly' },
  { level: 4, name: 'lv4.name', minXp: 180, maxXp: 9999, icon: '👑', desc: 'lv4.desc', motion: 'lv4.motion', spot: 'rug', pose: 'belly' }
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
    btn.innerHTML = `${info.icon} <b>Lv.${info.level} ${t(info.name)}</b>${nextText}`;
  }
}

const STREAK={
  get(){const s=store.get('streak',null);return (s&&typeof s.count==='number')?s:{count:0,best:0,last:null}},
  valid(){const s=this.get();if(!s.count||!s.last)return 0;
    const y=new Date();y.setDate(y.getDate()-1);
    const yk=y.getFullYear()+'-'+pad(y.getMonth()+1)+'-'+pad(y.getDate());
    return (s.last===todayKey()||s.last===yk)?s.count:0}
};
function bumpStreak(){
  const s=STREAK.get(),tk=todayKey();
  if(s.last!==tk){
    const y=new Date();y.setDate(y.getDate()-1);
    const yk=y.getFullYear()+'-'+pad(y.getMonth()+1)+'-'+pad(y.getDate());
    s.count=(s.last===yk)?(s.count||0)+1:1;
    s.last=tk;
  }
  s.best=Math.max(s.best||0,s.count);
  store.set('streak',s);
  updateStreakBadge();
  return s.count;
}
function updateStreakBadge(){
  const el=$('#streakBadge');if(!el)return;
  const n=STREAK.valid();
  el.hidden=n<1;
  if(n>=1)el.textContent='🔥 '+t('streak.badge',{n:n});
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

  const pct = info.level >= 4 ? 100 : Math.min(100, Math.round(((cur.xp - info.minXp) / (info.maxXp - info.minXp)) * 100));
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
  room:{spots:{},hs:{}},
  library:{spots:{sofa:{x:10,y:40},win:{x:33,y:38},rug:{x:40,y:8},mid:{x:50,y:8},door:{x:70,y:8},desk:{x:58,y:40},belly:{x:40,y:8},lap:{x:41,y:13}},
    hs:{shelf:[61,25,14,8],coffee:null,plant:[55,42,9,10],book:[85,40,12,8],radio:[10,22,10,10]}},
  greenhouse:{spots:{sofa:{x:9,y:38},win:{x:37,y:40},rug:{x:42,y:8},mid:{x:52,y:8},door:{x:62,y:8},desk:{x:70,y:40},belly:{x:42,y:8},lap:{x:43,y:13}},
    hs:{shelf:[80,24,16,8],coffee:[85,48,7,7],plant:[2,30,12,25],book:null,radio:[9,40,9,10]}},
  train:{spots:{sofa:{x:4,y:36},win:{x:11,y:36},rug:{x:40,y:8},mid:{x:50,y:8},door:{x:70,y:8},desk:{x:62,y:38},belly:{x:40,y:8},lap:{x:41,y:13}},
    hs:{shelf:[63,6,22,8],coffee:[74,54,7,7],plant:null,book:[76,6,14,10],radio:[14,32,9,10]}},
  cabin:{spots:{sofa:{x:8,y:36},win:{x:40,y:40},rug:{x:40,y:8},mid:{x:50,y:8},door:{x:60,y:8},desk:{x:68,y:38},belly:{x:40,y:8},lap:{x:41,y:13}},
    hs:{shelf:[78,22,18,8],coffee:null,plant:[2,18,10,18],book:[8,16,12,8],radio:[87,46,10,12]}}
};
function spotFor(spot,pose){const t=SPOTS[spot]||SPOTS.rug;return (spot==='sofa'&&curTheme==='room'&&SOFA_POSE[pose])?Object.assign({},t,SOFA_POSE[pose]):t}
const HS_IDS={shelf:'#shelf',coffee:'#hotspotCoffee',plant:'#hotspotPlant',book:'#hotspotBook',radio:'#hotspotRadio'};
const HS_BASE={};
function applyTheme(id,opts){
  opts=opts||{};
  if(!THEME_IDS.includes(id))id='room';
  curTheme=id;store.set('theme',id);
  const th=THEMES[id];
  Object.keys(SPOTS).forEach(k=>{delete SPOTS[k]});Object.assign(SPOTS,BASE_SPOTS,th.spots);
  scene.dataset.theme=id;
  Object.keys(HS_IDS).forEach(k=>{
    const el=$(HS_IDS[k]);if(!el)return;
    if(!HS_BASE[k])HS_BASE[k]=[el.style.left,el.style.top,el.style.width,el.style.height];
    const v=th.hs[k];
    if(id==='room'){[el.style.left,el.style.top,el.style.width,el.style.height]=HS_BASE[k];el.style.display='';}
    else if(v===null){el.style.display='none';}
    else{el.style.display='';el.style.left=v[0]+'%';el.style.top=v[1]+'%';el.style.width=v[2]+'%';el.style.height=v[3]+'%';}
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
  bubble.style.left=(x+9)+'%';bubble.style.bottom=(y+19)+'%'}
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
function say(t,ms){bubble.textContent=t;bubble.hidden=false;clearTimeout(say.t);if(ms)say.t=setTimeout(()=>{bubble.hidden=true},ms)}
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
function stageFor(p){return p<0.10?1:p<0.35?2:3}
function setStage(n,quiet){
  stage=n;renderStages();
  const home=homeSpot(),lap=!!(run&&run.lap);
  catEl.classList.remove('loaf','purring');
  if(n===1){
    stopPurr();
    const id=moveId+1;
    moveCat(home,'sit',1).then(()=>{setTimeout(()=>{if(moveId===id&&stage===1&&!awake&&run&&run.state==='focus')setPose('lie')},1600)});
    if(!quiet)setStatus('stage.settleCap');
  }else if(n===2){
    stopPurr();
    const id=moveId+1;
    const p=(catEl.dataset.spot===home)?Promise.resolve():moveCat(home,'sit',1);
    p.then(()=>{if(moveId>id)return;setPose('sit');catEl.classList.add('loaf')});
    if(!quiet)setStatus('stage.loafCap');
  }else if(n===3){
    clearTimeout(idleTimer);
    moveCat(home,'sleep',1).then(()=>{if(stage===3&&!awake){catEl.classList.add('purring');startPurr()}});
    if(!quiet)setStatus(lap?'stage.lapSleepCap':'stage.sleepCap');
  }else if(n===4){
    stopPurr();
    setPose('stretch');hearts(3);
    if(!quiet)caption('stage.finishCap');
  }
}
function wakeCat(fromStop){
  if(!(run&&run.state==='focus'&&run.lap)||awake)return;
  awake=true;clearTimeout(resettleTimer);
  run.wakes=(run.wakes|0)+1;store.set('run',run);
  stopPurr();catEl.classList.remove('loaf','purring');
  setPose('sit');
  catEl.classList.remove('startled');void catEl.offsetWidth;catEl.classList.add('startled');
  setTimeout(()=>catEl.classList.remove('startled'),800);
  say(t('wake.say'),2600);
  if(!fromStop){setStatus('wake.status',{n:run.wakes});caption('wake.cap')}
}
function resettle(){
  if(!(run&&run.state==='focus'&&run.lap)||!awake)return;
  clearTimeout(resettleTimer);
  resettleTimer=setTimeout(()=>{
    if(!(run&&run.state==='focus'&&run.lap)||!awake)return;
    awake=false;
    const p=1-Math.max(0,run.endAt-Date.now())/(run.dur*1000);
    setStage(stageFor(p),true);
    setStatus('wake.back');
  },3000);
}
function onLeave(){if(run&&run.state==='focus'&&run.lap&&phase==='idle'&&stage>=1)wakeCat(false)}
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

function show(id){ui=id;['setup','focus','done','after','break'].forEach(k=>{$('#ui-'+k).hidden=k!==id})}
const fmt=s=>{s=Math.ceil(s/1000);const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return (h?h+':':'')+(h?pad(m):m<10?'0'+m:m)+':'+pad(x)};
function tick(){
  if(!run){if($('#resultModal').hidden)document.title=roomTitle()+' · '+t('tagline');return}
  const rem=Math.max(0,run.endAt-Date.now());
  if(run.state==='focus'){
    $('#clock').textContent=fmt(rem);$('#barFill').style.width=(100-rem/(run.dur*1000)*100)+'%';
    document.title=fmt(rem)+' · '+roomTitle();
    const waitAt=run.demo?12000:120000;
    if(phase==='idle'&&!awake&&rem>0){const s=stageFor(1-rem/(run.dur*1000));if(s!==stage)setStage(s)}
    if(phase==='idle'&&!run.lap&&rem<=waitAt&&rem>0)enterWait();
    if(rem===0)complete(true);
  }else if(run.state==='break'){
    $('#breakClock').textContent=fmt(rem);document.title=t('title.break')+' '+fmt(rem)+' · '+roomTitle();
    if(rem===0)endBreak();
  }else{document.title=t('title.treat')+' · '+roomTitle()}
}
setInterval(tick,250);

function start(sec,demo){
  run={state:'focus',endAt:Date.now()+sec*1000,dur:sec,demo:!!demo,lap:lapMode,wakes:0};store.set('run',run);phase='idle';
  stage=0;awake=false;clearTimeout(resettleTimer);scene.classList.toggle('lap-on',lapMode);
  ensureAudio();wake();hush();bowl.dataset.level=0;
  catEl.classList.remove('petable');
  const wasSulking = isSulking || store.get('sulking', false) || (log.items.length && log.items[log.items.length-1].type==='stop');
  isSulking=false;store.del('sulking');

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
  show('focus');renderStages();tick();scheduleIdle();
}
function enterWait(){phase='wait';clearTimeout(idleTimer);stopPurr();
  moveCat('bowl','wait',1).then(()=>{if(phase==='wait'||phase==='done')say('…')});
  setStatus(run.demo?'wait.demo':'wait.full')}
function complete(withSound){
  clearTimeout(idleTimer);clearTimeout(resettleTimer);awake=false;run.state='done';store.set('run',run);phase='done';
  if(withSound)chime();
  const greet=withSound&&!reduced();
  if(greet)setStage(4);
  setTimeout(()=>{
    scene.classList.remove('lap-on');stage=0;renderStages();
    moveCat('bowl','wait',1).then(()=>{if(phase==='done')say('!')});
    caption('done.cap');
  },greet?2200:0);
  $('#doneMsg').textContent=fill(t('done.msg'));if(greet)caption('stage.finishCap');else caption('done.cap');
  show('done');
}
async function giveTreat(){
  const btn=$('#treatBtn');btn.disabled=true;hush();phase='eating';
  const treatEl=$('#treat');if(treatEl){treatEl.classList.remove('drop');void treatEl.offsetWidth;treatEl.classList.add('drop');}
  try{
    await sleep(350);
    if(bowl)bowl.dataset.level=3;
    await moveCat('eat','eat',1);
    caption('eat.cap');
    for(let lv=3;lv>0;lv--){
      for(let k=0;k<3;k++){await sleep(320);crunch();if(k===1)crumbs();}
      if(bowl)bowl.dataset.level=lv-1;
    }
    await sleep(200);
    setPose('lick');caption('eat.lick');hearts(3);
    const wasDemo = !!(run && run.demo);
    const sessionMin = wasDemo ? 0 : Math.round((run?run.dur:30)/60);
    log.items.push({type:'done',min:sessionMin,demo:wasDemo,lap:!!(run&&run.lap),wakes:(run&&run.wakes)|0});
    store.set('log',log);renderLog();
    if(run)recordAlbum(run);
    
    if(!wasDemo) bumpStreak(); else updateStreakBadge();

    const gainedXp = wasDemo ? 15 : Math.max(25, 25 + sessionMin);
    addIntimacy(gainedXp);

    checkTreasureReward(sessionMin, wasDemo);
    run=null;store.del('run');phase='idle';
    $('#afterMsg').textContent=fill(t(wasDemo?'after.msgDemo':'after.msg'));
    show('after');
    say(t('after.bragBubble'), 5200);
    hearts(3);
    await sleep(1500);
    if(run) return;
    setPose('groom');caption('groom.cap');hearts(4);
    await sleep(2000);
    if(run) return;
    const curLv = getLevelInfo(getIntimacy().xp).level;
    if(curLv >= 3 && Math.random() < 0.45){
      await moveCat('rug','belly',1);
      caption('after.belly');
    } else if(curLv >= 2 && Math.random() < 0.45){
      await moveCat('desk','desk',-1);
      caption('after.desk');
    } else {
      await moveCat('sofa','sleep',1);
      caption('after.sofa');
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
  $('#breakStatus').textContent=fill(t('break.status'));caption('break.cap');
  show('break');tick();
}
function endBreak(){
  chime();run=null;store.del('run');catEl.classList.remove('petable');hush();
  moveCat('sofa','lie',1);caption('break.endCap');
  $('#setupMsg').textContent=fill(t('break.endMsg'));
  show('setup');
}
function doStop(){
  const elapsed=run?Math.round((run.dur*1000-(run.endAt-Date.now()))/60000):0;
  $('#stopModal').hidden=true;
  if(run&&run.state==='focus'&&run.lap&&!awake){wakeCat(true);setTimeout(()=>finishStop(elapsed),1100);return}
  finishStop(elapsed);
}
function finishStop(elapsed){
  clearTimeout(idleTimer);clearTimeout(resettleTimer);awake=false;stopPurr();catEl.classList.remove('loaf','purring');scene.classList.remove('lap-on');stage=0;renderStages();
  run=null;store.del('run');phase='idle';hush();
  log.items.push({type:'stop',min:elapsed});store.set('log',log);renderLog();
  isSulking=true;store.set('sulking',true);
  caption('stop.walk');
  const id=moveId+1;
  moveCat('sofa','back',1).then(()=>{
    if(moveId!==id)return;
    clearTimeout(lookTimer);
    say(t('stop.say'), 2800);
    catEl.classList.add('petable');
    caption('stop.cap');
  });
  $('#setupMsg').textContent=fill(t('stop.msg'));
  show('setup');
}

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
  const tstr=tstrOf(mins);
  const ts=$('#todaySum');if(ts)ts.textContent=done.length?t('log.today',{s:sessionsOf(done.length),t:tstr}):'';
  const ls=$('#logSum');if(ls)ls.textContent=done.length||stops.length?t('log.today',{s:sessionsOf(done.length),t:tstr})+(stops.length?t('log.stops',{b:bowlsOf(stops.length)}):''):'';
  const it=$('#logItems');
  if(it){
    it.innerHTML='';
    log.items.forEach((x,i)=>{
      const d=document.createElement('span');
      if(x.type==='done'){
        d.className='lg-book';
        d.style.background=BOOK[i%BOOK.length];
        d.title=x.demo?t('log.demoTitle'):t('log.doneTitle',{m:x.min});
      }else{
        d.className='lg-stop';
        d.title=t('log.stopTitle',{m:x.min});
      }
      it.appendChild(d);
    });
  }
  const le=$('#logEmpty');if(le)le.hidden=log.items.length>0;
}

function tod(){const o=store.get('tod','auto');if(o!=='auto')return o;const h=new Date().getHours();
  return h>=6&&h<10?'morning':h<17?'day':h<20?'sunset':'night'}
function applyTod(){scene.classList.remove('t-morning','t-day','t-sunset','t-night');scene.classList.add('t-'+tod())}
setInterval(applyTod,60000);

function shareStats(){
  const done=log.items.filter(i=>i.type==='done'&&!i.demo);
  const mins=done.reduce((a,b)=>a+b.min,0);
  const ld=done.length?done[done.length-1]:null;
  return {sessions:done.length,mins,last:ld?ld.min:0,lastLap:!!(ld&&ld.lap),lastWakes:ld?(ld.wakes|0):0,stops:log.items.filter(i=>i.type==='stop').length};
}
function cardData(){
  const st=shareStats();
  return Object.assign({canvas:$('#card'),tod:tod(),rain:scene.classList.contains('rainy'),shelf:getShelfItems(),name:petName,date:new Date()},st);
}
function drawCard(data){
  data=data||cardData();
  const c=data.canvas,x=c.getContext('2d'),W=1080,H=1920,todv=data.tod;
  const P={morning:['#f6e3c6','#e9cfae','#bfe0f4','#fbe7c2','#f2e0c8'],day:['#efdcc3','#dcc3a6','#9fd0ef','#e3f1f8','#ead6bf'],
    sunset:['#eac4a3','#cfa07c','#f3a46b','#7d4f7f','#e6c3a2'],night:['#2f2633','#1f1a24','#141a38','#2b365f','#4a3b47']}[todv]||['#efdcc3','#dcc3a6','#9fd0ef','#e3f1f8','#ead6bf'];
  const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,P[0]);g.addColorStop(1,P[1]);x.fillStyle=g;x.fillRect(0,0,W,H);
  const dark=todv==='night';const ink=dark?'#efe5d6':'#372c25',mut=dark?'#b9aa9d':'#857566';
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
  const mins=data.mins|0,tstr=tstrOf(mins),name=data.name||dname();
  const d=data.date||new Date();
  x.textAlign='center';x.fillStyle=mut;x.font='400 44px '+ff;
  x.fillText(fmtDate(d),W/2,230);
  const stk=(data.streak!=null)?data.streak:STREAK.valid();
  if(stk>=2){
    x.save();x.translate(64,96);x.rotate(-0.1);
    x.font='700 42px '+ff;
    const stampText='🔥 '+t('pol.stamp',{n:stk});
    const stw=x.measureText(stampText).width+48;
    x.fillStyle='rgba(255,249,238,.9)';x.strokeStyle='rgba(192,64,34,.85)';x.lineWidth=5;
    x.beginPath();x.roundRect(0,0,stw,70,16);x.fill();x.stroke();
    x.fillStyle='rgba(179,64,34,.95)';x.textAlign='left';
    x.fillText(stampText,24,50);
    x.restore();x.textAlign='center';
  }
  x.fillStyle=ink;x.font='400 150px '+ff;
  x.fillText(data.last?t('card.done',{m:data.last}):tstr,W/2,360);
  x.font='400 54px '+ff;x.fillStyle=ink;
  x.fillText(data.last?t('card.cum',{t:tstr,s:sessionsOf(sessions)}):t('card.with',{s:sessionsOf(sessions)}).replace('{N와}',josa(name,'과','와')).replace('{N}',name),W/2,1460);
  x.fillStyle=mut;x.font='400 40px '+ff;
  const stops=data.stops|0;
  x.fillText(stops?t('card.stops',{b:bowlsOf(stops)}):t('card.noStops'),W/2,1540);
  if(data.lastLap&&data.last){x.fillStyle=ink;x.font='400 40px '+ff;x.fillText('🛏️ '+fill(data.lastWakes?t('lap.wakes',{n:data.lastWakes}):t('lap.noWake')),W/2,1610)}
  x.font='400 46px '+ff;x.fillStyle=mut;x.fillText(t('title.room').replace('{N}',name)+' · '+t('tagline'),W/2,1800);
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
  const img=$('#sheetPreview');
  try{img.src=ctx.canvas.toDataURL('image/png');img.hidden=false}catch(e){img.hidden=true}
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
  const draw=()=>drawCard(Object.assign({canvas:$('#resultCard'),tod:todq,rain:false,shelf:[],streak:0,name,date},st));
  (document.fonts&&document.fonts.ready?document.fonts.ready.then(draw,draw):draw());
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
$('#stopBtn').addEventListener('click',()=>{$('#stopMsg').textContent=fill(t('stop.confirm'));$('#stopModal').hidden=false;$('#keepBtn').focus()});
$('#keepBtn').addEventListener('click',()=>{$('#stopModal').hidden=true});
$('#confirmStop').addEventListener('click',doStop);
$('#treatBtn').addEventListener('click',()=>{ensureAudio();giveTreat()});
$$('[data-break]').forEach(b=>b.addEventListener('click',()=>startBreak(+b.dataset.break*60)));
$('#nextBtn').addEventListener('click',()=>{$('#setupMsg').textContent=fill(t('next.msg'));show('setup')});
$('#skipBreak').addEventListener('click',endBreak);
catEl.addEventListener('click',()=>{
  const p = catEl.dataset.pose;
  if(p === 'desk'){
    hearts(3);say(t('click.deskSay'), 1800);
    caption('click.deskCap');
    addIntimacy(2);
  } else if(p === 'belly'){
    hearts(4);say(t('click.bellySay'), 2000);
    caption('click.bellyCap');
    addIntimacy(2);
  } else if(run&&run.state==='break'){
    hearts(3);say(t('click.breakSay'),1500);
    if(catEl.dataset.pose==='sit'){setPose('lie');clearTimeout(catEl.p);catEl.p=setTimeout(()=>{if(run&&run.state==='break')setPose('sit')},2400)}
    addIntimacy(2);
  } else if(!run && isSulking){
    hearts(1);say(t('click.sulkSay'),1600);
    caption('click.sulkCap');
  } else if(run&&run.state==='focus'){
    hearts(2);say(t('click.focusSay'),1500);
    caption('click.focusCap');
  } else {
    hearts(2);say(t('click.idleSay'),1500);
    caption('click.idleCap');
  }
});
$('#petName').value=petName;
const sizeName=()=>{const i=$('#petName');if(!i)return;let m=$('#petNameMirror');if(!m){m=document.createElement('span');m.id='petNameMirror';m.setAttribute('aria-hidden','true');Object.assign(m.style,{position:'absolute',visibility:'hidden',whiteSpace:'pre',pointerEvents:'none',left:'-9999px',top:'0'});i.parentNode.appendChild(m)}const cs=getComputedStyle(i);m.style.font=cs.font;m.style.letterSpacing=cs.letterSpacing;m.textContent=i.value||'콩이';i.style.width=Math.ceil(m.getBoundingClientRect().width+2)+'px'};sizeName();$('#petName').addEventListener('input',sizeName);if(document.fonts&&document.fonts.ready)document.fonts.ready.then(sizeName,()=>{});window.addEventListener('load',sizeName);
$('#petName').addEventListener('change',e=>{const v=e.target.value.trim()||'콩이';petName=v;e.target.value=v;store.set('petName',v);renderLog();tick();if(lastCaption)caption(lastCaption.k,lastCaption.v)});
$('#todSel').value=store.get('tod','auto');
$('#todSel').addEventListener('change',e=>{store.set('tod',e.target.value);applyTod()});
$('#shareBtn').addEventListener('click',()=>{const go=()=>{drawCard();$('#shareModal').hidden=false};(document.fonts&&document.fonts.ready?document.fonts.ready.then(go,go):go())});
function openDayShare(){const go=()=>{drawCard();const st=shareStats();openShareSheet({canvas:$('#card'),title:roomTitle(),text:shareLine(st),url:resultUrl(st),fileName:'kongi-room-'+todayKey()+'.png'})};(document.fonts&&document.fonts.ready?document.fonts.ready.then(go,go):go())}
$('#openShareBtn').addEventListener('click',openDayShare);
$('#afterShareBtn').addEventListener('click',openDayShare);
$('#shareCardBtn').addEventListener('click',()=>{$('#shareModal').hidden=true;openDayShare()});
$('#closeSheet').addEventListener('click',()=>{$('#shareSheet').hidden=true});
$('#shNative').addEventListener('click',shareNative);
$('#shCopy').addEventListener('click',()=>{if(sheetCtx)copyText(sheetCtx.url,t('toast.linkCopied'))});
$('#shCopyText').addEventListener('click',()=>{if(sheetCtx)copyText(sheetCtx.text+'\n'+sheetCtx.url,t('toast.textCopied'))});
$('#shKakao').addEventListener('click',shareKakao);
$('#shX').addEventListener('click',()=>{if(!sheetCtx)return;window.open('https://x.com/intent/post?text='+encodeURIComponent(sheetCtx.text)+'&url='+encodeURIComponent(sheetCtx.url),'_blank','noopener')});
$('#shThreads').addEventListener('click',()=>{if(!sheetCtx)return;window.open('https://www.threads.net/intent/post?text='+encodeURIComponent(sheetCtx.text+'\n'+sheetCtx.url),'_blank','noopener')});
$('#shSave').addEventListener('click',()=>{if(sheetCtx)saveImage(sheetCtx.canvas,sheetCtx.fileName||'kongi-room.png')});
$('#sharePolaroidBtn').addEventListener('click',()=>{if(!currentPolaroidItem)return;const it=currentPolaroidItem;const st=shareStats();
  openShareSheet({canvas:$('#polaroidCanvas'),title:roomTitle(),text:fill(t('pol.shareText',{d:it.demo?t('demoShort'):t('minShort',{m:it.min}),memo:it.memo?'"'+it.memo+'" ':''})),url:resultUrl(st),fileName:'kongi-room-polaroid.png'})});
$('#closeShare').addEventListener('click',()=>{$('#shareModal').hidden=true});
$('#rainBtn').addEventListener('click',()=>toggleRain());
$('#hotspotRadio').addEventListener('click',()=>{$('#radioModal').hidden=false;ensureAudio()});
$('#closeRadio').addEventListener('click',()=>{$('#radioModal').hidden=true});
$$('.mix-range').forEach(r=>{r.value=Math.round((mix[r.dataset.mix]||0)*100);const l=$('.mix-val[data-mix="'+r.dataset.mix+'"]');if(l)l.textContent=r.value+'%';
  r.addEventListener('input',e=>mixSet(r.dataset.mix,e.target.value/100,{fromUi:true}))});
$$('[data-preset]').forEach(b=>b.addEventListener('click',()=>mixPreset(b.dataset.preset)));
const mixKick=()=>{if(MIX_IDS.some(id=>mix[id]>0))ensureAudio()};
window.addEventListener('pointerdown',mixKick,{once:true});window.addEventListener('keydown',mixKick,{once:true});

$('#hotspotBook').addEventListener('click',()=>{$('#toolsModal').hidden=false});
$('#closeTools').addEventListener('click',()=>{$('#toolsModal').hidden=true});

$('#hotspotCoffee').addEventListener('click',()=>{
  say(t('coffee.say'), 2600);
  hearts(2);
  caption('coffee.cap');
});
const plantEl=$('#hotspotPlant');
if(plantEl){
  plantEl.addEventListener('click',()=>{
    say(t('plant.say'), 2200);
    hearts(2);
    caption('plant.cap');
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
  const text = fill(t('pol.copyText',{d:it.demo?t('demoShort'):t('minShort',{m:it.min}),q:it.kongiMsg||'',memo:memoLine,url:SITE_URL}));
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

document.addEventListener('keydown',e=>{if(e.key==='Escape'){$('#shareModal').hidden=true;$('#stopModal').hidden=true;$('#shelfModal').hidden=true;$('#radioModal').hidden=true;$('#themeModal').hidden=true;$('#albumModal').hidden=true;$('#polaroidDetailModal').hidden=true;$('#intimacyModal').hidden=true;$('#levelUpModal').hidden=true;$('#shareSheet').hidden=true;$('#resultModal').hidden=true;}});

function applyLang(){
  document.documentElement.lang=lang;
  $$('[data-i18n]').forEach(el=>{el.textContent=t(el.dataset.i18n)});
  $$('[data-i18n-title]').forEach(el=>{el.title=t(el.dataset.i18nTitle)});
  $$('[data-i18n-aria]').forEach(el=>{el.setAttribute('aria-label',t(el.dataset.i18nAria))});
  $$('[data-i18n-ph]').forEach(el=>{el.placeholder=t(el.dataset.i18nPh)});
  $$('[data-i18n-alt]').forEach(el=>{el.alt=t(el.dataset.i18nAlt)});
  $$('.chip:not(.pchip)').forEach(c=>{c.textContent=t('minutes',{m:c.dataset.min})});
  $$('[data-break]').forEach(b=>{b.textContent=t('break.n',{m:b.dataset.break})});
  const ls=$('#langSel');if(ls)ls.value=lang;
  const ni=$('#petName');if(ni&&petName==='콩이'){ni.value=dname()}sizeName();
  $('#rainBtn').textContent=scene.classList.contains('rainy')?t('rain.btnOn'):t('rain.btn');
  const lh=$('#lapHint');if(lh)lh.textContent=fill(t('lap.hint'));
  const tb=$('#themeBtn');if(tb)tb.textContent=t('theme.btn')+' · '+t('theme.'+curTheme+'.name');
  renderLog();updateIntimacyBadge();updateStreakBadge();renderShelf();
  if(lastCaption)caption(lastCaption.k,lastCaption.v);
  if(lastStatus){$('#focusStatus').textContent=fill(t(lastStatus.k,lastStatus.v))}
  tick();
}
const lapToggle=$('#lapToggle');
if(lapToggle){lapToggle.checked=lapMode;lapToggle.addEventListener('change',e=>{lapMode=!!e.target.checked;store.set('lapMode',lapMode)})}
$('#themeBtn').addEventListener('click',()=>{$('#themeModal').hidden=false});
$('#closeTheme').addEventListener('click',()=>{$('#themeModal').hidden=true});
$$('.theme-card').forEach(c=>c.addEventListener('click',()=>{applyTheme(c.dataset.theme);$('#themeModal').hidden=true;caption('theme.cap')}));
const langSel=$('#langSel');
if(langSel){langSel.addEventListener('change',e=>{const v=e.target.value;if(!LANGS.includes(v))return;lang=v;store.set('lang',v);applyLang()})}

applyTheme(curTheme,{boot:true});applyLang();applyTod();renderLog();renderShelf();updateIntimacyBadge();updateStreakBadge();
openResultView();
if(mix.rain>0||store.get('rain',false)){if(!(mix.rain>0))mix.rain=store.get('rainLvl',0.6);rainVisual(true);$('#rainBtn').textContent=t('rain.btnOn')}
if(run&&run.state==='focus'){
  const rem=run.endAt-Date.now();
  if(rem<=0){moveCat('bowl','wait',1,{instant:true});complete(false)}
  else{show('focus');const waitAt=run.demo?12000:120000;
    scene.classList.toggle('lap-on',!!run.lap);
    if(!run.lap&&rem<=waitAt){moveCat('bowl','wait',1,{instant:true});phase='wait';setStatus('wait.demo');say('…')}
    else{moveCat(homeSpot(),'sleep',1,{instant:true});stage=0;tick();scheduleIdle()}
    renderStages();tick()}
}else if(run&&run.state==='done'){moveCat('bowl','wait',1,{instant:true});complete(false)}
else if(run&&run.state==='break'){if(run.endAt<=Date.now()){run=null;store.del('run');moveCat('sofa','lie',1,{instant:true});show('setup')}else{moveCat('rug','sit',-1,{instant:true});catEl.classList.add('petable');$('#breakStatus').textContent=fill(t('break.status'));caption('break.cap');show('break');tick()}}
else{
  const lastStop=isSulking || store.get('sulking', false) || (log.items.length && log.items[log.items.length-1].type==='stop');
  if(lastStop){
    isSulking=true;
    moveCat('sofa','back',1,{instant:true});
    catEl.classList.add('petable');
    caption('boot.sulkCap');
    $('#setupMsg').textContent=fill(t('stop.msg'));
  } else {
    moveCat('sofa','sleep',1,{instant:true});
    caption('idle.sleep');
  }
  show('setup');
}
})();
