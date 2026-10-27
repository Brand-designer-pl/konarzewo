"""Mario-Bud same-origin admin API. Python standard library; deploy behind HTTPS proxy."""
import argparse, hashlib, hmac, json, os, secrets, sqlite3, time, re
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from http.cookies import SimpleCookie
from pathlib import Path
from urllib.parse import urlsplit
ROOT=Path(__file__).resolve().parents[1]
DB=Path(os.environ.get('MB_DB',str(ROOT/'server/data/offers.sqlite3')))
ORIGIN=os.environ.get('MB_ORIGIN','http://localhost:8770').rstrip('/')
SECURE=urlsplit(ORIGIN).scheme=='https'
LABELS={'available':'Dostępny','reserved':'Zarezerwowany','sold':'Sprzedany'}
def connect():
 c=sqlite3.connect(DB,timeout=15);c.row_factory=sqlite3.Row;return c
def password_hash(password,salt):
 return hashlib.pbkdf2_hmac('sha256',password.encode(),bytes.fromhex(salt),600000).hex()
def initialize():
 DB.parent.mkdir(parents=True,exist_ok=True)
 with connect() as c:
  c.executescript('''CREATE TABLE IF NOT EXISTS admins(email TEXT PRIMARY KEY,salt TEXT NOT NULL,hash TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,csrf TEXT NOT NULL,expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS offers(id TEXT PRIMARY KEY,data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS attempts(ip TEXT,time INTEGER);
CREATE TABLE IF NOT EXISTS password_setups(token_hash TEXT PRIMARY KEY,email TEXT NOT NULL,expires INTEGER NOT NULL,used INTEGER NOT NULL DEFAULT 0);
''')
  c.execute('BEGIN IMMEDIATE')
  if 'email' not in [r[1] for r in c.execute('PRAGMA table_info(sessions)')]:
   c.execute('ALTER TABLE sessions ADD COLUMN email TEXT')
   owners=c.execute('SELECT email FROM admins').fetchall()
   if len(owners)==1:c.execute('UPDATE sessions SET email=? WHERE email IS NULL',(owners[0]['email'],))
   else:c.execute('DELETE FROM sessions WHERE email IS NULL')
  for o in json.loads((ROOT/'docs/data/offers.json').read_text())['offers']:
   c.execute('INSERT OR IGNORE INTO offers VALUES (?,?)',(o['id'],json.dumps(o)))
 os.chmod(DB,0o600)
def offers():
 with connect() as c:return [json.loads(r['data']) for r in c.execute('SELECT data FROM offers ORDER BY id')]
def user_info(email):
 name={'mario.orwat@gmail.com':'Mariusz Orwat','antoni@brand-designer.pl':'Antoni'}.get(email,email or 'Administrator')
 return {'email':email or '', 'name':name}
def setup_digest(token):
 if not isinstance(token,str) or not re.fullmatch(r'[A-Za-z0-9_-]{43}',token):raise ValueError('Nieprawidłowy link.')
 return hashlib.sha256(token.encode()).hexdigest()
def create_setup(email):
 email=email.strip().lower()
 if not re.fullmatch(r"[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9.-]+\.[a-z]{2,}",email) or len(email)>254:raise ValueError('Podaj pełny adres e-mail.')
 token=secrets.token_urlsafe(32);digest=setup_digest(token)
 with connect() as c:
  c.execute('BEGIN IMMEDIATE')
  c.execute('INSERT OR IGNORE INTO admins VALUES (?,?,?)',(email,secrets.token_hex(16),''))
  c.execute('UPDATE password_setups SET used=1 WHERE email=?',(email,))
  c.execute('INSERT INTO password_setups VALUES (?,?,?,0)',(digest,email,int(time.time())+86400))
 return token
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT/'docs'),**kwargs)
 def log_message(self,fmt,*args):pass
 def end_headers(self):
  self.send_header('X-Content-Type-Options','nosniff');self.send_header('Referrer-Policy','same-origin')
  if self.path.startswith(('/panel','/api/')):self.send_header('Cache-Control','no-store');self.send_header('X-Frame-Options','DENY')
  if self.path.startswith('/panel'):self.send_header('Content-Security-Policy',"default-src 'self'; img-src 'self' data:; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'")
  super().end_headers()
 def reply(self,status,data,cookie=None):
  body=json.dumps(data,ensure_ascii=False).encode();self.send_response(status);self.send_header('Content-Type','application/json; charset=utf-8');
  if urlsplit(self.path).path in ('/api/offers','/data/offers.json'):self.send_header('Access-Control-Allow-Origin','*')
  self.send_header('Cache-Control','no-store');self.send_header('Content-Length',str(len(body)))
  if cookie:self.send_header('Set-Cookie',cookie)
  self.end_headers();self.wfile.write(body)
 def body(self):
  size=int(self.headers.get('Content-Length','0'))
  if size<1 or size>16384 or self.headers.get('Content-Type','').split(';')[0]!='application/json':raise ValueError('Nieprawidłowe dane.')
  data=json.loads(self.rfile.read(size))
  if not isinstance(data,dict):raise ValueError('Nieprawidłowe dane.')
  return data
 def session(self):
  cookie=SimpleCookie()
  try:cookie.load(self.headers.get('Cookie',''));token=cookie['mb_session'].value
  except Exception:return None
  with connect() as c:return c.execute('SELECT * FROM sessions WHERE token=? AND expires>?',(hashlib.sha256(token.encode()).hexdigest(),time.time())).fetchone()
 def trusted(self):return self.headers.get('Origin')==ORIGIN
 def do_GET(self):
  path=urlsplit(self.path).path
  if path in ('/api/offers','/data/offers.json'):return self.reply(200,{'offers':offers()})
  if path=='/api/session':
   session=self.session()
   return self.reply(200,{'csrf':session['csrf'],'user':user_info(session['email'])}) if session else self.reply(401,{'error':'Zaloguj się.'})
  if path.startswith('/api/'):return self.reply(404,{'error':'Nie znaleziono.'})
  return super().do_GET()
 def do_POST(self):
  if not self.trusted():return self.reply(403,{'error':'Niedozwolone źródło żądania.'})
  try:data=self.body()
  except (ValueError,TypeError):return self.reply(400,{'error':'Nieprawidłowe dane.'})
  path=urlsplit(self.path).path
  if path in ('/api/setup-password/check','/api/setup-password'):
   try:digest=setup_digest(data.get('token'))
   except ValueError:return self.reply(410,{'error':'Link wygasł lub został już wykorzystany. Poproś administratora o nowy.'})
   password=data.get('password');confirmation=data.get('confirmation')
   if path=='/api/setup-password':
    if not isinstance(password,str) or not 14<=len(password)<=1024 or len(password.encode())>4096:return self.reply(400,{'error':'Hasło musi mieć od 14 do 1024 znaków.'})
    if password!=confirmation:return self.reply(400,{'error':'Wpisane hasła różnią się.'})
   with connect() as c:
    c.execute('BEGIN IMMEDIATE')
    setup=c.execute('SELECT * FROM password_setups WHERE token_hash=? AND used=0 AND expires>?',(digest,int(time.time()))).fetchone()
    if not setup:return self.reply(410,{'error':'Link wygasł lub został już wykorzystany. Poproś administratora o nowy.'})
    if path.endswith('/check'):return self.reply(200,{'email':setup['email']})
    salt=secrets.token_hex(16)
    c.execute('UPDATE admins SET salt=?,hash=? WHERE email=?',(salt,password_hash(password,salt),setup['email']))
    c.execute('UPDATE password_setups SET used=1 WHERE email=?',(setup['email'],))
    c.execute('DELETE FROM sessions WHERE email=?',(setup['email'],))
   if SECURE and os.path.isfile('/usr/sbin/sendmail'):
    try:
     from server.mail import send_confirmation
     send_confirmation(setup['email'])
    except Exception:
     import sys
     print('Password saved; confirmation email could not be sent.',file=sys.stderr)
   return self.reply(200,{'ok':True})
  if path=='/api/login':
   now=int(time.time());ip=self.client_address[0]
   with connect() as c:
    c.execute('DELETE FROM attempts WHERE time<?',(now-900,));count=c.execute('SELECT COUNT(*) FROM attempts WHERE ip=?',(ip,)).fetchone()[0]
    if count>=10:return self.reply(429,{'error':'Zbyt wiele prób. Spróbuj za 15 minut.'})
    c.execute('INSERT INTO attempts VALUES (?,?)',(ip,now));admin=c.execute('SELECT * FROM admins WHERE email=?',(str(data.get('email','')).lower().strip(),)).fetchone()
   password=str(data.get('password',''))
   digest=password_hash(password[:1024],admin['salt'] if admin else '00'*16)
   if not admin or not hmac.compare_digest(digest,admin['hash']):return self.reply(401,{'error':'Nieprawidłowy e-mail lub hasło.'})
   token=secrets.token_urlsafe(32);csrf=secrets.token_urlsafe(32);remember=data.get('remember') is True;lifetime=2592000 if remember else 28800
   with connect() as c:
    c.execute('DELETE FROM sessions WHERE expires<?',(now,));c.execute('INSERT INTO sessions(token,csrf,expires,email) VALUES (?,?,?,?)',(hashlib.sha256(token.encode()).hexdigest(),csrf,now+lifetime,admin['email']))
   return self.reply(200,{'csrf':csrf,'user':user_info(admin['email'])},'mb_session='+token+'; Path=/api; HttpOnly; SameSite=Strict'+('; Max-Age='+str(lifetime) if remember else '')+('; Secure' if SECURE else ''))
  if path=='/api/logout':
   session=self.session()
   if not session or not hmac.compare_digest(self.headers.get('X-CSRF-Token',''),session['csrf']):return self.reply(403,{'error':'Sesja wygasła.'})
   with connect() as c:c.execute('DELETE FROM sessions WHERE token=?',(session['token'],))
   return self.reply(200,{'ok':True},'mb_session=; Path=/api; HttpOnly; SameSite=Strict; Max-Age=0'+('; Secure' if SECURE else ''))
  return self.reply(404,{'error':'Nie znaleziono.'})
 def do_PATCH(self):
  if not self.trusted():return self.reply(403,{'error':'Niedozwolone źródło żądania.'})
  session=self.session()
  if not session or not hmac.compare_digest(self.headers.get('X-CSRF-Token',''),session['csrf']):return self.reply(401,{'error':'Zaloguj się ponownie.'})
  id=urlsplit(self.path).path.removeprefix('/api/offers/')
  try:
   data=self.body();price=data['price'];status=data['status'];version=data['version']
   if type(price) is not int or not 1<=price<=100000000 or status not in LABELS or type(version) is not int:raise ValueError()
  except (ValueError,KeyError,TypeError):return self.reply(400,{'error':'Podaj prawidłową cenę i status.'})
  with connect() as c:
   c.execute('BEGIN IMMEDIATE');row=c.execute('SELECT data FROM offers WHERE id=?',(id,)).fetchone()
   if not row:return self.reply(404,{'error':'Nie znaleziono lokalu.'})
   offer=json.loads(row['data'])
   if offer['version']!=version:return self.reply(409,{'error':'Oferta została zmieniona. Odśwież panel przed zapisem.'})
   if offer['price']!=price:offer['history'].append({'at':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'oldPrice':offer['price'],'price':price})
   offer.update(price=price,status=status,version=version+1);c.execute('UPDATE offers SET data=? WHERE id=?',(json.dumps(offer),id))
  return self.reply(200,{'offer':offer})
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--init-admin',action='store_true');parser.add_argument('--email',default='mario.orwat@gmail.com');parser.add_argument('--port',type=int,default=8770);parser.add_argument('--host',default='127.0.0.1');args=parser.parse_args();initialize()
 if args.init_admin:
  import getpass
  password=Path(os.environ['MB_PASSWORD_FILE']).read_text().strip() if os.environ.get('MB_PASSWORD_FILE') else getpass.getpass('Nowe hasło (min. 14 znaków): ')
  if len(password)<14:raise SystemExit('Hasło musi mieć co najmniej 14 znaków.')
  salt=secrets.token_hex(16)
  with connect() as c:c.execute('INSERT OR REPLACE INTO admins VALUES (?,?,?)',(args.email.lower(),salt,password_hash(password,salt)));c.execute('DELETE FROM sessions')
  print('Konto zapisane.');raise SystemExit()
 if not SECURE and urlsplit(ORIGIN).hostname not in ('localhost','127.0.0.1'):raise SystemExit('Hosting publiczny wymaga MB_ORIGIN z HTTPS.')
 print(f'Panel: {ORIGIN}/panel/',flush=True);ThreadingHTTPServer((args.host,args.port),Handler).serve_forever()
