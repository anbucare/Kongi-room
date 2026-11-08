#!/usr/bin/env python3
"""Deploy the Kongi-room site to Cloudflare Workers + KV.

Usage:  python3 deploy/workers-kv/deploy.py <site_dir>
Needs:  CLOUDFLARE_ACCOUNT_ID and an API token (CLOUDFLARE_API_TOKEN, sent as Bearer)
        with Workers Scripts:Edit and Workers KV Storage:Edit.
Steps:  create/find the KV namespace -> bulk-upload every file under a new version prefix
        -> upload worker.js bound to that namespace/version -> enable <name>.<sub>.workers.dev
"""
import base64, hashlib, json, os, subprocess, sys, time

ACC = os.environ['CLOUDFLARE_ACCOUNT_ID']
TOKEN = os.environ.get('CLOUDFLARE_API_TOKEN', '')
NAME = os.environ.get('WORKER_NAME', 'kongi-room')
NS_TITLE = NAME + '-site'
API = 'https://api.cloudflare.com/client/v4/accounts/' + ACC
HERE = os.path.dirname(os.path.abspath(__file__))

def curl(args, data=None):
    cmd = ['curl', '-sS', '--fail-with-body', '-H', 'Authorization: Bearer ' + TOKEN] + args
    out = subprocess.run(cmd, input=data, capture_output=True)
    try:
        res = json.loads(out.stdout or b'{}')
    except ValueError:
        sys.exit('bad response: %r %r' % (out.stdout[:300], out.stderr[:300]))
    if not res.get('success'):
        sys.exit('API error %s: %s' % (args[-1], res.get('errors')))
    return res.get('result')

def main(site):
    # 1. namespace
    nss = curl([API + '/storage/kv/namespaces?per_page=100'])
    ns = next((n['id'] for n in nss if n['title'] == NS_TITLE), None)
    if not ns:
        ns = curl(['-X', 'POST', '-H', 'Content-Type: application/json', '--data-binary', '@-', API + '/storage/kv/namespaces'],
                  json.dumps({'title': NS_TITLE}).encode())['id']
    version = time.strftime('v%Y%m%d%H%M%S')
    # 2. files
    entries, total = [], 0
    for root, _, files in os.walk(site):
        for f in files:
            p = os.path.join(root, f)
            rel = os.path.relpath(p, site).replace(os.sep, '/')
            b = open(p, 'rb').read()
            entries.append({'key': version + '/' + rel, 'value': base64.b64encode(b).decode(), 'base64': True,
                            'metadata': {'etag': hashlib.sha1(b).hexdigest()[:16]}})
            total += len(b)
    chunk, size = [], 0
    def flush():
        if chunk:
            curl(['-X', 'PUT', '-H', 'Content-Type: application/json', '--data-binary', '@-', API + '/storage/kv/namespaces/%s/bulk' % ns],
                 json.dumps(chunk).encode())
            chunk.clear()
    for e in entries:
        if size + len(e['value']) > 25_000_000 or len(chunk) >= 5000:
            flush(); size = 0
        chunk.append(e); size += len(e['value'])
    flush()
    print('uploaded %d files (%.1f MB) as %s' % (len(entries), total / 1e6, version))
    # 3. worker script
    meta = {'main_module': 'worker.js', 'compatibility_date': '2025-10-01',
            'bindings': [{'type': 'kv_namespace', 'name': 'SITE', 'namespace_id': ns},
                         {'type': 'plain_text', 'name': 'SITE_VERSION', 'text': version}]
                        + ([{'type': 'service', 'name': 'SHARE', 'service': os.environ.get('SHARE_WORKER', 'kongi-room-share')}]
                           if os.environ.get('SHARE_WORKER', 'kongi-room-share') else [])}
    curl(['-X', 'PUT', '-F', 'metadata=' + json.dumps(meta) + ';type=application/json',
          '-F', 'worker.js=@' + os.path.join(HERE, 'worker.js') + ';type=application/javascript+module',
          API + '/workers/scripts/' + NAME])
    # 4. workers.dev route
    curl(['-X', 'POST', '-H', 'Content-Type: application/json', '--data-binary', '@-', API + '/workers/scripts/%s/subdomain' % NAME],
         json.dumps({'enabled': True, 'previews_enabled': False}).encode())
    sub = curl([API + '/workers/subdomain'])['subdomain']
    print('live: https://%s.%s.workers.dev/' % (NAME, sub))

if __name__ == '__main__':
    main(sys.argv[1])
