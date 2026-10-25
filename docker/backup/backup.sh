#!/bin/sh
set -eu

BACKUP_DIR=/backups
KEEP_DAYS="${BACKUP_KEEP_DAYS:-14}"
INTERVAL_SECONDS="${BACKUP_INTERVAL_SECONDS:-86400}"

while true; do
    STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
    FILE="${BACKUP_DIR}/overlab-${STAMP}.sql.gz"
    if pg_dump -h "${DB_HOST}" -U "${DB_USER}" -d "${DB_NAME}" | gzip > "${FILE}.tmp"; then
        mv "${FILE}.tmp" "${FILE}"
        echo "Backup written: ${FILE}"
    else
        rm -f "${FILE}.tmp"
        echo "Backup failed at ${STAMP}" >&2
    fi
    find "${BACKUP_DIR}" -name 'overlab-*.sql.gz' -mtime "+${KEEP_DAYS}" -delete
    sleep "${INTERVAL_SECONDS}"
done
