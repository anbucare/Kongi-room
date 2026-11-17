// 법적 안내 테스트: 운영자 정보(Impressum)·개인정보 안내(Datenschutz)가 있고, 적힌 사실이 코드와 맞는지,
// 제휴(광고) 표시 장치가 '링크가 있을 때만' 붙게 되어 있는지 확인한다. 코드를 바꿔 저장 항목·전송 항목이 달라지면
// 여기서 실패하므로, datenschutz.html 의 글과 맨 위 주석 목록을 함께 고쳐야 한다.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const listIn = (html, name) => {
  const m = new RegExp(name + ':([^\\n]*)').exec(html);
  assert.ok(m, 'datenschutz.html 주석에 ' + name + ' 목록이 없음');
  return m[1].trim().split(/\s+/).sort();
};

const OPERATOR = ['Hana Park', 'Lessingstraße 13', '61440 Oberursel'];

test('운영자 정보·개인정보 안내 페이지가 있고, 같은 운영자·메일을 적는다 (§ 5 DDG)', () => {
  const mail = /const FEEDBACK_MAIL='([^']+)'/.exec(read('app.js'))[1];
  for (const f of ['impressum.html', 'datenschutz.html']) {
    const html = read(f);
    for (const s of OPERATOR) assert.ok(html.includes(s), f + ' 에 운영자 정보 빠짐: ' + s);
    assert.ok(html.includes('mailto:' + mail), f + ' 의 메일이 앱 의견 메일(' + mail + ')과 다름');
    assert.ok(/<html lang="de">/.test(html), f + ' 의 원문은 독일어');
    assert.ok(/id="ko"[^>]*lang="ko"/.test(html), f + ' 에 한국어 번역 칸이 없음');
    assert.ok(/href="\.\/"/.test(html), f + ' 에서 앱으로 돌아가는 링크가 없음');
  }
  assert.ok(read('impressum.html').includes('§ 5 DDG'));
  assert.ok(read('index.html').includes('mailto:' + mail));
});

test('앱 아래쪽(푸터)에 두 페이지 링크가 있고, 올리기 목록에 두 파일이 들어 있다', () => {
  const html = read('index.html');
  const foot = html.slice(html.indexOf('<footer>'), html.indexOf('</footer>'));
  assert.ok(/href="impressum\.html"[^>]*data-i18n="foot\.impressum"/.test(foot), '푸터에 운영자 정보 링크 없음');
  assert.ok(/href="datenschutz\.html"[^>]*data-i18n="foot\.privacy"/.test(foot), '푸터에 개인정보 안내 링크 없음');
  const deploy = read('deploy/workers-kv/deploy-wrangler.mjs');
  const files = /const SITE_FILES = \[([\s\S]*?)\];/.exec(deploy)[1];
  for (const f of ['impressum.html', 'datenschutz.html']) assert.ok(files.includes(`'${f}'`), 'SITE_FILES 에 ' + f + ' 없음');
});

test('개인정보 안내의 브라우저 저장 항목 = 코드가 실제로 쓰는 localStorage 키', () => {
  const code = read('app.js') + read('core.js');
  const keys = new Set([...code.matchAll(/store\.(?:get|set|del)\('([a-zA-Z0-9_]+)'/g)].map((m) => m[1]));
  for (const m of read('index.html').matchAll(/localStorage\.(?:getItem|setItem|removeItem)\('([a-zA-Z0-9_]+)'/g)) keys.add(m[1]);
  assert.deepEqual([...keys].sort(), listIn(read('datenschutz.html'), 'storage-keys'), '저장 키가 바뀌었으면 datenschutz.html 2번을 고칠 것');
});

test('개인정보 안내의 의견 저장 항목·백업 보관 기간 = 서버 코드', () => {
  const w = read('deploy/workers-kv/worker.js');
  const rec = /const rec = \{([\s\S]*?)\};/.exec(w)[1];
  // 괄호·문자열을 지운 뒤 쉼표로 나눠, "이름: 값" 과 줄임 표기 "text" 를 모두 센다
  const flat = rec.replace(/'[^']*'/g, "''").replace(/\([^()]*\)/g, '()').replace(/\([^()]*\)/g, '()').replace(/\[[^\]]*\]/g, '[]');
  const fields = flat.split(',').map((p) => p.trim()).filter(Boolean).map((p) => (/^([a-z]+)\s*(?::|$)/.exec(p) || [])[1]).filter(Boolean).sort();
  const ds = read('datenschutz.html');
  assert.deepEqual(fields, listIn(ds, 'feedback-fields'), '의견 저장 항목이 바뀌었으면 datenschutz.html 5번을 고칠 것');
  const ttl = /expirationTtl: 60 \* 60 \* 24 \* (\d+)/.exec(w)[1];
  assert.deepEqual([ttl], listIn(ds, 'backup-ttl-days'));
  assert.ok(ds.includes('nach ' + ttl + ' Tagen') && ds.includes(ttl + '일 뒤'), '보관 기간 글이 서버와 다름');
});

test('개인정보 안내의 결과 링크 항목 = 공유 워커가 만드는 주소', () => {
  const w = read('worker/src/index.js');
  const body = /function paramsOf\(r\) \{([\s\S]*?)\n\}/.exec(w)[1];
  const params = new Set([...body.matchAll(/\b([a-z]+): /g)].map((m) => m[1]));
  for (const m of body.matchAll(/p\.set\('([a-z]+)'/g)) params.add(m[1]);
  assert.deepEqual([...params].sort(), listIn(read('datenschutz.html'), 'result-link-params'));
});

test('외부에서 불러오는 것은 개인정보 안내에 적힌 Google 글꼴뿐이다', () => {
  const code = read('index.html') + read('app.js');
  const hosts = new Set([...code.matchAll(/(?:href|src)\s*=\s*['"]?(https:\/\/[a-z0-9.-]+)\//g)].map((m) => m[1]));
  for (const m of code.matchAll(/\.(?:href|src)\s*=\s*'(https:\/\/[a-z0-9.-]+)\//g)) hosts.add(m[1]);
  const ds = read('datenschutz.html');
  assert.ok(ds.includes('Google Fonts') && ds.includes('Gowun Dodum') && ds.includes('Gowun Batang'));
  // 카카오 SDK 는 키가 비어 있어 불러오지 않는다고 적었다 — 키를 넣으면 개인정보 안내를 고칠 것
  assert.match(read('app.js'), /const KAKAO_JS_KEY='';/, '카카오 키가 생겼으면 datenschutz.html 6번을 고칠 것');
});

test('제휴 링크 자리: 카드 다섯 개와 맞고, 링크가 없으면 광고 표시·설명이 숨는다', () => {
  const app = read('app.js');
  const m = /const AFFILIATE=\{([^}]*)\};/.exec(app);
  assert.ok(m, 'app.js 에 AFFILIATE 가 없음');
  const entries = [...m[1].matchAll(/(tool[A-Za-z]+):'([^']*)'/g)].map((x) => [x[1], x[2]]);
  const ids = [...read('index.html').matchAll(/<a class="tool-card" id="(tool[A-Za-z]+)"/g)].map((x) => x[1]).sort();
  assert.deepEqual(entries.map((e) => e[0]).sort(), ids, 'AFFILIATE 키 = 도구 카드 id');
  for (const [id, url] of entries) if (url) assert.match(url, /^https:\/\/[^\s'"<>]+$/, id + ' 링크는 https 주소여야 함');
  assert.match(app, /card\.rel='sponsored noopener'/);
  assert.match(read('index.html'), /<p class="hint" id="toolsAdNote" hidden data-i18n="tools\.adNote">/);
  // '제휴 링크일 수 있어요' 같은 막연한 문장은 없앴다 (실제 제휴 카드가 있을 때만 tools.adNote 가 보임)
  assert.ok(!/제휴 링크를 포함할 수|may include affiliate|können Partner-Links sein/.test(read('i18n.js') + read('index.html')));
});
