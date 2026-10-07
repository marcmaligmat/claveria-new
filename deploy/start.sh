#!/usr/bin/env bash
set -euo pipefail
cd /opt/claveria
exec node .next/standalone/server.js
