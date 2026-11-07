CREATE TABLE relation_votes (
    id BIGSERIAL PRIMARY KEY,
    relation_id BIGINT NOT NULL REFERENCES hero_relations (id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    value VARCHAR(8) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_relation_votes_relation_user UNIQUE (relation_id, user_id),
    CONSTRAINT ck_relation_votes_value CHECK (value IN ('UP', 'DOWN'))
);

CREATE INDEX ix_relation_votes_user ON relation_votes (user_id);

CREATE TABLE relation_reports (
    id BIGSERIAL PRIMARY KEY,
    relation_id BIGINT NOT NULL REFERENCES hero_relations (id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'NEW',
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_relation_reports_status CHECK (status IN ('NEW', 'ACCEPTED', 'REJECTED'))
);

CREATE INDEX ix_relation_reports_status_created ON relation_reports (status, created_at DESC);
CREATE INDEX ix_relation_reports_user ON relation_reports (user_id, status);
CREATE INDEX ix_relation_reports_relation ON relation_reports (relation_id);
