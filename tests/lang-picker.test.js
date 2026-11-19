// 언어 안내 줄·언어 선택 줄 시험.
// 한국어를 모르는 방문자가 첫 화면에서 자기 언어를 바로 찾게 한 변경을 고정한다.
// 방은 항상 한국어로 시작하고(저장된 lang, 또는 ?lang= 링크의 그 방문만), 브라우저 언어로 자동 전환하지 않는다
// (검색 로봇이 영어 브라우저로 페이지를 읽기 때문). 한국어가 아닌 브라우저에는 안내 줄만 띄운다.
// 판정은 core.js(앱이 실제로 쓰는 파일)를 그대로 불러 시험하고, app.js 의 연결 코드와 index.html·app.css 는 실제 파일에서 꺼내 검사한다.
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

// ---------- 1. 안내 줄을 띄울지 (core.js langNotice) ----------
const notice = (languages, saved = null, current = 'ko') => C.langNotice(languages, saved, current);

test('한국어가 아닌 브라우저(en-US·de-DE·fr-FR)의 첫 방문에는 안내 줄을 띄운다', () => {
  assert.deepEqual(notice(['en-US']), ['en', 'de']);
  assert.deepEqual(notice(['de-DE']), ['de', 'en'], '독일어 브라우저는 독일어를 앞에');
  assert.deepEqual(notice(['fr-FR']), ['en', 'de']);
  assert.deepEqual(notice(['ja', 'zh-Hans-CN']), ['en', 'de']);
});

test('한국어 브라우저(ko-KR)에는 안내 줄이 없다: 목록의 첫 항목의 주 언어 태그가 ko 일 때', () => {
  assert.equal(notice(['ko-KR']), null);
  assert.equal(notice(['ko']), null);
  assert.equal(notice(['ko_KR']), null, '밑줄로 쓴 옛 안드로이드 태그도');
  assert.equal(notice(['KO-kr', 'en-US']), null, '대소문자 무시, 첫 항목이 한국어면 영어가 뒤에 있어도 안내 없음');
  assert.deepEqual(notice(['en-US', 'ko-KR']), ['en', 'de'], '첫 항목이 영어면 한국어가 뒤에 있어도 안내');
});

test('주 언어 태그 전체로 비교한다: kok-IN(콘칸어)은 한국어가 아님', () => {
  assert.deepEqual(notice(['kok-IN']), ['en', 'de']);
  assert.deepEqual(notice(['dsb-DE']), ['en', 'de'], '저지 소르브어(dsb)는 독일어가 아니라 순서에 영향 없음');
});

test('독일어를 영어보다 먼저 적은 브라우저만 독일어가 앞: 목록 안에서 처음 나온 순서', () => {
  assert.deepEqual(notice(['fr-FR', 'de-DE', 'en-US']), ['de', 'en']);
  assert.deepEqual(notice(['de-AT', 'en']), ['de', 'en']);
  assert.deepEqual(notice(['en-GB', 'de-DE']), ['en', 'de']);
  assert.deepEqual(notice(['fr-FR', 'en-US', 'de-DE']), ['en', 'de']);
  assert.deepEqual(notice(['de_CH']), ['de', 'en']);
});

test('저장된 lang 이 있으면 안내 줄이 없다 (ko/en/de 어느 것이든, 브라우저 언어와 상관없이)', () => {
  for (const saved of ['ko', 'en', 'de']) for (const langs of [['en-US'], ['de-DE'], ['fr-FR'], ['ko-KR']]) assert.equal(notice(langs, saved), null, saved + ' / ' + langs);
});

test('저장된 값이 ko/en/de 가 아니면 저장된 것으로 치지 않는다 (예전 동작: 한국어로 보임)', () => {
  assert.deepEqual(notice(['en-US'], 'fr'), ['en', 'de']);
  assert.deepEqual(notice(['en-US'], 3), ['en', 'de']);
  assert.deepEqual(notice(['en-US'], undefined), ['en', 'de']);
});

test('지금 화면이 한국어가 아니면(?lang= 링크로 보는 중) 안내 줄이 없다', () => {
  assert.equal(notice(['en-US'], null, 'en'), null);
  assert.equal(notice(['de-DE'], null, 'de'), null);
});

test('브라우저 언어를 알 수 없으면(빈 목록·빈 문자열·undefined) 안내 줄이 없다', () => {
  assert.equal(notice([]), null);
  assert.equal(notice(['']), null);
  assert.equal(notice(undefined), null);
  assert.equal(notice(null), null);
  assert.equal(notice([undefined]), null);
});

test('얼린 배열(navigator.languages 처럼)도 받는다', () => {
  assert.deepEqual(notice(Object.freeze(['de-DE', 'en-US'])), ['de', 'en']);
});

test('core.js 의 판정 함수는 저장하지 않고, 브라우저 언어로 lang 을 정하는 옛 코드는 남지 않았다', () => {
  const core = read('core.js');
  assert.ok(!/resolveLang|langFromList|hasProgress|PROGRESS_KEYS/.test(core));
  assert.ok(!/localStorage|\.set\(|setItem/.test(core.slice(core.indexOf('Offering another language'))), '판정 함수는 저장하지 않음');
});

// ---------- 2. app.js 연결 (실제 코드를 꺼내 실행) ----------
function lineOf(src, re, what) {
  const m = re.exec(src);
  assert.ok(m, what + ' 을(를) app.js 에서 찾지 못함 (코드를 고쳤다면 이 시험의 정규식도 맞출 것)');
  return m[0];
}
const STORE_SRC = lineOf(APP, /const store=\{[\s\S]*?\n\};/, 'store 정의');
const BOOT_LINE = lineOf(APP, /^let lang=\(\(\)=>\{const l=store\.get\('lang','ko'\)[^\n]*$/m, '시작할 때 언어를 정하는 줄');
const PRESSED_LINE = lineOf(APP, /\$\$\('#langPick \[data-lang\]'\)\.forEach\(b=>b\.setAttribute\('aria-pressed'[^\n]*;/, '선택 표시(aria-pressed)');
const OFFER_BLOCK = lineOf(APP, /\/\/ ---- Language offer:[\s\S]*?\/\/ ---- end language offer/, '언어 안내 코드 묶음(// ---- Language offer … end language offer)');

function boot({ ls = {} }) {
  const mem = new Map(Object.entries(ls));
  const writes = [];
  // navigator·location 을 일부러 넣지 않는다: 이 줄이 브라우저 언어나 주소를 보면 ReferenceError 로 실패한다
  const sandbox = { localStorage: { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => { writes.push(k); mem.set(k, String(v)); }, removeItem: (k) => mem.delete(k) } };
  vm.runInNewContext("const LANGS=['ko','en','de'];\n" + STORE_SRC + '\n' + BOOT_LINE + '\nthis.__lang=lang;', sandbox);
  return { lang: sandbox.__lang, writes: writes.slice(), stored: mem.get('lang') };
}

test('시작할 때: 저장된 lang 이 없으면 한국어이고 아무것도 저장하지 않는다 (브라우저 언어를 보지도 않음)', () => {
  assert.deepEqual(boot({}), { lang: 'ko', writes: [], stored: undefined });
});

test('시작할 때: 저장된 lang 은 그대로, 사전에 없는 값은 한국어', () => {
  assert.equal(boot({ ls: { lang: '"de"' } }).lang, 'de');
  assert.equal(boot({ ls: { lang: '"en"' } }).lang, 'en');
  assert.equal(boot({ ls: { lang: '"fr"' } }).lang, 'ko');
  assert.equal(boot({ ls: { lang: 'not json' } }).lang, 'ko');
});

test('app.js 에서 navigator.language(s) 를 쓰는 곳은 안내 줄 묶음뿐이다', () => {
  const outside = APP.replace(OFFER_BLOCK, '');
  assert.ok(!/navigator\.languages?\b/.test(outside), '안내 줄 밖에서 브라우저 언어를 읽음');
  assert.ok(/navigator\.languages/.test(OFFER_BLOCK));
});

test('?lang= 링크는 저장하지 않고 그 방문만 적용한다 (결과 보기·함께 집중 링크, 저장된 lang 이 없을 때만)', () => {
  const lines = APP.match(/if\(LANGS\.includes\(q\.get\('lang'\)\)&&store\.get\('lang',null\)==null\)\{lang=q\.get\('lang'\);applyLang\(\)\}/g) || [];
  assert.equal(lines.length, 2, 'openResultView 와 openTogetherLink 두 곳');
  assert.ok(!/store\.set\('lang',q\.get/.test(APP));
});

// 안내 줄·🌐 선택 줄 동작을 가짜 화면 요소로 실행
function offerHarness({ saved = null, languages = ['en-US'], initialLang = 'ko', focusInNote = false }) {
  const calls = { saved: [], applied: 0, focused: [], inserted: [] };
  const mk = (data) => ({ dataset: data, handlers: [], addEventListener(t, f) { assert.equal(t, 'click'); this.handlers.push(f); }, focus() { calls.focused.push(data.lang); } });
  const pick = { ko: mk({ lang: 'ko' }), en: mk({ lang: 'en' }), de: mk({ lang: 'de' }) };
  const noteEn = mk({ lang: 'en' }), noteDe = mk({ lang: 'de' }), noteX = mk({});
  const items = { en: { l: 'en' }, de: { l: 'de' } };
  const activeEl = {};
  const note = { hidden: true, contains: (el) => focusInNote && el === activeEl, querySelector: (sel) => items[/\[lang="(..)"\]/.exec(sel)[1]], insertBefore: (it, ref) => { assert.equal(ref, noteX); calls.inserted.push(it.l); } };
  const $ = (sel) => { const p = /#langPick \[data-lang="(..)"\]/.exec(sel); return sel === '#langNote' ? note : sel === '#langNote .langnote-x' ? noteX : p ? pick[p[1]] : null; };
  const $$ = (sel) => { assert.equal(sel, '#langPick [data-lang],#langNote [data-lang]'); return [pick.ko, pick.en, pick.de, noteEn, noteDe]; };
  const stored = { lang: saved };
  const sandbox = {
    $, $$, LANGS: ['ko', 'en', 'de'], CORE: C, document: { activeElement: activeEl },
    navigator: { languages, language: languages && languages[0] },
    store: { get: (k, d) => (stored[k] == null ? d : stored[k]), set: (k, v) => { stored[k] = v; calls.saved.push([k, v]); } },
    applyLang: () => { calls.applied++; }
  };
  vm.runInNewContext('let lang=' + JSON.stringify(initialLang) + ';\n' + OFFER_BLOCK + '\ninitLangNote();\nthis.getLang=()=>lang;', sandbox);
  return { calls, note, pick, noteEn, noteDe, noteX, stored, getLang: sandbox.getLang, order: calls.inserted.slice() };
}
const plain = (x) => JSON.parse(JSON.stringify(x)); // vm 안에서 만든 값은 다른 영역이라 그대로는 deepEqual 이 다르다고 봄

test('안내 줄 표시: en-US·de-DE·fr-FR 은 보이고(독일어 브라우저는 독일어가 앞), ko-KR 이나 저장된 lang 이 있으면 숨김 그대로', () => {
  const en = offerHarness({ languages: ['en-US'] }), de = offerHarness({ languages: ['de-DE'] });
  assert.deepEqual([en.note.hidden, plain(en.order)], [false, ['en', 'de']]);
  assert.deepEqual([de.note.hidden, plain(de.order)], [false, ['de', 'en']]);
  assert.equal(offerHarness({ languages: ['fr-FR'] }).note.hidden, false);
  assert.equal(offerHarness({ languages: ['ko-KR'] }).note.hidden, true);
  assert.equal(offerHarness({ languages: ['en-US'], saved: 'ko' }).note.hidden, true);
  assert.equal(offerHarness({ languages: ['de-DE'], saved: 'en' }).note.hidden, true);
  assert.equal(offerHarness({ languages: ['en-US'], initialLang: 'de' }).note.hidden, true, '?lang=de 로 보는 중이면 안내 없음');
});

test('안내 줄 표시만으로는 아무것도 저장하지 않고 화면 언어도 바꾸지 않는다 (브라우저 언어가 저장값을 바꾸지 않음)', () => {
  for (const languages of [['en-US'], ['de-DE'], ['fr-FR'], ['ko-KR']]) {
    const h = offerHarness({ languages });
    assert.deepEqual(plain(h.calls.saved), [], languages + ' 저장 없음');
    assert.equal(h.calls.applied, 0);
    assert.equal(h.getLang(), 'ko');
  }
  const saved = offerHarness({ languages: ['de-DE'], saved: 'en', initialLang: 'en' });
  assert.equal(saved.stored.lang, 'en', '저장값은 그대로');
  assert.equal(saved.getLang(), 'en');
});

test('안내 줄의 English 를 누르면 🌐 선택과 똑같이 저장하고 화면을 바꾸고 줄을 숨기고, 포커스는 🌐 선택의 그 단추로', () => {
  const h = offerHarness({ languages: ['en-US'], focusInNote: true });
  h.noteEn.handlers[0]();
  assert.deepEqual(plain(h.calls.saved), [['lang', 'en']]);
  assert.equal(h.getLang(), 'en');
  assert.equal(h.calls.applied, 1);
  assert.equal(h.note.hidden, true);
  assert.deepEqual(plain(h.calls.focused), ['en']);
});

test('안내 줄의 Deutsch 도 같다', () => {
  const h = offerHarness({ languages: ['de-DE'], focusInNote: true });
  h.noteDe.handlers[0]();
  assert.deepEqual(plain(h.calls.saved), [['lang', 'de']]);
  assert.equal(h.getLang(), 'de');
  assert.equal(h.calls.applied, 1);
  assert.equal(h.note.hidden, true);
});

test('✕ 를 누르면 lang=ko 를 저장하고 줄이 사라지며 화면은 그대로(다시 그리지 않음), 다음에 열면 다시 안 나온다', () => {
  const h = offerHarness({ languages: ['en-US'], focusInNote: true });
  h.noteX.handlers[0]();
  assert.deepEqual(plain(h.calls.saved), [['lang', 'ko']]);
  assert.equal(h.stored.lang, 'ko');
  assert.equal(h.getLang(), 'ko');
  assert.equal(h.calls.applied, 0);
  assert.equal(h.note.hidden, true);
  assert.deepEqual(plain(h.calls.focused), ['ko'], '키보드 포커스가 사라진 줄 대신 🌐 선택의 한국어 단추로');
  assert.equal(offerHarness({ languages: ['en-US'], saved: h.stored.lang }).note.hidden, true, '다시 열면(저장값 ko) 안내 없음');
});

test('포커스가 안내 줄 밖(마우스 클릭 등)에 있었으면 포커스를 옮기지 않는다', () => {
  const h = offerHarness({ languages: ['en-US'], focusInNote: false });
  h.noteX.handlers[0]();
  assert.deepEqual(plain(h.calls.focused), []);
});

test('🌐 선택의 한국어를 눌러도 선택으로 저장되고 안내 줄이 사라진다 (다시 그리지는 않음)', () => {
  const h = offerHarness({ languages: ['fr-FR'] });
  h.pick.ko.handlers[0]();
  assert.deepEqual(plain(h.calls.saved), [['lang', 'ko']]);
  assert.equal(h.calls.applied, 0);
  assert.equal(h.note.hidden, true);
});

test('🌐 선택으로 다른 언어를 고르면 저장되고 안내 줄이 사라진다. 안내 줄이 없을 때도 같다', () => {
  const h = offerHarness({ languages: ['en-US'] });
  h.pick.de.handlers[0]();
  assert.deepEqual(plain(h.calls.saved), [['lang', 'de']]);
  assert.equal(h.getLang(), 'de');
  assert.equal(h.note.hidden, true);
  const none = offerHarness({ languages: ['ko-KR'] });
  none.pick.en.handlers[0]();
  assert.equal(none.getLang(), 'en');
  assert.deepEqual(plain(none.calls.saved), [['lang', 'en']]);
});

test('사전에 없는 data-lang 값은 무시한다 (저장·화면 변화 없음, 안내 줄도 그대로)', () => {
  const h = offerHarness({ languages: ['en-US'] });
  h.noteEn.dataset.lang = 'fr';
  h.noteEn.handlers[0]();
  assert.deepEqual(plain(h.calls.saved), []);
  assert.equal(h.getLang(), 'ko');
  assert.equal(h.note.hidden, false);
});

test('applyLang 은 🌐 선택에서 지금 언어에만 aria-pressed=true 를 둔다', () => {
  const buttons = ['ko', 'en', 'de'].map((l) => ({ dataset: { lang: l }, attrs: {}, setAttribute(k, v) { this.attrs[k] = v; } }));
  const sandbox = { buttons };
  vm.runInNewContext("let lang='en';const $$=()=>buttons;\nfunction applyLang(){" + PRESSED_LINE + '}\napplyLang();', sandbox);
  assert.equal(buttons.map((b) => b.attrs['aria-pressed']).join(','), 'false,true,false');
});

test('옛 #langSel(선택 상자)은 어디에도 남지 않았다', () => {
  for (const f of ['index.html', 'app.js', 'app.css', 'tests/e2e/flows.mjs']) assert.ok(!/langSel/.test(read(f)), f + ' 에 langSel 이 남음');
  assert.ok(!/<select[^>]*lang/i.test(HTML));
});

// ---------- 3. index.html: 안내 줄과 항상 보이는 세 개 ----------
const attrsOf = (s) => { const o = {}; for (const m of s.matchAll(/([a-zA-Z-]+)(?:="([^"]*)")?/g)) o[m[1]] = m[2] === undefined ? '' : m[2]; return o; };
const NOTE = /<div class="langnote" id="langNote"([^>]*)>([\s\S]*?)<\/div>/.exec(HTML);
const PICK = /<div class="langbar" id="langPick"([^>]*)>([\s\S]*?)<\/div>/.exec(HTML);

test('안내 줄: 머리글 맨 앞, 처음엔 숨김, 고정 문구 두 개와 닫기, 각 부분에 lang 속성', () => {
  assert.ok(NOTE, '#langNote 를 찾지 못함');
  assert.ok(/<header>\s*<div class="langnote" id="langNote"/.test(HTML), '머리글의 첫 요소(문서 흐름 안의 맨 위 한 줄)');
  assert.ok('hidden' in attrsOf(NOTE[1]), '자바스크립트가 필요할 때만 보이게: 처음엔 hidden');
  assert.ok(/<span class="langnote-globe" aria-hidden="true">🌐<\/span>/.test(NOTE[2]));
  const items = [...NOTE[2].matchAll(/<span class="langnote-item" lang="(..)"><span>([^<]*)<\/span> <button\b([^>]*)>([^<]*)<\/button><\/span>/g)].map((m) => ({ lang: m[1], text: m[2], b: attrsOf(m[3]), label: m[4] }));
  assert.deepEqual(items.map((i) => [i.lang, i.text, i.b['data-lang'], i.b.lang, i.label]), [['en', 'Read in English?', 'en', 'en', 'English'], ['de', 'Auf Deutsch lesen?', 'de', 'de', 'Deutsch']]);
  for (const i of items) assert.equal(i.b.type, 'button');
  const x = /<button class="langnote-x" type="button" aria-label="([^"]*)"><span aria-hidden="true">✕<\/span><\/button>/.exec(NOTE[2]);
  assert.ok(x, '닫기(✕) 단추');
  assert.equal(x[1], 'Keep Korean · Koreanisch behalten · 한국어로 계속');
  assert.ok(!/data-i18n/.test(NOTE[0]), '안내 줄의 글은 번역하지 않는 고정값');
});

test('언어 선택 줄: 🌐 + 한국어 | English | Deutsch 세 단추, 각각 lang 속성, 안내 줄 바로 뒤', () => {
  assert.ok(PICK, '#langPick 를 찾지 못함');
  assert.ok(HTML.indexOf('id="langNote"') < HTML.indexOf('id="langPick"') && HTML.indexOf('id="langPick"') < HTML.indexOf('class="hdr-right"'), '다른 버튼 줄(.hdr-right) 안이 아니라 앞에 떨어져 있어야 함');
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

test('새 저장 키는 없다: app.js 의 lang 저장은 chooseLang 한 곳뿐이고 저장은 lang 만', () => {
  assert.equal((APP.match(/store\.set\('lang'/g) || []).length, 1);
  assert.ok(/function chooseLang\(v\)\{if\(!LANGS\.includes\(v\)\)return;store\.set\('lang',v\)/.test(APP));
  assert.ok(!/(store\.set|localStorage\.setItem)\('(langNote|noticeSeen|langOffer|langDismissed)/.test(APP + HTML));
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

test('터치 영역: 언어 단추·안내 줄 단추·✕ 는 가로세로 44px 이상 (최소 기준 24px 의 두 배 가까이)', () => {
  for (const sel of ['.langbar-btn', '.langnote-btn', '.langnote-x']) {
    const b = ruleBody(sel);
    for (const p of ['min-height', 'min-width']) assert.ok(parseFloat(prop(b, p)) >= 44, sel + ' ' + p + ' ' + prop(b, p));
  }
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
  const noteBg = tokenOf(prop(ruleBody('.langnote'), 'background'));
  const noteFg = tokenOf(prop(ruleBody('.langnote'), 'color'));
  const nb = ruleBody('.langnote-btn');
  const nx = ruleBody('.langnote-x');
  const pairs = [
    ['🌐 선택 안 눌림', text, frame], ['🌐 선택 마우스 올림', text, tokenOf(prop(ruleBody('.langbar-btn:hover'), 'background'))],
    ['🌐 선택 눌림', tokenOf(prop(sel, 'color')), tokenOf(prop(sel, 'background'))],
    ['안내 줄 글자', noteFg, noteBg], ['안내 줄 단추', tokenOf(prop(nb, 'color')), tokenOf(prop(nb, 'background'))],
    ['안내 줄 ✕', tokenOf(prop(nx, 'color')), noteBg], ['안내 줄 ✕ 마우스 올림', tokenOf(prop(nx, 'color')), tokenOf(prop(ruleBody('.langnote-x:hover'), 'background'))]
  ];
  assert.notEqual(pairs[2][2], frame, '눌린 칸은 틀과 다른 바탕이어야 보임');
  return pairs;
}

test('글자 대비 4.5 이상: 모든 화면 모드(밝음·시스템 다크·data-theme=dark) × 시간대(낮·아침·노을·밤), 🌐 선택과 안내 줄의 모든 상태', () => {
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
  assert.ok(/\.langnote-btn:focus-visible,\.langnote-x:focus-visible\{[^}]*outline:2px solid var\(--accent\)/.test(CSS));
  assert.ok(CSS.indexOf('.langbar-btn:hover{') < CSS.indexOf('.langbar-btn[aria-pressed="true"]{'));
});

test('윈도 고대비 모드: 배경색이 지워져도 지금 언어가 시스템 강조색으로 구분된다', () => {
  const m = /@media \(forced-colors:active\)\{\s*\.langbar-btn\[aria-pressed="true"\]\{([^}]*)\}/.exec(CSS);
  assert.ok(m, 'forced-colors 규칙');
  assert.ok(/forced-color-adjust:none/.test(m[1]) && /background:Highlight/.test(m[1]) && /color:HighlightText/.test(m[1]));
  assert.ok(/@media \(forced-colors:active\)\{[^@]*\.langnote-btn\{border:1px solid ButtonText\}/.test(CSS), '안내 줄 단추는 배경이 지워져도 테두리로 단추처럼 보임');
});

test('안내 줄은 ?lang= 처리(openResultView·openTogetherLink)가 끝난 뒤에 정해진다 (지금 화면 언어를 보고 판정하므로)', () => {
  assert.ok(/const fromLink=openResultView\(\)\|\|openTogetherLink\(\);\s*initLangNote\(\);/.test(APP));
  assert.equal((APP.match(/initLangNote\(\)/g) || []).length, 2, '정의 한 번, 호출 한 번');
});

test('안내 줄: 모달이 아니라 문서 흐름 안의 한 줄(맨 위, 줄 전체, 좁으면 줄바꿈), 숨김이 display 에 덮이지 않는다', () => {
  const b = ruleBody('.langnote');
  assert.equal(prop(b, 'order'), '-2', '언어 선택(-1)·이름보다 위');
  assert.equal(prop(b, 'flex-basis'), '100%');
  assert.equal(prop(b, 'flex-wrap'), 'wrap', '375px 에서 가로로 넘치지 않게');
  assert.ok(!/position:\s*(fixed|absolute|sticky)/.test(b), '문서 흐름 안');
  assert.ok(/\[hidden\]\{display:none!important\}/.test(CSS), 'hidden 이 display:flex 에 지지 않음');
});

test('휴대폰: 언어 선택이 안내 줄 다음 첫 줄을 차지하고(order:-1, 이름 줄 가득), 가로 스크롤을 만들지 않는다', () => {
  const m = /\/\* ===== mobile ===== \*\/\s*@media \(max-width:720px\)\{([\s\S]*?)\n\}/.exec(CSS);
  assert.ok(m, '휴대폰(720px 이하) 블록');
  assert.ok(/\.langbar\{order:-1;/.test(m[1]));
  assert.ok(/header>\.brand\{flex-basis:100%\}/.test(m[1]));
  assert.ok(/@media \(max-width:480px\)\{\.langbar\{width:100%\}/.test(CSS), '아주 좁은 폭은 줄 전체를 씀');
  assert.ok(!/\.(langbar|langnote)\{[^}]*(white-space:nowrap|overflow-x:\s*(auto|scroll))/.test(CSS), '언어 줄을 가로로 밀리게 하지 않음');
});

// ---------- 5. 서비스 워커 ----------
test('sw.js 캐시 이름은 kongi-v44 이상 (index.html·app.js·app.css·core.js 가 바뀜)', () => {
  const m = /const VERSION = 'kongi-v(\d+)'/.exec(read('sw.js'));
  assert.ok(m && +m[1] >= 44, '버전 ' + (m && m[1]));
});
