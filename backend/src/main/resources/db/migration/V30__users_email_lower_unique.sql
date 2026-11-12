CREATE UNIQUE INDEX uq_users_email_lower ON users (lower(email));
