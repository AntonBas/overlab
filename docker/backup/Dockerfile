FROM postgres:16-alpine
RUN apk add --no-cache rclone
COPY backup.sh /backup.sh
ENTRYPOINT ["/backup.sh"]
