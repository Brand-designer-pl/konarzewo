#!/usr/bin/env bash
# Reusable publishing from the checked-out repository. Never copies the live database.
set -euo pipefail
cd "$(dirname "$0")/.."
MB_DEPLOY_HOST="${MB_DEPLOY_HOST:-sentra@s189.cyber-folks.pl}"
MB_DEPLOY_KEY="${MB_DEPLOY_KEY:-$HOME/.ssh/moonside_github_deploy}"
MB_BUNDLE=$(mktemp /tmp/mario-bud-release.XXXXXX.tar.gz)
trap 'rm -f "$MB_BUNDLE"' EXIT
python3 deploy/package.py "$MB_BUNDLE"
scp -i "$MB_DEPLOY_KEY" -P 222 -o IdentitiesOnly=yes -o BatchMode=yes "$MB_BUNDLE" "$MB_DEPLOY_HOST:.appdata/mario-bud/incoming.tar.gz"
ssh -i "$MB_DEPLOY_KEY" -p 222 -o IdentitiesOnly=yes -o BatchMode=yes "$MB_DEPLOY_HOST" 'bash /home/sentra/.appdata/mario-bud/publish.sh'
