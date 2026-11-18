# Load testing

`docker/k6/history.js` loads `GET /api/stats/hero/{slug}/history` with the `from` and `to` parameters the way the site sends them. It is the endpoint that was slow before range requests were cached: the controller rounds `from` down and `to` up to a whole hour, so requests inside the same hour share one cache entry.

## Run it

Install [k6](https://grafana.com/docs/k6/latest/set-up/install-k6/) and start the stack with statistics in the database (`docker compose up -d`, then let the collector run or use a database with data):

```bash
k6 run docker/k6/history.js
```

Settings are environment variables:

| Variable | Default | Meaning |
|---|---|---|
| `BASE_URL` | `http://localhost:5173` | Edge (Caddy) address; use `http://localhost:8080` to bypass Caddy when the backend runs on the host |
| `RATE` | `10` | Requests per second (constant arrival rate) |
| `DURATION` | `60s` | Length of the run |

```bash
k6 run -e RATE=15 -e DURATION=30s docker/k6/history.js
```

Every request picks a random hero from `/api/heroes`, a queue (competitive or quick play), a rank tier (all, gold, diamond), a range of 14, 30, 60 or 90 days, and an end time up to two hours back. Keep `RATE` below the per-address limit for `/api/stats` (`app.rate-limit.stats-per-minute`, 1200 per minute, about 20 requests per second); above it the API answers 429 and the run fails its checks. A run fails when more than 1% of requests fail, when a check fails or when the p95 of the history requests exceeds 500 ms.

## Reference results

Local Docker stack (Caddy, backend, PostgreSQL, Redis on one laptop), 2026-11-16, with whatever data the local database holds. Run it again on your own data before comparing.

| Rate | Duration | Requests | Failed | p95 | Median |
|---|---|---|---|---|---|
| 10 per second (cold cache, right after a backend restart) | 60 s | 602 | 0 | 28.2 ms | 15.8 ms |
| 15 per second (warm cache) | 30 s | 451 | 0 | 15.9 ms | 9.7 ms |

These numbers are not a production capacity estimate: the database is small and the client runs on the same machine. Use them to notice regressions, and run the scenario against a staging copy of the production data before changing the history query or its caching.
