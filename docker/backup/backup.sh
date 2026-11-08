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

backup_media() {
    if [ ! -d /media ] || [ -z "$(ls -A /media 2>/dev/null)" ]; then
        return 0
    fi
    MEDIA_FILE="${BACKUP_DIR}/overlab-media-${STAMP}.tar.gz"
    if tar -czf "${MEDIA_FILE}.tmp" -C /media .; then
        mv "${MEDIA_FILE}.tmp" "${MEDIA_FILE}"
        echo "Media backup written: ${MEDIA_FILE}"
        copy_offsite "${MEDIA_FILE}"
    else
        rm -f "${MEDIA_FILE}.tmp"
        echo "Media backup failed at ${STAMP}" >&2
    fi
}

while true; do
    STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
    FILE="${BACKUP_DIR}/overlab-${STAMP}.sql.gz"
    RAW="${FILE}.raw"
    if pg_dump -h "${DB_HOST}" -U "${DB_USER}" -d "${DB_NAME}" > "${RAW}" \
        && [ -s "${RAW}" ] \
        && gzip -c "${RAW}" > "${FILE}.tmp" \
        && gzip -t "${FILE}.tmp"; then
        rm -f "${RAW}"
        mv "${FILE}.tmp" "${FILE}"
        echo "Backup written: ${FILE}"
        copy_offsite "${FILE}"
    else
        rm -f "${RAW}" "${FILE}.tmp"
        echo "Backup failed at ${STAMP}" >&2
    fi
    backup_media
    find "${BACKUP_DIR}" \( -name 'overlab-*.sql.gz' -o -name 'overlab-media-*.tar.gz' \) -mtime "+${KEEP_DAYS}" -delete
    if [ "${BACKUP_RUN_ONCE:-}" = "1" ]; then
        exit 0
    fi
    sleep "${INTERVAL_SECONDS}"
done
