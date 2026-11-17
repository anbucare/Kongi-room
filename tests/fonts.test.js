// 글꼴 직접 내보내기 시험: fonts.css·fonts-batang.css 가 가리키는 조각이 모두 있고(이름 = 내용 지문), 남는 조각이 없으며,
// 사이트 서버(worker.js)가 fonts/ 를 버전 없이 한 번 올린 키에서 꺼내고, 올리기 스크립트가 조각을 매번 다시 쓰지 않게 되어 있는지 본다.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

const root = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');

test('fonts.css·fonts-batang.css: 조각이 모두 저장소에 있고, 이름이 내용 지문이며, 남는 조각·외부 주소가 없다', () => {
  const used = new Set();
  for (const [css, family, faces] of [['fonts.css', 'Gowun Dodum', [400]], ['fonts-batang.css', 'Gowun Batang', [400, 700]]]) {
    const s = read(css);
    assert.ok(!/https?:/.test(s.replace(/\/\*[\s\S]*?\*\//g, '')), css + ' 에 외부 주소');
    assert.ok(s.includes(`font-family: '${family}'`), css + ' 글꼴 이름');
    for (const w of faces) assert.ok(s.includes(`font-weight: ${w};`), css + ' 굵기 ' + w);
    assert.ok(/font-display: swap/.test(s) && /unicode-range:/.test(s));
    const urls = [...s.matchAll(/url\((fonts\/([0-9a-f]{16})\.woff2)\)/g)];
    assert.ok(urls.length > 50, css + ' 조각이 너무 적음: ' + urls.length);
    for (const [, rel, hash] of urls) {
      const buf = fs.readFileSync(path.join(root, rel));
      assert.equal(createHash('sha1').update(buf).digest('hex').slice(0, 16), hash, rel + ' 이름이 내용과 다름');
      assert.equal(buf.subarray(0, 4).toString('latin1'), 'wOF2', rel + ' 는 woff2 가 아님');
      used.add(rel.slice(6));
    }
  }
  const files = fs.readdirSync(path.join(root, 'fonts'));
  assert.deepEqual(files.filter((f) => f.endsWith('.woff2') && !used.has(f)), [], '어느 CSS 도 안 쓰는 조각');
  for (const f of ['OFL-gowundodum.txt', 'OFL-gowunbatang.txt']) assert.match(read('fonts/' + f), /SIL OPEN FONT LICENSE Version 1\.1/i, f);
});

test('앱이 Google 글꼴 서버를 부르지 않는다: index.html 은 fonts.css, 에세이 카드는 fonts-batang.css', () => {
  const all = ['index.html', 'app.js', 'core.js', 'app.css', 'sw.js', 'fonts.css', 'fonts-batang.css'].map(read).join('\n');
  assert.ok(!/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(all), 'Google 글꼴 주소가 남음');
  assert.match(read('index.html'), /<link rel="stylesheet" href="fonts\.css">/);
  assert.match(read('app.js'), /l\.href = 'fonts-batang\.css'/);
});

test('올리기: 두 CSS 는 버전마다, 글꼴 조각은 fonts/ 키로 없을 때만 올린다 (KV 하루 쓰기 한도)', () => {
  const d = read('deploy/workers-kv/deploy-wrangler.mjs');
  const files = /const SITE_FILES = \[([\s\S]*?)\];/.exec(d)[1];
  for (const f of ['fonts.css', 'fonts-batang.css']) assert.ok(files.includes(`'${f}'`), 'SITE_FILES 에 ' + f);
  const dirs = /const SITE_DIRS = \[([^\]]*)\]/.exec(d)[1];
  assert.ok(!/'fonts'/.test(dirs), 'fonts/ 를 버전마다 올리면 안 됨');
  assert.match(d, /'--prefix', 'fonts\/'/);
  assert.match(d, /have\.get\(f\.key\) !== f\.etag/);
  assert.match(d, /\/\^v\\d\{14\}\\\/\//, '오래된 버전 지우기는 v…/ 키만 (fonts/ 는 건드리지 않음)');
});

test('사이트 서버: fonts/ 는 버전 없는 키에서, 없으면 버전 키에서 꺼내고, 1년 캐시', async () => {
  const mod = await import(path.join(root, 'deploy/workers-kv/worker.js'));
  const worker = mod.default;
  const calls = [];
  const kv = (store) => ({ async getWithMetadata(key) { calls.push(key); return key in store ? { value: new TextEncoder().encode('x').buffer, metadata: { etag: 'e' } } : { value: null, metadata: null }; } });
  const env = (store) => ({ SITE: kv(store), SITE_VERSION: 'v20261117000000' });
  let res = await worker.fetch(new Request('https://k.example/fonts/0123456789abcdef.woff2'), env({ 'fonts/0123456789abcdef.woff2': 1 }));
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type'), 'font/woff2');
  assert.match(res.headers.get('cache-control'), /max-age=31536000, immutable/);
  assert.deepEqual(calls.splice(0), ['fonts/0123456789abcdef.woff2']);
  res = await worker.fetch(new Request('https://k.example/fonts/0123456789abcdef.woff2'), env({ 'v20261117000000/fonts/0123456789abcdef.woff2': 1 }));
  assert.equal(res.status, 200, 'deploy.py 처럼 버전 키에만 있어도 나와야 함');
  assert.deepEqual(calls.splice(0), ['fonts/0123456789abcdef.woff2', 'v20261117000000/fonts/0123456789abcdef.woff2']);
  res = await worker.fetch(new Request('https://k.example/fonts.css'), env({ 'v20261117000000/fonts.css': 1 }));
  assert.equal(res.status, 200);
  assert.match(res.headers.get('cache-control'), /must-revalidate/);
  assert.deepEqual(calls.splice(0), ['v20261117000000/fonts.css']);
});
