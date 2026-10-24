# Overlab

Неофіційний фан-сайт зі статистикою Overwatch 2: win rate, pick rate і ban rate героїв по мапах, рангах, регіонах і платформах. Не пов'язаний з Blizzard Entertainment.

## Стек

- Backend: Spring Boot (Java 21, Gradle), PostgreSQL 16, Redis 7
- Frontend: React + TypeScript (Vite)
- Моніторинг: Prometheus + Grafana

## Структура

```
backend/    Spring Boot API
frontend/   React SPA
docker/     конфіги Prometheus і Grafana
```

## Запуск локально

1. Інфраструктура:

```bash
cp .env.example .env
```

Заповніть `DB_PASSWORD` і `GRAFANA_ADMIN_PASSWORD` у `.env`, потім:

```bash
docker compose up -d
```

2. Бекенд (профіль `local` за замовчуванням):

```bash
cd backend && ./gradlew bootRun
```

3. Фронтенд:

```bash
cd frontend && npm ci && npm run dev
```

## Адреси

- Фронтенд: http://localhost:5173
- Health: http://localhost:8080/actuator/health
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000

## Перевірки

```bash
cd backend && ./gradlew build
cd frontend && npm run lint && npm run build
```

## Гілки

- `main`: production
- `develop`: розробка
