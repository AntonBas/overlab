UPDATE users SET google_subject = provider_id WHERE provider = 'GOOGLE' AND google_subject IS NULL;

ALTER TABLE users DROP CONSTRAINT uq_users_provider;
ALTER TABLE users DROP COLUMN provider_id;
