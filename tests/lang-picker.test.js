// 언어 첫 선택·언어 선택 줄 시험.
// 한국어를 모르는 방문자가 첫 화면에서 자기 언어로 보거나 언어 선택을 바로 찾게 한 변경을 고정한다.
// 로직은 core.js(앱이 실제로 쓰는 파일)를 그대로 불러 시험하고, app.js 의 연결 줄과 index.html·app.css 는 실제 파일에서 꺼내 검사한다.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const C = require('../core.js');

const root = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const APP = read('app.js');
const HTML = read('index.html');
const CSS = read('app.css');

// ---------- 1. 언어 정하기 (core.js) ----------
// 가짜 저장소: 앱의 store 와 같은 모양(get → 값 또는 null, set)
function fakeIo(initial = {}) {
  const data = { ...initial };
  const writes = [];
  return { data, writes, get: (k) => (k in data ? data[k] : null), set: (k, v) => { data[k] = v; writes.push([k, v]); } };
}
const pick = (initial, search, languages) => { const io = fakeIo(initial); return { lang: C.resolveLang(io, search, languages), io }; };

test('우선순위 1: 저장된 lang 이 가장 앞선다 (?lang=·진행 기록·브라우저 언어보다)', () => {
  const r = pick({ lang: 'de', intimacy: { xp: 9 } }, '?lang=en', ['ko-KR']);
  assert.equal(r.lang, 'de');
  assert.deepEqual(r.io.writes, [], '이미 저장된 값은 다시 쓰지 않음');
});

test('저장된 값이 ko/en/de 가 아니면 저장된 것으로 치지 않고 다시 정한다', () => {
  assert.equal(pick({ lang: 'fr' }, '', ['de-DE']).lang, 'de');
  assert.equal(pick({ lang: null }, '', ['en-US']).lang, 'en');
});

test('우선순위 2: 첫 방문의 ?lang= 이 브라우저 언어보다 앞선다', () => {
  assert.equal(pick({}, '?lang=de', ['ko-KR']).lang, 'de');
  assert.equal(pick({}, '?x=1&lang=en', ['de-DE']).lang, 'en');
  assert.equal(pick({}, '?lang=fr', ['de-DE']).lang, 'de', '모르는 값은 무시하고 다음 규칙으로');
  assert.equal(pick({}, '?lang=EN', ['de-DE']).lang, 'de', '대문자는 인정하지 않음(예전 동작 그대로)');
});

test('우선순위 3: 기존 사용자(진행 기록 있음 + lang 없음)는 브라우저가 영어여도 ko', () => {
  for (const key of C.PROGRESS_KEYS) {
    const r = pick({ [key]: { any: 1 } }, '', ['en-US', 'de-DE']);
    assert.equal(r.lang, 'ko', key + ' 가 있는 사람은 지금까지 한국어로 쓰던 사람');
  }
});

test('기존 사용자가 ?lang= 링크를 열면 그 화면만 링크 언어로, 저장은 안 한다 (친구 링크 한 번에 영구히 바뀌면 안 됨)', () => {
  const r = pick({ intimacy: { xp: 9 } }, '?lang=en', ['ko-KR']);
  assert.equal(r.lang, 'en', '링크를 보낸 사람 언어로 보임');
  assert.deepEqual(r.io.writes, [], '저장하지 않음');
  assert.equal(C.resolveLang(r.io, '', ['en-US']), 'ko', '다음에 링크 없이 열면 여전히 한국어(기존 사용자 규칙)');
  assert.deepEqual(r.io.writes, [['lang', 'ko']]);
});
test('진행 기록이 없는 첫 방문의 ?lang= 은 저장된다 (이후 기록이 쌓여도 그 언어 유지)', () => {
  const io = fakeIo();
  assert.equal(C.resolveLang(io, '?lang=de', ['ko-KR']), 'de');
  io.set('intimacy', { xp: 9 });
  assert.equal(C.resolveLang(io, '', ['ko-KR']), 'de');
});

test('진행 기록이 아닌 키(테마·시간대·이름 등)는 기존 사용자로 치지 않는다', () => {
  assert.equal(pick({ theme: 'cabin', tod: 'night', petName: 'Mimi', rain: true, lapMode: false }, '', ['de-DE']).lang, 'de');
});

test('기존 사용자 판정에 쓰는 키는 index.html 초반 스크립트(옛 주소 이전)가 쓰는 키를 모두 포함한다', () => {
  const m = /if\(!\(data\.intimacy\|\|data\.log\|\|data\.album\|\|data\.shelf\|\|data\.streak\)\)/.exec(HTML);
  assert.ok(m, 'index.html 의 이전 판정 줄을 찾지 못함');
  for (const k of ['intimacy', 'log', 'album', 'shelf', 'streak']) assert.ok(C.PROGRESS_KEYS.includes(k), k + ' 가 PROGRESS_KEYS 에 없음');
  assert.deepEqual([...C.PROGRESS_KEYS], ['intimacy', 'log', 'album', 'shelf', 'streak', 'doneTotal'], '기존 사용자 판정 키 목록은 바꾸면 안 됨(바꾸려면 이 시험과 datenschutz 확인)');
});

test('우선순위 4: navigator.languages 에서 ko/en/de 중 처음 맞는 것 (주 언어 태그로 비교)', () => {
  assert.equal(pick({}, '', ['de-DE']).lang, 'de');
  assert.equal(pick({}, '', ['de-AT', 'en']).lang, 'de');
  assert.equal(pick({}, '', ['en-GB']).lang, 'en');
  assert.equal(pick({}, '', ['ko-KR']).lang, 'ko');
  assert.equal(pick({}, '', ['fr-FR', 'de-DE', 'en-US']).lang, 'de', '맞지 않는 fr 은 건너뛰고 처음 맞는 de');
  assert.equal(pick({}, '', ['ko_KR']).lang, 'ko', '밑줄로 쓴 옛 안드로이드 태그도');
  assert.equal(pick({}, '', ['EN_gb']).lang, 'en', '대소문자 무시');
  assert.equal(pick({}, '', ['kok-IN']).lang, 'en', '콘칸어(kok)는 한국어(ko)가 아님: 앞글자가 아니라 주 언어 태그 전체를 비교');
  assert.equal(pick({}, '', ['dsb-DE']).lang, 'en', '저지 소르브어(dsb)는 독일어(de)가 아님');
});

test('우선순위 5: 그 밖의 언어(fr-FR 등)와 비어 있는 목록은 en', () => {
  assert.equal(pick({}, '', ['fr-FR']).lang, 'en');
  assert.equal(pick({}, '', ['zh-Hans-CN', 'ja']).lang, 'en');
  assert.equal(pick({}, '', []).lang, 'en');
  assert.equal(pick({}, '', undefined).lang, 'en');
  assert.equal(pick({}, undefined, [null, '']).lang, 'en');
});

test('정해진 값은 lang 으로 저장된다: 이후 진행 기록이 쌓여도 기존 사용자로 잘못 판정되지 않는다', () => {
  const io = fakeIo();
  assert.equal(C.resolveLang(io, '', ['fr-FR']), 'en');
  assert.deepEqual(io.writes, [['lang', 'en']], '첫 방문에서 바로 저장');
  io.set('intimacy', { xp: 40 }); io.set('log', []); // 영어로 몇 번 쓴 뒤
  assert.equal(C.resolveLang(io, '', ['fr-FR']), 'en', '두 번째 방문도 en (ko 로 바뀌면 안 됨)');
  // 첫 방문의 ?lang= 도, 기존 사용자 판정으로 정해진 ko 도 저장된다
  assert.deepEqual(pick({}, '?lang=de', ['ko-KR']).io.writes, [['lang', 'de']]);
  assert.deepEqual(pick({ album: [] }, '', ['en-US']).io.writes, [['lang', 'ko']]);
});

// ---------- 2. app.js 연결 (실제 줄을 꺼내 실행) ----------
function lineOf(src, re, what) {
  const m = re.exec(src);
  assert.ok(m, what + ' 줄을 app.js 에서 찾지 못함 (코드를 고쳤다면 이 시험의 정규식도 맞출 것)');
  return m[0];
}
const STORE_SRC = lineOf(APP, /const store=\{[\s\S]*?\n\};/, 'store 정의');
const BOOT_LINE = lineOf(APP, /let lang=CORE\.resolveLang\([^\n]*\);/, '처음 언어를 정하는');
const PRESSED_LINE = lineOf(APP, /\$\$\('#langPick \[data-lang\]'\)\.forEach\(b=>b\.setAttribute\('aria-pressed'[^\n]*;/, '선택 표시(aria-pressed)');
const LISTENER_LINE = lineOf(APP, /^\$\$\('#langPick \[data-lang\]'\)\.forEach\(b=>b\.addEventListener[^\n]*$/m, '언어 단추 클릭 연결');

function boot({ ls = {}, search = '', languages, language }) {
  const mem = new Map(Object.entries(ls));
  const sandbox = {
    CORE: C, location: { search }, navigator: { languages, language },
    localStorage: { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) }
  };
  vm.runInNewContext(STORE_SRC + '\n' + BOOT_LINE + '\nthis.__lang=lang;', sandbox);
  return { lang: sandbox.__lang, stored: mem.get('lang') };
}

test('app.js 가 시작할 때: en-US/de-DE/ko-KR/fr-FR 첫 방문과 저장 모양', () => {
  assert.deepEqual(boot({ languages: ['en-US'] }), { lang: 'en', stored: '"en"' });
  assert.deepEqual(boot({ languages: ['de-DE'] }), { lang: 'de', stored: '"de"' });
  assert.deepEqual(boot({ languages: ['ko-KR'] }), { lang: 'ko', stored: '"ko"' });
  assert.deepEqual(boot({ languages: ['fr-FR'] }), { lang: 'en', stored: '"en"' });
});

test('app.js 가 시작할 때: 기존 사용자는 en-US 브라우저여도 ko, 저장된 값은 그대로, ?lang= 은 첫 방문에만', () => {
  assert.deepEqual(boot({ ls: { intimacy: '{"xp":40}' }, languages: ['en-US'] }), { lang: 'ko', stored: '"ko"' });
  assert.deepEqual(boot({ ls: { lang: '"de"', intimacy: '{"xp":40}' }, languages: ['ko-KR'], search: '?lang=en' }), { lang: 'de', stored: '"de"' });
  assert.deepEqual(boot({ languages: ['ko-KR'], search: '?s=3&m=75&lang=en' }), { lang: 'en', stored: '"en"' });
});

test('app.js 가 시작할 때: 기록 있는 사용자의 ?lang= 은 저장되지 않는다', () => {
  assert.deepEqual(boot({ ls: { intimacy: '{"xp":40}' }, languages: ['ko-KR'], search: '?s=3&m=75&lang=en' }), { lang: 'en', stored: undefined });
});

test('app.js 가 시작할 때: navigator.languages 가 비면 navigator.language 로', () => {
  assert.equal(boot({ languages: [], language: 'de-DE' }).lang, 'de');
  assert.equal(boot({ languages: undefined, language: 'ko-KR' }).lang, 'ko');
});

test('언어 단추를 누르면 그 언어로 바뀌고 저장되며, 지금 언어에만 aria-pressed=true', () => {
  const buttons = ['ko', 'en', 'de'].map((l) => ({ dataset: { lang: l }, attrs: {}, handlers: [], setAttribute(k, v) { this.attrs[k] = v; }, addEventListener(t, f) { assert.equal(t, 'click'); this.handlers.push(f); } }));
  const saved = [];
  const sandbox = { buttons, saved };
  vm.runInNewContext([
    "let lang='ko';const LANGS=['ko','en','de'];let applied=0;",
    'const $$=()=>buttons;',
    'const store={set(k,v){saved.push([k,v])}};',
    'function applyLang(){applied++;' + PRESSED_LINE + '}',
    LISTENER_LINE,
    'this.getLang=()=>lang;this.getApplied=()=>applied;'
  ].join('\n'), sandbox);
  const savedNow = () => JSON.parse(JSON.stringify(saved)); // vm 안에서 만든 배열은 다른 영역이라 그대로는 deepEqual 이 다르다고 봄
  const pressed = () => buttons.map((b) => b.attrs['aria-pressed']).join(',');
  buttons[2].handlers[0]();
  assert.equal(sandbox.getLang(), 'de');
  assert.deepEqual(savedNow(), [['lang', 'de']]);
  assert.equal(pressed(), 'false,false,true');
  buttons[1].handlers[0]();
  assert.equal(sandbox.getLang(), 'en');
  assert.deepEqual(savedNow(), [['lang', 'de'], ['lang', 'en']]);
  assert.equal(pressed(), 'false,true,false');
  const n = sandbox.getApplied();
  buttons[1].handlers[0](); // 지금 언어를 다시 누름: 아무 일 없음
  assert.equal(sandbox.getApplied(), n);
  assert.equal(saved.length, 2);
  buttons[0].dataset.lang = 'fr'; // 사전에 없는 값은 무시
  buttons[0].handlers[0]();
  assert.equal(sandbox.getLang(), 'en');
});

// ---------- 2-b. 옛 주소 이전·백업 복원: 방금 자동으로 저장된 lang 이 한국어 사용자의 기록을 영어 화면으로 만들면 안 된다 ----------
function memStorage(initial = {}) {
  const mem = new Map(Object.entries(initial));
  return { mem, api: { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k), get length() { return mem.size; }, key: (i) => [...mem.keys()][i] } };
}
const RESTORE_SRC = lineOf(APP, /function restore\(snap\)\{[\s\S]*?\n\}/, '백업 복원(restore)');
function runRestore(local, snapData) {
  const { mem, api } = memStorage(local);
  const sandbox = { CORE: C, localStorage: api, confirm: () => true, toast() {}, t: (k) => k, setTimeout() {}, location: { reload() {} } };
  vm.runInNewContext(STORE_SRC + '\n' + RESTORE_SRC + '\nthis.__r=restore({app:"kongi-room",data:' + JSON.stringify(snapData) + '});', sandbox);
  return mem;
}
const CARRY_SRC = /<script>(\s*\/\* The site moved[\s\S]*?)<\/script>/.exec(HTML);
async function runCarry(local, snapData) {
  assert.ok(CARRY_SRC, 'index.html 초반의 옛 주소 이전 스크립트를 찾지 못함');
  const { mem, api } = memStorage(local);
  let reloaded = false;
  const sandbox = {
    document: { documentElement: { style: {} } }, history: { replaceState() {} }, navigator: { language: 'en-US' }, URLSearchParams, JSON, Object, Promise, Date,
    location: { hostname: 'kongi-room.anbu-pilot.workers.dev', search: '?carry=ABCD1234', pathname: '/', hash: '', reload() { reloaded = true; }, replace() {} },
    localStorage: api, confirm: () => true, setTimeout, clearTimeout,
    fetch: async () => ({ ok: true, json: async () => ({ app: 'kongi-room', data: snapData }) })
  };
  vm.runInNewContext(CARRY_SRC[1], sandbox);
  await new Promise((r) => setTimeout(r, 30));
  return { mem, reloaded };
}
const PROGRESS = { intimacy: '{"xp":40}', log: '[]' };

test('백업 복원: 기록이 없는 새 기기에서 lang 이 없는 옛 백업을 복원하면 자동으로 저장돼 있던 lang 을 지워 한국어가 된다', () => {
  const mem = runRestore({ lang: '"en"', theme: '"room"' }, PROGRESS); // 이 기기는 en-US 브라우저라 시작할 때 en 이 저장돼 있었음
  assert.equal(mem.has('lang'), false);
  assert.deepEqual(boot({ ls: Object.fromEntries(mem), languages: ['en-US'] }), { lang: 'ko', stored: '"ko"' });
});
test('백업 복원: 백업에 lang 이 있으면 그대로 쓰고, 이 기기에 기록이 이미 있으면 이 기기의 lang 을 건드리지 않는다', () => {
  assert.equal(runRestore({ lang: '"en"' }, { ...PROGRESS, lang: '"de"' }).get('lang'), '"de"');
  assert.equal(runRestore({ lang: '"de"', intimacy: '{"xp":1}' }, PROGRESS).get('lang'), '"de"');
});
test('옛 주소 이전(?carry=): 새 주소 첫 로드에서 먼저 저장된 lang 이 이전 데이터를 영어 화면으로 만들지 않는다', async () => {
  const r = await runCarry({ lang: '"en"', dailySeen: '"x"' }, PROGRESS);
  assert.equal(r.reloaded, true);
  assert.equal(r.mem.has('lang'), false, '이전된 기록은 있고 lang 은 없음 → 다음 로드가 기존 사용자 규칙으로 ko');
  assert.equal(r.mem.get('intimacy'), '{"xp":40}');
  assert.equal(boot({ ls: Object.fromEntries(r.mem), languages: ['en-US'] }).lang, 'ko');
});
test('옛 주소 이전: 가져온 데이터에 lang 이 있으면 그 값을 쓰고, 이 주소에 이미 기록이 있으면 이 주소의 lang 을 건드리지 않는다', async () => {
  assert.equal((await runCarry({ lang: '"en"' }, { ...PROGRESS, lang: '"de"' })).mem.get('lang'), '"de"');
  assert.equal((await runCarry({ lang: '"de"', intimacy: '{"xp":1}' }, PROGRESS)).mem.get('lang'), '"de"');
});

test('옛 #langSel(선택 상자)은 어디에도 남지 않았다', () => {
  for (const f of ['index.html', 'app.js', 'app.css', 'tests/e2e/flows.mjs']) assert.ok(!/langSel/.test(read(f)), f + ' 에 langSel 이 남음');
  assert.ok(!/<select[^>]*lang/i.test(HTML));
});

// ---------- 3. index.html: 항상 보이는 세 개 ----------
const attrsOf = (s) => { const o = {}; for (const m of s.matchAll(/([a-zA-Z-]+)(?:="([^"]*)")?/g)) o[m[1]] = m[2] === undefined ? '' : m[2]; return o; };
const PICK = /<div class="langbar" id="langPick"([^>]*)>([\s\S]*?)<\/div>/.exec(HTML);

test('언어 선택 줄: 머리글 맨 앞, 🌐 + 한국어 | English | Deutsch 세 단추, 각각 lang 속성', () => {
  assert.ok(PICK, '#langPick 를 찾지 못함');
  assert.ok(/<header>\s*<div class="langbar" id="langPick"/.test(HTML), '머리글의 첫 요소여야 함 (키보드·화면 낭독이 먼저 닿고, 넓은 화면은 오른쪽 위·휴대폰은 첫 줄)');
  assert.ok(HTML.indexOf('id="langPick"') < HTML.indexOf('class="hdr-right"'), '다른 버튼 줄(.hdr-right) 안이 아니라 앞에 떨어져 있어야 함');
  assert.ok(/<span class="langbar-globe" aria-hidden="true">🌐<\/span>/.test(PICK[2]), '🌐 는 장식(aria-hidden)');
  const buttons = [...PICK[2].matchAll(/<button\b([^>]*)>([^<]*)<\/button>/g)].map((m) => ({ a: attrsOf(m[1]), text: m[2].trim() }));
  assert.deepEqual(buttons.map((b) => [b.a['data-lang'], b.a.lang, b.text]), [['ko', 'ko', '한국어'], ['en', 'en', 'English'], ['de', 'de', 'Deutsch']]);
  for (const b of buttons) {
    assert.equal(b.a.type, 'button', '폼 제출 방지');
    assert.ok(b.a['aria-pressed'] === 'true' || b.a['aria-pressed'] === 'false', 'aria-pressed 로 지금 언어를 표시');
    assert.ok(!('data-i18n' in b.a), '언어 이름은 번역하지 않고 각자의 글자로 고정');
  }
  assert.equal(buttons.filter((b) => b.a['aria-pressed'] === 'true').length, 1, '처음 HTML 에서도 하나만 눌림 표시');
});

test('언어 선택 그룹 이름은 번역하지 않는 고정값 "Language · Sprache · 언어"', () => {
  const a = attrsOf(PICK[1]);
  assert.equal(a.role, 'group');
  assert.equal(a['aria-label'], 'Language · Sprache · 언어');
  assert.ok(!('data-i18n-aria' in a), '번역 키로 바뀌면 안 됨');
});

test('옛 언어 선택 문구(lang.aria)는 사전에서도 지웠다', () => {
  assert.ok(!/lang\.aria/.test(read('i18n.js')) && !/lang\.aria/.test(APP + HTML));
});

// ---------- 4. app.css: 크기·대비 ----------
function ruleBody(selector) {
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = new RegExp('(?:^|\\})\\s*' + esc + '\\{([^}]*)\\}', 'm').exec(CSS);
  assert.ok(m, selector + ' 규칙을 app.css 에서 찾지 못함');
  return m[1];
}
const prop = (body, name) => { const m = new RegExp('(?:^|;)\\s*' + name + ':([^;]+)').exec(body); return m ? m[1].trim() : null; };
const tokenOf = (v) => { const m = /^var\((--[a-z-]+)\)$/.exec(v || ''); assert.ok(m, `"${v}" 는 기존 토큰(var(--…))이어야 함`); return m[1]; };

test('터치 영역: 언어 단추는 가로세로 44px 이상 (최소 기준 24px 의 두 배 가까이)', () => {
  const b = ruleBody('.langbar-btn');
  for (const p of ['min-height', 'min-width']) assert.ok(parseFloat(prop(b, p)) >= 44, p + ' ' + prop(b, p));
});

function hexRgb(h) {
  h = h.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  assert.ok(/^[0-9a-f]{6}$/i.test(h), h + ' 는 #rrggbb 여야 함');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
}
const lum = (rgb) => { const [r, g, b] = rgb.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const [x, y] = [lum(hexRgb(a)), lum(hexRgb(b))].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
function tokensIn(body) { const o = {}; for (const m of body.matchAll(/(--[a-z0-9-]+):([^;]+)/g)) o[m[1]] = m[2].trim(); return o; }
function blockAfter(re, what) { const m = re.exec(CSS); assert.ok(m, what + ' 블록을 app.css 에서 찾지 못함'); return tokensIn(m[1]); }
const resolveVars = (map, lookup) => { const o = {}; for (const k in map) o[k] = map[k].replace(/var\((--[a-z0-9-]+)\)/g, (_, n) => { assert.ok(lookup[n], n + ' 를 풀 수 없음'); return lookup[n]; }); return o; };

const T_ROOT = blockAfter(/:root\{([^}]*--bg:[^}]*)\}/, ':root');
const T_SYSDARK = blockAfter(/@media \(prefers-color-scheme: dark\)\{\s*:root:not\(\[data-theme="light"\]\)\{([^}]*)\}/, '시스템 다크');
const T_THEMEDARK = blockAfter(/:root\[data-theme="dark"\]\{([^}]*)\}/, 'data-theme=dark');
const T_TOD = { day: {}, morning: blockAfter(/body\[data-tod="morning"\]\{([^}]*)\}/, '아침'), sunset: blockAfter(/body\[data-tod="sunset"\]\{([^}]*)\}/, '노을'), night: blockAfter(/body\[data-tod="night"\]\{([^}]*)\}/, '밤') };
const SCHEMES = { '밝은 화면': [T_ROOT], '시스템 다크': [T_ROOT, T_SYSDARK], 'data-theme=dark': [T_ROOT, T_THEMEDARK] };

test('글자 대비 4.5 이상: 모든 화면 모드(밝음·시스템 다크·data-theme=dark) × 시간대(낮·아침·노을·밤), 눌림·안 눌림·마우스 올림', () => {
  const frame = tokenOf(prop(ruleBody('.langbar'), 'background'));
  const text = tokenOf(prop(ruleBody('.langbar-btn'), 'color'));
  const hover = tokenOf(prop(ruleBody('.langbar-btn:hover'), 'background'));
  const sel = ruleBody('.langbar-btn[aria-pressed="true"]');
  const selBg = tokenOf(prop(sel, 'background'));
  const selFg = tokenOf(prop(sel, 'color'));
  assert.notEqual(selBg, frame, '눌린 칸은 틀과 다른 바탕이어야 보임');
  let checked = 0;
  for (const [scheme, layers] of Object.entries(SCHEMES)) {
    const rootRaw = Object.assign({}, ...layers);
    const rootTok = resolveVars(rootRaw, rootRaw); // :root 값끼리의 var() 를 먼저 풀고
    for (const [tod, over] of Object.entries(T_TOD)) {
      const tok = Object.assign({}, rootTok, resolveVars(over, rootTok)); // body[data-tod] 가 덮어쓴 값은 :root 에서 물려받은 값을 보고 풀림
      const pairs = [['안 눌림', tok[text], tok[frame]], ['마우스 올림', tok[text], tok[hover]], ['눌림', tok[selFg], tok[selBg]]];
      for (const [state, fg, bg] of pairs) {
        assert.ok(fg && bg, `${scheme}/${tod}/${state}: 색을 찾지 못함`);
        const r = ratio(fg, bg);
        assert.ok(r >= 4.5, `${scheme} · ${tod} · ${state}: ${fg} / ${bg} = ${r.toFixed(2)}`);
        checked++;
      }
    }
  }
  assert.equal(checked, 3 * 4 * 3);
});

test('키보드: 포커스 윤곽이 있고, 눌림 표시 규칙이 마우스 올림 규칙보다 뒤에 있다(올려도 눌린 칸이 안 바뀜)', () => {
  assert.ok(/\.langbar-btn:focus-visible\{[^}]*outline:2px solid var\(--accent\)/.test(CSS));
  assert.ok(CSS.indexOf('.langbar-btn:hover{') < CSS.indexOf('.langbar-btn[aria-pressed="true"]{'));
});

test('윈도 고대비 모드: 배경색이 지워져도 지금 언어가 시스템 강조색으로 구분된다', () => {
  const m = /@media \(forced-colors:active\)\{\s*\.langbar-btn\[aria-pressed="true"\]\{([^}]*)\}/.exec(CSS);
  assert.ok(m, 'forced-colors 규칙');
  assert.ok(/forced-color-adjust:none/.test(m[1]) && /background:Highlight/.test(m[1]) && /color:HighlightText/.test(m[1]));
});

test('휴대폰: 언어 선택이 첫 줄을 혼자 차지하고(order:-1, 이름 줄 가득), 가로 스크롤을 만들지 않는다', () => {
  const m = /\/\* ===== mobile ===== \*\/\s*@media \(max-width:720px\)\{([\s\S]*?)\n\}/.exec(CSS);
  assert.ok(m, '휴대폰(720px 이하) 블록');
  assert.ok(/\.langbar\{order:-1;/.test(m[1]));
  assert.ok(/header>\.brand\{flex-basis:100%\}/.test(m[1]));
  assert.ok(/@media \(max-width:480px\)\{\.langbar\{width:100%\}/.test(CSS), '아주 좁은 폭은 줄 전체를 씀');
  assert.ok(!/\.langbar\{[^}]*(white-space:nowrap|overflow-x:\s*(auto|scroll))/.test(CSS), '언어 줄을 가로로 밀리게 하지 않음');
});

// ---------- 5. 서비스 워커 ----------
test('sw.js 캐시 이름은 kongi-v44 이상 (index.html·app.js·app.css·core.js 가 바뀜)', () => {
  const m = /const VERSION = 'kongi-v(\d+)'/.exec(read('sw.js'));
  assert.ok(m && +m[1] >= 44, '버전 ' + (m && m[1]));
});
