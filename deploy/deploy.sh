#!/usr/bin/env bash
# deploy.sh — pull main, install, migrate, build, restart.
# Usage: ssh paddledraw 'bash /opt/claveria/deploy/deploy.sh'
set -euo pipefail

APP_DIR="/opt/claveria"
cd "$APP_DIR"

echo "=== Pulling latest code ==="
git fetch origin main
git reset --hard origin/main
chmod +x deploy/*.sh

if ! cmp -s deploy/claveria-web.service /etc/systemd/system/claveria-web.service; then
  echo "=== Updating systemd unit ==="
  cp deploy/claveria-web.service /etc/systemd/system/claveria-web.service
  systemctl daemon-reload
fi

echo "=== Installing dependencies ==="
npm ci --prefer-offline

echo "=== Running database migrations ==="
NODE_ENV=production npm run migrate

echo "=== Type checking (before build, so a type error never wipes the live .next) ==="
npm run typecheck

echo "=== Building ==="
NODE_ENV=production npm run build
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static

echo "=== Restarting ==="
systemctl restart claveria-web

echo "=== Health check ==="
for attempt in $(seq 1 20); do
  if systemctl is-active --quiet claveria-web && curl -fsS -o /dev/null http://127.0.0.1:3001/; then
    echo "=== health check ok (attempt ${attempt}) ==="
    exit 0
  fi
  sleep 2
done

echo "=== claveria-web FAILED health check after 20 attempts ==="
journalctl -u claveria-web --no-pager -n 30
exit 1
