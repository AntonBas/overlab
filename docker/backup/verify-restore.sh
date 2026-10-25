#!/bin/sh
set -eu

BACKUP_DIR="${1:-./backups}"
LATEST="$(ls -1t "${BACKUP_DIR}"/overlab-*.sql.gz 2>/dev/null | head -n 1 || true)"
if [ -z "${LATEST}" ]; then
    echo "No backup found in ${BACKUP_DIR}" >&2
    exit 1
fi

CONTAINER="overlab-restore-check-$$"
trap 'docker rm -f "${CONTAINER}" >/dev/null 2>&1 || true' EXIT

docker run -d --name "${CONTAINER}" -e POSTGRES_USER=overlab -e POSTGRES_PASSWORD=restorecheck -e POSTGRES_DB=restorecheck \
    postgres:16-alpine >/dev/null

until docker exec "${CONTAINER}" pg_isready -U overlab -d restorecheck >/dev/null 2>&1; do
    sleep 1
done

gunzip -c "${LATEST}" | docker exec -i "${CONTAINER}" psql -U overlab -d restorecheck -v ON_ERROR_STOP=0 -q >/dev/null 2>&1 || true

MIGRATIONS="$(docker exec "${CONTAINER}" psql -U overlab -d restorecheck -tA \
    -c 'SELECT count(*) FROM flyway_schema_history WHERE success')"
HEROES="$(docker exec "${CONTAINER}" psql -U overlab -d restorecheck -tA -c 'SELECT count(*) FROM heroes')"

if [ "${MIGRATIONS}" -lt 1 ] || [ "${HEROES}" -lt 1 ]; then
    echo "Restore check failed for ${LATEST}: migrations=${MIGRATIONS}, heroes=${HEROES}" >&2
    exit 1
fi
echo "Restore check passed for ${LATEST}: migrations=${MIGRATIONS}, heroes=${HEROES}"
