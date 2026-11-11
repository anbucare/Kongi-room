// Serves the Kongi-room static site from Workers KV (see deploy.py).
// Files live in the SITE namespace under "<SITE_VERSION>/<path>", so a new deploy
// switches over instantly by changing SITE_VERSION.
const TYPES = {
  html: 'text/html; charset=utf-8', css: 'text/css; charset=utf-8', js: 'text/javascript; charset=utf-8',
  json: 'application/json', webmanifest: 'application/manifest+json', xml: 'application/xml; charset=utf-8',
  txt: 'text/plain; charset=utf-8', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp',
  svg: 'image/svg+xml', ico: 'image/x-icon', ttf: 'font/ttf', woff2: 'font/woff2', mp3: 'audio/mpeg'
};
const REVALIDATE = new Set(['html', 'js', 'css', 'webmanifest', 'xml', 'txt', 'json']);

const json = (obj, status = 200) => new Response(JSON.stringify(obj), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' }
});
// Transfer codes: 8 characters without look-alikes (0/O, 1/I/L).
const CODE_ABC = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function newCode() {
  const b = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(b, (x) => CODE_ABC[x % CODE_ABC.length]).join('');
}
async function readBody(req, max) {
  const text = await req.text();
  if (text.length > max) throw new Error('too large');
  return JSON.parse(text);
}

// Small JSON API next to the site: in-app feedback and backup transfer codes, both kept in the SITE namespace.
async function api(req, env, url) {
  const path = url.pathname;
  if (path === '/api/feedback' && req.method === 'POST') {
    let b;
    try { b = await readBody(req, 8000); } catch (e) { return json({ error: 'bad request' }, 400); }
    const text = String(b.text || '').trim().slice(0, 2000);
    if (text.length < 2) return json({ error: 'empty' }, 400);
    const rec = {
      at: new Date().toISOString(), kind: ['idea', 'bug', 'love'].includes(b.kind) ? b.kind : 'idea', text,
      contact: String(b.contact || '').slice(0, 120), lang: String(b.lang || '').slice(0, 5), screen: String(b.screen || '').slice(0, 20),
      lv: Number(b.lv) || 0, country: (req.cf && req.cf.country) || ''
    };
    const key = 'feedback/' + rec.at.replace(/[:.]/g, '-') + '-' + newCode().slice(0, 4);
    await env.SITE.put(key, JSON.stringify(rec), { metadata: { kind: rec.kind } });
    return json({ ok: true });
  }
  if (path === '/api/backup' && req.method === 'POST') {
    let b;
    try { b = await readBody(req, 400000); } catch (e) { return json({ error: 'too large or invalid' }, 400); }
    if (!b || b.app !== 'kongi-room' || typeof b.data !== 'object') return json({ error: 'invalid' }, 400);
    const code = newCode();
    await env.SITE.put('backup/' + code, JSON.stringify(b), { expirationTtl: 60 * 60 * 24 * 90 });
    return json({ code });
  }
  const m = /^\/api\/backup\/([A-Z0-9]{8})$/.exec(path);
  if (m && req.method === 'GET') {
    const v = await env.SITE.get('backup/' + m[1]);
    if (v === null) return json({ error: 'not found' }, 404);
    return new Response(v, { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
  }
  return json({ error: 'not found' }, 404);
}

export default {
  async fetch(req, env) {
    const url0 = new URL(req.url);
    if (url0.pathname.startsWith('/api/')) {
      try { return await api(req, env, url0); } catch (e) { return json({ error: 'server error' }, 500); }
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
    }
    const url = new URL(req.url);
    // Result links and their preview images: answered by the kongi-room-share Worker
    // through a service binding, so shared links stay on this site's address.
    if (env.SHARE && /^\/(r|result|og|og\.png)\/?$/.test(url.pathname)) return env.SHARE.fetch(req);
    let path = decodeURIComponent(url.pathname).replace(/^\/+/, '');
    // links that still carry the old GitHub Pages folder
    if (path === 'Kongi-room' || path.startsWith('Kongi-room/')) {
      return Response.redirect(url.origin + '/' + path.slice(11) + url.search, 301);
    }
    if (path === '' || path.endsWith('/')) path += 'index.html';
    if (path.includes('..')) return new Response('Bad Request', { status: 400 });
    const ext = (path.split('.').pop() || '').toLowerCase();
    const { value, metadata } = await env.SITE.getWithMetadata(env.SITE_VERSION + '/' + path, { type: 'arrayBuffer', cacheTtl: 3600 });
    if (value === null) {
      return new Response('Not found', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8' } });
    }
    const etag = metadata && metadata.etag ? '"' + metadata.etag + '"' : null;
    const h = new Headers({
      'content-type': TYPES[ext] || 'application/octet-stream',
      'x-content-type-options': 'nosniff',
      'cache-control': REVALIDATE.has(ext) ? 'public, max-age=0, must-revalidate' : 'public, max-age=604800'
    });
    if (etag) h.set('etag', etag);
    if (etag && req.headers.get('if-none-match') === etag) return new Response(null, { status: 304, headers: h });
    return new Response(req.method === 'HEAD' ? null : value, { headers: h });
  }
};
