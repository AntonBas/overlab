# Overlab

Unofficial fan site with Overwatch 2 hero statistics: win rate, pick rate and ban rate per hero, per map, per rank, region and platform, with history kept as snapshots. Planned extras: perks, hero descriptions, curated counter-picks and synergies, video guides. Not affiliated with Blizzard Entertainment.

## Stack

- Backend: Spring Boot (Java 21, Gradle), PostgreSQL 16, Redis 7
- Frontend: React + TypeScript (Vite)
- Monitoring: Prometheus + Grafana

## Structure

```
backend/    Spring Boot API and statistics collector
frontend/   React SPA
docker/     Prometheus and Grafana configuration
```

## Running locally

1. Infrastructure:

```bash
cp .env.example .env
```

Fill in `DB_PASSWORD` and `GRAFANA_ADMIN_PASSWORD` in `.env`, then:

```bash
docker compose up -d
```

2. Backend (the `local` profile is the default):

```bash
cd backend && ./gradlew bootRun
```

3. Frontend:

```bash
cd frontend && npm ci && npm run dev
```

## URLs

- Frontend: http://localhost:5173
- API: http://localhost:8080/api
- Health: http://localhost:8080/actuator/health
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000

## API

All endpoints are public `GET` requests.

| Endpoint | Description |
|---|---|
| `/api/heroes`, `/api/heroes/{slug}` | Heroes |
| `/api/maps`, `/api/maps/{slug}` | Maps |
| `/api/stats` | Statistics table. Parameters: `queue`, `tier`, `map`, `platform`, `region`, `role`, `sort`, `direction`. For a map it also returns deltas against the all-maps numbers |
| `/api/stats/hero/{slug}` | Statistics of one hero across all maps |

Quick Play has no ranks (`tier` is ignored) and no ban rate. Errors use one JSON shape (`ApiError`).

## Statistics collector

The backend collects statistics from Blizzard's public hero statistics page on a schedule and stores a snapshot per filter combination. Jobs are defined in `backend/src/main/resources/collector.yaml`:

- `daily-overview`: all ranks for Competitive and the overview for Quick Play, all maps combined
- `weekly-maps`: every map, rank `ALL`

To run one job on startup:

```bash
COLLECTOR_STARTUP_JOB=daily-overview ./gradlew bootRun
```

Responses are cached in Redis and the caches are cleared after every collector run.

## Profiles

- `local` (default): defaults for localhost, SQL logging, health details, Prometheus endpoint
- `prod` (`SPRING_PROFILES_ACTIVE=prod`): no defaults for database and Redis, no error or health details

## Checks

```bash
cd backend && ./gradlew build
cd frontend && npm run lint && npm run build
```

## Branches and CI

- `main`: production
- `develop`: development
- GitHub Actions runs the backend and frontend checks on every push and pull request. Dependabot opens weekly update pull requests; minor and patch updates are merged automatically after CI passes, major updates are merged manually.
