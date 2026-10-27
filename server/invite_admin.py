"""Owner-only CLI: create/reissue a password setup link and send one branded email."""
import argparse
from . import app
from .mail import deliver

def invite(email):
 if not app.SECURE:raise ValueError('Zaproszenia produkcyjne wymagają HTTPS w MB_ORIGIN.')
 app.initialize();email=email.strip().lower();token=app.create_setup(email)
 try:message_id=deliver(email,app.ORIGIN+'/panel/ustaw-haslo.html#token='+token)
 except Exception:
  with app.connect() as c:c.execute('UPDATE password_setups SET used=1 WHERE token_hash=?',(app.setup_digest(token),))
  raise RuntimeError('Wysyłka nie powiodła się; link został unieważniony.') from None
 return message_id
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--email',required=True);args=parser.parse_args()
 message_id=invite(args.email);print('Zaproszenie przekazane do serwera poczty. Message-ID:',message_id)
