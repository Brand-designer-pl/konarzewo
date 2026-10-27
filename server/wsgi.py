"""Passenger/WSGI adapter for the existing API; public files are served by Apache."""
import io
from email.message import Message
from http import HTTPStatus
from urllib.parse import quote
from . import app

class Request(app.Handler):
 def __init__(self, environ):
  self.command=environ.get('REQUEST_METHOD','GET').upper()
  self.path=quote(environ.get('SCRIPT_NAME','')+environ.get('PATH_INFO',''),safe='/')
  self.client_address=(environ.get('REMOTE_ADDR','unknown'),0)
  self.headers=Message()
  for key,value in environ.items():
   if key.startswith('HTTP_'):self.headers[key[5:].replace('_','-')]=value
  for key in ('CONTENT_TYPE','CONTENT_LENGTH'):
   if environ.get(key):self.headers[key.replace('_','-')]=environ[key]
  self.rfile=environ['wsgi.input'];self.wfile=io.BytesIO();self.status=200;self.response_headers=[]
 def send_response(self, code, message=None):self.status=code
 def send_header(self, name, value):self.response_headers.append((name,str(value)))
 def end_headers(self):
  self.send_header('X-Content-Type-Options','nosniff')
  self.send_header('Referrer-Policy','same-origin')
  self.send_header('X-Frame-Options','DENY')

app.initialize()
def application(environ,start_response):
 request=Request(environ)
 if not app.SECURE and app.urlsplit(app.ORIGIN).hostname not in ('localhost','127.0.0.1'):
  request.reply(503,{'error':'Nieprawidłowa konfiguracja HTTPS.'})
 elif request.path!='/api/offers' and not request.path.startswith('/api/'):
  request.reply(404,{'error':'Nie znaleziono.'})
 elif request.command not in ('GET','POST','PATCH'):
  request.reply(405,{'error':'Niedozwolona metoda.'})
 else:
  try:getattr(request,'do_'+request.command)()
  except (ValueError,TypeError):request.reply(400,{'error':'Nieprawidłowe dane.'})
 start_response(str(request.status)+' '+HTTPStatus(request.status).phrase,request.response_headers)
 return [request.wfile.getvalue()]
