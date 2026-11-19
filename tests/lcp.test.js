// 첫 화면 속도(LCP) 시험: 로딩 순서를 바꾼 곳이 app.js·app.css 의 규칙과 어긋나지 않는지 본다.
//  - head 의 "첫 그림 미리 받기" 스크립트가 고르는 그림 = app.js 의 tod()·테마 규칙이 첫 그리기에 쓰는 그림 (app.css 의 규칙으로 확인)
//  - #scene 안쪽 스크립트가 방과 본문 색에 적용하는 값
//  - core.js·i18n.js 는 defer + app.js 앞, 이미지 크기, 썸네일 지연, 서비스 워커 버전
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const HTML = read('index.html');
const APP = read('app.js');
const CSS = read('app.css');

// ---- 두 인라인 스크립트를 꺼낸다 ----
const scripts = [...HTML.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
const headScript = scripts.find((s) => s.includes('window.KONGI_BOOT={'));
const sceneScript = scripts.find((s) => s.includes('window.KONGI_BOOT,'));
const THEMES = ['room', 'library', 'greenhouse', 'train', 'cabin'];

// 가짜 브라우저: 저장소 값과 시계를 주고 head 스크립트를 실행 → 만들어진 <link> 와 KONGI_BOOT
function runHead({ store = {}, hour = 12, storageThrows = false }) {
  const appended = [];
  const win = {};
  const fontsLink = { media: 'not all' };
  const events = {};
  const doc = {
    createElement: (tag) => { const attrs = {}; return { tag, attrs, setAttribute(k, v) { attrs[k] = v; }, set rel(v) { attrs.rel = v; }, set as(v) { attrs.as = v; }, set type(v) { attrs.type = v; }, set href(v) { attrs.href = v; } }; },
    getElementById: (id) => (id === 'fontsCss' ? fontsLink : null),
    head: { appendChild: (el) => appended.push(el) }
  };
  const Date2 = class extends Date { constructor(...a) { if (a.length) super(...a); else { super(2026, 10, 19, hour, 30, 0); } } };
  const ls = { getItem: (k) => { if (storageThrows) throw new Error('blocked'); return k in store ? JSON.stringify(store[k]) : null; } };
  vm.runInNewContext(headScript, { window: win, document: doc, localStorage: ls, Date: Date2, addEventListener: (t, f) => { events[t] = f; }, setTimeout: (f, ms) => { events.timeout = { f, ms }; } });
  return { links: appended.map((e) => e.attrs), boot: win.KONGI_BOOT, fontsLink, events, preload: appended[0] };
}

// 가짜 방: #scene 안쪽 스크립트 실행
function runScene(boot) {
  const cls = new Set(['scene', 't-day']);
  const scene = { classList: { add: (c) => cls.add(c), remove: (c) => cls.delete(c), contains: (c) => cls.has(c) }, dataset: {} };
  const body = { dataset: {} };
  vm.runInNewContext(sceneScript, { window: { KONGI_BOOT: boot }, document: { getElementById: (id) => (id === 'scene' ? scene : null), body } });
  return { cls, scene, body };
}

// app.js 가 실제로 쓰는 tod() 를 그대로 꺼내 실행 (규칙을 복사해 두지 않고 원본과 비교)
const todSrc = /function tod\(\)\{[\s\S]*?\n  return [^\n]*\}/.exec(APP);
assert.ok(todSrc, 'app.js 에서 function tod() 를 찾지 못함');
function appTod(stored, hour) {
  const store = { get: (k, d) => (k === 'tod' && stored !== undefined ? stored : d) };
  const Date2 = class extends Date { constructor(...a) { if (a.length) super(...a); else super(2026, 10, 19, hour, 0, 0); } };
  return vm.runInNewContext(todSrc[0] + '; tod()', { store, Date: Date2 });
}

// app.css 가 첫 그리기(비 없음)에 쓰는 방 그림 파일: 테마가 room 이 아니면 테마 그림이 !important 로 이긴다
function cssBackground(theme, tod) {
  if (theme !== 'room') {
    const m = new RegExp(`\\.scene\\[data-theme="${theme}"\\][^{]*\\{background-image:url\\('(assets/[^']+)'\\)!important\\}`).exec(CSS);
    return m && m[1];
  }
  const m = new RegExp(`\\.scene\\.t-${tod}\\{background-image:url\\('(assets/[^']+)'\\)\\}`).exec(CSS);
  return m && m[1];
}

test('두 스크립트가 index.html 에 있고, head 쪽이 스타일시트 링크보다 앞이다', () => {
  assert.ok(headScript && sceneScript);
  assert.ok(HTML.indexOf('window.KONGI_BOOT={') < HTML.indexOf('<link rel="stylesheet" href="fonts.css">'), '미리 받기는 CSS 링크보다 먼저 시작해야 의미가 있음');
  assert.ok(HTML.indexOf('window.KONGI_BOOT,') > HTML.indexOf('<section class="scene t-day" id="scene"'), '#scene 이 생긴 뒤에 실행되어야 함');
  assert.match(HTML, /<section class="scene t-day" id="scene"[^>]*>\s*<script>/, '#scene 의 첫 자식으로 둠');
});

test('head 스크립트: 어떤 저장값·시각이든 app.js 가 첫 그리기에 쓰는 방 그림과 같은 파일을 high 우선순위로 미리 받는다', () => {
  const themeIds = /const THEME_IDS=\[([^\]]*)\]/.exec(APP)[1].replace(/'/g, '').split(',');
  assert.deepEqual(themeIds, THEMES, 'app.js 의 THEME_IDS 가 바뀜 — head 스크립트 목록도 같이 고칠 것');
  let n = 0;
  for (const theme of [undefined, ...THEMES, 'bogus', 7, null]) {
    for (const tod of [undefined, 'auto', 'morning', 'day', 'sunset', 'night']) {
      for (const hour of tod === undefined || tod === 'auto' ? [0, 5, 6, 9, 10, 16, 17, 19, 20, 23] : [12]) {
        const store = {};
        if (theme !== undefined) store.theme = theme;
        if (tod !== undefined) store.tod = tod;
        const { links, boot } = runHead({ store, hour });
        const effTheme = THEMES.includes(theme) ? theme : 'room';
        const effTod = appTod(tod, hour);
        const want = cssBackground(effTheme, effTod);
        assert.ok(want, `app.css 에서 ${effTheme}/${effTod} 그림 규칙을 찾지 못함`);
        assert.equal(links.length, 1, JSON.stringify({ theme, tod, hour }));
        assert.equal(links[0].href, want, JSON.stringify({ theme, tod, hour }));
        assert.deepEqual({ rel: links[0].rel, as: links[0].as, type: links[0].type, fetchpriority: links[0].fetchpriority }, { rel: 'preload', as: 'image', type: 'image/webp', fetchpriority: 'high' });
        assert.deepEqual({ tod: boot.tod, theme: boot.theme }, { tod: effTod, theme: effTheme });
        assert.ok(fs.existsSync(path.join(root, want)), '미리 받는 파일이 저장소에 없음: ' + want);
        n++;
      }
    }
  }
  assert.ok(n > 150, '검사한 조합 수 ' + n);
});

test('head 스크립트: 알 수 없는 시간대 값(손상된 저장값)이거나 저장소가 막혀 있어도 오류 없이 — 막히면 기본값(낮·콩이의 방)', () => {
  const bad = runHead({ store: { tod: 'midnight' } });
  assert.deepEqual(bad.links, [], '알 수 없는 시간대는 아무것도 안 함 (app.js 가 예전 방식으로 처리)');
  assert.equal(bad.boot, undefined);
  const blocked = runHead({ storageThrows: true, hour: 22 });
  assert.equal(blocked.links.length, 1);
  assert.equal(blocked.links[0].href, 'assets/room_night.webp', '저장소가 막히면 시각만으로 정함 (app.js 도 같음)');
});

test('글꼴: fonts.css 는 처음엔 꺼 두고(media="not all") 방 그림이 도착하거나 페이지 load 때 켠다 — 스크립트를 못 쓰면 noscript 가 바로 켠다', () => {
  assert.match(HTML, /<link rel="stylesheet" href="fonts\.css" media="not all" id="fontsCss">\s*<noscript><link rel="stylesheet" href="fonts\.css"><\/noscript>/);
  assert.match(HTML, /<link rel="stylesheet" href="app\.css">/, 'app.css 는 그대로 첫 그리기를 막는 스타일시트');
  // 그림이 도착(onload)하거나 실패(onerror)하면 켠다
  for (const ev of ['onload', 'onerror']) {
    const r = runHead({});
    assert.equal(r.fontsLink.media, 'not all', '스크립트 실행 직후엔 꺼져 있음');
    r.preload[ev]();
    assert.equal(r.fontsLink.media, 'all', ev);
  }
  // 페이지 load 때도 켠다 (미리 받기를 못 정한 경우에도 글꼴은 반드시 켜짐)
  for (const store of [{}, { tod: 'midnight' }]) {
    const r = runHead({ store });
    assert.equal(typeof r.events.load, 'function');
    r.events.load();
    assert.equal(r.fontsLink.media, 'all', JSON.stringify(store));
  }
  // 그림도 load 도 안 오는 경우(멈춘 요청)를 위한 안전장치: 늦어도 4초 뒤에는 켠다
  const late = runHead({});
  assert.ok(late.events.timeout && late.events.timeout.ms <= 5000);
  late.events.timeout.f();
  assert.equal(late.fontsLink.media, 'all');
  // 저장소가 막혀도 load 때 켜짐
  const blocked = runHead({ storageThrows: true });
  blocked.events.load();
  assert.equal(blocked.fontsLink.media, 'all');
});

test('#scene 스크립트: 낮 그림을 시간대·공간에 맞게 바꾸고 본문 색을 맞추되, 비(rainy)는 건드리지 않는다', () => {
  for (const [tod, theme] of [['night', 'room'], ['sunset', 'library'], ['morning', 'cabin'], ['day', 'room']]) {
    const { cls, scene, body } = runScene({ tod, theme });
    assert.ok(cls.has('t-' + tod) && !(tod !== 'day' && cls.has('t-day')), tod);
    assert.equal(scene.dataset.theme, theme);
    assert.equal(body.dataset.tod, tod);
    assert.ok(!cls.has('rainy'), 'rainy 는 app.js 의 rainVisual 이 켜야 빗방울(setupRainDrops)이 만들어짐');
  }
  // 값이 없으면(head 스크립트가 아무것도 안 정함) 그대로
  const none = runScene(undefined);
  assert.ok(none.cls.has('t-day') && none.scene.dataset.theme === undefined && none.body.dataset.tod === undefined);
});

test('app.js 는 같은 값을 다시 적용하고(applyTod·applyTheme), rainVisual 의 "이미 켜져 있으면 건너뜀" 때문에 rainy 는 미리 켜면 안 된다', () => {
  assert.match(APP, /function applyTod\(\)\{const v=tod\(\);const changed=!scene\.classList\.contains\('t-'\+v\)/);
  assert.match(APP, /document\.body\.dataset\.tod=v/);
  assert.match(APP, /scene\.dataset\.theme=id/);
  assert.match(APP, /function rainVisual\(on\)\{\s*if\(scene\.classList\.contains\('rainy'\)===on\)\{[^}]*return\}/);
  const code = (x) => x.replace(/\/\*[\s\S]*?\*\//g, '');
  assert.ok(!/rainy/.test(code(sceneScript)) && !/rainy/.test(code(headScript)), '미리 적용 스크립트가 rainy 를 켜지 않음');
});

test('core.js·i18n.js 는 defer 이고 app.js(defer) 보다 앞서 실행된다 — 첫 그리기를 막지 않는다', () => {
  const tags = [...HTML.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*>/g)].map((m) => ({ src: m[1], defer: /\bdefer\b/.test(m[0]), at: m.index }));
  const by = Object.fromEntries(tags.map((t) => [t.src, t]));
  for (const f of ['core.js', 'i18n.js', 'app.js']) assert.ok(by[f] && by[f].defer, f + ' 는 defer');
  assert.ok(by['core.js'].at < by['i18n.js'].at && by['i18n.js'].at < by['app.js'].at, '실행 순서 core → i18n → app (문서 순서)');
  // 렌더를 막는 외부 스크립트(defer·async 없음)가 없다
  assert.deepEqual(tags.filter((t) => !t.defer && !/\basync\b/.test(HTML.slice(t.at, t.at + 120))).map((t) => t.src), []);
  // app.js 말고 KONGI_CORE·KONGI_I18N 을 첫 그리기 전에 쓰는 인라인 스크립트가 없다 (defer 라서 그 시점엔 아직 없음)
  for (const s of scripts) assert.ok(!/KONGI_CORE|KONGI_I18N/.test(s.replace(/\/\*[\s\S]*?\*\//g, '')), '인라인 스크립트가 아직 없는 전역을 씀');
});

test('이미지: 고양이·밥그릇에 실제 파일 크기대로 width·height, 방 썸네일 5개는 지연 로딩(아이들 때 app.js 가 미리 받음)', () => {
  const dims = (f) => { const b = fs.readFileSync(path.join(root, f)); return [b.readUInt32BE(16), b.readUInt32BE(20)]; }; // PNG IHDR
  const imgs = [...HTML.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
  const attr = (tag, k) => (new RegExp(`\\b${k}="([^"]*)"`).exec(tag) || [])[1];
  assert.ok(imgs.length >= 9);
  for (const tag of imgs) {
    const src = attr(tag, 'src');
    assert.ok(attr(tag, 'width') && attr(tag, 'height'), 'width·height 없음: ' + src);
    if (/\.png$/.test(src)) assert.deepEqual([+attr(tag, 'width'), +attr(tag, 'height')], dims(src), 'PNG 실제 크기와 다름: ' + src);
  }
  const thumbs = imgs.filter((t) => /theme_[a-z]+_thumb\.webp/.test(t));
  assert.equal(thumbs.length, 5);
  for (const t of thumbs) assert.ok(attr(t, 'loading') === 'lazy', '썸네일은 lazy: ' + attr(t, 'src'));
  // 모달이 열리기 전에 미리 받아 두는 코드: 페이지가 다 불러와진(load) 뒤 아이들 때 — 첫 화면의 큰 그림과 다투지 않게
  assert.match(APP, /const pre=\(\)=>\{\$\$\('\.theme-card img'\)\.forEach\(im=>\{const i=new Image\(\);i\.src=im\.src\}\)\};const idle=\(\)=>\{if\(window\.requestIdleCallback\)requestIdleCallback\(pre,\{timeout:5000\}\);else setTimeout\(pre,3000\)\};if\(document\.readyState==='complete'\)idle\(\);else addEventListener\('load',idle\)/);
});

test('서비스 워커 캐시 버전이 올랐고(index.html 이 바뀜) 새 파일은 없다', () => {
  assert.ok(+/kongi-v(\d+)/.exec(read('sw.js'))[1] >= 45);
  const deploy = read('deploy/workers-kv/deploy-wrangler.mjs');
  assert.ok(!/tests\/perf/.test(deploy), '측정 스크립트는 배포 대상이 아님');
});
