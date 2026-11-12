// 검색 노출 기반 테스트: robots.txt·sitemap.xml·index.html 의 head·JSON-LD·접근성 이름·manifest 가 기준을 지키는지.
// 외부 요청 없음. 기준은 docs/seo/SEO_점검_2026-11-11.md 에 적힌 결정을 따른다.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const SITE = 'https://kongi-room.anbu-pilot.workers.dev/';
const html = read('index.html');
const head = html.slice(0, html.indexOf('</head>'));
const attr = (tag, name) => { const m = new RegExp('\\s' + name + '="([^"]*)"').exec(tag); return m ? m[1] : null; };

function robotsGroups(text) {
  const groups = []; const sitemaps = []; let cur = null;
  for (const raw of text.split('\n')) {
    const line = raw.replace(/#.*/, '').trim();
    if (!line) continue;
    const i = line.indexOf(':'); assert.ok(i > 0, 'robots.txt 줄 형식: ' + line);
    const key = line.slice(0, i).trim().toLowerCase(); const val = line.slice(i + 1).trim();
    if (key === 'user-agent') { if (!cur || cur.rules.length) { cur = { agents: [], rules: [] }; groups.push(cur); } cur.agents.push(val); }
    else if (key === 'allow' || key === 'disallow') { assert.ok(cur, 'User-agent 없이 규칙: ' + line); cur.rules.push([key, val]); }
    else if (key === 'sitemap') sitemaps.push(val);
    else assert.fail('알 수 없는 지시문: ' + line);
  }
  return { groups, sitemaps };
}

test('canonical·og:url 이 같은 https 주소이고, robots 의 Sitemap 줄과 사이트맵의 주소가 그 주소다', () => {
  const canon = /<link rel="canonical" href="([^"]+)">/.exec(head);
  assert.ok(canon, 'canonical 없음'); assert.equal(canon[1], SITE);
  assert.equal(/<meta property="og:url" content="([^"]+)">/.exec(head)[1], SITE);
  const { sitemaps } = robotsGroups(read('robots.txt'));
  assert.deepEqual(sitemaps, [SITE + 'sitemap.xml']);
  assert.match(html, /<link rel="sitemap" type="application\/xml" title="Sitemap" href="sitemap\.xml">/);
});

test('robots.txt: 모두 허용, /api/ 만 제외, 공유 페이지(/r·/og)는 막지 않음(noindex 를 읽어야 함), AI 크롤러 그룹이 명시돼 있다', () => {
  const { groups } = robotsGroups(read('robots.txt'));
  const star = groups.find((g) => g.agents.includes('*'));
  assert.ok(star, 'User-agent: * 그룹 없음');
  assert.deepEqual(star.rules, [['allow', '/'], ['disallow', '/api/']]);
  for (const ua of ['OAI-SearchBot', 'Claude-SearchBot', 'PerplexityBot', 'GPTBot', 'ClaudeBot', 'Google-Extended', 'CCBot']) {
    const g = groups.find((x) => x.agents.includes(ua));
    assert.ok(g, ua + ' 그룹 없음');
    assert.ok(g.rules.some(([k, v]) => k === 'allow' && v === '/'), ua + ' 가 허용으로 적혀 있지 않음');
  }
  for (const g of groups) for (const [k, v] of g.rules) {
    assert.ok(!(k === 'disallow' && /^\/(r|result|og)(\/|\?|$)/.test(v)), '공유 페이지를 막으면 크롤러가 noindex 를 못 읽음: ' + v);
    assert.ok(!(k === 'disallow' && v === '/'), '전체 차단 금지: ' + g.agents.join(','));
  }
});

test('sitemap.xml: 본문 주소 하나(= canonical), 실제 날짜의 lastmod, priority/changefreq 없음, 그림은 저장소에 있는 파일', () => {
  const s = read('sitemap.xml');
  assert.match(s, /^<\?xml version="1\.0" encoding="UTF-8"\?>\n<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9"/);
  const locs = [...s.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.deepEqual(locs, [SITE], '사이트맵 주소 목록');
  const lm = [...s.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((m) => m[1]);
  assert.equal(lm.length, 1);
  assert.match(lm[0], /^\d{4}-\d{2}-\d{2}$/, 'lastmod 는 YYYY-MM-DD');
  const d = Date.parse(lm[0] + 'T00:00:00Z');
  assert.ok(!Number.isNaN(d) && d <= Date.now() + 36 * 3600 * 1000, 'lastmod 가 미래 날짜');
  assert.ok(!/<priority>|<changefreq>|<image:title>|<image:caption>/.test(s), '구글이 무시하거나 폐기한 태그');
  for (const m of s.matchAll(/<image:loc>([^<]+)<\/image:loc>/g)) {
    assert.ok(m[1].startsWith(SITE), '그림 주소는 같은 사이트');
    assert.ok(fs.existsSync(path.join(root, m[1].slice(SITE.length))), '그림 파일 없음: ' + m[1]);
  }
});

test('head: lang=ko, title·description 하나씩, noindex 없음, og:image·아이콘·manifest 가 있다', () => {
  assert.match(html, /^<!doctype html>\n<html lang="ko">/);
  const titles = [...head.matchAll(/<title>([^<]*)<\/title>/g)].map((m) => m[1]);
  assert.equal(titles.length, 1); assert.ok(titles[0].length >= 10 && titles[0].length <= 70, 'title 길이 ' + titles[0].length);
  assert.ok(titles[0].includes('콩이네 방') && titles[0].includes('타이머'));
  const descs = [...head.matchAll(/<meta name="description" content="([^"]*)">/g)].map((m) => m[1]);
  assert.equal(descs.length, 1); assert.ok(descs[0].length >= 40 && descs[0].length <= 160, 'description 길이 ' + descs[0].length);
  assert.ok(descs[0].startsWith('콩이네 방은 '), '설명은 "콩이네 방은 …" 정의문으로 시작');
  const robots = /<meta name="robots" content="([^"]*)">/.exec(head);
  assert.ok(robots && !/noindex|nofollow|none/.test(robots[1]), 'robots meta 가 색인을 막음');
  assert.equal(/<meta property="og:description" content="([^"]*)">/.exec(head)[1], descs[0]);
  assert.match(head, /<meta property="og:image" content="https:\/\/kongi-room\.anbu-pilot\.workers\.dev\/assets\/og\.jpg">/);
  assert.ok(fs.existsSync(path.join(root, 'assets/og.jpg')));
  assert.match(head, /<meta property="og:image:alt" content="[^"]+">/);
  assert.match(head, /<link rel="icon" type="image\/svg\+xml" href="icons\/icon\.svg">/);
  assert.match(head, /<link rel="manifest" href="manifest\.webmanifest">/);
  assert.match(head, /<meta name="viewport" content="width=device-width,initial-scale=1/);
  assert.equal((html.match(/<h1[\s>]/g) || []).length, 1, 'h1 은 하나');
  assert.ok(!/<h4|<h5|<h6/.test(html) && /<h2[\s>]/.test(html) && /<h3[\s>]/.test(html), '제목 계층 h1→h2→h3');
});

test('JSON-LD: WebSite + WebApplication, 필수 속성과 절대 주소, 사실만(무료·0원), FAQPage/HowTo 없음', () => {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g)].map((m) => JSON.parse(m[1]));
  assert.equal(blocks.length, 1);
  const doc = blocks[0];
  assert.equal(doc['@context'], 'https://schema.org');
  const nodes = doc['@graph'];
  assert.ok(Array.isArray(nodes) && nodes.length >= 2);
  const types = nodes.map((n) => n['@type']);
  assert.ok(!types.some((t) => /FAQPage|HowTo/.test(String(t))), '리치 결과가 없는 타입 금지');
  const site = nodes.find((n) => n['@type'] === 'WebSite');
  assert.ok(site); assert.equal(site.url, SITE); assert.equal(site.name, '콩이네 방');
  const app = nodes.find((n) => n['@type'] === 'WebApplication');
  assert.ok(app, 'WebApplication 없음');
  for (const k of ['name', 'url', 'description', 'applicationCategory', 'operatingSystem', 'offers', 'image']) assert.ok(app[k], 'WebApplication.' + k + ' 없음');
  assert.equal(app.url, SITE);
  assert.equal(app.offers['@type'], 'Offer'); assert.equal(app.offers.price, '0'); assert.match(app.offers.priceCurrency, /^[A-Z]{3}$/);
  assert.equal(app.isAccessibleForFree, true);
  assert.ok(!('aggregateRating' in app) && !('review' in app), '평점·리뷰는 실제 데이터가 없으므로 넣지 않음');
  assert.match(app.dateModified, /^\d{4}-\d{2}-\d{2}$/);
  const seen = JSON.stringify(doc);
  for (const m of seen.matchAll(/"(?:url|image|@id)":"([^"]+)"/g)) assert.ok(m[1].startsWith('https://'), '절대 주소가 아님: ' + m[1]);
  assert.ok(app.description === site.description && app.description.startsWith('콩이네 방은 '), '정의문 설명');
  const maker = nodes.find((n) => n['@type'] === 'Person');
  assert.ok(maker && html.includes('만든 사람: ' + maker.name), '만든 사람은 푸터 문구와 같아야 함');
  assert.ok(!('email' in maker) && !/[\w.+-]+@[\w-]+\.[a-z]{2,}/i.test(JSON.stringify(maker)), '연락처는 구조화 데이터에 넣지 않음');
});

test('모든 img 에 alt 속성이 있고, 입력·선택·버튼에 접근성 이름이 있다 (JS 가 채우기 전에도)', () => {
  const imgs = [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
  assert.ok(imgs.length >= 5);
  for (const t of imgs) assert.ok(/\salt="[^"]*"/.test(t), 'alt 없는 img: ' + t.slice(0, 80));
  const fields = [...html.matchAll(/<(input|select|textarea)\b[^>]*>/g)];
  const missing = [];
  for (const m of fields) {
    const t = m[0]; const type = attr(t, 'type');
    if (type === 'hidden') continue;
    const id = attr(t, 'id');
    const inLabel = html.lastIndexOf('<label', m.index) > html.lastIndexOf('</label>', m.index);
    const named = attr(t, 'aria-label') || attr(t, 'aria-labelledby') || attr(t, 'title') || inLabel || (id && html.includes('for="' + id + '"'));
    if (!named) missing.push(t.slice(0, 90));
  }
  assert.deepEqual(missing, [], '이름 없는 입력 요소');
  const buttons = [...html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)];
  const unnamed = [];
  for (const m of buttons) {
    const tagAttrs = ' ' + m[1]; const inner = m[2].replace(/<[^>]+>/g, '').replace(/\s+/g, '');
    const named = /\saria-label="[^"]+"/.test(tagAttrs) || /\saria-labelledby="[^"]+"/.test(tagAttrs) || /\stitle="[^"]+"/.test(tagAttrs) || inner.length > 0 || /<img\b[^>]*alt="[^"]+"/.test(m[2]);
    if (!named) unnamed.push(m[0].slice(0, 90));
  }
  assert.deepEqual(unnamed, [], '이름 없는 버튼');
  for (const m of html.matchAll(/<canvas\b[^>]*>/g)) assert.ok(/aria-label(ledby)?="[^"]+"/.test(m[0]), '이름 없는 canvas: ' + m[0]);
});

test('manifest.webmanifest: 유효한 JSON, 이름·시작 주소·표시 방식·192/512/maskable 아이콘, 아이콘 파일 존재', () => {
  const m = JSON.parse(read('manifest.webmanifest'));
  for (const k of ['name', 'short_name', 'start_url', 'display', 'icons', 'lang', 'theme_color', 'background_color']) assert.ok(m[k], 'manifest.' + k + ' 없음');
  assert.equal(m.lang, 'ko');
  assert.ok(m.short_name.length <= 12);
  const sizes = new Set(m.icons.map((i) => i.sizes));
  assert.ok(sizes.has('192x192') && sizes.has('512x512'));
  assert.ok(m.icons.some((i) => i.purpose === 'maskable'));
  for (const i of m.icons) assert.ok(fs.existsSync(path.join(root, i.src)), '아이콘 파일 없음: ' + i.src);
});

// aria-hidden="true" 요소의 안쪽 HTML 을 태그 짝을 맞춰 잘라낸다 (void 요소는 닫는 태그가 없음).
function hiddenSubtrees(src) {
  const VOID = new Set(['img', 'input', 'br', 'hr', 'meta', 'link', 'source', 'wbr', 'area', 'base', 'col', 'embed', 'track']);
  const out = [];
  for (const m of src.matchAll(/<([a-z][a-z0-9-]*)\b[^>]*\saria-hidden="true"[^>]*>/g)) {
    const tag = m[1]; if (VOID.has(tag)) continue;
    const re = new RegExp('<(/?)' + tag + '\\b[^>]*>', 'g'); re.lastIndex = m.index + m[0].length;
    let depth = 1, x;
    while ((x = re.exec(src))) { depth += x[1] ? -1 : 1; if (depth === 0) break; }
    assert.ok(x, 'aria-hidden 요소의 닫는 태그를 못 찾음: ' + m[0].slice(0, 80));
    out.push({ open: m[0], inner: src.slice(m.index + m[0].length, x.index) });
  }
  return out;
}

test('aria-hidden 조상 아래에 button·a[href]·input·select·textarea·tabindex 가 없다 (정적 HTML + 장식 층을 채우는 app.js)', () => {
  const trees = hiddenSubtrees(html);
  assert.ok(trees.length >= 5, 'aria-hidden 장식 요소가 있어야 정상: ' + trees.length);
  const bad = [];
  for (const { open, inner } of trees) {
    for (const f of inner.matchAll(/<(button|select|textarea)\b|<a\b[^>]*\shref=|<input\b(?![^>]*type="hidden")|\stabindex="(?!-1")/g)) bad.push(open.slice(0, 60) + ' ⊃ ' + inner.slice(f.index, f.index + 50));
  }
  assert.deepEqual(bad, [], '보조기기·에이전트 접근성 트리에서 숨겨지는 조작 요소');
  // 장식 층(#decorLayer)은 계속 aria-hidden, 누를 수 있는 오늘의 소품은 그 밖의 형제 층(#decorItems)에 — 2026-11-12 감사 H-4
  assert.match(html, /<div class="decor-layer" id="decorLayer" aria-hidden="true"><\/div>\n\s*<div class="decor-items" id="decorItems"><\/div>/);
  const app = read('app.js');
  assert.match(app, /const items=\$\('#decorItems'\)/, 'app.js 가 #decorItems 를 쓴다');
  assert.match(app, /className='decor daily-item'[\s\S]{0,400}items\.appendChild\(it\)/, '오늘의 소품 버튼은 #decorItems 에 붙인다');
  assert.ok(!/layer\.appendChild\(it\)/.test(app), '버튼을 aria-hidden 장식 층에 넣지 않는다');
  assert.match(app, /it\.setAttribute\('aria-label',t\('daily\.itemTitle'\)\)/, '버튼 접근성 이름은 i18n 키 daily.itemTitle');
});
