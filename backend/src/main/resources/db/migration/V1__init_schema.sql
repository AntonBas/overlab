CREATE TABLE heroes (
    id BIGSERIAL PRIMARY KEY,
    slug VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(128) NOT NULL,
    role VARCHAR(16) NOT NULL,
    subrole VARCHAR(32),
    portrait_url VARCHAR(512),
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE maps (
    id BIGSERIAL PRIMARY KEY,
    slug VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(128) NOT NULL,
    mode VARCHAR(16),
    image_url VARCHAR(512),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE patches (
    id BIGSERIAL PRIMARY KEY,
    version VARCHAR(64) NOT NULL UNIQUE,
    title VARCHAR(128),
    released_at TIMESTAMPTZ NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE perks (
    id BIGSERIAL PRIMARY KEY,
    hero_id BIGINT NOT NULL REFERENCES heroes (id) ON DELETE CASCADE,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    slot VARCHAR(16) NOT NULL,
    recommendation VARCHAR(16) NOT NULL,
    recommendation_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_perks_hero_name UNIQUE (hero_id, name)
);

CREATE TABLE hero_relations (
    id BIGSERIAL PRIMARY KEY,
    hero_id BIGINT NOT NULL REFERENCES heroes (id) ON DELETE CASCADE,
    related_hero_id BIGINT NOT NULL REFERENCES heroes (id) ON DELETE CASCADE,
    type VARCHAR(16) NOT NULL,
    strength SMALLINT NOT NULL DEFAULT 1 CHECK (strength BETWEEN 1 AND 3),
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_hero_relations UNIQUE (hero_id, related_hero_id, type),
    CONSTRAINT ck_hero_relations_distinct CHECK (hero_id <> related_hero_id)
);

CREATE INDEX idx_hero_relations_related ON hero_relations (related_hero_id, type);

CREATE TABLE guides (
    id BIGSERIAL PRIMARY KEY,
    hero_id BIGINT NOT NULL REFERENCES heroes (id) ON DELETE CASCADE,
    map_id BIGINT REFERENCES maps (id) ON DELETE RESTRICT,
    title VARCHAR(256) NOT NULL,
    youtube_id VARCHAR(32) NOT NULL,
    start_seconds INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_guides_hero_map ON guides (hero_id, map_id);

CREATE TABLE hero_stats (
    id BIGSERIAL PRIMARY KEY,
    hero_id BIGINT NOT NULL REFERENCES heroes (id),
    map_id BIGINT REFERENCES maps (id),
    queue VARCHAR(16) NOT NULL,
    game_format VARCHAR(16) NOT NULL,
    platform VARCHAR(16) NOT NULL,
    region VARCHAR(16) NOT NULL,
    tier VARCHAR(16) NOT NULL,
    win_rate NUMERIC(5, 2) NOT NULL,
    pick_rate NUMERIC(5, 2) NOT NULL,
    ban_rate NUMERIC(5, 2),
    captured_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uq_hero_stats_snapshot
        UNIQUE NULLS NOT DISTINCT (hero_id, map_id, queue, game_format, platform, region, tier, captured_at)
);

CREATE INDEX idx_hero_stats_filters
    ON hero_stats (queue, game_format, platform, region, tier, map_id, captured_at DESC);

CREATE INDEX idx_hero_stats_hero_captured
    ON hero_stats (hero_id, captured_at DESC);

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    display_name VARCHAR(64) NOT NULL,
    role VARCHAR(16) NOT NULL DEFAULT 'USER',
    provider VARCHAR(16) NOT NULL DEFAULT 'LOCAL',
    provider_id VARCHAR(255),
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_users_provider UNIQUE (provider, provider_id)
);

CREATE TABLE audit_log (
    id BIGSERIAL PRIMARY KEY,
    occurred_at TIMESTAMPTZ NOT NULL,
    actor_id BIGINT,
    actor_role VARCHAR(16),
    action VARCHAR(32) NOT NULL,
    entity_type VARCHAR(64) NOT NULL,
    entity_id VARCHAR(64),
    changes JSONB,
    ip_address VARCHAR(64)
);

CREATE INDEX idx_audit_log_occurred ON audit_log (occurred_at DESC);
CREATE INDEX idx_audit_log_entity ON audit_log (entity_type, entity_id);
CREATE INDEX idx_audit_log_actor ON audit_log (actor_id);
