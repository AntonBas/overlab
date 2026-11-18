# Incident runbook

Short procedures for the failures the alerts in `docker/grafana/provisioning/alerting/` report. Commands run on the server in `/opt/overlab` with `docker compose -f docker-compose.prod.yml --env-file .env.prod`.

## Backend not answering (alert: backend down, 5xx)

1. `docker compose ps` and `docker logs --tail 200 overlab-backend-1` (the container name depends on the project name).
2. While it is down the edge answers `503` with `Retry-After`; pages for heroes, maps and guides still load the app shell.
3. A bad release: the deploy script rolls back by itself when the new version does not become ready. If it did not, check out the previous commit, run `up -d --build` and compare `/actuator/info` on the management port. Migrations are not reverted: restore the `overlab-predeploy-*.sql.gz` dump from `BACKUP_PATH` if the schema changed.

## SLO burn alerts (alerts: availability fast and slow burn, latency)

The `overlab-slo` group in `platform-rules.yml` watches two objectives for `/api/**`: 99.5% of responses are not `5xx` and 95% of requests finish within 500 ms. Each alert needs a short and a long window to agree, so a single blip does not page.

| Alert | Fires when | Meaning |
|---|---|---|
| availability fast burn (critical) | more than 7.2% of responses are 5xx over 1 hour and over the last 5 minutes | the monthly error budget burns 14 times too fast, act now |
| availability slow burn (warning) | more than 3% are 5xx over 6 hours and over the last 30 minutes | a steady leak, find it within the day |
| latency (warning) | more than 10% of requests are slower than 500 ms over 1 hour and over the last 5 minutes | the second half of the latency objective is slipping |

Start as for "Backend not answering" and "Database unavailable": the logs of the backend show which endpoint fails or is slow, `hikaricp_connections_pending` and the Redis fallback counter show the usual causes. A cold cache right after a restart can trip the latency alert for a few minutes; it clears by itself. The latency alert reads the `le="0.5"` histogram bucket, which comes from `management.metrics.distribution.slo` in `application.yaml`; changing those bucket bounds breaks it.

## Database unavailable (alert: pool pending, 5xx)

1. `docker compose ps postgres` and `docker logs --tail 100` of the postgres container.
2. The API answers `503` after 3 seconds, readiness is `DOWN`, the backend stays up and recovers by itself when Postgres is back.
3. Disk full: see the disk alert below. Corrupted data: restore from a backup (below).

## Redis unavailable (alert: cache fallback)

The site keeps working from the database; Redis is skipped for 30 seconds after each failure. Restart the redis container; the cache refills itself.

## Collector stopped or never succeeded

Open the admin panel, Collector, read the last runs and their error summaries. A run interrupted by a restart keeps its counters. Start the job by hand from the same screen. If Blizzard changed its format the run is `FAILED` with rejected snapshots: see [docs/COLLECTOR.md](COLLECTOR.md).

## Backup alerts

- Dump older than 36 hours or the service down: `docker logs` of the backup container (schema not ready, disk full, `pg_dump` error).
- Off-site copy older than 36 hours: check `RESTIC_REPOSITORY`, the keys and `restic snapshots` with the same variables.
- Restore check older than 10 days: look for "Restore check failed" in the backup logs; the newest dump may be damaged, take one by hand and test it with `docker/backup/verify-restore.sh`.
- Restoring: see Backups in [docs/DEPLOY.md](DEPLOY.md).

## Disk almost full

`df -h`, `docker system df`; remove old images with `docker image prune -f`, old dumps in `BACKUP_PATH`, and check Prometheus (`--storage.tsdb.retention.size` is 2 GB).

## Suspected account or secret leak

Rotate `JWT_SECRET` (all sessions end), the database and Redis passwords, and the mail and Telegram credentials in `.env.prod`, then redeploy. Blocking a user or demoting an admin takes effect immediately.
