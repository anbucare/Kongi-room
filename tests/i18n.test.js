// 번역 완전성 테스트: ko/en/de 키가 완전히 같아야 하고, 영어·독일어 문구에 한글이 남으면 실패한다.
// index.html 과 app.js 가 쓰는 키가 사전에 있는지도 확인한다.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
function loadI18n() {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(read('i18n.js'), sandbox);
  return sandbox.window.KONGI_I18N;
}
const I = loadI18n();
const LANGS = ['ko', 'en', 'de'];
const HANGUL = /[가-힣]/;

test('세 언어 사전이 모두 있다', () => {
  assert.deepEqual(Object.keys(I).sort(), LANGS.slice().sort());
  for (const l of LANGS) assert.ok(Object.keys(I[l]).length > 500, l + ' 사전이 비었음');
});

test('ko/en/de 키 수와 키 집합이 완전히 같다 (번역 누락 금지)', () => {
  const ko = Object.keys(I.ko).sort();
  for (const l of ['en', 'de']) {
    const keys = Object.keys(I[l]).sort();
    const missing = ko.filter((k) => !(k in I[l]));
    const extra = keys.filter((k) => !(k in I.ko));
    assert.deepEqual(missing, [], l + ' 에 없는 키');
    assert.deepEqual(extra, [], l + ' 에만 있는 키');
    assert.equal(keys.length, ko.length);
  }
});

test('영어·독일어 문구에 한글이 남아 있지 않다', () => {
  for (const l of ['en', 'de']) {
    const bad = Object.keys(I[l]).filter((k) => HANGUL.test(String(I[l][k])));
    assert.deepEqual(bad, [], l + ' 에 한글이 남은 키');
  }
});

test('모든 문구가 비어 있지 않은 문자열이다', () => {
  for (const l of LANGS) for (const k of Object.keys(I[l])) {
    assert.equal(typeof I[l][k], 'string', `${l}.${k} 는 문자열이어야 함`);
    assert.ok(I[l][k].trim().length > 0, `${l}.${k} 가 비었음`);
  }
});

test('{변수} 자리표시자가 세 언어에서 같다 (이름 조사 {N가} 류는 한국어 전용 허용)', () => {
  const vars = (s) => new Set(String(s).match(/\{[a-zA-Z0-9_]+\}/g) || []);
  const problems = [];
  for (const k of Object.keys(I.ko)) {
    const ko = vars(I.ko[k]);
    for (const l of ['en', 'de']) {
      const v = vars(I[l][k]);
      for (const x of v) if (!ko.has(x) && x !== '{N}') problems.push(`${l}.${k} 에 ko 에 없는 ${x}`);
      for (const x of ko) if (!v.has(x) && x !== '{N}') problems.push(`${l}.${k} 에 ${x} 빠짐`);
    }
  }
  assert.deepEqual(problems, []);
});

test('index.html 과 app.js 가 쓰는 번역 키가 사전(ko)에 있다', () => {
  const html = read('index.html');
  const app = read('app.js');
  const used = new Set();
  for (const m of html.matchAll(/data-i18n(?:-[a-z]+)?="([^"]+)"/g)) used.add(m[1]);
  const lit = String.raw`(?:'|")([a-zA-Z0-9_.@-]+)(?:'|")`;
  for (const re of [
    new RegExp(String.raw`\bt\(` + lit, 'g'),
    new RegExp(String.raw`\bsetT\([^,]+,\s*` + lit, 'g'),
    new RegExp(String.raw`\bcaption\(` + lit, 'g'),
    new RegExp(String.raw`\bsetStatus\(` + lit, 'g'),
    new RegExp(String.raw`\bsetTag\(` + lit, 'g')
  ]) for (const m of app.matchAll(re)) used.add(m[1]);
  const keys = Object.keys(I.ko);
  const missing = [...used].filter((k) => {
    if (k in I.ko) return false;
    // 'dex.tier' + n 처럼 코드가 접미사를 붙이는 키: 그 접두사로 시작하는 키가 하나는 있어야 한다
    return !keys.some((x) => x.startsWith(k));
  });
  assert.deepEqual(missing, []);
  assert.ok(used.size > 300, '사용 키 추출이 너무 적음: ' + used.size);
});

test('테마별 덧말(@theme) 키는 다섯 공간 모두에 있다', () => {
  const themed = Object.keys(I.ko).filter((k) => k.includes('@'));
  assert.ok(themed.length > 0);
  const base = new Set(themed.map((k) => k.split('@')[0]));
  for (const b of base) for (const th of ['library', 'greenhouse', 'train', 'cabin']) {
    assert.ok((b + '@' + th) in I.ko, `${b}@${th} 없음`);
  }
});
