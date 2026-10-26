#!/bin/sh
set -eu

BACKUP_DIR=/backups
KEEP_DAYS="${BACKUP_KEEP_DAYS:-14}"
INTERVAL_SECONDS="${BACKUP_INTERVAL_SECONDS:-86400}"
REMOTE="${BACKUP_REMOTE:-}"
REMOTE_KEEP_DAYS="${BACKUP_REMOTE_KEEP_DAYS:-30}"

copy_offsite() {
    if [ -z "${REMOTE}" ]; then
        return 0
    fi
    if rclone copy "$1" "${REMOTE}"; then
        echo "Backup copied to ${REMOTE}"
        rclone delete "${REMOTE}" --min-age "${REMOTE_KEEP_DAYS}d" || echo "Old remote backups were not cleaned" >&2
    else
        echo "Copy to ${REMOTE} failed" >&2
    fi
}

while true; do
    STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
    FILE="${BACKUP_DIR}/overlab-${STAMP}.sql.gz"
    if pg_dump -h "${DB_HOST}" -U "${DB_USER}" -d "${DB_NAME}" | gzip > "${FILE}.tmp"; then
        mv "${FILE}.tmp" "${FILE}"
        echo "Backup written: ${FILE}"
        copy_offsite "${FILE}"
    else
        rm -f "${FILE}.tmp"
        echo "Backup failed at ${STAMP}" >&2
    fi
    find "${BACKUP_DIR}" -name 'overlab-*.sql.gz' -mtime "+${KEEP_DAYS}" -delete
    if [ "${BACKUP_RUN_ONCE:-}" = "1" ]; then
        exit 0
    fi
    sleep "${INTERVAL_SECONDS}"
done
