#!/usr/bin/env bash
# Entry point for the dedicated GitHub key. No interactive shell or port forwarding.
set -euo pipefail
umask 077
MB_STATE=/home/sentra/.appdata/mario-bud
exec 9>"$MB_STATE/deploy.lock"
flock -w 120 9
cat > "$MB_STATE/incoming.tar.gz.part"
mv "$MB_STATE/incoming.tar.gz.part" "$MB_STATE/incoming.tar.gz"
bash "$MB_STATE/publish.sh"
