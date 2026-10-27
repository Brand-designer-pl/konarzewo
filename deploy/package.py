"""Build a portable public bundle without credentials or mutable offer data."""
import tarfile,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def build(output):
 with tempfile.TemporaryDirectory() as folder:
  staging=Path(folder)
  for source in (ROOT/'docs').rglob('*'):
   if not source.is_file() or source.name=='.DS_Store':continue
   relative=source.relative_to(ROOT/'docs')
   target=staging/'public'/relative;target.parent.mkdir(parents=True,exist_ok=True)
   data=source.read_bytes()
   if source.suffix in ('.html','.xml','.txt','.json'):
    data=data.replace(b'https://brand-designer-pl.github.io/konarzewo',b'https://mario-bud.com.pl')
   target.write_bytes(data)
  (staging/'public/offers-config.js').write_text("window.MB_OFFERS_URL = '/api/offers';\n")
  (staging/'public/.htaccess').write_text('''Options -Indexes
DirectoryIndex index.html
RewriteEngine On
RewriteCond %{REQUEST_URI} !^/[.]well-known/acme-challenge/
RewriteCond %{HTTPS} !=on [OR]
RewriteCond %{HTTP_HOST} !^mario-bud[.]com[.]pl$ [NC]
RewriteRule ^ https://mario-bud.com.pl%{REQUEST_URI} [R=301,L]
RewriteRule ^data/offers\\.json$ /api/offers [L]
<IfModule mod_headers.c>
 Header always set X-Content-Type-Options nosniff
 Header always set Referrer-Policy strict-origin-when-cross-origin
 <FilesMatch "\\.(html|js|css|json)$">
  Header set Cache-Control "no-cache"
 </FilesMatch>
 <FilesMatch "\\.(webp|jpg|jpeg|png|svg|mp4|woff2)$">
  Header set Cache-Control "public, max-age=604800"
 </FilesMatch>
</IfModule>
''')
  (staging/'public/panel/.htaccess').write_text("""<IfModule mod_headers.c>
 Header always set Cache-Control "no-store"
 Header always set X-Frame-Options "DENY"
 Header always set Content-Security-Policy "default-src 'self'; img-src 'self' data:; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
</IfModule>
""")
  # The seed lives outside the web root in production; the public URL is rewritten to the API.
  (staging/'public/data/offers.json').unlink()
  for relative in ['server/app.py','server/wsgi.py','docs/data/offers.json']:
   target=staging/'application'/relative;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes((ROOT/relative).read_bytes())
  (staging/'application/wsgi.py').write_text('from server.wsgi import application\n')
  with tarfile.open(output,'w:gz') as archive:
   archive.add(staging/'public',arcname='public');archive.add(staging/'application',arcname='application')
if __name__=='__main__':
 import sys
 build(sys.argv[1]);print('Pakiet gotowy:',sys.argv[1])
