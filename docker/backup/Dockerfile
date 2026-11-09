FROM postgres:16-alpine
RUN apk add --no-cache rclone
COPY backup.sh /backup.sh
HEALTHCHECK --interval=1h --timeout=10s --start-period=2h --retries=1 \
    CMD find /backups -name 'overlab-*.sql.gz' -mmin -$(( ${BACKUP_INTERVAL_SECONDS:-86400} / 60 * 2 )) | grep -q . || exit 1
ENTRYPOINT ["/backup.sh"]
