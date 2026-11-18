FROM node:22.23.4-alpine@sha256:0e1754758c2df4cfa3e68d59e2e1b7374bb7fd9ea6328eaaacf15cc934af8202 AS frontend
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
COPY backend/src/main/resources/seo/ /backend/src/main/resources/seo/
ARG VITE_SITE_URL=
ENV VITE_SITE_URL=$VITE_SITE_URL
ARG VITE_CONTACT_EMAIL=
ENV VITE_CONTACT_EMAIL=$VITE_CONTACT_EMAIL
ARG VITE_CONTROLLER_NAME=
ENV VITE_CONTROLLER_NAME=$VITE_CONTROLLER_NAME
ARG VITE_CONTROLLER_ADDRESS=
ENV VITE_CONTROLLER_ADDRESS=$VITE_CONTROLLER_ADDRESS
ARG VITE_SENTRY_DSN=
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN
RUN npm run build

FROM caddy:2-alpine@sha256:003a97808e781aa9f7e75cc2f43d34d461099031faf5e20faefb9f61126836f0
COPY docker/caddy/Caddyfile /etc/caddy/Caddyfile
COPY --from=frontend /app/dist /srv
