DROP TABLE relation_reports;

CREATE TABLE site_feedback (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(16) NOT NULL,
    message TEXT NOT NULL,
    page_path VARCHAR(255),
    user_id BIGINT REFERENCES users (id) ON DELETE SET NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'NEW',
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_site_feedback_type CHECK (type IN ('INACCURACY', 'BUG', 'TYPO', 'OTHER')),
    CONSTRAINT ck_site_feedback_status CHECK (status IN ('NEW', 'RESOLVED', 'DISMISSED'))
);

CREATE INDEX ix_site_feedback_status_created ON site_feedback (status, created_at DESC);
CREATE INDEX ix_site_feedback_user ON site_feedback (user_id, status);
