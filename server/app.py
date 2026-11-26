"""EGORVERSE static host + verified Telegram accounts. Python standard library only."""
import hashlib, hmac, json, os, secrets, sqlite3, time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qsl, urlsplit, unquote
from collections import defaultdict, deque
from contextlib import contextmanager

ROOT = Path(__file__).resolve().parents[1]
MAX_BODY = 131072

def validate_init_data(raw, bot_token, now=None):
    now = int(time.time() if now is None else now)
    if not isinstance(raw, str) or len(raw) > 16384:
        raise ValueError('Invalid Telegram data')
    pairs = parse_qsl(raw, keep_blank_values=True, strict_parsing=True)
    fields = dict(pairs)
    if len(fields) != len(pairs):
        raise ValueError('Duplicate Telegram fields')
    signature = fields.pop('hash', '')
    check = '\n'.join(f'{k}={v}' for k, v in sorted(fields.items()))
    key = hmac.new(b'WebAppData', bot_token.encode(), hashlib.sha256).digest()
    expected = hmac.new(key, check.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(signature, expected):
        raise ValueError('Invalid Telegram signature')
    age = now - int(fields.get('auth_date', '0'))
    if not -30 <= age <= 3600:
        raise ValueError('Telegram login expired')
    user = json.loads(fields.get('user', '{}'))
    uid = user.get('id')
    if type(uid) is not int or not 0 < uid < 2**53:
        raise ValueError('Invalid Telegram user')
    return {'id': str(uid), 'name': str(user.get('first_name') or 'Traveler')[:80]}

class Store:
    def __init__(self, path):
        self.path = str(path)
        with self.db() as db:
            db.execute('PRAGMA journal_mode=WAL')
            db.execute('CREATE TABLE IF NOT EXISTS saves (uid TEXT PRIMARY KEY, revision INTEGER NOT NULL, payload TEXT NOT NULL, updated INTEGER NOT NULL)')
            db.execute('CREATE TABLE IF NOT EXISTS sessions (digest TEXT PRIMARY KEY, uid TEXT NOT NULL, expires INTEGER NOT NULL)')
    @contextmanager
    def db(self):
        connection = sqlite3.connect(self.path, timeout=5)
        try:
            with connection:
                yield connection
        finally:
            connection.close()
    def login(self, uid):
        token = secrets.token_urlsafe(32)
        with self.db() as db:
            db.execute('DELETE FROM sessions WHERE expires < ?', (int(time.time()),))
            db.execute('INSERT INTO sessions VALUES (?,?,?)', (hashlib.sha256(token.encode()).hexdigest(), uid, int(time.time())+86400))
        return token
    def user(self, token):
        with self.db() as db:
            row = db.execute('SELECT uid FROM sessions WHERE digest=? AND expires>?', (hashlib.sha256(token.encode()).hexdigest(), int(time.time()))).fetchone()
        return row[0] if row else None
    def logout(self, token):
        with self.db() as db:
            db.execute('DELETE FROM sessions WHERE digest=?', (hashlib.sha256(token.encode()).hexdigest(),))
    def read(self, uid):
        with self.db() as db:
            row = db.execute('SELECT revision,payload,updated FROM saves WHERE uid=?', (uid,)).fetchone()
        return {'revision': row[0], 'save': json.loads(row[1]), 'savedAt': row[2]} if row else {'revision': 0, 'save': None, 'savedAt': None}
    def write(self, uid, revision, save):
        if type(revision) is not int or revision < 0 or not isinstance(save, dict) or save.get('version') != 1:
            raise ValueError('Invalid save envelope')
        if any(not isinstance(save.get(k), dict) for k in ('profile', 'journey', 'neighborhood', 'position')):
            raise ValueError('Invalid save structure')
        payload = json.dumps(save, ensure_ascii=False, allow_nan=False)
        if len(payload.encode()) > MAX_BODY-1024:
            raise ValueError('Save too large')
        with self.db() as db:
            db.execute('BEGIN IMMEDIATE')
            row = db.execute('SELECT revision FROM saves WHERE uid=?', (uid,)).fetchone()
            if (row[0] if row else 0) != revision:
                return None
            db.execute('INSERT INTO saves VALUES (?,?,?,?) ON CONFLICT(uid) DO UPDATE SET revision=excluded.revision,payload=excluded.payload,updated=excluded.updated', (uid, revision+1, payload, int(time.time())))
        return revision+1

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)
    def log_message(self, fmt, *args):
        # Never log auth headers, initData or request bodies.
        if args and isinstance(args[0], str) and args[0].startswith(('GET ', 'POST ', 'PUT ')):
            args = (args[0].split('?')[0], *args[1:])
        super().log_message(fmt, *args)
    def end_headers(self):
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Referrer-Policy', 'strict-origin-when-cross-origin')
        if getattr(self, 'fresh_code', False):
            self.send_header('Cache-Control', 'no-store')
        super().end_headers()
    def reply(self, code, body):
        raw = json.dumps(body, ensure_ascii=False).encode()
        self.send_response(code); self.send_header('Content-Type', 'application/json; charset=utf-8'); self.send_header('Cache-Control', 'no-store'); self.send_header('Content-Length', str(len(raw))); self.end_headers(); self.wfile.write(raw)
    def api(self):
        path = urlsplit(self.path).path
        configured = bool(self.server.bot_token and self.server.origin)
        if path == '/api/config' and self.command == 'GET':
            return self.reply(200, {'configured': configured})
        body = b''
        if self.command != 'GET':
            try: size = int(self.headers.get('Content-Length', '0'))
            except ValueError: return self.reply(400, {'error': 'Invalid body size'})
            if not 0 < size <= MAX_BODY: return self.reply(413, {'error': 'Invalid body size'})
            body = self.rfile.read(size)
        if self.command != 'GET' and self.headers.get('Origin') != self.server.origin:
            return self.reply(403, {'error': 'Origin rejected'})
        if not configured:
            return self.reply(503, {'error': 'Telegram is not configured'})
        history = self.server.rates[self.client_address[0]]
        now = time.time()
        while history and history[0] < now-60: history.popleft()
        if len(history) >= 90: return self.reply(429, {'error': 'Try again shortly'})
        history.append(now)
        try:
            data = {}
            if self.command != 'GET':
                size = int(self.headers.get('Content-Length', '0'))
                if not 0 < size <= MAX_BODY: return self.reply(413, {'error': 'Invalid body size'})
                data = json.loads(body, parse_constant=lambda _: (_ for _ in ()).throw(ValueError('Invalid number')))
                if not isinstance(data, dict): raise ValueError('Invalid request')
            if path == '/api/auth' and self.command == 'POST':
                try: user = validate_init_data(data.get('initData'), self.server.bot_token)
                except (ValueError, TypeError, KeyError): return self.reply(401, {'error': 'Telegram authentication failed'})
                return self.reply(200, {'user': user, 'token': self.server.store.login(user['id'])})
            header = self.headers.get('Authorization', '')
            token = header[7:] if header.startswith('Bearer ') else ''
            uid = self.server.store.user(token) if token else None
            if not uid: return self.reply(401, {'error': 'Authentication required'})
            if path == '/api/save' and self.command == 'GET': return self.reply(200, self.server.store.read(uid))
            if path == '/api/save' and self.command == 'PUT':
                revision = self.server.store.write(uid, data.get('revision'), data.get('save'))
                return self.reply(409, {'error': 'A newer account save exists'}) if revision is None else self.reply(200, {'revision': revision})
            if path == '/api/logout' and self.command == 'POST':
                self.server.store.logout(token); return self.reply(200, {'ok': True})
            self.reply(404, {'error': 'Unknown endpoint'})
        except (ValueError, TypeError, OverflowError): self.reply(400, {'error': 'Invalid request'})
        except sqlite3.Error: self.reply(503, {'error': 'Storage temporarily unavailable'})
    def do_GET(self):
        if urlsplit(self.path).path.startswith('/api/'): return self.api()
        path = unquote(urlsplit(self.path).path)
        parts = Path(path.lstrip('/')).parts
        resolved = (ROOT / path.lstrip('/')).resolve()
        if not resolved.is_relative_to(ROOT) or any(p.startswith('.') or p in ('server','tests') for p in parts) or resolved.suffix.lower() in ('.py','.sqlite3','.db','.md'):
            return self.send_error(404)
        if resolved.is_dir() and not (resolved/'index.html').is_file(): return self.send_error(404)
        self.fresh_code = 'vendor' not in parts and (resolved.is_dir() or resolved.suffix.lower() in ('.html','.js','.mjs','.css'))
        if self.fresh_code and 'If-Modified-Since' in self.headers:
            del self.headers['If-Modified-Since']
        return super().do_GET()
    def do_HEAD(self):
        # Static HEAD shares the same allowlist; no private source exposure.
        self.send_error(405)
    def do_POST(self): return self.api()
    def do_PUT(self): return self.api()

def make_server(port=18856, host='127.0.0.1', db_path=None, bot_token=None, origin=None):
    path = Path(db_path) if db_path else ROOT/'.work/server/accounts.sqlite3'
    path.parent.mkdir(parents=True, exist_ok=True)
    server = ThreadingHTTPServer((host, port), Handler)
    server.store = Store(path); server.bot_token = bot_token if bot_token is not None else os.environ.get('TELEGRAM_BOT_TOKEN', '')
    server.origin = origin if origin is not None else os.environ.get('EGOR_PUBLIC_ORIGIN', '').rstrip('/')
    if server.origin and not (server.origin.startswith('https://') or server.origin.startswith(('http://localhost:', 'http://127.0.0.1:'))):
        raise ValueError('EGOR_PUBLIC_ORIGIN must use HTTPS outside localhost')
    server.rates = defaultdict(deque)
    return server

if __name__ == '__main__':
    server = make_server(int(os.environ.get('PORT', '18856')))
    print(f'EGORVERSE on http://localhost:{server.server_port}/play/ — Telegram configured: {bool(server.bot_token and server.origin)}', flush=True)
    server.serve_forever()
