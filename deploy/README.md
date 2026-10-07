# Deploying claveriamisor.gov.ph

One-time server setup (run as root on the droplet that hosts paddledraw):

1. Create the database and role in the existing Postgres:
   ```sql
   CREATE ROLE claveria WITH LOGIN PASSWORD '<strong-password>';
   CREATE DATABASE claveria OWNER claveria;
   ```
2. Clone the repo and create the env file:
   ```bash
   git clone git@github.com:marcmaligmat/claveria-new.git /opt/claveria
   mkdir -p /var/www/claveria/media
   cat > /opt/claveria/.env <<'ENV'
   DATABASE_URI=postgresql://claveria:<strong-password>@127.0.0.1:5432/claveria
   PAYLOAD_SECRET=<openssl rand -hex 32>
   MEDIA_DIR=/var/www/claveria/media
   NEXT_PUBLIC_SITE_URL=https://claveriamisor.gov.ph
   PORT=3001
   ENV
   ```
3. Install the unit and start it:
   ```bash
   cp /opt/claveria/deploy/claveria-web.service /etc/systemd/system/
   systemctl daemon-reload && systemctl enable claveria-web
   bash /opt/claveria/deploy/deploy.sh
   ```
4. Merge `deploy/Caddyfile.snippet` into `/etc/caddy/Caddyfile` and `systemctl reload caddy`. Caddy obtains the TLS certificate automatically once DNS for `claveriamisor.gov.ph` points at the droplet.
5. Open `https://claveriamisor.gov.ph/admin` and create the first admin user.
6. In the GitHub repo add the secrets `SERVER_HOST` and `SERVER_SSH_KEY` (same values paddledraw uses). Every push to `main` then runs `deploy/deploy.sh`.

Routine deploys: push to `main`, or run `ssh paddledraw 'bash /opt/claveria/deploy/deploy.sh'`.

Schema changes: run `npm run migrate:create -- <name>` locally, commit the file in `src/migrations/`, and the deploy script applies it with `npm run migrate` before building.
