# Deploying claveriamisor.gov.ph

One-time server setup (run as root on the droplet that hosts paddledraw):

1. Create the database and role in the existing Postgres:
   ```sql
   CREATE ROLE claveria WITH LOGIN PASSWORD '<strong-password>';
   CREATE DATABASE claveria OWNER claveria;
   ```
2. Clone the repo and create the env file (`NODE_ENV=production` is required: without it Payload would push schema changes directly instead of relying on migrations):
   ```bash
   git clone git@github.com:marcmaligmat/claveria-new.git /opt/claveria
   mkdir -p /var/www/claveria/media
   cat > /opt/claveria/.env <<'ENV'
   DATABASE_URI=postgresql://claveria:<strong-password>@127.0.0.1:5432/claveria
   PAYLOAD_SECRET=<openssl rand -hex 32>
   MEDIA_DIR=/var/www/claveria/media
   NEXT_PUBLIC_SITE_URL=https://claveriamisor.gov.ph
   PORT=3001
   NODE_ENV=production
   ENV
   ```
   Optional: `EXTRA_ORIGINS=http://5.223.88.172` (comma-separated) lets the admin log in when the site is reached on an origin other than `NEXT_PUBLIC_SITE_URL`, e.g. by bare IP before DNS exists. Add a matching `http://<ip> { reverse_proxy 127.0.0.1:3001 }` block to the Caddyfile and remove both once DNS is live.
3. Install the unit and start it:
   ```bash
   cp /opt/claveria/deploy/claveria-web.service /etc/systemd/system/
   systemctl daemon-reload && systemctl enable claveria-web
   bash /opt/claveria/deploy/deploy.sh
   ```
4. **Create the first admin user BEFORE exposing the site.** Until an admin exists, `/admin/create-first-user` lets *anyone* who can reach the app create one, so the site must not be reachable from the internet until this step is done. From your machine, tunnel to the app (it listens on 127.0.0.1:3001 only):
   ```bash
   ssh -L 3001:127.0.0.1:3001 paddledraw
   ```
   then open `http://localhost:3001/admin/create-first-user` in your browser and create the admin account. Close the tunnel afterwards.
5. Only now merge `deploy/Caddyfile.snippet` into `/etc/caddy/Caddyfile` and `systemctl reload caddy`. Caddy obtains the TLS certificate automatically once DNS for `claveriamisor.gov.ph` points at the droplet.
6. In the GitHub repo add the secrets `SERVER_HOST` and `SERVER_SSH_KEY` (same values paddledraw uses). Every push to `main` then runs the checks (`.github/workflows/ci.yml`, job `check`) and, only if they pass, the `deploy` job runs `deploy/deploy.sh`.

Routine deploys: push to `main` (or trigger the workflow manually via *Run workflow*), or run `ssh paddledraw 'bash /opt/claveria/deploy/deploy.sh'`.

Schema changes: run `npm run migrate:create -- <name>` locally, commit the file in `src/migrations/`, and the deploy script applies it with `npm run migrate` before building.
