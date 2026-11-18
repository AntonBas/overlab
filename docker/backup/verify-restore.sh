#!/bin/sh
set -eu

BACKUP_DIR="${1:-./backups}"
LATEST="$(ls -1t "${BACKUP_DIR}"/overlab-[0-9]*.sql.gz 2>/dev/null | head -n 1 || true)"
if [ -z "${LATEST}" ]; then
    echo "No backup found in ${BACKUP_DIR}" >&2
    exit 1
fi
COUNTS="${LATEST}.counts"
KEY_TABLES="heroes maps hero_stats guides users"

if ! gzip -t "${LATEST}"; then
    echo "Restore check failed for ${LATEST}: the archive is damaged" >&2
    exit 1
fi

if [ -n "${VERIFY_DB_HOST:-}" ]; then
    CHECK_DB="overlab_restore_check"
    psql_check() {
        psql -h "${VERIFY_DB_HOST}" -U "${VERIFY_DB_USER}" -d "${CHECK_DB}" -v ON_ERROR_STOP=1 "$@"
    }
    psql -h "${VERIFY_DB_HOST}" -U "${VERIFY_DB_USER}" -d postgres -v ON_ERROR_STOP=1 -q \
        -c "DROP DATABASE IF EXISTS ${CHECK_DB}" -c "CREATE DATABASE ${CHECK_DB}"
    cleanup() {
        psql -h "${VERIFY_DB_HOST}" -U "${VERIFY_DB_USER}" -d postgres -q -c "DROP DATABASE IF EXISTS ${CHECK_DB}" >/dev/null 2>&1 || true
    }
else
    CONTAINER="overlab-restore-check-$$"
    cleanup() {
        docker rm -f "${CONTAINER}" >/dev/null 2>&1 || true
    }
    docker run -d --name "${CONTAINER}" -e POSTGRES_USER=overlab -e POSTGRES_PASSWORD=restorecheck -e POSTGRES_DB=restorecheck \
        postgres:16-alpine >/dev/null
    until docker exec "${CONTAINER}" pg_isready -h 127.0.0.1 -U overlab -d restorecheck >/dev/null 2>&1; do
        sleep 1
    done
    psql_check() {
        docker exec -i "${CONTAINER}" psql -U overlab -d restorecheck -v ON_ERROR_STOP=1 "$@"
    }
fi
trap cleanup EXIT

if ! gunzip -c "${LATEST}" | psql_check -q -o /dev/null; then
    echo "Restore check failed for ${LATEST}: the dump did not load without errors" >&2
    exit 1
fi

MIGRATIONS="$(psql_check -tA -c 'SELECT count(*) FROM flyway_schema_history WHERE success' 2>/dev/null || echo 0)"
if [ "${MIGRATIONS}" -lt 1 ]; then
    echo "Restore check failed for ${LATEST}: no applied migrations" >&2
    exit 1
fi

if [ ! -f "${COUNTS}" ]; then
    echo "Restore check passed for ${LATEST}: migrations=${MIGRATIONS} (no row counts to compare)"
    exit 0
fi

while read -r table before after; do
    case " ${KEY_TABLES} flyway_schema_history " in
        *" ${table} "*) ;;
        *) continue ;;
    esac
    if [ "${table}" = "flyway_schema_history" ]; then
        restored="${MIGRATIONS}"
    else
        restored="$(psql_check -tA -c "SELECT count(*) FROM ${table}")"
    fi
    if [ "${restored}" -lt "${before}" ] || [ "${restored}" -gt "${after}" ]; then
        echo "Restore check failed for ${LATEST}: ${table} has ${restored} rows, expected ${before} to ${after}" >&2
        exit 1
    fi
done < "${COUNTS}"
echo "Restore check passed for ${LATEST}: migrations=${MIGRATIONS}, row counts match"
