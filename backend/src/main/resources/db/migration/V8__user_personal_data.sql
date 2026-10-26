CREATE TABLE user_favorites (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    hero_id BIGINT REFERENCES heroes (id) ON DELETE CASCADE,
    map_id BIGINT REFERENCES maps (id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_user_favorites_one_target CHECK ((hero_id IS NULL) <> (map_id IS NULL))
);

CREATE UNIQUE INDEX uq_user_favorites_hero ON user_favorites (user_id, hero_id) WHERE hero_id IS NOT NULL;
CREATE UNIQUE INDEX uq_user_favorites_map ON user_favorites (user_id, map_id) WHERE map_id IS NOT NULL;

CREATE TABLE user_notes (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    hero_id BIGINT NOT NULL REFERENCES heroes (id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_notes_user_hero UNIQUE (user_id, hero_id)
);

CREATE TABLE user_preferences (
    user_id BIGINT PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    queue VARCHAR(16),
    platform VARCHAR(16),
    region VARCHAR(16),
    tier VARCHAR(16),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
