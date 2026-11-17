#!/usr/bin/env node
/* 고운돋움·고운바탕 글꼴을 Google Fonts 에서 한 번 내려받아 이 사이트가 직접 내보내게 만든다 (2026-11-17).
 * 방문자 브라우저가 Google 서버에 접속하지 않게 하려는 것(독일 LG München I, 3 O 17493/20, 2022-01-20).
 * 글꼴 라이선스: SIL Open Font License 1.1 (fonts/OFL-*.txt 함께 저장).
 *
 * 사용 (저장소 루트에서, 글꼴을 바꿀 때만): node deploy/fonts/fetch-google-fonts.mjs
 * 만드는 것:
 *   fonts/<내용 지문 16자>.woff2   — 글자 범위(unicode-range)별 조각. 이름이 내용으로 정해져서, 같은 파일은 다시 올리지 않는다
 *   fonts.css                      — 고운돋움(앱이 처음부터 씀, index.html 이 불러옴)
 *   fonts-batang.css               — 고운바탕(에세이 카드를 그릴 때만 app.js 가 불러옴)
 *   fonts/OFL-gowundodum.txt, fonts/OFL-gowunbatang.txt
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'; // woff2 를 받으려면 최신 브라우저 UA
const SETS = [
  { out: 'fonts.css', css: 'https://fonts.googleapis.com/css2?family=Gowun+Dodum&display=swap', ofl: ['gowundodum'] },
  { out: 'fonts-batang.css', css: 'https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&display=swap', ofl: ['gowunbatang'] }
];
const dir = path.join(ROOT, 'fonts');
fs.mkdirSync(dir, { recursive: true });
const get = async (u) => { const r = await fetch(u, { headers: { 'user-agent': UA } }); if (!r.ok) throw new Error(u + ' → ' + r.status); return r; };
const used = new Set();
for (const s of SETS) {
  let css = await (await get(s.css)).text();
  const urls = [...new Set([...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2)\)/g)].map((m) => m[1]))];
  if (!urls.length) throw new Error('woff2 주소를 찾지 못함: ' + s.css);
  for (const u of urls) {
    const buf = Buffer.from(await (await get(u)).arrayBuffer());
    const name = createHash('sha1').update(buf).digest('hex').slice(0, 16) + '.woff2';
    fs.writeFileSync(path.join(dir, name), buf);
    used.add(name);
    css = css.split(u).join('fonts/' + name);
  }
  if (/fonts\.g(oogleapis|static)\.com/.test(css)) throw new Error('Google 주소가 남음: ' + s.out);
  const head = `/* ${s.out} — Google Fonts 에서 받아 이 사이트가 직접 내보내는 글꼴 (deploy/fonts/fetch-google-fonts.mjs 가 만듦, 손으로 고치지 말 것).\n   License: SIL Open Font License 1.1 — fonts/OFL-${s.ofl[0]}.txt */\n`;
  fs.writeFileSync(path.join(ROOT, s.out), head + css);
  for (const f of s.ofl) fs.writeFileSync(path.join(dir, `OFL-${f}.txt`), await (await get(`https://raw.githubusercontent.com/google/fonts/main/ofl/${f}/OFL.txt`)).text());
  console.log(`${s.out}: 조각 ${urls.length}개`);
}
for (const f of fs.readdirSync(dir)) if (f.endsWith('.woff2') && !used.has(f)) { fs.rmSync(path.join(dir, f)); console.log('안 쓰는 조각 삭제:', f); }
const total = [...used].reduce((a, f) => a + fs.statSync(path.join(dir, f)).size, 0);
console.log(`fonts/ 조각 ${used.size}개, ${(total / 1e6).toFixed(2)} MB`);
