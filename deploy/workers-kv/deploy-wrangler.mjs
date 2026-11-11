#!/usr/bin/env node
/* 콩이네 방 사이트를 Cloudflare Workers + KV 에 올립니다 — API 토큰 없이, `wrangler login` 로그인만으로.
 *
 * 사용 (저장소 루트에서):
 *   node deploy/workers-kv/deploy-wrangler.mjs            # 올리기
 *   node deploy/workers-kv/deploy-wrangler.mjs --dry-run  # 올리지 않고 무엇을 올릴지만 보기
 *   node deploy/workers-kv/deploy-wrangler.mjs --prune    # 올린 뒤, 직전 버전만 남기고 더 오래된 버전 파일을 KV 에서 지우기
 *
 * 하는 일 (deploy.py 와 같은 구조, 같은 Worker 이름 "kongi-room"):
 *   1. KV 네임스페이스 "kongi-room-site" 를 찾는다
 *   2. 사이트 파일만 골라 "<새 버전>/<경로>" 키로 한꺼번에 올린다 (wrangler kv bulk put)
 *   3. worker.js 를 그 네임스페이스·버전에 묶어 배포한다 (wrangler deploy)
 * 비밀 값은 어디에도 적지 않습니다. 로그인 상태는 wrangler 가 자기 설정 폴더에 보관합니다.
 * wrangler 는 `npx wrangler@4` 로 실행됩니다(처음 한 번 내려받음). 다른 바이너리를 쓰려면 WRANGLER_BIN=경로.
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const WORKER_NAME = process.env.WORKER_NAME || 'kongi-room';
const NS_TITLE = WORKER_NAME + '-site';
const SHARE_WORKER = process.env.SHARE_WORKER === undefined ? 'kongi-room-share' : process.env.SHARE_WORKER;
const args = new Set(process.argv.slice(2));
const DRY = args.has('--dry-run');
const PRUNE = args.has('--prune');

// Only the files a visitor needs. Source, docs, tests and the deploy scripts stay out.
const SITE_FILES = ['index.html', 'app.css', 'app.js', 'core.js', 'i18n.js', 'sw.js', 'manifest.webmanifest', 'robots.txt', 'sitemap.xml'];
const SITE_DIRS = ['icons', 'assets'];

// Always a 4.x wrangler: the kv commands need its --remote flag (worker/ pins an older 4.27 for the share Worker).
function wranglerCmd() {
  if (process.env.WRANGLER_BIN) return [process.env.WRANGLER_BIN];
  return ['npx', '--yes', 'wrangler@4'];
}
const W = wranglerCmd();
function wrangler(wargs, opts = {}) {
  const [cmd, ...pre] = W;
  const r = spawnSync(cmd, [...pre, ...wargs], { cwd: ROOT, encoding: 'utf8', stdio: opts.capture ? ['ignore', 'pipe', 'pipe'] : 'inherit', env: { ...process.env, WRANGLER_SEND_METRICS: 'false' } });
  if (r.error) throw r.error;
  if (r.status !== 0 && !opts.allowFail) {
    if (opts.capture) process.stderr.write((r.stdout || '') + (r.stderr || ''));
    throw new Error('wrangler ' + wargs.join(' ') + ' 실패 (exit ' + r.status + ')');
  }
  return (r.stdout || '') + (opts.capture ? '' : '');
}
const strip = (s) => s.replace(/\x1b\[[0-9;]*m/g, '');
function jsonFrom(text) {
  const t = strip(text);
  const i = t.search(/[\[{]/);
  if (i < 0) throw new Error('JSON 을 찾지 못함: ' + t.slice(0, 200));
  return JSON.parse(t.slice(i));
}

function collectFiles() {
  const out = [];
  const add = (rel) => {
    const p = path.join(ROOT, rel);
    if (!fs.existsSync(p)) return;
    out.push({ rel: rel.split(path.sep).join('/'), buf: fs.readFileSync(p) });
  };
  for (const f of SITE_FILES) add(f);
  for (const d of SITE_DIRS) {
    const walk = (dir) => {
      for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
        if (e.name.startsWith('.')) continue;
        const rel = path.join(dir, e.name);
        // assets/room_*.png are the uncompressed originals of the webp room art; the site only loads the webp
        if (e.isDirectory()) walk(rel); else if (!/^assets\/room_[a-z]+\.png$/.test(rel.split(path.sep).join('/'))) add(rel);
      }
    };
    if (fs.existsSync(path.join(ROOT, d))) walk(d);
  }
  return out;
}

function main() {
  console.log(`▶ ${WORKER_NAME} 배포${DRY ? ' (dry-run: 아무것도 올리지 않음)' : ''}`);
  // 0. login check
  const who = strip(wrangler(['whoami'], { capture: true, allowFail: true }));
  if (!/logged in|associated with the email/i.test(who)) {
    console.error('✖ Cloudflare 에 로그인돼 있지 않아요. 먼저 실행: npx wrangler login');
    process.exit(2);
  }
  const email = (/email ([^\s.]+@[^\s]+?)\.?(\s|$)/.exec(who) || [])[1] || '';
  console.log('  로그인:', email || '(확인됨)');

  // 1. namespace
  const nss = jsonFrom(wrangler(['kv', 'namespace', 'list'], { capture: true }));
  const ns = nss.find((n) => n.title === NS_TITLE);
  if (!ns) {
    console.error(`✖ KV 네임스페이스 "${NS_TITLE}" 가 없어요. 만들려면: npx wrangler kv namespace create ${NS_TITLE}`);
    process.exit(2);
  }
  console.log('  KV 네임스페이스:', NS_TITLE, ns.id);

  // 2. files
  const files = collectFiles();
  const version = 'v' + new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const total = files.reduce((a, f) => a + f.buf.length, 0);
  console.log(`  올릴 파일 ${files.length}개 (${(total / 1e6).toFixed(1)} MB) → 버전 ${version}`);
  if (!files.some((f) => f.rel === 'index.html')) { console.error('✖ index.html 이 없어요. 저장소 루트에서 실행했나요?'); process.exit(2); }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kongi-deploy-'));
  const bulk = files.map((f) => ({ key: version + '/' + f.rel, value: f.buf.toString('base64'), base64: true, metadata: { etag: createHash('sha1').update(f.buf).digest('hex').slice(0, 16) } }));
  const bulkFile = path.join(tmp, 'bulk.json');
  fs.writeFileSync(bulkFile, JSON.stringify(bulk));
  if (DRY) console.log('  (dry-run) 올릴 목록:', files.map((f) => f.rel).filter((r) => !r.startsWith('assets/og/')).join(', '), '+ assets/og/*');
  else {
    console.log('  KV 에 올리는 중…');
    wrangler(['kv', 'bulk', 'put', bulkFile, '--namespace-id', ns.id, '--remote']);
  }

  // 3. worker with bindings to this namespace and version
  const cfg = [
    `name = "${WORKER_NAME}"`,
    `main = "${path.join(HERE, 'worker.js').replace(/\\/g, '/')}"`,
    'compatibility_date = "2025-10-01"',
    'workers_dev = true',
    'preview_urls = false',
    '',
    '[vars]',
    `SITE_VERSION = "${version}"`,
    '',
    '[[kv_namespaces]]',
    'binding = "SITE"',
    `id = "${ns.id}"`,
    ...(SHARE_WORKER ? ['', '[[services]]', 'binding = "SHARE"', `service = "${SHARE_WORKER}"`] : [])
  ].join('\n') + '\n';
  const cfgFile = path.join(tmp, 'wrangler.toml');
  fs.writeFileSync(cfgFile, cfg);
  console.log('  Worker 배포' + (DRY ? ' (dry-run)' : '') + '…');
  wrangler(['deploy', '--config', cfgFile, ...(DRY ? ['--dry-run'] : [])]);

  // 4. optionally drop versions older than the previous one (feedback/ and backup/ keys are never touched)
  if (PRUNE && !DRY) {
    const keys = jsonFrom(wrangler(['kv', 'key', 'list', '--namespace-id', ns.id, '--prefix', 'v', '--remote'], { capture: true }));
    const versions = [...new Set(keys.map((k) => k.name.split('/')[0]).filter((v) => /^v\d{14}$/.test(v)))].sort();
    const keep = new Set(versions.slice(-2));
    const old = keys.filter((k) => /^v\d{14}\//.test(k.name) && !keep.has(k.name.split('/')[0])).map((k) => k.name);
    if (old.length) {
      const delFile = path.join(tmp, 'delete.json');
      fs.writeFileSync(delFile, JSON.stringify(old));
      console.log(`  오래된 버전 ${versions.length - keep.size}개 (${old.length} 키) 지우는 중…`);
      wrangler(['kv', 'bulk', 'delete', delFile, '--namespace-id', ns.id, '--remote']); // wrangler asks once before deleting
    } else console.log('  지울 오래된 버전 없음');
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  if (DRY) console.log('✔ dry-run 끝. 실제로 올리려면 --dry-run 을 빼고 다시 실행하세요.');
  else console.log(`✔ 끝. 확인: https://${WORKER_NAME}.anbu-pilot.workers.dev/  (버전 ${version}, 설치된 앱은 sw.js 버전이 바뀌면 다음 열 때 새 파일을 받아요)`);
}

try { main(); } catch (e) { console.error('✖', e.message || e); process.exit(1); }
