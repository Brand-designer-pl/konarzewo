"""Exercise production Passenger mounting, cookies, price persistence and guards."""
import importlib,io,json,os,tempfile,unittest
from pathlib import Path
class WSGITests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();os.environ['MB_DB']=str(Path(self.tmp.name)/'offers.sqlite3');os.environ['MB_ORIGIN']='https://mario-bud.com.pl'
  from server import app
  self.app=importlib.reload(app)
  from server import wsgi
  self.wsgi=importlib.reload(wsgi)
  salt='11'*16
  with self.app.connect() as c:c.execute('INSERT INTO admins VALUES (?,?,?)',('mario.orwat@gmail.com',salt,self.app.password_hash('test-password-1234',salt)))
 def tearDown(self):
  self.tmp.cleanup();os.environ.pop('MB_DB',None);os.environ.pop('MB_ORIGIN',None)
 def call(self,path,method='GET',data=None,headers=None,mount='/api'):
  body=json.dumps(data).encode() if data is not None else b''
  env={'REQUEST_METHOD':method,'SCRIPT_NAME':mount,'PATH_INFO':path,'REMOTE_ADDR':'127.0.0.1','wsgi.input':io.BytesIO(body),'CONTENT_TYPE':'application/json','CONTENT_LENGTH':str(len(body))}
  env.update(headers or {});out={}
  def start(status,headers):out.update(status=int(status.split()[0]),headers=dict(headers))
  out['body']=json.loads(b''.join(self.wsgi.application(env,start)));return out
 def test_mounted_auth_save_and_restart(self):
  out=self.call('/offers');self.assertEqual(out['status'],200);self.assertEqual(len(out['body']['offers']),5)
  self.assertEqual(self.call('/session')['status'],401)
  auth=self.call('/login','POST',{'email':'mario.orwat@gmail.com','password':'test-password-1234','remember':True},{'HTTP_ORIGIN':self.app.ORIGIN})
  self.assertEqual(auth['status'],200);cookie=auth['headers']['Set-Cookie'];self.assertIn('Secure',cookie);self.assertIn('HttpOnly',cookie);self.assertIn('Max-Age=2592000',cookie)
  headers={'HTTP_ORIGIN':self.app.ORIGIN,'HTTP_COOKIE':cookie.split(';')[0],'HTTP_X_CSRF_TOKEN':auth['body']['csrf']}
  offer=next(o for o in out['body']['offers'] if o['id']=='a1')
  changed=self.call('/offers/a1','PATCH',{'price':750000,'status':'reserved','version':offer['version']},headers)
  self.assertEqual(changed['status'],200);self.assertEqual(len(changed['body']['offer']['history']),1)
  self.app.initialize();self.assertEqual(next(o for o in self.call('/offers')['body']['offers'] if o['id']=='a1')['status'],'reserved')
  self.assertEqual(self.call('/logout','POST',{},headers)['status'],200);self.assertEqual(self.call('/session',headers=headers)['status'],401)
 def test_origin_csrf_and_path_guards(self):
  self.assertEqual(self.call('/login','POST',{}, {'HTTP_ORIGIN':'https://evil.example'})['status'],403)
  self.assertEqual(self.call('/offers/a1','PATCH',{}, {'HTTP_ORIGIN':self.app.ORIGIN})['status'],401)
  self.assertEqual(self.call('/offers','DELETE')['status'],405)
  self.assertEqual(self.call('/server/data/offers.sqlite3',mount='')['status'],404)
if __name__=='__main__':unittest.main()
