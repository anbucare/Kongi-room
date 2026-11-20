// 언어 선택 줄(🌐 한국어 · ENG · DEU) 시험.
// 방은 항상 한국어로 시작하고(저장된 lang, 또는 ?lang= 링크의 그 방문만), 브라우저 언어로 자동 전환하지 않는다
// (검색 로봇이 영어 브라우저로 페이지를 읽기 때문). 머리글 맨 위의 🌐 줄이 늘 보이므로 "Read in English?" 같은 안내 줄은 두지 않는다.
// 앱이 실제로 쓰는 app.js·index.html·app.css·core.js 에서 코드를 꺼내 그대로 실행하거나 검사한다.
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
const CORE_SRC = read('core.js');
const plain = (x) => JSON.parse(JSON.stringify(x)); // vm 안에서 만든 값은 다른 영역이라 그대로는 deepEqual 이 다르다고 봄

// ---------- 1. 안내 줄은 없다 ----------
// 시험(tests/)과 문서(docs/)를 뺀 모든 글자 파일. 숨김 폴더(.git·.claude 의 다른 작업 폴더 복사본 등)와 node_modules 는 보지 않는다.
function shippedFiles(dir = '') {
  const out = [];
  for (const e of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    if (e.name.startsWith('.') || ['node_modules', 'tests', 'docs'].includes(e.name)) continue;
    const rel = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...shippedFiles(rel));
    else if (/\.(html|js|mjs|css|json|xml|txt|webmanifest|toml|svg)$/.test(e.name)) out.push(rel);
  }
  return out;
}

test('안내 줄은 어느 파일에도 없다: #langNote · .langnote · langNotice · Read in English · Auf Deutsch lesen', () => {
  const files = shippedFiles();
  for (const f of ['index.html', 'app.js', 'app.css', 'core.js', 'i18n.js', 'sw.js']) assert.ok(files.includes(f), f + ' 도 검사 대상이어야 함');
  for (const f of files) {
    const s = read(f);
    assert.ok(!/langnot(e|ice)/i.test(s), f + ' 에 langNote·.langnote·langNotice(initLangNote·hideLangNote 포함)가 남음');
    assert.ok(!/Read in English|Auf Deutsch lesen/.test(s), f + ' 에 안내 줄 문구가 남음');
  }
});

test('core.js 는 안내 판정(langNotice)도, 브라우저 언어 읽기도, 저장도 하지 않는다', () => {
  assert.equal(C.langNotice, undefined);
  assert.ok(!/primaryLang|navigator|localStorage|setItem/.test(CORE_SRC));
  assert.ok(!/resolveLang|langFromList|hasProgress|PROGRESS_KEYS/.test(CORE_SRC), '브라우저 언어로 lang 을 정하는 옛 코드는 남지 않았다');
});

// ---------- 2. app.js: 시작 언어와 🌐 줄 동작 (실제 코드를 꺼내 실행) ----------
function lineOf(src, re, what) {
  const m = re.exec(src);
  assert.ok(m, what + ' 을(를) app.js 에서 찾지 못함 (코드를 고쳤다면 이 시험의 정규식도 맞출 것)');
  return m[0];
}
const STORE_SRC = lineOf(APP, /const store=\{[\s\S]*?\n\};/, 'store 정의');
const BOOT_LINE = lineOf(APP, /^let lang=\(\(\)=>\{const l=store\.get\('lang','ko'\)[^\n]*$/m, '시작할 때 언어를 정하는 줄');
const PRESSED_LINE = lineOf(APP, /\$\$\('#langPick \[data-lang\]'\)\.forEach\(b=>b\.setAttribute\('aria-pressed'[^\n]*;/, '선택 표시(aria-pressed)');
const CHOICE_BLOCK = lineOf(APP, /\/\/ ---- Language choice:[\s\S]*?\/\/ ---- end language choice/, '언어 고르기 코드 묶음(// ---- Language choice … end language choice)');

// 브라우저 언어(navigator)를 읽으면 reads 에 남는다. location 은 일부러 넣지 않는다: 주소를 보면 ReferenceError 로 실패한다
function boot({ ls = {}, languages = ['en-US'] }) {
  const mem = new Map(Object.entries(ls));
  const writes = [], reads = [];
  const navigator = { get languages() { reads.push('languages'); return languages; }, get language() { reads.push('language'); return languages[0]; } };
  const sandbox = { navigator, localStorage: { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => { writes.push(k); mem.set(k, String(v)); }, removeItem: (k) => mem.delete(k) } };
  vm.runInNewContext("const LANGS=['ko','en','de'];\n" + STORE_SRC + '\n' + BOOT_LINE + '\nthis.__lang=lang;', sandbox);
  return { lang: sandbox.__lang, writes, reads, stored: mem.get('lang') };
}

test('첫 방문: 브라우저가 en-US·de-DE·fr-FR·ko-KR 어느 것이든 한국어로 시작하고, 저장값을 바꾸지 않고, 브라우저 언어를 읽지도 않는다', () => {
  for (const languages of [['en-US'], ['de-DE'], ['de-DE', 'en-US'], ['fr-FR'], ['ko-KR'], ['en-US', 'de-DE', 'ko-KR']]) {
    const b = boot({ languages });
    assert.deepEqual({ lang: b.lang, writes: b.writes, reads: b.reads, stored: b.stored }, { lang: 'ko', writes: [], reads: [], stored: undefined }, languages.join());
  }
});

test('시작할 때: 저장된 lang 은 브라우저 언어와 상관없이 그대로, 사전에 없는 값은 한국어', () => {
  for (const languages of [['en-US'], ['de-DE'], ['ko-KR']]) {
    assert.equal(boot({ ls: { lang: '"de"' }, languages }).lang, 'de');
    assert.equal(boot({ ls: { lang: '"en"' }, languages }).lang, 'en');
    assert.equal(boot({ ls: { lang: '"ko"' }, languages }).lang, 'ko');
    assert.equal(boot({ ls: { lang: '"fr"' }, languages }).lang, 'ko');
    assert.equal(boot({ ls: { lang: 'not json' }, languages }).lang, 'ko');
  }
  const kept = boot({ ls: { lang: '"en"' }, languages: ['de-DE'] });
  assert.deepEqual(plain(kept.writes), [], '저장된 값을 다시 쓰지도 않음');
});

test('app.js·core.js·i18n.js·sw.js 어디에서도 브라우저 언어(navigator.language·languages)를 읽지 않는다', () => {
  for (const f of ['app.js', 'core.js', 'i18n.js', 'sw.js']) assert.ok(!/navigator\.languages?\b/.test(read(f)), f + ' 이 브라우저 언어를 읽음');
});

test('?lang= 링크는 저장하지 않고 그 방문만 적용한다 (결과 보기·함께 집중 링크, 저장된 lang 이 없을 때만)', () => {
  const lines = APP.match(/if\(LANGS\.includes\(q\.get\('lang'\)\)&&store\.get\('lang',null\)==null\)\{lang=q\.get\('lang'\);applyLang\(\)\}/g) || [];
  assert.equal(lines.length, 2, 'openResultView 와 openTogetherLink 두 곳');
  assert.ok(!/store\.set\('lang',q\.get/.test(APP));
});

// 🌐 줄 단추 동작: 실제 store·시작 줄·chooseLang 코드를 실행하고 화면 요소·applyLang 만 가짜로 둔다. mem(localStorage)을 밖에서 넘겨 "새로고침"을 흉내 낸다
function room({ mem = new Map() } = {}) {
  const calls = { applied: 0, writes: [] };
  const mk = (l) => ({ dataset: { lang: l }, handlers: [], addEventListener(t, f) { assert.equal(t, 'click'); this.handlers.push(f); } });
  const btn = { ko: mk('ko'), en: mk('en'), de: mk('de') };
  const noRead = () => { throw new Error('브라우저 언어를 읽음'); };
  const sandbox = {
    $$: (sel) => { assert.equal(sel, '#langPick [data-lang]'); return [btn.ko, btn.en, btn.de]; },
    applyLang: () => { calls.applied++; },
    navigator: { get languages() { return noRead(); }, get language() { return noRead(); } },
    localStorage: { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => { calls.writes.push([k, v]); mem.set(k, String(v)); }, removeItem: (k) => mem.delete(k) }
  };
  vm.runInNewContext("const LANGS=['ko','en','de'];\n" + STORE_SRC + '\n' + BOOT_LINE + '\n' + CHOICE_BLOCK + '\nthis.getLang=()=>lang;', sandbox);
  return { calls, btn, mem, getLang: sandbox.getLang };
}

test('열기만 해서는 아무것도 저장하지 않고 화면을 다시 그리지도 않는다 (한국어 그대로)', () => {
  const r = room();
  assert.deepEqual(plain(r.calls.writes), []);
  assert.equal(r.calls.applied, 0);
  assert.equal(r.getLang(), 'ko');
});

test('🌐 줄 ENG·DEU·한국어를 누르면 lang 을 저장하고, 언어가 바뀌었을 때만 화면을 다시 그린다', () => {
  const r = room();
  r.btn.en.handlers[0]();
  assert.deepEqual(plain(r.calls.writes), [['lang', '"en"']]);
  assert.equal(r.getLang(), 'en');
  assert.equal(r.calls.applied, 1);
  r.btn.de.handlers[0]();
  assert.deepEqual(plain(r.calls.writes.at(-1)), ['lang', '"de"']);
  assert.equal(r.getLang(), 'de');
  assert.equal(r.calls.applied, 2);
  r.btn.de.handlers[0](); // 같은 언어를 또 누르면 저장 값은 그대로, 다시 그리지 않음
  assert.equal(r.mem.get('lang'), '"de"');
  assert.equal(r.calls.applied, 2);
  r.btn.ko.handlers[0]();
  assert.deepEqual(plain(r.calls.writes.at(-1)), ['lang', '"ko"']);
  assert.equal(r.getLang(), 'ko');
  assert.equal(r.calls.applied, 3);
});

test('한국어 화면에서 한국어를 눌러도 선택으로 저장된다 (다시 그리지는 않음)', () => {
  const r = room();
  r.btn.ko.handlers[0]();
  assert.deepEqual(plain(r.calls.writes), [['lang', '"ko"']]);
  assert.equal(r.calls.applied, 0);
  assert.equal(r.getLang(), 'ko');
});

test('누른 언어는 새로고침(다시 열기) 뒤에도 유지된다: 같은 저장소로 다시 시작하면 그 언어, 다른 언어를 누르면 그것으로 바뀜', () => {
  const mem = new Map();
  room({ mem }).btn.en.handlers[0]();
  const again = room({ mem });
  assert.equal(again.getLang(), 'en');
  assert.deepEqual(plain(again.calls.writes), [], '다시 열기만으로는 저장하지 않음');
  again.btn.de.handlers[0]();
  assert.equal(room({ mem }).getLang(), 'de');
  room({ mem }).btn.ko.handlers[0]();
  assert.equal(room({ mem }).getLang(), 'ko');
  assert.equal(mem.get('lang'), '"ko"');
});

test('사전에 없는 data-lang 값은 무시한다 (저장·화면 변화 없음)', () => {
  const r = room();
  r.btn.en.dataset.lang = 'fr';
  r.btn.en.handlers[0]();
  assert.deepEqual(plain(r.calls.writes), []);
  assert.equal(r.getLang(), 'ko');
  assert.equal(r.calls.applied, 0);
});

test('applyLang 은 🌐 줄에서 지금 언어에만 aria-pressed=true 를 둔다', () => {
  const buttons = ['ko', 'en', 'de'].map((l) => ({ dataset: { lang: l }, attrs: {}, setAttribute(k, v) { this.attrs[k] = v; } }));
  const sandbox = { buttons };
  vm.runInNewContext("let lang='en';const $$=()=>buttons;\nfunction applyLang(){" + PRESSED_LINE + '}\napplyLang();', sandbox);
  assert.equal(buttons.map((b) => b.attrs['aria-pressed']).join(','), 'false,true,false');
});

test('옛 #langSel(선택 상자)은 어디에도 남지 않았다', () => {
  for (const f of ['index.html', 'app.js', 'app.css', 'tests/e2e/flows.mjs']) assert.ok(!/langSel/.test(read(f)), f + ' 에 langSel 이 남음');
  assert.ok(!/<select[^>]*lang/i.test(HTML));
});

test('새 저장 키는 없다: app.js 의 lang 저장은 chooseLang 한 곳뿐이고 저장은 lang 만', () => {
  assert.equal((APP.match(/store\.set\('lang'/g) || []).length, 1);
  assert.ok(/function chooseLang\(v\)\{if\(!LANGS\.includes\(v\)\)return;store\.set\('lang',v\)/.test(APP));
  assert.ok(!/(store\.set|localStorage\.setItem)\('(noticeSeen|langOffer|langDismissed)/.test(APP + HTML));
});

// ---------- 3. index.html: 머리글 맨 위의 🌐 한국어 · ENG · DEU ----------
const attrsOf = (s) => { const o = {}; for (const m of s.matchAll(/([a-zA-Z-]+)(?:="([^"]*)")?/g)) o[m[1]] = m[2] === undefined ? '' : m[2]; return o; };
const PICK = /<div class="langbar" id="langPick"([^>]*)>([\s\S]*?)<\/div>/.exec(HTML);
const BUTTONS = PICK ? [...PICK[2].matchAll(/<button\b([^>]*)>([^<]*)<\/button>/g)].map((m) => ({ a: attrsOf(m[1]), text: m[2].trim() })) : [];

test('언어 선택 줄: 머리글의 첫 요소, 🌐(장식) + 세 단추, 다른 버튼 줄(.hdr-right) 앞', () => {
  assert.ok(PICK, '#langPick 를 찾지 못함');
  assert.ok(/<header>\s*<div class="langbar" id="langPick"/.test(HTML), '머리글의 첫 요소(키보드·화면 낭독이 가장 먼저 닿음)');
  assert.ok(HTML.indexOf('id="langPick"') < HTML.indexOf('class="hdr-right"'));
  assert.ok(/<span class="langbar-globe" aria-hidden="true">🌐<\/span>/.test(PICK[2]), '🌐 는 장식(aria-hidden)');
  assert.equal(BUTTONS.length, 3);
});

test('버튼 글자는 한국어 · ENG · DEU, 각각 lang·data-lang 속성이 있다', () => {
  assert.deepEqual(BUTTONS.map((b) => [b.a['data-lang'], b.a.lang, b.text]), [['ko', 'ko', '한국어'], ['en', 'en', 'ENG'], ['de', 'de', 'DEU']]);
  for (const b of BUTTONS) {
    assert.equal(b.a.type, 'button', '폼 제출 방지');
    assert.ok(!('data-i18n' in b.a), '언어 이름은 번역하지 않고 각자의 글자로 고정');
  }
});

test('ENG·DEU 는 줄임말이라 화면 낭독기용 이름(aria-label)이 English·Deutsch, 한국어는 보이는 글자가 곧 이름', () => {
  assert.deepEqual(BUTTONS.map((b) => ('aria-label' in b.a ? b.a['aria-label'] : null)), [null, 'English', 'Deutsch']);
});

test('WCAG 2.5.3: 보이는 글자가 접근성 이름 안에 그대로 들어 있다 (대소문자 무시)', () => {
  for (const b of BUTTONS) {
    const name = 'aria-label' in b.a ? b.a['aria-label'] : b.text;
    assert.ok(name.toLowerCase().includes(b.text.toLowerCase()), `"${b.text}" 가 이름 "${name}" 안에 없음`);
  }
});

test('지금 언어는 aria-pressed 로 표시한다: 처음 HTML 에서는 한국어 하나만 눌림', () => {
  for (const b of BUTTONS) assert.ok(b.a['aria-pressed'] === 'true' || b.a['aria-pressed'] === 'false', b.text);
  assert.deepEqual(BUTTONS.map((b) => b.a['aria-pressed']), ['true', 'false', 'false']);
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
  for (const p of ['min-height', 'min-width']) assert.ok(parseFloat(prop(b, p)) >= 44, '.langbar-btn ' + p + ' ' + prop(b, p));
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

// 규칙에서 (글자 토큰, 바탕 토큰) 짝을 읽어 모든 화면 모드 × 시간대에서 대비를 계산한다
function pairsFromCss() {
  const frame = tokenOf(prop(ruleBody('.langbar'), 'background'));
  const text = tokenOf(prop(ruleBody('.langbar-btn'), 'color'));
  const sel = ruleBody('.langbar-btn[aria-pressed="true"]');
  const pairs = [
    ['🌐 줄 안 눌림', text, frame], ['🌐 줄 마우스 올림', text, tokenOf(prop(ruleBody('.langbar-btn:hover'), 'background'))],
    ['🌐 줄 눌림', tokenOf(prop(sel, 'color')), tokenOf(prop(sel, 'background'))]
  ];
  assert.notEqual(pairs[2][2], frame, '눌린 칸은 틀과 다른 바탕이어야 보임');
  return pairs;
}

test('글자 대비 4.5 이상: 모든 화면 모드(밝음·시스템 다크·data-theme=dark) × 시간대(낮·아침·노을·밤), 🌐 줄의 모든 상태', () => {
  const pairs = pairsFromCss();
  let checked = 0;
  for (const [scheme, layers] of Object.entries(SCHEMES)) {
    const rootRaw = Object.assign({}, ...layers);
    const rootTok = resolveVars(rootRaw, rootRaw); // :root 값끼리의 var() 를 먼저 풀고
    for (const [tod, over] of Object.entries(T_TOD)) {
      const tok = Object.assign({}, rootTok, resolveVars(over, rootTok)); // body[data-tod] 가 덮어쓴 값은 :root 에서 물려받은 값을 보고 풀림
      for (const [state, fgTok, bgTok] of pairs) {
        const fg = tok[fgTok], bg = tok[bgTok];
        assert.ok(fg && bg, `${scheme}/${tod}/${state}: 색을 찾지 못함`);
        const r = ratio(fg, bg);
        assert.ok(r >= 4.5, `${scheme} · ${tod} · ${state}: ${fg} / ${bg} = ${r.toFixed(2)}`);
        checked++;
      }
    }
  }
  assert.equal(checked, 3 * 4 * pairs.length);
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

test('휴대폰: 언어 선택이 첫 줄을 차지하고(order:-1, 이름 줄 가득), 좁은 폭은 줄 전체를 쓰며, 가로 스크롤을 만들지 않는다', () => {
  const m = /\/\* ===== mobile ===== \*\/\s*@media \(max-width:720px\)\{([\s\S]*?)\n\}/.exec(CSS);
  assert.ok(m, '휴대폰(720px 이하) 블록');
  assert.ok(/\.langbar\{order:-1;/.test(m[1]));
  assert.ok(/header>\.brand\{flex-basis:100%\}/.test(m[1]));
  assert.ok(/@media \(max-width:480px\)\{\.langbar\{width:100%\}/.test(CSS), '아주 좁은 폭은 줄 전체를 씀');
  assert.ok(!/\.langbar\{[^}]*(white-space:nowrap|overflow-x:\s*(auto|scroll))/.test(CSS), '언어 줄을 가로로 밀리게 하지 않음');
});

// ---------- 5. 서비스 워커 ----------
test('sw.js 캐시 이름은 kongi-v47 이상 (index.html·app.js·app.css·core.js 가 바뀜)', () => {
  const m = /const VERSION = 'kongi-v(\d+)'/.exec(read('sw.js'));
  assert.ok(m && +m[1] >= 47, '버전 ' + (m && m[1]));
});
