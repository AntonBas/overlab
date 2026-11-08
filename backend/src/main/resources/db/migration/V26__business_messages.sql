ALTER TABLE site_feedback DROP CONSTRAINT ck_site_feedback_type;
ALTER TABLE site_feedback ADD CONSTRAINT ck_site_feedback_type
    CHECK (type IN ('INACCURACY', 'BUG', 'TYPO', 'OTHER', 'BUSINESS'));

ALTER TABLE site_feedback ADD COLUMN contact_name VARCHAR(100);
ALTER TABLE site_feedback ADD COLUMN contact_email VARCHAR(255);
