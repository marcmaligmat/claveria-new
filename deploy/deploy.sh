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

echo "=== Building ==="
NODE_ENV=production npm run build
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static

echo "=== Restarting ==="
systemctl restart claveria-web
sleep 3
if systemctl is-active --quiet claveria-web; then
  echo "=== claveria-web running ==="
  curl -fsS -o /dev/null http://127.0.0.1:3001/ && echo "=== health check ok ==="
else
  echo "=== claveria-web FAILED ==="
  journalctl -u claveria-web --no-pager -n 30
  exit 1
fi
