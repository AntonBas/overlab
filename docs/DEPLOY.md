# Deployment

Overlab runs as one stack on a single server (any VPS with Docker): a Caddy edge that serves the React build and proxies `/api`, the Spring Boot backend, PostgreSQL, Redis, Prometheus and Grafana. Only Caddy is published (ports 80 and 443); everything else lives on an internal Docker network.

## What you need

- A server with Docker and the Compose plugin, ports 80 and 443 open
- A domain with an `A` record pointing to the server (for example `overlab.gg`)
- An SMTP account for verification and password reset emails
- Optional: Google OAuth credentials (redirect URI `https://<domain>/login/oauth2/code/google`)

## First deploy

```bash
git clone https://github.com/AntonBas/overlab.git && cd overlab
cp .env.prod.example .env.prod
```

Fill in `.env.prod`: `SITE_ADDRESS`, `FRONTEND_URL`, `DB_PASSWORD`, `JWT_SECRET` (at least 32 random characters, for example `openssl rand -hex 32`), the `MAIL_*` values, `EMAIL_FROM`, and `GRAFANA_ADMIN_PASSWORD`. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` for the first start to create the admin account, then clear them.

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

Caddy obtains and renews the HTTPS certificate automatically. The backend refuses to start without `JWT_SECRET`, the database settings and `FRONTEND_URL`.

## Updating

```bash
git pull
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

Flyway applies new migrations on startup.

## Monitoring

Grafana listens on `127.0.0.1:3000` only. Reach it through an SSH tunnel: `ssh -L 3000:localhost:3000 user@server`. The backend metrics endpoint is served on an internal management port (9091) that is not published.

## Backups

The `backup` service writes a compressed `pg_dump` to `BACKUP_PATH` every `BACKUP_INTERVAL_SECONDS` (default daily) and removes files older than `BACKUP_KEEP_DAYS` (default 14). These files live on the same server, so the service can also copy every new backup off the machine with `rclone`: put an `rclone.conf` with your remote (S3, Backblaze B2, SFTP and others, see `rclone config`) into `docker/backup/rclone/` (git-ignored, or point `RCLONE_CONFIG_DIR` elsewhere) and set `BACKUP_REMOTE` to `remote:bucket/path`. Remote copies older than `BACKUP_REMOTE_KEEP_DAYS` (default 30) are deleted. A failed copy is logged and does not stop the local backups.

Restore into an empty database:

```bash
gunzip -c backups/overlab-<timestamp>.sql.gz | docker compose -f docker-compose.prod.yml --env-file .env.prod exec -T postgres psql -U overlab -d overlab
```

Test a restore before you rely on the backups: `docker/backup/verify-restore.sh backups` restores the newest dump into a throwaway PostgreSQL container and checks that the migrations and heroes are there. Run it from cron, for example weekly.

## Before going public

- Add a privacy policy, a cookie notice (required once ads or analytics are used) and the disclaimer that this is an unofficial fan site not affiliated with Blizzard Entertainment.
- Do not enable ads or donations before the question of using Blizzard's materials commercially is settled.
