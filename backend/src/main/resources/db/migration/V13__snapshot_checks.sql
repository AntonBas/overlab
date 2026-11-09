CREATE TABLE snapshot_checks (
    id BIGSERIAL PRIMARY KEY,
    queue VARCHAR(16) NOT NULL,
    platform VARCHAR(16) NOT NULL,
    region VARCHAR(16) NOT NULL,
    tier VARCHAR(16) NOT NULL,
    map_key VARCHAR(64) NOT NULL,
    etag VARCHAR(255),
    signature VARCHAR(64) NOT NULL,
    last_checked_at TIMESTAMPTZ NOT NULL,
    last_changed_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uq_snapshot_checks_combination UNIQUE (queue, platform, region, tier, map_key)
);
