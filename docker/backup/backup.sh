#!/bin/sh
set -u

BACKUP_DIR=/backups
STATE_DIR="${BACKUP_DIR}/.state"
METRICS_DIR=/tmp/metrics
KEEP_DAYS="${BACKUP_KEEP_DAYS:-14}"
INTERVAL_SECONDS="${BACKUP_INTERVAL_SECONDS:-86400}"
VERIFY_INTERVAL_DAYS="${BACKUP_VERIFY_INTERVAL_DAYS:-7}"
KEEP_DAILY="${RESTIC_KEEP_DAILY:-7}"
KEEP_WEEKLY="${RESTIC_KEEP_WEEKLY:-4}"
KEEP_MONTHLY="${RESTIC_KEEP_MONTHLY:-6}"
SCHEMA_WAIT_SECONDS="${BACKUP_SCHEMA_WAIT_SECONDS:-600}"
MIN_DUMP_BYTES=1024
KEY_TABLES="heroes maps hero_stats guides users"

mkdir -p "${STATE_DIR}" "${METRICS_DIR}"

offsite_enabled() {
    [ -n "${RESTIC_REPOSITORY:-}" ]
}

state_value() {
    cat "${STATE_DIR}/$1" 2>/dev/null || echo 0
}

mark_success() {
    date +%s > "${STATE_DIR}/$1"
}

write_metrics() {
    {
        echo "# HELP backup_last_success_timestamp_seconds Unix time of the last successful backup step"
        echo "# TYPE backup_last_success_timestamp_seconds gauge"
        for kind in database media offsite restore_check; do
            echo "backup_last_success_timestamp_seconds{kind=\"${kind}\"} $(state_value "${kind}")"
        done
        echo "# HELP backup_offsite_configured 1 when the off-site restic repository is configured"
        echo "# TYPE backup_offsite_configured gauge"
        if offsite_enabled; then
            echo "backup_offsite_configured 1"
        else
            echo "backup_offsite_configured 0"
        fi
    } > "${METRICS_DIR}/metrics.prom.tmp"
    mv "${METRICS_DIR}/metrics.prom.tmp" "${METRICS_DIR}/metrics.prom"
}

psql_value() {
    psql -h "${DB_HOST}" -U "${DB_USER}" -d "${DB_NAME}" -tA -c "$1" 2>/dev/null
}

wait_for_schema() {
    waited=0
    while [ "${waited}" -lt "${SCHEMA_WAIT_SECONDS}" ]; do
        migrations="$(psql_value 'SELECT count(*) FROM flyway_schema_history WHERE success' || true)"
        if [ -n "${migrations}" ] && [ "${migrations}" -ge 1 ] 2>/dev/null; then
            return 0
        fi
        sleep 10
        waited=$((waited + 10))
    done
    return 1
}

table_counts() {
    for table in ${KEY_TABLES}; do
        echo "${table}=$(psql_value "SELECT count(*) FROM ${table}")"
    done
    echo "flyway_schema_history=$(psql_value 'SELECT count(*) FROM flyway_schema_history WHERE success')"
}

backup_database() {
    STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
    FILE="${BACKUP_DIR}/overlab-${STAMP}.sql.gz"
    RAW="${FILE}.raw"
    if ! wait_for_schema; then
        echo "The database schema is not ready, the backup is skipped at ${STAMP}" >&2
        return 1
    fi
    table_counts > "${FILE}.counts.before"
    if pg_dump -h "${DB_HOST}" -U "${DB_USER}" -d "${DB_NAME}" > "${RAW}" \
        && [ "$(wc -c < "${RAW}")" -ge "${MIN_DUMP_BYTES}" ] \
        && gzip -c "${RAW}" > "${FILE}.tmp" \
        && gzip -t "${FILE}.tmp"; then
        table_counts > "${FILE}.counts.after"
        paste -d' ' "${FILE}.counts.before" "${FILE}.counts.after" | sed 's/=/ /g' | awk '{print $1, $2, $4}' > "${FILE}.counts"
        rm -f "${RAW}" "${FILE}.counts.before" "${FILE}.counts.after"
        mv "${FILE}.tmp" "${FILE}"
        mark_success database
        echo "Backup written: ${FILE}"
        return 0
    fi
    rm -f "${RAW}" "${FILE}.tmp" "${FILE}.counts.before" "${FILE}.counts.after"
    echo "Backup failed at ${STAMP}" >&2
    return 1
}

backup_media_locally() {
    if [ ! -d /media ] || [ -z "$(ls -A /media 2>/dev/null)" ]; then
        mark_success media
        return 0
    fi
    MEDIA_FILE="${BACKUP_DIR}/overlab-media-${STAMP}.tar.gz"
    if tar -czf "${MEDIA_FILE}.tmp" -C /media .; then
        mv "${MEDIA_FILE}.tmp" "${MEDIA_FILE}"
        mark_success media
        echo "Media backup written: ${MEDIA_FILE}"
        return 0
    fi
    rm -f "${MEDIA_FILE}.tmp"
    echo "Media backup failed at ${STAMP}" >&2
    return 1
}

ensure_repository() {
    if restic cat config > /dev/null 2>&1; then
        return 0
    fi
    restic init
}

copy_offsite() {
    ensure_repository || return 1
    restic backup --tag database --stdin --stdin-filename overlab.sql.gz < "${FILE}" || return 1
    if [ -d /media ] && [ -n "$(ls -A /media 2>/dev/null)" ]; then
        restic backup --tag media /media || return 1
    fi
    mark_success media
    restic forget --prune --group-by host,tags --keep-daily "${KEEP_DAILY}" --keep-weekly "${KEEP_WEEKLY}" \
        --keep-monthly "${KEEP_MONTHLY}" || echo "Old off-site backups were not cleaned" >&2
    mark_success offsite
    echo "Backup copied to ${RESTIC_REPOSITORY}"
}

verify_is_due() {
    last="$(state_value restore_check)"
    [ $(( $(date +%s) - last )) -ge $(( VERIFY_INTERVAL_DAYS * 86400 )) ]
}

verify_latest_restore() {
    if VERIFY_DB_HOST="${DB_HOST}" VERIFY_DB_USER="${DB_USER}" /verify-restore.sh "${BACKUP_DIR}"; then
        mark_success restore_check
    else
        echo "The restore check failed" >&2
    fi
}

httpd -f -p 9100 -h "${METRICS_DIR}" -c /etc/httpd.conf &

write_metrics

while true; do
    if backup_database; then
        if offsite_enabled; then
            copy_offsite || echo "Copy to ${RESTIC_REPOSITORY} failed" >&2
        else
            backup_media_locally
        fi
        if verify_is_due; then
            verify_latest_restore
        fi
    fi
    find "${BACKUP_DIR}" \( -name 'overlab-*.sql.gz' -o -name 'overlab-*.sql.gz.counts' -o -name 'overlab-media-*.tar.gz' \) -mtime "+${KEEP_DAYS}" -delete
    write_metrics
    if [ "${BACKUP_RUN_ONCE:-}" = "1" ]; then
        exit 0
    fi
    sleep "${INTERVAL_SECONDS}"
done
