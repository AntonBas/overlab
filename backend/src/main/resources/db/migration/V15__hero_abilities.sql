CREATE TABLE hero_abilities (
    id BIGSERIAL PRIMARY KEY,
    hero_id BIGINT NOT NULL REFERENCES heroes (id) ON DELETE CASCADE,
    slug VARCHAR(64) NOT NULL,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    icon_url VARCHAR(512),
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_hero_abilities UNIQUE (hero_id, slug)
);
