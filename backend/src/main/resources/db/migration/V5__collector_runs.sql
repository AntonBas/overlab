CREATE TABLE collector_runs (
    id BIGSERIAL PRIMARY KEY,
    job_name VARCHAR(64) NOT NULL,
    trigger_type VARCHAR(16) NOT NULL,
    status VARCHAR(16) NOT NULL,
    started_at TIMESTAMPTZ NOT NULL,
    finished_at TIMESTAMPTZ,
    requests_total INTEGER NOT NULL DEFAULT 0,
    requests_failed INTEGER NOT NULL DEFAULT 0,
    rows_saved INTEGER NOT NULL DEFAULT 0,
    error_summary TEXT
);

CREATE INDEX idx_collector_runs_job_started ON collector_runs (job_name, started_at DESC);
