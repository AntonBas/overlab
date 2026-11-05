CREATE TABLE hero_categories (
    id BIGSERIAL PRIMARY KEY,
    slug VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE hero_category_members (
    category_id BIGINT NOT NULL REFERENCES hero_categories (id) ON DELETE CASCADE,
    hero_id BIGINT NOT NULL REFERENCES heroes (id) ON DELETE CASCADE,
    PRIMARY KEY (category_id, hero_id)
);

CREATE INDEX idx_hero_category_members_hero ON hero_category_members (hero_id);

CREATE TABLE hero_category_relations (
    id BIGSERIAL PRIMARY KEY,
    hero_id BIGINT NOT NULL REFERENCES heroes (id) ON DELETE CASCADE,
    category_id BIGINT NOT NULL REFERENCES hero_categories (id) ON DELETE CASCADE,
    type VARCHAR(16) NOT NULL,
    strength SMALLINT NOT NULL DEFAULT 1 CHECK (strength BETWEEN 1 AND 3),
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_hero_category_relations UNIQUE (hero_id, category_id)
);
