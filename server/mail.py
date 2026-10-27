"""Branded transactional email. Credentials/tokens are never logged or stored in source."""
from email.message import EmailMessage
from email.utils import formatdate,make_msgid
from html import escape
from pathlib import Path
import subprocess
from . import app
SENDER='powiadomienia@mario-bud.com.pl'

def html_message(email,url,confirmation=False):
 title='Hasło zostało ustawione' if confirmation else 'Twój panel.<br>Twoje możliwości.'
 lead='Możesz już logować się do panelu Mario-Bud i zarządzać ofertami.' if confirmation else 'Twoje konto administratora Mario-Bud jest gotowe. Ustaw własne hasło, aby zarządzać cenami i dostępnością lokali.'
 label='Przejdź do panelu' if confirmation else 'Ustaw hasło'
 note='Jeśli nie ustawiałeś hasła, skontaktuj się z administratorem panelu.' if confirmation else 'Link jest jednorazowy i ważny przez 24 godziny. Nie przekazuj go innym osobom.'
 return f'''<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mario-Bud — {label}</title></head>
<body style="margin:0;padding:0;background:#f2f2f2;color:#191919;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f2f2f2"><tr><td align="center" style="padding:36px 16px"><table role="presentation" width="560" cellspacing="0" cellpadding="0" style="width:100%;max-width:560px;background:#fff;border:1px solid #e5e5e5;border-top:3px solid #c83732;border-radius:24px"><tr><td style="padding:36px 32px 24px"><img src="cid:mario-logo" alt="Mario-Bud" width="160" height="76" style="display:block;width:160px;height:76px;border:0"><p style="margin:28px 0 14px;font-size:10px;font-weight:700;letter-spacing:2px;color:#777">PANEL ADMINISTRATORA</p><h1 style="font-size:34px;line-height:1.15;letter-spacing:-1.3px;margin:0 0 22px;font-weight:600">{title}</h1><p style="font-size:15px;line-height:1.7;color:#666;margin:0 0 24px">{lead}</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f5f5;border-radius:14px"><tr><td style="padding:15px 18px"><span style="font-size:11px;color:#777">Twój adres logowania</span><br><strong style="font-size:14px;font-weight:500;color:#222;word-break:break-all">{escape(email)}</strong></td></tr></table><table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px 0"><tr><td style="border-radius:28px;background:#191919"><a href="{escape(url,quote=True)}" style="display:inline-block;color:#fff;background:#191919;text-decoration:none;padding:16px 25px;border-radius:28px;font-size:14px;font-weight:500">{label}&nbsp; →</a></td></tr></table><p style="font-size:12px;line-height:1.65;color:#777;margin:0 0 22px">{note}</p><p style="font-size:11px;line-height:1.65;color:#777;margin:0;padding-top:20px;border-top:1px solid #e9e9e9">Jeśli przycisk nie działa, otwórz poniższy adres:<br><a href="{escape(url,quote=True)}" style="color:#444;word-break:break-all">{escape(url)}</a></p></td></tr><tr><td style="padding:20px 32px;border-top:1px solid #eee;font-size:11px;line-height:1.65;color:#888">Mario-Bud · Mariusz Orwat<br><a href="https://mario-bud.com.pl/" style="color:#666;text-decoration:none">mario-bud.com.pl</a> · tel. 888 610 648<br>Wiadomość systemowa dotycząca Twojego konta.</td></tr></table></td></tr></table></body></html>'''

def deliver(email,url,confirmation=False):
 message=EmailMessage();message['From']='Mario-Bud <'+SENDER+'>';message['To']=email;message['Reply-To']='mario.orwat@gmail.com'
 message['Subject']='Mario-Bud — hasło zostało ustawione' if confirmation else 'Mario-Bud — ustaw hasło do panelu administratora'
 message['Date']=formatdate(localtime=False);message['Message-ID']=make_msgid(domain='mario-bud.com.pl')
 note='Hasło zostało ustawione. Zaloguj się w panelu.' if confirmation else 'Twoje konto administratora jest gotowe. Link do ustawienia hasła jest jednorazowy i ważny przez 24 godziny.'
 message.set_content(f'{note}\n\nAdres logowania: {email}\n{url}\n\nMario-Bud\nMariusz Orwat, tel. 888 610 648\n')
 message.add_alternative(html_message(email,url,confirmation),subtype='html')
 logo=(app.ROOT/'docs/assets/mario-bud-email-logo.png').read_bytes()
 message.get_payload()[1].add_related(logo,maintype='image',subtype='png',cid='<mario-logo>',filename='mario-bud.png',disposition='inline')
 subprocess.run(['/usr/sbin/sendmail','-i','-t','-f',SENDER],input=message.as_bytes(),stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=True,timeout=30)
 return message['Message-ID']
def send_confirmation(email):return deliver(email,app.ORIGIN+'/panel/',True)
