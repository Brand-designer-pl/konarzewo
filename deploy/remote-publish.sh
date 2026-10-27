#!/usr/bin/env bash
set -euo pipefail
MB_STATE=/home/sentra/.appdata/mario-bud
MB_PUBLIC=/home/sentra/domains/mario-bud.com.pl/public_html
MB_APP=/home/sentra/apps/mario-bud
MB_RELEASE="$MB_STATE/releases/$(date -u +%Y%m%dT%H%M%SZ)-$$"
mkdir -p "$MB_RELEASE" "$MB_STATE/backups"
tar -xzf "$MB_STATE/incoming.tar.gz" -C "$MB_RELEASE"
# Snapshot only this site's public and application files. Database backups use SQLite's API.
tar -czf "$MB_STATE/backups/$(basename "$MB_RELEASE").tar.gz" -C "$MB_PUBLIC" . -C "$MB_APP" .
rsync -r "$MB_RELEASE/application/" "$MB_APP/"
(cd "$MB_APP" && MB_ORIGIN=https://mario-bud.com.pl MB_DB="$MB_STATE/offers.sqlite3" /home/sentra/virtualenv/apps/mario-bud/3.12/bin/python -c 'from server import app; app.initialize()')
# No --delete: Passenger's managed api/.htaccess and challenge files must survive.
rsync -r --perms --chmod=D755,F644 "$MB_RELEASE/public/" "$MB_PUBLIC/"
chmod 700 "$MB_STATE"
(cd "$MB_APP" && MB_DB="$MB_STATE/offers.sqlite3" /home/sentra/virtualenv/apps/mario-bud/3.12/bin/python - "$MB_STATE/backups/$(basename "$MB_RELEASE").sqlite3" <<'PY'
import os,sqlite3,sys
with sqlite3.connect(os.environ['MB_DB']) as source,sqlite3.connect(sys.argv[1]) as target:source.backup(target)
os.chmod(sys.argv[1],0o600)
PY
)
/usr/sbin/cloudlinux-selector restart --json --interpreter python --user sentra --app-root apps/mario-bud
printf 'Mario-Bud: published successfully\n'
