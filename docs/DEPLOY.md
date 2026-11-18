# Deployment

Overlab runs as one stack on a single server (any VPS with Docker): a Caddy edge that serves the React build and proxies `/api`, the Spring Boot backend, PostgreSQL, Redis, Prometheus and Grafana. Only Caddy is published (ports 80 and 443); everything else lives on an internal Docker network.

## What you need

- A server with Docker and the Compose plugin, ports 80 and 443 open
- A domain with an `A` record pointing to the server (for example `overlabgg.com`), plus a `www` record to the same address: Caddy redirects `www` to the main address
- An SMTP account for verification and password reset emails
- Optional: Google OAuth credentials (redirect URI `https://<domain>/login/oauth2/code/google`)

## First deploy

```bash
git clone https://github.com/AntonBas/overlab.git && cd overlab
touch .env.prod
```

Fill in `.env.prod` (copy the variable names from `.env.example`; the "Production only" block at its end lists the ones used only on the server, and empty optional values fall back to defaults): `SITE_ADDRESS`, `FRONTEND_URL`, `DB_PASSWORD`, `REDIS_PASSWORD`, `JWT_SECRET` (at least 32 random characters, for example `openssl rand -hex 32`), the `MAIL_*` values, `EMAIL_FROM`, `CONTACT_EMAIL` (shown on the legal pages and the address that receives messages from the Business page; optional until the mailbox exists), and `GRAFANA_ADMIN_PASSWORD`. Optional error tracking: `SENTRY_DSN` (backend) and `SENTRY_DSN_FRONTEND` (baked into the frontend build, so rebuild the `edge` image after changing it); both are empty by default and disable Sentry. In the browser Sentry starts only after the visitor allows analytics in the cookie banner and is closed again when the choice is withdrawn. In the Sentry project enable "Prevent Storing of IP Addresses" (Settings, Security & Privacy) and set the data retention you want; the privacy policy promises that no IP address is stored. The absolute `og:url`, `og:image` and JSON-LD addresses in `index.html` are filled at build time from `FRONTEND_URL` (the `VITE_SITE_URL` build argument of the `edge` image); change `FRONTEND_URL` and rebuild the `edge` image to move the site. `CONTROLLER_NAME` and `CONTROLLER_ADDRESS` (baked into the frontend build too) are printed in the privacy policy as the data controller; set them to real values before going public, the values in `.env.example` are placeholders. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` for the first start to create the admin account, then clear them. On an empty database you can also set `COLLECTOR_STARTUP_JOB=daily-overview` for the first start so statistics appear at once instead of at the next 04:00 run (the chained map jobs follow and take about 15 minutes); clear it afterwards, because the job runs on every start. New heroes get their portraits downloaded automatically (`COLLECTOR_DOWNLOAD_PORTRAITS` is on by default in production).

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

Caddy obtains and renews the HTTPS certificate automatically. Caddy also sends HSTS and a strict Content-Security-Policy (`docker/caddy/Caddyfile`, `style-src 'self'` without `'unsafe-inline'`: styles come only from the built CSS files, never from `<style>` tags or `style="..."` attributes in markup; React `style` props are applied through the DOM and stay allowed; uploaded SVG files are served with their own sandboxing policy): when you add analytics, ads or other third-party scripts, allow their hosts there. Redis is capped at 128 MB with LRU eviction, since it only holds cache. The backend container is capped at 1.5 GB (`mem_limit` in `docker-compose.prod.yml`) so the JVM cannot starve PostgreSQL on a small server. The backend refuses to start without `JWT_SECRET`, the database settings and `FRONTEND_URL`.

## Updating

```bash
git pull
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

Flyway applies new migrations on startup.

### Automatic deploy from GitHub

`.github/workflows/deploy.yml` runs the same update over SSH whenever the CI workflow succeeds on `main`, when a tag like `v1.0.0` is pushed, or by hand from the Actions tab (choose a tag or branch). In every case the workflow resolves the ref to one commit and deploys exactly that commit only if both the CI and the Security workflows have a successful run for it (it waits up to 20 minutes for each; a red or missing run deploys nothing). On the server the script waits up to 20 minutes for a running collector job, writes a `pg_dump` to `BACKUP_PATH` as `overlab-predeploy-<time>-<commit>.sql.gz` (an empty or broken dump stops the deploy), builds the images with `APP_VERSION` set to the commit, and waits until the management endpoint `/actuator/info` reports that commit and readiness is `UP`. If that does not happen within 5 minutes, it checks the previous commit out and rebuilds it. Migrations are not reverted by a rollback: if the schema changed, restore the pre-deploy dump (see Restore below). The backend container has a 45 second stop grace period, so a running request, audit write and queued email can finish before a restart (an unfinished collector run is marked failed at the next start). The script also restarts Grafana when files under `docker/grafana/` changed. Nothing runs until these are set in the repository settings (Settings, Secrets and variables, Actions), under the `production` environment:

- Secrets: `DEPLOY_HOST`, `DEPLOY_USER` (`deploy`, see below), `DEPLOY_SSH_KEY` (a private key made only for deploys) and `DEPLOY_KNOWN_HOSTS` (the output of `ssh-keyscan <host>`)
- Variable: `DEPLOY_URL`, for example `https://overlabgg.com`; after the update the workflow waits until `/sitemap.xml` answers

The server needs the repository cloned in `/opt/overlab` and a filled `.env.prod`.

#### Restricted deploy user

The deploy key can only run one script, never a shell. On the server, as `root`, copy `docker/deploy/overlab-deploy` and `docker/deploy/overlab-deploy-entry` to `/usr/local/bin/` (owner `root`, mode `755`), then:

```bash
adduser --disabled-password --gecos "" deploy
```

```bash
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
```

```bash
printf 'restrict,command="/usr/local/bin/overlab-deploy-entry" %s\n' "<the public deploy key>" > /home/deploy/.ssh/authorized_keys
```

```bash
chown deploy:deploy /home/deploy/.ssh/authorized_keys && chmod 600 /home/deploy/.ssh/authorized_keys
```

```bash
printf 'deploy ALL=(root) NOPASSWD: /usr/local/bin/overlab-deploy\n' > /etc/sudoers.d/overlab-deploy && chmod 440 /etc/sudoers.d/overlab-deploy && visudo -cf /etc/sudoers.d/overlab-deploy
```

The workflow calls `ssh deploy@host "<ref> <sha>"`. The entry script validates the two values and runs `overlab-deploy` through `sudo`; `overlab-deploy` is owned by `root`, so the `deploy` user cannot change it, and it is not in the `docker` group.

## Monitoring

Every service in `docker-compose.prod.yml` has a memory limit, a CPU limit and a process limit, and the edge, backend, Postgres, Redis, Prometheus and Grafana containers have health checks (`docker compose -f docker-compose.prod.yml ps`). Prometheus keeps 15 days or 2 GB of data, whichever is reached first. When the backend is down the edge answers `503` with `Retry-After: 30` (JSON for `/api`, `/media` and `/sitemap.xml`, the app shell for hero, map and guide pages) instead of an empty `502`.

Grafana listens on `127.0.0.1:3000` only. Reach it through an SSH tunnel: `ssh -L 3000:localhost:3000 user@server`. The backend metrics endpoint is served on an internal management port (9091) that is not published. The production profile refuses to start when `FRONTEND_URL` is not an `https://` address (plain `http://localhost` is allowed for the local Docker stack). Prometheus also scrapes `node-exporter` (disk usage of the server) in the production stack. The API publishes a request-time histogram (`http_server_requests_seconds_bucket`), `cache_fallback_total` (Redis cache failures) and `audit_write_failed_total` for the alert rules.

## Alert notifications

The alert rules are provisioned from `docker/grafana/provisioning/alerting/`: `collector-rules.yml` (the collector has stopped or never succeeded, Blizzard responses were rejected, a new hero or map appeared, a hero changed role) and `platform-rules.yml` (backend not answering, more than 5% of responses are 5xx, slow API, database pool exhausted, Redis cache unavailable, audit writes failing, emails that could not be sent, less than 15% free disk). The stale-collector and backend-down rules also fire when their metrics disappear. The contact point (Telegram and email) and the notification policy are provisioned too, so a clean deploy needs no clicks in Grafana. Set these in `.env.prod`; the stack does not start without them:

- `TELEGRAM_BOT_TOKEN`: in Telegram open `@BotFather`, send `/newbot` and copy the token
- `TELEGRAM_CHAT_ID`: send any message to the new bot (or add it to a group), open `https://api.telegram.org/bot<token>/getUpdates` and copy `chat.id` (group ids are negative)
- `ALERT_EMAIL_TO`: one or more addresses separated by `;`. Grafana sends them through the same SMTP settings as the backend (`MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `EMAIL_FROM`)

After the first start, check delivery once: in Grafana (SSH tunnel, see Monitoring) open Alerting, Contact points, `overlab-alerts` and press Test for both channels. Add this check to every deploy checklist. The local `docker-compose.yml` uses placeholder values, so alerts there are shown in Grafana but not delivered.

## Content in migrations

Migration `V27__hero_audit_fixes.sql` carries editorial fixes (hero texts and curated counters and synergies) keyed by hero slug. On an empty database it changes nothing, because the heroes do not exist until the collector's first run, so the curated content of a production database is not recreated by the migrations: it is restored only from a backup (see Backups). Never edit an applied migration; put new content changes in a new migration or make them in the admin panel.

## Backups

The `backup` service writes a compressed `pg_dump` to `BACKUP_PATH` every `BACKUP_INTERVAL_SECONDS` (default daily) and removes dumps older than `BACKUP_KEEP_DAYS` (default 14). Create the directories before the first start (`mkdir -p backups docker/backup/rclone`, or your `BACKUP_PATH`), otherwise Docker creates them owned by root. A dump is only written once the schema is migrated (the service waits up to 10 minutes after a fresh start), a dump smaller than 1 KB is rejected, and next to each dump a `.counts` file records the row counts of the key tables (`heroes`, `maps`, `hero_stats`, `guides`, `users`, applied migrations) from just before and just after the dump. Deploys also leave `overlab-predeploy-*.sql.gz` dumps there.

The files in `BACKUP_PATH` live on the same server, so for a real backup set an off-site [restic](https://restic.net) repository (all values come from `.env.prod`, nothing is stored in git):

- `RESTIC_REPOSITORY`: for example `s3:https://s3.example.com/bucket/overlab`, `b2:bucket:overlab`, `sftp:user@host:/path` or `rclone:remote:path` (put an `rclone.conf` into `docker/backup/rclone/`, git-ignored, or point `RCLONE_CONFIG_DIR` elsewhere)
- `RESTIC_PASSWORD`: encrypts everything; keep a copy of it outside the server, without it the backups cannot be read
- `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` (or the variables your restic backend needs)
- `RESTIC_KEEP_DAILY`, `RESTIC_KEEP_WEEKLY`, `RESTIC_KEEP_MONTHLY`: retention (default 7, 4 and 6)

With a repository configured, every cycle uploads the dump (tag `database`) and the media files (tag `media`, only changed files are sent), then applies the retention and prunes. Without a repository the media files are archived into `BACKUP_PATH` as `overlab-media-*.tar.gz` instead. The Grafana volume holds only dashboards you change by hand: contact points, alert rules and policies are provisioned from git.

Every `BACKUP_VERIFY_INTERVAL_DAYS` (default 7) the service restores the newest dump into a throwaway database on the same PostgreSQL server (`overlab_restore_check`, dropped afterwards), requires that it loads without errors and compares the restored row counts with the `.counts` file. The service exposes `backup_last_success_timestamp_seconds{kind="database|media|offsite|restore_check"}` on port 9100 (internal only); Grafana alerts when the dump or the off-site copy is older than 36 hours, when the restore check is older than 10 days and when the service is down. The container is also marked unhealthy when no new dump (or no off-site copy) appeared within two backup intervals (`docker compose -f docker-compose.prod.yml ps`).

Restore the database into an empty database (local dump):

```bash
gunzip -c backups/overlab-<timestamp>.sql.gz | docker compose -f docker-compose.prod.yml --env-file .env.prod exec -T postgres psql -U overlab -d overlab
```

Restore from the restic repository (database and media). Run these with the same `RESTIC_*` variables exported:

```bash
restic snapshots
restic dump latest --tag database overlab.sql.gz | gunzip | docker compose -f docker-compose.prod.yml --env-file .env.prod exec -T postgres psql -U overlab -d overlab
docker run --rm -v overlab_media:/media -e RESTIC_REPOSITORY -e RESTIC_PASSWORD -e AWS_ACCESS_KEY_ID -e AWS_SECRET_ACCESS_KEY restic/restic restore latest --tag media --target / --include /media
```

(`overlab_media` is the Compose project volume name, check `docker volume ls`.) To run the restore check by hand from the host, use `docker/backup/verify-restore.sh backups`: it restores the newest dump into a throwaway PostgreSQL container and compares the counts.

## Before going public

- Add a privacy policy, a cookie notice (required once ads or analytics are used) and the disclaimer that this is an unofficial fan site not affiliated with Blizzard Entertainment.
- Do not enable ads or donations before the question of using Blizzard's materials commercially is settled.

Grafana alerts live on the same server as the site, so they cannot report that the whole server is down: set up an external monitor as described in [docs/UPTIME_MONITORING.md](UPTIME_MONITORING.md).
