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

test('sw.js 캐시 버전은 kongi-v31 이상이다 (파일을 바꾸면 올려야 함)', () => {
  const m = /const VERSION = 'kongi-v(\d+)'/.exec(read('sw.js'));
  assert.ok(m, 'VERSION 문자열을 찾지 못함');
  assert.ok(+m[1] >= 31, '버전 ' + m[1]);
});

test('외부 스크립트·추적 코드가 없다 (Google Fonts 스타일시트만 허용)', () => {
  const html = read('index.html');
  const ext = [...html.matchAll(/<script[^>]*src="(https?:[^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(ext, [], '외부 스크립트');
  const links = [...html.matchAll(/<link[^>]*href="(https?:[^"]+)"/g)].map((m) => m[1]).filter((u) => !/^https:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|kongi-room\.anbu-pilot\.workers\.dev)/.test(u));
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
  assert.match(html, /mailto:hana\.park86@outlook\.com/);
  assert.match(html, /class="maker-note"/);
  assert.ok(!/stripe\.com|paypal\.com|checkout|price_|구매하기|결제하기|회원가입|type="password"/i.test(html), '결제·계정 흔적');
  assert.ok(/가입 없이|no sign-up|ohne Anmeldung/i.test(html + read('i18n.js')), '계정 없는 무료 타이머 안내');
});
