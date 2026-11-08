import satori from 'satori';
import { initWasm, Resvg } from '@resvg/resvg-wasm';
import resvgWasm from '@resvg/resvg-wasm/index_bg.wasm';
import fontData from '../assets/GowunDodum-Subset.ttf';
import bgJpg from '../assets/og-bg.jpg';
import catPng from '../assets/cat.png';

const SITE = 'https://kongi-room.anbu-pilot.workers.dev/';
const BOT_UA = /facebookexternalhit|facebot|twitterbot|kakaotalk-scrap|kakaotalk|slackbot|discordbot|telegrambot|whatsapp|linkedinbot|pinterest|skypeuripreview|applebot|googlebot|bingbot|naverbot|yeti|daum|threads|instagram|embedly|quora link preview|redditbot|mastodon|bluesky|cardyb|summalybot|line-poker|viber|snapchat|duckduckbot|petalbot|vkshare|outbrain|w3c_validator|1in200m/i;

let wasmReady = null;
function ensureWasm() {
  if (!wasmReady) wasmReady = initWasm(resvgWasm).catch((e) => { if (!/already/i.test(String(e))) throw e; });
  return wasmReady;
}

const LANGS = ['ko', 'en', 'de'];
const T = {
  ko: {
    tagline: '콩이네 방 · 고양이와 함께하는 집중 타이머',
    done: (m) => `${m}분 집중 완주`,
    focus: (t) => `${t} 집중`,
    plain: '오늘의 집중',
    title: (name, what) => `${name}${josa(name, '과', '와')} 함께 ${what}`,
    desc: (name, total, sessions) => `오늘 누적 ${total} · ${sessions}세션. 친구의 결과를 보고 ${name}${josa(name, '을', '를')} 내 방에도 데려와 보세요. 가입 없이 30초 체험.`,
    cum: (total, sessions) => `오늘 누적 ${total} · ${sessions}세션`,
    cta: '나도 콩이 데려오기 · 가입 없이 바로',
    time: (m) => { const h = Math.floor(m / 60), r = m % 60; return (h ? h + '시간 ' : '') + (r || !h ? r + '분' : ''); },
    date: (d) => `${d.getFullYear()}.${p2(d.getMonth() + 1)}.${p2(d.getDate())} ${['일', '월', '화', '수', '목', '금', '토'][d.getDay()]}`,
    room: (name) => `${name}네 방`,
  },
  en: {
    tagline: "Kongi's Room · a focus timer with a cat",
    done: (m) => `${m} min of focus done`,
    focus: (t) => `${t} of focus`,
    plain: "Today's focus",
    title: (name, what) => `${what} with ${name}`,
    desc: (name, total, sessions) => `Today's total ${total} · ${sessions} session${sessions === 1 ? '' : 's'}. See a friend's result and bring ${name} home too. 30-second demo, no sign-up.`,
    cum: (total, sessions) => `Today's total ${total} · ${sessions} session${sessions === 1 ? '' : 's'}`,
    cta: 'Bring Kongi home too · no sign-up',
    time: (m) => { const h = Math.floor(m / 60), r = m % 60; return ((h ? h + 'h ' : '') + (r || !h ? r + 'm' : '')).trim(); },
    date: (d) => d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', weekday: 'short' }),
    room: (name) => `${name}'s Room`,
  },
  de: {
    tagline: 'Kongis Zimmer · ein Fokus-Timer mit Katze',
    done: (m) => `${m} Min. Fokus geschafft`,
    focus: (t) => `${t} Fokus`,
    plain: 'Fokus von heute',
    title: (name, what) => `${what} mit ${name}`,
    desc: (name, total, sessions) => `Heute gesamt ${total} · ${sessions} ${sessions === 1 ? 'Sitzung' : 'Sitzungen'}. Schau dir das Ergebnis an und hol ${name} auch in dein Zimmer. 30-Sekunden-Demo ohne Anmeldung.`,
    cum: (total, sessions) => `Heute gesamt ${total} · ${sessions} ${sessions === 1 ? 'Sitzung' : 'Sitzungen'}`,
    cta: 'Kongi auch zu mir holen · ohne Anmeldung',
    time: (m) => { const h = Math.floor(m / 60), r = m % 60; return ((h ? h + ' Std. ' : '') + (r || !h ? r + ' Min.' : '')).trim(); },
    date: (d) => d.toLocaleDateString('de-DE', { year: 'numeric', month: 'short', day: 'numeric', weekday: 'short' }),
    room: (name) => `${name}s Zimmer`,
  },
};
const p2 = (n) => String(n).padStart(2, '0');
function josa(name, a, b) {
  const c = name.charCodeAt(name.length - 1);
  if (c >= 0xac00 && c <= 0xd7a3) return ((c - 0xac00) % 28) ? a : b;
  return b;
}

function parse(url) {
  const q = url.searchParams;
  const int = (k, max) => Math.min(max, Math.max(0, parseInt(q.get(k) || '0', 10) || 0));
  const lang = LANGS.includes(q.get('lang')) ? q.get('lang') : 'ko';
  let name = (q.get('n') || '콩이').replace(/[<>&"'`]/g, '').trim().slice(0, 6) || '콩이';
  if (lang !== 'ko' && name === '콩이') name = 'Kongi';
  const dm = /^(\d{4})(\d{2})(\d{2})$/.exec(q.get('d') || '');
  const date = dm ? new Date(+dm[1], +dm[2] - 1, +dm[3]) : new Date();
  return {
    sessions: int('s', 999), mins: int('m', 100000), last: int('l', 100000), name, lang,
    tod: ['morning', 'day', 'sunset', 'night'].includes(q.get('t')) ? q.get('t') : 'day', date,
  };
}

function texts(r) {
  const t = T[r.lang];
  const what = r.last ? t.done(r.last) : (r.sessions ? t.focus(t.time(r.mins)) : t.plain);
  return {
    title: t.title(r.name, what),
    desc: t.desc(r.name, t.time(r.mins), r.sessions),
    big: what,
    cum: t.cum(t.time(r.mins), r.sessions),
    date: t.date(r.date),
    tagline: t.tagline,
    cta: t.cta,
    room: t.room(r.name),
  };
}

function paramsOf(r) {
  const p = new URLSearchParams({ s: r.sessions, m: r.mins, l: r.last, n: r.name === 'Kongi' ? '콩이' : r.name, t: r.tod, d: `${r.date.getFullYear()}${p2(r.date.getMonth() + 1)}${p2(r.date.getDate())}` });
  if (r.lang !== 'ko') p.set('lang', r.lang);
  return p.toString();
}

function staticImage(r) {
  const m = Math.min(180, Math.max(5, Math.round((r.last || 0) / 5) * 5)) || 25;
  return `${SITE}assets/og/${r.lang}-${r.last ? m : 25}.jpg`;
}

function esc(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

function toB64(buf) {
  let s = '';
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
let bgUri = null, catUri = null;

async function renderPng(r) {
  await ensureWasm();
  if (!bgUri) { bgUri = 'data:image/jpeg;base64,' + toB64(bgJpg); catUri = 'data:image/png;base64,' + toB64(catPng); }
  const x = texts(r);
  const el = (type, style, children) => ({ type, props: (children == null || (Array.isArray(children) && !children.length)) ? { style } : { style, children } });
  const tree = el('div', { width: 1200, height: 630, display: 'flex', position: 'relative', fontFamily: 'Gowun Dodum', color: '#fbf4e8' }, [
    { type: 'img', props: { src: bgUri, width: 1200, height: 630, style: { position: 'absolute', left: 0, top: 0, width: 1200, height: 630, objectFit: 'cover' } } },
    el('div', { position: 'absolute', left: 0, top: 0, width: 1200, height: 630, background: 'linear-gradient(90deg, rgba(28,20,18,0.84) 0%, rgba(28,20,18,0.66) 50%, rgba(28,20,18,0.12) 100%)' }),
    { type: 'img', props: { src: catUri, width: 260, height: 294, style: { position: 'absolute', right: 90, bottom: 44, width: 260, height: 294 } } },
    el('div', { position: 'absolute', left: 72, top: 0, width: 760, height: 630, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14 }, [
      el('div', { fontSize: 28, opacity: 0.9, display: 'flex' }, x.date + ' · ' + x.room),
      el('div', { fontSize: 84, lineHeight: 1.1, display: 'flex' }, x.big),
      el('div', { fontSize: 36, opacity: 0.95, display: 'flex' }, x.cum),
      el('div', { marginTop: 10, padding: '12px 24px', borderRadius: 999, background: '#e39a4c', color: '#2b1d12', fontSize: 28, display: 'flex' }, x.cta),
      el('div', { fontSize: 24, opacity: 0.8, marginTop: 6, display: 'flex' }, x.tagline),
    ]),
  ]);
  const svg = await satori(tree, {
    width: 1200, height: 630,
    fonts: [{ name: 'Gowun Dodum', data: fontData, weight: 400, style: 'normal' }],
    loadAdditionalAsset: async () => '',
  });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
  return png;
}

function resultHtml(r, origin, dynamic) {
  const x = texts(r);
  const qs = paramsOf(r);
  const img = dynamic ? `${origin}/og?${qs}` : staticImage(r);
  const target = `${SITE}?${qs}`;
  const self = `${origin}/r?${qs}`;
  return `<!doctype html><html lang="${r.lang}"><head><meta charset="utf-8">
<title>${esc(x.title)} · ${esc(x.room)}</title>
<meta name="description" content="${esc(x.desc)}">
<meta name="robots" content="noindex">
<link rel="canonical" href="${esc(target)}">
<meta property="og:type" content="website"><meta property="og:site_name" content="콩이네 방">
<meta property="og:url" content="${esc(self)}">
<meta property="og:title" content="${esc(x.title)}">
<meta property="og:description" content="${esc(x.desc)}">
<meta property="og:image" content="${esc(img)}"><meta property="og:image:secure_url" content="${esc(img)}">
<meta property="og:image:type" content="${dynamic ? 'image/png' : 'image/jpeg'}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(x.big)}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(x.title)}">
<meta name="twitter:description" content="${esc(x.desc)}"><meta name="twitter:image" content="${esc(img)}">
<meta http-equiv="refresh" content="0;url=${esc(target)}">
<style>body{font-family:system-ui,sans-serif;background:#ece3d4;color:#372c25;margin:0;padding:24px;text-align:center}img{max-width:100%;border-radius:12px}a{color:#4f6d52}</style>
</head><body><p>${esc(x.title)}</p><p><img src="${esc(img)}" alt="${esc(x.big)}" width="600"></p><p><a href="${esc(target)}">${esc(x.cta)} →</a></p>
<script>location.replace(${JSON.stringify(target)})</script></body></html>`;
}

export default {
  async fetch(request, env) {
    const dynamic = String((env && env.DYNAMIC_OG) || '').toLowerCase() === 'true';
    const url = new URL(request.url);
    const origin = url.origin;
    const path = url.pathname.replace(/\/+$/, '') || '/';
    const cache = caches.default;

    if (path === '/og' || path === '/og.png') {
      const r = parse(url);
      if (!dynamic) return Response.redirect(staticImage(r), 302);
      const key = new Request(`${origin}/og?${paramsOf(r)}`);
      const hit = await cache.match(key);
      if (hit) return hit;
      try {
        const png = await renderPng(r);
        const res = new Response(png, { headers: { 'content-type': 'image/png', 'cache-control': 'public, max-age=604800, immutable', 'access-control-allow-origin': '*' } });
        await cache.put(key, res.clone());
        return res;
      } catch (e) {
        console.error('og render failed', e && (e.stack || e.message || e));
        if (url.searchParams.get('debug') === '1') return new Response('render error: ' + (e && (e.stack || e.message || e)), { status: 500, headers: { 'content-type': 'text/plain; charset=utf-8' } });
        return Response.redirect(SITE + 'assets/og.jpg', 302);
      }
    }

    if (path === '/r' || path === '/result') {
      const r = parse(url);
      const ua = request.headers.get('user-agent') || '';
      const wantsHtml = BOT_UA.test(ua) || url.searchParams.get('preview') === '1';
      if (!wantsHtml) return Response.redirect(`${SITE}?${paramsOf(r)}`, 302);
      return new Response(resultHtml(r, origin, dynamic), { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
    }

    if (path === '/health') return new Response('ok', { headers: { 'content-type': 'text/plain' } });
    return Response.redirect(SITE, 302);
  },
};
