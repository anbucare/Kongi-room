// 서비스 워커·페이지 구조 테스트: 앱 셸 캐시 목록에 페이지가 쓰는 파일이 빠지지 않았는지, 버전이 바뀌었는지, 외부 스크립트가 없는지.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');

test('sw.js 캐시 목록에 index.html 이 쓰는 로컬 css/js/manifest 가 모두 들어 있다', () => {
  const html = read('index.html');
  const sw = read('sw.js');
  const shell = [...sw.matchAll(/'\.\/([^']+)'/g)].map((m) => m[1]);
  const needed = new Set();
  for (const m of html.matchAll(/<script src="([^"]+)"/g)) needed.add(m[1]);
  for (const m of html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)) if (!/^https?:/.test(m[1])) needed.add(m[1]);
  for (const m of html.matchAll(/<link rel="manifest" href="([^"]+)"/g)) needed.add(m[1]);
  assert.ok(needed.has('app.js') && needed.has('core.js') && needed.has('i18n.js') && needed.has('app.css'));
  const missing = [...needed].filter((f) => !shell.includes(f));
  assert.deepEqual(missing, [], 'sw.js SHELL 에 빠진 파일');
  for (const f of shell) assert.ok(fs.existsSync(path.join(root, f)), 'SHELL 에 적힌 파일이 저장소에 없음: ' + f);
});

test('sw.js 캐시 버전은 kongi-v34 이상이다 (파일을 바꾸면 올려야 함)', () => {
  const m = /const VERSION = 'kongi-v(\d+)'/.exec(read('sw.js'));
  assert.ok(m, 'VERSION 문자열을 찾지 못함');
  assert.ok(+m[1] >= 34, '버전 ' + m[1]);
});

test('외부 스크립트·추적 코드·외부 글꼴이 없다 (글꼴은 fonts.css 로 직접 내보냄)', () => {
  const html = read('index.html');
  const ext = [...html.matchAll(/<script[^>]*src="(https?:[^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(ext, [], '외부 스크립트');
  const links = [...html.matchAll(/<link[^>]*href="(https?:[^"]+)"/g)].map((m) => m[1]).filter((u) => !/^https:\/\/kongi-room\.anbu-pilot\.workers\.dev/.test(u));
  assert.deepEqual(links, [], '허용되지 않은 외부 링크');
  assert.ok(!/gtag|googletagmanager|analytics\.js|hotjar|plausible|umami/i.test(html + read('app.js')), '추적 스크립트 흔적');
});

test('공유는 외부 스크립트 없이 링크만 쓴다: WhatsApp 은 wa.me, X·Threads 는 intent 링크', () => {
  const app = read('app.js');
  assert.match(app, /https:\/\/wa\.me\/\?text=/, 'WhatsApp wa.me 링크');
  assert.match(app, /https:\/\/x\.com\/intent\/post/);
  assert.match(app, /https:\/\/www\.threads\.net\/intent\/post/);
  const html = read('index.html');
  for (const id of ['shWhatsApp', 'shCopy', 'shKakao', 'shX', 'shThreads']) assert.match(html, new RegExp('id="' + id + '"'), id + ' 버튼');
});

test('결제·계정 기능이 없고, 만든 사람과 메일 연락처가 푸터에 있다', () => {
  const html = read('index.html');
  assert.match(html, /mailto:hana@qwerklab\.com/);
  assert.match(html, /class="maker-note"/);
  assert.ok(!/stripe\.com|paypal\.com|checkout|price_|구매하기|결제하기|회원가입|type="password"/i.test(html), '결제·계정 흔적');
  assert.ok(/가입 없이|no sign-up|ohne Anmeldung/i.test(html + read('i18n.js')), '계정 없는 무료 타이머 안내');
});

test('몰입 단계 목록(#stages)은 list-style:none + flex 라서 Safari 가 목록 의미를 지운다 → role="list" 로 되살린다 (Modern Web Guidance 2차)', () => {
  const html = read('index.html');
  const css = read('app.css');
  assert.match(css, /\.stages\{[^}]*display:flex[^}]*list-style:none/, '.stages 가 flex + list-style:none 이다');
  assert.match(html, /<ol class="stages" id="stages" role="list"/, '#stages 에 role="list"');
});

test('app.js·core.js·i18n.js·sw.js 가 문법 오류 없이 읽힌다 (한 곳이 깨지면 앱 전체가 멈춘다 — 단위 시험은 app.js 를 읽지 않아 놓칠 수 있다)', () => {
  const vm = require('node:vm');
  for (const f of ['app.js', 'core.js', 'i18n.js', 'sw.js']) assert.doesNotThrow(() => new vm.Script(read(f), { filename: f }), f + ' 문법');
});

test('첫 그리기 자리 예약(CLS): <html> 에 js 표시, 채운 뒤 .ready, app.css 에 폭별 줄 높이 예약 (Modern Web Guidance 2차)', () => {
  const html = read('index.html'), css = read('app.css'), app = read('app.js');
  assert.match(html, /document\.documentElement\.classList\.add\('js'\)/, 'head 스크립트가 js 표시를 붙인다');
  assert.match(app, /function renderStatus\(\)\{\s*const statusEl=\$\('#statusbar'\);if\(statusEl\)statusEl\.classList\.add\('ready'\)/, 'renderStatus 가 .ready 를 붙인다');
  // 예약은 "자바스크립트가 켜져 있고 아직 채우기 전"에만: .js ... :not(.ready) 가 아닌 규칙으로 .statusbar 의 높이를 건드리면 채운 뒤 모습이 바뀐다
  assert.match(css, /\.js \.statusbar:not\(\.ready\)\{grid-template-rows:\d+px;align-content:start\}/, '넓은 화면 예약');
  assert.match(css, /@media \(max-width:900px\)\{\.js \.statusbar:not\(\.ready\)\{grid-template-rows:(\d+px ?){3}\}\}/, '900px 이하 3줄 예약');
  assert.match(css, /@media \(max-width:520px\)\{\.js \.statusbar:not\(\.ready\)\{grid-template-rows:(\d+px ?){4}\}\}/, '520px 이하 4줄 예약');
  const loose = [...css.matchAll(/\.statusbar\{[^}]*grid-template-rows/g)];
  assert.equal(loose.length, 0, '.ready 없이 .statusbar 줄 높이를 고정하는 규칙이 없다');
});

test('소개 글(.lead)의 HTML 기본 문구는 i18n.js 한국어 문구와 같다 — 다르면 자바스크립트가 문구를 바꾸는 순간 글줄 수가 달라져 아래 화면이 밀린다 (CLS)', () => {
  const html = read('index.html');
  const w = {}; new Function('window', read('i18n.js'))(w);
  const ko = w.KONGI_I18N.ko;
  for (const key of ['lead.what', 'lead.how']) {
    const m = new RegExp('data-i18n="' + key.replace('.', '\\.') + '">([^<]*)<').exec(html);
    assert.ok(m, key + ' 요소를 index.html 에서 찾지 못함');
    assert.equal(m[1].replace(/\s+/g, ' ').trim(), String(ko[key]).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(), key + ' 의 HTML 기본 문구가 i18n.js 한국어와 다르다');
  }
});
