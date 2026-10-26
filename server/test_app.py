import unittest, tempfile, threading, json, secrets, urllib.request, urllib.error, http.cookiejar
from pathlib import Path
import app
class PanelTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.temp=tempfile.TemporaryDirectory();app.DB=Path(cls.temp.name)/'test.sqlite3';app.initialize();cls.password=secrets.token_urlsafe(24);salt=secrets.token_hex(16)
  with app.connect() as c:c.execute('INSERT INTO admins VALUES (?,?,?)',('test@example.com',salt,app.password_hash(cls.password,salt)))
  cls.server=app.ThreadingHTTPServer(('127.0.0.1',0),app.Handler);cls.origin='http://127.0.0.1:'+str(cls.server.server_port);app.ORIGIN=cls.origin
  threading.Thread(target=cls.server.serve_forever,daemon=True).start()
 @classmethod
 def tearDownClass(cls):cls.server.shutdown();cls.server.server_close();cls.temp.cleanup()
 def setUp(self):self.client=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
 def request(self,path,data=None,method='GET',csrf='',origin=None):
  req=urllib.request.Request(self.origin+path,data=json.dumps(data).encode() if data is not None else None,method=method,headers={'Content-Type':'application/json','Origin':origin or self.origin,'X-CSRF-Token':csrf})
  try:
   with self.client.open(req) as r:return r.status,json.load(r),r.headers
  except urllib.error.HTTPError as r:return r.code,json.load(r),r.headers
 def login(self):
  code,result,headers=self.request('/api/login',{'email':'test@example.com','password':self.password},'POST');self.assertEqual(code,200);self.assertIn('HttpOnly',headers['Set-Cookie']);return result['csrf']
 def test_auth_and_origin(self):
  self.assertEqual(self.request('/api/session')[0],401)
  self.assertEqual(self.request('/api/login',{'email':'test@example.com','password':'wrong'},'POST')[0],401)
  self.assertEqual(self.request('/api/login',{'email':'test@example.com','password':self.password},'POST',origin='https://evil.example')[0],403)
  self.assertEqual(self.request('/api/login',[],'POST')[0],400)
 def test_edit_persistence_history_and_conflict(self):
  token=self.login();o=self.request('/api/offers')[1]['offers'][0];edit={'price':759000,'status':'reserved','version':o['version']}
  self.assertEqual(self.request('/api/offers/'+o['id'],edit,'PATCH')[0],401)
  code,result,_=self.request('/api/offers/'+o['id'],edit,'PATCH',token);self.assertEqual(code,200);self.assertEqual(result['offer']['status'],'reserved');self.assertEqual(result['offer']['history'][-1]['oldPrice'],749000)
  self.assertEqual(self.request('/api/offers/'+o['id'],edit,'PATCH',token)[0],409)
  self.assertEqual(next(v for v in app.offers() if v['id']==o['id'])['price'],759000)
  self.assertEqual(self.request('/api/offers/'+o['id'],dict(edit,price=-1),'PATCH',token)[0],400)
  self.assertEqual(self.request('/api/logout',{},'POST',token)[0],200);self.assertEqual(self.request('/api/session')[0],401)
 def test_public_and_static_boundaries(self):
  code,result,_=self.request('/data/offers.json');self.assertEqual(code,200);self.assertEqual(len(result['offers']),5);self.assertNotIn('hash',str(result));self.assertEqual(self.request('/api/offers/not-real',{},'PATCH')[0],401)
if __name__=='__main__':unittest.main()
