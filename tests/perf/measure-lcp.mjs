// 휴대폰 첫 화면 속도 재기 (Playwright Chromium: Pixel 5, 느린 4G, CPU 4배, 처음 방문 = 캐시·서비스 워커 없음, 3회 중앙값).
// 키 없는 PageSpeed API 는 하루 할당량이 금방 바닥나 429 라서, 같은 조건을 직접 만들어 잰다. 수치는 PSI 와 비슷한 방향이지만 같지는 않다.
//
// 쓰는 법
//   node tests/perf/measure-lcp.mjs https://kongi-room.anbu-pilot.workers.dev/      # 라이브
//   node tests/perf/measure-lcp.mjs --local .                                      # 이 폴더를 CDN 처럼 압축해 내보내며 잼
//   node tests/perf/measure-lcp.mjs --local /경로/옛_복사본 --runs 5 --waterfall
// 옵션: --h2 (--local 일 때 HTTP/2 로 내보냄: 자체 서명 인증서를 임시 폴더에 만듦. 실제 사이트처럼 한 연결로 여러 파일을 우선순위대로 받음 — 기본 HTTP/1.1 은 연결 6개 제한 때문에 실제와 달라질 수 있음) · --runs N (기본 3) · --locale ko-KR (브라우저 언어, 기본 en-US = PSI 와 같음) · --waterfall (마지막 회 요청 순서·레이아웃 이동 출력) · --json (한 줄 JSON 만)
//
// --local 은 사이트 서버(deploy/workers-kv/worker.js)와 같은 캐시 규칙(html·js·css 는 매번 확인, 글꼴 1년, 그 밖 7일)에
// 글자 파일 brotli 압축(Cloudflare 가 해 주는 것)을 흉내 낸다. 비밀 값·외부 접속은 쓰지 않는다.
import { chromium, devices } from 'playwright';
import http from 'node:http';
import http2 from 'node:http2';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const argv = process.argv.slice(2);
const opt = (name, dflt) => { const i = argv.indexOf(name); return i < 0 ? dflt : argv[i + 1]; };
const RUNS = Number(opt('--runs', 3));
const WATERFALL = argv.includes('--waterfall');
const LOCALE = opt('--locale', 'en-US');
const H2 = argv.includes('--h2');
const JSON_ONLY = argv.includes('--json');
const localDir = opt('--local', null);
let target = argv.find((a, i) => /^https?:/.test(a) && argv[i - 1] !== '--local');

const TYPES = { html: 'text/html; charset=utf-8', css: 'text/css; charset=utf-8', js: 'text/javascript; charset=utf-8', json: 'application/json', webmanifest: 'application/manifest+json', xml: 'application/xml; charset=utf-8', txt: 'text/plain; charset=utf-8', png: 'image/png', webp: 'image/webp', jpg: 'image/jpeg', svg: 'image/svg+xml', woff2: 'font/woff2' };
const REVALIDATE = new Set(['html', 'js', 'css', 'webmanifest', 'xml', 'txt', 'json']);
const TEXTY = new Set(['html', 'js', 'css', 'json', 'webmanifest', 'xml', 'txt', 'svg']);

function serve(root) {
  const brCache = new Map();
  const handler = (req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, '');
    if (p === '' || p.endsWith('/')) p += 'index.html';
    const file = path.join(root, p);
    if (p.includes('..') || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404, { 'content-type': 'text/plain' }); res.end('Not found'); return; }
    const ext = p.split('.').pop().toLowerCase();
    const h = { 'content-type': TYPES[ext] || 'application/octet-stream', 'x-content-type-options': 'nosniff', 'cache-control': REVALIDATE.has(ext) ? 'public, max-age=0, must-revalidate' : (p.startsWith('fonts/') ? 'public, max-age=31536000, immutable' : 'public, max-age=604800') };
    let body = fs.readFileSync(file);
    if (TEXTY.has(ext) && /\bbr\b/.test(req.headers['accept-encoding'] || '')) {
      if (!brCache.has(file)) brCache.set(file, zlib.brotliCompressSync(body, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 4 } }));
      body = brCache.get(file); h['content-encoding'] = 'br'; h.vary = 'Accept-Encoding';
    }
    h['content-length'] = body.length;
    res.writeHead(200, h); res.end(body);
  };
  let server;
  if (H2) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kongi-h2-'));
    execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', path.join(dir, 'k.pem'), '-out', path.join(dir, 'c.pem'), '-days', '1', '-subj', '/CN=localhost'], { stdio: 'ignore' });
    server = http2.createSecureServer({ key: fs.readFileSync(path.join(dir, 'k.pem')), cert: fs.readFileSync(path.join(dir, 'c.pem')), allowHTTP1: true }, handler);
    fs.rmSync(dir, { recursive: true, force: true });
  } else server = http.createServer(handler);
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({ server, url: `${H2 ? 'https' : 'http'}://127.0.0.1:${server.address().port}/` })));
}

const median = (a) => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

// 페이지 안에서 지표를 모으는 관찰자 (문서보다 먼저 실행)
const OBSERVE = () => {
  const m = (window.__m = { lcp: null, fcp: null, shifts: [], tasks: [] });
  const desc = (el) => !el ? null : { tag: el.tagName.toLowerCase(), id: el.id || '', cls: (typeof el.className === 'string' ? el.className : '').slice(0, 60), text: (el.textContent || '').trim().slice(0, 40) };
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) m.lcp = { t: e.startTime, size: e.size, url: e.url || '', el: desc(e.element), render: e.renderTime, load: e.loadTime }; }).observe({ type: 'largest-contentful-paint', buffered: true }); } catch (e) {}
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.name === 'first-contentful-paint') m.fcp = e.startTime; }).observe({ type: 'paint', buffered: true }); } catch (e) {}
  // hadRecentInput 은 걸러내지 않는다: 이 측정에는 사람 입력이 없는데, 크롬이 첫 그리기 직후(약 0.5초 안)의 이동에 '입력 있음' 표시를 붙이는 일이 있어 실제 이동이 빠져 버림
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) m.shifts.push([e.startTime, e.value, (e.sources || []).map((x) => x.node ? ((x.node.id ? '#' + x.node.id : '') + '.' + (typeof x.node.className === 'string' ? x.node.className.split(' ')[0] : '') + '<' + x.node.nodeName.toLowerCase() + '>') : '?').join(',')]); }).observe({ type: 'layout-shift', buffered: true }); } catch (e) {}
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) m.tasks.push([e.startTime, e.duration]); }).observe({ type: 'longtask', buffered: true }); } catch (e) {}
};

function cls(shifts) { // Lighthouse 처럼 세션 창(사이 1초 미만, 최대 5초) 중 가장 큰 값
  let best = 0, cur = 0, first = -1, last = -1;
  for (const [t, v] of shifts) {
    if (first < 0 || t - last > 1000 || t - first > 5000) { cur = 0; first = t; }
    cur += v; last = t; best = Math.max(best, cur);
  }
  return best;
}

async function once(browser, url, wantWaterfall) {
  const ctx = await browser.newContext({ ...devices['Pixel 5'], locale: LOCALE, ignoreHTTPSErrors: H2, serviceWorkers: 'block' });
  await ctx.addInitScript(OBSERVE);
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: false });
  // 느린 4G (Lighthouse/PSI 와 같은 값: 왕복 150ms, 내려받기 1.6 Mbps, 올리기 0.75 Mbps) + CPU 4배 느리게
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: Math.round(1.6 * 1024 * 1024 / 8), uploadThroughput: Math.round(0.75 * 1024 * 1024 / 8) });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const reqs = new Map(); let bytes = 0;
  cdp.on('Network.requestWillBeSent', (e) => { if (!e.request.url.startsWith('data:')) reqs.set(e.requestId, { url: e.request.url.replace(/^https?:\/\/[^/]+/, ''), t0: e.timestamp, type: e.type, prio: e.request.initialPriority }); });
  cdp.on('Network.responseReceived', (e) => { const r = reqs.get(e.requestId); if (r) { r.status = e.response.status; r.tResp = e.timestamp; r.mime = e.response.mimeType; } });
  cdp.on('Network.loadingFinished', (e) => { const r = reqs.get(e.requestId); if (r) { r.tEnd = e.timestamp; r.bytes = e.encodedDataLength; bytes += e.encodedDataLength; } });
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(url, { waitUntil: 'load', timeout: 120000 });
  await page.waitForTimeout(4000); // LCP·긴 작업이 마무리될 때까지
  const r = await page.evaluate(() => { const n = performance.getEntriesByType('navigation')[0]; return { m: window.__m, ttfb: n.responseStart, dcl: n.domContentLoadedEventEnd, load: n.loadEventEnd }; });
  await ctx.close();
  const fcp = r.m.fcp ?? NaN;
  // TBT: 첫 그리기(FCP) 뒤 5초 안의 긴 작업에서 50ms 를 넘는 부분의 합 (Lighthouse 의 TTI 대신 고정 창)
  const tbt = r.m.tasks.filter(([s, d]) => s + d > fcp && s < fcp + 5000).reduce((a, [, d]) => a + Math.max(0, d - 50), 0);
  const t0 = Math.min(...[...reqs.values()].map((x) => x.t0));
  const list = [...reqs.values()].filter((x) => x.tEnd);
  const out = { shifts: r.m.shifts, ttfb: r.ttfb, fcp, lcp: r.m.lcp ? r.m.lcp.t : NaN, lcpEl: r.m.lcp, tbt, cls: cls(r.m.shifts), kb: bytes / 1024, requests: list.length, dcl: r.dcl, load: r.load, errors };
  if (wantWaterfall) out.waterfall = list.map((x) => ({ url: x.url.slice(0, 60), start: Math.round((x.t0 - t0) * 1000), end: Math.round((x.tEnd - t0) * 1000), kb: +(x.bytes / 1024).toFixed(1), type: x.type, prio: x.prio })).sort((a, b) => a.start - b.start);
  return out;
}

let srv = null;
if (localDir) { srv = await serve(path.resolve(localDir)); target = srv.url; }
if (!target) { console.error('주소(https://…) 또는 --local 폴더를 주세요.'); process.exit(2); }
const browser = await chromium.launch();
const startedAt = new Date().toISOString();
const rows = [];
for (let i = 0; i < RUNS; i++) rows.push(await once(browser, target, WATERFALL && i === RUNS - 1));
await browser.close();
if (srv) srv.server.close();
const med = (k) => median(rows.map((r) => r[k]));
const summary = { locale: LOCALE, h2: H2, target: localDir ? `local:${path.resolve(localDir)}` : target, startedAt, runs: RUNS, median: { ttfb: med('ttfb'), fcp: med('fcp'), lcp: med('lcp'), tbt: med('tbt'), cls: med('cls'), kb: med('kb'), requests: med('requests') }, lcpEl: rows.map((r) => r.lcpEl && (r.lcpEl.el ? `${r.lcpEl.el.tag}#${r.lcpEl.el.id}.${r.lcpEl.el.cls}` : '?') + (r.lcpEl.url ? ' ' + r.lcpEl.url.replace(/^https?:\/\/[^/]+/, '') : '')), each: rows.map(({ waterfall, lcpEl, shifts, ...x }) => x), errors: rows.flatMap((r) => r.errors) };
if (JSON_ONLY) { console.log(JSON.stringify(summary)); process.exit(0); }
const f = (v, d = 0) => (Number.isFinite(v) ? v.toFixed(d) : '-');
console.log(`대상: ${summary.target}  (브라우저 언어 ${LOCALE})\n시작(UTC): ${startedAt}   Playwright Chromium ${browser.version?.() ?? ''}`);
console.log('회  TTFB   FCP    LCP    TBT   CLS    전송KB  요청  (DCL·load)');
rows.forEach((r, i) => console.log(`${i + 1}   ${f(r.ttfb).padStart(5)}  ${f(r.fcp).padStart(5)}  ${f(r.lcp).padStart(5)}  ${f(r.tbt).padStart(4)}  ${f(r.cls, 3)}  ${f(r.kb, 1).padStart(6)}  ${String(r.requests).padEnd(3)}  (${f(r.dcl)}·${f(r.load)})`));
const m = summary.median;
console.log(`중앙값 TTFB ${f(m.ttfb)}ms · FCP ${f(m.fcp)}ms · LCP ${f(m.lcp)}ms · TBT ${f(m.tbt)}ms · CLS ${f(m.cls, 3)} · 전송 ${f(m.kb, 1)} KB · 요청 ${f(m.requests)}개`);
console.log('LCP 요소:', summary.lcpEl.join(' | '));
if (summary.errors.length) console.log('콘솔 오류:', [...new Set(summary.errors)].slice(0, 5));
if (WATERFALL) { console.log('--- 마지막 회 레이아웃 이동 (ms, 값, 요소) ---'); for (const [t, v, n] of rows[rows.length - 1].shifts) console.log(`${String(Math.round(t)).padStart(5)}  ${v.toFixed(4)}  ${n}`); console.log('--- 마지막 회 요청 순서 (ms) ---'); for (const w of rows[rows.length - 1].waterfall) console.log(`${String(w.start).padStart(5)} → ${String(w.end).padStart(5)}  ${String(w.kb).padStart(7)}KB  ${w.type.padEnd(10)} ${String(w.prio).padEnd(8)} ${w.url}`); }
