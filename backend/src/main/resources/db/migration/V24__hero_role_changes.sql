CREATE TABLE hero_role_changes (
    id BIGSERIAL PRIMARY KEY,
    hero_id BIGINT NOT NULL REFERENCES heroes (id) ON DELETE CASCADE,
    changed_at TIMESTAMPTZ NOT NULL,
    previous_role VARCHAR(16) NOT NULL,
    new_role VARCHAR(16) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_hero_role_changes_changed_at ON hero_role_changes (changed_at);
