FROM postgres:16-alpine@sha256:81e77a4833487b8132fe4b00bedd39dc3f74b8641e387f19312a48f7de218c2e
RUN apk add --no-cache restic rclone busybox-extras
COPY httpd.conf /etc/httpd.conf
COPY backup.sh /backup.sh
COPY verify-restore.sh /verify-restore.sh
EXPOSE 9100
HEALTHCHECK --interval=1h --timeout=10s --start-period=2h --retries=1 \
    CMD window=$(( ${BACKUP_INTERVAL_SECONDS:-86400} / 60 * 2 )); find /backups -maxdepth 1 -name 'overlab-*.sql.gz' -mmin -$window | grep -q . \
        && { [ -z "${RESTIC_REPOSITORY:-}" ] || find /backups/.state/offsite -mmin -$window 2>/dev/null | grep -q .; } || exit 1
ENTRYPOINT ["/backup.sh"]
