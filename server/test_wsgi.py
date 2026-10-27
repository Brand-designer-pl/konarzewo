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
  self.assertEqual(auth['status'],200);cookie=auth['headers']['Set-Cookie'];self.assertIn('Secure',cookie);self.assertIn('HttpOnly',cookie);self.assertIn('Max-Age=7776000',cookie)
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
 def test_invitation_single_use_and_scoped_session_revocation(self):
  from unittest.mock import patch
  email='antoni@brand-designer.pl';token=self.app.create_setup(email)
  with self.app.connect() as c:
   self.assertNotIn(token,str(c.execute('SELECT * FROM password_setups').fetchall()))
  headers={'HTTP_ORIGIN':self.app.ORIGIN}
  self.assertEqual(self.call('/setup-password/check','POST',{'token':token},headers)['status'],200)
  self.assertEqual(self.call('/setup-password/check','POST',{'token':token},headers)['status'],200)
  self.assertEqual(self.call('/login','POST',{'email':email,'password':''},headers)['status'],401)
  payload={'token':token,'password':'new-antoni-password-123','confirmation':'different-password-123'}
  self.assertEqual(self.call('/setup-password','POST',payload,headers)['status'],400)
  payload['confirmation']=payload['password']
  self.assertEqual(self.call('/setup-password','POST',payload,{'HTTP_ORIGIN':'https://evil.example'})['status'],403)
  with patch('server.mail.send_confirmation') as notify:
   self.assertEqual(self.call('/setup-password','POST',payload,headers)['status'],200)
   self.assertEqual(self.call('/setup-password','POST',payload,headers)['status'],410)
   notify.assert_called_once_with(email)
  login=self.call('/login','POST',{'email':email,'password':payload['password']},headers)
  self.assertEqual(login['status'],200);self.assertEqual(login['body']['user']['email'],email)
  old_cookie={'HTTP_COOKIE':login['headers']['Set-Cookie'].split(';')[0]}
  owner=self.call('/login','POST',{'email':'mario.orwat@gmail.com','password':'test-password-1234'},headers)
  owner_cookie={'HTTP_COOKIE':owner['headers']['Set-Cookie'].split(';')[0]}
  token2=self.app.create_setup(email)
  payload.update(token=token2,password='replacement-password-123',confirmation='replacement-password-123')
  with patch('server.mail.send_confirmation'):
   self.assertEqual(self.call('/setup-password','POST',payload,headers)['status'],200)
  self.assertEqual(self.call('/session',headers=old_cookie)['status'],401)
  self.assertEqual(self.call('/session',headers=owner_cookie)['status'],200)
 def test_expired_reissued_and_invalid_links(self):
  token=self.app.create_setup('antoni@brand-designer.pl');new=self.app.create_setup('antoni@brand-designer.pl');headers={'HTTP_ORIGIN':self.app.ORIGIN}
  for value in [token,'invalid',None,[],{}]:
   self.assertEqual(self.call('/setup-password/check','POST',{'token':value},headers)['status'],410)
  with self.app.connect() as c:c.execute('UPDATE password_setups SET expires=0 WHERE token_hash=?',(self.app.setup_digest(new),))
  self.assertEqual(self.call('/setup-password/check','POST',{'token':new},headers)['status'],410)
  self.assertEqual(self.call('/setup-password','POST',{'token':new,'password':'short','confirmation':'short'},headers)['status'],410)
 def test_legacy_sessions_migration_preserves_data(self):
  with self.app.connect() as c:
   c.execute('DROP TABLE sessions');c.execute('CREATE TABLE sessions(token TEXT PRIMARY KEY,csrf TEXT NOT NULL,expires INTEGER NOT NULL)')
   c.execute('INSERT INTO sessions VALUES (?,?,?)',('legacy','csrf',9999999999))
  self.app.initialize()
  with self.app.connect() as c:
   row=c.execute('SELECT * FROM sessions WHERE token=?',('legacy',)).fetchone()
   self.assertEqual(row['csrf'],'csrf');self.assertEqual(row['email'],'mario.orwat@gmail.com')
 def test_branded_mail_is_multipart_and_does_not_send_during_test(self):
  from unittest.mock import patch
  from email import message_from_bytes
  from server import mail
  with patch('server.mail.subprocess.run') as transport:
   mail.deliver('antoni@brand-designer.pl','https://mario-bud.com.pl/panel/ustaw-haslo.html#token=test')
  message=message_from_bytes(transport.call_args.kwargs['input'])
  self.assertEqual(message['To'],'antoni@brand-designer.pl')
  parts=list(message.walk());self.assertTrue(any(p.get_content_type()=='text/plain' for p in parts));self.assertTrue(any(p.get_content_type()=='text/html' for p in parts));self.assertTrue(any(p.get_content_type()=='image/png' for p in parts))
  html=next(p for p in parts if p.get_content_type()=='text/html').get_payload(decode=True).decode()
  self.assertIn('#c83732',html);self.assertIn('cid:mario-logo',html);self.assertIn('24 godziny',html)
if __name__=='__main__':unittest.main()
