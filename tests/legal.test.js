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
    // 독일어·한국어·영어 칸 어디에서도 주소가 다르게 적히면 안 된다 (한 칸만 고치는 실수 방지)
    for (const m of html.matchAll(/Lessingstra(?:ß|ss)e\s*\d+[a-z]?/g)) assert.equal(m[0], 'Lessingstraße 13', f + ' 에 다른 번지: ' + m[0]);
    for (const m of html.matchAll(/\b\d{5}\s+Oberursel/g)) assert.equal(m[0], '61440 Oberursel', f + ' 에 다른 우편번호: ' + m[0]);
    for (const m of html.matchAll(/mailto:([^"?]+)/g)) assert.equal(m[1], mail, f + ' 에 다른 메일: ' + m[1]);
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

test('개인정보 안내의 브라우저 저장 항목 = 코드가 실제로 쓰는 localStorage 키 (변수로 넘기는 키 포함)', () => {
  const files = ['app.js', 'core.js', 'index.html'];
  const keys = new Set();
  for (const f of files) {
    const src = read(f);
    for (const m of src.matchAll(/store\.(?:get|set|del)\('([a-zA-Z0-9_]+)'/g)) keys.add(m[1]);
    for (const m of src.matchAll(/localStorage\.(?:getItem|setItem|removeItem)\('([a-zA-Z0-9_]+)'/g)) keys.add(m[1]);
    // 변수로 넘기는 키: 같은 줄에 "변수='키'" 가 있어야 한다 (예: const k='petXp',d=store.get(k,…)). 못 찾으면 실패시켜 사람이 보게 한다.
    for (const line of src.split('\n')) {
      if (/function store|^\s*(?:get|set|del)\(k/.test(line)) continue; // store 자체의 정의
      for (const m of line.matchAll(/store\.(?:get|set|del)\(([A-Za-z_$][\w$]*)[,)]/g)) {
        const v = new RegExp('\\b' + m[1] + "\\s*=\\s*'([a-zA-Z0-9_]+)'").exec(line);
        assert.ok(v, f + ': store 키를 변수(' + m[1] + ')로 넘기는데 같은 줄에서 값을 찾지 못함 → datenschutz.html 2번을 직접 확인할 것');
        keys.add(v[1]);
      }
      assert.ok(!/store\.(?:get|set|del)\(`/.test(line), f + ': 문자열 틀(`)로 만든 store 키는 이 시험이 셀 수 없음');
    }
  }
  assert.ok(keys.has('petXp'), '변수 키(petXp)를 세지 못함');
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

test('개인정보 안내의 결과 링크·함께 집중 링크 항목 = 링크를 만드는 코드 (앱과 공유 워커 모두)', () => {
  const paramsIn = (body) => {
    const set = new Set([...body.matchAll(/\b([a-z]+):/g)].map((m) => m[1]));
    for (const m of body.matchAll(/p\.set\('([a-z]+)'/g)) set.add(m[1]);
    return [...set].sort();
  };
  const ds = read('datenschutz.html'), app = read('app.js');
  const result = listIn(ds, 'result-link-params');
  const worker = /function paramsOf\(r\) \{([\s\S]*?)\n\}/.exec(read('worker/src/index.js'))[1];
  assert.deepEqual(paramsOf(worker), result, '공유 워커 paramsOf');
  const appResult = /function resultUrl\(st\)\{([\s\S]*?)\n\}/.exec(app)[1];
  assert.deepEqual(paramsIn(appResult.split('return')[0]), result, '앱 resultUrl');
  const tg = /function buildTogether\(\)\{([\s\S]*?)const url=/.exec(app)[1];
  const tgParams = paramsIn(/URLSearchParams\(\{([^}]*)\}\)/.exec(tg)[1] + ' ' + tg.slice(tg.indexOf('p.set')));
  assert.deepEqual(tgParams, listIn(ds, 'together-link-params'), '함께 집중 링크 buildTogether');
  function paramsOf(body) { return paramsIn(/new URLSearchParams\(\{([\s\S]*?)\}\)/.exec(body)[1] + ' ' + body.slice(body.indexOf('p.set'))); }
});

test('브라우저가 다른 회사 서버에서 불러오는 것은 개인정보 안내에 적힌 Google 글꼴뿐이다 (링크는 제외)', () => {
  const html = read('index.html'), app = read('app.js') + read('core.js');
  const loads = new Set();
  const host = (u) => new URL(u).host;
  for (const m of html.matchAll(/<(?:script|img|iframe|audio|video|source)\b[^>]*\bsrc="(https?:[^"]+)"/g)) loads.add(host(m[1]));
  for (const m of html.matchAll(/<link\b[^>]*rel="(?:stylesheet|preload|modulepreload|preconnect|dns-prefetch|prefetch)"[^>]*href="(https?:[^"]+)"/g)) loads.add(host(m[1]));
  for (const m of app.matchAll(/\.src\s*=\s*'(https?:[^']+)'/g)) loads.add(host(m[1]));
  for (const m of app.matchAll(/\b[a-z]\.href\s*=\s*'(https?:[^']+)'/g)) loads.add(host(m[1])); // JS 로 만든 <link rel=stylesheet>
  for (const m of (html + app).matchAll(/fetch\(\s*['"`](https?:[^'"`]+)/g)) loads.add(host(m[1]));
  for (const m of html.matchAll(/fetch\(\s*([A-Z]+)\s*\+/g)) loads.add(host(new RegExp('var ' + m[1] + "='([^']+)'").exec(html)[1]));
  const own = 'kongi-room.anbu-pilot.workers.dev';
  const allowed = new Set(['fonts.googleapis.com', 'fonts.gstatic.com', own,
    't1.kakaocdn.net']); // 카카오 SDK: 키가 비어 있으면 불러오지 않음(아래에서 확인)
  assert.deepEqual([...loads].filter((h) => !allowed.has(h)), [], '새 외부 불러오기가 생겼으면 datenschutz.html 에 적고 이 목록에 넣을 것');
  assert.ok(loads.has('fonts.googleapis.com'), '시험이 Google 글꼴 불러오기를 찾지 못함 (정규식 확인)');
  const ds = read('datenschutz.html');
  assert.ok(ds.includes('Google Fonts') && ds.includes('Gowun Dodum') && ds.includes('Gowun Batang'));
  assert.match(read('app.js'), /const KAKAO_JS_KEY='';/, '카카오 키가 생겼으면 datenschutz.html 6번(카카오 프로그램을 불러오지 않음)을 고칠 것');
  assert.ok(!/youtube/i.test(html + app) || /YouTube/.test(ds), 'YouTube 를 쓰게 되면 datenschutz.html 에 적을 것');
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
