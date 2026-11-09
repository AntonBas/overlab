ALTER TABLE users ADD COLUMN google_subject VARCHAR(255);

UPDATE users SET google_subject = provider_id WHERE provider = 'GOOGLE';

CREATE UNIQUE INDEX uq_users_google_subject ON users (google_subject) WHERE google_subject IS NOT NULL;
