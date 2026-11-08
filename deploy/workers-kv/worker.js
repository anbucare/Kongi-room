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

export default {
  async fetch(req, env) {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
    }
    const url = new URL(req.url);
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
