FROM node:22.23.4-alpine AS frontend
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
ARG VITE_CONTACT_EMAIL=
ENV VITE_CONTACT_EMAIL=$VITE_CONTACT_EMAIL
ARG VITE_SENTRY_DSN=
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN
RUN npm run build

FROM caddy:2-alpine
COPY docker/caddy/Caddyfile /etc/caddy/Caddyfile
COPY --from=frontend /app/dist /srv
