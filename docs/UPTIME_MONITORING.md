# External uptime monitoring

Grafana alerts run on the same server as the site. When the server, its network or Caddy itself is down, Grafana and Prometheus are down with it, and nothing tells you. An external monitor closes that gap. This page lists the options and what to check; nothing here is configured by the repository, you set it up once by hand.

## What to monitor

| Check | URL | Expect | Why |
|---|---|---|---|
| Site and edge | `https://<site>/` | `200`, body contains `Overlab` | Caddy, TLS and the app shell |
| API and database | `https://<site>/api/heroes` | `200`, body contains `"slug"` | Backend, PostgreSQL and Redis fallback (a stale cache can still answer, so this alone does not prove the database is up) |
| Crawler entry | `https://<site>/sitemap.xml` | `200`, body contains `<urlset` | Backend sitemap and what search engines read |
| Certificate | the HTTPS check above | warn 14 days before expiry | Caddy renews automatically, an expiring certificate means renewal is broken |

Do not point a monitor at `/actuator/**`: the management port is not published outside the Docker network. A check every 1 to 5 minutes is enough: each URL then gets 288 to 1440 requests a day, far below the per-address API limit (600 per minute). Alert after 2 failed checks in a row to avoid noise from a single timeout, and send alerts to a channel other than the one Grafana uses (Telegram and email there), so one broken channel does not hide both.

## Options

| Option | Type | Good for | Notes |
|---|---|---|---|
| [UptimeRobot](https://uptimerobot.com) | hosted | the quickest start: HTTP and keyword checks, certificate expiry, email and Telegram alerts | The free plan has a coarse check interval; check the current limits before relying on it |
| [Better Stack](https://betterstack.com/uptime) | hosted | checks from several regions, on-call schedules, a public status page | Paid features start with faster intervals and phone calls |
| [Healthchecks.io](https://healthchecks.io) | hosted, push | "dead man's switch" for jobs: the job pings a URL, silence raises the alert | Fits the backup scripts (a ping after each successful dump) more than the website itself |
| [Uptime Kuma](https://github.com/louislam/uptime-kuma) | self-hosted | full control, many check types, free | Must run on a different machine or provider than the site, otherwise it fails together with it |
| Grafana Cloud synthetic monitoring | hosted | you already use Grafana and want the same alert rules and dashboards | Uses a Grafana Cloud account; probes run from Grafana's locations, not from your server |

A reasonable minimum is UptimeRobot or Better Stack for the three URLs above, plus Healthchecks.io pings from the backup job if you want to know about a silent backup failure from outside the server (the in-server `backup-*` Grafana alerts only fire while Grafana is alive).

## After setting it up

1. Stop the backend for a minute on a test day and confirm the monitor alerts and then recovers.
2. Record in your own notes which account owns the monitor and who receives the alerts; the monitor itself is not part of this repository.
3. Keep the checks in sync with the site: when the domain changes, update every URL.
